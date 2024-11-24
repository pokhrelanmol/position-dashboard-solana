import React, { useCallback, useEffect, useMemo } from "react";
import { PublicKey, Connection, clusterApiUrl } from "@solana/web3.js";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CoinsIcon,
  TrendingUp,
  DollarSign,
  Percent,
  Heart,
  HeartCrackIcon,
} from "lucide-react";
import Header from "./Header";
import { KaminoMarket, KaminoObligation, ObligationTypeTag } from "@kamino-finance/klend-sdk";
import { useWallet } from "@solana/wallet-adapter-react";
import { getLoan, getMarket } from "@/utils/kaminoHelper";

const DeFiPositionDashboard = () => {
  const wallet = useWallet();
  const rpc_url = import.meta.env.VITE_SOLANA_MAINNET_RPC;

  // Memoize connection and market key to prevent recreating on each render
  const connection = useMemo(() => new Connection(rpc_url), [rpc_url]);

  const MAIN_MARKET = useMemo(() => new PublicKey("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF"), []);

  // Memoize the fetch function to prevent recreation
  const getKaminoLoanDetails = useCallback(async () => {
    if (!wallet.publicKey) return;
    const args = {
      connection,
      marketPubkey: MAIN_MARKET,
      obligationPubkey: wallet.publicKey,
    };

    try {
      const loan: KaminoObligation | null = await getLoan(args);
      console.log("Market and loan data:", { loan });
      //TODO: populate the new state when we actually have some loans
      // and use that instead of mockData
      if (!loan) return;
    } catch (error) {
      console.error("Error fetching Kamino data:", error);
    }
  }, [connection, MAIN_MARKET, wallet.publicKey]);

  //Render on load and when someone connect wallet or disconnect
  useEffect(() => {
    if (!wallet.publicKey) alert("Please Connect wallet");
    const pollInterval = setInterval(getKaminoLoanDetails, 30000); // 30 seconds

    if (wallet.publicKey) getKaminoLoanDetails();

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

  const formatCurrency = (value, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatBTC = (value) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(value);
  };

  const formatPercent = (value) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Calculate BTC value in USD
  const getBTCValue = (btcAmount) => {
    return btcAmount * mockData.btcPrice;
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
          <p className="text-lg font-bold">{formatCurrency(mockData.btcPrice)}</p>
        </div>
      </div>

      {/* Kamino Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Kamino Positions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">BTC Collateral</CardTitle>
              <CoinsIcon className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBTC(mockData.kamino.btcCollateral)} BTC</div>
              <div className="text-sm text-gray-500">{formatCurrency(getBTCValue(mockData.kamino.btcCollateral))}</div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Borrowed USDC</CardTitle>
              <Wallet className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(mockData.kamino.borrowedUSDC)}</div>
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
                  {formatPercent(mockData.kamino.ltv)}%
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
                    mockData.kamino.btcCollateral,
                    mockData.kamino.borrowedUSDC,
                    mockData.kamino.liquidationLtv
                  )
                )}{" "}
              </div>
              <div className="text-xs text-gray-500">Liquidation Price</div>
            </CardContent>
          </Card>
        </div>
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
