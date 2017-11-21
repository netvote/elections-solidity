let Election = artifacts.require("Election");
let Ballot = artifacts.require("Ballot");
let RegistrationPool = artifacts.require("RegistrationPool");

contract('Election Admin Actions', function (accounts) {
    let election;
    let ballot1;
    let ballot2;
    let electionAdmin = accounts[1];
    let ballot1Admin = accounts[2];
    let ballot2Admin = accounts[3];
    let poolAdmin = accounts[4];
    let voter = accounts[5];
    let pool;

    beforeEach(async () => {
        election = await Election.new({from: electionAdmin});

        ballot1 = await Ballot.new(election.address, ballot1Admin, {from: ballot1Admin});
        ballot2 = await Ballot.new(election.address, ballot2Admin, {from: ballot2Admin});

        await election.addBallot(ballot1.address, {from: electionAdmin});
        await election.addBallot(ballot2.address, {from: electionAdmin});

        pool = await RegistrationPool.new({from: poolAdmin});

        //pool specifies which ballots it attempts to invoke
        await pool.addBallot(ballot1.address, {from: poolAdmin});
        await pool.addBallot(ballot2.address, {from: poolAdmin});

        //ballots specify which pools are allowed, set metadata
        await ballot1.addPool(pool.address, {from: ballot1Admin});

        await ballot1.addPoolGroup(pool.address, "D5", {from: ballot1Admin});
        await ballot1.addPoolGroup(pool.address, "NY", {from: ballot1Admin});
        await ballot1.setMetadataLocation("ipfsReference", {from: ballot1Admin});


        await ballot2.addPool(pool.address, {from: ballot2Admin});
        await ballot2.addPoolGroup(pool.address, "D5", {from: ballot2Admin});
        await ballot2.addPoolGroup(pool.address, "NY", {from: ballot2Admin});
        await ballot2.setMetadataLocation("ipfsReference", {from: ballot2Admin});

        //all activate their respective parts
        await election.activate({from: electionAdmin});
        await ballot1.activate({from: ballot1Admin});
        await ballot2.activate({from: ballot2Admin});
        await pool.activate({from: poolAdmin})
    });

    it("should let me vote", async function () {
        //await pool.castVote("encrypted-vote", {from: voter});

        await console.log("hello")
    });
});
