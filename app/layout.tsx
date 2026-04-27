import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Story-Bildr",
  description: "Generate AI-themed serial novel websites with Supabase PDF episodes.",
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
