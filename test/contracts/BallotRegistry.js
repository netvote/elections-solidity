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


let BallotRegistry = artifacts.require("BallotRegistry");

let assertCount = async (registry, expected) => {
    let count = await registry.getBallotCount();
    assert.equal(count, expected, "invalid ballot count");
};

let assertContainsBallot = async (registry, ballot, expected) => {
    let hasBallot = await registry.ballotExists(ballot);
    assert.equal(hasBallot, expected, "contains expectation failed, ballot="+ballot+", expected="+expected);
};

let assertBallotIndex = async (registry, ballot, expected) => {
    let index = await registry.getBallotIndex(ballot);
    assert.equal(index, expected, "index expectation failed, ballot="+ballot+", expected="+expected);
};

let assertBallotAtIndex = async (registry, index, expected) => {
    let ballot = await registry.getBallot(index);
    assert.equal(ballot, expected, "ballot at index expectation failed, index="+index+", expected="+expected);
};

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

contract('BallotRegistry', function (accounts) {
    let registry;
    let owner;
    let admin;
    let notAdmin;
    let ballot1;
    let ballot2;

    beforeEach(async () => {
        owner = accounts[0];
        admin = accounts[1];
        notAdmin = accounts[2];
        ballot1 = accounts[3];
        ballot2 = accounts[4];
        registry = await BallotRegistry.new({from: owner});
        await registry.addAdmin(admin, {from: owner});
    });


    it("should start with empty ballot count", async function () {
        await assertCount(registry, 0);
        await assertContainsBallot(registry, ballot1, false);
        await assertContainsBallot(registry, ballot2, false);
    });

    it("should add ballot", async function () {
        await registry.addBallot(ballot1, {from: owner});
        await assertCount(registry, 1);
        await assertBallotIndex(registry, ballot1, 0);
        await assertBallotAtIndex(registry, 0, ballot1);
        await assertContainsBallot(registry, ballot1, true);
        await assertContainsBallot(registry, ballot2, false);
    });

    it("should add two ballots", async function () {
        await registry.addBallot(ballot1, {from: owner});
        await registry.addBallot(ballot2, {from: owner});
        await assertCount(registry, 2);
        await assertContainsBallot(registry, ballot1, true);
        await assertContainsBallot(registry, ballot2, true);
        await assertBallotIndex(registry, ballot1, 0);
        await assertBallotAtIndex(registry, 0, ballot1);
        await assertBallotIndex(registry, ballot2, 1);
        await assertBallotAtIndex(registry, 1, ballot2);
    });

    it("should remove ballot", async function () {
        await registry.addBallot(ballot1, {from: owner});
        await registry.addBallot(ballot2, {from: owner});
        await registry.removeBallot(ballot2, {from: owner});
        await assertCount(registry, 1);
        await assertContainsBallot(registry, ballot1, true);
        await assertContainsBallot(registry, ballot2, false);
        await assertBallotIndex(registry, ballot1, 0);
        await assertBallotAtIndex(registry, 0, ballot1);
    });

    it("should not let non-admin add ballot", async function () {
        await assertThrowsAsync(async function(){
            await registry.addBallot(ballot1, {from: notAdmin});
        }, Error, "should throw Error")
    });

});
