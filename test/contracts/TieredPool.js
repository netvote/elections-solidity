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

let TieredPool = artifacts.require("TieredPool");
let TieredElection = artifacts.require("TieredElection");
let TieredBallot = artifacts.require("TieredBallot");

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

let assertCheckConfig = async (pool, expected) =>{
    let checked = await pool.checkConfig();
    assert.equal(checked, expected, "checkConfig should have been "+expected)
};

contract('TieredPool', function (accounts) {
    let pool;
    let ballot;
    let ballot2;
    let owner;
    let notAdmin;
    let gateway;
    let allowance;
    let election;

    // has different election
    let linkInvalidBallot = async () => {
        await pool.addBallot(ballot2.address, {from: owner});
        await ballot2.addPool(pool.address, {from: owner});
    };

    let linkValidBallot = async () => {
        await pool.addBallot(ballot.address, {from: owner});
        await ballot.addPool(pool.address, {from: owner});
    };

    let linkElection = async () => {
        await election.addBallot(ballot.address, {from: owner});
        await election.addPool(pool.address, {from: owner});
    };

    beforeEach(async () => {
        owner = accounts[0];
        notAdmin = accounts[1];
        gateway = accounts[3];
        allowance = accounts[4];
        let otherElection = accounts[5];
        election = await TieredElection.new("uuid", allowance, owner, false, gateway, {from: owner});
        pool = await TieredPool.new("uuid", election.address, gateway, {from: owner});
        ballot = await TieredBallot.new(election.address, owner, "test", {from: owner});
        ballot2 = await TieredBallot.new(otherElection, owner, "test", {from: owner});
    });

    it("should allow correct config", async function () {
        await linkElection();
        await linkValidBallot();
        await assertCheckConfig(pool, true);
    });

    it("should require ballots", async function () {
        await linkElection();
        await assertCheckConfig(pool, false);
    });

    it("should require same election", async function () {
        await linkElection();
        await linkInvalidBallot();
        await assertCheckConfig(pool, false);
    });

    it("should require ballot to point to this pool", async function () {
        await linkElection();
        await pool.addBallot(ballot.address, {from: owner});
        await assertCheckConfig(pool, false);
    });

    it("should require election to link pool", async function () {
        await linkValidBallot();
        await assertCheckConfig(pool, false);
    });

});
