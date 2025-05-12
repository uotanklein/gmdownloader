import StoreProvider from '@/app/StoreProvider';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'gmdownloader',
    description: '',
    icons: {
        icon: 'logo.png',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html className='h-full' lang='en'>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}>
                <StoreProvider>{children}</StoreProvider>
            </body>
        </html>
    );
}
