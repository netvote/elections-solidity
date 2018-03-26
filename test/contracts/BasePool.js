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

let BasePool = artifacts.require("BasePool");
let MockElection = artifacts.require("MockElection");

let assertThrowsAsync = async (fn, regExp) => {
    let f = () => {};
    try {
        await fn();
    } catch(e) {
        f = () => {throw e};
    } finally {
        assert.throws(f, regExp);
    }
};

contract('BasePool', function (accounts) {
    let gateway;
    let admin;
    let pool;

    beforeEach(async () => {
        gateway = accounts[0];
        admin = accounts[1];
        let election = await MockElection.new({from: admin});
        pool = await BasePool.new("uid",  election.address, gateway, {from: admin});

        await pool.activate({from: admin});
    });

    it("should accept two different votes", async function () {
        await pool.castVote("voteId", "vote", "passphrase", "jti", {from: gateway})
        await pool.castVote("voteId2", "vote2", "passphrase2", "jti2", {from: gateway})
    });

    it("should prevent duplicate jti", async function () {
        await pool.castVote("voteId", "vote", "passphrase", "jti", {from: gateway})
        await assertThrowsAsync(async function() {
            await pool.castVote("voteId2", "vote2", "passphrase2", "jti", {from: gateway})
        }, Error, "should throw error");
    });

});
