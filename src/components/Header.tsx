import React from "react";
import { ConnectButton } from "./ConnectButton";

const Header = () => {
  return (
    <div className="flex items-center justify-between">
      <p className="font-bold text-xl rounded-md text-gray-600 borde shadow-md p-2">Funding Rate Strategy</p>
      <p>
        <ConnectButton />
      </p>
    </div>
  );
};

export default Header;
