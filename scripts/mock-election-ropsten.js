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
    web3.eth.defaultAccount = "0x74ecF4529B8D0FB84dbCF512B6f4cbC0fFADD690";
}

let log = (msg) => {
    console.log(msg);
};

// 1
let createElection = async(config) => {
    log("create election");
    let va = await VoteAllowance.new();
    await va.addVotes(config.account.owner, config.account.allowance);
    config.contract = await Election.new(va.address, config.account.owner, config.allowUpdates);
    console.log("election: "+config.contract.address);
    await va.addElection(config.contract.address);
    return config;
};

// 2 - assumes election created
let createBallots = async(config) => {
    log("create ballots");
    for (let name in config.ballots) {
        if (config.ballots.hasOwnProperty(name)) {
            let ballotConfig = config.ballots[name];
            let admin = ballotConfig.admin;
            let ballot = await Ballot.new(config.contract.address, admin, ballotConfig.metadata);

            console.log("ballot: "+ballot.address);

            await config.contract.addBallot(ballot.address);
            config.ballots[name].contract = ballot;
        }
    }
    return config;
};

// 3 - assumes election and ballots created
let createPools = async(config) => {
    log("create pools");
    for (let name in config.pools) {
        if (config.pools.hasOwnProperty(name)) {
            let poolConfig = config.pools[name];
            let pool = await RegistrationPool.new(config.contract.address, config.registrar);
            config.pools[name].contract = pool;
            console.log("pool: "+pool.address);

            //add to election
            await config.contract.addPool(pool.address);

            for(let i=0; i<poolConfig.ballots.length; i++) {
                let ballot = config.ballots[poolConfig.ballots[i]];
                await pool.addBallot(ballot.contract.address);
                await ballot.contract.addPool(pool.address);
            }
        }
    }
    return config;
};

let activateElection = async(config) => {
    log("activating election");
    await config.contract.activate();
    return config;
};

let activateBallots = async(config) => {
    log("activating ballots");
    for (let name in config.ballots) {
        if (config.ballots.hasOwnProperty(name)) {
            let ballot = config.ballots[name];
            await ballot.contract.activate();
        }
    }
    return config;
};

let activatePools = async(config) => {
    log("activating pools");
    for (let name in config.pools) {
        if (config.pools.hasOwnProperty(name)) {
            let pool = config.pools[name];
            await pool.contract.activate();
        }
    }
    return config;
};

let castVotes = async(config) => {
    log("voting");
    for (let name in config.voters) {
        if (config.voters.hasOwnProperty(name)) {
            let voter = config.voters[name];
            let pool = config.pools[voter.pool].contract;
            await pool.register(voter.address);
            await pool.castVote(voter.vote);
        }
    }
    return config;
};

let closePools = async(config) => {
    log("closing pools");
    for (let name in config.pools) {
        if (config.pools.hasOwnProperty(name)) {
            let pool = config.pools[name];
            await pool.contract.close();
        }
    }
    return config;
};

let closeBallots = async(config) => {
    log("closing ballots");
    for (let name in config.ballots) {
        if (config.ballots.hasOwnProperty(name)) {
            let ballot = config.ballots[name];
            await ballot.contract.close();
        }
    }
    return config;
};

let closeElection = async(config) => {
    log("close election");
    await config.contract.close();
    return config;
};

let releasePrivateKey = async(config) => {
    log("release key");
    return new Promise((resolve, reject) => {
        crypto2.readPrivateKey("scripts/private.pem", async (err, privKey) => {
            if(err){
                console.error("error loading key: "+err);
                reject(err);
                return
            }
            await config.contract.setPrivateKey(privKey);
            resolve(config);
        })
    });
};

let doTransactions = async(transactions, config) => {
    for(let tx of transactions) {
        console.time("tx");
        config = await tx(config);
        console.timeEnd("tx");
    }
    return config;
};

let doEndToEndElection = async(config) => {
    return await doTransactions([
        createElection,
        createBallots,
        createPools,
        activateElection,
        activateBallots,
        activatePools,
        castVotes,
        closePools,
        closeBallots,
        closeElection,
        releasePrivateKey
    ], config);
};

const encrypt = async (str) => {
    return new Promise((resolve, reject) => {
        crypto2.readPublicKey('scripts/public.pem', (err, pubKey) => {
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

const toEncryptedVote = async (payload) => {
    let root = await protobuf.load("scripts/vote.proto");
    let Vote = root.lookupType("netvote.Vote");
    let errMsg = Vote.verify(payload);
    if (errMsg) {
        console.error("invalid:"+errMsg);
        throw Error(errMsg);
    }

    let vote = Vote.create(payload);
    let encodedVote = Vote.encode(vote).finish();
    return await encrypt(encodedVote);
};

module.exports = async function(callback) {

    let encryptedStr1 = await toEncryptedVote({
        encryptionSeed: "123e4567-e89b-12d3-a456-426655440000",
        ballotVotes: [
            {
                choices: [
                    {
                        writeIn: "John Doe"
                    },
                    {
                        selection: 2
                    }
                ]
            }
        ]
    });

    let cfg = {
        account: {
            allowance: 2,
            owner: web3.eth.defaultAccount
        },
        allowUpdates: false,
        registrar: web3.eth.defaultAccount,
        ballots: {
            ballot1: {
                metadata: "ipfs1",
                admin: web3.eth.defaultAccount
            }
        },
        pools: {
            pool1: {
                ballots: ["ballot1"]
            }
        },
        voters: {
            voter1: {
                pool: "pool1",
                vote: encryptedStr1,
                address: web3.eth.defaultAccount
            }
        }
    };

    try {
        let c = await doEndToEndElection(cfg);
        printConfig(c);
        callback();
    }catch(e){
        console.error(e);
        callback(e);
    }
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
                ballots: cfg.pools[name].ballots
            }
        }
    }

    for (let name in cfg.ballots) {
        if (cfg.ballots.hasOwnProperty(name)) {
            output.ballots[name] = {
                address: cfg.ballots[name].contract.address,
            }
        }
    }

    output.voters = cfg.voters;

    log(JSON.stringify(output, null, '\t'));
};
