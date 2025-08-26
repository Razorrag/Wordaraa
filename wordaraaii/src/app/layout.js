// src/app/layout.js

import "../styles/globals.css"; // Import Tailwind styles from src/styles
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Wordara",
  description: "Your AI-powered assistant",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
