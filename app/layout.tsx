import type { Metadata } from 'next';
import '@fontsource-variable/archivo/wdth.css';
import './globals.css';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { SITE_NAME, siteUrl } from '@/lib/seo';

const DESCRIPTION =
  'Episodes, chapters, characters and news for Detective Conan. A redesign of Detective Conan Wiki.';

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_US',
    title: SITE_NAME,
    description: DESCRIPTION,
  },
  twitter: { card: 'summary_large_image', title: SITE_NAME, description: DESCRIPTION },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Pasang tema pilihan pengguna sebelum render pertama (tanpa ini halaman berkedip terang -> gelap) */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}",
          }}
        />
      </head>
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
