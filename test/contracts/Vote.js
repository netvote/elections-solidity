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
        await vote.mint(netvote, toWei(50), {from: netvote});
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
        await vote.spendVote({from: election});
        await assertBalance(netvote, 49);
        await assertBalance(election, 0);
        await assertBalance(admin, 0);
        await assertSupply(49);
    });

    it("should not allow spendVote when locked", async function () {
        await vote.transfer(admin, toWei(1), {from: netvote});
        await vote.transfer(election, toWei(1), {from: admin});
        await vote.lock({from: netvote});
        await assertThrowsAsync(async function(){
            await vote.spendVote({from: election});
        }, Error, "should throw Error")
    });

});
