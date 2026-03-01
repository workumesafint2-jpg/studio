'use client';

import { AuthGuard } from '@/components/auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, FileText, Users, Activity } from 'lucide-react';

export default function AdminPage() {
  return (
    <AuthGuard>
      <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
        <header className="flex flex-col gap-2">
          <p className="text-[10px] font-bold text-primary tracking-widest uppercase">ITDB Management Dashboard</p>
          <h1 className="text-3xl font-black text-slate-900 uppercase">የአስተዳዳሪ መቆጣጠሪያ v3.0.8</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="ጠቅላላ ሰነዶች" value="--" icon={<FileText className="w-5 h-5 text-blue-600" />} />
          <StatCard title="ንቁ ሰራተኞች" value="1" icon={<Users className="w-5 h-5 text-green-600" />} />
          <StatCard title="የሲስተም ሁኔታ" value="Stable" icon={<Activity className="w-5 h-5 text-amber-600" />} />
          <StatCard title="አጠቃላይ ስራዎች" value="Active" icon={<LayoutDashboard className="w-5 h-5 text-purple-600" />} />
        </div>

        <Card className="shadow-xl border-none">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">የቅርብ ጊዜ እንቅስቃሴዎች</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-white rounded-lg p-12 text-center border-2 border-dashed border-slate-100">
              <p className="text-slate-300 text-[10px] font-bold uppercase tracking-[0.3em]">እንኳን ደህና መጡ፣ ወርቁ! መረጃዎች በመሰብሰብ ላይ ናቸው።</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
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