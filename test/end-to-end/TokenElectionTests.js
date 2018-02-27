const election = require("./jslib/basic-election.js");

contract('Token Election', function (accounts) {

    let config;
    let vote1;
    let vote2;

    before(async () => {

        let voteConfig = {
            ballotCount: 1,
            optionsPerBallot: 5,
            writeInCount: 0
        };

        vote1 = await election.generateEncryptedVote(voteConfig);
        vote2 = await election.generateEncryptedVote(voteConfig);

        config = await election.doEndToEndTokenElectionAutoActivate({
            account: {
                allowance: 3,
                owner: accounts[0]
            },
            netvote: accounts[1],
            admin: accounts[2],
            allowUpdates: false,
            autoActivate: true,
            gateway: accounts[3],
            encryptionKey: "123e4567e89b12d3a456426655440000",
            metadata: "ipfs1",
            voters: {
                voter1: {
                    voteId: "vote-id-1",
                    vote: vote1
                },
                voter2: {
                    voteId: "vote-id-2",
                    vote: vote2
                }
            }
        });
    });

    it("should have 2 votes", async function () {
        let voteCount = await config.contract.getVoteCount();
        assert.equal(voteCount, 2, "expected 2 votes");
    });

    it("should have both votes present", async function () {
        let vote1 = await config.contract.getVoteAt(0);
        let vote2 = await config.contract.getVoteAt(1);
        let votes = [vote1, vote2];
        assert.equal(votes.indexOf(vote1) > -1, true, "expected first vote");
        assert.equal(votes.indexOf(vote2) > -1, true, "expected second vote");
    });

    it("should be assigned to correct voteId", async function () {
        let vote1 = await config.contract.votes("vote-id-1");
        let vote2 = await config.contract.votes("vote-id-2");

        assert.equal(vote1, vote1, "expected first vote");
        assert.equal(vote2, vote2, "expected second vote");
    });

    it("should have decryption key", async function () {
        let key = await config.contract.privateKey();
        assert.equal(key, config.encryptionKey, "key should match");
    });

    it("should have 1 vote left", async function () {
        let votesLeft = await config.allowanceContract.balanceOf(config.contract.address);
        assert.equal(votesLeft.toNumber(), web3.toWei(1, 'ether'), "expected 1 vote left (3 - 2 = 1)");
        await config.contract.withdrawAllVotes({from: config.account.owner })
        votesLeft = await config.allowanceContract.balanceOf(config.contract.address);
        assert.equal(votesLeft.toNumber(), 0, "expected 0 votes left");
    });
});
