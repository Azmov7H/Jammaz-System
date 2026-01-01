'use client';

import dynamic from 'next/dynamic';

const SmartNotificationCenterComponent = dynamic(
    () => import('./SmartNotificationCenter').then(mod => mod.SmartNotificationCenter),
    { ssr: false }
);

export function LazyNotificationCenter() {
    return <SmartNotificationCenterComponent />;
}
