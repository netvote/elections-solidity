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

let Vote = artifacts.require("Vote");
let sleep = require('sleep');

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

contract('Vote', function (accounts) {
    let netvote;
    let admin;
    let election;
    let vote;

    let toWei = (num) => {
        return web3.toWei(num, 'ether')
    };

    let assertBalance = async (addr, expected) => {
        let bal = await vote.balanceOf(addr);
        assert.equal(bal.toNumber(), toWei(expected));
    };

    let assertSupply = async (expected) => {
        let bal = await vote.totalSupply();
        assert.equal(bal.toNumber(), toWei(expected));
    };

    beforeEach(async () => {
        netvote = accounts[0];
        admin = accounts[1];
        election = accounts[2];
        vote = await Vote.new({from: netvote});
        await vote.setGranularity(1, {from: netvote});
        await vote.mint(netvote, toWei(50), {from: netvote});
    });

    it("should start with election not on token", async function () {
        let exists = await vote.elections(election);
        assert.equal(exists, false, "election should not exist yet");
    });

    it("should close election", async function () {
        await vote.addElection(election, {from: netvote});
        await vote.closeElection({from: election})
    });

    it("should add and remove election to token", async function () {
        await vote.addElection(election, {from: netvote});
        let exists = await vote.elections(election);
        assert.equal(exists, true, "election should exist");
        await vote.removeElection(election, {from: netvote});
        exists = await vote.elections(election);
        assert.equal(exists, false, "election should not exist");
    });

    it("should not let non-admins add election", async function () {
        await vote.addElection(election, {from: netvote});
        await assertThrowsAsync(async function(){
            await vote.removeElection(election, {from: admin});
        }, Error, "should throw Error")
    });

    it("should not let non-elections close election", async function () {
        await assertThrowsAsync(async function(){
            await vote.closeElection(election, {from: admin});
        }, Error, "should throw Error")
    });

    it("should not let non-admins remove election", async function () {
        await assertThrowsAsync(async function(){
            await vote.addElection(election, {from: admin});
        }, Error, "should throw Error")
    });

    it("should start with only netvote with balance", async function () {
        await assertSupply(50);
        await assertBalance(netvote, 50);
        await assertBalance(election, 0);
        await assertBalance(admin, 0);
    });

    it("should transfer to admin", async function () {
        await vote.transfer(admin, toWei(1), {from: netvote});
        await assertSupply(50);
        await assertBalance(netvote, 49);
        await assertBalance(election, 0);
        await assertBalance(admin, 1);
    });

    it("should burn when vote", async function () {
        await vote.transfer(admin, toWei(1), {from: netvote});
        await vote.transfer(election, toWei(1), {from: admin});
        await assertBalance(netvote, 49);
        await assertBalance(election, 1);
        await assertBalance(admin, 0);
        await assertSupply(50);
        let totalVotes = await vote.getUtilizationSince(1);
        assert.equal(totalVotes, 0);
        await vote.spendVote({from: election});
        await assertBalance(netvote, 49);
        await assertBalance(election, 0);
        await assertBalance(admin, 0);
        await assertSupply(49);
        totalVotes = await vote.getUtilizationSince(1);
        assert.equal(totalVotes, 1);
    });

    it("should let minters mint", async function () {
        await vote.addMinter(admin, {from: netvote});
        await vote.mint(netvote, toWei(50), {from: admin});
        await assertSupply(100);
    });

    it("should not let non-minters mint", async function () {
        await assertThrowsAsync(async function(){
            await vote.mint(netvote, toWei(50), {from: admin});
        }, Error, "should throw Error")
    });

    it("should not let non-minters mint after removal", async function () {
        await vote.addMinter(admin, {from: netvote});
        await vote.mint(netvote, toWei(50), {from: admin});
        await vote.removeMinter(admin, {from: netvote});
        await assertThrowsAsync(async function(){
            await vote.mint(netvote, toWei(50), {from: admin});
        }, Error, "should throw Error")
    });

    it("should burn multiple when vote", async function () {
        await vote.transfer(admin, toWei(2), {from: netvote});
        await vote.transfer(election, toWei(2), {from: admin});
        await assertBalance(netvote, 48);
        await assertBalance(election, 2);
        await assertBalance(admin, 0);
        await assertSupply(50);
        let totalVotes = await vote.getUtilizationSince(0);
        assert.equal(totalVotes, 0);
        await vote.spendVote({from: election});
        // this forces next vote into next utilization bucket
        sleep.sleep(2);
        await vote.spendVote({from: election});
        await assertBalance(netvote, 48);
        await assertBalance(election, 0);
        await assertBalance(admin, 0);
        await assertSupply(48);
        totalVotes = await vote.getUtilizationSince(0);
        assert.equal(totalVotes.toNumber(), 2);
        let windowCount = await vote.getWindowCountSince(1);
        assert.equal(windowCount.toNumber(), 2);

        // check except first window, to verify loop
        let date = (new Date()).getTime()-1000;
        let ts = date/1000;
        totalVotes = await vote.getUtilizationSince(ts);
        assert.equal(totalVotes.toNumber(), 1);
        windowCount = await vote.getWindowCountSince(ts);
        assert.equal(windowCount.toNumber(), 1);

    });

    it("should not allow spendVote when locked", async function () {
        await vote.transfer(admin, toWei(1), {from: netvote});
        await vote.transfer(election, toWei(1), {from: admin});
        await vote.lock({from: netvote});
        await assertThrowsAsync(async function(){
            await vote.spendVote({from: election});
        }, Error, "should throw Error")
    });

    it("should not allow spendVote with no balance", async function () {
        await vote.transfer(admin, toWei(1), {from: netvote});
        await assertThrowsAsync(async function(){
            await vote.spendVote({from: election});
        }, Error, "should throw Error")
    });

    it("should not allow setting granularity by someone else", async function () {
        await assertThrowsAsync(async function(){
            await vote.setGranularity(5, {from: admin});
        }, Error, "should throw Error")
    });

});