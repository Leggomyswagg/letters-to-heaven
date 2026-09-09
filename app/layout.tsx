import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Letters to Heaven — A quiet place for what remains",
  description: "A private place to write, remember, and keep what matters close.",
  metadataBase: new URL("https://letters-to-heaven.com"),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
