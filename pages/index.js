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
} from "@thirdweb-dev/react";
import { BigNumber } from "ethers";
import styles from "../styles/Home.module.css";
import axios from "axios"
import shortenAddress from "../utils/shortenAddress";

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
  }, [address]);

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
                    {!address ? (
                      <div>
                        <p> Please Connect Your Wallet </p>
                      </div>
                    ) : (
                      <div>
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
          {
            nftBalance && nftBalance.map((nft) => {
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
                </div>
              );
            })
          }
        </div>
      </main>
    </div>
  );
}
