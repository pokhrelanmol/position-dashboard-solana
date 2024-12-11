import { useCallback, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { BulkAccountLoader, DriftClient, User, initialize, PerpMarkets, PerpPosition } from "@drift-labs/sdk";
import { WalletContextState } from "@solana/wallet-adapter-react";

export const useDriftPosition = (connection: Connection) => {
  const [driftClient, setDriftClient] = useState<DriftClient>();
  const [solPerpPosition, setSolPerpPosition] = useState<PerpPosition>();

  const initializeDrift = useCallback(
    async (wallet: WalletContextState) => {
      if (!wallet.publicKey) return;

      try {
        const env = "mainnet-beta";
        const sdkConfig = initialize({ env });
        const bulkAccountLoader = new BulkAccountLoader(connection, "confirmed", 1000);

        // Initialize Drift Client - adding SOL-PERP market index (0)
        const client = new DriftClient({
          connection,
          wallet: wallet as any,
          programID: new PublicKey(sdkConfig.DRIFT_PROGRAM_ID),
          perpMarketIndexes: [0], // Added SOL-PERP market index
          accountSubscription: {
            type: "polling",
            accountLoader: bulkAccountLoader,
          },
        });

        await client.subscribe();
        setDriftClient(client);
        const pub = await client.getUserAccountPublicKey();
        console.log({ pub: pub.toString() });

        const driftUser = new User({
          driftClient: client,
          // userAccountPublicKey: new PublicKey("CsduF2VLRkaDXqqFC9VABJop9CSTCm4P3tcFe5qRv71Q"),
          userAccountPublicKey: pub,
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

        // Get SOL-PERP position
        const solPosition = driftUser.getPerpPosition(0);
        // const orders = driftUser.getOrder(0);
        // console.log({ orders });

        // Now get the net USD value
        // const netUsdValue = await client.getUserAccountsForAuthority(wallet.publicKey);
        // console.log({ netUsdValue });

        console.log({
          position: solPosition,
          // netValue: netUsdValue,
        });

        console.log("Drift client and user initialized successfully");
      } catch (error) {
        console.error("Error initializing Drift client:", error);
      }
    },
    [connection]
  );

  return {
    driftClient,
    solPerpPosition,
    initializeDrift,
  };
};
