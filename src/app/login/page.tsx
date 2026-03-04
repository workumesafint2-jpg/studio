
'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser, initiateEmailSignIn, initiateEmailSignUp } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, Loader2, ArrowLeft, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Institutional Redirect: Watch for auth state changes
  useEffect(() => {
    if (!isUserLoading && user) {
      setLoading(false);
      toast({
        title: "እንኳን ደህና መጡ",
        description: "ወርቁ ነኝ፣ ወደ መቆጣጠሪያ ገጹ በመግባት ላይ ነዎት።",
      });
      router.push('/admin');
    }
  }, [user, isUserLoading, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      setErrorMessage("የቢሮው የደመና አገልግሎት አልተገናኘም።");
      return;
    }
    
    setLoading(true);
    setErrorMessage(null);
    
    try {
      if (isSignUp) {
        // initiateEmailSignUp is non-blocking, so we use a timeout for potential errors
        initiateEmailSignUp(auth, email, password);
      } else {
        // initiateEmailSignIn is non-blocking
        initiateEmailSignIn(auth, email, password);
      }
      
      // Since initiate functions are non-blocking and don't return results,
      // we set a safety timeout to reset the loading state if no auth change happens.
      setTimeout(() => {
        if (!user) {
          setLoading(false);
          setErrorMessage("መግባት አልተቻለም። እባክዎን የኢሜይል እና የይለፍ ቃልዎን ትክክለኛነት ያረጋግጡ ወይም አዲስ አካውንት ይፍጠሩ።");
        }
      }, 5000);

    } catch (err: any) {
      console.error("Login Error Catch:", err);
      setLoading(false);
      setErrorMessage("የቴክኒክ ስህተት አጋጥሟል። እባክዎን ቆይተው ይሞክሩ።");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            {isSignUp ? <UserPlus className="w-7 h-7 text-primary" /> : <ShieldCheck className="w-7 h-7 text-primary" />}
          </div>
          <CardTitle className="text-2xl font-bold uppercase tracking-tight text-primary">
            {isSignUp ? 'አዲስ አካውንት ይፍጠሩ' : 'የቢሮ መግቢያ (Portal Login)'}
          </CardTitle>
          <CardDescription className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-bold">
            Innovation & Technology Development Bureau
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <Alert variant="destructive" className="mb-6 border-none bg-red-50 text-red-900 rounded-xl">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-xs font-bold uppercase">ስህተት</AlertTitle>
              <AlertDescription className="text-[11px] leading-relaxed">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">ኢሜይል (Email)</label>
              <Input 
                type="email" 
                placeholder="user@itdb.gov.et" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl bg-slate-50 border-none shadow-inner"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">የይለፍ ቃል (Password)</label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl bg-slate-50 border-none shadow-inner"
                required
                disabled={loading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 font-bold bg-primary hover:bg-primary/90 shadow-lg rounded-xl transition-all active:scale-[0.98]" 
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                isSignUp ? <UserPlus className="w-4 h-4 mr-2" /> : <LogIn className="w-4 h-4 mr-2" />
              )}
              {isSignUp ? 'ተመዝገብ (Sign Up)' : 'ግባ (Login)'}
            </Button>
          </form>
          
          <div className="mt-8 flex flex-col gap-5 text-center">
            <button 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMessage(null);
              }}
              className="text-[11px] font-black text-primary hover:underline uppercase tracking-wider"
              disabled={loading}
            >
              {isSignUp ? 'አካውንት አለዎት? ይግቡ' : 'አዲስ ተጠቃሚ ነዎት? እዚህ ይመዝገቡ'}
            </button>
            
            <div className="h-px bg-slate-100 w-full" />
            
            <Link href="/" className="inline-flex items-center justify-center text-[10px] font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-[0.2em]">
              <ArrowLeft className="w-3 h-3 mr-2" /> ወደ ዋናው ገጽ ተመለስ
            </Link>
          </div>
        </CardContent>
      </Card>
      
      <p className="fixed bottom-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] pointer-events-none">
        ወርቁ ነኝ ምን ልርዳዎት?
      </p>
    </div>
  );
}
