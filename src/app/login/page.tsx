'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, AlertCircle, UserPlus, LogIn, Briefcase, User, ShieldCheck, Building2 } from 'lucide-react';
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
        if (!firstName || !fatherName || !jobPosition) {
          throw new Error("እባክዎ ሁሉንም መረጃዎች በትክክል ይሙሉ");
        }
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
          role: 'expert',
          createdAt: new Date().toISOString()
        });

        toast({ title: "ተመዝግበዋል", description: "የቢሮ አካውንትዎ በትክክል ተከፍቷል" });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "እንኳን ደህና መጡ", description: "ወደ ሲስተሙ በመግባት ላይ ነዎት" });
      }
    } catch (err: any) {
      console.error(err);
      let msg = err.message || "መግባት አልተቻለም።";
      if (err.code === 'auth/email-already-in-use') msg = "ይህ ኢሜይል ቀድሞ ተመዝግቧል።";
      if (err.code === 'auth/invalid-credential') msg = "ኢሜይል ወይም የይለፍ ቃል ተሳስቷል፤ ወይም ገና አልተመዘገቡም።";
      if (err.code === 'auth/weak-password') msg = "የይለፍ ቃሉ ቢያንስ 6 ፊደላት መሆን አለበት።";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-none rounded-[2.5rem] bg-white overflow-hidden">
        <div className="h-2 bg-[#1e3a8a] w-full" />
        <CardHeader className="text-center space-y-4 pt-10">
          <div className="mx-auto w-16 h-16 bg-[#1e3a8a]/5 rounded-2xl flex items-center justify-center border border-[#1e3a8a]/10 shadow-sm">
            <Building2 className="w-8 h-8 text-[#1e3a8a]" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl font-black text-[#1e3a8a] uppercase tracking-tight">
              የኢኖቬሽንና ቴክኖሎጂ ቢሮ
            </CardTitle>
            <CardDescription className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em]">
              ITB DIGITAL PORTAL • ዲጂታል መድረክ
            </CardDescription>
          </div>
          <div className="py-2 px-6 bg-slate-50 rounded-full inline-block mx-auto">
             <p className="text-[11px] font-bold text-slate-600 uppercase">እንኳን ደህና መጡ!</p>
          </div>
        </CardHeader>
        
        <CardContent className="px-10 pb-12">
          {errorMessage && (
            <Alert variant="destructive" className="mb-6 bg-red-50 border-none rounded-2xl animate-in fade-in zoom-in">
              <AlertDescription className="text-[11px] font-bold text-red-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-4 duration-300">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 ml-1"><User className="w-3 h-3" /> ስም</label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="ስም" className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs shadow-inner focus:ring-1 focus:ring-[#1e3a8a]/20" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 ml-1">የአባት ስም</label>
                  <Input value={fatherName} onChange={(e) => setFatherName(e.target.value)} placeholder="የአባት" className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs shadow-inner focus:ring-1 focus:ring-[#1e3a8a]/20" required />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 ml-1"><Briefcase className="w-3 h-3" /> የስራ ድርሻ</label>
                  <Input value={jobPosition} onChange={(e) => setJobPosition(e.target.value)} placeholder="ለምሳሌ፡ ሲስተም አድሚን / ዳይሬክተር" className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs shadow-inner focus:ring-1 focus:ring-[#1e3a8a]/20" required />
                </div>
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-1">የቢሮ ኢሜይል (Office Email)</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@itb.gov.et" className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs shadow-inner focus:ring-1 focus:ring-[#1e3a8a]/20" required />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-1">የይለፍ ቃል (Password)</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs shadow-inner focus:ring-1 focus:ring-[#1e3a8a]/20" required />
            </div>

            <Button type="submit" className="w-full h-12 font-black bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 shadow-xl rounded-2xl text-[10px] uppercase mt-4 transition-all hover:scale-[1.02] active:scale-95" disabled={loading}>
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                isSignUp ? (
                  <><UserPlus className="w-4 h-4 mr-2"/> አሁኑኑ ይመዝገቡ</>
                ) : (
                  <><LogIn className="w-4 h-4 mr-2"/> ወደ መግቢያ ይለፉ</>
                )
              )}
            </Button>
          </form>
          
          <div className="mt-8 text-center space-y-4">
            <div className="flex items-center gap-4">
               <div className="h-px bg-slate-100 flex-1"></div>
               <span className="text-[8px] font-black text-slate-300 uppercase">ወይም</span>
               <div className="h-px bg-slate-100 flex-1"></div>
            </div>
            
            <button type="button" onClick={() => { setIsSignUp(!isSignUp); setErrorMessage(null); }} className="text-[10px] font-black text-[#1e3a8a] uppercase hover:underline flex items-center justify-center gap-2 mx-auto w-full p-2">
              {isSignUp ? 'አካውንት አለዎት? እዚህ ይግቡ' : 'አዲስ ሰራተኛ ነዎት? እዚህ ይመዝገቡ'}
            </button>
          </div>
        </CardContent>
        <div className="bg-slate-50/50 p-4 text-center border-t">
           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">© 2024 INNOVATION & TECHNOLOGY BUREAU • ITB</p>
        </div>
      </Card>
    </div>
  );
}