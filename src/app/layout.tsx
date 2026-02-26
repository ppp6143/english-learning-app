import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { SITE_URL, SITE_NAME } from '@/src/lib/siteConfig';
import './globals.css';

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: `${SITE_NAME} — 写真を撮るだけで英単語レベルがわかる`,
        template: `%s | ${SITE_NAME}`,
    },
    description: '英語テキストの写真を撮るだけで、CEFR基準であなたのレベルに合った単語をハイライト。47,000語のオフライン辞書で瞬時に和訳表示。無料の英単語分析ツール。',
    keywords: ['英単語', 'CEFR', '英語学習', 'ボキャブラリー', 'OCR', '単語レベル', '英語 写真 翻訳', 'WordLens', '句動詞', '英検', 'TOEIC'],
    authors: [{ name: SITE_NAME }],
    openGraph: {
        type: 'website',
        locale: 'ja_JP',
        siteName: SITE_NAME,
    },
    twitter: {
        card: 'summary_large_image',
    },
    robots: {
        index: true,
        follow: true,
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5, // Allow zooming
    userScalable: true,
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ja" className="dark">
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="antialiased bg-gray-950 text-gray-100">
                {children}
                <Analytics />
            </body>
        </html>
    );
}
