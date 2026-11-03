import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ApiForge — Enterprise API Contract & Documentation Platform',
  description: 'Design, document, test, and govern API contracts with zero cloud lock-in.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
