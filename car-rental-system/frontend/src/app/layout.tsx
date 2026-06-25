import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/components/AuthContext';

export const metadata: Metadata = {
  title: 'ZoomWheels — Car Rental Made Simple',
  description:
    'Browse our fleet of hatchbacks, sedans, SUVs, and luxury cars. Transparent pricing, easy booking, no hidden charges.',
  keywords: [
    'car rental',
    'self drive',
    'hire car',
    'ZoomWheels',
    'Bangalore car rental',
  ],
  openGraph: {
    title: 'ZoomWheels — Car Rental Made Simple',
    description: 'Browse, book, and drive. Transparent pricing, easy booking.',
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
      <body>
        <AuthProvider>
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          <div className="flex min-h-screen flex-col bg-slate-50">
            <Navbar />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
