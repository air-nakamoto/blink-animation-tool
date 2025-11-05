import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: '瞬きアニメーションPNG作成ツール',
  description: '3枚の画像から自然な瞬きアニメーションを生成。完全無料・登録不要。TRPGの立ち絵や、ゲーム制作などの素材に活用いただけます。',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: '瞬きアニメーションPNG作成ツール',
    description: '3枚の画像から自然な瞬きアニメーションを生成。完全無料・登録不要。TRPGの立ち絵や、ゲーム制作などの素材に活用いただけます。',
    url: 'https://blink-animation-tool.vercel.app',
    siteName: '瞬きアニメーションPNG作成ツール',
    locale: 'ja_JP',
    type: 'website',
    images: [
      {
        url: 'https://blink-animation-tool.vercel.app/ogp.png',
        width: 1200,
        height: 630,
        alt: '瞬きアニメーションPNG作成ツール',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '瞬きアニメーションPNG作成ツール',
    description: '3枚の画像から自然な瞬きアニメーションを生成。TRPGの立ち絵や、ゲーム制作などの素材に活用いただけます。',
    images: ['https://blink-animation-tool.vercel.app/ogp.png'],
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
