import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { SidebarProvider } from '@/providers/SidebarProvider';
import { NotificationProvider } from '@/context/NotificationContext';
import { LazyNotificationCenter } from '@/components/notifications/LazyNotificationCenter';
export default function DashboardLayout({ children }) {
    return (
        <NotificationProvider>
            <SidebarProvider>
                <a href="#main-content" className="skip-link">
                    انتقل إلى المحتوى الرئيسي
                </a>
                <div className="flex min-h-screen bg-background">
                    {/* Sidebar - responsive via context */}
                    <Sidebar />

                    {/* Main content area */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* Sticky Header */}
                        <Header />

                        {/* Scrollable main content */}
                        <main id="main-content" tabIndex={-1} className="flex-1 overflow-auto outline-none">
                            <div className="container max-w-7xl 2xl:max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
                                {children}
                            </div>
                        </main>
                    </div>
                </div>
                <LazyNotificationCenter />
            </SidebarProvider>
        </NotificationProvider>
    );
}
