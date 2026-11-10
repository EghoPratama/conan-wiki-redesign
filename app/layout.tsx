import type { Metadata } from 'next';
import '@fontsource-variable/archivo/wdth.css';
import './globals.css';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export const metadata: Metadata = {
  title: {
    default: 'Detective Conan Wiki',
    template: '%s | Detective Conan Wiki',
  },
  description:
    'Episodes, chapters, characters and news for Detective Conan. A redesign of Detective Conan Wiki.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <a className="sr-only" href="#main">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
