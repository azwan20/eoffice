import Link from "next/link";
import { db } from "@/lib/firebaseConfig";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { getUserUnit, isFullAccess, isDirektur } from "@/lib/roleUtils";

export default function Arsip2() {
    const [suratCounts, setSuratCounts] = useState({});
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) setUser(JSON.parse(userData));
    }, []);

    const allUnits = [
        { nama: "Umum", color: "from-amber-400 to-orange-500", icon: "📋" },
        { nama: "Yanmas", color: "from-blue-400 to-blue-600", icon: "🏥" },
        { nama: "Keuangan", color: "from-rose-400 to-red-500", icon: "💰" },
        { nama: "Pelayanan Medik", color: "from-emerald-400 to-green-600", icon: "🩺" },
        { nama: "Penunjang Medik", color: "from-orange-400 to-amber-600", icon: "🔬" },
        { nama: "Keperawatan", color: "from-pink-400 to-rose-600", icon: "💊" },
        { nama: "Laboratorium", color: "from-cyan-400 to-blue-500", icon: "🧪" },
    ];

    // Filter units based on role: fullAccess (direktur+admin) sees all, others see only their unit
    const jabatan = user?.jabatan_user || "";
    const unitKerja = user?.unit_kerja || "";
    const userUnit = getUserUnit(jabatan);
    const hasFullAccess = isFullAccess(jabatan);
    const isDir = isDirektur(jabatan);

    const namaUnit = hasFullAccess
        ? allUnits
        : allUnits.filter(u => u.nama.toLowerCase() === userUnit);

    useEffect(() => {
        // For each unit, listen to surat created by the unit AND surat targeted to the unit
        const unsubs = [];
        allUnits.forEach(unit => {
            const unitLower = unit.nama.toLowerCase();
            const qByUnit = query(collection(db, "surat"), where("unit", "==", unitLower));
            const qByTujuan = query(collection(db, "surat"), where("tujuan_unit", "==", unitLower));

            let byUnit = [];
            let byTujuan = [];

            const mergeAndSet = () => {
                const merged = new Map();
                [...byUnit, ...byTujuan].forEach(s => merged.set(s.id, s));
                const data = Array.from(merged.values());
                setSuratCounts(prev => ({
                    ...prev,
                    [unit.nama]: {
                        total: data.length,
                        approved: data.filter(s => s.status_approval === "approved").length,
                        pending: data.filter(s => !s.status_approval || s.status_approval === "pending").length,
                    }
                }));
            };

            unsubs.push(onSnapshot(qByUnit, (snapshot) => {
                byUnit = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                mergeAndSet();
            }));
            unsubs.push(onSnapshot(qByTujuan, (snapshot) => {
                byTujuan = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                mergeAndSet();
            }));
        });
        return () => unsubs.forEach(u => u());
    }, []);

    return (
        <Layout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Pengelolaan Surat</h1>
                <p className="text-sm text-gray-500 mt-1">
                    {isDir ? "Pilih unit untuk melihat atau membuat surat" : `Unit: ${userUnit ? userUnit.charAt(0).toUpperCase() + userUnit.slice(1) : "-"}`}
                </p>
            </div>

            {namaUnit.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <p className="text-gray-400 font-medium">Anda tidak memiliki akses ke unit manapun.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {namaUnit.map((unit, index) => {
                        const counts = suratCounts[unit.nama] || { total: 0, approved: 0, pending: 0 };
                        return (
                            <Link key={index} href={`/detail-arsip/${unit.nama}`} className="group">
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                    {/* Header */}
                                    <div className={`bg-gradient-to-r ${unit.color} p-5`}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-3xl">{unit.icon}</span>
                                                <h3 className="text-white font-bold text-lg mt-2">{unit.nama}</h3>
                                            </div>
                                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Stats */}
                                    <div className="p-5 space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">Jumlah Surat</span>
                                            <span className="text-sm font-bold text-gray-800">{counts.total}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">Menunggu Approval</span>
                                            <span className="text-sm font-semibold text-amber-600">{counts.pending}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">Disetujui</span>
                                            <span className="text-sm font-semibold text-green-600">{counts.approved}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </Layout>
    );
}