import { useEffect, useState } from "react";
import {
  ConnectWallet,
  useNetwork,
  useNetworkMismatch,
  useAddress,
  useContract,
  useActiveListings,
  MediaRenderer,
  ChainId,
  useNFTBalance,
  useMakeBid,
} from "@thirdweb-dev/react";
import { BigNumber } from "ethers";
import styles from "../styles/Home.module.css";
import axios from "axios"
import shortenAddress from "../utils/shortenAddress";
import { NATIVE_TOKEN_ADDRESS } from "@thirdweb-dev/sdk";

const { default: Moralis } = require("moralis");

export default function Home() {
  const apiKey = process.env.NEXT_PUBLIC_MORALIS_API_KEY;

  const address = useAddress();
  console.log("address", address);

  const isMismatched = useNetworkMismatch();
  const [, switchNetwork] = useNetwork();
  const [nftBalance, setNFTBalance] = useState([])

  const { contract: marketplaceContract } = useContract(
    process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT,
    "marketplace"
  );
  console.log("Marketplace contract", marketplaceContract);

  const {
    data: listingData,
    isLoading: listingIsLoading,
    error: listingError,
  } = useActiveListings(marketplaceContract);
  console.log("listing details", listingData);

  // const {
  //   mutate: makeBid,
  //   isLoading: makeBidIsLoading,
  //   error: makeBidError
  // } = useMakeBid(marketplaceContract)

  // const buyNFT = async (listingId) => {
  //   try {
  //     const buyNFT = await marketplaceContract?.buyoutListing(
  //       BigNumber.from(listingId),
  //       1
  //     );
  //     alert(buyNFT);
  //   } catch (error) {
  //     console.error(error);
  //     console.log(error);
  //     // alert(error);
  //   }
  // };

  async function getActiveListing() {
    const listing = await marketplaceContract.getActiveListings();
    console.log("listing listing", listing)
  }

  async function networkCheck() {
    if (isMismatched) {
      await switchNetwork(ChainId.BinanceSmartChainTestnet);
    }
  }

  async function getNFTBalance() {
    if(address) {
       console.log("address inside nft get balance", address)
       try {
         const res = await axios.get(`http://localhost:9000/nftBalance`, {
           params: {
             address: address,
             chain: "0x61",
           },
         });
         console.log("nft balance", res.data.result);
        //  setNFTBalance(res.data.result)
        nftProcessing(res.data.result);
       } catch (error) {
         console.error(error);
         console.log(error);
       }
    }
  }

  function nftProcessing(nftData) {
    for(let i = 0; i < nftData.length; i++) {
      let meta = JSON.parse(nftData[i].metadata)
      if(meta && meta.image){
        if(meta.image.includes(".")) {
          nftData[i].image = meta.image
          nftData[i].token_name = meta.name
        } else {
          nftData[i].image = "https://ipfs.moralis.io:2053/ipfs/" + meta.image;
        }
      }
    }
    setNFTBalance(nftData)
  }

  useEffect(() => {
    networkCheck();
  }, [address]);

  useEffect(() => {
    getNFTBalance();
    getActiveListing()
  }, [address]);

  async function createAuctionListing(e) {
    // prevent page from refreshing
    e.preventDefault();
    
    let { contractAddress, tokenId, price } = e.target.elements

    contractAddress = contractAddress.value
    tokenId = tokenId.value
    price = price.value

    try {
      const tx = await marketplaceContract?.auction.createListing({
        assetContractAddress: contractAddress,
        buyoutPricePerToken: price, // buy out price
        currencyContractAddress: NATIVE_TOKEN_ADDRESS,
        listingDurationInSeconds: 60 * 60 * 24 * 7, // 1 week
        quantity: 1,
        reservePricePerToken: 0.05,
        startTimestamp: new Date(),
        tokenId: tokenId
      })

      console.log("auction tx", tx)
      const receipt = tx.receipt
      const listingId = tx.id
      console.log("receipt", receipt)
      console.log("listingId", listingId)
      
      return tx
    } catch (error) {
      console.error(error)
      console.log(error)
    }
  }

  async function createAuctionBid(e) {
    e.preventDefault()

    let { price, id } = e.target.elements

    console.log("price", price.value)
    console.log("id.value", id.value);

    price = price.value
    id = id.value

    try {
      const tx = await marketplaceContract?.auction.makeBid(
        id,
        price
      )

      console.log("auction tx", tx);
      const receipt = tx.receipt;
      console.log("receipt", receipt);
       
    } catch(error) {
      console.error(error);
      console.log(error);
    }
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1>NFT Marketplace</h1>
        <ConnectWallet />
        <br></br>
        <h1>Active Listing</h1>
        {!listingIsLoading ? (
          <div>
            {listingData &&
              listingData.map((nft) => {
                return (
                  <div key={nft.id}>
                    <MediaRenderer
                      src={nft.asset.image}
                      height="200px"
                      width="200px"
                    />
                    <p>Name: {nft.asset.name}</p>
                    <p>
                      Price: {nft.buyoutCurrencyValuePerToken.displayValue}{" "}
                      {nft.buyoutCurrencyValuePerToken.symbol}
                    </p>
                    <p>
                      Seller: {nft.sellerAddress.slice(0, 6)}...
                      {nft.sellerAddress.slice(nft.sellerAddress.length - 4)}
                    </p>
                    <p>
                      Listing Type:{" "}
                      {nft.type == 0 ? "Direct Listing" : "Auction Listing"}
                    </p>
                    {!address ? (
                      <div>
                        <p> Please Connect Your Wallet </p>
                      </div>
                    ) : (
                      <div>
                        {nft.type == 1 ? (
                          <>
                            <form onSubmit={(e) => createAuctionBid(e)}>
                              <input
                                type="number"
                                step="any"
                                name="price"
                                placeholder="Price"
                              />
                              <input
                                name="id"
                                value={nft.id}
                                hidden
                              />

                              <button type="submit">Price Offer</button>
                            </form>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={async () => {
                                try {
                                  const buyNFT =
                                    await marketplaceContract?.buyoutListing(
                                      BigNumber.from(nft.id),
                                      1
                                    );
                                  console.log("buyNFT", buyNFT);
                                  alert(buyNFT);
                                } catch (error) {
                                  console.error(error);
                                  console.log(error);
                                  // alert(error);
                                }
                              }}>
                              Buy Now
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        ) : (
          <div>Loading...</div>
        )}
        <h1>Wallet Holdings</h1>
        <div>
          {!address ? (
            <div>
              <p>Connect Your Wallet</p>
            </div>
          ) : (
            <div>
              {!nftBalance ? (
                nftBalance &&
                nftBalance.map((nft) => {
                  return (
                    <div key={nft.block_number}>
                      <MediaRenderer
                        src={nft.image}
                        height="200px"
                        width="200px"
                      />
                      <p>Name: {nft.token_name}</p>
                      <p>Collection Name: {nft.name}</p>
                      <p>Collection Symbol: {nft.symbol}</p>
                      <form onSubmit={(e) => createAuctionListing(e)}>
                        <input
                          name="contractAddress"
                          value={nft.token_address}
                          hidden
                        />
                        <input name="tokenId" value={nft.token_id} hidden />
                        <input type="number" name="price" placeholder="Price" />

                        <button type="submit">Auction NFT</button>
                      </form>
                    </div>
                  );
                })
              ) : (
                <>NO NFT IN THE WALLET</>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
