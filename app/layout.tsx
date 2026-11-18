// Copyright (c) 2026 Manjeet2684. All rights reserved.
import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "YUGORA — A connection, only when it's mutual.",
  description: "Discover new people. Express interest privately. Connect only when it is mutual.",
  applicationName: "YUGORA",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
