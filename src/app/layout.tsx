import type { Metadata } from "next";
import "./globals.css";
import { THEME_STORAGE_KEY } from "@/lib/constants";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='light')document.documentElement.setAttribute('data-theme','light');}catch(e){}})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

