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
const protobuf = require("protobufjs");
const crypto = require('crypto');
let TieredElection = artifacts.require("TieredElection");
let TieredBallot = artifacts.require("TieredBallot");
let TieredPool = artifacts.require("TieredPool");
let VoteAllowance = artifacts.require("VoteAllowance");
const ENCRYPT_ALGORITHM = "aes-256-cbc";
const ENCRYPT_KEY = "123e4567e89b12d3a456426655440000";

// for debugging
let log = (msg) => {
    //console.log(msg);
};

let logObj = (name, obj) => {
    console.log(name+": \n"+JSON.stringify(obj,null,"\t"));
};

let randomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return parseInt(Math.floor(Math.random() * (max - min)) + min);
};

function encrypt(text) {
    let cipher = crypto.createCipher(ENCRYPT_ALGORITHM, ENCRYPT_KEY);
    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");
    return encrypted;
}

const toEncodedVote = async (payload) => {
    let root = await protobuf.load("protocol/vote.proto");
    let Vote = root.lookupType("netvote.Vote");
    let errMsg = Vote.verify(payload);
    if (errMsg) {
        console.error("invalid:"+errMsg);
        throw Error(errMsg);
    }

    let vote = Vote.create(payload);
    return Vote.encode(vote).finish();
};

const encode = (buff, enc)=>{
    return buff.toString(enc);
};

const toEncryptedVote = async (payload) => {
    let encodedVote = await toEncodedVote(payload);
    encode(encodedVote, "utf8");
    encode(encodedVote, "ascii");
    encode(encodedVote, "hex");
    encode(encodedVote, "base64");
    return encrypt(encodedVote);
};

let generateEncryptedVote = async (voteConfig) => {
    let ballotCount = voteConfig.ballotCount;
    let optionsPerBallot = voteConfig.optionsPerBallot;
    let writeInCount = voteConfig.writeInCount;

    let seed = randomInt(0, 2000000);
    let vote = {
        encryptionSeed: seed,
        ballotVotes: []
    };
    for(let i=0; i<ballotCount; i++){
        let ballotVote = {
            choices: []
        };
        for(let j=0; j<optionsPerBallot; j++){
            if(writeInCount > 0){
                writeInCount--;
                ballotVote.choices.push({
                    writeIn: "Write-In Value"
                });
            }else {
                ballotVote.choices.push({
                    selection: randomInt(0, 5)
                });
            }
        }
        vote.ballotVotes.push(ballotVote);
    }
    return await toEncryptedVote(vote);
};

let measureGas = async(config, name) => {
    if(!config["gasAmount"]){
        config["gasAmount"] = {};
    }
    let lastBlock = await web3.eth.getBlock("latest");
    config["gasAmount"][name] = lastBlock.gasUsed;
    return config
};

let getVotesByGroup = async (ballot, group) => {
    let poolCount = await ballot.groupPoolCount(group);
    let votes = [];
    for(let i=0; i<poolCount; i++){
        let p = await ballot.getGroupPool(group, i);
        let voterCount = await ballot.getPoolVoterCount(p);
        for(let j=0; j<voterCount;j++){
            let v = await ballot.getPoolVoter(p, j);
            let vt = await TieredPool.at(p).votes(v);
            votes.push(vt);
        }
    }
    votes.sort();
    return votes;
};

// 1
let createElection = async(config) => {
    log("create election");
    let va = await VoteAllowance.new({from: config.netvote});
    await va.addVotes(config.account.owner, config.account.allowance, {from: config.netvote});
    config.contract = await TieredElection.new(va.address, config.account.owner, config.allowUpdates, config.netvote, {from: config.admin });
    config = await measureGas(config, "Create Tiered Election");
    await va.addElection(config.contract.address, {from: config.account.owner});
    config = await measureGas(config, "Authorize Election for Allowance");
    return config;
};

// 2 - assumes election created
let createBallots = async(config) => {
    log("create ballots");
    for (let name in config.ballots) {
        if (config.ballots.hasOwnProperty(name)) {
            let ballotConfig = config.ballots[name];
            let admin = ballotConfig.admin;
            let ballot = await TieredBallot.new(config.contract.address, admin, ballotConfig.metadata, {from: config.admin});
            config = await measureGas(config, "Create Tiered Ballot");
            await config.contract.addBallot(ballot.address, {from: config.admin});
            config = await measureGas(config, "Add Tiered Ballot to Election");
            for(let i=0; i<ballotConfig.groups.length; i++){
                await ballot.addGroup(web3.fromAscii(ballotConfig.groups[i]), {from: admin});
                config = await measureGas(config, "Add Group to Tiered Ballot");
            }
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
            let admin = poolConfig.admin;
            let pool = await TieredPool.new(config.contract.address, config.gateway, {from: admin});
            config = await measureGas(config, "Create Tiered Pool");
            config.pools[name].contract = pool;

            for(let i=0; i<poolConfig.ballots.length; i++) {
                let ballot = config.ballots[poolConfig.ballots[i]];
                await pool.addBallot(ballot.contract.address, {from: admin});
                config = await measureGas(config, "Add Tiered Ballot to Tiered Pool");
                await ballot.contract.addPool(pool.address, {from: ballot.admin});
                config = await measureGas(config, "Add Tiered Pool to Tiered Ballot");
                await config.contract.addPool(pool.address, {from: config.admin});
                config = await measureGas(config, "Add Tiered Pool to Election");
                for(let g=0; g<poolConfig.groups.length; g++) {
                    let group = poolConfig.groups[g];
                    for(let j=0; j<ballot.groups.length; j++){
                        if(ballot.groups[j] === group) {
                            await ballot.contract.addPoolToGroup(pool.address, web3.fromAscii(group), {from: ballot.admin});
                            config = await measureGas(config, "Add Tiered Pool to Ballot Group");
                            break;
                        }
                    }
                }
            }
        }
    }
    return config;
};

let activateElection = async(config) => {
    log("activating election");
    await config.contract.activate({from: config.admin});
    config = await measureGas(config, "Activate Election");
    return config;
};

let activateBallots = async(config) => {
    log("activating ballots");
    for (let name in config.ballots) {
        if (config.ballots.hasOwnProperty(name)) {
            let ballot = config.ballots[name];
            await ballot.contract.activate({from: ballot.admin});
            config = await measureGas(config, "Activate Ballot");
        }
    }
    return config;
};

let activatePools = async(config) => {
    log("activating pools");
    for (let name in config.pools) {
        if (config.pools.hasOwnProperty(name)) {
            let pool = config.pools[name];
            await pool.contract.activate({from: pool.admin});
            config = await measureGas(config, "Activate Pool");
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
            await pool.castVote(voter.address+"", voter.vote, {from: config.gateway});
            config = await measureGas(config, "Cast Vote");
        }
    }
    return config;
};

let closePools = async(config) => {
    for (let name in config.pools) {
        if (config.pools.hasOwnProperty(name)) {
            let pool = config.pools[name];
            await pool.contract.close({from: pool.admin});
            config = await measureGas(config, "Close Pool");
        }
    }
    return config;
};

let closeBallots = async(config) => {
    for (let name in config.ballots) {
        if (config.ballots.hasOwnProperty(name)) {
            let ballot = config.ballots[name];
            await ballot.contract.close({from: ballot.admin});
            config = await measureGas(config, "Close Ballot");
        }
    }
    return config;
};

let closeElection = async(config) => {
    await config.contract.close({from: config.admin});
    config = await measureGas(config, "Close Election");
    return config;
};

let doTransactions = async(transactions, config) => {
    for(let tx of transactions) {
        config = await tx(config);
    }
    return config;
};

let printGas = (config) => {
    logObj("Gas Amounts", config["gasAmount"]);
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
        closeElection
    ], config);
};

const assertVote = (actual, expected) => {
    assert.equal(actual, expected);
};

contract('Tiered Election: Configuration TX', function (accounts) {
    let config;

    beforeEach(async ()=> {
        config = {
            account: {
                allowance: 2,
                owner: accounts[7]
            },
            netvote: accounts[0],
            admin: accounts[1],
            allowUpdates: false,
            gateway: accounts[8],
            ballots: {
                ballot1: {
                    admin: accounts[2],
                    metadata: "ipfs1",
                    groups: ["D5","D6","NY"]
                },
                ballot2: {
                    admin: accounts[3],
                    metadata: "ipfs2",
                    groups: ["D5"]
                },
                ballot3: {
                    admin: accounts[3],
                    metadata: "ipfs3",
                    groups: ["D6"]
                }
            },
            pools: {
                pool1: {
                    admin: accounts[4],
                    groups: ["D5", "NY"],
                    ballots: ["ballot2", "ballot1"]
                },
                pool2: {
                    admin: accounts[5],
                    groups: ["D6", "NY"],
                    ballots: ["ballot3", "ballot1"]
                }
            }
        };

        await doTransactions([
            createElection,
            createBallots,
            createPools
        ], config);
    });

    it("should have correct ballots assigned", async function() {
        let count = await config.contract.getBallotCount();
        assert.equal(count, 3);
    });

    // for ballots abc, remove a
    it("should remove first ballot", async function() {
        await config.contract.removeBallot(config.ballots["ballot1"].contract.address, {from: config.admin});
        let count = await config.contract.getBallotCount();
        assert.equal(count, 2);

        let address1 = await config.contract.getBallot(0);
        let address2 = await config.contract.getBallot(1);

        // last entry moved to front
        assert.equal(config.ballots["ballot3"].contract.address, address1);
        assert.equal(config.ballots["ballot2"].contract.address, address2);
    });

    // for ballots abc, remove b
    it("should remove second ballot", async function() {
        await config.contract.removeBallot(config.ballots["ballot2"].contract.address, {from: config.admin});
        let count = await config.contract.getBallotCount();
        assert.equal(count, 2);

        let address1 = await config.contract.getBallot(0);
        let address2 = await config.contract.getBallot(1);

        assert.equal(config.ballots["ballot1"].contract.address, address1);
        assert.equal(config.ballots["ballot3"].contract.address, address2);
    });

    // for ballots abc, remove c
    it("should remove third ballot", async function() {
        await config.contract.removeBallot(config.ballots["ballot3"].contract.address, {from: config.admin});
        let count = await config.contract.getBallotCount();
        assert.equal(count, 2);

        let address1 = await config.contract.getBallot(0);
        let address2 = await config.contract.getBallot(1);

        assert.equal(config.ballots["ballot1"].contract.address, address1);
        assert.equal(config.ballots["ballot2"].contract.address, address2);
    });
});

contract('Tiered Election: 1 Pool, 1 Voter, 1 Ballot', function (accounts) {
    let config;

    before(async () => {
        config = await doEndToEndElection( {
            account: {
                allowance: 1,
                owner: accounts[7]
            },
            netvote: accounts[0],
            admin: accounts[1],
            allowUpdates: false,
            gateway: accounts[8],
            ballots: {
                ballot1: {
                    admin: accounts[2],
                    metadata: "ipfs1",
                    groups: ["US"]
                }
            },
            pools: {
                pool1: {
                    admin: accounts[3],
                    groups: ["US"],
                    ballots: ["ballot1"]
                }
            },
            voters: {
                voter1: {
                    pool: "pool1",
                    address: accounts[6],
                    vote: "encrypted-vote-1"
                }
            }
        });
    });

    it("should get 1 US vote for ballot1", async function() {
        let ballot = config.ballots.ballot1.contract;
        let votes = await getVotesByGroup(ballot, "US");
        assert.equal(votes.length, 1);
        assertVote(votes[0], config.voters.voter1.vote);
    });

    it("should get 1 ALL vote for ballot1", async function() {
        let ballot = config.ballots.ballot1.contract;
        let votes = await getVotesByGroup(ballot, "ALL");
        assert.equal(votes.length, 1);
        assertVote(votes[0], config.voters.voter1.vote);
    });

});

contract('Tiered Election: 2 Pools, 2 Voters, 1 Shared Ballot, 1 Different Ballot', function (accounts) {
    let config;

    before(async () => {
        config = await doEndToEndElection( {
            account: {
                allowance: 2,
                owner: accounts[7]
            },
            netvote: accounts[0],
            admin: accounts[1],
            allowUpdates: false,
            gateway: accounts[8],
            ballots: {
                ballot1: {
                    admin: accounts[2],
                    metadata: "ipfs1",
                    groups: ["D5","D6","NY"]
                },
                ballot2: {
                    admin: accounts[3],
                    metadata: "ipfs2",
                    groups: ["D5"]
                },
                ballot3: {
                    admin: accounts[3],
                    metadata: "ipfs3",
                    groups: ["D6"]
                }
            },
            pools: {
                pool1: {
                    admin: accounts[4],
                    groups: ["D5", "NY"],
                    ballots: ["ballot2", "ballot1"]
                },
                pool2: {
                    admin: accounts[5],
                    groups: ["D6", "NY"],
                    ballots: ["ballot3", "ballot1"]
                }
            },
            voters: {
                voter1: {
                    pool: "pool1",
                    address: accounts[6],
                    vote: "encrypted-vote-1"
                },
                voter2: {
                    pool: "pool2",
                    address: accounts[7],
                    vote: "encrypted-vote-2"
                }
            }
        });
    });

    it("should get 2 ALL votes for ballot1", async function() {
        let ballot = config.ballots.ballot1.contract;
        let votes = await getVotesByGroup(ballot, "ALL");
        assert.equal(votes.length, 2);
        assertVote(votes[0], config.voters.voter1.vote);
        assertVote(votes[1], config.voters.voter2.vote);
    });

    it("should get 2 NY votes for ballot1", async function() {
        let ballot = config.ballots.ballot1.contract;
        let votes = await getVotesByGroup(ballot, "NY");
        assert.equal(votes.length, 2);
        assertVote(votes[0], config.voters.voter1.vote);
        assertVote(votes[1], config.voters.voter2.vote);
    });

    it("should get 1 D5 votes for ballot1", async function() {
        let ballot = config.ballots.ballot1.contract;
        let votes = await getVotesByGroup(ballot, "D5");
        assert.equal(votes.length, 1);
        assertVote(votes[0], config.voters.voter1.vote);
    });

    it("should get 1 D6 votes for ballot1", async function() {
        let ballot = config.ballots.ballot1.contract;
        let votes = await getVotesByGroup(ballot, "D6");
        assert.equal(votes.length, 1);
        assertVote(votes[0], config.voters.voter2.vote);
    });

    it("should get 1 D5 votes for ballot2", async function() {
        let ballot = config.ballots.ballot2.contract;
        let votes = await getVotesByGroup(ballot, "D5");
        assert.equal(votes.length, 1);
        assertVote(votes[0], config.voters.voter1.vote);
    });

    it("should get 1 D6 votes for ballot3", async function() {
        let ballot = config.ballots.ballot3.contract;
        let votes = await getVotesByGroup(ballot, "D6");
        assert.equal(votes.length, 1);
        assertVote(votes[0], config.voters.voter2.vote);
    });
});

contract('2 Pools, 2 Voters, 2 Shared Ballots', function (accounts) {

    let config;

    before(async () => {
        config = await doEndToEndElection( {
                account: {
                    allowance: 2,
                    owner: accounts[7]
                },
                netvote: accounts[0],
                admin: accounts[1],
                allowUpdates: false,
                gateway: accounts[8],
                ballots: {
                    ballot1: {
                        admin: accounts[2],
                        metadata: "ipfs1",
                        groups: ["D5", "D6", "NY"]
                    },
                    ballot2: {
                        admin: accounts[3],
                        metadata: "ipfs1",
                        groups: ["D5", "D6", "NY"]
                    }
                },
                pools: {
                    pool1: {
                        admin: accounts[4],
                        groups: ["D5", "NY"],
                        ballots: ["ballot1", "ballot2"]
                    },
                    pool2: {
                        admin: accounts[5],
                        groups: ["D6", "NY"],
                        ballots: ["ballot1", "ballot2"]
                    }
                },
                voters: {
                    voter1: {
                        pool: "pool1",
                        address: accounts[6],
                        vote: "encrypted-vote-1"
                    },
                    voter2: {
                        pool: "pool2",
                        address: accounts[7],
                        vote: "encrypted-vote-2"
                    }
                }
        });

    });

    it("should get 2 ALL votes for ballot1", async function() {
        let ballot = config.ballots.ballot1.contract;
        let votes = await getVotesByGroup(ballot, "ALL");
        assert.equal(votes.length, 2);
        assertVote(votes[0], config.voters.voter1.vote);
        assertVote(votes[1], config.voters.voter2.vote);
    });

    it("should get 2 NY votes for ballot1", async function() {
        let ballot = config.ballots.ballot1.contract;
        let votes = await getVotesByGroup(ballot, "NY");
        assert.equal(votes.length, 2);
        assertVote(votes[0], config.voters.voter1.vote);
        assertVote(votes[1], config.voters.voter2.vote);
    });

    it("should get 2 NY votes for ballot2", async function() {
        let ballot = config.ballots.ballot2.contract;
        let votes = await getVotesByGroup(ballot, "NY");
        assert.equal(votes.length, 2);
        assertVote(votes[0], config.voters.voter1.vote);
        assertVote(votes[1], config.voters.voter2.vote);
    });

    it("should get 1 D5 vote for ballot1", async function() {
        let ballot = config.ballots.ballot1.contract;
        let votes = await getVotesByGroup(ballot, "D5");
        assert.equal(votes.length, 1);
        assertVote(votes[0], config.voters.voter1.vote);
    });

    it("should get 1 D6 vote for ballot1", async function() {
        let ballot = config.ballots.ballot1.contract;
        let votes = await getVotesByGroup(ballot, "D6");
        assert.equal(votes.length, 1);
        assertVote(votes[0], config.voters.voter2.vote);
    });

    it("should get 1 D5 vote for ballot2", async function() {
        let ballot = config.ballots.ballot2.contract;
        let votes = await getVotesByGroup(ballot, "D5");
        assert.equal(votes.length, 1);
        assertVote(votes[0], config.voters.voter1.vote);
    });

    it("should get 1 D6 vote for ballot2", async function() {
        let ballot = config.ballots.ballot2.contract;
        let votes = await getVotesByGroup(ballot, "D6");
        assert.equal(votes.length, 1);
        assertVote(votes[0], config.voters.voter2.vote);
    });
});

contract('Tiered Election GAS Analysis', function (accounts) {
    let threshold = 25000;

    let scenarios = [
        {
            "ballotCount": 1,
            "poolCount": 1,
            "optionsPerBallot": 1,
            "writeInCount": 0,
            "voteGasLimit": 233968
        },
        {
            "ballotCount": 2,
            "poolCount": 1,
            "optionsPerBallot": 20,
            "writeInCount": 0,
            "voteGasLimit": 481431
        },
        {
            "ballotCount": 3,
            "poolCount": 1,
            "optionsPerBallot": 10,
            "writeInCount": 2,
            "voteGasLimit": 532311
        },
        {
            "ballotCount": 3,
            "poolCount": 1,
            "optionsPerBallot": 20,
            "writeInCount": 0,
            "voteGasLimit": 621383
        },
        {
            "ballotCount": 3,
            "poolCount": 1,
            "optionsPerBallot": 20,
            "writeInCount": 2,
            "voteGasLimit": 644147
        }
    ];

    scenarios.forEach(async (scenario)=> {
        it("should use less than "+(threshold+scenario.voteGasLimit)+" gas (ballot="+scenario.ballotCount+", options="+scenario.optionsPerBallot+", writeIns="+scenario.writeInCount+")", async function () {
            let config = {
                account: {
                    allowance: 2,
                    owner: accounts[7]
                },
                netvote: accounts[0],
                admin: accounts[1],
                allowUpdates: false,
                gateway: accounts[8],
                ballots: {},
                pools: {},
                voters: {
                    voter1: {
                        pool: "pool1",
                        address: accounts[6]
                    }
                }
            };

            config.voters.voter1["vote"] = await generateEncryptedVote(scenario);

            let ballots = [];
            for(let i=1; i<=scenario.ballotCount; i++){
                config.ballots["ballot"+i] = {
                    admin: accounts[2],
                    metadata: "ipfs1",
                    groups: []
                };
                ballots.push("ballot"+i)
            }

            for(let i=1; i<=scenario.poolCount; i++){
                config.pools["pool"+i] = {
                    admin: accounts[4],
                    groups: [],
                    ballots: ballots
                }
            }

            config.gasAmount = {};
            config = await doEndToEndElection(config);

            assert.equal(config["gasAmount"]["Cast Vote"] <= (threshold + scenario.voteGasLimit), true, "Vote Gas Limit Exceeded, limit="+scenario.voteGasLimit+", actual="+config["gasAmount"]["Cast Vote"])
        });
    });

});
