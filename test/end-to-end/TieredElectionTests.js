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
const election = require("./jslib/tiered-election.js");

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

        await election.doTransactions([
            election.setupVoteToken,
            election.createElection,
            election.createBallots,
            election.createPools
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
        config = await election.doEndToEndElection( {
            account: {
                allowance: 1,
                owner: accounts[7]
            },
            netvote: accounts[0],
            admin: accounts[1],
            allowUpdates: false,
            gateway: accounts[8],
            submitWithProof: true,
            ballots: {
                ballot1: {
                    admin: accounts[2],
                    metadata: "ipfs1",
                    proof: "QmecMiWvcuB2nsgyL8Wtgp9DMR9gCVqybsb2MfAmcJV1kM",
                    groups: ["US"]
                }
            },
            pools: {
                pool1: {
                    admin: accounts[3],
                    groups: ["US"],
                    proof: "QmecMiWvcuB2nsgyL8Wtgp9DMR9gCVqybsb2MfAmcJV1kM",
                    ballots: ["ballot1"]
                }
            },
            voters: {
                voter1: {
                    pool: "pool1",
                    address: accounts[6],
                    proof: "QmecMiWvcuB2nsgyL8Wtgp9DMR9gCVqybsb2MfAmcJV1kM",
                    vote: "encrypted-vote-1"
                }
            }
        });
    });

    it("should get 1 US vote for ballot1", async function() {
        let ballot = config.ballots.ballot1.contract;
        let votes = await election.getVotesByGroup(ballot, "US");
        assert.equal(votes.length, 1);
        assertVote(votes[0], config.voters.voter1.vote);
    });

    it("should get 1 ALL vote for ballot1", async function() {
        let ballot = config.ballots.ballot1.contract;
        let votes = await election.getVotesByGroup(ballot, "ALL");
        assert.equal(votes.length, 1);
        assertVote(votes[0], config.voters.voter1.vote);
    });

});

contract('Tiered Election: 2 Pools, 2 Voters, 1 Shared Ballot, 1 Different Ballot', function (accounts) {
    let config;

    before(async () => {
        config = await election.doEndToEndElection( {
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
        let votes = await election.getVotesByGroup(ballot, "ALL");
        assert.equal(votes.length, 2);
        assertVote(votes[0], config.voters.voter1.vote);
        assertVote(votes[1], config.voters.voter2.vote);
    });

    it("should get 2 NY votes for ballot1", async function() {
        let ballot = config.ballots.ballot1.contract;
        let votes = await election.getVotesByGroup(ballot, "NY");
        assert.equal(votes.length, 2);
        assertVote(votes[0], config.voters.voter1.vote);
        assertVote(votes[1], config.voters.voter2.vote);
    });

    it("should get 1 D5 votes for ballot1", async function() {
        let ballot = config.ballots.ballot1.contract;
        let votes = await election.getVotesByGroup(ballot, "D5");
        assert.equal(votes.length, 1);
        assertVote(votes[0], config.voters.voter1.vote);
    });

    it("should get 1 D6 votes for ballot1", async function() {
        let ballot = config.ballots.ballot1.contract;
        let votes = await election.getVotesByGroup(ballot, "D6");
        assert.equal(votes.length, 1);
        assertVote(votes[0], config.voters.voter2.vote);
    });

    it("should get 1 D5 votes for ballot2", async function() {
        let ballot = config.ballots.ballot2.contract;
        let votes = await election.getVotesByGroup(ballot, "D5");
        assert.equal(votes.length, 1);
        assertVote(votes[0], config.voters.voter1.vote);
    });

    it("should get 1 D6 votes for ballot3", async function() {
        let ballot = config.ballots.ballot3.contract;
        let votes = await election.getVotesByGroup(ballot, "D6");
        assert.equal(votes.length, 1);
        assertVote(votes[0], config.voters.voter2.vote);
    });
});

contract('2 Pools, 2 Voters, 2 Shared Ballots', function (accounts) {

    let config;

    before(async () => {
        config = await election.doEndToEndElection( {
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
        let votes = await election.getVotesByGroup(ballot, "ALL");
        assert.equal(votes.length, 2);
        assertVote(votes[0], config.voters.voter1.vote);
        assertVote(votes[1], config.voters.voter2.vote);
    });

    it("should get 2 NY votes for ballot1", async function() {
        let ballot = config.ballots.ballot1.contract;
        let votes = await election.getVotesByGroup(ballot, "NY");
        assert.equal(votes.length, 2);
        assertVote(votes[0], config.voters.voter1.vote);
        assertVote(votes[1], config.voters.voter2.vote);
    });

    it("should get 2 NY votes for ballot2", async function() {
        let ballot = config.ballots.ballot2.contract;
        let votes = await election.getVotesByGroup(ballot, "NY");
        assert.equal(votes.length, 2);
        assertVote(votes[0], config.voters.voter1.vote);
        assertVote(votes[1], config.voters.voter2.vote);
    });

    it("should get 1 D5 vote for ballot1", async function() {
        let ballot = config.ballots.ballot1.contract;
        let votes = await election.getVotesByGroup(ballot, "D5");
        assert.equal(votes.length, 1);
        assertVote(votes[0], config.voters.voter1.vote);
    });

    it("should get 1 D6 vote for ballot1", async function() {
        let ballot = config.ballots.ballot1.contract;
        let votes = await election.getVotesByGroup(ballot, "D6");
        assert.equal(votes.length, 1);
        assertVote(votes[0], config.voters.voter2.vote);
    });

    it("should get 1 D5 vote for ballot2", async function() {
        let ballot = config.ballots.ballot2.contract;
        let votes = await election.getVotesByGroup(ballot, "D5");
        assert.equal(votes.length, 1);
        assertVote(votes[0], config.voters.voter1.vote);
    });

    it("should get 1 D6 vote for ballot2", async function() {
        let ballot = config.ballots.ballot2.contract;
        let votes = await election.getVotesByGroup(ballot, "D6");
        assert.equal(votes.length, 1);
        assertVote(votes[0], config.voters.voter2.vote);
    });
});
