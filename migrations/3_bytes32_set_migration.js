let Bytes32Set = artifacts.require("./lib/Bytes32Set.sol");
let TieredBallot = artifacts.require("./elections/tiered/TieredBallot.sol");
let TieredElection = artifacts.require("./elections/tiered/TieredElection.sol");
let TieredPool = artifacts.require("./elections/tiered/TieredPool.sol");
let BallotRegistry = artifacts.require("./elections/links/BallotRegistry.sol");
let PoolRegistry = artifacts.require("./elections/links/PoolRegistry.sol");
let BasicElection = artifacts.require("./elections/basic/BasicElection.sol");

module.exports = function(deployer) {
    deployer.deploy(Bytes32Set);
    deployer.link(Bytes32Set, [TieredElection, TieredBallot, TieredPool, BasicElection, BallotRegistry, PoolRegistry]);
};
