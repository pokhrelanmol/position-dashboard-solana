export const formatCurrency = (value: number | undefined, currency = "USD") => {
  if (!value) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(value);
};

/**
 * Formats a token amount by dividing it by a specified factor and formatting it to a specified number of decimal places.
 * @param value - The number to format.
 * @param decimals - The number of decimal places to format to.
 * @param factor - The factor to divide the value by (e.g., 1e6 for USDC).
 * @returns The formatted number as a string.
 */
export function formatTokenAmount(value: number, decimals: number = 4, factor: number = 1e6): string {
  const formattedValue = value / factor;
  const multiplier = Math.pow(10, decimals);
  const truncatedValue = Math.floor(formattedValue * multiplier) / multiplier;
  return truncatedValue.toFixed(decimals);
}
