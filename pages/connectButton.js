import { useEthers } from "@usedapp/core";
import { useState, useEffect, useReducer } from "react";
import React from "react";

const ConnectButton = () => {
  const { account, chainId, activateBrowserWallet, deactivate } = useEthers();
  const [isConnected, setIsConnected] = useState(false);
  useEffect(() => {
    if (account === undefined) {
      setIsConnected(false);
    } else {
      setIsConnected(true);
    }
  }, [account]);
  return (
    <>
      <div className="connectButton">
        <button
          onClick={() => {
            if (isConnected) {
              deactivate();
            } else {
              activateBrowserWallet();
            }
          }}
        >
          {isConnected ? "Disconnect" : "Connect"}
        </button>
        {/* <p>{account}</p> */}
      </div>
    </>
  );
};

export default ConnectButton;
