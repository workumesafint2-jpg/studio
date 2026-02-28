'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function AdminPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">የአስተዳዳሪ መቆጣጠሪያ (Admin Dashboard) v3.0.5</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-600">እንኳን ደህና መጡ፣ ወርቁ! እዚህ ጋር ሁሉንም ፋይሎች እና ተጠቃሚዎች መቆጣጠር ይችላሉ።</p>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border p-4 rounded text-center">
            <h3 className="font-bold">ጠቅላላ ሰነዶች</h3>
            <p className="text-2xl text-blue-600">--</p>
          </div>
          <div className="border p-4 rounded text-center">
            <h3 className="font-bold">ንቁ ሰራተኞች</h3>
            <p className="text-2xl text-green-600">1</p>
          </div>
        </div>
        </div>
      </div>
);
}