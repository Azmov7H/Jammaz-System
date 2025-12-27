// Re-usable Page Header Component
export function PageHeader({ title, description, children, className = '' }) {
    return (
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-slide-in-right ${className}`}>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    {title}
                </h1>
                {description && (
                    <p className="text-sm md:text-base text-muted-foreground mt-1">
                        {description}
                    </p>
                )}
            </div>
            {children && (
                <div className="flex flex-wrap gap-2 animate-scale-in">
                    {children}
                </div>
            )}
        </div>
    );
}

// Re-usable Search Card Component
export function SearchCard({ children, className = '' }) {
    return (
        <div className={`flex gap-2 md:gap-4 items-center glass-card p-3 md:p-4 rounded-lg border shadow-custom-md hover-lift transition-all duration-300 ${className}`}>
            {children}
        </div>
    );
}

// Re-usable Table Container Component  
export function TableContainer({ children, className = '' }) {
    return (
        <div className={`glass-card rounded-lg border shadow-custom-md overflow-x-auto hover-lift transition-all duration-300 ${className}`}>
            {children}
        </div>
    );
}
