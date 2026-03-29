import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CARSI | Booking Mobil Dengan Sopir",
  description:
    "Aplikasi booking mobil dengan sopir untuk kebutuhan rental mobil pedesaan.",
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
