import React from "react";
import { ConnectWallet } from "./ConnectWallet";

const Header = () => {
  return (
    <div className="flex items-center justify-between">
      <p className="font-bold text-xl rounded-md text-gray-600 borde shadow-md p-2">Funding Rate Strategy</p>
      <p>
        <ConnectWallet />
      </p>
    </div>
  );
};

export default Header;
