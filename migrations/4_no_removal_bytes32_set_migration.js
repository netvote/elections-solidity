let NoRemovalBytes32Set = artifacts.require("./lib/NoRemovalBytes32Set.sol");
let TieredBallot = artifacts.require("./elections/tiered/TieredBallot.sol");
let TieredElection = artifacts.require("./elections/tiered/TieredElection.sol");
let TieredPool = artifacts.require("./elections/tiered/TieredPool.sol");
let BasePool = artifacts.require("./elections/tiered/BasePool.sol");
let BallotRegistry = artifacts.require("./elections/links/BallotRegistry.sol");
let PoolRegistry = artifacts.require("./elections/links/PoolRegistry.sol");
let BasicElection = artifacts.require("./elections/basic/BasicElection.sol");

module.exports = function(deployer) {
    deployer.deploy(NoRemovalBytes32Set);
    deployer.link(NoRemovalBytes32Set, [TieredElection, TieredBallot, TieredPool, BasePool, BasicElection, BallotRegistry, PoolRegistry]);
};
