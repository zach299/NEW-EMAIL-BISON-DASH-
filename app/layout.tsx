import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EmailBison Dashboard",
  description: "Cold email performance reporting",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
