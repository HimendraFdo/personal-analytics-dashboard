import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Analytics Dashboard",
  description: "Track study, finance, health, and personal metrics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
