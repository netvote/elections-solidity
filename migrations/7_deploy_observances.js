let Observances = artifacts.require("./observances/Observances.sol");

const snooze = (ms) => { 
    console.log("sleeping "+ms)
    return new Promise(resolve => setTimeout(resolve, ms)); 
}

module.exports = async (deployer, network) => {
    let sleepMs = (network === "mainnet") ? 60000 : 1;

    deployer.then(async()=>{
        await snooze(sleepMs);
        await deployer.deploy(Observances);
        await snooze(sleepMs);
    }).catch((e)=>{
        throw e;
    })
};