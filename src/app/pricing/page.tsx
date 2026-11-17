import { Pricing } from "@/components/pricing";
import { premiumSalesOpen } from "@/lib/premium-sales";
export const metadata = { title: "Bảng giá" };
export default function Page() {
  return <Pricing salesOpen={premiumSalesOpen()} />;
}
