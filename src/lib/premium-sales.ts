/** Pause new Premium sales on Vercel Production while keeping existing plans and orders usable. */
export function premiumSalesOpen() {
  return process.env.VERCEL_ENV !== "production" || process.env.PREMIUM_SALES_ENABLED === "true";
}
