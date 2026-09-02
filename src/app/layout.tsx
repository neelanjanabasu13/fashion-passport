import type { Metadata } from "next";
import "./globals.css";
import "./verdict.css";

export const metadata: Metadata = {
  title: "Fashion Passport — your taste, everywhere",
  description: "A portable personal relevance layer for fashion shopping, powered by WebMCP.",
  other: { "fashion-passport-app": "true" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
