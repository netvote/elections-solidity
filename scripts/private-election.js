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

const election = require("../test/end-to-end/jslib/basic-election.js");

const testacct = "0x74ecf4529b8d0fb84dbcf512b6f4cbc0ffadd690";

module.exports = async function(callback) {
    let accounts = [testacct,testacct,testacct,testacct];

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
            }
        ]
    };
    let vote2Json = {
        encryptionSeed: 54321,
        ballotVotes: [
            {
                choices: [
                    {
                        selection: 1
                    },
                    {
                        selection: 1
                    },
                    {
                        selection: 3
                    },
                    {
                        writeIn: "John Doe"
                    }
                ]
            }
        ]
    };

    let vote1 = await election.toEncryptedVote(vote1Json);
    let vote2 = await election.toEncryptedVote(vote2Json);

    console.log("about to start")
    let config = await election.doEndToEndElectionAutoActivate({
        account: {
            allowance: 3,
            owner: accounts[0]
        },
        hdwallet: true,
        netvote: accounts[1],
        admin: accounts[2],
        allowUpdates: false,
        autoActivate: true,
        skipGasMeasurment:  true,
        gateway: accounts[3],
        metadata: "ipfs1",
        provider: "http://localhost:8501/",
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

    console.log("election: "+config.contract.address);
    callback();
};
