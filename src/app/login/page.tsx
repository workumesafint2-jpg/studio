'use client';

import { useState } from 'react';
import { useAuth, initiateEmailSignIn } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setLoading(true);
    try {
      initiateEmailSignIn(auth, email, password);
      // Auth state change will be handled by the layout/guard
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl font-bold uppercase tracking-tight text-primary">የቢሮ መግቢያ (Admin Portal)</CardTitle>
          <CardDescription className="text-xs text-slate-500 uppercase tracking-widest">ITDB Institutional Security</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ኢሜይል (Email)</label>
              <Input 
                type="email" 
                placeholder="admin@itdb.gov.et" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">የይለፍ ቃል (Password)</label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
                required
              />
            </div>
            <Button type="submit" className="w-full h-12 font-bold bg-primary hover:bg-primary/90 shadow-md" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
              ግባ (Login)
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Link href="/" className="inline-flex items-center text-[10px] font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-widest">
              <ArrowLeft className="w-3 h-3 mr-2" /> ወደ ዋናው ገጽ ተመለስ
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}