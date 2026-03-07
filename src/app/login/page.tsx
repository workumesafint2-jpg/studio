
'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, UserPlus, LogIn, AlertCircle, CheckCircle2, ShieldCheck, Briefcase, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from 'next/image';
import { doc, setDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';

const ADMIN_EMAIL = "workumesafint2@gmail.com";

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
    if (!auth) return;
    
    setLoading(true);
    setErrorMessage(null);
    
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const displayName = `${firstName} ${fatherName}`;
        await updateProfile(userCredential.user, { displayName });
        
        // Store extra profile info in Firestore
        const db = getFirestore();
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          firstName,
          fatherName,
          jobPosition,
          email,
          createdAt: new Date().toISOString()
        });

        toast({ title: "ተመዝግበዋል", description: "አካውንትዎ በትክክል ተከፍቷል።" });
        router.push('/');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "እንኳን ደህና መጡ", description: "ወደ ሲስተሙ በመግባት ላይ ነዎት።" });
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      let msg = "መግባት አልተቻለም። እባክዎን መጀመሪያ መመዝገብዎን ያረጋግጡ።";
      if (err.code === 'auth/email-already-in-use') msg = "ይህ ኢሜይል ቀድሞ ተመዝግቧል።";
      if (err.code === 'auth/weak-password') msg = "የይለፍ ቃሉ ቢያንስ 6 ፊደላት መሆን አለበት።";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <Card className="w-full max-w-md shadow-2xl border-none overflow-hidden rounded-[2.5rem] bg-white">
        <div className="h-2 bg-[#1e3a8a] w-full" />
        <CardHeader className="text-center space-y-2 pt-8">
          <div className="mx-auto w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-2 shadow-sm border border-blue-100 relative overflow-hidden">
            <div className="text-[#1e3a8a] font-black text-2xl">ITB</div>
          </div>
          <CardTitle className="text-xl font-black text-[#1e3a8a] uppercase tracking-tight">
            {isSignUp ? 'አዲስ ተጠቃሚ መመዝገቢያ' : 'የቢሮ መግቢያ (Portal)'}
          </CardTitle>
          <CardDescription className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black">
            የኢኖቬሽንና ቴክኖሎጂ ቢሮ
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          {errorMessage && (
            <Alert variant="destructive" className="mb-4 border-none bg-red-50 rounded-2xl">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-[11px] font-bold">{errorMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase">ስም</label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="ስም" className="h-11 rounded-xl bg-slate-50 border-none text-xs font-bold" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase">የአባት ስም</label>
                  <Input value={fatherName} onChange={(e) => setFatherName(e.target.value)} placeholder="የአባት ስም" className="h-11 rounded-xl bg-slate-50 border-none text-xs font-bold" required />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase">የስራ ድርሻ</label>
                  <Input value={jobPosition} onChange={(e) => setJobPosition(e.target.value)} placeholder="ለምሳሌ፡ ሲስተም አድሚን" className="h-11 rounded-xl bg-slate-50 border-none text-xs font-bold" required />
                </div>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase">ኢሜይል</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@itb.gov.et" className="h-11 rounded-xl bg-slate-50 border-none text-xs font-bold" required />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase">የይለፍ ቃል</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-11 rounded-xl bg-slate-50 border-none text-xs font-bold" required />
            </div>
            <Button type="submit" className="w-full h-12 font-black bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 shadow-lg rounded-xl text-xs uppercase" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? 'አሁን ይመዝገቡ' : 'ይግቡ')}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-[10px] font-black text-[#1e3a8a] uppercase tracking-wider hover:underline" disabled={loading}>
              {isSignUp ? 'አካውንት አለዎት? እዚህ ይግቡ' : 'አዲስ ተጠቃሚ ነዎት? መጀመሪያ እዚህ ይመዝገቡ'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
