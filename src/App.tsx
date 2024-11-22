import { useState } from "react";
import "./App.css";
import DeFiPositionDashboard from "./components/DeFiPositionDashboard.tsx";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div>
        <DeFiPositionDashboard />
      </div>
    </>
  );
}

export default App;
