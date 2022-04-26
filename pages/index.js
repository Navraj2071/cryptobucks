import ConnectButton from "./connectButton";
import { useEthers } from "@usedapp/core";
import { useState, useEffect, useReducer } from "react";
import Counter from "./CafeCounter";
import { useRouter } from "next/router";

export default function Home() {
  const { account, chainId, activateBrowserWallet, deactivate } = useEthers();
  const [isConnected, setIsConnected] = useState(false);
  const router = useRouter();
  useEffect(() => {
    if (account === undefined) {
      setIsConnected(false);
    } else {
      setIsConnected(true);
    }
  }, [account]);

  const TitlePage = () => {
    return (
      <>
        <div className="titleSection">
          <div className="titleBlur">
            Welcome to CryptoBucks
            <button
              onClick={() => {
                if (isConnected) {
                  deactivate();
                } else {
                  activateBrowserWallet();
                }
              }}
            >
              Connect
            </button>
            <h3 style={{ color: "yellow", margin: "0" }}>Network: Rinkeby</h3>
          </div>
          <button
            style={{ position: "fixed", top: "20px", right: "20px" }}
            onClick={() => {
              router.push("/documentation");
            }}
          >
            Documentation
          </button>
        </div>
      </>
    );
  };

  return (
    <>
      {isConnected ? (
        <>
          <ConnectButton />
          <Counter />
        </>
      ) : (
        <TitlePage />
      )}
    </>
  );
}
