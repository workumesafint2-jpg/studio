
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';

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

  if (!mounted) {
    return null;
  }

  if (isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#1e3a8a] animate-spin" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">ማንነትዎን በማረጋገጥ ላይ...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
