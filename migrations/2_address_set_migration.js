let AddressSet = artifacts.require("./lib/AddressSet.sol");
let TieredBallot = artifacts.require("./elections/tiered/TieredBallot.sol");
let TieredElection = artifacts.require("./elections/tiered/TieredElection.sol");
let TieredPool = artifacts.require("./elections/tiered/TieredPool.sol");
let BasePool = artifacts.require("./elections/tiered/BasePool.sol");
let BallotRegistry = artifacts.require("./elections/links/BallotRegistry.sol");
let PoolRegistry = artifacts.require("./elections/links/PoolRegistry.sol");
let BasicElection = artifacts.require("./elections/basic/BasicElection.sol");

const snooze = (ms) => { 
    console.log("sleeping "+ms)
    return new Promise(resolve => setTimeout(resolve, ms)); 
}

module.exports = async (deployer, network) => {
    let sleepMs = (network === "mainnet") ? 60000 : 1;

    deployer.then(async() => {
        await snooze(sleepMs)
        await deployer.deploy(AddressSet)
        await snooze(sleepMs)
        await deployer.link(AddressSet, [TieredElection, TieredBallot, TieredPool, BasePool, BasicElection, BallotRegistry, PoolRegistry])
        await snooze(sleepMs)
    }).catch((e)=>{
        throw e;
    })
};
