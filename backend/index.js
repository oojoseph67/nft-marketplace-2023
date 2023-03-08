const express = require("express");
const Moralis = require("moralis").default;
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = 9000;

app.use(cors());
app.use(express.json());

app.get("/nftBalance", async (req, res) => {
  const { query } = req;
  const response = await Moralis.EvmApi.nft.getWalletNFTs({
    address: query.address,
    chain: query.chain,
  });

  console.log(response.raw)

  return res.status(200).json(response)
});

Moralis.start({
  apiKey: process.env.MORALIS_API_KEY,
}).then(() => {
  app.listen(port, () => {
    console.log(`Listening for API Calls`);
  });
});
