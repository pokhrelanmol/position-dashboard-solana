import { useState, useCallback } from "react";

export const useBtcPrice = () => {
  const [btcPrice, setBtcPrice] = useState<number>();

  const fetchBtcPrice = useCallback(async () => {
    try {
      const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
      if (!response.ok) throw new Error("Failed to fetch price");
      const data = await response.json();
      setBtcPrice(data.bitcoin.usd as number);
    } catch (err) {
      console.error("Error fetching BTC price:", err);
    }
  }, []);

  return { btcPrice, fetchBtcPrice };
};
