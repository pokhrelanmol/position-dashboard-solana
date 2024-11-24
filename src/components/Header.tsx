import React from "react";
import { ConnectWallet } from "./ConnectWallet";

const Header = () => {
  return (
    <div className="flex items-center justify-between">
      <div className="font-bold text-xl rounded-md text-gray-600 borde shadow-md p-2">Funding Rate Strategy</div>
      <div>
        <ConnectWallet />
      </div>
    </div>
  );
};

export default Header;
