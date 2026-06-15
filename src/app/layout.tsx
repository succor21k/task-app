import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "작업지시서 관리 시스템",
  description: "현장 작업자를 위한 모바일 뷰어",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
