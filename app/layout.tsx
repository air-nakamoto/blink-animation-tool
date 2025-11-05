import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: '瞬きアニメーションPNG作成ツール',
  description: '3枚の画像から自然な瞬きアニメーションを生成。完全無料・登録不要。TRPGの立ち絵や、ゲーム制作などに素材に活用いただけます。',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: '瞬きアニメーションPNG作成ツール',
    description: '3枚の画像から自然な瞬きアニメーションを生成。完全無料・登録不要。TRPGの立ち絵や、ゲーム制作などに素材に活用いただけます。',
    url: 'https://blink-animation-tool.vercel.app',
    siteName: '瞬きアニメーションPNG作成ツール',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '瞬きアニメーションPNG作成ツール',
    description: '3枚の画像から自然な瞬きアニメーションを生成。TRPGの立ち絵や、ゲーム制作などに素材に活用いただけます。',
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
