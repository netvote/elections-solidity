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

let BasicElection = artifacts.require("BasicElection");
let VoteAllowance = artifacts.require("VoteAllowance");

// for debugging
let log = (msg) => {
    //console.log(msg);
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
    await config.allowanceContract.addElection(config.contract.address, {from: config.account.owner});
    return config;
};

let activateElection = async(config) => {
    log("activating election");
    await config.contract.activate({from: config.admin});
    return config;
};

let castVotes = async(config) => {
    log("voting");
    for (let name in config.voters) {
        if (config.voters.hasOwnProperty(name)) {
            let voter = config.voters[name];
            await config.contract.castVote(voter.voteId, voter.vote, {from: config.gateway});
        }
    }
    return config;
};

let closeElection = async(config) => {
    log("closing election");
    await config.contract.close({from: config.admin});
    return config;
};

let releaseKey = async(config) => {
    log("set decryption key");
    await config.contract.setPrivateKey(config.encryptionKey, {from: config.netvote});
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

    before(async () => {

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