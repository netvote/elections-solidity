let AddressSet = artifacts.require("./lib/AddressSet.sol");
let Election = artifacts.require("./elections/Election.sol");
let Ballot = artifacts.require("./elections/Ballot.sol");
let RegistrationPool = artifacts.require("./elections/RegistrationPool.sol");


module.exports = function(deployer) {
    deployer.deploy(AddressSet);
    deployer.link(AddressSet, [Election, Ballot, RegistrationPool]);
};
