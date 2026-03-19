
"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Trash2, 
  Search,
  Loader2,
  Upload,
  BarChart,
  FileText,
  BrainCircuit,
  MessageSquare,
  Send,
  LogOut,
  ShieldCheck,
  Save,
  CheckCircle2,
  Archive,
  Eye,
  Bell,
  MoreVertical,
  CheckCircle,
  FileDown,
  Sparkles,
  ChevronDown,
  Download,
  Printer
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { 
  useCollection, 
  useUser, 
  useFirestore, 
  useMemoFirebase,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  useAuth,
  useDoc
} from '@/firebase';
import { collection, query, doc, Timestamp, orderBy } from 'firebase/firestore';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ADMIN_EMAIL = "workumesafint2@gmail.com";

interface SignatureEntry {
  role: string;
  name: string;
  date: string;
  status: string;
}

interface UploadedFile {
  id: string;
  name: string;
  category: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  fileUrl: string; 
  status: string;
  uploaderId: string;
  expertName?: string;
  sector?: string;
  registryNumber?: string;
  registryDate?: string;
  signatures?: SignatureEntry[];
  createdAt?: any;
}

export function BPMNFlowForgeApp() {
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [title, setTitle] = useState("");
  const [xmlResult, setXmlResult] = useState("");
  const [activeTab, setActiveTab] = useState("diagram");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [upName, setUpName] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");

  const viewerRef = useRef<BPMNViewerRef>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isMasterAdmin = user?.email === ADMIN_EMAIL;
  const userDocQuery = useMemoFirebase(() => db && user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userProfile } = useDoc<any>(userDocQuery);

  const documentsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'documents'), orderBy('createdAt', 'desc'));
  }, [db]);

  const feedbackQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: allDocs, isLoading: isDocsLoading } = useCollection<UploadedFile>(documentsQuery);
  const { data: feedbackMessages } = useCollection<any>(feedbackQuery);
  
  const filteredDocuments = useMemo(() => {
    let list = allDocs || [];
    if (!isMasterAdmin && userProfile?.sector) {
      list = list.filter(f => f.sector === userProfile.sector || f.uploaderId === user?.uid);
    }
    if (!globalSearch.trim()) return list;
    const q = globalSearch.toLowerCase();
    return list.filter(f => 
      f.name?.toLowerCase().includes(q) || 
      f.expertName?.toLowerCase().includes(q) ||
      f.status?.toLowerCase().includes(q)
    );
  }, [allDocs, globalSearch, isMasterAdmin, userProfile, user]);

  const handleLogAction = async (action: string, docName: string, details: string) => {
    if (!db || !user) return;
    await addDocumentNonBlocking(collection(db, 'audit_logs'), {
      action,
      userName: user.displayName || user.email || "ባለሙያ",
      docName,
      details,
      timestamp: Timestamp.now(),
      sector: userProfile?.sector || "N/A"
    });
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/login');
  };

  const handleGenerate = () => {
    if (!input.trim()) {
      toast({ title: "መረጃ ይጎድላል", description: "እባክዎ የሂደት ዝርዝር ያስገቡ", variant: "destructive" });
      return;
    }
    const res = generateBPMN(input, title);
    if (res) {
      setXmlResult(res);
      toast({ title: "ተሳክቷል", description: "የሥራ ሂደት ካርታው ተዘጋጅቷል" });
    }
  };

  const handleSaveToVault = async () => {
    if (!xmlResult || !db || !user) return;
    setIsSaving(true);
    try {
      const diagramName = title.trim() || "የሥራ ሂደት ካርታ";
      const blob = new Blob([xmlResult], { type: 'application/xml' });
      const fileUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      await addDocumentNonBlocking(collection(db, 'documents'), {
        name: diagramName,
        category: "ዲያግራም",
        fileName: `${diagramName}.bpmn`,
        fileSize: "BPMN XML",
        uploadDate: new Date().toISOString(),
        fileUrl: fileUrl,
        status: 'በሂደት ላይ',
        uploaderId: user.uid,
        sector: userProfile?.sector || "Unknown",
        expertName: user.displayName || user.email || "ባለሙያ",
        createdAt: Timestamp.now(),
        signatures: []
      });
      handleLogAction("SAVE_DIAGRAM", diagramName, "አዲስ የBPMN ዲያግራም ተመዝግቧል");
      setIsSaving(false);
      toast({ title: "ተሳክቷል", description: "ዲያግራሙ በመዝገብ ቤት ተቀምጧል" });
    } catch (e) {
      setIsSaving(false);
      toast({ title: "ስህተት", description: "ዲያግራሙን ማስቀመጥ አልተቻለም", variant: "destructive" });
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile && !upName.trim()) {
      toast({ title: "መረጃ ይጎድላል", description: "እባክዎ ፋይል ይምረጡ", variant: "destructive" });
      return;
    }
    if (!user || !db) return;
    setIsSaving(true);
    try {
      const finalName = upName.trim() || selectedFile?.name || "ያልተሰየመ ሰነድ";
      let fileUrl = "";
      if (selectedFile) {
        fileUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(selectedFile);
        });
      }
      
      const regNumber = `ITB/${Math.floor(1000 + Math.random() * 9000)}/2024`;

      await addDocumentNonBlocking(collection(db, 'documents'), {
        name: finalName,
        category: "ኦፊሴላዊ ሰነድ",
        fileName: selectedFile?.name || finalName,
        fileSize: selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : "N/A",
        uploadDate: new Date().toISOString(),
        fileUrl: fileUrl,
        status: 'በሂደት ላይ',
        uploaderId: user.uid,
        sector: userProfile?.sector || "N/A",
        expertName: user.displayName || user.email || "ባለሙያ",
        registryNumber: regNumber,
        registryDate: new Date().toLocaleDateString('et-ET'),
        createdAt: Timestamp.now(),
        signatures: []
      });
      handleLogAction("UPLOAD", finalName, "አዲስ ፋይል ተመዝግቧል");
      setIsSaving(false);
      setIsUploadOpen(false);
      setUpName("");
      setSelectedFile(null);
      toast({ title: "ተሳክቷል", description: "ሰነዱ በመዝገብ ቤት ገብቷል" });
    } catch (e) {
      setIsSaving(false);
      toast({ title: "ስህተት", description: "መጫን አልተቻለም", variant: "destructive" });
    }
  };

  const handleOpenFile = (file: UploadedFile) => {
    if (!file.fileUrl) return;
    handleLogAction("VIEW", file.name, "ሰነዱን ተመልክተዋል");
    const win = window.open();
    if (win) {
      win.document.write(`<iframe src="${file.fileUrl}" frameborder="0" style="border:0; width:100%; height:100%;" allowfullscreen></iframe>`);
    }
  };

  const handleExportRegistry = () => {
    const headers = ["ስም", "ዘርፍ", "መዝገብ ቁጥር", "ቀን", "ሁኔታ"];
    const rows = filteredDocuments.map(d => [
      d.name,
      d.sector || "N/A",
      d.registryNumber || "N/A",
      new Date(d.uploadDate).toLocaleDateString(),
      d.status
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "itb_registry_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "ተሳክቷል", description: "የመዝገብ መረጃዎች ወርደዋል" });
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* HEADER V3.1.0 */}
      <header className="h-20 bg-white border-b flex items-center px-8 shrink-0 sticky top-0 z-50">
        <div className="flex flex-col">
          <h1 className="text-sm font-black text-[#1e3a8a] uppercase leading-none">የኢኖቬሽንና ቴክኖሎጂ ልማት ቢሮ</h1>
          <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">ITDB INSTITUTIONAL PORTAL V3.1.0</span>
        </div>

        <div className="flex-1 flex justify-center px-12">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <Input 
              value={globalSearch} 
              onChange={(e) => setGlobalSearch(e.target.value)} 
              placeholder="በስም፣ በምድብ ወይም በሁኔታ ይፈልጉ..." 
              className="w-full h-11 pl-11 pr-4 bg-slate-50 border-none rounded-full text-xs font-bold focus-visible:ring-1 focus-visible:ring-[#1e3a8a]/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full text-slate-400">
            <Bell className="w-5 h-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 w-10 p-0 rounded-full border shadow-sm">
                <Avatar className="h-full w-full">
                  <AvatarFallback className="bg-[#1e3a8a] text-white text-[10px] font-black">
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-none shadow-2xl">
              <DropdownMenuLabel className="text-[10px] uppercase font-black px-3 text-slate-400">የባለሙያ መቆጣጠሪያ</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href="/admin" className="flex items-center w-full p-3 rounded-xl font-bold text-[11px] cursor-pointer hover:bg-slate-50">
                  <ShieldCheck className="w-4 h-4 mr-2 text-blue-600" /> የሥራ ሂደት ቁጥጥር
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 font-bold p-3 rounded-xl cursor-pointer hover:bg-red-50 text-[11px]">
                <LogOut className="w-4 h-4 mr-2" /> ውጣ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* INPUT SECTION V3.1.0 */}
        <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">የአገልግሎቱ ስም</label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="የአገልግሎት ስም እዚህ ያስገቡ..." 
                className="h-14 bg-slate-50 border-none rounded-2xl text-xs font-bold px-6"
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">የሂደቱ ዝርዝር ተግባር</label>
                <Badge variant="outline" className="rounded-full h-8 px-4 text-[9px] font-black uppercase bg-purple-50 text-purple-600 border-purple-100 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" /> ወርቁን ምን ልርዳዎት? <ChevronDown className="w-3 h-3" />
                </Badge>
              </div>
              <Textarea 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder="ዝርዝሩን እዚህ ያስገቡ..." 
                className="min-h-[120px] bg-slate-50 border-none rounded-2xl text-xs font-medium p-6 resize-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 mt-10">
            <Button onClick={handleGenerate} className="flex-1 h-16 bg-[#4c1d95] hover:bg-[#4c1d95]/90 rounded-2xl text-[12px] font-black uppercase shadow-2xl tracking-widest">
              ዲያግራም አመንጪ
            </Button>
            <Button onClick={handleSaveToVault} disabled={!xmlResult || isSaving} variant="outline" className="h-16 px-10 rounded-2xl border-2 border-slate-100 font-black text-[11px] uppercase flex items-center gap-3">
              <Save className="w-5 h-5" /> {isSaving ? "በመመዝገብ ላይ..." : "መዝግብ (Save)"}
            </Button>
            <Button variant="outline" onClick={() => {setInput(""); setXmlResult(""); setTitle("");}} className="h-16 w-16 p-0 rounded-2xl border-2 border-slate-100 text-slate-300 hover:text-red-500">
              <Trash2 className="w-6 h-6" />
            </Button>
          </div>
        </Card>

        {/* TABS & ACTIONS - WRAPPED IN TABS FOR CONTEXT */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
          <div className="flex items-center justify-between">
            <TabsList className="bg-white p-1 rounded-2xl shadow-lg border border-slate-100 h-auto gap-1">
              <TabsTrigger value="diagram" className="text-[10px] font-black px-8 py-3 rounded-xl uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white">የካሙንዳ ዲያግራም</TabsTrigger>
              <TabsTrigger value="performance" className="text-[10px] font-black px-8 py-3 rounded-xl uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white">የቢሮ መዝገብ ቤት</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-3">
              <Button onClick={handleExportRegistry} variant="outline" className="h-12 px-6 rounded-2xl border-2 border-slate-100 text-[#1e3a8a] font-black text-[10px] uppercase flex items-center gap-2">
                <FileDown className="w-4 h-4" /> መዝገብ አውርድ (CSV)
              </Button>
              <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogTrigger asChild>
                  <Button className="h-12 px-8 rounded-2xl bg-[#1e3a8a] text-white shadow-xl hover:bg-[#1e3a8a]/90 font-black text-[10px] uppercase flex items-center gap-2">
                    <Upload className="w-4 h-4" /> አዲስ ፋይል አያይዝ
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md rounded-[2.5rem] p-10 border-none shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-center font-black uppercase text-[#1e3a8a] mb-6">አዲስ ሰነድ መመዝገቢያ</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="border-2 border-dashed border-slate-100 rounded-3xl p-10 flex flex-col items-center justify-center gap-4 bg-slate-50/50 relative">
                      <Input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer h-full" />
                      <Upload className="w-10 h-10 text-[#1e3a8a]/20" />
                      <p className="text-[10px] font-black text-slate-400 uppercase text-center">{selectedFile ? selectedFile.name : "ፋይል ይምረጡ ወይም እዚህ ይጎትቱ"}</p>
                    </div>
                    <Input value={upName} onChange={(e) => setUpName(e.target.value)} placeholder="የሰነዱ ስም..." className="h-12 bg-slate-50 border-none rounded-xl text-xs font-bold" />
                    <Button onClick={handleFileUpload} disabled={isSaving} className="w-full h-14 bg-[#1e3a8a] rounded-xl font-black uppercase text-[10px] shadow-xl">
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "መዝግብ"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <TabsContent value="diagram">
            <Card className="min-h-[850px] rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden relative">
              {xmlResult ? (
                <div className="w-full h-full min-h-[850px]">
                  <BPMNViewer xml={xmlResult} title={title} ref={viewerRef} />
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 pointer-events-none">
                  <BrainCircuit className="w-24 h-24 mb-6" />
                  <p className="text-[14px] font-black uppercase tracking-[0.5em]">ዲያግራም የለም</p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard icon={<BrainCircuit className="text-purple-600" />} label="የተመዘገቡ ዲያግራሞች" value={filteredDocuments.filter(d => d.category === 'ዲያግራም').length} color="purple" />
              <StatCard icon={<FileText className="text-green-600" />} label="ኦፊሴላዊ ሰነዶች" value={filteredDocuments.filter(d => d.category === 'ኦፊሴላዊ ሰነድ').length} color="green" />
              <StatCard icon={<CheckCircle2 className="text-amber-600" />} label="የተጠናቀቁ ስራዎች" value={filteredDocuments.filter(d => d.status === 'የተጠናቀቀ').length} color="amber" />
            </div>

            <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden">
              <div className="divide-y divide-slate-50">
                {isDocsLoading ? (
                  <div className="p-40 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-slate-200" /></div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="p-40 text-center text-slate-300 font-black uppercase tracking-widest text-[10px]">በዚህ ዘርፍ ምንም ሰነድ አልተገኘም</div>
                ) : (
                  filteredDocuments.map(doc => (
                    <div key={doc.id} className="p-8 hover:bg-slate-50 transition-all flex items-center justify-between group">
                      <div className="flex items-center gap-8">
                        <div className="w-14 h-14 bg-white border-2 border-slate-50 rounded-2xl flex items-center justify-center shadow-sm">
                          <FileText className="w-7 h-7 text-slate-300" />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-3">
                            <span className="text-[13px] font-black text-slate-900">{doc.name}</span>
                            {doc.registryNumber && (
                              <Badge variant="outline" className="text-[7px] font-black uppercase rounded-full h-5 px-3 bg-blue-50 border-blue-100 text-blue-600">{doc.registryNumber}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{doc.expertName}</span>
                             <span className="text-[8px] font-black text-slate-400 uppercase">•</span>
                             <span className="text-[8px] font-black text-slate-400 uppercase">{doc.sector}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                        <Badge className={`h-8 px-5 rounded-full text-[8px] font-black uppercase border-none shadow-sm ${
                          doc.status === 'በዳይሬክተር የጸደቀ' ? 'bg-green-50 text-green-600' :
                          doc.status === 'በኃላፊ የተፈረመ' ? 'bg-purple-50 text-purple-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {doc.status}
                        </Badge>
                        <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                          {new Date(doc.uploadDate).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenFile(doc)} className="h-10 w-10 rounded-xl opacity-0 group-hover:opacity-100 text-[#1e3a8a]">
                            <Eye className="w-5 h-5" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-300">
                                <MoreVertical className="w-5 h-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2 w-48">
                               <DropdownMenuItem onClick={() => handleOpenFile(doc)} className="font-bold text-[11px] p-3 rounded-xl cursor-pointer">
                                  <FileDown className="w-4 h-4 mr-2" /> ሰነዱን ክፈት
                               </DropdownMenuItem>
                               {(isMasterAdmin || user?.uid === doc.uploaderId) && (
                                 <DropdownMenuItem onClick={() => {setDeleteId(doc.id); setDeleteName(doc.name);}} className="text-red-600 font-bold text-[11px] p-3 rounded-xl cursor-pointer">
                                    <Trash2 className="w-4 h-4 mr-2" /> ሰርዝ
                                 </DropdownMenuItem>
                               )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* FOOTER V3.1.0 */}
      <footer className="h-20 bg-white border-t flex items-center justify-between px-12 shrink-0 mt-20">
        <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
          ITDB PORTAL V3.1.0 - INSTITUTIONAL RECOVERY BUILD
        </div>
        <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
          © 2024 INNOVATION AND TECHNOLOGY DEVELOPMENT BUREAU
        </div>
        <div className="flex items-center gap-8">
           <Link href="/admin" className="flex items-center gap-2 text-[9px] font-black text-[#1e3a8a] uppercase tracking-widest hover:underline">
              <ShieldCheck className="w-3.5 h-3.5" /> ADMIN LOGIN
           </Link>
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SYSTEM ONLINE</span>
           </div>
        </div>
      </footer>

      {/* MESSENGER FAB */}
      <Button 
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-10 right-10 h-16 w-16 rounded-full bg-[#1e3a8a] shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 p-0"
      >
        <MessageSquare className="w-7 h-7 text-white" />
        <Badge className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 border-4 border-white flex items-center justify-center p-0 text-[10px] font-black">1</Badge>
      </Button>

      {/* CHAT PANEL */}
      {isChatOpen && (
        <Card className="fixed bottom-28 right-10 w-[400px] h-[550px] rounded-[2.5rem] shadow-2xl border-none overflow-hidden z-50 flex flex-col animate-in slide-in-from-bottom-5">
           <div className="h-20 bg-[#1e3a8a] p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-white font-black text-[11px] uppercase tracking-widest">የቢሮ መፃፃፊያ</span>
                    <span className="text-white/50 font-bold text-[8px] uppercase">One-to-One Messenger</span>
                 </div>
              </div>
           </div>
           <ScrollArea className="flex-1 p-6 bg-slate-50">
              <div className="space-y-4">
                 {feedbackMessages?.map(msg => (
                   <div key={msg.id} className={`flex flex-col ${msg.uploaderId === user?.uid ? 'items-end' : 'items-start'}`}>
                      <div className={`p-4 rounded-2xl text-[11px] font-bold shadow-sm max-w-[80%] ${msg.uploaderId === user?.uid ? 'bg-[#1e3a8a] text-white' : 'bg-white text-slate-700'}`}>
                         {msg.content}
                      </div>
                      <div className="flex items-center gap-2 mt-1 px-2">
                        <span className="text-[7px] font-black text-slate-400 uppercase">{msg.senderName}</span>
                        {(isMasterAdmin || msg.uploaderId === user?.uid) && (
                          <button onClick={() => deleteDocumentNonBlocking(doc(db!, 'feedback', msg.id))} className="text-red-400 hover:text-red-600 transition-colors">
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                   </div>
                 ))}
              </div>
           </ScrollArea>
           <div className="p-6 bg-white border-t flex gap-3">
              <Input 
                value={feedbackInput} 
                onChange={(e) => setFeedbackInput(e.target.value)} 
                placeholder="መልዕክት..." 
                className="h-12 bg-slate-50 border-none rounded-xl text-xs font-bold px-4"
              />
              <Button 
                onClick={async () => {
                  if(!feedbackInput.trim()) return;
                  await addDocumentNonBlocking(collection(db!, 'feedback'), {
                    senderName: user?.displayName || user?.email || "ባለሙያ",
                    content: feedbackInput,
                    timestamp: new Date().toISOString(),
                    uploaderId: user?.uid,
                    createdAt: Timestamp.now()
                  });
                  setFeedbackInput("");
                }}
                className="h-12 w-12 rounded-xl bg-[#1e3a8a] p-0"
              >
                <Send className="w-5 h-5" />
              </Button>
           </div>
        </Card>
      )}

      {/* DELETE DIALOG */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center font-black uppercase text-red-600 mb-2">እርግጠኛ ነዎት?</AlertDialogTitle>
            <AlertDialogDescription className="text-center font-bold text-slate-500 text-[11px] mb-6">
               "{deleteName}" የሚለው ፋይል ከመዝገብ ቤት እንዲሰረዝ ይፈልጋሉ? ድርጊቱ ሊመለስ አይችልም።
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-4">
            <AlertDialogCancel className="flex-1 h-12 rounded-xl font-black uppercase text-[10px]">ተመለስ</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                if(deleteId && db) {
                  await deleteDocumentNonBlocking(doc(db, 'documents', deleteId));
                  handleLogAction("DELETE", deleteName, "ሰነዱ ተሰርዟል");
                  toast({ title: "ተሰርዟል", description: "ሰነዱ በትክክል ተሰርዟል" });
                  setDeleteId(null);
                }
              }}
              className="flex-1 h-12 bg-red-600 hover:bg-red-700 rounded-xl font-black uppercase text-[10px]"
            >
              አጥፋ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) {
  return (
    <Card className="border-none shadow-lg rounded-3xl bg-white p-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
          <p className="text-2xl font-black text-slate-900">{value}</p>
        </div>
        <div className={`w-14 h-14 bg-${color}-50 rounded-2xl flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
