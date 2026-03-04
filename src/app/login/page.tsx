'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser, initiateEmailSignIn, initiateEmailSignUp } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, Loader2, ArrowLeft, UserPlus, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Institutional Redirect: Watch for auth state changes
  useEffect(() => {
    if (!isUserLoading && user) {
      toast({
        title: "እንኳን ደህና መጡ",
        description: "ወርቁ ነኝ፣ ወደ መቆጣጠሪያ ገጹ በመግባት ላይ ነዎት።",
      });
      router.push('/admin');
    }
  }, [user, isUserLoading, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setLoading(true);
    
    try {
      if (isSignUp) {
        initiateEmailSignUp(auth, email, password);
      } else {
        initiateEmailSignIn(auth, email, password);
      }
      // Redirection is handled by the useEffect hook above
    } catch (err: any) {
      console.error(err);
      toast({
        title: "የመግቢያ ስህተት",
        description: "እባክዎን መረጃዎን በትክክል ማስገባትዎን ያረጋግጡ።",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            {isSignUp ? <UserPlus className="w-6 h-6 text-primary" /> : <ShieldCheck className="w-6 h-6 text-primary" />}
          </div>
          <CardTitle className="text-xl font-bold uppercase tracking-tight text-primary">
            {isSignUp ? 'አዲስ አካውንት ይፍጠሩ' : 'የቢሮ መግቢያ (Portal Login)'}
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 uppercase tracking-widest">
            {isSignUp ? 'ITDB User Registration' : 'ITDB Institutional Security'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ኢሜይል (Email)</label>
              <Input 
                type="email" 
                placeholder="user@itdb.gov.et" 
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
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                isSignUp ? <UserPlus className="w-4 h-4 mr-2" /> : <LogIn className="w-4 h-4 mr-2" />
              )}
              {isSignUp ? 'ተመዝገብ (Sign Up)' : 'ግባ (Login)'}
            </Button>
          </form>
          
          <div className="mt-4 flex flex-col gap-4 text-center">
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest"
            >
              {isSignUp ? 'አካውንት አለዎት? ይግቡ' : 'አዲስ ተጠቃሚ ነዎት? ይመዝገቡ'}
            </button>
            
            <Link href="/" className="inline-flex items-center justify-center text-[10px] font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-widest">
              <ArrowLeft className="w-3 h-3 mr-2" /> ወደ ዋናው ገጽ ተመለስ
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
