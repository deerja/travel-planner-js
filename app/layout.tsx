import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Roamly — 여행 플래너",
  description: "장소 저장부터 날짜별 일정과 동선까지 한 번에 계획하는 여행 플래너",
  openGraph: {
    title: "Roamly — 여행을 가볍게, 일정은 선명하게",
    description: "저장한 장소와 날짜별 일정, 이동 동선을 한 화면에서 계획하세요.",
    images: [{ url: "/og-v3.png", width: 1731, height: 909, alt: "Roamly 여행 플래너" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Roamly — 여행을 가볍게, 일정은 선명하게",
    description: "장소 저장부터 여행 중 길찾기까지 이어지는 모바일 여행 플래너",
    images: ["/og-v3.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
