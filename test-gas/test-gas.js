contract('GAS: Basic Election GAS Analysis', function (accounts) {

    const election = require("../test/end-to-end/jslib/basic-election.js");

    const proofThreshold = 130000;

    let scenarios = [
        {
            ballotCount: 1,
            optionsPerBallot: 1,
            writeInCount: 0,
            voteGasLimit: 189000
        },
        {
            ballotCount: 1,
            optionsPerBallot: 5,
            writeInCount: 0,
            voteGasLimit: 231000
        },
        {
            ballotCount: 1,
            optionsPerBallot: 10,
            writeInCount: 0,
            voteGasLimit: 235000
        },
        {
            ballotCount: 1,
            optionsPerBallot: 10,
            writeInCount: 2,
            voteGasLimit: 280000
        },
        {
            ballotCount: 1,
            optionsPerBallot: 20,
            writeInCount: 2,
            voteGasLimit: 320000
        }
    ];

    scenarios.forEach(async (scenario)=> {

        let config = {
            account: {
                allowance: 3,
                owner: accounts[0]
            },
            netvote: accounts[1],
            admin: accounts[2],
            allowUpdates: false,
            autoActivate: false,
            gateway: accounts[3],
            encryptionKey: "123e4567e89b12d3a456426655440000",
            metadata: "QmecMiWvcuB2nsgyL8Wtgp9DMR9gCVqybsb2MfAmcJV1kM",
            voters: {
                voter1: {
                    voteId: "vote-id-1",
                    proof: "QmecMiWvcuB2nsgyL8Wtgp9DMR9gCVqybsb2MfAmcJV1kM"
                }
            }
        };

        [true, false].forEach(async (submitWithProof) => {
            config.gasAmount = {};
            let limit = submitWithProof ? scenario.voteGasLimit + proofThreshold : scenario.voteGasLimit;
            it("should use less than "+limit+" gas (ballot="+scenario.ballotCount+", options="+scenario.optionsPerBallot+", writeIns="+scenario.writeInCount+", proof="+submitWithProof, async function () {
                config.voters.voter1.vote = await election.generateEncryptedVote(scenario, submitWithProof);
                config.autoActivate = true;
                config.submitWithProof = submitWithProof;
                config = await election.doEndToEndElection(config);
                console.log("gas="+config["gasAmount"]["Cast Vote"]);
                assert.equal(config["gasAmount"]["Cast Vote"] <= limit, true, "Vote Gas Limit Exceeded, limit="+limit+", actual="+config["gasAmount"]["Cast Vote"])
            });
        })
    });
});

contract('GAS: Tiered Election GAS Analysis', function (accounts) {

    const election = require("../test/end-to-end/jslib/tiered-election.js");


    let threshold = 35000;

    let scenarios = [
        {
            ballotCount: 1,
            poolCount: 1,
            optionsPerBallot: 1,
            writeInCount: 0,
            voteGasLimit: 233968
        },
        {
            ballotCount: 2,
            poolCount: 1,
            optionsPerBallot: 20,
            writeInCount: 0,
            voteGasLimit: 481431
        },
        {
            ballotCount: 3,
            poolCount: 1,
            optionsPerBallot: 10,
            writeInCount: 2,
            voteGasLimit: 532311
        },
        {
            ballotCount: 3,
            poolCount: 1,
            optionsPerBallot: 20,
            writeInCount: 0,
            voteGasLimit: 621383
        },
        {
            ballotCount: 3,
            poolCount: 1,
            optionsPerBallot: 20,
            writeInCount: 2,
            voteGasLimit: 644147
        }
    ];

    scenarios.forEach(async (scenario)=> {
        it("should use less than "+(threshold+scenario.voteGasLimit)+" gas (ballot="+scenario.ballotCount+", options="+scenario.optionsPerBallot+", writeIns="+scenario.writeInCount+")", async function () {
            let config = {
                account: {
                    allowance: 2,
                    owner: accounts[7]
                },
                netvote: accounts[0],
                admin: accounts[1],
                allowUpdates: false,
                gateway: accounts[8],
                ballots: {},
                pools: {},
                voters: {
                    voter1: {
                        pool: "pool1",
                        address: accounts[6]
                    }
                }
            };

            config.voters.voter1["vote"] = await election.generateEncryptedVote(scenario);

            let ballots = [];
            for(let i=1; i<=scenario.ballotCount; i++){
                config.ballots["ballot"+i] = {
                    admin: accounts[2],
                    metadata: "ipfs1",
                    groups: []
                };
                ballots.push("ballot"+i)
            }

            for(let i=1; i<=scenario.poolCount; i++){
                config.pools["pool"+i] = {
                    admin: accounts[4],
                    groups: [],
                    ballots: ballots
                }
            }

            config.gasAmount = {};
            config = await election.doEndToEndElection(config);
            console.log("gas="+config["gasAmount"]["Cast Vote"]);
            assert.equal(config["gasAmount"]["Cast Vote"] <= (threshold + scenario.voteGasLimit), true, "Vote Gas Limit Exceeded, limit="+scenario.voteGasLimit+", actual="+config["gasAmount"]["Cast Vote"])
        });
    });

});
