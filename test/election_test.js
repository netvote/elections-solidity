let Election = artifacts.require("Election");
let Ballot = artifacts.require("Ballot");
let RegistrationPool = artifacts.require("RegistrationPool");

let getVotesByGroup = async (ballot, group) => {
    let poolCount = await ballot.groupPoolCount(group);
    let votes = [];
    for(let i=0; i<poolCount; i++){
        let p = await ballot.getGroupPool(group, i);
        let voterCount = await ballot.getPoolVoterCount(p);
        for(let j=0; j<voterCount;j++){
            let v = await ballot.getPoolVoter(p, j);
            let vt = await RegistrationPool.at(p).getVote(v);
            votes.push(vt);
        }
    }
    votes.sort();
    return votes;
};

contract('Election Admin Actions', function (accounts) {
    let election;
    let ballot1;
    let ballot2;
    let electionAdmin = accounts[1];
    let ballot1Admin = accounts[2];
    let ballot2Admin = accounts[3];
    let poolAdmin = accounts[4];
    let voter1 = accounts[5];
    let voter2 = accounts[6];
    let pool1;
    let pool2;

    /*******
     *
     *  Scenario:
     *  1 Election
     *  2 Ballots
     *  2 Pools (1 Voter each)
     *
     *  Both Pools point to Both Ballots
     *
     *  Results Groups:
     *  Pool 1 = D5, NY
     *  Pool 2 = D6, NY
     */

    beforeEach(async () => {
        election = await Election.new({from: electionAdmin});

        //ballot 1: create and add ballot to election
        ballot1 = await Ballot.new(election.address, ballot1Admin, {from: ballot1Admin});
        await ballot1.setMetadataLocation("ipfsReference1", {from: ballot1Admin});
        await election.addBallot(ballot1.address, {from: electionAdmin});

        //ballot 2: create and add ballot to election
        ballot2 = await Ballot.new(election.address, ballot2Admin, {from: ballot2Admin});
        await ballot2.setMetadataLocation("ipfsReference2", {from: ballot2Admin});
        await election.addBallot(ballot2.address, {from: electionAdmin});

        //pool1: create pool and map existing ballots
        pool1 = await RegistrationPool.new({from: poolAdmin});
        await pool1.addBallot(ballot1.address, {from: poolAdmin});
        await pool1.addBallot(ballot2.address, {from: poolAdmin});

        //pool2: create pool and map existing ballots
        pool2 = await RegistrationPool.new({from: poolAdmin});
        await pool2.addBallot(ballot1.address, {from: poolAdmin});
        await pool2.addBallot(ballot2.address, {from: poolAdmin});

        //ballot1: specify which pools are allowed, set metadata
        await ballot1.addPool(pool1.address, {from: ballot1Admin});
        await ballot1.addPoolGroup(pool1.address, "D5", {from: ballot1Admin});
        await ballot1.addPoolGroup(pool1.address, "NY", {from: ballot1Admin});
        await ballot1.addPool(pool2.address, {from: ballot1Admin});
        await ballot1.addPoolGroup(pool2.address, "D6", {from: ballot1Admin});
        await ballot1.addPoolGroup(pool2.address, "NY", {from: ballot1Admin});

        //ballot2: specify which pools are allowed, set metadata
        await ballot2.addPool(pool1.address, {from: ballot2Admin});
        await ballot2.addPoolGroup(pool1.address, "D5", {from: ballot2Admin});
        await ballot2.addPoolGroup(pool1.address, "NY", {from: ballot2Admin});
        await ballot2.addPool(pool2.address, {from: ballot2Admin});
        await ballot2.addPoolGroup(pool2.address, "D6", {from: ballot2Admin});
        await ballot2.addPoolGroup(pool2.address, "NY", {from: ballot2Admin});

        //all activate
        await election.activate({from: electionAdmin});
        await ballot1.activate({from: ballot1Admin});
        await ballot2.activate({from: ballot2Admin});
        await pool1.activate({from: poolAdmin});
        await pool2.activate({from: poolAdmin});

        // cast votes
        await pool1.castVote("encrypted-vote1", {from: voter1});
        await pool2.castVote("encrypted-vote2", {from: voter2});

        // close election
        await pool1.close({from: poolAdmin});
        await pool2.close({from: poolAdmin});
        await ballot1.close({from: ballot1Admin});
        await ballot2.close({from: ballot2Admin});
        await election.close({from: electionAdmin});
    });

    it("should get D5 voter by pool", async function() {
        let votes = await getVotesByGroup(ballot1, "D5");
        assert.equal(votes.length, 1);
        assert.equal(votes[0], "encrypted-vote1");
    });

    it("should get D6 voter by pool", async function() {
        let votes = await getVotesByGroup(ballot1, "D6");
        assert.equal(votes.length, 1);
        assert.equal(votes[0], "encrypted-vote2");
    });

    it("should get NY voters by pool", async function() {
        let votes = await getVotesByGroup(ballot1, "NY");
        assert.equal(votes.length, 2);
        assert.equal(votes[0], "encrypted-vote1");
        assert.equal(votes[1], "encrypted-vote2");
    });

    it("should get pools by group", async function () {
        let nyPoolCount = await ballot1.groupPoolCount("NY");
        let d6PoolCount = await ballot1.groupPoolCount("D6");
        assert.equal(nyPoolCount, 2);
        assert.equal(d6PoolCount, 1);
    });

    it("should store votes", async function () {
        let vote1 = await pool1.getVote(voter1, {from: voter1});
        assert.equal(vote1, "encrypted-vote1");
        let vote2 = await pool2.getVote(voter2, {from: voter2});
        assert.equal(vote2, "encrypted-vote2");
    });
});
