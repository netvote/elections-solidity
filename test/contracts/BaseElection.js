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
let BaseElection = artifacts.require("BaseElection");

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

contract('BaseElection', function (accounts) {
    let netvote;
    let admin;
    let admin2;
    let election;
    let vote;

    let toWei = (num) => {
        return web3.toWei(num, 'ether')
    };

    let assertBalance = async (addr, expected) => {
        let bal = await vote.balanceOf(addr);
        assert.equal(bal.toNumber(), toWei(expected));
    };

    beforeEach(async () => {
        netvote = accounts[0];
        admin = accounts[1];
        admin2 = accounts[2];
        vote = await Vote.new(netvote, 5, {from: netvote});
        election = await BaseElection.new("uid", vote.address, admin, false, netvote, {from: admin});
        await vote.mint(admin, toWei(50), {from: netvote});
    });

    it("should start with only admin with balance", async function () {
        await assertBalance(election.address, 0);
        await assertBalance(admin, 50);
    });

    it("should withdraw all to election", async function () {
        await vote.transfer(election.address, toWei(25), {from: admin});
        await assertBalance(election.address, 25);
        await assertBalance(admin, 25);
        await election.withdrawAllVotes({from: admin});
        await assertBalance(election.address, 0);
        await assertBalance(admin, 50);
    });

    it("should withdraw some to election", async function () {
        await vote.transfer(election.address, toWei(25), {from: admin});
        await assertBalance(election.address, 25);
        await assertBalance(admin, 25);
        await election.withdrawVotes(toWei(20), {from: admin});
        await assertBalance(election.address, 5);
        await assertBalance(admin, 45);
    });

    it("should delegate withdraw", async function () {
        await vote.transfer(election.address, toWei(25), {from: admin});
        await assertBalance(election.address, 25);
        await assertBalance(admin, 25);
        await election.setVoteOwner(admin2, {from: admin})
        await election.withdrawVotes(toWei(20), {from: admin2});
        await assertBalance(election.address, 5);
        await assertBalance(admin, 25);
        await assertBalance(admin2, 20);
    });

    it("should delegate withdraw all", async function () {
        await vote.transfer(election.address, toWei(25), {from: admin});
        await assertBalance(election.address, 25);
        await assertBalance(admin, 25);
        await election.setVoteOwner(admin2, {from: admin})
        await election.withdrawAllVotes({from: admin2});
        await assertBalance(election.address, 0);
        await assertBalance(admin, 25);
        await assertBalance(admin2, 25);
    });

    it("should not allow invalid user - withdrawl some", async function () {
        await vote.transfer(election.address, toWei(25), {from: admin});
        await assertBalance(election.address, 25);
        await assertBalance(admin, 25);
        await assertThrowsAsync(async function(){
            await election.withdrawVotes(toWei(20), {from: admin2});
        }, Error, "should throw Error")
    });

    it("should not allow invalid user - withdrawl all", async function () {
        await vote.transfer(election.address, toWei(25), {from: admin});
        await assertBalance(election.address, 25);
        await assertBalance(admin, 25);
        await assertThrowsAsync(async function(){
            await election.withdrawAllVotes({from: admin2});
        }, Error, "should throw Error")
    });

});
