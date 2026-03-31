import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebaseConfig";
import { getDocs, collection, doc, updateDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { getUserUnit, getUserRole, isDirektur, isAdmin, isFullAccess, canApprove } from "@/lib/roleUtils";

export default function Home() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [dataUser, setDataUser] = useState([]);
    const [dataSurat, setDataSurat] = useState([]);
    const [loading, setLoading] = useState(true);
    const [approvalLoading, setApprovalLoading] = useState(null);

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) setUser(JSON.parse(userData));
    }, []);

    useEffect(() => {
        const qSurat = query(collection(db, "surat"), orderBy("createdAt", "desc"));
        const unsubSurat = onSnapshot(qSurat, (snapshot) => {
            const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            setDataSurat(data);
            setLoading(false);
        });

        const qUser = query(collection(db, "user"), orderBy("createdAt", "asc"));
        const unsubUser = onSnapshot(qUser, (snapshot) => {
            setDataUser(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        });

        return () => { unsubSurat(); unsubUser(); };
    }, []);

    const jabatan = user?.jabatan_user?.toLowerCase() || "";
    const unitKerja = user?.unit_kerja || "";
    const userUnit = getUserUnit(jabatan, unitKerja);
    const userRole = getUserRole(jabatan);
    const isDir = isDirektur(jabatan);
    const isAdm = isAdmin(jabatan);
    const hasFullAccess = isFullAccess(jabatan);
    const isApprover = user && canApprove(jabatan);

    // Filter surat relevant to user's unit (for stats & activity)
    // Direktur sees all, others see surat from their unit OR targeted to their unit
    const filteredSurat = dataSurat.filter((surat) => {
        if (hasFullAccess) return true;
        if (!userUnit) return false;
        const suratUnit = surat.unit?.toLowerCase() || "";
        const tujuanUnit = surat.tujuan_unit?.toLowerCase() || "";
        return suratUnit === userUnit || tujuanUnit === userUnit;
    });

    // Filter surat that need approval from this user
    const pendingSurat = dataSurat.filter((surat) => {
        if (!isApprover) return false;

        // Status belum approved
        if (surat.status_approval === "approved" || surat.status_approval === "rejected") return false;

        // Jika sudah ditandatangani oleh user, tidak perlu tampil di persetujuan lagi
        if (surat.id_kabag === user.id && surat.ttd_kabag) return false;
        if (surat.id_dokter === user.id && surat.ttd_dokter) return false;

        // HANYA user yang spesifik tercantum namanya (id_kabag atau id_dokter) yang berhak approve
        // Hal ini meniadakan hak approve otomatis Direktur pada seluruh surat yang tidak di-assign padanya,
        // dan menghindari Kabag bisa approve surat yang tak menyebutkan namanya.
        if (surat.id_kabag === user.id) return true;
        if (surat.id_dokter === user.id) return true;

        return false;
    });

    const handleApproval = async (suratId, status) => {
        setApprovalLoading(suratId);
        try {
            let nextStatus = status;
            const updateData = {};
            const surat = dataSurat.find(s => s.id === suratId);

            if (status === "approved" && user.ttd_user && surat) {
                let hasSignedAsKabag = false;
                let hasSignedAsDokter = false;

                // Terapkan TTD berdasarkan id
                if (surat.id_kabag === user.id) {
                    updateData.ttd_kabag = user.ttd_user;
                    hasSignedAsKabag = true;
                }
                if (surat.id_dokter === user.id || (jabatan.includes("direktur") && !surat.id_dokter)) {
                    updateData.ttd_dokter = user.ttd_user;
                    hasSignedAsDokter = true;
                } else if (jabatan.includes("direktur") && surat.id_dokter === user.id) {
                    updateData.ttd_dokter = user.ttd_user;
                    hasSignedAsDokter = true;
                }

                // Status menjadi "approved" HANYA jika semua yang dibutuhkan sudah ttd
                const needsKabag = !!surat.id_kabag;
                const needsDokter = !!surat.id_dokter;
                const kabagDone = !needsKabag || hasSignedAsKabag || !!surat.ttd_kabag;
                const dokterDone = !needsDokter || hasSignedAsDokter || !!surat.ttd_dokter;

                if (kabagDone && dokterDone) {
                    nextStatus = "approved";
                } else {
                    nextStatus = "pending";
                }
            }

            updateData.status_approval = nextStatus;
            
            // Perbarui history approved_by
            if (status === "approved") {
                const existing = surat?.approved_by || "";
                updateData.approved_by = existing ? `${existing}, ${user.nama_user}` : user.nama_user;
            } else {
                updateData.approved_by = user.nama_user;
            }
            updateData.approval_date = new Date().toISOString();

            await updateDoc(doc(db, "surat", suratId), updateData);
        } catch (err) {
            console.error("Error:", err);
        }
        setApprovalLoading(null);
    };

    const stats = [
        {
            label: "Total Surat",
            value: filteredSurat.length,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            color: "from-blue-500 to-blue-600",
            shadow: "shadow-blue-500/20",
        },
        {
            label: "Pengguna",
            value: dataUser.length,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            color: "from-emerald-500 to-emerald-600",
            shadow: "shadow-emerald-500/20",
        },
        {
            label: "Menunggu Approval",
            value: filteredSurat.filter(s => !s.status_approval || s.status_approval === "pending").length,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: "from-amber-500 to-orange-500",
            shadow: "shadow-amber-500/20",
        },
        {
            label: "Disetujui",
            value: filteredSurat.filter(s => s.status_approval === "approved").length,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: "from-primary to-emerald-500",
            shadow: "shadow-primary/20",
        },
    ];

    const getNamaUser = (id) => {
        const u = dataUser.find((u) => u.id === id);
        return u ? u.nama_user : "-";
    };

    return (
        <Layout>
            {/* Unit indicator for non-direktur */}
            {!hasFullAccess && userUnit && (
                <div className="mb-4 px-4 py-2.5 bg-gradient-to-r from-primary/5 to-emerald-50 border border-primary/10 rounded-xl text-sm text-gray-600">
                    📊 Menampilkan data untuk unit: <span className="font-semibold text-primary capitalize">{userUnit}</span>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {stats.map((stat, i) => (
                    <div key={i} className={`bg-gradient-to-br ${stat.color} rounded-2xl p-5 text-white shadow-xl ${stat.shadow} hover:scale-[1.02] transition-transform`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/70 text-sm font-medium">{stat.label}</p>
                                <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                {stat.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Approval Section (for Direktur/Kabag/Dokter) */}
            {isApprover && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Surat Menunggu Persetujuan</h3>
                                <p className="text-sm text-gray-500">Surat yang memerlukan approval Anda</p>
                            </div>
                            {pendingSurat.length > 0 && (
                                <span className="ml-auto bg-amber-100 text-amber-700 text-sm font-bold px-3 py-1 rounded-full">
                                    {pendingSurat.length}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="p-6">
                        {pendingSurat.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="font-medium">Tidak ada surat yang menunggu persetujuan</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pendingSurat.map((surat) => (
                                    <div key={surat.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                                                    {(surat.id_kabag && !surat.ttd_kabag && surat.id_dokter && !surat.ttd_dokter) ? "Pending (Kabag & Dir)" :
                                                     (surat.id_kabag && !surat.ttd_kabag) ? "Pending (Kabag)" :
                                                     (surat.id_dokter && !surat.ttd_dokter) ? "Pending (Dokter)" : "Pending"}
                                                </span>
                                                <span className="text-xs text-gray-400">{surat.no_surat || "No surat belum ada"}</span>
                                                {surat.tujuan_unit && (
                                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 capitalize">
                                                        → {surat.tujuan_unit}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm font-semibold text-gray-700">
                                                {surat.ket === "SKBN" ? "Surat Keterangan Bebas Narkoba" : surat.ket === "SPY" ? "Surat Permohonan" : surat.perihal_surat || surat.ket || "Surat"}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {surat.nama_pasien || surat.nama_kedua || "-"} · {surat.tanggal_surat || "-"} · Dari: {surat.unit || "-"}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 ml-4">
                                            <Link href={{ 
                                                pathname: surat.ket === "SKBN" ? `/laboratorium/surat-keterangan-bebas-narkoba` : 
                                                          surat.ket === "SPY" ? `/yanmas/surat-permohonan` : 
                                                          surat.ket === "SU" ? `/surat-umum` : `/surat-dinamis`, 
                                                query: { id: surat.id } 
                                            }}>
                                                <button className="px-3 py-2 bg-amber-50 text-amber-600 font-medium rounded-lg hover:bg-amber-100 transition-colors text-sm flex items-center gap-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    Lihat
                                                </button>
                                            </Link>
                                            <button
                                                onClick={() => handleApproval(surat.id, "approved")}
                                                disabled={approvalLoading === surat.id}
                                                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                                            >
                                                {approvalLoading === surat.id ? "..." : "✓ Approve"}
                                            </button>
                                            <button
                                                onClick={() => handleApproval(surat.id, "rejected")}
                                                disabled={approvalLoading === surat.id}
                                                className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                                            >
                                                ✕ Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Aksi Cepat</h3>
                    <div className="space-y-2">
                        <Link href="/arsip2">
                            <div className="flex items-center mb-3 gap-3 p-3 rounded-xl bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors group">
                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">Buat Surat Baru</p>
                                    <p className="text-xs text-gray-400">Pilih unit dan jenis surat</p>
                                </div>
                            </div>
                        </Link>
                        {isAdm && (
                            <Link href="/akun-user">
                                <div className="flex items-center mb-3 gap-3 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors group">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">Kelola User</p>
                                        <p className="text-xs text-gray-400">Tambah atau edit pengguna</p>
                                    </div>
                                </div>
                            </Link>
                        )}
                        <Link href="/arsip2">
                            <div className="flex items-center mb-3 gap-3 p-3 rounded-xl bg-purple-50 hover:bg-purple-100 cursor-pointer transition-colors group">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">Arsip Surat</p>
                                    <p className="text-xs text-gray-400">Lihat semua arsip surat</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Recent Activity - filtered by unit */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Aktivitas Terbaru</h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {filteredSurat.slice(0, 10).map((surat, i) => (
                            <div key={surat.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                    surat.status_approval === "approved" ? "bg-green-500" :
                                    surat.status_approval === "rejected" ? "bg-red-500" : "bg-amber-500"
                                }`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-700 truncate">
                                        {surat.perusahaan_kedua || surat.nama_pasien || surat.perihal_surat || surat.ket || "Surat"}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        No: {surat.no_surat || "-"} · {surat.tanggal_surat || "-"}
                                        {surat.tujuan_unit && <span className="ml-1">· → {surat.tujuan_unit}</span>}
                                    </p>
                                </div>
                                <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${
                                    surat.status_approval === "approved" ? "bg-green-100 text-green-700" :
                                    surat.status_approval === "rejected" ? "bg-red-100 text-red-700" :
                                    "bg-gray-100 text-gray-500"
                                }`}>
                                    {surat.status_approval === "approved" ? "Disetujui" :
                                     surat.status_approval === "rejected" ? "Ditolak" : 
                                     (surat.id_kabag && !surat.ttd_kabag && surat.id_dokter && !surat.ttd_dokter) ? "Pending (Kabag & Dir)" :
                                     (surat.id_kabag && !surat.ttd_kabag) ? "Pending (Kabag)" :
                                     (surat.id_dokter && !surat.ttd_dokter) ? "Pending (Dokter)" : "Pending"}
                                </span>
                            </div>
                        ))}
                        {filteredSurat.length === 0 && (
                            <p className="text-center text-gray-400 py-8">Belum ada aktivitas</p>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}