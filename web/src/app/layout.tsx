import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'مِيزان — خطة وجبات ومشتريات بميزانيتك',
  description: 'خطط وجبات أسرتك، ونظّم مخزون مطبخك، واشترِ بأفضل سعر من كارفور وبنده والعثيم والدانوب والتميمي — بالريال السعودي.',
};

export const viewport: Viewport = {
  themeColor: '#121417',
};

const preload = [
  'thmanyahsans-Regular',
  'thmanyahsans-Bold',
  'thmanyahserifdisplay-Bold',
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        {preload.map((f) => (
          <link key={f} rel="preload" href={`/fonts/${f}.woff2`} as="font" type="font/woff2" crossOrigin="anonymous" />
        ))}
      </head>
      <body>{children}</body>
    </html>
  );
}
