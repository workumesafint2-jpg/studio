
'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, AlertCircle, Info, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { doc, setDoc, getFirestore } from 'firebase/firestore';

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [jobPosition, setJobPosition] = useState('');
  const [loading, setLoading] = useState(false);
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
      setErrorMessage("የFirebase ግንኙነት አልተገኘም። እባክዎን Settings ውስጥ ቁልፎቹን መሙላትዎን ያረጋግጡ።");
      return;
    }
    
    setLoading(true);
    setErrorMessage(null);
    
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const displayName = `${firstName} ${fatherName}`;
        await updateProfile(userCredential.user, { displayName });
        
        const db = getFirestore();
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          firstName,
          fatherName,
          jobPosition,
          email,
          createdAt: new Date().toISOString()
        });

        toast({ title: "ተመዝግበዋል", description: "አካውንትዎ በትክክል ተከፍቷል" });
        router.push('/');
      } else {
        // Master Admin Fast Access Logic
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "እንኳን ደህና መጡ", description: "ወደ ሲስተሙ በመግባት ላይ ነዎት" });
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      let msg = "መግባት አልተቻለም።";
      if (err.code === 'auth/email-already-in-use') msg = "ይህ ኢሜይል ቀድሞ ተመዝግቧል።";
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') msg = "ኢሜይል ወይም የይለፍ ቃል ተሳስቷል፤ ወይም ገና አልተመዘገቡም።";
      if (err.code === 'auth/user-not-found') msg = "ተጠቃሚው አልተገኘም። እባክዎን መጀመሪያ ይመዝገቡ።";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <Card className="w-full max-w-md shadow-2xl border-none overflow-hidden rounded-[2.5rem] bg-white">
        {!auth && (
          <Alert variant="destructive" className="m-4 border-none bg-amber-50 text-amber-900 rounded-2xl">
            <Info className="h-4 w-4" />
            <AlertTitle className="text-xs font-black uppercase">የFirebase ግንኙነት ችግር</AlertTitle>
            <AlertDescription className="text-[10px] font-bold">
              የFirebase ቁልፎች አልተገኙም። እባክዎን በ Vercel Settings ውስጥ መሙላትዎን ያረጋግጡ።
            </AlertDescription>
          </Alert>
        )}
        <div className="h-2 bg-[#1e3a8a] w-full" />
        <CardHeader className="text-center space-y-2 pt-8">
          <div className="mx-auto w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-2 shadow-sm border border-blue-100">
            <div className="text-[#1e3a8a] font-black text-2xl">ITB</div>
          </div>
          <CardTitle className="text-xl font-black text-[#1e3a8a] uppercase tracking-tight">
            {isSignUp ? 'አዲስ ተጠቃሚ መመዝገቢያ' : 'የቢሮ መግቢያ (Portal)'}
          </CardTitle>
          <CardDescription className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black leading-tight">
            የኢኖቬሽንና ቴክኖሎጂ ቢሮ
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          {errorMessage && (
            <Alert variant="destructive" className="mb-4 border-none bg-red-50 rounded-2xl animate-in fade-in zoom-in">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-[11px] font-bold text-red-900">{errorMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-300">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase">ስም</label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="ስም" className="h-10 rounded-xl bg-slate-50 border-none text-xs font-bold" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase">የአባት ስም</label>
                  <Input value={fatherName} onChange={(e) => setFatherName(e.target.value)} placeholder="የአባት ስም" className="h-10 rounded-xl bg-slate-50 border-none text-xs font-bold" required />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase">የስራ ድርሻ</label>
                  <Input value={jobPosition} onChange={(e) => setJobPosition(e.target.value)} placeholder="ለምሳሌ፡ ሲስተም አድሚን" className="h-10 rounded-xl bg-slate-50 border-none text-xs font-bold" required />
                </div>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase">ኢሜይል</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@itb.gov.et" className="h-10 rounded-xl bg-slate-50 border-none text-xs font-bold" required />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase">የይለፍ ቃል</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-10 rounded-xl bg-slate-50 border-none text-xs font-bold" required />
            </div>
            <Button type="submit" className="w-full h-11 font-black bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 shadow-lg rounded-xl text-xs uppercase transition-all active:scale-95" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? 'አሁን ይመዝገቡ' : 'ይግቡ')}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <button onClick={() => { setIsSignUp(!isSignUp); setErrorMessage(null); }} className="text-[10px] font-black text-[#1e3a8a] uppercase tracking-wider hover:underline transition-all" disabled={loading}>
              {isSignUp ? 'አካውንት አለዎት? እዚህ ይግቡ' : 'አዲስ ተጠቃሚ ነዎት? መጀመሪያ እዚህ ይመዝገቡ'}
            </button>
          </div>
          {email === "workumesafint2@gmail.com" && (
            <div className="mt-4 flex items-center justify-center gap-2 text-[8px] font-black text-green-600 uppercase">
              <ShieldCheck className="w-3 h-3" /> Master Admin Access Enabled
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
