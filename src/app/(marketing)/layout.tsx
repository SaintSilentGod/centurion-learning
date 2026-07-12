import { Golos_Text, Manrope } from "next/font/google";
import "@/components/marketing/marketing.css";

const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-golos",
});

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["700", "800"],
  variable: "--font-manrope",
});

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`mkt ${golos.variable} ${manrope.variable}`}>{children}</div>
  );
}
