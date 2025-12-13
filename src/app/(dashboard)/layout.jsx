import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function DashboardLayout({ children }) {
    return (
        <div className="flex h-screen bg-slate-50 dark:bg-background overflow-hidden transition-colors duration-300">
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
                <Sidebar />
            </div>
            <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <main className="flex-1 overflow-auto p-6 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
