let TieredBallot = artifacts.require("TieredBallot");
let TieredPool = artifacts.require("TieredPool");
let TieredElection = artifacts.require("TieredElection");

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

let assertCheckConfig = async (pool, expected) =>{
    let checked = await pool.checkConfig();
    assert.equal(checked, expected, "checkConfig should have been "+expected)
};

let assertGroupCount = async (ballot, expected) => {
    let groupCount = await ballot.getGroupCount();
    assert.equal(groupCount, expected, "invalid group count");
};

let assertPoolGroupCount = async (ballot, pool, expected) => {
    let groupCount = await ballot.getPoolGroupCount(pool);
    assert.equal(groupCount, expected, "invalid pool group count");
};

contract('TieredBallot', function (accounts) {
    let ballot;
    let owner;
    let notAdmin;
    let pool1;
    let pool2;
    let election;

    // has different election
    let linkInvalidPool = async () => {
        await ballot.addPool(pool2.address, {from: owner});
        await pool2.addBallot(ballot.address, {from: owner});
    };

    let linkValidPool = async () => {
        await ballot.addPool(pool1.address, {from: owner});
        await pool1.addBallot(ballot.address, {from: owner});
    };

    let linkElection = async () => {
        await election.addBallot(ballot.address, {from: owner});
        await election.addPool(pool1.address, {from: owner});
    };

    beforeEach(async () => {
        owner = accounts[0];
        notAdmin = accounts[1];
        let allowance = accounts[3];
        let gateway = accounts[4];

        let otherElection = accounts[5];
        election = await TieredElection.new(allowance, owner, false, gateway, {from: owner});
        pool1 = await TieredPool.new(election.address, gateway, {from: owner});
        pool2 = await TieredPool.new(otherElection, gateway, {from: owner});
        ballot = await TieredBallot.new(election.address, owner, "test", {from: owner});
    });

    it("should start with one group, ALL", async function () {
        await ballot.addPool(pool1.address, {from: owner});
        await assertPoolGroupCount(ballot, pool1.address, 1);
        let group = await ballot.getPoolGroupAt(pool1.address, 0, {from: owner});
        assert.equal(web3.toUtf8(group), "ALL", "expected group to be all");
        group = await ballot.getGroup(0, {from: owner});
        assert.equal(web3.toUtf8(group), "ALL", "expected group to be all");
    });

    it("should add group to pool1 (and not pool2)", async function () {
        await ballot.addPool(pool1.address, {from: owner});
        await ballot.addPool(pool2.address, {from: owner});
        await ballot.addGroup("DISTRICT 6", {from: owner});
        await assertGroupCount(ballot, 2);
        await ballot.addPoolToGroup(pool1.address, "DISTRICT 6", {from: owner});
        await assertPoolGroupCount(ballot, pool1.address, 2);
        await assertPoolGroupCount(ballot, pool2.address, 1);
    });

    it("should remove group", async function () {
        await ballot.addPool(pool1.address, {from: owner});
        await ballot.addPool(pool2.address, {from: owner});
        await ballot.addGroup("DISTRICT 6", {from: owner});
        await ballot.addPoolToGroup(pool1.address, "DISTRICT 6", {from: owner});
        await ballot.removeGroup("DISTRICT 6", {from: owner});
        await assertPoolGroupCount(ballot, pool1.address, 1);
        await assertPoolGroupCount(ballot, pool2.address, 1);
    });

    it("should allow correct config", async function () {
        await linkElection();
        await linkValidPool();
        await assertCheckConfig(pool1, true);
    });

    it("should require pools", async function () {
        await linkElection();
        await assertCheckConfig(pool1, false);
    });

    it("should require same election", async function () {
        await linkElection();
        await linkInvalidPool();
        await assertCheckConfig(pool1, false);
    });

    it("should require pool to point to this ballot", async function () {
        await linkElection();
        await pool1.addBallot(ballot.address, {from: owner});
        await assertCheckConfig(pool1, false);
    });

    it("should require election to link ballot", async function () {
        await linkValidPool();
        await assertCheckConfig(pool1, false);
    });

});
