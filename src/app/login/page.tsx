'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, AlertCircle, ShieldCheck, UserPlus, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from "@/components/ui/alert";
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

  useEffect(() => {
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
        
        const db = getFirestore();
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          firstName,
          fatherName,
          jobPosition,
          email,
          displayName,
          createdAt: new Date().toISOString()
        });

        toast({ title: "ተመዝግበዋል", description: "አካውንትዎ በትክክል ተከፍቷል" });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "እንኳን ደህና መጡ", description: "ወደ ሲስተሙ በመግባት ላይ ነዎት" });
      }
    } catch (err: any) {
      let msg = "መግባት አልተቻለም።";
      if (err.code === 'auth/email-already-in-use') msg = "ይህ ኢሜይል ቀድሞ ተመዝግቧል።";
      if (err.code === 'auth/invalid-credential') msg = "ኢሜይል ወይም የይለፍ ቃል ተሳስቷል፤ ወይም ገና አልተመዘገቡም።";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-none rounded-[2.5rem] bg-white overflow-hidden">
        <div className="h-2 bg-[#1e3a8a] w-full" />
        <CardHeader className="text-center space-y-2 pt-8">
          <div className="mx-auto w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-2 border border-blue-100 shadow-sm text-[#1e3a8a] font-black text-xl">ITB</div>
          <CardTitle className="text-xl font-black text-[#1e3a8a] uppercase">
            {isSignUp ? 'የአዲስ ተጠቃሚ ምዝገባ' : 'የቢሮ መግቢያ (Portal)'}
          </CardTitle>
          <CardDescription className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
            የኢኖቬሽንና ቴክኖሎጂ ቢሮ
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          {errorMessage && (
            <Alert variant="destructive" className="mb-4 bg-red-50 border-none rounded-2xl">
              <AlertDescription className="text-[11px] font-bold text-red-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase">ስም</label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="ስም" className="h-10 rounded-xl bg-slate-50 border-none font-bold text-xs shadow-inner" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase">የአባት ስም</label>
                  <Input value={fatherName} onChange={(e) => setFatherName(e.target.value)} placeholder="የአባት" className="h-10 rounded-xl bg-slate-50 border-none font-bold text-xs shadow-inner" required />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase">የስራ ድርሻ</label>
                  <Input value={jobPosition} onChange={(e) => setJobPosition(e.target.value)} placeholder="ለምሳሌ፡ ሲስተም አድሚን" className="h-10 rounded-xl bg-slate-50 border-none font-bold text-xs shadow-inner" required />
                </div>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase">ኢሜይል</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@itb.gov.et" className="h-10 rounded-xl bg-slate-50 border-none font-bold text-xs shadow-inner" required />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase">የይለፍ ቃል</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-10 rounded-xl bg-slate-50 border-none font-bold text-xs shadow-inner" required />
            </div>
            <Button type="submit" className="w-full h-11 font-black bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 shadow-lg rounded-xl text-xs uppercase" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (isSignUp ? <><UserPlus className="w-4 h-4 mr-2"/> አሁን ይመዝገቡ</> : <><LogIn className="w-4 h-4 mr-2"/> ይግቡ</>)}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <button onClick={() => { setIsSignUp(!isSignUp); setErrorMessage(null); }} className="text-[10px] font-black text-[#1e3a8a] uppercase hover:underline">
              {isSignUp ? 'አካውንት አለዎት? እዚህ ይግቡ' : 'አዲስ ተጠቃሚ ነዎት? እዚህ ይመዝገቡ'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}