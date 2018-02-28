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

let TokenElection = artifacts.require("TokenElection");
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

contract('TokenElection constructor', function (accounts) {
    let owner;
    let admin;
    let notAdmin;
    let validAddr;
    let token;

    before(async () => {
        owner = accounts[0];
        admin = accounts[1];
        notAdmin = accounts[2];
        validAddr = accounts[3];
        token = await Vote.new({from: owner});
    });

    it("should construct", async function () {
        let balanceDate = (new Date().getTime()-100000)/1000;
        await TokenElection.new("uid", validAddr, owner, true, validAddr, "metadata", validAddr, true, token.address, balanceDate, {from: owner});
    });

    it("should not allow future balance date", async function () {
        let balanceDate = new Date().getTime()+1000000/1000;
        await assertThrowsAsync(async ()=>{
            await TokenElection.new(validAddr,owner, true, validAddr, "metadata", validAddr, true, token.address, balanceDate, {from: owner})
        }, /Exception/);
    });

    it("should not allow non-contract token", async function () {
        let balanceDate = new Date().getTime()/1000;
        await assertThrowsAsync(async ()=>{
            await TokenElection.new(validAddr,owner, true, validAddr, "metadata", validAddr, true, validAddr, balanceDate, {from: owner})
        }, /Exception/);
    });

});
