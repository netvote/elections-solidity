const protobuf = require("protobufjs");
const crypto = require('crypto');
let BasicElection = artifacts.require("BasicElection");
let VoteAllowance = artifacts.require("VoteAllowance");

const ENCRYPT_ALGORITHM = "aes-256-cbc";
const ENCRYPT_KEY = "123e4567e89b12d3a456426655440000";

// for debugging
let log = (msg) => {
    //console.log(msg);
};

let logObj = (name, obj) => {
    console.log(name+": \n"+JSON.stringify(obj,null,"\t"));
};

let randomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return parseInt(Math.floor(Math.random() * (max - min)) + min);
};

function encrypt(text) {
    let cipher = crypto.createCipher(ENCRYPT_ALGORITHM, ENCRYPT_KEY);
    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");
    return encrypted;
}

const toEncodedVote = async (payload) => {
    let root = await protobuf.load("protocol/vote.proto");
    let Vote = root.lookupType("netvote.Vote");
    let errMsg = Vote.verify(payload);
    if (errMsg) {
        console.error("invalid:"+errMsg);
        throw Error(errMsg);
    }

    let vote = Vote.create(payload);
    return Vote.encode(vote).finish();
};

const encode = (buff, enc)=>{
    return buff.toString(enc);
};

const toEncryptedVote = async (json) => {
    let encodedVote = await toEncodedVote(json);
    encode(encodedVote, "utf8");
    encode(encodedVote, "ascii");
    encode(encodedVote, "hex");
    encode(encodedVote, "base64");
    return encrypt(encodedVote);
};

let generateEncryptedVote = async (voteConfig) => {
    let ballotCount = voteConfig.ballotCount;
    let optionsPerBallot = voteConfig.optionsPerBallot;
    let writeInCount = voteConfig.writeInCount;

    let seed = randomInt(0, 2000000);
    let vote = {
        encryptionSeed: seed,
        ballotVotes: []
    };
    for(let i=0; i<ballotCount; i++){
        let ballotVote = {
            choices: []
        };
        for(let j=0; j<optionsPerBallot; j++){
            if(writeInCount > 0){
                writeInCount--;
                ballotVote.choices.push({
                    writeIn: "Write-In Value"
                });
            }else {
                ballotVote.choices.push({
                    selection: randomInt(0, 5)
                });
            }
        }
        vote.ballotVotes.push(ballotVote);
    }
    return await toEncryptedVote(vote);
};

let measureGas = async(config, name) => {
    if(!config["gasAmount"]){
        config["gasAmount"] = {};
    }
    let lastBlock = await web3.eth.getBlock("latest");
    config["gasAmount"][name] = lastBlock.gasUsed;
    return config
};

let printGas = (config) => {
    logObj("Gas Amounts", config["gasAmount"]);
};

let setupVoteAllowance = async(config) => {
    log("setup vote allowance");
    let va = await VoteAllowance.new({from: config.netvote});
    config.allowanceContract = va;
    await va.addVotes(config.account.owner, config.account.allowance, {from: config.netvote});
    return config;
};

let createBasicElection = async(config) => {
    log("create election");
    config.contract = await BasicElection.new(config.allowanceContract.address, config.account.owner, config.allowUpdates, config.netvote, config.metadata, config.gateway, config.autoActivate, {from: config.admin });
    config = await measureGas(config, "Create Basic Election");
    await config.allowanceContract.addElection(config.contract.address, {from: config.account.owner});
    config = await measureGas(config, "Allowance: authorize election");
    return config;
};

let activateElection = async(config) => {
    log("activating election");
    if(!config.autoActivate) {
        await config.contract.activate({from: config.admin});
        config = await measureGas(config, "Activate Election");
    }
    return config;
};

let castVotes = async(config) => {
    log("voting");
    for (let name in config.voters) {
        if (config.voters.hasOwnProperty(name)) {
            let voter = config.voters[name];
            await config.contract.castVote(voter.voteId, voter.vote, {from: config.gateway});
            config = await measureGas(config, "Cast Vote");
            if(voter.updateVote){
                await config.contract.updateVote(voter.voteId, voter.updateVote, {from: config.gateway});
                config = await measureGas(config, "Update Vote");
            }
        }
    }
    return config;
};

let closeElection = async(config) => {
    log("closing election");
    await config.contract.close({from: config.admin});
    config = await measureGas(config, "Close Election");
    return config;
};

let releaseKey = async(config) => {
    log("set decryption key");
    await config.contract.setPrivateKey(config.encryptionKey, {from: config.netvote});
    config = await measureGas(config, "Set Decryption Key");
    return config;
};

let doTransactions = async(transactions, config) => {
    for(let tx of transactions) {
        config = await tx(config);
    }
    return config;
};

let doEndToEndElectionAutoActivate = async(config) => {
    return await doTransactions([
        setupVoteAllowance,
        createBasicElection,
        castVotes,
        closeElection,
        releaseKey
    ], config);
};

let doEndToEndElection = async(config) => {
    return await doTransactions([
        setupVoteAllowance,
        createBasicElection,
        activateElection,
        castVotes,
        closeElection,
        releaseKey
    ], config);
};

module.exports = {
    doEndToEndElection,
    doEndToEndElectionAutoActivate,
    generateEncryptedVote,
    toEncryptedVote,
    doTransactions,
    createBasicElection,
    setupVoteAllowance,
    castVotes
};