import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { SidebarProvider } from '@/providers/SidebarProvider';
export default function DashboardLayout({ children }) {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen bg-background">
                {/* Sidebar - responsive via context */}
                <Sidebar />

                {/* Main content area */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Sticky Header */}
                    <Header />

                    {/* Scrollable main content */}
                    <main className="flex-1 overflow-auto">
                        <div className="container max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
