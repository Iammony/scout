import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/lib/contexts/theme-context";
import { BreadcrumbProvider } from "@/lib/contexts/breadcrumb-context";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import "../styles/globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: "Scout - AI Travel Planner",
  description: "Plan your perfect journey with AI-powered travel recommendations",
  keywords: "travel planner, AI travel, trip planning, travel guide, travel assistant",
  authors: [{ name: "Scout Team" }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Scout - AI Travel Planner",
    description: "Plan your perfect journey with AI-powered travel recommendations",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Scout - AI Travel Planner",
    description: "Plan your perfect journey with AI-powered travel recommendations",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'dark';
                document.documentElement.classList.add(theme);
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} ${inter.variable}`}>
        <ErrorBoundary>
          <ThemeProvider>
            <BreadcrumbProvider>
              <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-black font-sans antialiased transition-colors duration-300">
                {children}
              </div>
            </BreadcrumbProvider>
          </ThemeProvider>
        </ErrorBoundary>
        <SpeedInsights />
      </body>
    </html>
  );
}
