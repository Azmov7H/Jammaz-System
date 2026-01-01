'use client';

import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Error Boundary Component
 * Catches React errors and displays a user-friendly error message
 */
export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('❌ ErrorBoundary caught:', error, errorInfo);

        // You could also log to an error reporting service here
        // e.g., Sentry.captureException(error);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8 bg-background" dir="rtl">
                    <div className="flex flex-col items-center gap-4 max-w-md text-center">
                        <div className="p-4 rounded-full bg-destructive/10">
                            <AlertTriangle className="h-16 w-16 text-destructive" />
                        </div>

                        <h2 className="text-3xl font-bold text-foreground">
                            حدث خطأ غير متوقع
                        </h2>

                        <p className="text-muted-foreground text-lg">
                            {this.state.error?.message || 'حدث خطأ في التطبيق. يرجى إعادة تحميل الصفحة.'}
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="w-full p-4 mt-2 bg-muted rounded-lg text-left overflow-auto max-h-40">
                                <pre className="text-xs text-destructive">
                                    {this.state.error.stack}
                                </pre>
                            </div>
                        )}

                        <div className="flex gap-3 mt-4">
                            <Button
                                onClick={this.handleReset}
                                className="gap-2"
                                size="lg"
                            >
                                <RefreshCw className="h-5 w-5" />
                                إعادة تحميل الصفحة
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => window.history.back()}
                                size="lg"
                            >
                                العودة للخلف
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
