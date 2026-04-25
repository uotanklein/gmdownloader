import type { Metadata } from 'next';
import { IBM_Plex_Mono, Space_Grotesk } from 'next/font/google';
import './globals.css';

const displayFont = Space_Grotesk({
    variable: '--font-display',
    subsets: ['latin'],
});

const monoFont = IBM_Plex_Mono({
    variable: '--font-mono',
    subsets: ['latin'],
    weight: ['400', '500'],
});

export const metadata: Metadata = {
    title: 'GMDownloader',
    description: 'Скачивание, просмотр и редактирование аддонов Garry\'s Mod из Steam Workshop.',
    icons: {
        icon: '/logo.png',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang='ru'>
            <body className={`${displayFont.variable} ${monoFont.variable} antialiased`}>
                {children}
            </body>
        </html>
    );
}
