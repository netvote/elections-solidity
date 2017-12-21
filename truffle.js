let HDWalletProvider = require("truffle-hdwallet-provider");

// hidden local file
let ropstenCreds = require('./.ropsten.json');

module.exports = {
    networks: {
        development: {
            host: "localhost",
            port: 9545,
            network_id: "*" // Match any network id
        },
        ropsten: {
            gas: 4700036,
            provider: new HDWalletProvider(ropstenCreds.mneumonic, "https://ropsten.infura.io/"+ropstenCreds.accesskey),
            network_id: 3
        },
        testing: {
            host: "localhost",
            port: 8545,
            network_id: "*",
            gas: 2e7,
        },
        ganache: {
            host: "127.0.0.1",
            port: 7545,
            network_id: "*" // Match any network id
        }
    }
};
