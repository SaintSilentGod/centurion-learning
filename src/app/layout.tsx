import type { Metadata } from "next";
import "./globals.css";
import { APP_NAME } from "@/constants/ru";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Платформа обучения сотрудников",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 text-lg leading-relaxed antialiased">
        {children}
      </body>
    </html>
  );
}
