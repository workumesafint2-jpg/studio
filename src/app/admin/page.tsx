'use client';

import { useMemo } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, FileText, Users, Activity, Clock, CheckCircle2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';

interface DocumentRecord {
  id: string;
  name: string;
  category: string;
  status: string;
  uploadDate: string;
  createdAt?: any;
}

interface UserRecord {
  id: string;
  role: string;
}

export default function AdminPage() {
  const db = useFirestore();

  // Query for all documents to calculate total count
  const docsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'documents'), orderBy('createdAt', 'desc'));
  }, [db]);

  // Query for recent activities (last 5)
  const recentQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'documents'), orderBy('createdAt', 'desc'), limit(5));
  }, [db]);

  // Query for users to count staff
  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'users'));
  }, [db]);

  const { data: allDocs, isLoading: docsLoading } = useCollection<DocumentRecord>(docsQuery);
  const { data: recentDocs, isLoading: recentLoading } = useCollection<DocumentRecord>(recentQuery);
  const { data: allUsers, isLoading: usersLoading } = useCollection<UserRecord>(usersQuery);

  const stats = useMemo(() => ({
    totalDocs: allDocs?.length || 0,
    totalUsers: allUsers?.length || 0,
    status: "Stable",
    activeWorkflows: allDocs?.filter(d => d.status !== 'የጸደቀ').length || 0
  }), [allDocs, allUsers]);

  return (
    <AuthGuard>
      <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
        <header className="flex flex-col gap-2">
          <p className="text-[10px] font-bold text-primary tracking-widest uppercase">ITDB Management Dashboard</p>
          <h1 className="text-3xl font-black text-slate-900 uppercase">የአስተዳዳሪ መቆጣጠሪያ v3.1.2</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="ጠቅላላ ሰነዶች" 
            value={docsLoading ? "..." : stats.totalDocs.toString()} 
            icon={<FileText className="w-5 h-5 text-blue-600" />} 
          />
          <StatCard 
            title="ንቁ ሰራተኞች" 
            value={usersLoading ? "..." : stats.totalUsers.toString()} 
            icon={<Users className="w-5 h-5 text-green-600" />} 
          />
          <StatCard 
            title="የሲስተም ሁኔታ" 
            value={stats.status} 
            icon={<Activity className="w-5 h-5 text-amber-600" />} 
          />
          <StatCard 
            title="ንቁ ሂደቶች" 
            value={docsLoading ? "..." : stats.activeWorkflows.toString()} 
            icon={<LayoutDashboard className="w-5 h-5 text-purple-600" />} 
          />
        </div>

        <Card className="shadow-xl border-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4" /> የቅርብ ጊዜ እንቅስቃሴዎች
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {recentLoading ? (
              <div className="flex justify-center py-12">
                <Activity className="w-6 h-6 animate-spin text-slate-200" />
              </div>
            ) : !recentDocs || recentDocs.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center border-2 border-dashed border-slate-100">
                <p className="text-slate-300 text-[10px] font-bold uppercase tracking-[0.3em]">እንኳን ደህና መጡ! ምንም እንቅስቃሴ አልተመዘገበም።</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:shadow-md transition-shadow group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                        <FileText className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900">{doc.name}</span>
                        <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">{doc.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right flex flex-col items-end">
                        <Badge variant="outline" className={`text-[8px] border-none h-4 px-2 ${doc.status === 'የጸደቀ' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                          {doc.status === 'የጸደቀ' && <CheckCircle2 className="w-2.5 h-2.5 mr-1" />}
                          {doc.status}
                        </Badge>
                        <span className="text-[8px] text-slate-400 mt-1 italic">
                          {doc.uploadDate ? new Date(doc.uploadDate).toLocaleString('am-ET') : '--'}
                        </span>
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
    <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-white">
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
          <h3 className="text-2xl font-black text-slate-900">{value}</h3>
        </div>
        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
