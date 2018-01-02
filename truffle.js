let HDWalletProvider = require("truffle-hdwallet-provider");

module.exports = {
    networks: {
        development: {
            host: "localhost",
            port: 9545,
            network_id: "*" // Match any network id
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
