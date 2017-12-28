let PoolRegistry = artifacts.require("PoolRegistry");


let assertCount = async (registry, expected) => {
    let count = await registry.getPoolCount();
    assert.equal(count, expected, "invalid pool count");
};

let assertContainsPool = async (registry, pool, expected) => {
    let hasPool = await registry.poolExists(pool);
    assert.equal(hasPool, expected, "contains expectation failed, pool="+pool+", expected="+expected);
};

let assertPoolIndex = async (registry, pool, expected) => {
    let index = await registry.getPoolIndex(pool);
    assert.equal(index, expected, "index expectation failed, pool="+pool+", expected="+expected);
};

let assertPoolAtIndex = async (registry, index, expected) => {
    let pool = await registry.getPool(index);
    assert.equal(pool, expected, "pool at index expectation failed, index="+index+", expected="+expected);
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

contract('PoolRegistry', function (accounts) {
    let registry;
    let owner;
    let admin;
    let notAdmin;
    let pool1;
    let pool2;

    beforeEach(async () => {
        owner = accounts[0];
        admin = accounts[1];
        notAdmin = accounts[2];
        pool1 = accounts[3];
        pool2 = accounts[4];
        registry = await PoolRegistry.new({from: owner});
        await registry.addAdmin(admin, {from: owner});
    });


    it("should start with empty pool count", async function () {
        await assertCount(registry, 0);
        await assertContainsPool(registry, pool1, false);
        await assertContainsPool(registry, pool2, false);
    });

    it("should add pool", async function () {
        await registry.addPool(pool1, {from: owner});
        await assertCount(registry, 1);
        await assertPoolIndex(registry, pool1, 0);
        await assertPoolAtIndex(registry, 0, pool1);
        await assertContainsPool(registry, pool1, true);
        await assertContainsPool(registry, pool2, false);
    });

    it("should add two pools", async function () {
        await registry.addPool(pool1, {from: owner});
        await registry.addPool(pool2, {from: owner});
        await assertCount(registry, 2);
        await assertContainsPool(registry, pool1, true);
        await assertContainsPool(registry, pool2, true);
        await assertPoolIndex(registry, pool1, 0);
        await assertPoolAtIndex(registry, 0, pool1);
        await assertPoolIndex(registry, pool2, 1);
        await assertPoolAtIndex(registry, 1, pool2);
    });

    it("should remove pool", async function () {
        await registry.addPool(pool1, {from: owner});
        await registry.addPool(pool2, {from: owner});
        await registry.removePool(pool2, {from: owner});
        await assertCount(registry, 1);
        await assertContainsPool(registry, pool1, true);
        await assertContainsPool(registry, pool2, false);
        await assertPoolIndex(registry, pool1, 0);
        await assertPoolAtIndex(registry, 0, pool1);
    });

    it("should not let non-admin add pool", async function () {
        await assertThrowsAsync(async function(){
            await registry.addPool(pool1, {from: notAdmin});
        }, Error, "should throw Error")
    });

});
