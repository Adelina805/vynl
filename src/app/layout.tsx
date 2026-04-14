import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VYNL — Music to Visual Art",
  description:
    "Every song has a visual identity. Paste a Spotify track link and generate gallery-worthy abstract art from its sonic character.",
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
