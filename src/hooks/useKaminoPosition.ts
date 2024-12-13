import { useCallback, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { ObligationStats } from "@kamino-finance/klend-sdk";
import { getMarket } from "@/utils/kaminoHelper";
import { UserLoansArgs } from "@/utils/kaminoTypes";

const BTC_RESERVE = new PublicKey("HYnVhjsvU1vBKTPsXs1dWe6cJeuU8E4gjoYpmwe81KzN");
const USDC_RESERVE = new PublicKey("D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59");
const MAIN_MARKET_KAMINO = new PublicKey("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF");

export type KaminoLoanDetails = {
  collateralValue: string;
  collateralAmount?: string;
  borrowValueWithBorrowFactor: string;
  borrowAPY: number;
  netPositionValue: string;
  currentLtv: number;
  liquidationLtv: number;
};

export const useKaminoPosition = (connection: Connection) => {
  const [userDontHaveBTCUSDCPosition, setUserDontHaveBTCUSDCPosition] = useState<boolean>();
  const [kaminoLoanDetails, setKaminoLoanDetails] = useState<KaminoLoanDetails>();

  const processLoanDetails = async (loan: any, market: any, currentSlot: number) => {
    let btcDeposit;
    let btcDepositValue;
    let borrowApy = 0; // Initialize with default value

    // Process BTC deposits
    for (const [, deposit] of loan.deposits.entries()) {
      const reserve = market.getReserveByMint(deposit.mintAddress);
      if (!reserve) continue;

      if (reserve.address.equals(BTC_RESERVE)) {
        const decimals = reserve.getMintFactor();
        btcDeposit = deposit.amount.div(decimals).toFixed(6);
        btcDepositValue = deposit.marketValueRefreshed;
        break;
      }
    }

    // Process USDC borrows
    for (const [, borrow] of loan.borrows.entries()) {
      const reserve = market.getReserveByMint(borrow.mintAddress);
      if (!reserve) continue;

      if (reserve.address.equals(USDC_RESERVE)) {
        borrowApy = parseFloat(reserve.totalBorrowAPY(currentSlot).toFixed(2)) * 100;
        break;
      }
    }

    if (!btcDeposit || borrowApy === 0) {
      setUserDontHaveBTCUSDCPosition(true);
      return null;
    }

    const loanStats: ObligationStats = loan.refreshedStats;
    return {
      collateralValue: btcDepositValue?.toFixed(4) as string,
      collateralAmount: btcDeposit,
      borrowValueWithBorrowFactor: loanStats.userTotalBorrow.toFixed(4),
      borrowAPY: borrowApy,
      netPositionValue: loanStats.netAccountValue.toFixed(4),
      currentLtv: parseFloat(loan.loanToValue().toFixed(2)) * 100,
      liquidationLtv: loanStats.liquidationLtv.toNumber() * 100,
    };
  };

  const fetchKaminoLoanDetails = useCallback(
    async (walletPublicKey: PublicKey) => {
      const args: UserLoansArgs = {
        connection,
        marketPubkey: MAIN_MARKET_KAMINO,
        wallet: walletPublicKey,
      };

      try {
        const loans = await getUserLoansForMarket(args);
        if (!loans) {
          //   setUserDontHaveBTCUSDCPosition(true);
          return;
        }
        if (loans?.length === 0) {
          setUserDontHaveBTCUSDCPosition(true);
          return;
        }

        const loan = loans[0];
        const market = await getMarket({ connection, marketPubkey: MAIN_MARKET_KAMINO });
        const currentSlot = await connection.getSlot();

        const loanDetails = await processLoanDetails(loan, market, currentSlot);
        if (loanDetails) {
          setKaminoLoanDetails(loanDetails);
        }
      } catch (error) {
        console.error("Error fetching Kamino data:", error);
      }
    },
    [connection, MAIN_MARKET_KAMINO]
  );

  return {
    kaminoLoanDetails,
    userDontHaveBTCUSDCPosition,
    fetchKaminoLoanDetails,
  };
  async function getUserLoansForMarket(args: UserLoansArgs) {
    if (!args.wallet) return;
    const market = await getMarket(args);
    return market.getAllUserObligations(args.wallet);
  }
};
