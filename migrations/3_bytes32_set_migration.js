let Bytes32Set = artifacts.require("./lib/Bytes32Set.sol");
let Ballot = artifacts.require("./elections/Ballot.sol");

module.exports = function(deployer) {
    deployer.deploy(Bytes32Set);
    deployer.link(Bytes32Set, Ballot);
};
