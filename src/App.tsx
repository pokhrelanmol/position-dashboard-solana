import "./App.css";
import DeFiPositionDashboard from "./components/DeFiPositionDashboard.tsx";
import { WalletProviderComponent } from "./components/WalletProviderComponent.tsx";

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
