import { useCallback, useState } from "react";
import { Connection } from "@solana/web3.js";
import { BulkAccountLoader, DriftClient, User, calculateEntryPrice, calculatePositionPNL } from "@drift-labs/sdk";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { formatTokenAmount } from "../utils/format";

export const useDriftPosition = (connection: Connection) => {
  const [driftPosition, setDriftPosition] = useState({
    totalDeposit: "",
    costBasis: "",
    positionSizeSol: "",
    positionSizeUsd: "",
    entryPrice: "",
    pnl: "",
    currentPrice: "",
  });

  const initializeDrift = useCallback(
    async (wallet: WalletContextState) => {
      if (!wallet.publicKey) return;

      try {
        const bulkAccountLoader = new BulkAccountLoader(connection, "confirmed", 1000);
        const client = new DriftClient({
          connection,
          wallet: wallet as any,
          perpMarketIndexes: [0],
          env: "mainnet-beta",
          accountSubscription: {
            type: "polling",
            accountLoader: bulkAccountLoader,
          },
        });

        await client.subscribe();
        const driftUser = new User({
          driftClient: client,
          userAccountPublicKey: await client.getUserAccountPublicKey(),
          // userAccountPublicKey: new PublicKey("CsduF2VLRkaDXqqFC9VABJop9CSTCm4P3tcFe5qRv71Q"),
          accountSubscription: {
            type: "polling",
            accountLoader: bulkAccountLoader,
          },
        });

        const userAccountExists = await driftUser.exists();
        if (!userAccountExists) {
          console.log("User account does not exist - needs initialization");
          return;
        }

        await driftUser.subscribe();
        await driftUser.fetchAccounts();

        const solPosition = driftUser.getPerpPosition(0);
        if (!solPosition) {
          console.log("No SOL-PERP position found");
          return;
        }

        const totalDeposit = driftUser.getUserAccount().totalDeposits.toNumber();
        const costBasis = solPosition.quoteEntryAmount.toNumber();
        const positionSizeSol = solPosition.baseAssetAmount.toNumber();
        const entryPrice = calculateEntryPrice(solPosition).toNumber();
        const oracleData = await client.getOracleDataForPerpMarket(0);
        const currentPrice = oracleData.price.toNumber();
        const positionSizeUsd = positionSizeSol * currentPrice;
        const marketAccount = await client.getPerpMarketAccount(0);
        const pnl = calculatePositionPNL(marketAccount!, solPosition, false, oracleData).toNumber();

        setDriftPosition({
          totalDeposit: formatTokenAmount(totalDeposit, 2, 1e6),
          costBasis: formatTokenAmount(costBasis, 2, 1e6),
          positionSizeSol: formatTokenAmount(positionSizeSol, 2, 1e9),
          positionSizeUsd: formatTokenAmount(positionSizeUsd, 2, 1e15), // 1e9 sol + 1e6 usd
          entryPrice: formatTokenAmount(entryPrice, 2, 1e6),
          currentPrice: formatTokenAmount(currentPrice, 2, 1e6),
          pnl: formatTokenAmount(pnl, 2, 1e6),
        });
      } catch (error) {
        console.error("Error initializing Drift client:", error);
      }
    },
    [connection]
  );
  // console.log(driftPosition);

  return {
    initializeDrift,
    driftPosition,
  };
};
