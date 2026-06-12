import { Inter } from 'next/font/google';
import './globals.css';
import { LayoutWrapper } from '@/components/LayoutWrapper';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: 'FleetGuard | Gestão Inteligente de Frotas',
  description:
    'Reduza custos operacionais e aumente a vida útil da sua frota com manutenção preventiva inteligente.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#f4f7fb] text-zinc-950">
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
