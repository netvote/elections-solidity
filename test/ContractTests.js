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

let log = (msg) => {
    //console.log(msg);
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

// 1
let createElection = async(config) => {
    log("create election");
    let va = await VoteAllowance.new({from: config.netvote});
    await va.addVotes(config.account.owner, config.account.allowance, {from: config.netvote});
    config.contract = await Election.new(va.address, config.account.owner, config.allowUpdates, {from: config.admin });
    await va.addElection(config.contract.address, {from: config.account.owner});
    return config;
};

// 2 - assumes election created
let createBallots = async(config) => {
    log("create ballots");
    for (let name in config.ballots) {
        if (config.ballots.hasOwnProperty(name)) {
            let ballotConfig = config.ballots[name];
            let admin = ballotConfig.admin;
            let ballot = await Ballot.new(config.contract.address, admin, ballotConfig.metadata, {from: config.admin});
            await config.contract.addBallot(ballot.address, {from: config.admin});
            for(let i=0; i<ballotConfig.groups.length; i++){
                await ballot.addGroup(ballotConfig.groups[i], {from: admin});
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
    return config;
};

let activateElection = async(config) => {
    log("activating election");
    await config.contract.activate({from: config.admin});
    return config;
};

let activateBallots = async(config) => {
    log("activating ballots");
    for (let name in config.ballots) {
        if (config.ballots.hasOwnProperty(name)) {
            let ballot = config.ballots[name];
            await ballot.contract.activate({from: ballot.admin});
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
            await pool.register(voter.address, {from: config.registrar});
            await pool.castVote(voter.vote, {from: voter.address});
        }
    }
    return config;
};

let closePools = async(config) => {
    for (let name in config.pools) {
        if (config.pools.hasOwnProperty(name)) {
            let pool = config.pools[name];
            await pool.contract.close({from: pool.admin});
        }
    }
    return config;
};

let closeBallots = async(config) => {
    for (let name in config.ballots) {
        if (config.ballots.hasOwnProperty(name)) {
            let ballot = config.ballots[name];
            await ballot.contract.close({from: ballot.admin});
        }
    }
    return config;
};

let closeElection = async(config) => {
    await config.contract.close({from: config.admin});
    return config;
};

let doTransactions = async(transactions, config) => {
    for(let tx of transactions) {
        config = await tx(config);
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
        closeElection
    ], config);
};

contract('Election: Configuration TX', function (accounts) {
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
            registrar: accounts[8],
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

        let address1 = await config.contract.ballots(0);
        let address2 = await config.contract.ballots(1);

        // last entry moved to front
        assert.equal(config.ballots["ballot3"].contract.address, address1);
        assert.equal(config.ballots["ballot2"].contract.address, address2);
    });

    // for ballots abc, remove b
    it("should remove second ballot", async function() {
        await config.contract.removeBallot(config.ballots["ballot2"].contract.address, {from: config.admin});
        let count = await config.contract.getBallotCount();
        assert.equal(count, 2);

        let address1 = await config.contract.ballots(0);
        let address2 = await config.contract.ballots(1);

        assert.equal(config.ballots["ballot1"].contract.address, address1);
        assert.equal(config.ballots["ballot3"].contract.address, address2);
    });

    // for ballots abc, remove c
    it("should remove third ballot", async function() {
        await config.contract.removeBallot(config.ballots["ballot3"].contract.address, {from: config.admin});
        let count = await config.contract.getBallotCount();
        assert.equal(count, 2);

        let address1 = await config.contract.ballots(0);
        let address2 = await config.contract.ballots(1);

        assert.equal(config.ballots["ballot1"].contract.address, address1);
        assert.equal(config.ballots["ballot2"].contract.address, address2);
    });
});

let printConfig = (config) => {

};


contract('Simple Election', function (accounts) {
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
            registrar: accounts[8],
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
        config = await doEndToEndElection( {
            account: {
                allowance: 2,
                owner: accounts[7]
            },
            netvote: accounts[0],
            admin: accounts[1],
            allowUpdates: false,
            registrar: accounts[8],
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
        config = await doEndToEndElection( {
                account: {
                    allowance: 2,
                    owner: accounts[7]
                },
                netvote: accounts[0],
                admin: accounts[1],
                allowUpdates: false,
                registrar: accounts[8],
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
