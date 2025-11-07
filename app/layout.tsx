import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: '瞬きアニメーションPNG作成ツール',
  description: '3枚の画像（開いた目・半開き・閉じた目）から瞬きアニメーションPNGが作れます。ブラウザだけで完結、登録も不要です。TRPGの立ち絵や、ゲーム制作の素材にお使いいただけます。',
  keywords: ['まばたきAPNG', 'TRPG', 'ココフォリア', '立ち絵', '瞬き', 'アニメーション', 'APNG'],
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: '瞬きアニメーションPNG作成ツール',
    description: '3枚の画像（開いた目・半開き・閉じた目）から瞬きアニメーションPNGが作れます。\nブラウザだけで完結、登録も不要です。\nTRPGの立ち絵や、ゲーム制作の素材にお使いいただけます。',
    url: 'https://blink-animation-tool.vercel.app',
    siteName: '瞬きアニメーションツール',
    locale: 'ja_JP',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 2604,
        height: 1064,
        alt: '瞬きアニメーションツールのスクリーンショット',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '瞬きアニメーションPNG作成ツール',
    description: '3枚の画像（開いた目・半開き・閉じた目）から瞬きアニメーションPNGが作れます。\nブラウザだけで完結、登録も不要です。\nTRPGの立ち絵や、ゲーム制作の素材にお使いいただけます。',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
