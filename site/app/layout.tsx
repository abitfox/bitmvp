import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "BitMVP · 链上资产智能工作台",
    template: "%s · BitMVP",
  },
  description:
    "BitMVP 是一套链上资产智能工作台，由 Portfolio、Swap、Radar、Copilot 四个模块构成完整闭环：查看资产、执行调仓、洞察资金流、用自然语言完成操作。",
  keywords: [
    "Web3",
    "多链钱包",
    "链上资产",
    "Portfolio",
    "Swap",
    "Onchain Analytics",
    "AI Copilot",
    "BitMVP",
  ],
  authors: [{ name: "BitMVP" }],
  openGraph: {
    title: "BitMVP · 链上资产智能工作台",
    description: "One Account, Full Onchain Control.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0E1A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-bg text-fg antialiased">
        <Providers>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
