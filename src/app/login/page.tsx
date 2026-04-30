
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
import { Loader2, AlertCircle, Building2, KeyRound, ArrowLeft, Mail, Chrome, Languages, Landmark, Briefcase } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { doc, setDoc, getFirestore, getDoc } from 'firebase/firestore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { translations, type Language } from '@/lib/translations';

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
  const [institutionName, setInstitutionName] = useState('');
  const [sectorName, setSectorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentLang, setCurrentLang] = useState<Language>('am');

  const t = translations[currentLang];

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
    const savedLang = localStorage.getItem('app_lang') as Language;
    if (savedLang) setCurrentLang(savedLang);
  }, [user, isUserLoading, router]);

  const changeLanguage = (lang: Language) => {
    setCurrentLang(lang);
    localStorage.setItem('app_lang', lang);
  };

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
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (!userDoc.exists()) {
        await saveUserProfile(result.user.uid, {
          email: result.user.email,
          displayName: result.user.displayName,
          institution: 'የኢኖቬሽንና ቴክኖሎጂ ቢሮ',
          sector: 'አጠቃላይ',
          role: 'expert',
          createdAt: new Date().toISOString()
        });
      }
      toast({ title: "Success", description: "Signed in with Google" });
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
          institution: institutionName,
          sector: sectorName,
          email,
          displayName,
          role: 'expert',
          createdAt: new Date().toISOString()
        });
        toast({ title: t.signup, description: "Account created" });
      } else if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: t.login, description: "Welcome back" });
      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        toast({ title: "Sent", description: "Reset instructions sent to your email" });
        setMode('signin');
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 relative">
      <div className="absolute top-8 right-8">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-12 px-6 rounded-2xl bg-white border-none shadow-xl flex items-center gap-3 font-black text-[10px] uppercase">
              <Languages className="w-5 h-5 text-[#1e3a8a]" />
              {currentLang === 'am' ? 'አማርኛ' : currentLang === 'en' ? 'English' : currentLang === 'or' ? 'Oromo' : 'ትግርኛ'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-[1.5rem] p-2 shadow-2xl border-none">
            <DropdownMenuItem onClick={() => changeLanguage('am')} className="text-xs font-bold p-3 rounded-xl cursor-pointer">አማርኛ</DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('en')} className="text-xs font-bold p-3 rounded-xl cursor-pointer">English</DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('or')} className="text-xs font-bold p-3 rounded-xl cursor-pointer">Afaan Oromoo</DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('ti')} className="text-xs font-bold p-3 rounded-xl cursor-pointer">ትግርኛ</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card className="w-full max-w-lg shadow-2xl border-none rounded-[3.5rem] bg-white overflow-hidden">
        <div className="h-4 bg-[#1e3a8a] w-full" />
        <CardHeader className="text-center pt-14 pb-8">
          <div className="mx-auto w-24 h-24 bg-[#1e3a8a]/5 rounded-[2.5rem] flex items-center justify-center border border-[#1e3a8a]/10 mb-8">
            <Building2 className="w-12 h-12 text-[#1e3a8a]" />
          </div>
          <CardTitle className="text-3xl font-black text-[#1e3a8a] uppercase tracking-tight">{t.title}</CardTitle>
          <CardDescription className="text-[11px] text-slate-400 uppercase font-black tracking-widest mt-3">{t.subtitle}</CardDescription>
        </CardHeader>
        
        <CardContent className="px-14 pb-16">
          {errorMessage && (
            <Alert variant="destructive" className="mb-8 rounded-[2rem] border-none bg-red-50 text-red-900">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-[11px] font-bold ml-2">{errorMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'signup' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={t.fullName} className="h-16 rounded-[1.5rem] bg-slate-50 border-none font-bold text-xs px-6" required />
                  <Input value={fatherName} onChange={(e) => setFatherName(e.target.value)} placeholder="የአባት ስም" className="h-16 rounded-[1.5rem] bg-slate-50 border-none font-bold text-xs px-6" required />
                </div>
                <div className="space-y-4">
                   <div className="relative">
                     <Landmark className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1e3a8a]/30" />
                     <Input value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} placeholder={t.institutionName} className="h-16 rounded-[1.5rem] bg-slate-50 border-none font-bold text-xs pl-14 pr-6" required />
                   </div>
                   <div className="relative">
                     <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1e3a8a]/30" />
                     <Input value={sectorName} onChange={(e) => setSectorName(e.target.value)} placeholder={t.sectorName} className="h-16 rounded-[1.5rem] bg-slate-50 border-none font-bold text-xs pl-14 pr-6" required />
                   </div>
                </div>
              </div>
            )}
            
            <div className="relative">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1e3a8a]/30" />
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.email} className="h-16 rounded-[1.5rem] bg-slate-50 border-none font-bold text-xs pl-14 pr-6" required />
            </div>
            
            {mode !== 'forgot' && (
              <div className="relative">
                <KeyRound className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1e3a8a]/30" />
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.password} className="h-16 rounded-[1.5rem] bg-slate-50 border-none font-bold text-xs pl-14 pr-6" required />
              </div>
            )}

            <Button type="submit" className="w-full h-18 font-black bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 shadow-2xl rounded-[1.8rem] text-[13px] uppercase mt-6 gap-3">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (mode === 'signup' ? t.signup : mode === 'signin' ? t.login : "Send Reset Link")}
            </Button>
          </form>

          {mode === 'signin' && (
            <Button variant="outline" onClick={handleGoogleSignIn} className="w-full h-18 rounded-[1.8rem] border-2 border-slate-50 font-black text-[12px] uppercase gap-3 mt-4">
              <Chrome className="w-6 h-6 text-red-500" /> {t.login} with Google
            </Button>
          )}
          
          <div className="flex flex-col gap-6 mt-10">
            {mode === 'signin' && (
              <div className="flex items-center justify-between px-2">
                <button onClick={() => setMode('signup')} className="text-[11px] font-black text-[#1e3a8a] uppercase hover:underline">{t.signup}</button>
                <button onClick={() => setMode('forgot')} className="text-[11px] font-black text-slate-400 uppercase">{t.forgotPassword}</button>
              </div>
            )}
            {mode !== 'signin' && (
              <button onClick={() => setMode('signin')} className="text-[11px] font-black text-[#1e3a8a] uppercase flex items-center gap-2 mx-auto hover:underline">
                <ArrowLeft className="w-4 h-4" /> {t.backToLogin}
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
