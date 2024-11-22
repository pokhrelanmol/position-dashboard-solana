import { useState } from "react";
import "./App.css";
import DeFiPositionDashboard from "./components/DeFiPositionDashboard.tsx";
import { WalletProviderComponent } from "./components/WalletProviderComponent.tsx";
import { ConnectWallet } from "./components/ConnectWallet.tsx";

function App() {
  return (
    <>
      <WalletProviderComponent>
        <DeFiPositionDashboard />
      </WalletProviderComponent>
    </>
  );
}

export default App;
