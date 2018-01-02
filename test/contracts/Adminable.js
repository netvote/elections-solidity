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


let Adminable = artifacts.require("Adminable");

let assertIsAdmin = async (adminable, address, expectation) => {
  let result = await adminable.isAdmin(address);
  assert.equal(result, expectation, "expected "+address+" to have isAdmin="+expectation);
};

contract('Adminable', function (accounts) {
    let owner;
    let admin;
    let admin2;
    let notAdmin;
    let adminable;

    beforeEach(async () => {
        owner = accounts[0];
        admin = accounts[1];
        admin2 = accounts[2];
        notAdmin = accounts[3];
        adminable = await Adminable.new({from: owner});
    });

    it("should start with owner as admin", async function () {
        await assertIsAdmin(adminable, owner, true);
        await assertIsAdmin(adminable, admin, false);
        await assertIsAdmin(adminable, notAdmin, false);
    });

    it("should add admin", async function () {
        await adminable.addAdmin(admin, {from: owner});
        await assertIsAdmin(adminable, owner, true);
        await assertIsAdmin(adminable, admin, true);
        await assertIsAdmin(adminable, notAdmin, false);
    });

    it("should remove admin", async function () {
        await adminable.addAdmin(admin, {from: owner});
        await adminable.removeAdmin(admin, {from: owner});
        await assertIsAdmin(adminable, owner, true);
        await assertIsAdmin(adminable, admin, false);
        await assertIsAdmin(adminable, notAdmin, false);
    });

    it("should remove self", async function () {
        await adminable.addAdmin(admin, {from: owner});
        await adminable.removeSelf({from: admin});
        await assertIsAdmin(adminable, owner, true);
        await assertIsAdmin(adminable, admin, false);
        await assertIsAdmin(adminable, notAdmin, false);
    });

    it("should not let non-admin remove self", async function () {
        let thrown = false;
        try{
            await adminable.removeSelf({from: notAdmin})
        }catch(e){
            thrown = true;
        }
        assert.equal(thrown, true, "expected exception");
    });

    it("should not let admin remove others", async function () {
        await adminable.addAdmin(admin, {from: owner});
        await adminable.addAdmin(admin2, {from: owner});
        let thrown = false;
        try{
            await adminable.removeAdmin(admin2, {from: admin})
        }catch(e){
            thrown = true;
        }
        assert.equal(thrown, true, "expected exception");
    });

    it("should not let admin add others", async function () {
        await adminable.addAdmin(admin, {from: owner});
        let thrown = false;
        try{
            await adminable.addAdmin(admin2, {from: admin})
        }catch(e){
            thrown = true;
        }
        assert.equal(thrown, true, "expected exception");
    });

});