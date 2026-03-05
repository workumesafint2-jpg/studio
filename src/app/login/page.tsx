
'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft, UserPlus, LogIn, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from 'next/image';

/**
 * (ወርቁ) Pro - Institutional Login Page v4.3.5
 * Stable Deployment Sync
 */
export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if Firebase is actually configured
    if (!auth) {
      setErrorMessage("የቢሮው የደመና አገልግሎት (Firebase) አልተገናኘም። እባክዎን በ Deployment Platform (Vercel/Netlify) ላይ Environment Variables መዋቀራቸውን ያረጋግጡ።");
      return;
    }
    
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        setSuccessMessage("የምዝገባ ጥያቄዎ ተሳክቷል። አሁን መግባት ይችላሉ።");
        toast({ title: "ተመዝግበዋል", description: "አካውንትዎ በትክክል ተከፍቷል።" });
        setIsSignUp(false);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "እንኳን ደህና መጡ", description: "ወርቁ ነኝ፣ ወደ መቆጣጠሪያ ገጹ በመግባት ላይ ነዎት።" });
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      let msg = "መግባት አልተቻለም። እባክዎን የኢሜይል እና የይለፍ ቃልዎን ያረጋግጡ።";
      
      // Detailed error feedback for users
      if (err.code === 'auth/email-already-in-use') msg = "ይህ ኢሜይል ቀድሞ ተመዝግቧል።";
      if (err.code === 'auth/weak-password') msg = "የይለፍ ቃሉ ቢያንስ 6 ፊደላት መሆን አለበት።";
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') msg = "ኢሜይል ወይም የይለፍ ቃል ተሳስቷል።";
      if (err.code === 'auth/operation-not-allowed') msg = "በFirebase Console ላይ Email/Password አልተፈቀደም። እባክዎን ያብሩት።";
      if (err.code === 'auth/network-request-failed') msg = "የኢንተርኔት ግንኙነት የለም ወይም የFirebase Config ተሳስቷል።";
      
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-none overflow-hidden rounded-[2rem]">
        <div className="h-2 bg-[#1e3a8a] w-full" />
        <CardHeader className="text-center space-y-2 pt-10">
          <div className="mx-auto w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-2 shadow-sm border border-blue-100 relative overflow-hidden">
            <Image 
              src="https://picsum.photos/seed/addis-ababa-logo/400/400" 
              alt="Addis Ababa Logo" 
              fill 
              className="object-contain p-2"
              data-ai-hint="Addis Ababa City logo"
            />
          </div>
          <CardTitle className="text-2xl font-black uppercase tracking-tight text-[#1e3a8a]">
            {isSignUp ? 'አዲስ አካውንት መመዝገቢያ' : 'የቢሮ መግቢያ (PORTAL LOGIN)'}
          </CardTitle>
          <CardDescription className="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-bold">
            Innovation & Technology Bureau
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          {errorMessage && (
            <Alert variant="destructive" className="mb-6 border-none bg-red-50 text-red-900 rounded-2xl">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-xs font-black uppercase">ስህተት</AlertTitle>
              <AlertDescription className="text-[11px] font-bold leading-relaxed">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="mb-6 border-none bg-green-50 text-green-900 rounded-2xl">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-xs font-black uppercase">ተሳክቷል</AlertTitle>
              <AlertDescription className="text-[11px] font-bold leading-relaxed">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ኢሜይል (EMAIL)</label>
              <Input 
                type="email" 
                placeholder="user@itb.gov.et" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-bold text-sm"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">የይለፍ ቃል (PASSWORD)</label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-bold text-sm"
                required
                disabled={loading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-14 font-black bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 shadow-xl rounded-2xl transition-all active:scale-[0.98] text-xs uppercase" 
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                isSignUp ? <UserPlus className="w-4 h-4 mr-2" /> : <LogIn className="w-4 h-4 mr-2" />
              )}
              {isSignUp ? 'አሁን ይመዝገቡ (Sign Up)' : 'ግባ (Login)'}
            </Button>
          </form>
          
          <div className="mt-10 flex flex-col gap-6 text-center">
            <button 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="text-[11px] font-black text-[#1e3a8a] hover:underline uppercase tracking-wider bg-blue-50/50 py-3 rounded-xl border border-blue-50 transition-colors"
              disabled={loading}
            >
              {isSignUp ? 'አካውንት አለዎት? እዚህ ይግቡ' : 'አዲስ ተጠቃሚ ነዎት? እዚህ ይመዝገቡ'}
            </button>
            
            <Link href="/" className="inline-flex items-center justify-center text-[10px] font-black text-slate-400 hover:text-[#1e3a8a] transition-colors uppercase tracking-[0.2em]">
              <ArrowLeft className="w-3 h-3 mr-2" /> ወደ ዋናው ገጽ ተመለስ
            </Link>
          </div>
        </CardContent>
      </Card>
      
      <p className="fixed bottom-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] pointer-events-none text-center w-full">
        ወ ር ቁ - ተ ቋ ማ ዊ - መ ረጃ - ማ ዕ ከ ል
      </p>
    </div>
  );
}
