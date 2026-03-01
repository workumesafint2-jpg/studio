'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

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