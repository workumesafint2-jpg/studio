
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
import { Loader2, AlertCircle, Building2, KeyRound, ArrowLeft, Mail, Chrome, Languages } from 'lucide-react';
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
  const [sector, setSector] = useState('');
  const [role, setRole] = useState('expert');
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
          sector: 'pending',
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
          sector,
          email,
          displayName,
          role,
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
              {currentLang === 'am' ? 'አማርኛ' : currentLang === 'en' ? 'English' : currentLang === 'or' ? 'Oromo' : 'Tigrinya'}
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

      <Card className="w-full max-w-lg shadow-2xl border-none rounded-[3rem] bg-white overflow-hidden">
        <div className="h-3 bg-[#1e3a8a] w-full" />
        <CardHeader className="text-center pt-12 pb-8">
          <div className="mx-auto w-20 h-20 bg-[#1e3a8a]/5 rounded-[2rem] flex items-center justify-center border border-[#1e3a8a]/10 mb-6">
            <Building2 className="w-10 h-10 text-[#1e3a8a]" />
          </div>
          <CardTitle className="text-2xl font-black text-[#1e3a8a] uppercase tracking-tight">{t.title}</CardTitle>
          <CardDescription className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-2">{t.subtitle}</CardDescription>
        </CardHeader>
        
        <CardContent className="px-12 pb-14">
          {errorMessage && (
            <Alert variant="destructive" className="mb-8 rounded-3xl border-none bg-red-50 text-red-900">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-[11px] font-bold ml-2">{errorMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={t.fullName} className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-xs px-5" required />
                  <Input value={fatherName} onChange={(e) => setFatherName(e.target.value)} placeholder={t.fullName} className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-xs px-5" required />
                </div>
                <Select onValueChange={setSector} required>
                  <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-xs px-5">
                    <SelectValue placeholder={t.selectSector} />
                  </SelectTrigger>
                  <SelectContent className="rounded-[2rem] border-none shadow-2xl p-2">
                    <SelectItem value="tech_innovation" className="rounded-xl p-3 font-bold text-xs">Innovation Sector</SelectItem>
                    <SelectItem value="ict_infra" className="rounded-xl p-3 font-bold text-xs">ICT Infra</SelectItem>
                    <SelectItem value="smart_city" className="rounded-xl p-3 font-bold text-xs">Smart City</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.email} className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-xs px-5" required />
            {mode !== 'forgot' && (
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.password} className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-xs px-5" required />
            )}

            <Button type="submit" className="w-full h-16 font-black bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 shadow-xl rounded-[1.5rem] text-[12px] uppercase mt-4 gap-3">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (mode === 'signup' ? t.signup : mode === 'signin' ? t.login : "Send")}
            </Button>
          </form>

          {mode === 'signin' && (
            <Button variant="outline" onClick={handleGoogleSignIn} className="w-full h-16 rounded-[1.5rem] border-2 border-slate-50 font-black text-[11px] uppercase gap-3 mt-4">
              <Chrome className="w-5 h-5 text-red-500" /> Continue with Google
            </Button>
          )}
          
          <div className="flex flex-col gap-6 mt-8">
            {mode === 'signin' && (
              <div className="flex items-center justify-between">
                <button onClick={() => setMode('signup')} className="text-[10px] font-black text-[#1e3a8a] uppercase hover:underline">{t.signup}</button>
                <button onClick={() => setMode('forgot')} className="text-[10px] font-black text-slate-400 uppercase">{t.forgotPassword}</button>
              </div>
            )}
            {mode !== 'signin' && (
              <button onClick={() => setMode('signin')} className="text-[10px] font-black text-[#1e3a8a] uppercase flex items-center gap-2 mx-auto">
                <ArrowLeft className="w-4 h-4" /> {t.backToLogin}
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
