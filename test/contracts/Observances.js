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
    let key;
    let key2;
    let timestamp = 12345;
    let ipfsUrl = "referenceUrl";

    beforeEach(async () => {
        owner = accounts[0];
        key = web3.sha3("test-scope");
        key2 = web3.sha3("test-scope2");
        observances = await Observances.new({from: owner});
    });

    it("should start with zero length", async function () {
        const length = await observances.getLength(key);
        assert.equal(length, 0, "should have zero length");
    });

    it("should add entry", async function () {
        let length = await observances.getLength(key);
        assert.equal(length, 0, "should have zero length");
        await observances.addEntry(key, ipfsUrl, timestamp);
        length = await observances.getLength(key);
        assert.equal(length, 1, "should have 1 length");

        ref = await observances.referenceAt(key, 0);
        assert.equal(ref, ipfsUrl, "ipfs url should match what was written");
        ts = await observances.timestampAt(key, 0);
        assert.equal(ts, timestamp, "timestamp should match what was written");
    });

    it("should not allow duplicates for scope", async function () {
        await observances.addEntry(key, ipfsUrl, timestamp);
        await assertThrowsAsync(async function(){
            await observances.addEntry(key, ipfsUrl, timestamp);
        }, Error, "should throw Error")
    });

    it("does allow duplicates for different scope", async function () {
        await observances.addEntry(key, ipfsUrl, timestamp);
        await observances.addEntry(key2, ipfsUrl, timestamp);
        let length = await observances.getLength(key);
        assert.equal(length, 1, "should have 1 length");
        let length2 = await observances.getLength(key2);
        assert.equal(length2, 1, "should have 1 length");
    });
    
    it("should not let non-admin add entry", async function () {
        await assertThrowsAsync(async function(){
            await observances.addEntry(key, ipfsUrl, timestamp, {from: accounts[1]});
        }, Error, "should throw Error")
    });
})