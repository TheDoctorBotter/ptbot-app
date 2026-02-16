import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        <title>Justin Lemmo, PT, DPT : PTBot Virtual Physical Therapy</title>

        {/* PWA Support */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#C41E3A" />
        <link rel="icon" type="image/png" href="/icons/icon-96x96.png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="PTBot" />

        {/* Open Graph Meta Tags */}
        <meta
          property="og:title"
          content="Justin Lemmo, PT, DPT : PTBot Virtual Physical Therapy"
        />
        <meta
          property="og:description"
          content="Licensed Doctor of Physical Therapy with 15+ years experience. Virtual PT services for orthopedics, pediatrics, and PTBot consultation. Texas License #1215276."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://justinlemmodpt.com" />
        <meta
          property="og:image"
          content="https://justinlemmodpt.com/Logo copy.png"
        />
        <meta
          property="og:site_name"
          content="Dr. Justin Lemmo Virtual Physical Therapy"
        />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Justin Lemmo, PT, DPT : PTBot Virtual Physical Therapy"
        />
        <meta
          name="twitter:description"
          content="Licensed Doctor of Physical Therapy with 15+ years experience. Virtual PT services for orthopedics, pediatrics, and PTBot consultation."
        />
        <meta
          name="twitter:image"
          content="https://justinlemmodpt.com/Logo copy.png"
        />

        {/* Additional SEO Meta Tags */}
        <meta
          name="description"
          content="Dr. Justin Lemmo, PT, DPT - Licensed physical therapist offering virtual PT services. Specializing in orthopedics, pediatrics, and PTBot AI consultation. Texas License #1215276."
        />
        <meta
          name="keywords"
          content="virtual physical therapy, telehealth PT, PTBot, orthopedics, pediatric PT, Texas physical therapist, Dr. Justin Lemmo"
        />
        <meta name="author" content="Dr. Justin Lemmo, PT, DPT" />

        <ScrollViewStyleReset />
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    console.log('SW registered:', reg.scope);
                  }).catch(function(err) {
                    console.log('SW registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
