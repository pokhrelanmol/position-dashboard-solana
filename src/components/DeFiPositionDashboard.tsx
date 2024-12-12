import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, WalletIcon, CoinsIcon, DollarSign } from "lucide-react";
import Header from "./Header";
import { useEffect, useMemo } from "react";
import { Connection } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { Skeleton } from "./ui/skeleton";
import { useBtcPrice } from "@/hooks/useBtcPrice";
import { useKaminoPosition } from "@/hooks/useKaminoPosition";
import { useDriftPosition } from "@/hooks/useDriftPosition";
import { formatCurrency } from "@/utils/format";

/**
 *  @dev most of fetching of data is done using hooks
 */
const DeFiPositionDashboard = () => {
  const { btcPrice, fetchBtcPrice } = useBtcPrice();
  const wallet = useWallet();
  const rpc_url = import.meta.env.VITE_SOLANA_MAINNET_RPC;

  // Memoize connection and market key to prevent recreating on each render
  const connection = useMemo(() => new Connection(rpc_url), [rpc_url]);
  const { kaminoLoanDetails, userDontHaveBTCUSDCPosition, fetchKaminoLoanDetails } = useKaminoPosition(connection);
  const { initializeDrift, driftPosition } = useDriftPosition(connection);

  //Render on load and when someone connect wallet or disconnect
  useEffect(() => {
    fetchBtcPrice();
    if (!wallet.publicKey) return;
    const pollInterval = setInterval(fetchKaminoLoanDetails, 30000); // 30 seconds

    if (wallet.publicKey) {
      fetchKaminoLoanDetails(wallet.publicKey);
      initializeDrift(wallet);
    }

    return () => {
      clearInterval(pollInterval);
    };
  }, [wallet.publicKey, userDontHaveBTCUSDCPosition]);

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
        <p className="text-sm text-gray-500">Only WBTC/USDC positions</p>
        {!wallet.publicKey ? (
          <div>Please connect wallet</div>
        ) : !kaminoLoanDetails?.collateralValue && !kaminoLoanDetails?.borrowAPY && !userDontHaveBTCUSDCPosition ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, index) => (
              <Skeleton key={index} className="h-[125px] w-[250px] rounded-xl" />
            ))}
          </div>
        ) : userDontHaveBTCUSDCPosition ? (
          <div className="text-2xl text-red-600"> You Don't have WBTC-USDC Position</div>
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
                <WalletIcon className="h-4 w-4 text-gray-500" />
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collateral</CardTitle>
              <CoinsIcon className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{driftPosition.totalDeposit} USDC</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Collateral value:</span>
                <span>${driftPosition.totalDeposit} </span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Position Size</CardTitle>
              <DollarSign className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.abs(Number(driftPosition.positionSizeSol))} SOL</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Position Value</span>
                <span>${Math.abs(Number(driftPosition.positionSizeUsd))}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PnL</CardTitle>
              {Number(driftPosition.pnl) >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${Number(driftPosition.pnl) >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                ${driftPosition.pnl}
              </div>
              {/* <p className={`text-sm ${mockData.drift.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                {mockData.drift.pnl >= 0 ? "+" : ""}
                {mockData.drift.pnlPercentage}%
              </p> */}
            </CardContent>
          </Card>
          {/*TODO: Fetch health related data from drift */}
          {/* <Card className="bg-white">
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
          </Card> */}
        </div>
      </div>
    </div>
  );
};

export default DeFiPositionDashboard;
