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