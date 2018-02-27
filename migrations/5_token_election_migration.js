let NoRemovalBytes32Set = artifacts.require("./lib/NoRemovalBytes32Set.sol");
let AddressSet = artifacts.require("./lib/AddressSet.sol");
let TokenElection = artifacts.require("./elections/token/TokenElection.sol");

module.exports = function(deployer) {
    deployer.link(NoRemovalBytes32Set, [TokenElection]);
    deployer.link(AddressSet, [TokenElection]);
};