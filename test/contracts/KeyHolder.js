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

let KeyHolder = artifacts.require("KeyHolder");

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

contract('KeyHolder', function (accounts) {
    let keyHolder;
    let owner;
    let revealer;
    let notAdmin;

    let assertPublicKey = async (expected) => {
        let pubKey = await keyHolder.publicKey();
        assert.equal(pubKey, expected, "pubKey should match");
    };

    let assertPrivateKey = async (expected) => {
        let privateKey = await keyHolder.privateKey();
        assert.equal(privateKey, expected, "privateKey should match");
    };

    beforeEach(async () => {
        owner = accounts[0];
        revealer = accounts[1];
        notAdmin = accounts[2];
        keyHolder = await KeyHolder.new(revealer, {from: owner});
    });

    it("should start with no key", async function () {
        await assertPublicKey("")
        await assertPrivateKey("")
    });

    it("should set public key", async function () {
        await keyHolder.setPublicKey("key", {from: revealer});
        await assertPublicKey("key")
        await assertPrivateKey("")
    });

    it("should set private key", async function () {
        await keyHolder.activate();
        await keyHolder.close();
        await keyHolder.setPrivateKey("key", {from: revealer});
        await assertPublicKey("");
        await assertPrivateKey("key")
    });

    it("should only allow revealer address - public key", async function () {
        await assertThrowsAsync(async function(){
            await keyHolder.setPublicKey("key", {from: owner});
        }, Error, "should throw Error")
    });

    it("should only allow revealer address - private key", async function () {
        await assertThrowsAsync(async function(){
            await keyHolder.activate();
            await keyHolder.close();
            await keyHolder.setPrivateKey("key", {from: owner});
        }, Error, "should throw Error")
    });

});
