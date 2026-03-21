require("@nomicfoundation/hardhat-toolbox");
require("solidity-docgen");
require("dotenv").config({ path: ".env.local" });

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  docgen: {
    outputDir: "docs",
    pages: "files",
    exclude: [],
  },
  sourcify: {
    enabled: true,
  },
  etherscan: {
    apiKey: {
      fuji: "snowtrace",
    },
    customChains: [
      {
        network: "fuji",
        chainId: 43113,
        urls: {
          apiURL: "https://api.routescan.io/v2/network/testnet/evm/43113/etherscan",
          browserURL: "https://43113.testnet.snowtrace.io",
        },
      },
    ],
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};
