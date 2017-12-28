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

const election = require("./jslib/basic-election.js");

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

        config = await election.doTransactions([
            election.setupVoteAllowance,
            election.createBasicElection
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

        config = await election.doEndToEndElectionAutoActivate({
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

contract('Auto-Activating Basic Election with Updates', function (accounts) {

    let config;

    before(async () => {

        config = await election.doEndToEndElectionAutoActivate({
            account: {
                allowance: 3,
                owner: accounts[0]
            },
            netvote: accounts[1],
            admin: accounts[2],
            allowUpdates: true,
            autoActivate: true,
            gateway: accounts[3],
            encryptionKey: "testkey",
            metadata: "ipfs1",
            voters: {
                voter1: {
                    voteId: "vote-id-1",
                    vote: "encrypted-vote-2",
                    updateVote: "encrypted-vote-1"
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

        vote1 = await election.generateEncryptedVote(voteConfig);
        vote2 = await election.generateEncryptedVote(voteConfig);

        config = await election.doEndToEndElection({
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

// only for analysis
contract('GAS: Basic Election GAS Analysis', function (accounts) {

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
            it.skip("should use less than "+scenario.voteGasLimit+" gas (ballot="+scenario.ballotCount+", options="+scenario.optionsPerBallot+", writeIns="+scenario.writeInCount+", autoactivate="+autoActivate+")", async function () {
                config.voters.voter1.vote = await election.generateEncryptedVote(scenario);
                config.autoActivate = autoActivate;
                config = await election.doEndToEndElection(config);
                assert.equal(config["gasAmount"]["Cast Vote"] <= scenario.voteGasLimit, true, "Vote Gas Limit Exceeded, limit="+scenario.voteGasLimit+", actual="+config["gasAmount"]["Cast Vote"])
            });
        });

    });
});


