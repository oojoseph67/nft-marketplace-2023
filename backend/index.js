const express = require("express");
const app = express();
const cors = require("cors");
const { default: Moralis } = require("moralis");
const port = process.env.PORT || 9000;

require("dotenv").config();

const apiKey = process.env.MORALIS_API_KEY;

app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/nativeBalance", async (req, res) => {
  await Moralis.start({ apiKey: apiKey });

  try {
    const { address, chain } = req.query;

    const response = await Moralis.EvmApi.balance.getNativeBalance({
      address,
      chain,
    });
    console.log(response.result);
    const nativeBalance = response.data;

    let nativeCurrency;
    if (chain === "0x1") {
      nativeCurrency = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; //mainnet weth
    } else if (chain === "0x38") {
      nativeCurrency = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"; // mainnet wbnb
    }

    const nativePrice = await Moralis.EvmApi.token.getTokenPrice({
      address: nativeCurrency,
      chain: chain,
    });

    nativeBalance.usd = nativePrice.data.usdPrice;
    res.send(nativeBalance);
  } catch (e) {
    res.send(e);
  }
});

app.get("/tokenBalance", async (req, res) => {
  await Moralis.start({ apiKey: apiKey });

  try {
    const { address, chain } = req.query;

    const response = await Moralis.EvmApi.token.getWalletTokenBalances({
      address,
      chain,
    });

    let tokens = response.data;

    // async function getTokenPrices() {
    //   const tokens = [
    //     "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82", //CAKE
    //     "0x374cb8c27130e2c9e04f44303f3c8351b9de61c1", //ERROR
    //     "0xE02dF9e3e622DeBdD69fb838bB799E3F168902c5", //BAKE
    //   ];

    //   let response = [];

    //   for (let i = 0; i < tokens.length; i++) {
    //     try {
    //       const priceResponse = await Moralis.EvmApi.token.getTokenPrice({
    //         address: tokens[i],
    //         chain: EvmChain.BSC,
    //       });
    //       response.push(priceResponse.toJSON());
    //     } catch (error) {
    //       continue;
    //     }
    //   }
    // }

    let legitTokens = [];
    for (let i = 0; i < tokens.length; i++) {
      console.log(tokens[i].token_address);
      console.log(chain);

      try {
        const priceResponse = await Moralis.EvmApi.token.getTokenPrice({
          address: tokens[i].token_address,
          chain: chain,
        });
        tokens[i].usd = priceResponse.data.usdPrice;
        legitTokens.push(tokens[i]);
        // console.log(legitTokens)
      } catch (e) {
        continue;
      }
    }

    res.send(legitTokens);
  } catch (e) {
    res.send(e);
  }
});

app.get("/tokenTransfers", async (req, res) => {
  await Moralis.start({ apiKey: apiKey });

  try {
    const { address, chain } = req.query;

    const response = await Moralis.EvmApi.token.getWalletTokenTransfers({
      address,
      chain,
    });

    const userTransfers = response.data.result;
    let userTransfersArray = [];

    for (let i = 0; i < userTransfers.length; i++) {
      try {
        // console.log(userTransfers[i].address);
        const metaResponse = await Moralis.EvmApi.token.getTokenMetadata({
          addresses: [userTransfers[i].address],
          chain: chain,
        });
        //   console.log('metadata starts here')
        //   console.log(metaResponse.data)

        if (metaResponse.data) {
          userTransfers[i].decimals = metaResponse.data[0].decimals;
          userTransfers[i].symbol = metaResponse.data[0].symbol;
          userTransfers[i].name = metaResponse.data[0].name;
          userTransfersArray.push(userTransfers[i]);
        } else {
          console.log("no details for coin");
        }
      } catch (e) {
        continue;
      }
    }

    res.send(userTransfersArray);
  } catch (e) {
    console.log(e);
    res.send(e);
  }
});

app.get("/nftBalance", async (req, res) => {
  await Moralis.start({ apiKey: apiKey });

  try {
    const { address, chain } = req.query;

    const response = await Moralis.EvmApi.nft.getWalletNFTs({
      address,
      chain,
    });

    const userNFTs = response.data.result;

    res.send(userNFTs);
  } catch (e) {
    console.log(e);
    res.send(e);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
