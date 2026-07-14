import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Broken Hill Hotel Ordering",
  description: "Order food online from the Broken Hill Hotel."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
