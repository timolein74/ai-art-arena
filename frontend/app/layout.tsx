import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Art Arena | x402-Powered Art Competition',
  description: 'Daily AI art competition powered by x402 micropayments. Submit your art, compete for prizes, pay only $0.05 to enter.',
  keywords: ['AI art', 'competition', 'x402', 'crypto', 'USDC', 'Base'],
  openGraph: {
    title: 'AI Art Arena',
    description: 'Daily AI art competition powered by x402',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
