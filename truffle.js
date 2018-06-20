let HDWalletProvider = require("truffle-hdwallet-provider");

const providerWithMnemonic = (mnemonic, rpcEndpoint) => {
    new HDWalletProvider(mnemonic, rpcEndpoint);
}

const infuraProvider = network => {
    return providerWithMnemonic(process.env.MNEMONIC, `https://${network}.infura.io/${process.env.INFURA_API_KEY}`);
};

const netvoteProvider = (url) => {
    return new HDWalletProvider(process.env.MNEMONIC, url)
}

module.exports = {
    networks: {
        development: {
            host: "localhost",
            port: 8545,
            network_id: "*", // Match any network id
            gas: 2e7,
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
        },
        netvote: {
            provider: () => netvoteProvider("http://localhost:8545"),
            network_id: "1984",
	        gas: 4612388
        },
        ropsten: {
            provider: () => infuraProvider('ropsten'),
            network_id: 3,
            gas: 4612388
        },
    },
    solc: {
        optimizer: {
            enabled: true,
            runs: 200
        }
    }
};
