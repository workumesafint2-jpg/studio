'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, AlertCircle, UserPlus, LogIn, Building2, KeyRound, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { doc, setDoc, getFirestore } from 'firebase/firestore';
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
        
        const db = getFirestore();
        await setDoc(doc(db, 'users', userCredential.user.uid), {
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
        toast({ title: "ተልኳል", description: "የይለፍ ቃል ማስተካከያ መመሪያ ተልኳል" });
      }
    } catch (err: any) {
      setErrorMessage(err.message || "ክወናው አልተሳካም።");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-none rounded-[2.5rem] bg-white overflow-hidden">
        <div className="h-2 bg-[#1e3a8a] w-full" />
        <CardHeader className="text-center pt-10">
          <div className="mx-auto w-16 h-16 bg-[#1e3a8a]/5 rounded-2xl flex items-center justify-center border border-[#1e3a8a]/10 mb-4">
            <Building2 className="w-8 h-8 text-[#1e3a8a]" />
          </div>
          <CardTitle className="text-xl font-black text-[#1e3a8a] uppercase tracking-tight">የኢኖቬሽንና ቴክኖሎጂ ቢሮ</CardTitle>
          <CardDescription className="text-[10px] text-slate-400 uppercase font-black">ITB DIGITAL PORTAL • ዲጂታል መድረክ</CardDescription>
        </CardHeader>
        
        <CardContent className="px-10 pb-12">
          {errorMessage && (
            <Alert variant="destructive" className="mb-6 rounded-2xl border-none bg-red-50 text-red-900">
              <AlertDescription className="text-[11px] font-bold">{errorMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="ስም" className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs" required />
                  <Input value={fatherName} onChange={(e) => setFatherName(e.target.value)} placeholder="የአባት" className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs" required />
                </div>
                
                <Select onValueChange={setSector} required>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs">
                    <SelectValue placeholder="ዘርፍ ይምረጡ (Sector)" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    <SelectItem value="bureau_head_sector">የቢሮ ኃላፊ (Bureau Head)</SelectItem>
                    <SelectItem value="tech_innovation">የቴክኖሎጂና ኢኖቬሽን ዘርፍ</SelectItem>
                    <SelectItem value="ict_infra">የአይሲቲ መሰረተ ልማት ዘርፍ</SelectItem>
                    <SelectItem value="digital_trans">የዲጂታል ትራንስፎርሜሽን ዘርፍ</SelectItem>
                    <SelectItem value="smart_city">ስማርት ሲቲ (Smart City)</SelectItem>
                    <SelectItem value="office_sec">የጽሕፈት ቤት ኃላፊ</SelectItem>
                  </SelectContent>
                </Select>

                <Select onValueChange={setRole} defaultValue="expert">
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs">
                    <SelectValue placeholder="ደረጃ ይምረጡ (Role)" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    <SelectItem value="head">ኃላፊ (Head)</SelectItem>
                    <SelectItem value="director">ዳይሬክተር (Director)</SelectItem>
                    <SelectItem value="team_leader">ቡድን መሪ (Team Leader)</SelectItem>
                    <SelectItem value="expert">ባለሙያ (Expert)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="የቢሮ ኢሜይል" className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs" required />
            
            {mode !== 'forgot' && (
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="የይለፍ ቃል" className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs" required />
            )}

            <Button type="submit" className="w-full h-12 font-black bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 shadow-xl rounded-2xl text-[10px] uppercase mt-4" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (mode === 'signup' ? "ይመዝገቡ" : mode === 'signin' ? "ይግቡ" : "የይለፍ ቃል ቀይር")}
            </Button>
          </form>
          
          <div className="flex flex-col gap-4 mt-8">
            {mode === 'signin' && (
              <>
                <button onClick={() => setMode('signup')} className="text-[10px] font-black text-[#1e3a8a] uppercase hover:underline">አዲስ ሰራተኛ ነዎት? እዚህ ይመዝገቡ</button>
                <button onClick={() => setMode('forgot')} className="text-[10px] font-black text-slate-400 uppercase hover:text-[#1e3a8a] hover:underline">የይለፍ ቃል ረስተዋል?</button>
              </>
            )}
            {mode !== 'signin' && (
              <button onClick={() => setMode('signin')} className="text-[10px] font-black text-[#1e3a8a] uppercase hover:underline flex items-center justify-center gap-2">
                <ArrowLeft className="w-3 h-3" /> ወደ መግቢያ ይመለሱ
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
