let VoteAllowance = artifacts.require("./token/VoteAllowance.sol");

module.exports = function(deployer) {
    deployer.deploy(VoteAllowance);
};
