import { Suspense } from 'react';
import CustomerClient from './CustomerClient';
import { Loader2 } from 'lucide-react';

async function CustomerContent({ params }) {
    const { id } = await params;
    return <CustomerClient id={id} />;
}

export default function CustomerDetailPage({ params }) {
    return (
        <Suspense fallback={<div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>}>
            <CustomerContent params={params} />
        </Suspense>
    );
}
