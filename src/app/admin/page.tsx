
'use client';

import { useMemo } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Activity, 
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
  ShieldCheck
} from 'lucide-react';
import { 
  useCollection, 
  useFirestore, 
  useMemoFirebase,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  useUser
} from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
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

/**
 * Master Admin Email Configuration
 * v4.3.8 - Relaxed Access for All Logged-in Users
 */
const ADMIN_EMAIL = "workumesafint2@gmail.com";

interface DocumentRecord {
  id: string;
  name: string;
  category: string;
  status: string;
  uploadDate: string;
  fileUrl: string;
  uploaderId: string;
  uploaderName?: string;
  sector?: string;
  expertName?: string;
  createdAt?: any;
  fileName?: string;
}

export default function AdminPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();

  // For now, allow any logged in user to see the dashboard to help debug
  const isAuthorized = !!user;
  const isMasterAdmin = user?.email === ADMIN_EMAIL;

  const docsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'documents'), orderBy('createdAt', 'desc'));
  }, [db]);

  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'users'));
  }, [db]);

  const { data: allDocs, isLoading: docsLoading } = useCollection<DocumentRecord>(docsQuery);
  const { data: allUsers, isLoading: usersLoading } = useCollection<any>(usersQuery);

  const stats = useMemo(() => ({
    totalDocs: allDocs?.length || 0,
    totalUsers: allUsers?.length || 0,
    status: "Active",
    activeWorkflows: allDocs?.filter(d => d.status !== 'የጸደቀ').length || 0
  }), [allDocs, allUsers]);

  const handleOpenFile = (url: string) => {
    if (!url) return;
    const win = window.open();
    if (win) {
      if (url.startsWith('data:')) {
        win.document.write(`<iframe src="${url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
      } else {
        win.location.href = url;
      }
    }
  };

  const handleApprove = (id: string) => {
    if (!db) return;
    updateDocumentNonBlocking(doc(db, 'documents', id), { status: 'የጸደቀ' });
    toast({ title: "ጸድቋል", description: "ሰነዱ በትክክል ጸድቋል" });
  };

  const handleDelete = (id: string, uploaderId: string) => {
    if (!db) return;
    // Only master admin or owner can delete
    if (isMasterAdmin || user?.uid === uploaderId) {
      deleteDocumentNonBlocking(doc(db, 'documents', id));
      toast({ title: "ተሰርዟል", description: "ሰነዱ ከመዝገብ ቤት ተወግዷል" });
    } else {
      toast({ title: "ስልጣን የለዎትም", description: "የራስዎን ፋይል ብቻ ነው ማጥፋት የሚችሉት", variant: "destructive" });
    }
  };

  return (
    <AuthGuard>
      <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
        <div className="flex items-center justify-between mb-8">
          <Button asChild variant="ghost" className="rounded-xl text-slate-500 hover:text-[#1e3a8a] hover:bg-blue-50 font-black text-[10px] uppercase">
            <Link href="/"><ArrowLeft className="w-4 h-4 mr-2" /> ወደ ዋናው ገጽ</Link>
          </Button>
          <header className="flex flex-col items-center gap-1">
            <h1 className="text-xs font-black text-slate-800 uppercase bg-white px-8 py-3 rounded-full shadow-sm border border-slate-100 tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-500" /> የቢሮ መቆጣጠሪያ ማዕከል (DASHBOARD)
            </h1>
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] mt-1">Innovation & Technology Bureau | Live Portal</p>
          </header>
          <div className="w-32 h-10 bg-white/50 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="ጠቅላላ ሰነዶች" value={docsLoading ? "..." : stats.totalDocs.toString()} icon={<FileText className="w-5 h-5 text-blue-600" />} />
          <StatCard title="ንቁ ሰራተኞች" value={usersLoading ? "..." : stats.totalUsers.toString()} icon={<Users className="w-5 h-5 text-green-600" />} />
          <StatCard title="የሲስተም ሁኔታ" value={stats.status} icon={<Activity className="w-5 h-5 text-amber-600" />} />
          <StatCard title="ንቁ ሂደቶች" value={docsLoading ? "..." : stats.activeWorkflows.toString()} icon={<LayoutDashboard className="w-5 h-5 text-purple-600" />} />
        </div>

        <Card className="shadow-2xl border-none overflow-hidden rounded-[2rem] bg-white">
          <CardHeader className="bg-white border-b border-slate-50 py-6 px-8 flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4" /> የቅርብ ጊዜ የተቋም እንቅስቃሴዎች (Master Stream)
            </CardTitle>
            <Badge className="bg-[#1e3a8a] text-[8px] font-black uppercase px-3 py-1 rounded-full">Live Monitor</Badge>
          </CardHeader>
          <CardContent className="p-0">
            {docsLoading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-[#1e3a8a]/20" />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">መረጃዎችን በመጫን ላይ...</p>
              </div>
            ) : !allDocs || allDocs.length === 0 ? (
              <div className="bg-white p-32 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.3em]">ምንም እንቅስቃሴ አልተመዘገበም</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {allDocs.map((docItem) => (
                  <div key={docItem.id} className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-all group border-l-4 border-l-transparent hover:border-l-[#1e3a8a]">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6 text-slate-400 group-hover:text-[#1e3a8a] transition-colors" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-black text-slate-900">{docItem.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-[#1e3a8a] font-black flex items-center gap-1.5 bg-blue-50 px-2 py-0.5 rounded-md">
                            <User className="w-3 h-3" /> {docItem.expertName || docItem.uploaderName || "ያልታወቀ"}
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5">
                            <Building2 className="w-3 h-3 text-slate-300" /> {docItem.sector || "አጠቃላይ"}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className={`text-[8px] border-none px-3 h-6 flex items-center font-black uppercase rounded-full ${docItem.status === 'የጸደቀ' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                        {docItem.status}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenFile(docItem.fileUrl)} className="h-10 px-4 text-[10px] font-black rounded-xl hover:bg-[#1e3a8a] hover:text-white transition-all border-slate-200">
                          <Eye className="w-4 h-4 mr-2" /> ክፈት
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-slate-100 rounded-xl">
                              <MoreVertical className="w-5 h-5 text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-60 p-2 rounded-2xl shadow-2xl border-none">
                            <DropdownMenuLabel className="text-[9px] uppercase text-slate-400 px-3 py-2">ተግባራት</DropdownMenuLabel>
                            {docItem.status !== 'የጸደቀ' && (
                              <DropdownMenuItem onClick={() => handleApprove(docItem.id)} className="text-[11px] font-black cursor-pointer bg-green-50 text-green-700 hover:bg-green-100 rounded-xl mb-1 p-3">
                                <CheckCircle2 className="w-4 h-4 mr-2" /> አፅድቅ (Approve)
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem asChild className="text-[11px] font-black cursor-pointer rounded-xl p-3">
                              <a href={docItem.fileUrl} download={docItem.fileName || "document"} className="flex items-center w-full">
                                <Download className="w-4 h-4 mr-2 text-[#1e3a8a]" /> አውርድ (Download)
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-2" />
                            {(isMasterAdmin || user?.uid === docItem.uploaderId) && (
                              <DropdownMenuItem onClick={() => handleDelete(docItem.id, docItem.uploaderId)} className="text-[11px] font-black cursor-pointer text-red-600 bg-red-50 hover:bg-red-100 rounded-xl p-3">
                                <Trash2 className="w-4 h-4 mr-2" /> ሰርዝ (Delete)
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <Card className="border-none shadow-lg hover:shadow-2xl transition-all bg-white overflow-hidden relative group rounded-[1.5rem]">
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
          <h3 className="text-2xl font-black text-slate-900">{value}</h3>
        </div>
        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-[#1e3a8a]/5 group-hover:scale-110 transition-all">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
