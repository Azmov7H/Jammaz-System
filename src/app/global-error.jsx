'use client';

import './globals.css';

export default function GlobalError({ error, reset }) {
    return (
        <html lang="ar" dir="rtl">
            <body className="bg-background text-foreground">
                <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 p-8">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <h2 className="text-2xl font-bold tracking-tight">خطأ في النظام</h2>
                        <p className="text-muted-foreground">
                            تعذر تحميل التطبيق. يرجى المحاولة مرة أخرى.
                        </p>
                    </div>
                    <button type="button"
                        onClick={() => reset()}
                        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                    >
                        حاول مرة أخرى
                    </button>
                </div>
            </body>
        </html>
    );
}
