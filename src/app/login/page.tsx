'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, AlertCircle, Building2, KeyRound, ArrowLeft, Mail, Chrome } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { doc, setDoc, getFirestore, getDoc } from 'firebase/firestore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [sector, setSector] = useState('');
  const [role, setRole] = useState('expert');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const saveUserProfile = async (uid: string, data: any) => {
    const db = getFirestore();
    await setDoc(doc(db, 'users', uid), {
      ...data,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  };

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user profile exists, if not create a default one
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (!userDoc.exists()) {
        await saveUserProfile(result.user.uid, {
          email: result.user.email,
          displayName: result.user.displayName,
          sector: 'pending', // Will need to be assigned by admin or chosen later
          role: 'expert',
          createdAt: new Date().toISOString()
        });
      }
      
      toast({ title: "ተሳክቷል", description: "በጎግል አካውንትዎ ገብተዋል" });
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    
    setLoading(true);
    setErrorMessage(null);
    
    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const displayName = `${firstName} ${fatherName}`;
        await updateProfile(userCredential.user, { displayName });
        
        await saveUserProfile(userCredential.user.uid, {
          firstName,
          fatherName,
          sector,
          email,
          displayName,
          role,
          createdAt: new Date().toISOString()
        });

        toast({ title: "ተመዝግበዋል", description: "የቢሮ አካውንትዎ በትክክል ተከፍቷል" });
      } else if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "እንኳን ደህና መጡ", description: "ወደ ሲስተሙ በመግባት ላይ ነዎት" });
      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        toast({ title: "ተልኳል", description: "የይለፍ ቃል ማስተካከያ መመሪያ በኢሜይልዎ ተልኳል" });
        setMode('signin');
      }
    } catch (err: any) {
      let msg = "ክወናው አልተሳካም።";
      if (err.code === 'auth/user-not-found') msg = "ይህ ኢሜይል አልተመዘገበም።";
      if (err.code === 'auth/wrong-password') msg = "የተሳሳተ የይለፍ ቃል ተጠቅመዋል።";
      if (err.code === 'auth/email-already-in-use') msg = "ይህ ኢሜይል ቀድሞ ተመዝግቧል።";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <Card className="w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-none rounded-[3rem] bg-white overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="h-3 bg-gradient-to-r from-[#1e3a8a] to-blue-400 w-full" />
        <CardHeader className="text-center pt-12 pb-8">
          <div className="mx-auto w-20 h-20 bg-[#1e3a8a]/5 rounded-[2rem] flex items-center justify-center border border-[#1e3a8a]/10 mb-6 group hover:scale-110 transition-transform duration-300">
            <Building2 className="w-10 h-10 text-[#1e3a8a]" />
          </div>
          <CardTitle className="text-2xl font-black text-[#1e3a8a] uppercase tracking-tight">የኢኖቬሽንና ቴክኖሎጂ ቢሮ</CardTitle>
          <CardDescription className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mt-2">ITB DIGITAL PORTAL • ዲጂታል መድረክ</CardDescription>
        </CardHeader>
        
        <CardContent className="px-12 pb-14">
          {errorMessage && (
            <Alert variant="destructive" className="mb-8 rounded-3xl border-none bg-red-50 text-red-900 animate-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-[11px] font-bold ml-2">{errorMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <div className="space-y-5 animate-in slide-in-from-right-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">ስም</label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="የእርስዎ ስም" className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-xs px-5 focus-visible:ring-1 focus-visible:ring-blue-200" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">የአባት</label>
                    <Input value={fatherName} onChange={(e) => setFatherName(e.target.value)} placeholder="የአባት ስም" className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-xs px-5 focus-visible:ring-1 focus-visible:ring-blue-200" required />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">ዘርፍ (Sector)</label>
                  <Select onValueChange={setSector} required>
                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-xs px-5">
                      <SelectValue placeholder="ዘርፍ ይምረጡ" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[2rem] border-none shadow-2xl p-2">
                      <SelectItem value="bureau_head_sector" className="rounded-xl p-3 font-bold text-xs">የቢሮ ኃላፊ (Bureau Head)</SelectItem>
                      <SelectItem value="tech_innovation" className="rounded-xl p-3 font-bold text-xs">የቴክኖሎጂና ኢኖቬሽን ዘርፍ</SelectItem>
                      <SelectItem value="ict_infra" className="rounded-xl p-3 font-bold text-xs">የአይሲቲ መሰረተ ልማት ዘርፍ</SelectItem>
                      <SelectItem value="digital_trans" className="rounded-xl p-3 font-bold text-xs">የዲጂታል ትራንስፎርሜሽን ዘርፍ</SelectItem>
                      <SelectItem value="smart_city" className="rounded-xl p-3 font-bold text-xs">ስማርት ሲቲ (Smart City)</SelectItem>
                      <SelectItem value="office_sec" className="rounded-xl p-3 font-bold text-xs">የጽሕፈት ቤት ኃላፊ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">የሥራ ድርሻ (Role)</label>
                  <Select onValueChange={setRole} defaultValue="expert">
                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-xs px-5">
                      <SelectValue placeholder="ደረጃ ይምረጡ" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[2rem] border-none shadow-2xl p-2">
                      <SelectItem value="head" className="rounded-xl p-3 font-bold text-xs">ኃላፊ (Head)</SelectItem>
                      <SelectItem value="director" className="rounded-xl p-3 font-bold text-xs">ዳይሬክተር (Director)</SelectItem>
                      <SelectItem value="team_leader" className="rounded-xl p-3 font-bold text-xs">ቡድን መሪ (Team Leader)</SelectItem>
                      <SelectItem value="expert" className="rounded-xl p-3 font-bold text-xs">ባለሙያ (Expert)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-1">የቢሮ ኢሜይል</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@itb.gov.et" className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-xs px-5 focus-visible:ring-1 focus-visible:ring-blue-200" required />
            </div>
            
            {mode !== 'forgot' && (
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">የይለፍ ቃል</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-xs px-5 focus-visible:ring-1 focus-visible:ring-blue-200" required />
              </div>
            )}

            <Button type="submit" className="w-full h-16 font-black bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 shadow-xl rounded-[1.5rem] text-[12px] uppercase mt-4 gap-3 transition-all active:scale-95" disabled={loading}>
              {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
                <>
                  {mode === 'signup' ? <Building2 className="w-5 h-5" /> : mode === 'signin' ? <KeyRound className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                  {mode === 'signup' ? "አዲስ አካውንት ክፈት" : mode === 'signin' ? "ግባ" : "መመሪያ ላክ"}
                </>
              )}
            </Button>
          </form>

          {mode === 'signin' && (
            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
              <div className="relative flex justify-center text-[8px] uppercase font-black"><span className="bg-white px-4 text-slate-300">ወይም በሌላ አማራጭ</span></div>
            </div>
          )}
          
          {mode === 'signin' && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleGoogleSignIn}
              className="w-full h-16 rounded-[1.5rem] border-2 border-slate-50 hover:bg-slate-50 font-black text-[11px] uppercase gap-3 mb-8"
              disabled={loading}
            >
              <Chrome className="w-5 h-5 text-red-500" /> በጎግል ቀጥል (Google)
            </Button>
          )}
          
          <div className="flex flex-col gap-6 mt-4">
            {mode === 'signin' && (
              <div className="flex items-center justify-between">
                <button onClick={() => setMode('signup')} className="text-[10px] font-black text-[#1e3a8a] uppercase hover:underline">አዲስ ሰራተኛ ምዝገባ</button>
                <button onClick={() => setMode('forgot')} className="text-[10px] font-black text-slate-400 uppercase hover:text-[#1e3a8a]">የይለፍ ቃል ረስተዋል?</button>
              </div>
            )}
            {mode !== 'signin' && (
              <button onClick={() => setMode('signin')} className="text-[10px] font-black text-[#1e3a8a] uppercase hover:underline flex items-center justify-center gap-2 mx-auto">
                <ArrowLeft className="w-4 h-4" /> ወደ መግቢያ ይመለሱ
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
