'use client';

import { useMemo, useEffect, useState } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Users, 
  Clock, 
  CheckCircle2, 
  Eye, 
  Building2, 
  User,
  MoreVertical,
  Download,
  Trash2,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  FileSearch,
  History,
  PenTool,
  Archive,
  Search,
  CheckCircle,
  Stamp,
  Mail
} from 'lucide-react';
import { 
  useCollection, 
  useFirestore, 
  useMemoFirebase,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  useUser,
  addDocumentNonBlocking
} from '@/firebase';
import { collection, query, orderBy, doc, Timestamp } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ADMIN_EMAIL = "workumesafint2@gmail.com";

interface SignatureEntry {
  role: string;
  name: string;
  date: string;
  status: string;
}

interface DocumentRecord {
  id: string;
  name: string;
  category: string;
  status: string;
  uploadDate: string;
  fileUrl: string;
  uploaderId: string;
  expertName?: string;
  sector?: string;
  registryNumber?: string;
  mailType?: string;
  senderReceiver?: string;
  signatures?: SignatureEntry[];
  createdAt?: any;
}

export default function AdminPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("documents");

  useEffect(() => {
    setMounted(true);
  }, []);

  const isMasterAdmin = user?.email === ADMIN_EMAIL;

  const docsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'documents'), orderBy('createdAt', 'desc'));
  }, [db]);

  const auditQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'));
  }, [db]);

  const { data: allDocs, isLoading: docsLoading } = useCollection<DocumentRecord>(docsQuery);
  const { data: allLogs, isLoading: logsLoading } = useCollection<any>(auditQuery);

  const handleLogAction = async (action: string, docName: string, details: string) => {
    if (!db || !user) return;
    await addDocumentNonBlocking(collection(db, 'audit_logs'), {
      action,
      userName: user.displayName || user.email || "ባለሙያ",
      docName,
      details,
      timestamp: Timestamp.now()
    });
  };

  const handleWorkflowAction = async (docItem: DocumentRecord, nextStatus: string, roleName: string) => {
    if (!db) return;
    
    const newSignature: SignatureEntry = {
      role: roleName,
      name: user?.displayName || user?.email || "ተጠቃሚ",
      date: new Date().toLocaleString('et-ET'),
      status: 'ተፈርሟል'
    };

    const updatedSignatures = [...(docItem.signatures || []), newSignature];

    updateDocumentNonBlocking(doc(db, 'documents', docItem.id), { 
      status: nextStatus,
      signatures: updatedSignatures
    });

    if (docItem.sector) {
      await addDocumentNonBlocking(collection(db, 'notifications'), {
        title: "የሰነድ ፊርማ ማሳሰቢያ",
        message: `ሰነድ "${docItem.name}" በ${roleName} ተፈርሞ ወደ "${nextStatus}" ደረጃ ተቀይሯል።`,
        targetSector: docItem.sector,
        docId: docItem.id,
        createdAt: Timestamp.now()
      });
    }

    handleLogAction("SIGNATURE", docItem.name, `${roleName} ፊርማቸውን አኑረዋል`);
    toast({ title: "ተፈርሟል", description: `ሰነዱ በ${roleName} ተፈርሟል።` });
  };

  const handleDelete = (docItem: DocumentRecord) => {
    if (!db) return;
    if (isMasterAdmin || user?.uid === docItem.uploaderId) {
      deleteDocumentNonBlocking(doc(db, 'documents', docItem.id));
      handleLogAction("DELETE", docItem.name, "ሰነዱ ተሰርዟል");
      toast({ title: "ተሰርዟል", description: "ሰነዱ ከመዝገብ ቤት ተወግዷል" });
    }
  };

  const handleOpenFile = (docItem: DocumentRecord) => {
    if (!docItem.fileUrl) return;
    const win = window.open();
    if (win) {
      win.document.write(`<iframe src="${docItem.fileUrl}" frameborder="0" style="border:0; width:100%; height:100%;" allowfullscreen></iframe>`);
    }
  };

  if (!mounted) return null;

  return (
    <AuthGuard>
      <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
        <div className="flex items-center justify-between mb-8">
          <Button asChild variant="ghost" className="rounded-2xl text-slate-500 hover:text-[#1e3a8a] font-black text-[10px] uppercase h-12 px-6">
            <Link href="/"><ArrowLeft className="w-4 h-4 mr-2" /> ወደ ዋናው ገጽ</Link>
          </Button>
          <header className="flex flex-col items-center">
            <h1 className="text-[14px] font-black text-[#1e3a8a] uppercase tracking-tight mb-2">የኢኖቬሽንና ቴክኖሎጂ ቢሮ</h1>
            <h1 className="text-xs font-black text-slate-800 uppercase bg-white px-10 py-3 rounded-full shadow-lg border flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-green-500" /> የሥራ ሂደት መቆጣጠሪያ ማዕከል
            </h1>
          </header>
          <div className="w-32 flex justify-end">
            {isMasterAdmin && <Badge className="bg-green-500 text-white font-black text-[8px] h-8 px-4 rounded-xl uppercase">Master Admin</Badge>}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="bg-white p-1 rounded-2xl shadow-xl border border-slate-100 h-auto gap-1">
              <TabsTrigger value="documents" className="text-[10px] font-black px-8 py-3 rounded-xl uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white">የሰነዶች ዝውውር</TabsTrigger>
              <TabsTrigger value="audit" className="text-[10px] font-black px-8 py-3 rounded-xl uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white">የክትትል መዝገብ (Audit)</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="documents">
            <Card className="shadow-2xl border-none overflow-hidden rounded-[2.5rem] bg-white">
              <CardContent className="p-0">
                {docsLoading ? (
                  <div className="flex flex-col items-center justify-center py-40 gap-6">
                    <Loader2 className="w-12 h-12 animate-spin text-[#1e3a8a]/20" />
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {allDocs?.map((docItem) => (
                      <div key={docItem.id} className="p-8 hover:bg-slate-50/80 transition-all">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-6">
                            <div className={`w-14 h-14 bg-white border rounded-2xl flex items-center justify-center shadow-md ${docItem.mailType ? 'border-blue-100' : ''}`}>
                              {docItem.mailType ? <Mail className="w-7 h-7 text-blue-400" /> : <FileText className="w-7 h-7 text-slate-400" />}
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <span className="text-sm font-black text-slate-900">{docItem.name}</span>
                              <div className="flex items-center gap-4">
                                <span className="text-[10px] text-[#1e3a8a] font-black flex items-center gap-2">
                                  <User className="w-3.5 h-3.5" /> {docItem.expertName || "ባለሙያ"}
                                </span>
                                <Badge variant="outline" className="text-[8px] font-black uppercase rounded-full bg-blue-50 text-blue-600">
                                  ዘርፍ፦ {docItem.sector}
                                </Badge>
                                {docItem.registryNumber && (
                                  <Badge className="text-[8px] font-black bg-slate-100 text-slate-600 border-none">ቁጥር፦ {docItem.registryNumber}</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <Button variant="outline" size="sm" onClick={() => handleOpenFile(docItem)} className="h-11 px-6 text-[10px] font-black rounded-xl border-slate-200 shadow-sm">
                              <Eye className="w-4 h-4 mr-2" /> ክፈት
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl">
                                  <MoreVertical className="w-5 h-5 text-slate-400" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-64 p-3 rounded-[2rem] shadow-2xl border-none">
                                <DropdownMenuLabel className="text-[9px] uppercase text-slate-400 px-4 py-3 font-black">የሥራ ሂደት አስተዳደር</DropdownMenuLabel>
                                
                                <DropdownMenuItem onClick={() => handleWorkflowAction(docItem, 'በኃላፊ የተፈረመ', 'ቢሮ ኃላፊ')} className="text-[11px] font-black cursor-pointer bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-2xl mb-2 p-4">
                                  <Stamp className="w-4 h-4 mr-2" /> ቢሮ ኃላፊ ይፈርሙ
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem onClick={() => handleWorkflowAction(docItem, 'በዳይሬክተር የጸደቀ', 'ዳይሬክተር')} className="text-[11px] font-black cursor-pointer bg-green-50 text-green-700 hover:bg-green-100 rounded-2xl mb-2 p-4">
                                  <CheckCircle className="w-4 h-4 mr-2" /> ዳይሬክተር ያጽድቁ
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDelete(docItem)} className="text-[11px] font-black cursor-pointer text-red-600 p-4">
                                  <Trash2 className="w-4 h-4 mr-2" /> ሰርዝ
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Signature Progress Area */}
                        <div className="bg-slate-50/50 rounded-3xl p-6 border border-dashed border-slate-200">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-4">የፊርማ ማረጋገጫ መስመር</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {['ባለሙያ', 'ቢሮ ኃላፊ', 'ዳይሬክተር', 'ቡድን መሪ'].map((role) => {
                              const sig = docItem.signatures?.find(s => s.role === role);
                              return (
                                <div key={role} className={`p-4 rounded-2xl border transition-all ${sig ? 'bg-white border-green-100 shadow-sm' : 'bg-slate-100/30 border-transparent opacity-40'}`}>
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-2 h-2 rounded-full ${sig ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                                    <p className="text-[8px] font-black text-slate-400 uppercase">{role}</p>
                                  </div>
                                  {sig ? (
                                    <div className="space-y-1">
                                      <p className="text-[10px] font-black text-green-700 flex items-center gap-1.5">
                                        <PenTool className="w-3 h-3" /> {sig.name}
                                      </p>
                                      <p className="text-[7px] font-bold text-slate-400">{sig.date}</p>
                                    </div>
                                  ) : (
                                    <p className="text-[9px] font-bold text-slate-300 italic">ፊርማ ይጠበቃል...</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
             <Card className="shadow-2xl border-none overflow-hidden rounded-[2.5rem] bg-white">
              <CardContent className="p-0">
                {logsLoading ? (
                  <div className="flex flex-col items-center justify-center py-40 gap-6">
                    <Loader2 className="w-12 h-12 animate-spin text-[#1e3a8a]/20" />
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {allLogs?.map((log: any) => (
                      <div key={log.id} className="p-6 hover:bg-slate-50 transition-all flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                            <History className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-slate-800">{log.userName} {log.details}</span>
                            <span className="text-[9px] font-bold text-[#1e3a8a] uppercase">{log.docName}</span>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <span className="text-[9px] font-bold text-slate-400">
                            {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString('et-ET') : "ቀን የለም"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  );
}
