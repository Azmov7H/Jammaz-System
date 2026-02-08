import './globals.css';
import QueryProvider from '@/providers/QueryProvider';
import { Cairo } from 'next/font/google';
import { LazyNotificationCenter } from '@/components/notifications/LazyNotificationCenter';

const cairo = Cairo({
  subsets: ['arabic'],
  variable: '--font-cairo',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'Arial', 'sans-serif'],
});



export const metadata = {
  title: 'مخازن الجماز',
  description: 'نظام إدارة المخازن المتكامل',
};

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { NotificationProvider } from "@/context/NotificationContext";

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${cairo.className} font-sans antialiased bg-background text-foreground transition-colors duration-300`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <NotificationProvider>
              {children}
              <LazyNotificationCenter />
              <Toaster position="top-center" richColors />
            </NotificationProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
