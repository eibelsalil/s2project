import { useEffect, useState } from "react";
import styled from "styled-components";
import "./App.css";
import Countdown from "react-countdown";
import { Button, CircularProgress, Snackbar } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";

import * as anchor from "@project-serum/anchor";

import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { WalletDialogButton } from "@solana/wallet-adapter-material-ui";

import ReCAPTCHA from "react-google-recaptcha";

import {
  CandyMachine,
  awaitTransactionSignatureConfirmation,
  getCandyMachineState,
  mintOneToken,
  shortenAddress,
} from "./candy-machine";

// import { initializeApp } from "firebase/app";
// import { getDatabase, ref, set, onValue, get } from "firebase/database";

// // Set the configuration for your app
// // TODO: Replace with your project's config object

// const firebaseConfig = {
//   apiKey: process.env.REACT_APP_FB_API,
//   authDomain: process.env.REACT_APP_AUTH_DOMAIN,
//   projectID: process.env.REACT_APP_PROJECT_ID,
//   // For databases not in the us-central1 location, databaseURL will be of
//   // form https://[databaseName].[region].firebasedatabase.app.
//   // For example, https://your-database-123.europe-west1.firebasedatabase.app
//   databaseURL: process.env.REACT_APP_DATABASE_URL,
//   storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
// };

// const app = initializeApp(firebaseConfig);

// // Get a reference to the database service
// const db = getDatabase(app);

// async function readUserData(wallet: any) {
//   const readCountRef = ref(db, wallet);
//   let count;
//   onValue(readCountRef, (snapshot) => {
//     count = snapshot.val();
//   });
//   return count;
// }

// async function walletExist(wallet: any) {
//   const readCountRef = ref(db, wallet);
//   let count;
//   await onValue(readCountRef, (snapshot) => {
//     if (snapshot.exists()) count = true;
//     else count = false;
//   });
//   return count;
// }

// async function checkCount(count: any) {
//   if (count < 1) {
//     return true;
//   } else {
//     return false;
//   }
// }

// function writeUserData(wallet: any, count: any) {
//   console.log(count);
//   set(ref(db, wallet), count + 1);
// }

const ConnectButton = styled(WalletDialogButton)``;

const CounterText = styled.span``; // add your styles here

const MintContainer = styled.div``; // add your styles here

const MintButton = styled(Button)``; // add your styles here

export interface HomeProps {
  candyMachineId: anchor.web3.PublicKey;
  config: anchor.web3.PublicKey;
  connection: anchor.web3.Connection;
  startDate: number;
  treasury: anchor.web3.PublicKey;
  txTimeout: number;
}

const Home = (props: HomeProps) => {
  const [balance, setBalance] = useState<number>();
  const [isActive, setIsActive] = useState(false); // true when countdown complet
  const [isSoldOut, setIsSoldOut] = useState(false); // true when items remaining is zero
  const [isMinting, setIsMinting] = useState(false); // true when user got to press MINT
  const [itemsAvailable, setitemsAvailable] = useState<number>();
  const [itemsRemaining, setitemsRemaining] = useState<number>();
  const [captchaDone, setcaptchaDone] = useState(false);

  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: "",
    severity: undefined,
  });

  const [startDate, setStartDate] = useState(new Date(props.startDate));

  const wallet = useAnchorWallet();
  const [candyMachine, setCandyMachine] = useState<CandyMachine>();

  function onChange(value: any) {
    setcaptchaDone(true);
    console.log("Captcha value:", value);
  }

  const onMint = async () => {
    try {
      // console.log(await walletExist(wallet?.publicKey.toString()));

      // console.log((await get(ref(db, wallet?.publicKey.toString()))).exists());

      if (captchaDone) {
        // if (await walletExist(wallet?.publicKey.toString())) {
        //   if (
        //     await checkCount(await readUserData(wallet?.publicKey.toString()))
        //   ) {
            setIsMinting(true);
            if (wallet && candyMachine?.program) {
              const mintTxId = await mintOneToken(
                candyMachine,
                props.config,
                wallet.publicKey,
                props.treasury
              );

              const status = await awaitTransactionSignatureConfirmation(
                mintTxId,
                props.txTimeout,
                props.connection,
                "singleGossip",
                false
              );

              if (!status?.err) {
                // writeUserData(
                //   wallet?.publicKey.toString(),
                //   await readUserData(wallet?.publicKey.toString())
                // );

                setAlertState({
                  open: true,
                  message: "Congratulations! Mint succeeded!",
                  severity: "success",
                });
              }
            } else {
              setAlertState({
                open: true,
                message: "Mint failed! Please try again!",
                severity: "error",
              });

           } 
          // else {
          //   setAlertState({
          //     open: true,
          //     message: "You don't have anymore presale mints left",
          //     severity: "error",
          //   });
          // }
        // }
      //    else {
      //     setAlertState({
      //       open: true,
      //       message: "Your address isn't whitelisted for presale",
      //       severity: "error",
      //     });
      //   }
      } else {
        setAlertState({
          open: true,
          message: "Please complete captcha to mint",
          severity: "error",
        });
      }
    } catch (error: any) {
      console.log(error);

      // TODO: blech:
      let message = error.msg || "Minting failed! Please try again!";
      if (!error.msg) {
        if (error.message.indexOf("0x138")) {
        } else if (error.message.indexOf("0x137")) {
          message = `SOLD OUT!`;
        } else if (error.message.indexOf("0x135")) {
          message = `Insufficient funds to mint. Please fund your wallet.`;
        }
      } else {
        if (error.code === 311) {
          message = `SOLD OUT!`;
          setIsSoldOut(true);
        } else if (error.code === 312) {
          message = `Minting period hasn't started yet.`;
        }
      }

      setAlertState({
        open: true,
        message,
        severity: "error",
      });
    } finally {
      if (wallet) {
        const balance = await props.connection.getBalance(wallet.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      }
      setIsMinting(false);
    }
  };

  useEffect(() => {
    (async () => {
      if (wallet) {
        const balance = await props.connection.getBalance(wallet.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      }
    })();
  }, [wallet, props.connection]);

  useEffect(() => {
    (async () => {
      if (!wallet) return;

      const { candyMachine, goLiveDate, itemsRemaining, itemsAvailable } =
        await getCandyMachineState(
          wallet as anchor.Wallet,
          props.candyMachineId,
          props.connection
        );

      setitemsRemaining(itemsRemaining);
      setitemsAvailable(itemsAvailable);
      setIsSoldOut(itemsRemaining === 0);
      setStartDate(goLiveDate);
      setCandyMachine(candyMachine);
    })();
  }, [wallet, props.candyMachineId, props.connection]);

  return (
    <main>
      <div
        style={{
          height: "-webkit-fill-available",
          backgroundColor: "rgb(17,24,39)",
        }}
      >
        <div className="header">
          <div id="sname"></div>
          <div id="right-menu">
            <div id="menu-li">
              <a href="/#roadmap">ROADMAP</a>
            </div>
            <div id="menu-li">
              <a href="/#team">TEAM</a>
            </div>

            <MintContainer
              className="main-subheading mint-button"
              style={{ alignSelf: "center", color: "white" }}
            >
              {!wallet ? (
                <ConnectButton
                  id="connect-top"
                  style={{
                    alignSelf: "center",
                    color: "black",
                    background: "yellow",
                    fontSize: "0.8rem",
                    fontStyle: "italic",
                    lineHeight: "1",
                    fontFamily: "Montserrat,sans-serif",
                  }}
                >
                  CONNECT WALLET
                </ConnectButton>
              ) : (
                <span>
                  {wallet && (
                    <div style={{ fontSize: "1rem" }}>
                      Address:{" "}
                      {shortenAddress(wallet.publicKey.toBase58() || "")}
                    </div>
                  )}
                </span>
              )}
            </MintContainer>
          </div>
        </div>

        <div className="main-section">
          <div className="main-image-container">
            <div className="main-image"></div>

            <div className="main-text-container">
              <div className="main-text-wrap">
                <h1 className="main-heading" style={{ color: "black" }}>
                  Welcome Woofers !!
                </h1>
                <p className="main-subheading">
                  Doge Capital is a collection of 5000 cute 24x24 pixel art
                  collection on the Solana Blockchain. Holding a Doge Capital
                  grants membership to the Woof Club and owner exclusive perks.
                  Monkeys and Apes have been having fun for too long so we have
                  decided to join them. Woof!
                </p>

                <Button
                  id="twitter"
                  href="https://twitter.com/thedogecapital"
                  style={{
                    background: "black",
                    marginTop: "10px",
                    marginBottom: "10px",
                    marginRight: "10px",
                    marginLeft: "10px",
                    fontSize: "1.1rem",
                    color: "white",
                    fontStyle: "italic",
                    lineHeight: "1",
                    fontFamily: "Montserrat,sans-serif",
                    padding: "10px",
                  }}
                >
                  Follow on Twitter
                </Button>
                <Button
                  id="discord"
                  href="https://discord.gg/xZEvbqFerb"
                  style={{
                    background: "black",
                    margin: "10px",
                    fontSize: "1.1rem",
                    color: "white",
                    fontStyle: "italic",
                    lineHeight: "1",
                    fontFamily: "Montserrat,sans-serif",
                    padding: "10px",
                  }}
                >
                  Join Discord
                </Button>

                <div
                  className="main-heading"
                  style={{
                    color: "black",
                    fontSize: "1.5rem",
                    paddingTop: "6vw",
                    paddingBottom: "1vw",
                  }}
                >
                  Price: 1 SOL
                </div>
                <div
                  className="main-heading"
                  style={{
                    color: "black",
                    fontSize: "1.5rem",
                    paddingTop: "1vw",
                    paddingBottom: "1vw",
                  }}
                >
                  Presale: 18th Oct
                </div>
                <div
                  className="main-heading"
                  style={{
                    color: "black",
                    fontSize: "1.5rem",
                    paddingTop: "1vw",
                  }}
                >
                  Public Mint: 20th Oct
                </div>
              </div>

              <div
                className="mint-container"
                style={{ justifyContent: "space-around", marginTop: "7vw" }}
              >
                {wallet && (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div className="mint-heading">Mint Price : 1 SOL</div>
                    <div
                      className="mint-heading"
                      style={{
                        fontSize: "1rem",
                        alignSelf: "center",
                        marginTop: "5vw",
                        marginBottom: "5vw",
                      }}
                    >
                      Items Available: {itemsRemaining} / {itemsAvailable}{" "}
                    </div>
                  </div>
                )}

                <MintContainer
                  className="mint-btn disabled"
                  style={{
                    alignSelf: "center",
                    display: "grid",
                  }}
                >
                  <div style={{ marginLeft: "0vw" }}>
                    <ReCAPTCHA
                      sitekey={process.env.REACT_APP_CAPTCHA_KEY!}
                      onChange={onChange}
                    />
                  </div>

                  {!wallet ? (
                    <ConnectButton
                      id="connect-mint"
                      style={{
                        color: "white",
                        background: "black",
                        fontSize: "1.1rem",
                        fontStyle: "italic",
                        lineHeight: "1",
                        fontFamily: "Montserrat,sans-serif",
                        marginRight: "5vw",
                        paddingLeft: "5vw",
                      }}
                    >
                      Connect Wallet
                    </ConnectButton>
                  ) : (
                    <MintButton
                      onClick={onMint}
                      disabled={isSoldOut || isMinting || !isActive}
                      variant="contained"
                      style={{
                        fontStyle: "italic",
                        lineHeight: "1",
                        fontFamily: "Montserrat,sans-serif",
                        background: "black",
                        color: "white",
                        marginTop: "2vw",
                        paddingLeft: "3vw",
                      }}
                    >
                      {isSoldOut ? (
                        "SOLD OUT"
                      ) : isActive ? (
                        isMinting ? (
                          <CircularProgress />
                        ) : (
                          <div style={{ width: "inherit" }}>MINT</div>
                        )
                      ) : (
                        <Countdown
                          date={startDate}
                          onMount={({ completed }) =>
                            completed && setIsActive(true)
                          }
                          onComplete={() => setIsActive(true)}
                          renderer={renderCounter}
                        />
                      )}
                    </MintButton>
                  )}
                </MintContainer>
              </div>
            </div>
          </div>
        </div>

        <div
          className="body"
          style={{
            height: "-webkit-fill-available",
            backgroundColor: "rgb(17,24,39)",
            margin: "0px",
          }}
        >
          <div
            className="bodysection-container-1"
            style={{ paddingBottom: "10vw" }}
          >
            <div className="body-container-r">
              <div className="main-heading">WoofDAO</div>
              <div className="body-subheading">
                The WoofDAO will allow doge holders to make decisions on what to
                do with the assets in the Woofbank. Fractionalise? Giveaway?
                Redeem for Belly Rubs? You name it!
              </div>
            </div>

            <div
              className="body-image-container-1"
              style={{ width: "-webkit-fill-available" }}
            >
              <div className="body-image-1"></div>
              <div></div>
            </div>
          </div>

          <div
            className="bodysection-container-2"
            style={{ background: "#fed300", paddingBottom: "10vw" }}
          >
            <div className="body-image-container-2">
              <div className="body-image-2"></div>
              <div></div>
            </div>

            <div className="body-container-l">
              <div className="main-heading" style={{ color: "black" }}>
                WoofBank
              </div>
              <div className="body-subheading" style={{ color: "black" }}>
                The Woofbank is a vault where we will buy NFTs and other assets
                and securely store them for our community. Monkeys, Birds,
                Villagers, the possibilities are endless. Each Doge holder will
                truly own these assets!
              </div>
            </div>
          </div>

          <div className="bodysection-container-3">
            <div className="body-container-royalty">
              <div className="main-heading">Airdrops</div>
              <div
                className="body-subheading"
                style={{ paddingBottom: "10vw" }}
              >
                We will have periodic airdrops that gives fractional ownership of the WoofBank assets. These airdrops would also entitle the holders to additional benefits in the Doge Capital ecosystem.
              
              </div>
            </div>

            <div
              className="body-image-container-1"
              style={{ width: "-webkit-fill-available" }}
            >
              <div className="body-image-3"></div>
              <div></div>
            </div>
          </div>

          {/* <div className="bodysection-container-n" style={{paddingBottom:"10vw",paddingTop:"0vw"}}>

<div className="body-image-container-1" style={{width:"-webkit-fill-available"}}>
<div className="body-image-3"></div> 
<div></div>
</div>

<div className="main-heading">Royalties</div>
<div className="body-subheading">Our unique royalty system will allow hodlers to earn higher royalties on holding for longer periods of time. Also holding other NFTs like a SMB or Thugbird will allow you to earn more royalties. These can be changed by the WoofDAO.</div>
</div> */}

          <div
            id="roadmap"
            style={{
              display: "flex",
              flexDirection: "column",
              background: "#fed300",
              paddingBottom: "10vw",
            }}
          >
            <div className="bodysection-container-n">
              <div className="main-heading" style={{ color: "black" }}>
                Roadmap
              </div>
              <div className="body-subheading" style={{ color: "black" }}>
                We’re in this for the long haul. We’ve set up some goalposts for
                ourselves. Once we hit a target sell through percentage, we will
                begin to work on realizing the stated goal.
              </div>
            </div>

            <div className="stage1-heading">Stage 1</div>

            <div className="roadmap-container">
              <div className="p-t-container">
                <div className="r-p-container">
                  {/* <tr style={{display: "table",
    whiteSpace: "nowrap"}}> */}
                  <div
                    className="r-percentage"
                    style={{ paddingLeft: "15px", paddingRight: "25px" }}
                  >
                    10%
                  </div>
                  <div className="r-text">
                    Buy Dogfood and feed some streetdogs
                  </div>
                </div>

                {/* <div style={{padding:"20px"}}></div>
    <div className="r-text">Buy Dogfood and feed some streetdogs</div> */}
                {/* </tr>   */}

                <div className="r-p-container">
                  <div
                    className="r-percentage"
                    style={{ paddingLeft: "15px", paddingRight: "25px" }}
                  >
                    20%
                  </div>
                  <div className="r-text">
                    We release the Chained Dogs - 10 Doges will be randomly
                    airdropped to Doge Capital holders
                  </div>
                </div>

                <div className="r-p-container">
                  <div
                    className="r-percentage"
                    style={{ paddingLeft: "15px", paddingRight: "25px" }}
                  >
                    40%
                  </div>
                  <div className="r-text">
                    WoofBank formation. 70% of royalties contributed to the WoofBank.
                  </div>
                </div>

                <div className="r-p-container">
                  <div
                    className="r-percentage"
                    style={{ paddingLeft: "15px", paddingRight: "25px" }}
                  >
                    50%
                  </div>
                  <div className="r-text">
                    member exclusive merch drop. Designs are already ready.
                  </div>
                </div>

                <div className="r-p-container">
                  <div
                    className="r-percentage"
                    style={{ paddingLeft: "15px", paddingRight: "25px" }}
                  >
                    70%
                  </div>
                  <div className="r-text">
                    WoofDAO formation. 1 doge = 1 vote
                  </div>
                </div>

                <div className="r-p-container">
                  <div
                    className="r-percentage"
                    style={{ paddingLeft: "15px", paddingRight: "25px" }}
                  >
                    90%
                  </div>
                  <div className="r-text">
                    Use 5% of sale to buy floor doges. Then let WoofDAO decide
                    what to do with them. For eg:burn them to make the
                    collection deflationary or start a liquidity pool to
                    stabilise price
                  </div>
                </div>

                <div className="r-p-container">
                  <div
                    className="r-percentage"
                    style={{ paddingLeft: "15px", paddingRight: "15px" }}
                  >
                    100%
                  </div>
                  <div className="r-text">
                    We will buy a Floor SMB + Thugbird (+ more TBA) and let
                    WoofDAO decide what to do with it. For eg, fractionalise it
                    or do a single giveaway or hold. This will be the beginning
                    of the WoofBank. 5% of initial sales will be added to the
                    Woof bank as well.
                  </div>
                </div>
              </div>

              <div className="r-i-container">
                <div className="r-image"></div>
              </div>
            </div>

            <div className="stage1-heading">Stage 2</div>
            <div
              className="r-t-container"
              style={{
                paddingLeft: "3vw",
                paddingTop: "5vw",
                paddingRight: "3vw",
              }}
            >
              <div className="r-text">
                1. Start working on Breeding and gamification.
                <br />
              </div>
              <div className="r-text">
                2. Staking : Stake your Doge Capital NFTs to earn $DOGFOOD
                token. This token will be backed by the assets in the WoofBank .
                Each $DOGFOOD token represent a share in the WoofBank, this
                creates a floor price for the $DOGFOOD token. Apart from
                representing a share in Woofbank , $DOGFOOD tokens will also
                have other utilities in the Doge Capital ecosystem like breeding
                , future drop access, payment for Doge Capital exclusive merch
                etc{" "}
              </div>
              <div className="r-text">
                3. Airdrops with actual utility and game theory.
              </div>
              <div className="r-text">
                4. Treasure Hunt with a grand prize for the first ones to solve
                it + more
              </div>
            </div>

            <div className="r-i-container-ipad">
              <div className="r-image"></div>
            </div>
          </div>

          <div id="team" className="bodysection-container">
            <div className="main-heading">Team</div>
          </div>
          <div className="team-container">
            <div className="team">
              <div className="t1-img"></div>
              <div className="t-name">Cryptofunnel</div>
              <div className="t-desc">Lead Developer</div>
              <div className="t-soc">
                <a href="https://twitter.com/thecryptofunnel">
                  <div className="t-twitter"></div>
                </a>
                <a href="https://instagram.com/cryptofunnel">
                  <div className="t-insta"></div>
                </a>
              </div>
            </div>
            <div className="team">
              <div className="t2-img"></div>
              <div className="t-name">Cryptohike</div>
              <div className="t-desc">Marketing Head</div>
              <div className="t-soc">
                <a href="https://twitter.com/thecryptohike">
                  <div className="t-twitter"></div>
                </a>
                <a href="https://instagram.com/cryptohike">
                  <div className="t-insta"></div>
                </a>
              </div>
            </div>
            <div className="team">
              <div className="t3-img"></div>
              <div className="t-name">Thiccdoge</div>
              <div className="t-desc">Artist</div>
              <div className="t-soc">
                <a href="https://twitter.com/thethicdoge">
                  <div className="t-twitter"></div>
                </a>
              </div>
            </div>
          </div>

          <div style={{ background: "black" }}>
            <div className="footer-container">
              <div>
                <div>
                  <div className="footer-logo"></div>
                </div>
                <div className="footer-text">
                  © 2021 Doge Capital. All rights reserved.
                </div>
              </div>

              <div className="socials">
                <a href="https://twitter.com/thedogecapital">
                  <div className="twitter-footer-logo"></div>
                </a>
                <a href="https://discord.gg/7qaAx5UQbb">
                  <div className="discord-footer-logo"></div>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 

      {wallet && (
        <p>Balance: {(balance || 0).toLocaleString()} SOL</p>
      )}

      */}

        {/* 
      <MintContainer>
        {!wallet ? (
          <ConnectButton>Connect Wallet</ConnectButton>
        ) : (
          <MintButton
            disabled={isSoldOut || isMinting || !isActive}
            onClick={onMint}
            variant="contained"
          >
            {isSoldOut ? (
              "SOLD OUT"
            ) : isActive ? (
              isMinting ? (
                <CircularProgress />
              ) : (
                "MINT"
              )
            ) : (
              <Countdown
                date={startDate}
                onMount={({ completed }) => completed && setIsActive(true)}
                onComplete={() => setIsActive(true)}
                renderer={renderCounter}
              />
            )}
          </MintButton>
        )}
      </MintContainer> */}

        <Snackbar
          open={alertState.open}
          autoHideDuration={6000}
          onClose={() => setAlertState({ ...alertState, open: false })}
        >
          <Alert
            onClose={() => setAlertState({ ...alertState, open: false })}
            severity={alertState.severity}
          >
            {alertState.message}
          </Alert>
        </Snackbar>
      </div>
    </main>
  );
};

interface AlertState {
  open: boolean;
  message: string;
  severity: "success" | "info" | "warning" | "error" | undefined;
}

const renderCounter = ({ days, hours, minutes, seconds, completed }: any) => {
  return (
    <CounterText>
      {days} days {hours} hours, {minutes} minutes, {seconds} seconds
    </CounterText>
  );
};

export default Home;
