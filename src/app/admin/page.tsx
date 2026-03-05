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
  ShieldAlert,
  Search,
  XCircle
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

  const isAdmin = user?.email === ADMIN_EMAIL;

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
    if (!db || !isAdmin) return;
    updateDocumentNonBlocking(doc(db, 'documents', id), { status: 'የጸደቀ' });
    toast({ title: "ጸድቋል", description: "ሰነዱ በትክክል ጸድቋል" });
  };

  const handleDelete = (id: string) => {
    if (!db || !isAdmin) return;
    deleteDocumentNonBlocking(doc(db, 'documents', id));
    toast({ title: "ተሰርዟል", description: "ሰነዱ ከመዝገብ ቤት ተወግዷል" });
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center p-10 bg-white rounded-3xl shadow-xl border border-red-100 max-w-md">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-black text-slate-900 mb-2 uppercase">Unauthorized Access</h1>
          <p className="text-sm text-slate-500 leading-relaxed">ይህ ገጽ ለዋናው አስተዳዳሪ ብቻ የተፈቀደ ነው። እባክዎን በ workumesafint2@gmail.com ይግቡ።</p>
          <div className="flex flex-col gap-3 mt-8">
            <Button asChild className="rounded-xl bg-[#1e3a8a] px-8 py-6 font-bold shadow-lg hover:bg-[#1e3a8a]/90">
              <Link href="/login">ወደ መግቢያ ገጽ (Login)</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
        <div className="flex items-center justify-between mb-8">
          <Button asChild variant="ghost" className="rounded-xl text-slate-500 hover:text-[#1e3a8a] hover:bg-blue-50">
            <Link href="/"><ArrowLeft className="w-4 h-4 mr-2" /> ወደ ዋናው ገጽ</Link>
          </Button>
          <header className="flex flex-col items-center gap-1">
            <h1 className="text-xs font-black text-slate-800 uppercase bg-white px-6 py-2 rounded-full shadow-sm border border-slate-100">
              የአስተዳዳሪ መቆጣጠሪያ ማዕከል (Admin Panel)
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">innovate.smart.app | Master Sync</p>
          </header>
          <div className="w-24" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="ጠቅላላ ሰነዶች" value={docsLoading ? "..." : stats.totalDocs.toString()} icon={<FileText className="w-5 h-5 text-blue-600" />} />
          <StatCard title="ንቁ ሰራተኞች" value={usersLoading ? "..." : stats.totalUsers.toString()} icon={<Users className="w-5 h-5 text-green-600" />} />
          <StatCard title="የሲስተም ሁኔታ" value={stats.status} icon={<Activity className="w-5 h-5 text-amber-600" />} />
          <StatCard title="ንቁ ሂደቶች" value={docsLoading ? "..." : stats.activeWorkflows.toString()} icon={<LayoutDashboard className="w-5 h-5 text-purple-600" />} />
        </div>

        <Card className="shadow-xl border-none overflow-hidden rounded-2xl bg-white">
          <CardHeader className="bg-white border-b border-slate-50 py-4 flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4" /> የቅርብ ጊዜ የተቋም እንቅስቃሴዎች (Master Stream)
            </CardTitle>
            <Badge className="bg-[#1e3a8a] text-[8px] font-black uppercase">Live Update</Badge>
          </CardHeader>
          <CardContent className="p-0">
            {docsLoading ? (
              <div className="flex justify-center py-24"><Activity className="w-8 h-8 animate-spin text-[#1e3a8a]/20" /></div>
            ) : !allDocs || allDocs.length === 0 ? (
              <div className="bg-white rounded-lg p-24 text-center border-2 border-dashed border-slate-100 m-6">
                <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.3em]">ምንም እንቅስቃሴ የለም</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {allDocs.map((docItem) => (
                  <div key={docItem.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-sm">
                        <FileText className="w-5 h-5 text-slate-400 group-hover:text-[#1e3a8a] transition-colors" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-black text-slate-900">{docItem.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-[#1e3a8a] font-black flex items-center gap-1">
                            <User className="w-3 h-3" /> {docItem.expertName || docItem.uploaderName || "ያልታወቀ"}
                          </span>
                          <span className="text-[8px] text-slate-200">•</span>
                          <span className="text-[9px] text-slate-500 font-bold flex items-center gap-1">
                            <Building2 className="w-3 h-3" /> {docItem.sector || "አጠቃላይ"}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={`text-[7px] border-none px-2 h-4 font-black uppercase ${docItem.status === 'የጸደቀ' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                        {docItem.status}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenFile(docItem.fileUrl)} className="h-9 px-3 text-[10px] font-black rounded-xl hover:bg-blue-50 text-blue-600 border border-blue-100">
                        <Eye className="w-3.5 h-3.5 mr-1.5" /> ክፈት
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-slate-100 rounded-xl">
                            <MoreVertical className="w-4 h-4 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-xl shadow-2xl">
                          <DropdownMenuLabel className="text-[9px] uppercase text-slate-400">የአስተዳዳሪ ተግባራት</DropdownMenuLabel>
                          {docItem.status !== 'የጸደቀ' && (
                            <DropdownMenuItem onClick={() => handleApprove(docItem.id)} className="text-[10px] font-black cursor-pointer bg-green-50 text-green-700 hover:bg-green-100 rounded-lg mb-1">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> አፅድቅ (Approve)
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem asChild className="text-[10px] font-black cursor-pointer rounded-lg">
                            <a href={docItem.fileUrl} download={docItem.fileName || "document"} className="flex items-center w-full">
                              <Download className="w-3.5 h-3.5 mr-2 text-[#1e3a8a]" /> አውርድ (Download)
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(docItem.id)} className="text-[10px] font-black cursor-pointer text-red-600 bg-red-50 hover:bg-red-100 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> ሰርዝ (Master Delete)
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
    <Card className="border-none shadow-md hover:shadow-xl transition-all bg-white overflow-hidden relative group rounded-2xl">
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{title}</p>
          <h3 className="text-xl font-black text-slate-900">{value}</h3>
        </div>
        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-[#1e3a8a]/5 transition-colors">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
