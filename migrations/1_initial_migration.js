var Migrations = artifacts.require("./Migrations.sol");

const snooze = (ms) => { 
  console.log("sleeping "+ms)
  return new Promise(resolve => setTimeout(resolve, ms)); 
}

module.exports = function(deployer, network) {
  let sleepMs = (network === "mainnet") ? 60000 : 1;
  deployer.then(async()=>{
    await deployer.deploy(Migrations);
    await snooze(sleepMs);
  }).catch((e)=>{
    throw e;
  })
};
