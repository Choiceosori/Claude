import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MusicRecord | 1인 1악기 연주 기록",
  description: "학생 악기 연주 자세 녹화 및 제출, 교사 피드백을 위한 웹앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950">{children}</body>
    </html>
  );
}
