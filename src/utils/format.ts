export const formatCurrency = (value: number | undefined, currency = "USD") => {
  if (!value) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(value);
};
