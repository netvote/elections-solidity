let HDWalletProvider = require("truffle-hdwallet-provider");

const providerWithMnemonic = (mnemonic, rpcEndpoint) => {
    return new HDWalletProvider(mnemonic, rpcEndpoint);
}

const infuraProvider = network => {
    let mnemonic = (network === "mainnet") ? process.env.MAIN_MNEMONIC : process.env.MNEMONIC;
    return providerWithMnemonic(mnemonic, `https://${network}.infura.io/v3/${process.env.INFURA_API_KEY}`);
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
            provider: () => netvoteProvider("https://eth.netvote.io"),
            network_id: "1984",
            gas: 4612388
        },
        ropsten: {
            provider: () => infuraProvider('ropsten'),
            network_id: 3,
            gas: 4612388,
            gasPrice: 99000000000
        },
        mainnet: {
            provider: () => infuraProvider('mainnet'),
            network_id: 1,
            gas: 4612388,
            gasPrice: 10000000000
        }
    },
    solc: {
        optimizer: {
            enabled: true,
            runs: 200
        }
    }
};
