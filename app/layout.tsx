import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Buku Tabungan — Savings Management",
  description:
    "Sistem manajemen tabungan profesional dengan fitur multi-peran, transaksi, dan pelaporan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  );
}
