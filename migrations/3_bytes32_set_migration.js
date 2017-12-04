let Bytes32Set = artifacts.require("./lib/Bytes32Set.sol");
let Ballot = artifacts.require("./elections/Ballot.sol");
let Election = artifacts.require("./elections/Election.sol");
let RegistrationPool = artifacts.require("./elections/RegistrationPool.sol");
let BallotRegistry = artifacts.require("./base/BallotRegistry.sol");
let PoolRegistry = artifacts.require("./base/PoolRegistry.sol");


module.exports = function(deployer) {
    deployer.deploy(Bytes32Set);
    deployer.link(Bytes32Set, [Election, Ballot, RegistrationPool, BallotRegistry, PoolRegistry]);
};
