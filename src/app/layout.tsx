import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'WordLens — English Vocabulary Analyzer',
    description: 'Upload English text images and discover vocabulary at your CEFR level',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="antialiased bg-gray-950 text-gray-100">
                {children}
            </body>
        </html>
    );
}
