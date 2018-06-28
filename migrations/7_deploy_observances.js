let Observances = artifacts.require("./observances/Observances.sol");

module.exports = function(deployer) {
    deployer.deploy(Observances);
};