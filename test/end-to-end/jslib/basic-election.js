const protobuf = require("protobufjs");
const crypto = require('crypto');
const ursa = require('ursa');

let BasicElection;
let TokenElection;
let Vote;
const Web3 = require("web3");
const uuid = require('uuid/v4');

const ENCRYPT_ALGORITHM = "aes-256-cbc";
const ENCRYPT_KEY = "123e4567e89b12d3a456426655440000";

// used to run these outside of a test context (e.g., truffle exec)
let initContracts = (provider) => {
    const contract = require("truffle-contract");
    BasicElection = contract(require("../../../build/contracts/BasicElection.json"));
    TokenElection = contract(require("../../../build/contracts/TokenElection.json"));
    Vote = contract(require("../../../build/contracts/Vote.json"));
    //hack to override the missing truffle testing web3 for other use cases (scripts on truffle)
    web3 = new Web3(provider);
    [TokenElection, BasicElection, Vote].forEach(async (c)=> {
        c.setProvider(provider);
        c.defaults({
            gas: 4712388,
            gasPrice: 1
        })
    });
};

let initTestContracts = () => {
    if(BasicElection === undefined) {
        BasicElection = artifacts.require("BasicElection");
        TokenElection = artifacts.require("TokenElection");
        Vote = artifacts.require("Vote");
    }
};

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

const signVote = async (voteBase64) => {
    let keyPair = ursa.generatePrivateKey();
    let pub = keyPair.toPublicPem('base64');
    let data = new Buffer(voteBase64);
    let sig = keyPair.hashAndSign('md5', data);
    return {
        signature: sig,
        publicKey: pub
    }
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

let generateEncryptedVote = async (voteConfig, submitWithProof) => {
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
    if(submitWithProof) {
        vote.signatureSeed = uuid();
    }
    return await toEncryptedVote(vote);
};

let measureGas = async(config, name) => {
    if(!config.skipGasMeasurment) {
        if (!config["gasAmount"]) {
            config["gasAmount"] = {};
        }
        let lastBlock = await web3.eth.getBlock("latest");
        config["gasAmount"][name] = lastBlock.gasUsed;
    }
    return config
};

let printGas = (config) => {
    logObj("Gas Amounts", config["gasAmount"]);
};

let setupVoteToken = async(config) => {
    log("setup vote allowance");
    let va = await Vote.new({from: config.netvote});
    config.allowanceContract = va;
    await va.mint(config.account.owner, web3.toWei(50, "ether"), {from: config.netvote});
    return config;
};

let createTokenElection = async(config) => {
    log("create token election");
    let balanceDate = (new Date().getTime()-100000)/1000;
    config.contract = await TokenElection.new("uuid", config.allowanceContract.address, config.account.owner, config.allowUpdates, config.netvote, config.metadata, config.gateway, config.autoActivate, config.allowanceContract.address, balanceDate, {from: config.admin });
    config = await measureGas(config, "Create Token Election");
    let numVotes = 25;
    if(config.voters){
        numVotes = Object.keys(config.voters).length;
    }
    await config.allowanceContract.transfer(config.contract.address, web3.toWei(numVotes+1, 'ether'), {from: config.account.owner})
    await config.allowanceContract.addElection(config.contract.address, {from: config.netvote})
    config = await measureGas(config, "Allowance: authorize election");
    return config;
};

let createBasicElection = async(config) => {
    log("create basic election");
    config.contract = await BasicElection.new("uuid", config.allowanceContract.address, config.account.owner, config.allowUpdates, config.netvote, config.metadata, config.gateway, config.autoActivate, {from: config.admin });
    config = await measureGas(config, "Create Basic Election");
    let numVotes = 25;
    if(config.voters){
        numVotes = Object.keys(config.voters).length;
    }
    await config.allowanceContract.transfer(config.contract.address, web3.toWei(numVotes+1, 'ether'), {from: config.account.owner})
    await config.allowanceContract.addElection(config.contract.address, {from: config.netvote})
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
            let jti = voter.voteId+"1";
            if(config.submitWithProof){
                await config.contract.castVoteWithProof(voter.voteId, voter.vote, jti, config.proof, {from: config.gateway});
            } else { 
                await config.contract.castVote(voter.voteId, voter.vote, jti, {from: config.gateway});
            }
            
            config = await measureGas(config, "Cast Vote");
            if(voter.updateVote){
                jti = jti+"2";
                if(config.submitWithProof){
                    await config.contract.updateVoteWithProof(voter.voteId, voter.updateVote, jti, config.proof, {from: config.gateway});
                } else { 
                    await config.contract.updateVote(voter.voteId, voter.updateVote, jti, {from: config.gateway});
                }
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
    await config.contract.setPrivateKey(ENCRYPT_KEY, {from: config.netvote});
    config = await measureGas(config, "Set Decryption Key");
    return config;
};

let doTransactions = async(transactions, config) => {
    if(config.provider){
        let HDWalletProvider = require("truffle-hdwallet-provider");
        let p = (config.hdwallet) ? new HDWalletProvider(process.env.MNEMONIC, config.provider) : new Web3.providers.HttpProvider(provider);
        initContracts(p);
    } else {
        initTestContracts();
    }
    for(let tx of transactions) {
        config = await tx(config);
    }
    return config;
};

let doEndToEndElectionAutoActivate = async(config) => {
    return await doTransactions([
        setupVoteToken,
        createBasicElection,
        castVotes,
        closeElection,
        releaseKey
    ], config);
};


let doEndToEndTokenElectionAutoActivate = async(config) => {
    return await doTransactions([
        setupVoteToken,
        createTokenElection,
        castVotes,
        closeElection,
        releaseKey
    ], config);
};

let doEndToEndElection = async(config) => {
    return await doTransactions([
        setupVoteToken,
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
    doEndToEndTokenElectionAutoActivate,
    generateEncryptedVote,
    toEncryptedVote,
    toEncodedVote,
    doTransactions,
    createBasicElection,
    createTokenElection,
    setupVoteToken,
    castVotes,
    signVote
};