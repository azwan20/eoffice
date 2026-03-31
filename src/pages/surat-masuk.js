import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebaseConfig";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import Layout from "@/components/Layout";
import { getUserUnit, isDirektur } from "@/lib/roleUtils";

// Global lookup for surat names by ket code
const ALL_SURAT_TYPES = {
    SKBN: { nama: "Surat Keterangan Bebas Narkoba", unitAsal: "laboratorium" },
    SPY: { nama: "Surat Permohonan", unitAsal: "yanmas" },
    SU: { nama: "Surat Umum / Custom", unitAsal: "" },
};

export default function SuratMasuk() {
    const [user, setUser] = useState(null);
    const [dataUser, setDataUser] = useState([]);
    const [suratMasuk, setSuratMasuk] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("all");

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) setUser(JSON.parse(userData));
        
        // Load all users to accurately resolve cross-unit approvers
        const qUser = query(collection(db, "user"));
        const unsubUser = onSnapshot(qUser, (snapshot) => {
            setDataUser(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsubUser();
    }, []);

    const jabatan = user?.jabatan_user || "";
    const unitKerja = user?.unit_kerja || "";
    const userUnit = getUserUnit(jabatan, unitKerja);
    const isDir = isDirektur(jabatan);

    useEffect(() => {
        if (!user) return;

        const q = query(collection(db, "surat"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snapshot) => {
            const allSurat = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            
            if (isDir) {
                // Direktur: lihat semua surat yang melintas unit (baik tujuan logis maupun eksplisit)
                const result = allSurat.filter(s => {
                    if (s.tujuan_unit && s.tujuan_unit !== s.unit) return true;
                    // Cek unit penanda tangan (Dokter/Kabag)
                    const dokterUser = dataUser.find(u => u.id === s.id_dokter);
                    const kabagUser = dataUser.find(u => u.id === s.id_kabag);
                    const unitDokter = dokterUser ? getUserUnit(dokterUser.jabatan_user, dokterUser.unit_kerja) : null;
                    const unitKabag = kabagUser ? getUserUnit(kabagUser.jabatan_user, kabagUser.unit_kerja) : null;
                    
                    if (unitDokter && unitDokter !== s.unit) return true;
                    if (unitKabag && unitKabag !== s.unit) return true;
                    return false;
                });
                setSuratMasuk(result);
            } else if (userUnit) {
                // Unit biasa: lihat surat yang menuju ke unit ini ATAU butuh ttd dari user di unit ini
                const result = allSurat.filter(s => {
                    // Surat HARUS dibuat oleh unit lain
                    if (!s.unit || s.unit.toLowerCase() === userUnit) return false;
                    
                    // Lolos jika secara eksplisit ditujukan ke unit ini via form
                    if (s.tujuan_unit?.toLowerCase() === userUnit) return true;
                    
                    // Lolos jika butuh tanda tangan dari pejabat di unit ini (lintas-unit dinamis)
                    const dokterUser = dataUser.find(u => u.id === s.id_dokter);
                    const kabagUser = dataUser.find(u => u.id === s.id_kabag);
                    const unitDokter = dokterUser ? getUserUnit(dokterUser.jabatan_user, dokterUser.unit_kerja) : null;
                    const unitKabag = kabagUser ? getUserUnit(kabagUser.jabatan_user, kabagUser.unit_kerja) : null;
                    
                    if (unitDokter === userUnit || unitKabag === userUnit) return true;
                    
                    return false;
                });
                setSuratMasuk(result);
            } else {
                setLoading(false);
            }
            if (dataUser.length > 0) setLoading(false);
        });

        return () => unsub();
    }, [user, userUnit, isDir, dataUser]);

    const filteredSurat = suratMasuk.filter(s => {
        if (filterStatus === "all") return true;
        if (filterStatus === "pending") return !s.status_approval || s.status_approval === "pending";
        return s.status_approval === filterStatus;
    });

    const getSuratName = (surat) => {
        const type = ALL_SURAT_TYPES[surat.ket];
        if (type) return type.nama;
        return surat.perihal_surat || surat.ket || "Surat";
    };

    const getTimeAgo = (timestamp) => {
        if (!timestamp) return "-";
        let date;
        if (timestamp?.toDate) date = timestamp.toDate();
        else if (timestamp?.seconds) date = new Date(timestamp.seconds * 1000);
        else date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffMins < 1) return "Baru saja";
        if (diffMins < 60) return `${diffMins} menit lalu`;
        if (diffHours < 24) return `${diffHours} jam lalu`;
        if (diffDays < 7) return `${diffDays} hari lalu`;
        return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    };

    const statusCounts = {
        all: suratMasuk.length,
        pending: suratMasuk.filter(s => !s.status_approval || s.status_approval === "pending").length,
        approved: suratMasuk.filter(s => s.status_approval === "approved").length,
        rejected: suratMasuk.filter(s => s.status_approval === "rejected").length,
    };

    return (
        <Layout>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Surat Masuk</h1>
                <p className="text-sm text-gray-500 mt-1">
                    {isDir
                        ? "Semua surat antar-unit dalam sistem"
                        : userUnit
                            ? <>Surat yang ditujukan ke unit <span className="font-semibold text-primary capitalize">{userUnit}</span> dari unit lain</>
                            : "Tidak ada unit terkait"
                    }
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                    { key: "all", label: "Semua", color: "from-blue-500 to-blue-600", shadow: "shadow-blue-500/20" },
                    { key: "pending", label: "Pending", color: "from-amber-500 to-orange-500", shadow: "shadow-amber-500/20" },
                    { key: "approved", label: "Disetujui", color: "from-emerald-500 to-green-500", shadow: "shadow-emerald-500/20" },
                    { key: "rejected", label: "Ditolak", color: "from-red-500 to-rose-500", shadow: "shadow-red-500/20" },
                ].map(s => (
                    <button key={s.key} onClick={() => setFilterStatus(s.key)}
                        className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white shadow-xl ${s.shadow} hover:scale-[1.02] transition-transform text-left ${filterStatus === s.key ? 'ring-2 ring-white/50 ring-offset-2' : ''}`}>
                        <p className="text-white/70 text-xs font-medium">{s.label}</p>
                        <h3 className="text-2xl font-bold mt-0.5">{statusCounts[s.key]}</h3>
                    </button>
                ))}
            </div>

            {/* Surat List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="skeleton-card" />)}
                </div>
            ) : filteredSurat.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <p className="text-gray-400 font-medium">
                        {filterStatus === "all" ? "Tidak ada surat masuk" : `Tidak ada surat dengan status "${filterStatus}"`}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredSurat.map((surat) => {
                        const suratOriginUnit = surat.unit || "";

                        return (
                            <div key={surat.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        {/* Badges */}
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                                surat.status_approval === "approved" ? "bg-green-100 text-green-700" :
                                                surat.status_approval === "rejected" ? "bg-red-100 text-red-700" :
                                                "bg-amber-100 text-amber-700"
                                            }`}>
                                                {surat.status_approval === "approved" ? "Disetujui" :
                                                 surat.status_approval === "rejected" ? "Ditolak" : 
                                                 (surat.id_kabag && !surat.ttd_kabag && surat.id_dokter && !surat.ttd_dokter) ? "Pending (Kabag & Dir)" :
                                                 (surat.id_kabag && !surat.ttd_kabag) ? "Pending (Kabag)" :
                                                 (surat.id_dokter && !surat.ttd_dokter) ? "Pending (Dir)" : "Pending"}
                                            </span>
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 capitalize flex items-center gap-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                Dari: {suratOriginUnit}
                                            </span>
                                            {isDir && surat.tujuan_unit && (
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 capitalize">
                                                    → {surat.tujuan_unit}
                                                </span>
                                            )}
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-base font-bold text-gray-800">{getSuratName(surat)}</h3>

                                        {/* Details */}
                                        <div className="mt-2 space-y-0.5">
                                            <p className="text-sm text-gray-500">
                                                No Surat: <span className="text-gray-700">{surat.no_surat || "-"}</span>
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Tanggal: <span className="text-gray-700">{surat.tanggal_surat || "-"}</span>
                                            </p>
                                            {surat.perihal_surat && (
                                                <p className="text-sm text-gray-500">
                                                    Perihal: <span className="text-gray-700">{surat.perihal_surat}</span>
                                                </p>
                                            )}
                                            {surat.nama_pasien && (
                                                <p className="text-sm text-gray-500">
                                                    Pasien: <span className="text-gray-700">{surat.nama_pasien}</span>
                                                </p>
                                            )}
                                        </div>

                                        {/* Time */}
                                        <p className="text-xs text-gray-300 mt-2">{getTimeAgo(surat.createdAt)}</p>
                                    </div>

                                    {/* View button */}
                                    <div className="flex sm:flex-col gap-2 flex-shrink-0">
                                        <Link href={{ 
                                            pathname: surat.ket === "SKBN" ? `/laboratorium/surat-keterangan-bebas-narkoba` : 
                                                      surat.ket === "SPY" ? `/yanmas/surat-permohonan` : 
                                                      surat.ket === "SU" ? `/surat-umum` : `/surat-dinamis`, 
                                            query: { id: surat.id } 
                                        }}>
                                            <button className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-colors text-sm font-medium flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                Lihat
                                            </button>
                                        </Link>
                                        <Link href={`/detail-arsip/${suratOriginUnit.charAt(0).toUpperCase() + suratOriginUnit.slice(1)}`}>
                                            <button className="px-4 py-2 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 transition-colors text-sm font-medium">
                                                Detail Unit
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </Layout>
    );
}
