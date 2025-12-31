import './globals.css';
import QueryProvider from '@/providers/QueryProvider';

export const metadata = {
  title: 'مخازن الجماز',
  description: 'نظام إدارة المخازن المتكامل',
};

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { NotificationProvider } from "@/context/NotificationContext";
import { SmartNotificationCenter } from "@/components/notifications/SmartNotificationCenter";

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground transition-colors duration-300">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <NotificationProvider>
              {children}
              <SmartNotificationCenter />
              <Toaster position="top-center" richColors />
            </NotificationProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
