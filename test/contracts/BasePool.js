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
    let anybody;
    let pool;

    beforeEach(async () => {
        gateway = accounts[0];
        admin = accounts[1];
        anybody = accounts[2];
        let election = await MockElection.new({from: admin});
        pool = await BasePool.new("uid",  election.address, gateway, {from: admin});

        await pool.activate({from: admin});
    });

    it("should set auth id ref", async function () {
        await pool.setAuthIdRef("testref", {from: admin})
        let authRef = await pool.authIdRef();
        assert.equal(authRef, "testref")
    });

    it("should not let just anybody set auth Ids", async function () {
        await assertThrowsAsync(async function() {
            await pool.setAuthIdRef("testref", {from: anybody})
        }, Error, "should throw error");
    });

    it("should accept two different votes", async function () {
        await pool.castVote("voteId", "vote", "jti", {from: gateway})
        await pool.castVote("voteId2", "vote2", "jti2", {from: gateway})
        let voteId1 = await pool.getVoteIdAt(0)
        let voteId2 = await pool.getVoteIdAt(1);
        assert.equal(web3.toAscii(voteId1).replace(/\0/g,""), "voteId")
        assert.equal(web3.toAscii(voteId2).replace(/\0/g,""), "voteId2")
    });

    it("should prevent duplicate jti", async function () {
        await pool.castVote("voteId", "vote", "jti", {from: gateway})
        await assertThrowsAsync(async function() {
            await pool.castVote("voteId2", "vote2", "jti", {from: gateway})
        }, Error, "should throw error");
    });

    it("should store proofs", async function () {
        await pool.castVoteWithProof("voteId", "vote", "jti", "proof1", {from: gateway})
        await pool.castVoteWithProof("voteId2", "vote2", "jti2", "proof2", {from: gateway})
        let proof1 = await pool.proofs("voteId")
        let proof2 = await pool.proofs("voteId2")
        let proofIndex0 = await pool.getProofAt(0)
        let proofIndex1 = await pool.getProofAt(1)
        assert.equal("proof1", proof1)
        assert.equal("proof2", proof2)
        assert.equal("proof1", proofIndex0)
        assert.equal("proof2", proofIndex1)
    });

});