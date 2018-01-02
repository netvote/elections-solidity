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

const election = require("../test/end-to-end/jslib/tiered-election.js");

module.exports = async function(callback) {
    let accounts = web3.eth.accounts;

    let vote1Json = {
        encryptionSeed: 12345,
        ballotVotes: [
            {
                choices: [
                    {
                        selection: 1
                    },
                    {
                        selection: 2
                    },
                    {
                        selection: 3
                    },
                    {
                        selection: 4
                    }
                ]
            },
            {
                choices: [
                    {
                        selection: 1
                    },
                    {
                        selection: 2
                    },
                    {
                        selection: 3
                    },
                    {
                        selection: 4
                    }
                ]
            }
        ]
    };
    let vote2Json = {
        encryptionSeed: 54321,
        ballotVotes: [
            {
                choices: [
                    {
                        selection: 2
                    },
                    {
                        selection: 2
                    },
                    {
                        selection: 3
                    },
                    {
                        writeIn: "John Doe"
                    }
                ]
            },
            {
                choices: [
                    {
                        selection: 3
                    },
                    {
                        selection: 3
                    },
                    {
                        selection: 3
                    },
                    {
                        writeIn: "Jane Doe"
                    }
                ]
            }
        ]
    };

    let vote1 = await election.toEncryptedVote(vote1Json);
    let vote2 = await election.toEncryptedVote(vote2Json);

    let config = await election.doEndToEndElection({
        account: {
            allowance: 2,
            owner: accounts[7]
        },
        netvote: accounts[0],
        admin: accounts[1],
        allowUpdates: false,
        skipGasMeasurment:  true,
        gateway: accounts[8],
        provider: "http://localhost:9545/",
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
                vote: vote1
            },
            voter2: {
                pool: "pool2",
                address: accounts[7],
                vote: vote2
            }
        }
    });

    console.log("election: "+config.contract.address);
    callback();
};