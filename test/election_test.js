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
    config.contract = await Election.new({from: config.admin });

    // SETUP BALLOTS
    for (let name in config.ballots) {
        if (config.ballots.hasOwnProperty(name)) {
            let ballotConfig = config.ballots[name];
            let admin = ballotConfig.admin;
            let ballot = await Ballot.new(config.contract.address, admin, {from: config.admin});
            await ballot.setMetadataLocation(ballotConfig.metadata, {from: admin});
            for(let i=0; i<ballotConfig.groups.length; i++){
                await ballot.addGroup(ballotConfig.groups[i], {from: admin});
            }
            config.ballots[name].contract = ballot;
            await config.contract.addBallot(ballot.address, {from: config.admin});
        }
    }

    // SETUP POOLS
    for (let name in config.pools) {
        if (config.pools.hasOwnProperty(name)) {
            let poolConfig = config.pools[name];
            let admin = poolConfig.admin;
            let pool = await RegistrationPool.new({from: admin});
            config.pools[name].contract = pool;

            for(let i=0; i<poolConfig.ballots.length; i++) {
                let ballot = config.ballots[poolConfig.ballots[i]];
                await pool.addBallot(ballot.contract.address, {from: admin});
                await ballot.contract.addPool(pool.address, {from: ballot.admin});
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
            await pool.castVote(voter.vote, {from: voter.address});
        }
    }

    // close

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


    return config;
};

contract('Simple Election', function (accounts) {
    let config;

    before(async () => {
        config = await setupConfig( {
            admin: accounts[1],
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
        assert.equal(votes[0], config.voters.voter1.vote);
    });

});

contract('Hierarchical Ballots, Two Pools, Two Voters', function (accounts) {
    let config;

    before(async () => {
        config = await setupConfig( {
            admin: accounts[1],
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

    it("should get 2 NY votes for ballot1", async function() {
        let ballot = config.ballots.ballot1.contract;
        let votes = await getVotesByGroup(ballot, "NY");
        assert.equal(votes.length, 2);
        assert.equal(votes[0], config.voters.voter1.vote);
        assert.equal(votes[1], config.voters.voter2.vote);
    });

    it("should get 1 D5 votes for ballot1", async function() {
        let ballot = config.ballots.ballot1.contract;
        let votes = await getVotesByGroup(ballot, "D5");
        assert.equal(votes.length, 1);
        assert.equal(votes[0], config.voters.voter1.vote);
    });

    it("should get 1 D6 votes for ballot1", async function() {
        let ballot = config.ballots.ballot1.contract;
        let votes = await getVotesByGroup(ballot, "D6");
        assert.equal(votes.length, 1);
        assert.equal(votes[0], config.voters.voter2.vote);
    });

    it("should get 1 D5 votes for ballot2", async function() {
        let ballot = config.ballots.ballot2.contract;
        let votes = await getVotesByGroup(ballot, "D5");
        assert.equal(votes.length, 1);
        assert.equal(votes[0], config.voters.voter1.vote);
    });

    it("should get 1 D6 votes for ballot3", async function() {
        let ballot = config.ballots.ballot3.contract;
        let votes = await getVotesByGroup(ballot, "D6");
        assert.equal(votes.length, 1);
        assert.equal(votes[0], config.voters.voter2.vote);
    });
});

contract('Two Overlapping Ballots, Two Pools, Two Voters', function (accounts) {

    let config;

    before(async () => {
        config = await setupConfig( {
                admin: accounts[1],
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

    it("should get 2 NY votes for ballot1", async function() {
        let ballot = config.ballots.ballot1.contract;
        let votes = await getVotesByGroup(ballot, "NY");
        assert.equal(votes.length, 2);
        assert.equal(votes[0], config.voters.voter1.vote);
        assert.equal(votes[1], config.voters.voter2.vote);
    });

    it("should get 2 NY votes for ballot2", async function() {
        let ballot = config.ballots.ballot2.contract;
        let votes = await getVotesByGroup(ballot, "NY");
        assert.equal(votes.length, 2);
        assert.equal(votes[0], config.voters.voter1.vote);
        assert.equal(votes[1], config.voters.voter2.vote);
    });

    it("should get 1 D5 vote for ballot1", async function() {
        let ballot = config.ballots.ballot1.contract;
        let votes = await getVotesByGroup(ballot, "D5");
        assert.equal(votes.length, 1);
        assert.equal(votes[0], config.voters.voter1.vote);
    });

    it("should get 1 D6 vote for ballot1", async function() {
        let ballot = config.ballots.ballot1.contract;
        let votes = await getVotesByGroup(ballot, "D6");
        assert.equal(votes.length, 1);
        assert.equal(votes[0], config.voters.voter2.vote);
    });

    it("should get 1 D5 vote for ballot2", async function() {
        let ballot = config.ballots.ballot2.contract;
        let votes = await getVotesByGroup(ballot, "D5");
        assert.equal(votes.length, 1);
        assert.equal(votes[0], config.voters.voter1.vote);
    });

    it("should get 1 D6 vote for ballot2", async function() {
        let ballot = config.ballots.ballot2.contract;
        let votes = await getVotesByGroup(ballot, "D6");
        assert.equal(votes.length, 1);
        assert.equal(votes[0], config.voters.voter2.vote);
    });


});
