import {
  useEffect,
  useState
} from "react"
import {
  ConnectWallet,
  useNetwork,
  useNetworkMismatch,
  useAddress,
  useContract,
  useActiveListings,
  MediaRenderer,
  ChainId,
} from "@thirdweb-dev/react";
import { BigNumber } from "ethers";
import styles from "../styles/Home.module.css";
import shortenAddress from "../utils/shortenAddress";

export default function Home() {
  const address = useAddress();
  console.log("address", address);

  const isMismatched = useNetworkMismatch()
  const [, switchNetwork] = useNetwork()

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
    if(isMismatched) {
      await switchNetwork(ChainId.BinanceSmartChainTestnet)
    }
  }

  useEffect(() => {
    networkCheck()
  }, [address])

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1>NFT Marketplace</h1>
        <ConnectWallet />
        <br></br>
        <h1>
          Active Listing
        </h1>
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
                                console.log("buyNFT", buyNFT)
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
      </main>
    </div>
  );
}
