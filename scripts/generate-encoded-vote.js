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

module.exports = async function(callback) {
    let vote = {
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

    let encoded = await election.toEncodedVote(vote);
    console.log(encoded.toString("base64"));
    callback();
};