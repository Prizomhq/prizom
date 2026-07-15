import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
import Script from 'next/script';
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

import ConsentGuard from "@/components/shared/ConsentGuard";
import OnboardingWizard from "@/components/shared/OnboardingWizard";
import CookieBanner from "@/components/shared/CookieBanner";
import MainLayoutWrapper from "@/components/layout/MainLayoutWrapper";
import GuestTracker from "@/components/analytics/GuestTracker";
import RouteChangeTracker from "@/components/analytics/RouteChangeTracker";
import ConsentRestorer from "@/components/analytics/ConsentRestorer";
import { validateEnvironment } from "@/lib/environment_audit";
import GoogleAnalyticsWrapper from "@/components/analytics/GoogleAnalyticsWrapper";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    (process.env.NEXT_PUBLIC_SITE_URL || "https://www.prizom.in").replace("://prizom.in", "://www.prizom.in")
  ),
  title: "Prizom | Collaborative AI Prompt Registry",
  description: "Discover, save, remix, and showcase next-generation AI prompts in a collaborative registry.",
  alternates: {
    canonical: '/',
  },
  icons: {
    apple: '/logo.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const envCheck = validateEnvironment();

  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-[#fcfcfc] text-zinc-900" suppressHydrationWarning>
        {!envCheck.success ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-950 min-h-screen text-center">
            <div className="max-w-md w-full bg-zinc-900 border border-red-500/30 rounded-2xl p-8 shadow-2xl shadow-red-950/20">
              <div className="w-16 h-16 bg-red-950/50 border border-red-500/50 text-red-500 flex items-center justify-center rounded-full text-2xl font-black mx-auto mb-6">
                ⚠
              </div>
              <h1 className="text-xl font-black text-white uppercase tracking-wider mb-2">
                Configuration Error
              </h1>
              <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                The application cannot boot because one or more required environment variables are missing. Please configure them to restore service.
              </p>
              <div className="text-left bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-xs text-red-400 mb-6 space-y-2">
                {envCheck.missing.map(v => (
                  <div key={v} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    <span>{v} is missing</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                Prizom Infrastructure Auditor
              </p>
            </div>
          </div>
        ) : (
          <>
            <Suspense fallback={null}>
              <GuestTracker />
            </Suspense>
            <Navbar />
            <MainLayoutWrapper>
              {children}
            </MainLayoutWrapper>
            <Footer />
            <ConsentGuard />
            <OnboardingWizard />
            <CookieBanner />

            {/* Google Analytics Consent Mode v2 — must load before GA */}
            <Script id="ga-consent-defaults" strategy="beforeInteractive">{`
              window.dataLayer = window.dataLayer || [];
              window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
              
              var consentAnalytics = 'denied';
              try {
                var stored = localStorage.getItem('prizom-cookie-consent');
                if (stored === 'granted') {
                  consentAnalytics = 'granted';
                }
              } catch (e) {
                console.warn('Consent LocalStorage access blocked:', e);
              }

              window.gtag('consent', 'default', {
                analytics_storage: consentAnalytics,
                ad_storage: consentAnalytics,
                ad_user_data: consentAnalytics,
                ad_personalization: consentAnalytics,
                wait_for_update: 500
              });

              // Global Javascript exception tracker
              window.addEventListener('error', function(event) {
                try {
                  window.gtag('event', 'exception', {
                    description: event.message || 'Script error',
                    fatal: true
                  });
                } catch (err) {}
              });
            `}</Script>

            <Suspense fallback={null}>
              <RouteChangeTracker />
            </Suspense>
            <ConsentRestorer />
            <GoogleAnalyticsWrapper gaId={process.env.NEXT_PUBLIC_GA_ID || ""} />
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify([
                  {
                    "@context": "https://schema.org",
                    "@type": "Organization",
                    "name": "Prizom",
                    "url": "https://www.prizom.in",
                    "logo": "https://www.prizom.in/logo.png",
                    "sameAs": [
                      "https://x.com/prizomHQ",
                      "https://instagram.com/prizomHQ",
                      "https://youtube.com/prizomhq"
                    ]
                  },
                  {
                    "@context": "https://schema.org",
                    "@type": "WebSite",
                    "name": "Prizom",
                    "url": "https://www.prizom.in",
                    "potentialAction": {
                      "@type": "SearchAction",
                      "target": "https://www.prizom.in/discover?q={search_term_string}",
                      "query-input": "required name=search_term_string"
                    }
                  }
                ])
              }}
            />
          </>
        )}
      </body>
    </html>
  );
}


