// ------------------------------------------------------------------------------
// This file is part of netvote.
//
// netvote is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// netvote is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with solidity.  If not, see <http://www.gnu.org/licenses/>
//
// (c) 2017 netvote contributors.
//------------------------------------------------------------------------------

let Election = artifacts.require("Election");
let Ballot = artifacts.require("Ballot");
let RegistrationPool = artifacts.require("RegistrationPool");
let VoteAllowance = artifacts.require("VoteAllowance");

const protobuf = require("protobufjs");
const crypto2 = require('crypto2');


if(!web3.eth.defaultAccount){
    web3.eth.defaultAccount = web3.eth.accounts[0];
}

let log = (msg) => {
    console.log(msg);
};

let getVotesByGroup = async (ballot, group) => {
    let poolCount = await ballot.groupPoolCount(group);
    let votes = [];
    for(let i=0; i<poolCount; i++){
        let p = await ballot.getGroupPool(group, i);
        let voterCount = await ballot.getPoolVoterCount(p);
        for(let j=0; j<voterCount;j++){
            let v = await ballot.getPoolVoter(p, j);
            let vt = await RegistrationPool.at(p).getVote(v);
            votes.push(vt);
        }
    }
    votes.sort();
    return votes;
};

let setupConfig = async(config) => {
    log("ELECTION:")

    let va = await VoteAllowance.new({from: config.netvote});
    await va.addVotes(config.account.owner, config.account.allowance, {from: config.netvote});
    config.contract = await Election.new(va.address, config.account.owner, config.allowUpdates, {from: config.admin });
    await va.addElection(config.contract.address, {from: config.account.owner});

    // SETUP BALLOTS
    for (let name in config.ballots) {
        if (config.ballots.hasOwnProperty(name)) {
            let ballotConfig = config.ballots[name];
            let admin = ballotConfig.admin;
            let ballot = await Ballot.new(config.contract.address, admin, ballotConfig.metadata, {from: config.admin});
            for(let i=0; i<ballotConfig.groups.length; i++){
                await ballot.addGroup(ballotConfig.groups[i], {from: admin});
            }
            config.ballots[name].contract = ballot;
        }
    }

    // SETUP POOLS
    for (let name in config.pools) {
        if (config.pools.hasOwnProperty(name)) {
            let poolConfig = config.pools[name];
            let admin = poolConfig.admin;
            let pool = await RegistrationPool.new(config.contract.address, config.registrar, {from: admin});
            config.pools[name].contract = pool;

            for(let i=0; i<poolConfig.ballots.length; i++) {
                let ballot = config.ballots[poolConfig.ballots[i]];
                await pool.addBallot(ballot.contract.address, {from: admin});
                await ballot.contract.addPool(pool.address, {from: ballot.admin});
                await config.contract.addPool(pool.address, {from: config.admin});

                for(let g=0; g<poolConfig.groups.length; g++) {

                    let group = poolConfig.groups[g];
                    for(let j=0; j<ballot.groups.length; j++){
                        if(ballot.groups[j] === group) {
                            await ballot.contract.addPoolToGroup(pool.address, group, {from: ballot.admin});
                            break;
                        }
                    }
                }
            }
        }
    }

    //ACTIVATE
    config.contract.activate({from: config.admin});
    for (let name in config.ballots) {
        if (config.ballots.hasOwnProperty(name)) {
            let ballot = config.ballots[name];
            await ballot.contract.activate({from: ballot.admin});
        }
    }
    for (let name in config.pools) {
        if (config.pools.hasOwnProperty(name)) {
            let pool = config.pools[name];
            await pool.contract.activate({from: pool.admin});
        }
    }

    // VOTE
    for (let name in config.voters) {
        if (config.voters.hasOwnProperty(name)) {
            let voter = config.voters[name];
            let pool = config.pools[voter.pool].contract;
            await pool.register(voter.address, {from: config.registrar});
            let vt = await pool.castVote(voter.vote, {from: voter.address});
            console.log("VOTE="+vt.tx);
        }
    }

    // CLOSE
    for (let name in config.pools) {
        if (config.pools.hasOwnProperty(name)) {
            let pool = config.pools[name];
            await pool.contract.close({from: pool.admin});
        }
    }
    for (let name in config.ballots) {
        if (config.ballots.hasOwnProperty(name)) {
            let ballot = config.ballots[name];
            await ballot.contract.close({from: ballot.admin});
        }
    }
    await config.contract.close({from: config.admin});
    await config.contract.setPrivateKey("private key", {from: config.admin});

    return config;
};


const encrypt = async (str) => {
    console.log("encrypting "+str);
    return new Promise((resolve, reject) => {
        crypto2.readPublicKey('scripts/key.pub', (err, pubKey) => {
            if(err){
                console.error("error loading key: "+err);
                reject(err);
                return
            }
            crypto2.encrypt.rsa(str, pubKey, (err, encrypted) => {
                if(err){
                    console.error("error encrypting: "+err);
                    reject(err);
                    return
                }
                resolve(encrypted);
            })
        });
    });
};

module.exports = async function(callback) {

    let root = await protobuf.load("scripts/vote.proto");
    let Vote = root.lookupType("netvote.Vote");

    let payload = {
        encryptionSeed: "123e4567-e89b-12d3-a456-426655440000",
        vote: {
            "0x627306090abab3a6e1400e9345bc60c78a8bef57": {
                type: 1,
                choice: {
                    value: 2
                }
            },
            "0x627306090abab3a6e1400e9345bc60c78a8bef51": {
                type: 1,
                choice: {
                    value: 2
                }
            },
            "0x627306090abab3a6e1400e9345bc60c78a8bef52": {
                type: 1,
                choice: {
                    value: 2
                }
            }
        }
    };

    let errMsg = Vote.verify(payload);
    if (errMsg) {
        console.error("invalid:"+errMsg);
        callback(errMsg);
    }

    let vote = Vote.create(payload);
    let encodedVote = Vote.encode(vote).finish();
    let encryptedStr = await encrypt(encodedVote);

    console.log(JSON.stringify({
        payload: JSON.stringify(payload),
        encrypted: encryptedStr
    },null,"\t"));

    let cfg = {
        account: {
            allowance: 2,
            owner: web3.eth.defaultAccount
        },
        netvote: web3.eth.defaultAccount,
        admin: web3.eth.defaultAccount,
        allowUpdates: false,
        registrar: web3.eth.defaultAccount,
        ballots: {
            ballot1: {
                admin: web3.eth.defaultAccount,
                metadata: "ipfs1",
                groups: ["D5","D6","NY"]
            },
            ballot2: {
                admin: web3.eth.defaultAccount,
                metadata: "ipfs2",
                groups: ["D5"]
            },
            ballot3: {
                admin: web3.eth.defaultAccount,
                metadata: "ipfs3",
                groups: ["D6"]
            }
        },
        pools: {
            pool1: {
                admin: web3.eth.defaultAccount,
                groups: ["D5", "D6", "NY"],
                ballots: ["ballot1","ballot2"]
            },
            pool2: {
                admin: web3.eth.defaultAccount,
                groups: ["D5", "D6", "NY"],
                ballots: ["ballot1","ballot2","ballot3"]
            }
        },
        voters: {
            voter1: {
                pool: "pool1",
                address: web3.eth.defaultAccount,
                vote: encryptedStr
            }
        }
    };

    let c = await setupConfig(cfg);
    printConfig(c);
    callback();

};

let printConfig = (cfg) => {
    let output = {
        election: cfg.contract.address,
        pools: {},
        ballots: {},
        voters: {}
    };

    for (let name in cfg.pools) {
        if (cfg.pools.hasOwnProperty(name)) {
            output.pools[name] = {
                address: cfg.pools[name].contract.address,
                groups: cfg.pools[name].groups,
                ballots: cfg.pools[name].ballots
            }
        }
    }

    for (let name in cfg.ballots) {
        if (cfg.ballots.hasOwnProperty(name)) {
            output.ballots[name] = {
                address: cfg.ballots[name].contract.address,
                groups: cfg.ballots[name].groups
            }
        }
    }

    output.voters = cfg.voters;

    log(JSON.stringify(output, null, '\t'));
};
