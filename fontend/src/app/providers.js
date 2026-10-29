'use client';
import { AuthProvider } from '@/context/AuthContext';
import { RefsProvider } from '@/context/RefsContext';
import { LateBadgeProvider } from '@/context/LateBadgeContext';
import { NotificationsProvider } from '@/context/NotificationsContext';

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <RefsProvider><LateBadgeProvider><NotificationsProvider>{children}</NotificationsProvider></LateBadgeProvider></RefsProvider>
    </AuthProvider>
  );
}
