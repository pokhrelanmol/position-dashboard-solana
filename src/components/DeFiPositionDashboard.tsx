import React, { useEffect } from "react";
import { PublicKey, Connection, clusterApiUrl } from "@solana/web3.js";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Wallet, CoinsIcon, TrendingUp, DollarSign, Percent } from "lucide-react";
import Header from "./Header";
import getProvider from "@/utils/provider";
import solanaWeb3 from "@solana/web3.js";
import { KaminoMarket } from "@kamino-finance/klend-sdk";
import { createSolanaRpc } from "@solana/web3.js";

const DeFiPositionDashboard = () => {
  const provider = getProvider();
  const connection = new Connection(clusterApiUrl("mainnet-beta"));

  const MAIN_MARKET = new PublicKey("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF");

  const getMarketData = async () => {
    try {
      const market = await KaminoMarket.load(connection, MAIN_MARKET);
    } catch (error) {
      console.log(error);
    }
    // console.log(market.reserves.map((reserve) => reserve.config.loanToValueRatio));
  };

  useEffect(() => {
    getMarketData();
  }, []);

  const mockData = {
    btcPrice: 67500, // Current BTC price in USD
    kamino: {
      btcPosition: 0.45,
      borrowedUSDC: 5000,
      deposit: 10000,
      ltv: 35.5, // Loan-to-Value ratio in percentage
    },
    drift: {
      position: 0.65,
      pnl: 1250.5,
      pnlPercentage: 12.5,
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
              <CardTitle className="text-sm font-medium">BTC Position</CardTitle>
              <CoinsIcon className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBTC(mockData.kamino.btcPosition)} BTC</div>
              <div className="text-sm text-gray-500">{formatCurrency(getBTCValue(mockData.kamino.btcPosition))}</div>
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
              <CardTitle className="text-sm font-medium">Deposit</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(mockData.kamino.deposit)}</div>
              <div className="text-xs text-gray-500">Total Collateral Value</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Drift Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Drift Positions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Position Size</CardTitle>
              <CoinsIcon className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBTC(mockData.drift.position)} BTC</div>
              <div className="text-sm text-gray-500">{formatCurrency(getBTCValue(mockData.drift.position))}</div>
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
        </div>
      </div>
    </div>
  );
};

export default DeFiPositionDashboard;
