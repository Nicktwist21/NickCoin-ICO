import { BigNumber, Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Web3Modal from "web3modal";
import {
  NFT_CONTRACT_ABI,
  NFT_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";
import styles from "../styles/Home.module.css";

export default function Home() {
  const zero = BigNumber.from(0);
  const [walletConnected, setWalletConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  // tokensToBeClaimed keeps track of the number of nickcoins that can be claimed based on the number of NFT's the user holds
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);
  // balanceOfNickCoins keeps track of coins held by the user
  const [balanceOfNickCoins, setBalanceOfNickCoins] = useState(zero);
  const [tokenAmount, setTokenAmount] = useState(zero);
  const [tokensMinted, setTokensMinted] = useState(zero);
  
  const web3ModalRef = useRef();

  // getTokensToBeClaimed: checks balance of tokens that can be claimed by the user
  const getTokensToBeClaimed = async () => {
    try {
      const provider = await getProviderOrSigner();
      // An instance of NFT contract
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );
      // An instance of tokenContract
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );

      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      const balance = await nftContract.balanceOf(address);
      
      if (balance === zero) {
        setTokensToBeClaimed(zero);
      } else {

        var amount = 0;
        for (var i = 0; i < balance; i++) {
          const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
          const claimed = await tokenContract.tokenIdsClaimed(tokenId);
          if(!claimed) {
            amount++;
          }
        }

        setTokensToBeClaimed(BigNumber.from(amount));
      }
    } catch (err) {
      console.error(err);
      setTokensToBeClaimed(zero);
    }
  };
  
  const getBalanceOfNickCoins = async () => {
    try {
      
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );

      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      const balance = await tokenContract.balanceOf(address);
      setBalanceOfNickCoins(balance);
    } catch (err) {
      console.error(err);
      getBalanceOfNickCoins(zero);
    }
  };
  const mintNickCoin = async (amount) => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );
        // Each NickCoin is worth 0.001 ether 
        const value = 0.001 * amount;
        const tx = await tokenContract.mint(amount, {
          value: utils.parseEther(value.toString()),
        });
        setLoading(true);
        await tx.wait();
        setLoading(false);
        window.alert("Congratulations! You Have Successfully Minted NickCoins!");
        await getBalanceOfNickCoins();
        await getTotalTokensMinted();
        await getTokensToBeClaimed();
        
      } catch (err) {
        console.error(err);
      }
    };
    
    const claimNickCoins = async () => {
      try {
        const signer = await getProviderOrSigner(true);
        const tokenContract = new Contract(
          TOKEN_CONTRACT_ADDRESS,
          TOKEN_CONTRACT_ABI,
          signer
        );
        const tx = await tokenContract.claim();
        setLoading(true);
        await tx.wait();
        setLoading(false);
        window.alert("You Have Successfully Claimed NickCoins!");
        await getBalanceOfNickCoins();
        await getTotalTokensMinted();
        await getTokensToBeClaimed();

        } catch (err) {
          console.error(err);
        }
      };
    // Retrieves amount of tokens currently minted out of total supply
      const getTotalTokensMinted = async () => {
        try {
          const provider = await getProviderOrSigner();

          const tokenContract = new Contract(
            TOKEN_CONTRACT_ADDRESS,
            TOKEN_CONTRACT_ABI,
            provider
          );

          const _tokensMinted = await tokenContract.totalSupply();
          setTokensMinted(_tokensMinted);

        } catch (err) {
          console.error(err);
        }
      };
      
      const getProviderOrSigner = async (needSigner = false) => {
        const provider = await web3ModalRef.current.connect();
        const web3Provider = new providers.Web3Provider(provider);
    
        const { chainId } = await web3Provider.getNetwork();
        if (chainId !== 4) {
          window.alert("Change the network to Rinkeby");
          throw new Error("Change network to Rinkeby");
        }
    
        if (needSigner) {
          const signer = web3Provider.getSigner();
          return signer;
        }
        return web3Provider;
      };

      const connectWallet = async () => {
        try {
          await getProviderOrSigner();
          setWalletConnected(true);
        } catch (err) {
          console.error(err);
        }
      };

      useEffect(() => {

        if (!walletConnected) {

        web3ModalRef.current = new Web3Modal({
            network: "rinkeby",
            providerOptions: {},
            disableInjectedProvider: false,
          });
          connectWallet();
          getTotalTokensMinted();
          getBalanceOfNickCoins();
          getTokensToBeClaimed();
        }
      }, [walletConnected]);

      const renderButton = () => {
        if (loading) {
          return (
            <div>
              <button className={styles.button}>Loading...</button>
            </div>
          );
        }
        if (tokensToBeClaimed > 0) {
          return (
            <div>
              <div className={styles.description}>
                {tokensToBeClaimed * 50} Tokens Can Be Claimed!
              </div>
              <button className={styles.button} onClick={claimNickCoins}>
                Claim Tokens
                </button>
            </div>
          );
        }
        //Trigger mint button if user doesnt have tokens to claim
        return (
          <div style={{ display: "flex-col" }}>
            <div>
              <input
              type="number"
              placeholder="Amount of NickCoins"
              // BigNumber.from converts the `e.target.value` to a BigNumber
              onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
              className={styles.input}
              />
            </div>

            <button 
            className={styles.button}
            disabled={!(tokenAmount > 0)}
            onClick={() => mintNickCoin(tokenAmount)}
            >
              Mint NickCoins
            </button>
          </div>
        );
      };

      return (
        <div>
          <Head>
            <title>NickCoin ICO</title>
            <meta name="description" content="ICO-Dapp" />
            <link rel="icon" href="/favicon.ico" />
          </Head>
          <div className={styles.main}>
            <div>
              <h1 className={styles.title}>Welcome to the NickCoin ICO!</h1>
              <div className={styles.title2}>
                NFT holders recieve 50 free NickCoins! Claim/Mint NickCoins Below
              </div>
              {walletConnected ? (
                <div>
                  <div className={styles.description}>
                    {/* Format Ether helps us in converting a BigNumber to string */}
                    You have minted {utils.formatEther(balanceOfNickCoins)} NickCoin
                  </div>
                  <div className={styles.description}>
                    {/* Format Ether helps us in converting a BigNumber to string */}
                    Overall {utils.formatEther(tokensMinted)}/10000 have been minted!
                  </div>
                  {renderButton()}
                </div>
              ) : (
                <button onClick={connectWallet} className={styles.button}>
                  Connect your wallet
                </button>
              )}
            </div>
            <div>
              <img className={styles.image} src="./cryptodevs/0.svg" />
            </div>
          </div>
    
          <footer className={styles.footer}>
            Made with &#10084; by Nick Calhoun 
          </footer>
        </div>
      );
    }

