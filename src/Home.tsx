import { useEffect, useState } from "react";
import styled from "styled-components";
import "./App.css";
import Countdown from "react-countdown";
import { Button, CircularProgress, Hidden, Snackbar } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";

import * as anchor from "@project-serum/anchor";

import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { WalletDialogButton } from "@solana/wallet-adapter-material-ui";

import main from "./ca_main.png";
import cs from "./cc_cs.png";
import f1 from "./cc_f1.png";
import f2 from "./cc_f2.png";
import f3 from "./cc_f3.png";
import f4 from "./cc_f4.png";
import rbg from "./cc_rbg.png";
import fss from "./cc_fss.png";
import ralien from "./cc_ralien.png";
import roadmap from "./cc_roadmap.png";
import title from "./cc_pew_main.png";
import alienw from "./cc_alw.png";
import spaces from "./cc_spship.png";
import ccg1 from "./cc_g1.png";
import ccg2 from "./cc_g2.png";
import ccg3 from "./cc_g3.png";
import ccg4 from "./cc_g4.png";
import ccg5 from "./cc_g5.png";

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
          

          <div className="main-menu">

            <div className="menu-content" style={{paddingLeft: "4%"}}>

<div className="menu-cc">
<div className="menu-li title"><a href="#roadmap" style={{fontSize:"1em"}}>Roadmap</a></div>
<div className="menu-li title"><a href="#team" style={{fontSize:"1em"}}>Team</a></div>

            <MintContainer
              className="main-subheading mint-button"
              style={{ alignSelf: "center", color: "white" }}
            >
              {!wallet ? (
                <ConnectButton
                  id="connect-top"
                  style={{
                    alignSelf: "center",
                    color: "white",
                    background: "#37354d",
                    fontSize: "0.9em",
                    lineHeight: "1",
                    fontFamily: "Days One,sans-serif",
                    textShadow: "rgb(0 255 255) 0.92924px 0.206878px 0px, rgb(255 0 255) 0.67076px -0.306878px 0px"
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
            <div className="main-title" style={{backgroundImage:`url(${title})`,width:"58vw",height:"40vw",backgroundSize:"cover",backgroundPosition:"center"}}>
            </div>

    </div>

<div className="main-bg" style={{backgroundImage:`url(${main})`}}>
  
  <div className="social-icons">
            <a href="https://discord.gg/EwukvFWb" style={{padding:"27px"}}>
                  <div className="discord-footer-logo"></div>
                </a>
              <a href="https://twitter.com/solanaabs" style={{padding:"10px"}}>
                  <div className="twitter-footer-logo"></div>
                </a>
          </div>  
          
  </div>
</div>


        <div className="main-section">
{/* 
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
                )} */}
          
        <MintContainer
                  className="mint-btn disabled"
                  style={{
                    display: "grid",
                    height: "40px"
                  }}
                >
                  {/* <div style={{ marginLeft: "0vw" }}>
                    <ReCAPTCHA
                      sitekey={process.env.REACT_APP_CAPTCHA_KEY!}
                      onChange={onChange}
                    />
                  </div> */}

                  {!wallet ? (
                    <ConnectButton
                      id="connect-mint"
                      style={{
                        color: "white",
                        background: "#37354d",
                        fontSize: "2.2em",
                        lineHeight: "1",
                        fontFamily: "Days One,sans-serif",
                        textShadow: "rgb(0 255 255) 0.92924px 0.206878px 0px, rgb(255 0 255) 0.67076px -0.306878px 0px",
                        width:"fit-content"                
                      }}
                    >
                      CONNECT
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
    <div className="main_social">
    <a href="https://twitter.com/solanaabs" style={{marginTop: "4%"}}>
      <div className="twtr" style={{backgroundSize: "cover", 
height: "50px", 
width: "50px"}}></div></a>
<a href="https://discord.gg/EwukvFWb" style={{marginTop: "4%"}}>
      <div className="dscrd" style={{backgroundSize: "cover", 
height: "50px", 
width: "50px"}}></div></a>
      <div className="foltxt">JOIN US ON DISCORD AND TWITTER.</div>
    </div>
  </div>  


  <div className="main-section" id="cool_alien">
      <div className="title" style={{fontSize: "3em",alignSelf: "center",marginBottom: "10%",marginTop:"5%"}}>COOL ALIEN COLLECTION</div>
      <div className="desc" style={{lineHeight:"1.4",fontSize: "1.3em",alignSelf: "center",marginBottom: "10%"}}>COOL ALIENS IS A COLLECTION OF 5000 UNIQUELY GENEREATED 34 X 34 PIXEL ALIENS LIVING ON THE SOLANA BLOCKCHAIN</div>
      <div className="gallery" style={{display:"flex",justifyContent: "space-around"}}>
          <img className="gal_img" src={ccg1}/>
          <img className="gal_img" src={ccg2}/>
          <img className="gal_img" src={ccg3}/>
          <img className="gal_img" src={ccg4}/>
          <img className="gal_img" src={ccg5}/>
      </div>

  </div>  

  <div className="main-section" id="who_are">
      <div className="title" style={{fontSize: "3em",alignSelf: "center",marginBottom: "10%",marginTop:"5%"}}>WHO ARE THE COOL ALIENS?</div>
      <div className="desc" style={{lineHeight:"1.4",fontSize: "1.3em",alignSelf: "center",marginBottom: "10%"}}>THEY ARE A BUNCH OF HOOLIGAN ALIENS FROM PLANET ZAJA THAT CRASH LANDED INTO EARTH WHILE THEY WERE ROAMING AROUND THE GALAXY.
THEY QUICKLY ADAPTED TO THE HUMAN HOOLIGAN LIFESTYLE OF EARTH AND HAVE BEEN CHILLING WITH HUMANS EVER SINCE. BUT COOL ALIENS BEING WHO THEY ARE, QUICKLY GOT BORED OF EARTH AND IS TRYING TO FIX THEIR SHIP AND GO BACK HOME TO THEIR FEMALES.</div>
      <div className="gallery" style={{display:"flex",justifyContent: "space-around",height:"150px"}}>
          <img className="who_img" src={alienw}/>
          <img className="who_img" src={alienw}/>
          <img className="who_img" src={alienw}/>
          <img className="who_img" src={spaces} style={{height: "40vw",position: "relative",bottom: "20vw"}}/>
      </div>

  </div> 


  {/* <div className="main-section" id="join_comm">
    <div className="join_ico"></div>
    <div className="text_wrap">
      <div className="title" style={{fontSize: "3em",alignSelf: "center",marginBottom: "10%"}}>JOIN OUR COMMUNITY</div>
      <div className="desc" style={{fontSize: "1.8em",alignSelf: "center",marginBottom: "10%"}}>JOIN THE ALIEN COMMUNITY. LEARN HOW TO BECOME OG-ALIEN. ENJOY THE BENEFITS OF ROYALTIES.</div>
    </div>
      <div className="gallery" style={{display:"flex",justifyContent: "space-around"}}>
        <div className="twtr"></div>
        <div className="dscrd"></div>
      </div>

  </div>  */}


  <div className="main-section" id="roadmap">

     <div style={{display:"flex"}}> 
      <img className="gal_img" src={ralien} style={{height:"70px"}}/>
      <div className="title" style={{fontSize: "3em",alignSelf: "center",marginBottom: "10%"}}>Roadmap</div>
     </div> 
      <div style={{display:"flex"}}>
      <img className="gal_img" src={roadmap} style={{height:"100%",width:"-webkit-fill-available"}}/>
      <div id="roadmap"></div>
      </div>
  </div> 

  <div className="main-section" id="features" style={{paddingTop: "5%"}}>
  <div style={{display:"flex"}}> 
      <img className="gal_img" src={fss} style={{height:"70px"}}/>
      <div className="title" style={{fontSize: "3em",alignSelf: "center",marginBottom: "10%"}}>Key Features</div>     
  </div>

  <div className="gallery" style={{display:"flex",justifyContent: "space-around"}}>
          <img className="f_img" src={f1}/>
          <img className="f_img" src={f2}/>
          <img className="f_img" src={f3}/>
          <img className="f_img" src={f4}/>
      </div>
      {/* <div className="gallery" style={{display:"flex",justifyContent: "space-around",marginTop:"5%",paddingLeft:"15%",paddingRight:"15%"}}>
          <img className="f_img" src={f1}/>
          <img className="f_img" src={f2}/>
      </div> */}
  
  </div> 

  <div className="main-section" id="3Dcollection" style={{paddingTop: "10%"}}>
      <div className="title" style={{fontSize: "3em",alignSelf: "center",marginBottom: "10%"}}>3D Collection</div>
      <div className="desc" style={{fontSize: "1.8em",alignSelf: "center",marginBottom: "10%"}}>coming soon</div>

  </div> 

  <div className="main-section" id="team">
      <div className="title" style={{fontSize: "3em",alignSelf: "center",marginBottom: "10%"}}>Team</div>
      <div className="gallery" style={{display:"flex",justifyContent: "space-around",marginBottom:"100px"}}>
          <div><img className="team_img" src={ccg1}/><div style={{justifyContent:"center",fontFamily: "Days One , sans-serif",paddingTop:"20px"}}>Daddyalien(Developer)</div></div>
          <div><img className="team_img" src={ccg2}/><div style={{justifyContent:"center",fontFamily: "Days One , sans-serif",paddingTop:"20px"}}>metadavinci(Artist)</div></div>
          <div><img className="team_img" src={ccg3}/><div style={{justifyContent:"center",fontFamily: "Days One , sans-serif",paddingTop:"20px"}}>Metabodivan(Marketing)</div></div>
      </div>

  </div>  

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
