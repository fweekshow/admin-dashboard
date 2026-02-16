import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Concierge Admin",
  description: "Admin dashboard for managing quick actions",
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

