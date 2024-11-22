import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/WalletContext";
import solanaWeb3 from "@solana/web3.js";

import { Dot } from "lucide-react";
import getProvider from "../utils/provider.ts";

const provider = getProvider();
export function ConnectButton() {
  const { walletAddress, setWalletAddress } = useWallet();
  // Connect on initial Load if trusted
  //TODO: maybe we can do this is useEffect but i guess for now it is fine
  window.onload = async () => {
    if (!provider) alert("please install fantom wallet");

    try {
      const res = await provider.connect({ onlyIfTrusted: true });
      setWalletAddress(res.publicKey.toString());
    } catch (error) {
      console.error(error);
    }
  };

  // Connect Fantom wallet using a button
  const connectWallet = async () => {
    if (!provider) return;
    const res = await provider.connect();

    setWalletAddress(res.publicKey.toString());
  };
  return (
    <div>
      {!walletAddress ? (
        <Button size="lg" onClick={connectWallet}>
          Button
        </Button>
      ) : (
        <Button size="lg" variant="outline">
          {walletAddress} <Dot color="green" size={64} fontSize={46} />
        </Button>
      )}
    </div>
  );
}
