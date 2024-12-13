import { useState, useCallback } from "react";

export const useJitoSolPrice = () => {
  const [jitoSolPrice, setJitoSolPrice] = useState<number>();

  const fetchJitoSolPrice = useCallback(async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=jito-staked-sol&vs_currencies=usd"
      );
      if (!response.ok) throw new Error("Failed to fetch price");
      const data = await response.json();
      console.log("data", data);
      setJitoSolPrice(data["jito-staked-sol"].usd as number);
    } catch (err) {
      console.error("Error fetching Jito SOL price:", err);
    }
  }, []);

  return { jitoSolPrice, fetchJitoSolPrice };
};
