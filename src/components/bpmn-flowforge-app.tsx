
"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Trash2, 
  MoreVertical, 
  Search,
  Loader2,
  Upload,
  Download,
  BarChart,
  FileText,
  BrainCircuit,
  TrendingUp,
  CheckCircle2,
  Save,
  FileCode,
  ChevronDown,
  LayoutIcon,
  FileSearch,
  Zap,
  Eye,
  Users,
  History,
  MessageSquare,
  Send,
  LogOut,
  LogIn,
  XCircle,
  Settings,
  Briefcase
} from "lucide-react";
import { generateBPMN } from "@/lib/bpmn-engine";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BPMNViewer, type BPMNViewerRef } from "@/components/bpmn-viewer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { suggestSteps } from "@/ai/flows/suggest-steps-flow";
import { Badge } from "@/components/ui/badge";
import { 
  Bar, 
  BarChart as RechartsBarChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { 
  useCollection, 
  useUser, 
  useFirestore, 
  useMemoFirebase,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  updateDocumentNonBlocking,
  useAuth
} from '@/firebase';
import { collection, query, doc, Timestamp, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Image from 'next/image';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface UploadedFile {
  id: string;
  name: string;
  category: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  dataUrl: string;
  fileUrl: string; 
  type: string;
  status: 'የጸደቀ' | 'በሂደት ላይ';
  version: number;
  uploaderId: string;
  uploaderName?: string;
  createdAt?: any;
  sector?: string;
  directorate?: string;
  team?: string;
  expertName?: string;
}

interface FeedbackMessage {
  id: string;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: string;
  uploaderId: string;
  createdAt?: any;
}

/**
 * Master Admin Email Configuration
 */
const ADMIN_EMAIL = "workumesafint2@gmail.com";

export function BPMNFlowForgeApp() {
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [title, setTitle] = useState("");
  const [xmlResult, setXmlResult] = useState("");
  const [activeTab, setActiveTab] = useState("diagram");
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  
  const [uploadCategory, setUploadCategory] = useState<string>("");
  const [uploadSector, setUploadSector] = useState<string>("");
  const [uploadDirectorate, setUploadDirectorate] = useState<string>("");
  const [uploadTeam, setUploadTeam] = useState<string>("");
  const [uploadExpertName, setUploadExpertName] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [feedbackInput, setFeedbackInput] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  const viewerRef = useRef<BPMNViewerRef>(null);
  const { toast } = useToast();
  const router = useRouter();
  
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    setMounted(true);
    setCurrentDate(new Date().toLocaleDateString('am-ET'));
  }, []);

  const documentsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'documents'), orderBy('createdAt', 'desc'));
  }, [db]);

  const feedbackQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: uploadedFilesRaw, isLoading: isDocsLoading } = useCollection<UploadedFile>(documentsQuery);
  const { data: feedbackMessagesRaw } = useCollection<FeedbackMessage>(feedbackQuery);
  
  const uploadedFiles = uploadedFilesRaw || [];
  const feedbackMessages = feedbackMessagesRaw || [];

  const performanceData = useMemo(() => {
    if (!uploadedFiles || uploadedFiles.length === 0) return [
      { serviceName: 'ምሳሌ', planned: 100, actual: 75, execution: 75, color: '#eab308' }
    ];
    return uploadedFiles.slice(0, 6).map(f => ({
      serviceName: f.name.substring(0, 10),
      planned: 100,
      actual: f.status === 'የጸደቀ' ? 100 : 70,
      execution: f.status === 'የጸደቀ' ? 100 : 70,
      color: f.status === 'የጸደቀ' ? '#22c55e' : '#eab308'
    }));
  }, [uploadedFiles]);

  const filteredDocuments = useMemo(() => {
    let list = uploadedFiles || [];
    if (globalSearch.trim()) {
      const q = globalSearch.toLowerCase();
      list = list.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.expertName?.toLowerCase().includes(q) ||
        item.sector?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [uploadedFiles, globalSearch]);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/login');
  };

  const handleGenerate = () => {
    if (!input.trim()) return;
    const result = generateBPMN(input, title || "የሂደት ዲያግራም");
    if (result) {
      setXmlResult(result);
      setActiveTab("diagram");
      toast({ title: "ተሳክቷል", description: "ካርታው ተዘጋጅቷል" });
    }
  };

  const handleClearInputs = () => {
    setInput("");
    setTitle("");
  };

  const handleAutoSuggest = async (docType: 'diagram' | 'analysis' = 'diagram') => {
    setIsSuggesting(true);
    try {
      const result = await suggestSteps({ title: title || "አዲስ ስራ", docType, vaultContext: uploadedFiles });
      if (result?.steps) setInput(result.steps);
    } catch (error) {
      toast({ title: "ስህተት", description: "AI ምላሽ መስጠት አልቻለም", variant: "destructive" });
    } finally { setIsSuggesting(false); }
  };

  const handleSaveToVault = async () => {
    if (!user || !db) return router.push('/login');
    const currentXml = await viewerRef.current?.getXML() || xmlResult;
    if (!currentXml) return;
    setIsSaving(true);
    try {
      const dataUri = `data:application/xml;base64,${btoa(new TextEncoder().encode(currentXml).reduce((d, b) => d + String.fromCharCode(b), ''))}`;
      const newFile: Omit<UploadedFile, 'id'> = {
        name: title || "BPMN Diagram",
        category: 'BPMN Diagram',
        fileName: `${(title || "diagram").replace(/\s+/g, '-')}.bpmn`,
        fileSize: "BPMN",
        uploadDate: new Date().toISOString(),
        dataUrl: dataUri,
        fileUrl: dataUri,
        type: 'application/xml',
        status: 'በሂደት ላይ',
        version: 1,
        uploaderId: user.uid,
        expertName: user.displayName || user.email?.split('@')[0] || "ባለሙያ",
        sector: "ITB Sector",
        createdAt: Timestamp.now()
      };
      await addDocumentNonBlocking(collection(db, 'documents'), newFile);
      toast({ title: "ተቀምጧል", description: "መዝገብ ቤት ገብቷል" });
    } catch (err) {
      toast({ title: "ስህተት", description: "ማስቀመጥ አልተቻለም", variant: "destructive" });
    } finally { setIsSaving(false); }
  };

  const processUpload = () => {
    if (!selectedFile || !user || !db) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      const newFile: Omit<UploadedFile, 'id'> = {
        name: selectedFile.name.split('.')[0],
        category: uploadCategory || "ሌሎች",
        sector: uploadSector || "General",
        directorate: uploadDirectorate,
        team: uploadTeam,
        expertName: uploadExpertName || user.displayName || user.email?.split('@')[0] || "ባለሙያ",
        fileName: selectedFile.name,
        fileSize: (selectedFile.size / 1024).toFixed(1) + " KB",
        uploadDate: new Date().toISOString(),
        dataUrl,
        fileUrl: dataUrl,
        type: selectedFile.type,
        status: 'በሂደት ላይ',
        version: 1,
        uploaderId: user.uid,
        createdAt: Timestamp.now()
      };
      await addDocumentNonBlocking(collection(db, 'documents'), newFile);
      setIsUploading(false); setIsUploadOpen(false); setSelectedFile(null);
      toast({ title: "ተመዝግቧል", description: "መዝገብ ቤት ገብቷል" });
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSendFeedback = async () => {
    if (!feedbackInput.trim() || !user || !db) return;
    const newFeedback: Omit<FeedbackMessage, 'id'> = {
      senderName: user.displayName || user.email?.split('@')[0] || "ተጠቃሚ",
      senderRole: isAdmin ? "Admin" : "Staff",
      content: feedbackInput,
      timestamp: new Date().toISOString(),
      uploaderId: user.uid,
      createdAt: Timestamp.now()
    };
    await addDocumentNonBlocking(collection(db, 'feedback'), newFeedback);
    setFeedbackInput("");
    toast({ title: "ተልኳል", description: "መልዕክቱ ተመዝግቧል" });
  };

  const handleOpenFile = (url: string) => {
    if (!url) return;
    const win = window.open();
    if (win) {
      if (url.startsWith('data:')) {
        win.document.write(`<iframe src="${url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
      } else win.location.href = url;
    }
  };

  const handleApprove = (id: string) => {
    if (db && isAdmin) {
      updateDocumentNonBlocking(doc(db, 'documents', id), { status: 'የጸደቀ' });
      toast({ title: "ጸድቋል", description: "ሰነዱ በትክክል ጸድቋል" });
    }
  };

  const handleDelete = (id: string, uploaderId: string) => {
    if (db && (isAdmin || uploaderId === user?.uid)) {
      deleteDocumentNonBlocking(doc(db, 'documents', id));
      toast({ title: "ተሰርዟል", description: "ሰነዱ ተሰርዟል" });
    } else {
      toast({ title: "ስልጣን የለዎትም", description: "የራስዎን ፋይል ብቻ ነው መሰረዝ የሚችሉት", variant: "destructive" });
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      <header className="flex flex-col items-center py-6 bg-white border-b shrink-0 shadow-sm z-50">
        <h2 className="text-xl font-black text-[#1e3a8a] tracking-tight uppercase mb-2">Innovation and Technology Bureau</h2>
        <div className="relative w-24 h-24 bg-[#1e3a8a] rounded-2xl flex items-center justify-center shadow-xl border-4 border-white overflow-hidden">
          <Image 
            src="https://picsum.photos/seed/addis-ababa-logo/400/400" 
            alt="Addis Ababa Logo" 
            fill 
            className="object-contain p-2"
            data-ai-hint="Addis Ababa City Administration logo"
          />
        </div>
        <span className="text-xl font-black text-[#1e3a8a] mt-2">ITB</span>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-1">Innovation & Technology Bureau</p>
      </header>

      <div className="flex items-center justify-between px-6 py-2 bg-white border-b shrink-0">
        <div className="flex items-center gap-2">
          {isAdmin ? <Badge className="bg-amber-50 text-amber-600 border-amber-200 text-[9px] font-black uppercase">Master Admin</Badge> : <Badge className="bg-blue-50 text-blue-600 border-blue-200 text-[9px] font-black uppercase">ITB Staff</Badge>}
        </div>
        <div className="relative max-w-xl w-full mx-4">
          <Input value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} placeholder="መዝገብ ቤት ፈልግ..." className="h-9 text-xs pl-9 rounded-xl bg-slate-50 border-none" />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl font-black text-[10px] h-9 gap-2">
                <Avatar className="h-6 w-6"><AvatarFallback className="bg-[#1e3a8a] text-white text-[8px]">{user?.email?.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                <span className="max-w-[120px] truncate">{user?.email || "አካውንት"}</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl">
              {user ? (
                <>
                  {isAdmin && (
                    <DropdownMenuItem asChild><Link href="/admin" className="flex items-center w-full"><LayoutIcon className="w-4 h-4 mr-2" /> መቆጣጠሪያ ማዕከል</Link></DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 font-bold cursor-pointer"><LogOut className="w-4 h-4 mr-2" /> ውጣ (Logout)</DropdownMenuItem>
                </>
              ) : <DropdownMenuItem asChild><Link href="/login" className="flex items-center w-full"><LogIn className="w-4 h-4 mr-2" /> ግባ (Login)</Link></DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <main className="flex-1 flex flex-col p-3 gap-3 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-full">
          <div className="lg:col-span-5 flex flex-col gap-3 overflow-hidden">
            <Card className="shadow-lg border-none rounded-2xl overflow-hidden shrink-0">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-[#1e3a8a]" /> AI ረዳት
                  </h2>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleClearInputs} className="h-7 text-[9px] font-black text-red-500 rounded-xl hover:bg-red-50"><XCircle className="w-3.5 h-3.5 mr-1" /> አጥፋ</Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" className="h-7 text-[9px] font-black bg-[#1e3a8a] rounded-xl">{isSuggesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 mr-1" />} አመንጭ</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-64 rounded-xl">
                        <DropdownMenuItem onClick={() => handleAutoSuggest('diagram')} className="text-xs font-bold p-3 cursor-pointer"><LayoutIcon className="w-4 h-4 mr-2 text-[#1e3a8a]" /> አዲስ ስራ ፍሰት</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAutoSuggest('analysis')} className="text-xs font-bold p-3 cursor-pointer"><FileSearch className="w-4 h-4 mr-2 text-green-600" /> መዝገብ ቤት ትንተና</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="space-y-3">
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="የአገልግሎት ስም..." className="h-10 text-xs rounded-xl bg-slate-50 border-none" />
                  <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="ዝርዝር ተግባራት..." className="min-h-[120px] text-xs leading-relaxed rounded-xl bg-slate-50 border-none" />
                  <div className="flex gap-3">
                    <Button className="flex-1 h-11 bg-[#1e3a8a] text-white font-black text-xs rounded-xl shadow-lg hover:bg-[#1e3a8a]/90" onClick={handleGenerate}>ካርታውን አሳይ</Button>
                    <Button variant="outline" className="flex-1 h-11 border-[#1e3a8a] text-[#1e3a8a] font-black text-xs rounded-xl hover:bg-blue-50" onClick={handleSaveToVault} disabled={isSaving}>
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} መዝግብ
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="flex-1 shadow-lg border-none rounded-2xl overflow-hidden flex flex-col">
              <div className="p-4 border-b bg-slate-50/50 flex items-center justify-between">
                <h3 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" /> መዝገብ ቤት (Vault)</h3>
                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                  <DialogTrigger asChild><Button size="sm" className="h-7 rounded-xl bg-slate-900 text-[9px] font-black uppercase"><Upload className="w-3 h-3 mr-1" /> ፋይል መዝግብ</Button></DialogTrigger>
                  <DialogContent className="max-w-2xl rounded-2xl p-6">
                    <DialogHeader><DialogTitle className="font-black">አዲስ ፋይል መመዝገቢያ</DialogTitle></DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div className="space-y-3">
                        <Input value={uploadSector} onChange={(e) => setUploadSector(e.target.value)} placeholder="ዘርፍ (Sector)..." className="rounded-xl h-11" />
                        <Input value={uploadDirectorate} onChange={(e) => setUploadDirectorate(e.target.value)} placeholder="ዳይሬክቶሬት..." className="rounded-xl h-11" />
                        <Input value={uploadTeam} onChange={(e) => setUploadTeam(e.target.value)} placeholder="ቡድን (Team)..." className="rounded-xl h-11" />
                        <Input value={uploadExpertName} onChange={(e) => setUploadExpertName(e.target.value)} placeholder="የባለሙያ ስም..." className="rounded-xl h-11" />
                      </div>
                      <div className="space-y-3">
                        <Input value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)} placeholder="የፋይሉ አይነት (ለምሳሌ እቅድ)..." className="rounded-xl h-11" />
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all">
                          <Upload className="w-6 h-6 text-slate-300 mb-2" />
                          <span className="text-[10px] font-black text-slate-500 uppercase">{selectedFile ? selectedFile.name : "ፋይል ይምረጡ"}</span>
                          <input type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                        </label>
                      </div>
                    </div>
                    <DialogFooter><Button className="w-full h-12 bg-[#1e3a8a] rounded-xl font-black uppercase" onClick={processUpload} disabled={isUploading || !selectedFile}>{isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : "አጽድቅና መዝግብ"}</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <ScrollArea className="flex-1 p-3">
                {isDocsLoading ? (
                  <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-200" /></div>
                ) : filteredDocuments.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-3 mb-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-[#1e3a8a]/10 group-hover:text-[#1e3a8a] transition-colors"><FileText className="w-4 h-4" /></div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[11px] font-black text-slate-900 leading-tight line-clamp-1">{file.name}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase">{file.expertName} • {file.sector}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[7px] border-none h-4 px-2 font-black uppercase ${file.status === 'የጸደቀ' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>{file.status}</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4 text-slate-400" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl p-1.5">
                          <DropdownMenuItem onClick={() => handleOpenFile(file.fileUrl)} className="text-xs font-bold rounded-lg cursor-pointer"><Eye className="w-4 h-4 mr-2 text-blue-600" /> ክፈት</DropdownMenuItem>
                          {(isAdmin && file.status !== 'የጸደቀ') && (
                            <DropdownMenuItem onClick={() => handleApprove(file.id)} className="text-xs font-bold rounded-lg cursor-pointer"><CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> አጽድቅ</DropdownMenuItem>
                          )}
                          <DropdownMenuItem asChild className="text-xs font-bold rounded-lg cursor-pointer">
                            <a href={file.fileUrl} download={file.fileName} className="flex items-center w-full">
                              <Download className="w-4 h-4 mr-2 text-[#1e3a8a]" /> አውርድ
                            </a>
                          </DropdownMenuItem>
                          {(isAdmin || file.uploaderId === user?.uid) && (
                            <DropdownMenuItem onClick={() => handleDelete(file.id, file.uploaderId)} className="text-xs font-bold text-red-600 rounded-lg cursor-pointer">
                              <Trash2 className="w-4 h-4 mr-2" /> ሰርዝ
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </Card>
          </div>

          <div className="lg:col-span-7 flex flex-col gap-3 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="bg-white border p-1 h-10 rounded-2xl shadow-sm shrink-0">
                <TabsTrigger value="diagram" className="text-[10px] font-black px-6 rounded-xl uppercase">ዲያግራም</TabsTrigger>
                <TabsTrigger value="dashboard" className="text-[10px] font-black px-6 rounded-xl uppercase">አፈጻጸም</TabsTrigger>
                <TabsTrigger value="daily-log" className="text-[10px] font-black px-6 rounded-xl uppercase">የቀን ውሎ</TabsTrigger>
                <TabsTrigger value="feedback" className="text-[10px] font-black px-6 rounded-xl uppercase">ዳሽ ቦርድ</TabsTrigger>
              </TabsList>

              <div className="flex-1 mt-3 min-h-0">
                <TabsContent value="diagram" className="h-full m-0">
                  <Card className="h-full rounded-2xl border-none shadow-xl overflow-hidden bg-white">
                    {xmlResult ? <BPMNViewer xml={xmlResult} title={title} ref={viewerRef} /> : (
                      <div className="h-full flex flex-col items-center justify-center opacity-10">
                        <FileCode className="w-32 h-32" />
                        <p className="text-xl font-black uppercase tracking-widest mt-4">BPMN ካርታ የለም</p>
                      </div>
                    )}
                  </Card>
                </TabsContent>
                
                <TabsContent value="dashboard" className="h-full m-0 overflow-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-full">
                    <Card className="shadow-lg border-none rounded-2xl bg-white p-5 flex flex-col">
                      <h3 className="text-[11px] font-black uppercase tracking-widest mb-6 flex items-center gap-2"><BarChart className="w-5 h-5 text-[#1e3a8a]" /> አጠቃላይ አፈጻጸም</h3>
                      <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart data={performanceData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="serviceName" fontSize={9} fontWeight="bold" />
                            <YAxis fontSize={9} fontWeight="bold" />
                            <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                            <Bar dataKey="actual" radius={[6, 6, 0, 0]}>{performanceData.map((e, i) => <Cell key={`cell-${i}`} fill={e.color} />)}</Bar>
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                    <Card className="shadow-lg border-none rounded-2xl bg-white p-5 flex flex-col">
                      <h3 className="text-[11px] font-black uppercase tracking-widest mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-600" /> ዝርዝር ትንተና</h3>
                      <ScrollArea className="flex-1">
                        <div className="space-y-4">
                          {performanceData.map((m, i) => (
                            <div key={`perf-${i}`} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                              <div className="flex justify-between mb-2"><span className="text-[10px] font-black">{m.serviceName}</span><Badge className="text-[8px] font-black">{m.execution}%</Badge></div>
                              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full transition-all duration-1000" style={{ width: `${m.execution}%`, backgroundColor: m.color }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="daily-log" className="h-full m-0">
                  <Card className="h-full shadow-lg border-none rounded-2xl bg-white overflow-hidden flex flex-col">
                    <div className="p-4 border-b flex justify-between items-center bg-slate-50/50">
                      <h3 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2"><History className="w-4 h-4 text-[#1e3a8a]" /> የቀን ውሎ መመዝገቢያ</h3>
                      <Badge className="bg-white text-slate-900 border-slate-200 text-[9px] font-black">{currentDate}</Badge>
                    </div>
                    <ScrollArea className="flex-1">
                      <Table>
                        <TableHeader className="bg-slate-50/80">
                          <TableRow>
                            <TableHead className="text-[9px] font-black uppercase">ሰራተኛ</TableHead>
                            <TableHead className="text-[9px] font-black uppercase">ዘርፍ/ቡድን</TableHead>
                            <TableHead className="text-[9px] font-black uppercase">ተግባር/ፋይል</TableHead>
                            <TableHead className="text-[9px] font-black uppercase text-right">ርክክብ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {uploadedFiles.map(f => (
                            <TableRow key={f.id} className="hover:bg-slate-50/50">
                              <TableCell className="text-[10px] font-black">{f.expertName}</TableCell>
                              <TableCell className="text-[10px] font-medium">{f.sector} / {f.team || 'N/A'}</TableCell>
                              <TableCell className="text-[10px] font-bold">{f.name}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg hover:bg-blue-50" onClick={() => handleOpenFile(f.fileUrl)}>
                                  <Eye className="w-4 h-4 text-[#1e3a8a]" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </Card>
                </TabsContent>

                <TabsContent value="feedback" className="h-full m-0 flex flex-col gap-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 h-full">
                    <Card className="md:col-span-2 shadow-xl border-none rounded-2xl bg-white flex flex-col overflow-hidden">
                      <div className="p-4 border-b bg-slate-50/50 flex items-center justify-between">
                        <h3 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2"><MessageSquare className="w-5 h-5 text-[#1e3a8a]" /> የአመራርና የሰራተኞች ዳሽ ቦርድ</h3>
                        <Badge className="bg-green-50 text-green-600 border-none text-[8px] font-black uppercase">Institutional Hub</Badge>
                      </div>
                      <ScrollArea className="flex-1 p-5">
                        <div className="space-y-6">
                          {feedbackMessages.map(msg => (
                            <div key={msg.id} className="flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                              <Avatar className="w-9 h-9 border-2 border-white shadow-md"><AvatarFallback className="bg-[#1e3a8a] text-white text-[10px] font-black">{msg.senderName.charAt(0)}</AvatarFallback></Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[11px] font-black">{msg.senderName}</span>
                                  <Badge className="text-[8px] h-4 bg-[#1e3a8a]/5 text-[#1e3a8a] border-none uppercase">{msg.senderRole}</Badge>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                                  <p className="text-xs text-slate-700 leading-relaxed font-medium">{msg.content}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <div className="p-5 bg-white border-t space-y-4 shadow-inner">
                        <div className="relative group">
                          <Textarea 
                            value={feedbackInput} 
                            onChange={(e) => setFeedbackInput(e.target.value)} 
                            placeholder="አዲስ መመሪያ ወይም ሪፖርት እዚህ ይጻፉ... (Office Style Editor)" 
                            className="bg-slate-50 border-none rounded-2xl text-xs min-h-[140px] shadow-inner p-5 font-medium resize-none focus-visible:ring-1 focus-visible:ring-[#1e3a8a]/20" 
                          />
                          <Button className="absolute bottom-4 right-4 h-10 px-8 rounded-xl bg-[#1e3a8a] text-white font-black text-xs shadow-xl hover:bg-[#1e3a8a]/90 transition-all active:scale-95" onClick={handleSendFeedback}>
                            <Send className="w-4 h-4 mr-2" /> መዝግብ
                          </Button>
                        </div>
                      </div>
                    </Card>
                    <Card className="shadow-lg border-none rounded-2xl bg-white p-5 flex flex-col">
                      <h3 className="text-[11px] font-black uppercase tracking-widest mb-6 flex items-center gap-2"><Users className="w-4 h-4 text-green-600" /> ንቁ ተጠቃሚዎች</h3>
                      <div className="space-y-4">
                        {user ? (
                          <div className="flex items-center gap-3 p-3 rounded-2xl bg-green-50 border border-green-100 shadow-sm">
                            <Avatar className="w-9 h-9 border-2 border-white shadow-md">
                              <AvatarFallback className="bg-green-500 text-white font-black">{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-[11px] font-black truncate max-w-[120px]">{user.email?.split('@')[0]}</span>
                              <span className="text-[9px] text-green-600 font-black uppercase tracking-widest animate-pulse">Online</span>
                            </div>
                          </div>
                        ) : <p className="text-[10px] font-bold text-slate-300 uppercase">ምንም ተጠቃሚ የለም</p>}
                      </div>
                    </Card>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </main>

      <footer className="px-6 py-2 bg-white border-t flex justify-between items-center shrink-0">
        <div className="flex gap-4 items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
          <span>ITB Enterprise v4.5.0</span>
          {isAdmin && (
            <>
              <span className="text-slate-200">|</span>
              <Link href="/admin" className="text-[#1e3a8a] hover:underline">MASTER CONTROL</Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Secure Institutional Network</span>
        </div>
      </footer>
    </div>
  );
}
