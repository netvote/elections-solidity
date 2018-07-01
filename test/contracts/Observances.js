let Observances = artifacts.require("Observances");

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

contract('Observances', function (accounts) {
    let owner;
    let observances;
    let scopeId = "test-scope";
    let scopeId2 = "test-scope-2";
    let submitId = "submitId";
    let timestamp = 12345;
    let ipfsUrl = "referenceUrl";

    beforeEach(async () => {
        owner = accounts[0];
        observances = await Observances.new({from: owner});
    });

    it("should start with zero length", async function () {
        const length = await observances.submitIdLength(scopeId);
        assert.equal(length, 0, "should have zero length");
    });

    it("should add entry", async function () {
        let length = await observances.submitIdLength(scopeId);
        assert.equal(length, 0, "should have zero length");
        await observances.addEntry(scopeId, submitId, ipfsUrl, timestamp);
        length = await observances.referenceLength(scopeId, submitId);
        assert.equal(length, 1, "should have 1 length");

        sId = await observances.submitIdAt(scopeId,0);
        assert.equal(sId, submitId, "submitId should equal");

        ref = await observances.referenceAt(scopeId, submitId, 0);
        assert.equal(ref, ipfsUrl, "ipfs url should match what was written");
        ts = await observances.timestampAt(scopeId, submitId, 0);
        assert.equal(ts, timestamp, "timestamp should match what was written");
    });

    it("should add two entrys without adding submitId twice", async function () {
        await observances.addEntry(scopeId, submitId, ipfsUrl, timestamp);
        await observances.addEntry(scopeId, submitId, ipfsUrl+"2", timestamp);
        let length = await observances.submitIdLength(scopeId);
        assert.equal(length, 1, "should have one submitId");
        length = await observances.referenceLength(scopeId, submitId);
        assert.equal(length, 2, "should have 2 length");
    });

    it("should not allow duplicates for submitId", async function () {
        await observances.addEntry(scopeId, submitId, ipfsUrl, timestamp);
        await assertThrowsAsync(async function(){
            await observances.addEntry(scopeId, submitId, ipfsUrl, timestamp);
        }, Error, "should throw Error")
    });

    it("does allow duplicates for different scope", async function () {
        await observances.addEntry(scopeId, submitId, ipfsUrl, timestamp);
        await observances.addEntry(scopeId2, submitId, ipfsUrl, timestamp);
        let length = await observances.submitIdLength(scopeId);
        assert.equal(length, 1, "should have 1 length");
        let length2 = await observances.submitIdLength(scopeId2);
        assert.equal(length2, 1, "should have 1 length");
    });
    
    it("should not let non-admin add entry", async function () {
        await assertThrowsAsync(async function(){
            await observances.addEntry(scopeId, submitId, ipfsUrl, timestamp, {from: accounts[1]});
        }, Error, "should throw Error")
    });
})