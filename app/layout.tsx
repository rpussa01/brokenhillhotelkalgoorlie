import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://brokenhillhotelboulder.com"),

  title: {
    default: "Broken Hill Hotel | Restaurant • Bar • Accommodation | Boulder WA",
    template: "%s | Broken Hill Hotel",
  },

  description:
    "Enjoy great pub meals, ice cold drinks, comfortable accommodation and online ordering at the Broken Hill Hotel in Boulder, Western Australia.",

  keywords: [
    "Broken Hill Hotel",
    "Boulder Hotel",
    "Kalgoorlie Pub",
    "Restaurant Boulder WA",
    "Pub Meals",
    "Accommodation Boulder",
    "Bottle Shop",
    "Sports Bar",
    "Online Food Ordering",
    "Broken Hill Hotel Boulder",
  ],

  authors: [
    {
      name: "Broken Hill Hotel",
    },
  ],

  creator: "Broken Hill Hotel",

  openGraph: {
    title: "Broken Hill Hotel",
    description:
      "Great food, cold beer, accommodation and online ordering in Boulder, Western Australia.",

    url: "https://brokenhillhotelboulder.com",

    siteName: "Broken Hill Hotel",

    locale: "en_AU",

    type: "website",
  },

  twitter: {
    card: "summary_large_image",

    title: "Broken Hill Hotel",

    description:
      "Great food, cold beer and accommodation in Boulder.",
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
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