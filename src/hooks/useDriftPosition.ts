import { useCallback, useState } from "react";
import { Connection } from "@solana/web3.js";
import {
  BulkAccountLoader,
  DRIFT_PROGRAM_ID,
  DriftClient,
  User,
  calculateEntryPrice,
  calculatePositionPNL,
  getUserAccountPublicKey,
} from "@drift-labs/sdk";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { formatTokenAmount } from "../utils/format";
import { PublicKey } from "@solana/web3.js";
// import { PublicKey } from "@solana/web3.js";

export const useDriftPosition = (connection: Connection) => {
  const [driftPosition, setDriftPosition] = useState({
    totalDeposit: 0,
    costBasis: 0,
    positionSizeSol: 0,
    positionSizeUsd: 0,
    entryPrice: 0,
    pnl: 0,
    currentPrice: 0,
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
        // Public key created by drift for the user
        const driftPublicKey = await getUserAccountPublicKey(
          new PublicKey(DRIFT_PROGRAM_ID),
          new PublicKey("AdfUdxJZbZqv2ipXZ2CohmCYTADWp57BwtE9jfAUdwtk")
        );

        console.log("userSubAccount", driftPublicKey.toString());
        await client.subscribe();
        const driftUser = new User({
          driftClient: client,
          userAccountPublicKey: await client.getUserAccountPublicKey(),
          // userAccountPublicKey: driftPublicKey,
          accountSubscription: {
            type: "polling",
            accountLoader: bulkAccountLoader,
          },
        });

        await driftUser.subscribe();
        await driftUser.fetchAccounts();
        const userAccountExists = await driftUser.exists();
        if (!userAccountExists) {
          alert("User account does not exist - needs initialization");
          console.log("User account does not exist - needs initialization");
          return;
        }
        const solPosition = driftUser.getPerpPosition(0);
        if (!solPosition) {
          console.log("No SOL-PERP position found");
          alert("No SOL-PERP position found");
          return;
        }

        // const totalDeposit = driftUser.getUserAccount().totalDeposits.toNumber();
        // console.log("userAccount", driftUser.getUserAccount());
        const spotMarketAccount = await driftUser.getSpotPosition(6); // JITOSOL
        const totalDepositJitoSol = spotMarketAccount?.cumulativeDeposits.toNumber() as number;
        // const jitoSolPrice = await fetchJitoSolPrice();
        // console.log("jitoSolPrice", jitoSolPrice);
        // const oracleDataForJitoSol = await client.getOracleDataForSpotMarket(6);
        // console.log("oracleDataForJitoSol", oracleDataForJitoSol);
        // const jitoSolPrice = oracleDataForJitoSol.price.toNumber();
        // const totalDepositJitoSolUsd = totalDepositJitoSol * jitoSolPrice;
        // console.log("totalDepositJitoSolUsd", totalDepositJitoSolUsd / 1e15);
        // console.log("totalDeposit", totalDepositJitoSol);

        const costBasis = solPosition.quoteEntryAmount.toNumber();
        const positionSizeSol = solPosition.baseAssetAmount.toNumber();
        const entryPrice = calculateEntryPrice(solPosition).toNumber();
        const oracleData = client.getOracleDataForPerpMarket(0);
        const currentPrice = oracleData.price.toNumber();
        const positionSizeUsd = positionSizeSol * currentPrice;
        const marketAccount = await client.getPerpMarketAccount(0);
        const pnl = calculatePositionPNL(marketAccount!, solPosition, false, oracleData).toNumber();

        setDriftPosition({
          totalDeposit: Number(formatTokenAmount(totalDepositJitoSol, 4, 1e9)),
          costBasis: Number(formatTokenAmount(costBasis, 2, 1e6)),
          positionSizeSol: Number(formatTokenAmount(positionSizeSol, 4, 1e9)),
          positionSizeUsd: Number(formatTokenAmount(Math.abs(positionSizeUsd), 2, 1e15)), // 1e9 sol + 1e6 usd
          entryPrice: Number(formatTokenAmount(entryPrice, 2, 1e6)),
          currentPrice: Number(formatTokenAmount(currentPrice, 2, 1e6)),
          pnl: Number(formatTokenAmount(pnl, 2, 1e6)),
        });
      } catch (error) {
        console.error("Error initializing Drift client:", { error });
      }
    },
    [connection]
  );

  return {
    initializeDrift,
    driftPosition,
  };
};
