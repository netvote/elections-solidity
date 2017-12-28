let Lockable = artifacts.require("Lockable");

let assertLocked = async (lockable) => {
    let locked = await lockable.isLocked();
    assert.equal(locked, true, "election should be locked");
};

let assertUnlocked = async (lockable) => {
    let locked = await lockable.isLocked();
    assert.equal(locked, false, "election should be unlocked");
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

contract('Lockable', function (accounts) {
    let lockable;
    let owner;
    let admin;
    let notAdmin;

    beforeEach(async () => {
        owner = accounts[0];
        admin = accounts[1];
        notAdmin = accounts[2];
        lockable = await Lockable.new({from: owner});
    });

    it("should start unlocked", async function () {
        await assertUnlocked(lockable);
    });

    it("should lock", async function () {
        await lockable.lock({from: owner});
        await assertLocked(lockable);
    });

    it("should unlock", async function () {
        await lockable.lock({from: owner});
        await lockable.unlock({from: owner});
        await assertUnlocked(lockable);
    });

    it("should not let non-admin lock", async function () {
        let thrown = false;
        try{
            await lockable.lock({from: nonAdmin});
        }catch(e){
            thrown = true;
        }
        assert.equal(thrown, true, "expected exception");
    });

    it("should not let non-admin unlock", async function () {
        await lockable.lock({from: owner});
        await assertThrowsAsync(async ()=>{
            await lockable.unlock({from: notAdmin});
        }, /Exception/);
    });

});
