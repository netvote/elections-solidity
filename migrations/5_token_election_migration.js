let NoRemovalBytes32Set = artifacts.require("./lib/NoRemovalBytes32Set.sol");
let AddressSet = artifacts.require("./lib/AddressSet.sol");
let TokenElection = artifacts.require("./elections/token/TokenElection.sol");

const snooze = (ms) => { 
    console.log("sleeping "+ms)
    return new Promise(resolve => setTimeout(resolve, ms)); 
}
module.exports = async(deployer, network)=> {
    let sleepMs = (network === "mainnet") ? 60000 : 1;

    deployer.then(async()=>{
        await snooze(sleepMs);
        await deployer.link(NoRemovalBytes32Set, [TokenElection])
        await snooze(sleepMs);
        await deployer.link(AddressSet, [TokenElection]);
        await snooze(sleepMs);
    }).catch((e)=>{
        throw e;
    })
};