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

let ElectionPhaseable = artifacts.require("ElectionPhaseable");

const BUILDING = 0;
const VOTING = 1;
const CLOSED = 2;
const ABORTED = 3;

let assertState = async (phaseable, expectedState) => {
    let state = await phaseable.electionPhase();
    assert.equal(state, expectedState, "election in unexpected state");
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

contract('ElectionPhaseable - Building', function (accounts) {
    let phaseable;
    let owner;
    let admin;
    let notAdmin;

    beforeEach(async () => {
        owner = accounts[0];
        admin = accounts[1];
        notAdmin = accounts[2];
        phaseable = await ElectionPhaseable.new({from: owner});
        await phaseable.addAdmin(admin, {from: owner});
    });

    it("should start in building state", async function () {
        await assertState(phaseable, BUILDING);
    });

    it("should not let non-admin activate", async function () {
        let thrown = false;
        try{
            await phaseable.activate({from: notAdmin});
        }catch(e){
            thrown = true;
        }
        assert.equal(thrown, true, "expected exception");
    });

    it("should not let non-admin abort", async function () {
        await assertThrowsAsync(async ()=>{
            await phaseable.abort({from: notAdmin})
        }, /Exception/);
    });


    it("should activate", async function () {
        await phaseable.activate({from: owner});
        await assertState(phaseable, VOTING);
    });

    it("should abort", async function () {
        await phaseable.abort({from: owner});
        await assertState(phaseable, ABORTED);
    });

    it("should not activate if locked", async function () {
        await phaseable.lock({from: owner});
        await assertThrowsAsync(async ()=>{
            await phaseable.activate({from: owner});
        }, /Exception/);
    });

    it("should activate if unlocked", async function () {
        await phaseable.lock({from: owner});
        await phaseable.unlock({from: owner});
        await phaseable.activate({from: owner});
        await assertState(phaseable, VOTING);
    });

    it("should not close", async function () {
        await phaseable.lock({from: owner});
        await assertThrowsAsync(async ()=>{
            await phaseable.close({from: owner});
        }, /Exception/);
    });
});

contract('ElectionPhaseable - Voting', function (accounts) {
    let phaseable;
    let owner;
    let admin;
    let notAdmin;

    beforeEach(async () => {
        owner = accounts[0];
        admin = accounts[1];
        notAdmin = accounts[2];
        phaseable = await ElectionPhaseable.new({from: owner});
        await phaseable.addAdmin(admin, {from: owner});
        await phaseable.activate({from: owner});
    });

    it("should close", async function () {
        await phaseable.close({from: owner});
        await assertState(phaseable, CLOSED);
        let closed = await phaseable.isClosed();
        assert.equal(closed, true, "expected closed == true");
    });

    it("should not let non-admin close", async function () {
        await assertThrowsAsync(async ()=>{
            await phaseable.close({from: notAdmin});
        }, /Exception/);
    });

    it("should not close if locked", async function () {
        await phaseable.lock({from: owner});
        await assertThrowsAsync(async ()=>{
            await phaseable.close({from: owner});
        }, /Exception/);
    });

    it("should not activate", async function () {
        await assertThrowsAsync(async ()=>{
            await phaseable.activate({from: owner});
        }, /Exception/);
    });

    it("should close if unlocked", async function () {
        await phaseable.lock({from: owner});
        await phaseable.unlock({from: owner});
        await phaseable.close({from: owner});
        await assertState(phaseable, CLOSED);
    });
});

contract('ElectionPhaseable - Closed', function (accounts) {
    let phaseable;
    let owner;
    let admin;
    let notAdmin;

    beforeEach(async () => {
        owner = accounts[0];
        admin = accounts[1];
        notAdmin = accounts[2];
        phaseable = await ElectionPhaseable.new({from: owner});
        await phaseable.addAdmin(admin, {from: owner});
        await phaseable.activate({from: owner});
        await phaseable.close({from: owner});
    });

    it("should abort", async function () {
        await phaseable.abort({from: owner});
        await assertState(phaseable, ABORTED);
    });

    it("should not activate", async function () {
        await assertThrowsAsync(async ()=>{
            await phaseable.activate({from: owner});
        }, /Exception/);
    });

    it("should not close", async function () {
        await assertThrowsAsync(async ()=>{
            await phaseable.close({from: owner});
        }, /Exception/);
    });
});

contract('ElectionPhaseable - Aborted', function (accounts) {
    let phaseable;
    let owner;
    let admin;
    let notAdmin;

    beforeEach(async () => {
        owner = accounts[0];
        admin = accounts[1];
        notAdmin = accounts[2];
        phaseable = await ElectionPhaseable.new({from: owner});
        await phaseable.addAdmin(admin, {from: owner});
        await phaseable.activate({from: owner});
        await phaseable.abort({from: owner});
    });

    it("should not activate", async function () {
        await assertThrowsAsync(async ()=>{
            await phaseable.activate({from: owner});
        }, /Exception/);
    });

    it("should not close", async function () {
        await assertThrowsAsync(async ()=>{
            await phaseable.close({from: owner});
        }, /Exception/);
    });
});
