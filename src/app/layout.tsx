import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import { BottomNav } from "@/components/BottomNav";

import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });

export const metadata: Metadata = {
  title: "Yonja · Report it, clean it, prove it",
  description:
    "Yonja turns every clean-up on Uganda's National Cleaning Days into a verified, mapped record.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#146c43",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="font-sans antialiased">
        <div className="mx-auto min-h-dvh max-w-xl pb-20">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}
