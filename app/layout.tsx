import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sikkerhedsapp - Auth & 2FA Demo",
  description: "Authentication and Two-Factor Authentication Demo App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
