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
let BasicElection = artifacts.require("BasicElection");
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

let printGas = (config) => {
    logObj("Gas Amounts", config["gasAmount"]);
};

let setupVoteAllowance = async(config) => {
    log("setup vote allowance");
    let va = await VoteAllowance.new({from: config.netvote});
    config.allowanceContract = va;
    await va.addVotes(config.account.owner, config.account.allowance, {from: config.netvote});
    return config;
};

let createBasicElection = async(config) => {
    log("create election");
    config.contract = await BasicElection.new(config.allowanceContract.address, config.account.owner, config.allowUpdates, config.netvote, config.metadata, config.gateway, config.autoActivate, {from: config.admin });
    config = await measureGas(config, "Create Basic Election");
    await config.allowanceContract.addElection(config.contract.address, {from: config.account.owner});
    config = await measureGas(config, "Allowance: authorize election");
    return config;
};

let activateElection = async(config) => {
    log("activating election");
    if(!config.autoActivate) {
        await config.contract.activate({from: config.admin});
        config = await measureGas(config, "Activate Election");
    }
    return config;
};

let castVotes = async(config) => {
    log("voting");
    for (let name in config.voters) {
        if (config.voters.hasOwnProperty(name)) {
            let voter = config.voters[name];
            await config.contract.castVote(voter.voteId, voter.vote, {from: config.gateway});
            config = await measureGas(config, "Cast Vote");
        }
    }
    return config;
};

let closeElection = async(config) => {
    log("closing election");
    await config.contract.close({from: config.admin});
    config = await measureGas(config, "Close Election");
    return config;
};

let releaseKey = async(config) => {
    log("set decryption key");
    await config.contract.setPrivateKey(config.encryptionKey, {from: config.netvote});
    config = await measureGas(config, "Set Decryption Key");
    return config;
};

let doTransactions = async(transactions, config) => {
    for(let tx of transactions) {
        config = await tx(config);
    }
    return config;
};

let doEndToEndElectionAutoActivate = async(config) => {
    return await doTransactions([
        setupVoteAllowance,
        createBasicElection,
        castVotes,
        closeElection,
        releaseKey
    ], config);
};

let doEndToEndElection = async(config) => {
    return await doTransactions([
        setupVoteAllowance,
        createBasicElection,
        activateElection,
        castVotes,
        closeElection,
        releaseKey
    ], config);
};

contract('Unactivated Election', function (accounts) {
    let config;

    before(async () => {
        let basicConfig = {
            account: {
                allowance: 3,
                owner: accounts[0]
            },
            netvote: accounts[1],
            admin: accounts[2],
            allowUpdates: false,
            gateway: accounts[3],
            encryptionKey: "testkey",
            metadata: "ipfs1",
            voters: {
                voter1: {
                    voteId: "vote-id-1",
                    vote: "encrypted-vote-1"
                },
                voter2: {
                    voteId: "vote-id-2",
                    vote: "encrypted-vote-2"
                }
            }
        };

        config = await doTransactions([
            setupVoteAllowance,
            createBasicElection
        ], basicConfig);
    });

    it("should not allow vote", async function () {
        let errorOccured = false;
        try{
            await castVotes(config);
        } catch(e){
            errorOccured = true;
        }
        assert.equal(errorOccured, true, "error was expected")
    });
});

contract('Auto-Activating Basic Election', function (accounts) {

    let config;

    before(async () => {

        config = await doEndToEndElectionAutoActivate({
            account: {
                allowance: 3,
                owner: accounts[0]
            },
            netvote: accounts[1],
            admin: accounts[2],
            allowUpdates: false,
            autoActivate: true,
            gateway: accounts[3],
            encryptionKey: "testkey",
            metadata: "ipfs1",
            voters: {
                voter1: {
                    voteId: "vote-id-1",
                    vote: "encrypted-vote-1"
                },
                voter2: {
                    voteId: "vote-id-2",
                    vote: "encrypted-vote-2"
                }
            }
        });
    });

    it("should have 2 votes", async function () {
        let voteCount = await config.contract.getVoteCount();
        assert.equal(voteCount, 2, "expected 2 votes");
    });

    it("should have both votes present", async function () {
        let vote1 = await config.contract.getVoteAt(0);
        let vote2 = await config.contract.getVoteAt(1);
        let votes = [vote1, vote2].sort();
        assert.equal("encrypted-vote-1", votes[0], "expected first vote");
        assert.equal("encrypted-vote-2", votes[1], "expected second vote");
    });

    it("should be assigned to correct voteId", async function () {
        let vote1 = await config.contract.votes("vote-id-1");
        let vote2 = await config.contract.votes("vote-id-2");

        assert.equal("encrypted-vote-1", vote1, "expected first vote");
        assert.equal("encrypted-vote-2", vote2, "expected second vote");
    });

    it("should have decryption key", async function () {
        let key = await config.contract.privateKey();
        assert.equal(key, config.encryptionKey, "key should match");
    });

    it("should have 1 vote left", async function () {
        let votesLeft = await config.allowanceContract.allowance(config.account.owner);
        assert.equal(votesLeft, 1, "expected 1 vote left (3 - 2 = 1)");
    });
});

contract('Basic Election', function (accounts) {

    let config;
    let vote1;
    let vote2;

    before(async () => {

        let voteConfig = {
            ballotCount: 1,
            optionsPerBallot: 5,
            writeInCount: 0
        };

        vote1 = await generateEncryptedVote(voteConfig);
        vote2 = await generateEncryptedVote(voteConfig);

        config = await doEndToEndElection({
            account: {
                allowance: 3,
                owner: accounts[0]
            },
            netvote: accounts[1],
            admin: accounts[2],
            allowUpdates: false,
            autoActivate: false,
            gateway: accounts[3],
            encryptionKey: "testkey",
            metadata: "ipfs1",
            voters: {
                voter1: {
                    voteId: "vote-id-1",
                    vote: vote1
                },
                voter2: {
                    voteId: "vote-id-2",
                    vote: vote2
                }
            }
        });
    });

    it("should have 2 votes", async function () {
        let voteCount = await config.contract.getVoteCount();
        assert.equal(voteCount, 2, "expected 2 votes");
    });

    it("should have both votes present", async function () {
        let vote1 = await config.contract.getVoteAt(0);
        let vote2 = await config.contract.getVoteAt(1);
        let votes = [vote1, vote2];
        assert.equal(votes.indexOf(vote1) > -1, true, "expected first vote");
        assert.equal(votes.indexOf(vote2) > -1, true, "expected second vote");
    });

    it("should be assigned to correct voteId", async function () {
        let vote1 = await config.contract.votes("vote-id-1");
        let vote2 = await config.contract.votes("vote-id-2");

        assert.equal(vote1, vote1, "expected first vote");
        assert.equal(vote2, vote2, "expected second vote");
    });

    it("should have decryption key", async function () {
        let key = await config.contract.privateKey();
        assert.equal(key, config.encryptionKey, "key should match");
    });

    it("should have 1 vote left", async function () {
        let votesLeft = await config.allowanceContract.allowance(config.account.owner);
        assert.equal(votesLeft, 1, "expected 1 vote left (3 - 2 = 1)");
    });
});

contract('Basic Election GAS Analysis', function (accounts) {

    let scenarios = [
        {
            ballotCount: 1,
            optionsPerBallot: 1,
            writeInCount: 0,
            voteGasLimit: 175000
        },
        {
            ballotCount: 1,
            optionsPerBallot: 5,
            writeInCount: 0,
            voteGasLimit: 200000
        },
        {
            ballotCount: 1,
            optionsPerBallot: 10,
            writeInCount: 0,
            voteGasLimit: 225000
        },
        {
            ballotCount: 1,
            optionsPerBallot: 10,
            writeInCount: 2,
            voteGasLimit: 250000
        },
        {
            ballotCount: 1,
            optionsPerBallot: 20,
            writeInCount: 2,
            voteGasLimit: 300000
        }
    ];

    scenarios.forEach(async (scenario)=> {

        let config = {
            account: {
                allowance: 3,
                owner: accounts[0]
            },
            netvote: accounts[1],
            admin: accounts[2],
            allowUpdates: false,
            autoActivate: false,
            gateway: accounts[3],
            encryptionKey: "testkey",
            metadata: "ipfs1",
            voters: {
                voter1: {
                    voteId: "vote-id-1"
                }
            }
        };

        [true, false].forEach(async (autoActivate) => {
            config.gasAmount = {};
            it("should use less than "+scenario.voteGasLimit+" gas (ballot="+scenario.ballotCount+", options="+scenario.optionsPerBallot+", writeIns="+scenario.writeInCount+", autoactivate="+autoActivate+")", async function () {
                config.voters.voter1.vote = await generateEncryptedVote(scenario);
                config.autoActivate = autoActivate;
                config = await doEndToEndElection(config);
                assert.equal(config["gasAmount"]["Cast Vote"] <= scenario.voteGasLimit, true, "Vote Gas Limit Exceeded, limit="+scenario.voteGasLimit+", actual="+config["gasAmount"]["Cast Vote"])
            });
        });

    });
});


