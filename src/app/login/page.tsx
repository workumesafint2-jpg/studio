
'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, UserPlus, LogIn, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from 'next/image';

const ADMIN_EMAIL = "workumesafint2@gmail.com";
const MASTER_KEY = "itdb123456";

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!auth) {
      setErrorMessage("የFirebase አገልግሎት አልተገናኘም። እባክዎን Vercel Variables መሞላታቸውን ያረጋግጡ።");
      return;
    }
    
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      // MASTER ADMIN BYPASS LOGIC
      if (email.toLowerCase() === ADMIN_EMAIL && !isSignUp) {
        try {
          await signInWithEmailAndPassword(auth, email, password || MASTER_KEY);
          toast({ title: "እንኳን ደህና መጡ አስተዳዳሪ", description: "ወደ ሲስተሙ በመግባት ላይ ነዎት።" });
          return;
        } catch (adminErr) {
          console.log("Admin login attempted...");
        }
      }

      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        setSuccessMessage("የምዝገባ ጥያቄዎ ተሳክቷል። አሁን በከፈቱት ኢሜይል መግባት ይችላሉ።");
        toast({ title: "ተመዝግበዋል", description: "አካውንትዎ በትክክል ተከፍቷል።" });
        setIsSignUp(false);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "እንኳን ደህና መጡ", description: "ወደ ሲስተሙ በመግባት ላይ ነዎት።" });
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      let msg = "መግባት አልተቻለም። እባክዎን የኢሜይል እና የይለፍ ቃልዎን ያረጋግጡ።";
      
      if (err.code === 'auth/email-already-in-use') msg = "ይህ ኢሜይል ቀድሞ ተመዝግቧል። እባክዎን 'ግባ' የሚለውን ተጭነው ይግቡ።";
      if (err.code === 'auth/weak-password') msg = "የይለፍ ቃሉ ቢያንስ 6 ፊደላት/ቁጥሮች መሆን አለበት።";
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = isSignUp ? "መመዝገብ አልተቻለም።" : "ኢሜይል ወይም የይለፍ ቃል ተሳስቷል። መጀመሪያ ካልተመዘገቡ 'እዚህ ይመዝገቡ' የሚለውን ተጭነው ይመዝገቡ።";
      }
      
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-none overflow-hidden rounded-[2.5rem] bg-white">
        <div className="h-3 bg-[#1e3a8a] w-full" />
        <CardHeader className="text-center space-y-2 pt-10">
          <div className="mx-auto w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center mb-4 shadow-sm border border-blue-100 relative overflow-hidden">
            <Image 
              src="https://picsum.photos/seed/itb-logo/400/400" 
              alt="Addis Ababa Logo" 
              fill 
              className="object-contain p-3"
              data-ai-hint="Addis Ababa City Administration logo"
            />
          </div>
          <CardTitle className="text-2xl font-black uppercase tracking-tight text-[#1e3a8a]">
            {isSignUp ? 'አዲስ አካውንት መመዝገቢያ' : 'የቢሮ መግቢያ (ITB PORTAL)'}
          </CardTitle>
          <CardDescription className="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-black">
            Innovation & Technology Bureau
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-12">
          {errorMessage && (
            <Alert variant="destructive" className="mb-6 border-none bg-red-50 text-red-900 rounded-2xl animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-xs font-black uppercase">ስህተት</AlertTitle>
              <AlertDescription className="text-[11px] font-bold">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="mb-6 border-none bg-green-50 text-green-900 rounded-2xl animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-xs font-black uppercase">ተሳክቷል</AlertTitle>
              <AlertDescription className="text-[11px] font-bold">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ኢሜይል (EMAIL)</label>
              <Input 
                type="email" 
                placeholder="user@itb.gov.et" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-sm"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">የይለፍ ቃል (PASSWORD)</label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-sm"
                required={!(!isSignUp && email.toLowerCase() === ADMIN_EMAIL)}
                disabled={loading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-16 font-black bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 shadow-xl rounded-2xl text-xs uppercase" 
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                isSignUp ? <ShieldCheck className="w-4 h-4 mr-2" /> : <LogIn className="w-4 h-4 mr-2" />
              )}
              {isSignUp ? 'አሁን ይመዝገቡ (Sign Up)' : (email.toLowerCase() === ADMIN_EMAIL ? 'እንደ አስተዳዳሪ ግባ (Master Access)' : 'ግባ (Login)')}
            </Button>
          </form>
          
          <div className="mt-8 flex flex-col gap-4 text-center">
            <button 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="text-[11px] font-black text-[#1e3a8a] uppercase tracking-wider bg-blue-50/50 py-4 rounded-2xl border border-blue-50 hover:bg-blue-100 transition-all"
              disabled={loading}
            >
              {isSignUp ? 'አካውንት አለዎት? እዚህ ይግቡ' : 'አዲስ ተጠቃሚ ነዎት? መጀመሪያ እዚህ ይመዝገቡ'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
