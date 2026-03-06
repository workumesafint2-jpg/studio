'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';

/**
 * (ወርቁ) Pro - AuthGuard v4.6.0
 * Fixed Hydration Mismatch by ensuring client-side only mount before rendering auth state.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router, mounted]);

  // Prevent hydration mismatch by returning null during server-side rendering
  // and initial client-side hydration pass.
  if (!mounted) {
    return null;
  }

  if (isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">ማንነትዎን በማረጋገጥ ላይ...</p>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
