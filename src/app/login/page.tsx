
'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser, initiateEmailSignIn, initiateEmailSignUp } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, Loader2, ArrowLeft, UserPlus, LogIn, AlertCircle, CheckCircle2 } from 'lucide-react';
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Institutional Redirect: Watch for auth state changes
  useEffect(() => {
    if (!isUserLoading && user) {
      setLoading(false);
      toast({
        title: "እንኳን ደህና መጡ",
        description: "ወርቁ ነኝ፣ ወደ መቆጣጠሪያ ገጹ በመግባት ላይ ነዎት።",
      });
      router.push('/');
    }
  }, [user, isUserLoading, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      setErrorMessage("የቢሮው የደመና አገልግሎት አልተገናኘም። እባክዎን የFirebase ኢንቫይሮመንት ቫሪያብል በትክክል መዋቀሩን ያረጋግጡ።");
      return;
    }
    
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      if (isSignUp) {
        initiateEmailSignUp(auth, email, password);
        setSuccessMessage("የምዝገባ ጥያቄዎ ተልኳል። እባክዎን ለጥቂት ሰከንዶች ይታገሱ...");
      } else {
        initiateEmailSignIn(auth, email, password);
      }
      
      // Safety timeout to check for success or failure
      setTimeout(() => {
        if (!user) {
          setLoading(false);
          if (isSignUp) {
            setErrorMessage("መመዝገብ አልተቻለም። ኢሜይሉ አስቀድሞ ተመዝግቦ ሊሆን ይችላል ወይም ደግሞ በFirebase Console ላይ Email/Password አልተፈቀደም።");
          } else {
            setErrorMessage("መግባት አልተቻለም። እባክዎን የኢሜይል እና የይለፍ ቃልዎን ትክክለኛነት ያረጋግጡ ወይም መጀመሪያ 'አዲስ ተጠቃሚ' በሚለው ይመዝገቡ።");
          }
        }
      }, 6000);

    } catch (err: any) {
      console.error("Login Error Catch:", err);
      setLoading(false);
      setErrorMessage("የቴክኒክ ስህተት አጋጥሟል። እባክዎን ቆይተው ይሞክሩ።");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-none overflow-hidden rounded-[2rem]">
        <div className="h-2 bg-[#1e3a8a] w-full" />
        <CardHeader className="text-center space-y-2 pt-10">
          <div className="mx-auto w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-2 shadow-sm border border-blue-100">
            {isSignUp ? <UserPlus className="w-8 h-8 text-[#1e3a8a]" /> : <ShieldCheck className="w-8 h-8 text-[#1e3a8a]" />}
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
            <Alert variant="destructive" className="mb-6 border-none bg-red-50 text-red-900 rounded-2xl animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-xs font-black uppercase">ስህተት</AlertTitle>
              <AlertDescription className="text-[11px] leading-relaxed font-bold">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="mb-6 border-none bg-green-50 text-green-900 rounded-2xl animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-xs font-black uppercase">መልካም ዜና</AlertTitle>
              <AlertDescription className="text-[11px] leading-relaxed font-bold">
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
            
            <div className="flex items-center gap-4">
              <div className="h-px bg-slate-100 flex-1" />
              <span className="text-[8px] font-black text-slate-300 uppercase">ወርቁ Pro</span>
              <div className="h-px bg-slate-100 flex-1" />
            </div>
            
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
