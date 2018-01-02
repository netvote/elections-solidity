let TieredBallot = artifacts.require("TieredBallot");

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

let assertPoolGroupCount = async (ballot, pool, owner, expected) => {
    let groupCount = await ballot.getPoolGroupCount(pool, {from:owner});
    assert.equal(groupCount, expected, "invalid pool group count");
};

contract('TieredBallot', function (accounts) {
    let ballot;
    let owner;
    let notAdmin;
    let pool1;
    let pool2;

    beforeEach(async () => {
        owner = accounts[0];
        notAdmin = accounts[1];
        pool1 = accounts[2];
        pool2 = accounts[3];
        let gateway = accounts[4];
        let election = accounts[5];
        let location = "ipfs-reference";
        ballot = await TieredBallot.new(election, owner, location, {from: gateway});
        await ballot.addPool(pool1, {from: owner});
        await ballot.addPool(pool2, {from: owner});
    });

    it("should start with one group, ALL", async function () {
        assertPoolGroupCount(ballot, pool1, owner, 1);
        let group = await ballot.getPoolGroupAt(pool1, 0, {from: owner});
        assert.equal(web3.toUtf8(group), "ALL", "expected group to be all");
    });

    it("should add group to pool1 (and not pool2)", async function () {
        await ballot.addGroup("DISTRICT 6", {from: owner});
        await ballot.addPoolToGroup(pool1, "DISTRICT 6", {from: owner});
        await assertPoolGroupCount(ballot, pool1, owner, 2);
        await assertPoolGroupCount(ballot, pool2, owner, 1);
    });

    it("should remove group", async function () {
        await ballot.addGroup("DISTRICT 6", {from: owner});
        await ballot.addPoolToGroup(pool1, "DISTRICT 6", {from: owner});
        await ballot.removeGroup("DISTRICT 6", {from: owner});
        await assertPoolGroupCount(ballot, pool1, owner, 1);
        await assertPoolGroupCount(ballot, pool2, owner, 1);
    });
});
