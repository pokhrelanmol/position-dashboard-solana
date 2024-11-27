import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Wallet, CoinsIcon, DollarSign, Heart, HeartCrackIcon } from "lucide-react";
import Header from "./Header";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { ObligationStats } from "@kamino-finance/klend-sdk";
import { getMarket } from "@/utils/kaminoHelper";
import { UserLoansArgs } from "@/utils/kaminoTypes";
import { DriftClient, IWallet } from "@drift-labs/sdk";
import { Transaction } from "@solana/web3.js";
import { Skeleton } from "./ui/skeleton";

type KaminoLoanDetails = {
  collateralValue: string;
  collateralAmount?: string;
  borrowValueWithBorrowFactor: string;
  borrowAPY: number;
  netPositionValue: string;
  currentLtv: number;
  liquidationLtv: number;
};

const BTC_RESERVE = new PublicKey("HYnVhjsvU1vBKTPsXs1dWe6cJeuU8E4gjoYpmwe81KzN");
const USDC_RESERVE = new PublicKey("D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59");

const DeFiPositionDashboard = () => {
  const [btcPrice, setBtcPrice] = useState<number>();
  const [kaminoLoanDetails, setKaminoLoanDetails] = useState<KaminoLoanDetails>();
  const wallet = useWallet();
  // const { publicKey, signTransaction, signAllTransactions } = useWallet();

  const rpc_url = import.meta.env.VITE_SOLANA_MAINNET_RPC;

  // Memoize connection and market key to prevent recreating on each render
  const connection = useMemo(() => new Connection(rpc_url), [rpc_url]);

  /* ------------------------------ KAMINO SETUP ------------------------------ */

  const MAIN_MARKET = useMemo(() => new PublicKey("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF"), []);
  async function getUserLoansForMarket(args: UserLoansArgs) {
    const market = await getMarket(args);
    return market.getAllUserObligations(args.wallet);
  }

  async function getBtcPrice() {
    try {
      // Using CoinGecko's free public API
      const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");

      if (!response.ok) {
        throw new Error("Failed to fetch price");
      }

      const data = await response.json();
      setBtcPrice(data.bitcoin.usd as number);
    } catch (err) {
      console.log(err);
    }
  }
  // Memoize the fetch function to prevent recreation
  const getKaminoLoanDetails = useCallback(async () => {
    if (!wallet.publicKey) return;
    const args = {
      connection,
      marketPubkey: MAIN_MARKET,
      wallet: wallet.publicKey,
    };

    try {
      const loans = await getUserLoansForMarket(args);
      //Note: This will work only for 1 loan
      for (const loan of loans) {
        // console.log(loan.getBorrows()[0].amount.decimalPlaces);
        const loanAddress = loan.obligationAddress;
        const args = {
          connection,
          obligationPubkey: loanAddress,
          marketPubkey: MAIN_MARKET,
        };
        const currentSlot = await connection.getSlot();
        const loanStats: ObligationStats = loan.refreshedStats;

        const market = await getMarket(args);
        let btcDeposit;
        // Get only a BTC deposit from first element

        for (const [, deposit] of loan.deposits.entries()) {
          const reserve = market.getReserveByMint(deposit.mintAddress);

          if (!reserve) {
            console.error(`reserve not found for ${deposit.mintAddress.toString()}`);
            continue;
          }
          // only BTC
          if (reserve.address.equals(BTC_RESERVE)) {
            const decimals = reserve.getMintFactor();
            btcDeposit = deposit.amount.div(decimals).toFixed(6);
            break;
          }
        }

        // Get Borrow APY only for USDC borrow
        let borrowApy: number;

        for (const [, borrow] of loan.borrows.entries()) {
          const reserve = market.getReserveByMint(borrow.mintAddress);

          if (!reserve) {
            console.error(`reserve not found for ${borrow.mintAddress.toString()}`);
            continue;
          }
          // only for USDC
          if (reserve.address.equals(USDC_RESERVE)) {
            borrowApy = parseFloat(reserve.totalBorrowAPY(currentSlot).toFixed(2)) * 100;
            break;
          }
        }

        // set state
        setKaminoLoanDetails({
          collateralValue: loanStats.userTotalCollateralDeposit.toFixed(4),
          collateralAmount: btcDeposit,
          borrowValueWithBorrowFactor: loanStats.userTotalBorrow.toFixed(4),
          borrowAPY: borrowApy!,
          netPositionValue: loanStats.netAccountValue.toFixed(4),
          currentLtv: parseFloat(loan!.loanToValue().toFixed(2)) * 100,
          liquidationLtv: loanStats.liquidationLtv.toNumber() * 100,
        });
      }
    } catch (error) {
      console.error("Error fetching Kamino data:", error);
    }
  }, [connection, MAIN_MARKET, wallet.publicKey]);

  /* ------------------------------ DRIFT SETUP ----------------------------- */

  // const initializeDrift = useCallback(async () => {
  //   const driftWallet: IWallet = {
  //     publicKey: wallet.publicKey as PublicKey,
  //     signTransaction: wallet.signTransaction as (tx: Transaction) => Promise<Transaction>,
  //     signAllTransactions: wallet.signAllTransactions as (txs: Transaction[]) => Promise<Transaction[]>,
  //     // Note: payer is optional so we don't need to implement it for web wallet
  //   };

  //   const driftClient = new DriftClient({
  //     connection,
  //     wallet: driftWallet,
  //     env: "mainnet-beta",
  //   });

  //   await driftClient.subscribe();
  // }, [connection, wallet.publicKey]);

  //Render on load and when someone connect wallet or disconnect
  useEffect(() => {
    if (!wallet.publicKey) return;
    const pollInterval = setInterval(getKaminoLoanDetails, 30000); // 30 seconds

    if (wallet.publicKey) {
      getBtcPrice();
      getKaminoLoanDetails();
      // initializeDrift();
    }

    return () => {
      clearInterval(pollInterval);
    };
  }, [wallet.publicKey]);

  const calculateLiquidationPrice = (btcAmount: number, borrowedAmount: number, liquidationLtv: number) => {
    return borrowedAmount / (btcAmount * (liquidationLtv / 100));
  };
  const mockData = {
    btcPrice: 67500, // Current BTC price in USD
    kamino: {
      btcCollateral: 1,
      borrowedUSDC: 30000,
      liquidationPrice: 67000,
      liquidationLtv: 80,
      ltv: 44.4, // Loan-to-Value ratio in percentage
    },
    drift: {
      collateral: 100,
      collateralValue: 1000,
      position: 10000,
      leverage: 10,
      pnl: 1250.5,
      pnlPercentage: 12.5,
      health: 0.5,
    },
  };
  const formatCurrency = (value: number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <Header />
      </div>
      <div className=" space-y-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Position Dashboard</h1>
        <div className="text-right">
          <p className="text-sm text-gray-500">BTC Price</p>
          <p className="text-lg font-bold">{formatCurrency(btcPrice as number)}</p>
        </div>
      </div>

      {/* Kamino Section */}

      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Kamino Positions</h2>
        {!wallet.publicKey ? (
          <div>Please connect wallet</div>
        ) : !kaminoLoanDetails?.collateralValue ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-[125px] w-[250px] rounded-xl" />

            <Skeleton className="h-[125px] w-[250px] rounded-xl" />

            <Skeleton className="h-[125px] w-[250px] rounded-xl" />

            <Skeleton className="h-[125px] w-[250px] rounded-xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">BTC Collateral</CardTitle>
                <CoinsIcon className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kaminoLoanDetails?.collateralAmount} BTC</div>
                <div className="text-sm text-gray-500">${kaminoLoanDetails?.collateralValue}</div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Borrowed USDC</CardTitle>
                <Wallet className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${kaminoLoanDetails?.borrowValueWithBorrowFactor}</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">LTV:</span>
                  <span
                    className={`text-sm font-medium ${
                      mockData.kamino.ltv > 75
                        ? "text-red-500"
                        : mockData.kamino.ltv > 60
                        ? "text-yellow-500"
                        : "text-green-500"
                    }`}
                  >
                    {kaminoLoanDetails?.currentLtv}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Liquidation</CardTitle>
                <DollarSign className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    calculateLiquidationPrice(
                      parseFloat(kaminoLoanDetails?.collateralAmount as string),
                      parseFloat(kaminoLoanDetails?.borrowValueWithBorrowFactor as string),
                      kaminoLoanDetails?.liquidationLtv as number
                    )
                  )}{" "}
                </div>
                <div className="text-xs text-gray-500">Liquidation Price</div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Borrow APR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kaminoLoanDetails?.borrowAPY}% </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Drift Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Drift Positions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collateral</CardTitle>
              <CoinsIcon className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockData.drift.collateral} JUPSOL</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Collateral value:</span>
                <span>{formatCurrency(mockData.drift.collateralValue)}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Position Size</CardTitle>
              <DollarSign className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(mockData.drift.position)} USD</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Leverage</span>
                <span>{mockData.drift.leverage}x</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PnL</CardTitle>
              {mockData.drift.pnl >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${mockData.drift.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(mockData.drift.pnl)}
              </div>
              <p className={`text-sm ${mockData.drift.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                {mockData.drift.pnl >= 0 ? "+" : ""}
                {mockData.drift.pnlPercentage}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Health</CardTitle>
              {mockData.drift.health >= 0.5 ? (
                <Heart fill="red" className="h-4 w-4 text-red-500" />
              ) : (
                <HeartCrackIcon className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${mockData.drift.health >= 0.5 ? "text-green-600" : "text-red-600"}`}>
                {mockData.drift.health}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DeFiPositionDashboard;
