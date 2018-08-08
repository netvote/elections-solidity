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

const uuid = require("uuid/v4")
const election = require("../test/end-to-end/jslib/basic-election.js");

module.exports = async function(callback) {
    let vote = {
        signatureSeed: uuid(),
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
    let base64Vote = encoded.toString("base64");
    let sigResult = await election.signVote(base64Vote);
    console.log("base64 vote:\t"+base64Vote)
    console.log("publicKey:\t"+sigResult.publicKey);
    console.log("base64Signature:\t"+sigResult.signature.toString("base64"))
    callback();
};