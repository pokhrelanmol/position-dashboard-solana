import { createContext, useState, useContext } from "react";
interface WalletProps {
  walletAddress: string;
  setWalletAddress: React.Dispatch<React.SetStateAction<string>>;
}
export type ProviderProps = {
  children: React.ReactNode;
};
const WalletContext = createContext({} as WalletProps);
export const WalletProvider = ({ children }: ProviderProps) => {
  const [walletAddress, setWalletAddress] = useState<string>();

  return <WalletContext.Provider value={{ walletAddress, setWalletAddress }}>{children}</WalletContext.Provider>;
};
export const useWallet = () => useContext(WalletContext);
