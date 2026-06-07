import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Analytics Dashboard",
  description: "Track study, finance, health, and personal metrics",
};

const clerkTelemetry = {
  disabled:
    process.env.NEXT_PUBLIC_CLERK_TELEMETRY_DISABLED === "true" ||
    process.env.NODE_ENV !== "production",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider telemetry={clerkTelemetry}>{children}</ClerkProvider>
      </body>
    </html>
  );
}
