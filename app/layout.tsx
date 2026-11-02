import type { Metadata } from 'next';

import './globals.css';
import { ArtinSiteFrame, siteMetadata } from '@/lib/artin-site';

const baseMetadata: Metadata = {
  title: 'My website',
  description: 'Built with Artin.',
};

export async function generateMetadata(): Promise<Metadata> {
  return siteMetadata(baseMetadata);
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased"><ArtinSiteFrame>{children}</ArtinSiteFrame></body>
    </html>
  );
}
