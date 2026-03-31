import { useRouter } from "next/router";
import Link from "next/link";
import { db } from "@/lib/firebaseConfig";
import React, { useEffect, useState } from "react";
import { getDocs, getDoc, collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, Timestamp, orderBy, query, where, onSnapshot } from "firebase/firestore";
import Layout from "@/components/Layout";
import { getUserUnit, isDirektur, isFullAccess, canCRUD } from "@/lib/roleUtils";

// Global surat type lookup across ALL units
const ALL_SURAT_TYPES = {
    SKBN: { nama: "Surat Keterangan Bebas Narkoba", path: "surat-keterangan-bebas-narkoba", unitPath: "laboratorium" },
    SPY: { nama: "Surat Permohonan", path: "surat-permohonan", unitPath: "yanmas" },
    SU: { nama: "Surat Umum / Custom", path: "surat-umum", unitPath: "" },
};

export default function DetailArsip() {
    const router = useRouter();
    const { id } = router.query;
    const [dataSurats, setDataSurat] = useState([]);
    const [allSurats, setAllSurats] = useState([]);
    const [dataUser, setDataUser] = useState([]);
    const [dynamicTemplates, setDynamicTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const [show, setShow] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) setUser(JSON.parse(userData));
    }, []);

    const jabatan = user?.jabatan_user || "";
    const unitKerja = user?.unit_kerja || "";
    const hasFullAccess = isFullAccess(jabatan);
    const userUnit = getUserUnit(jabatan, unitKerja);
    const pageUnit = id?.toLowerCase();
    const isOwnUnit = userUnit === pageUnit;
    const hasCRUD = canCRUD(jabatan, id, unitKerja);
    const isDir = isDirektur(jabatan);

    const units = [
        "umum", "yanmas", "keuangan", "pelayanan medik",
        "penunjang medik", "keperawatan", "laboratorium"
    ].map(u => {
        const namas = [];
        if (u === "laboratorium") namas.unshift({ nama: "Surat Keterangan Bebas Narkoba", ket: "SKBN", path: "surat-keterangan-bebas-narkoba" });
        if (u === "yanmas") namas.unshift({ nama: "Surat Permohonan", ket: "SPY", path: "surat-permohonan" });

        // Inject dynamic templates
        dynamicTemplates.forEach(t => {
            if (t.unit === "all" || t.unit === u) {
                namas.push({ nama: t.nama, ket: t.ket, path: "surat-dinamis" });
            }
        });

        return { unit: u, namas };
    });

    useEffect(() => {
        if (!id) return;

        // Query 1: Surat yang dibuat oleh unit ini
        const qByUnit = query(collection(db, "surat"), where("unit", "==", id.toLowerCase()));
        // Query 2: Surat yang ditujukan ke unit ini (dari unit lain)
        const qByTujuan = query(collection(db, "surat"), where("tujuan_unit", "==", id.toLowerCase()));

        let suratByUnit = [];
        let suratByTujuan = [];

        const mergeSurats = () => {
            // Gabungkan kedua hasil, deduplicate berdasarkan id
            const merged = new Map();
            [...suratByUnit, ...suratByTujuan].forEach(s => merged.set(s.id, s));
            let data = Array.from(merged.values());

            // If user is NOT from this unit and NOT fullAccess, only show surat that are targeted to their unit
            if (!hasFullAccess && !isOwnUnit && userUnit) {
                data = data.filter(s => s.tujuan_unit === userUnit);
            }

            setAllSurats(data);
            setLoading(false);
        };

        const unsub1 = onSnapshot(qByUnit, (snapshot) => {
            suratByUnit = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            mergeSurats();
        });

        const unsub2 = onSnapshot(qByTujuan, (snapshot) => {
            suratByTujuan = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            mergeSurats();
        });

        return () => { unsub1(); unsub2(); };
    }, [id, isDir, isOwnUnit, userUnit]);

    useEffect(() => {
        if (filterDate) {
            setDataSurat(allSurats.filter((s) => s.tanggal_surat === filterDate));
        } else {
            setDataSurat(allSurats);
        }
    }, [filterDate, allSurats]);

    useEffect(() => {
        const qUser = query(collection(db, "user"), orderBy("createdAt", "asc"));
        const unsubUser = onSnapshot(qUser, (snapshot) => {
            setDataUser(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        });

        const qTpl = query(collection(db, "master_template_surat"));
        const unsubTpl = onSnapshot(qTpl, (snapshot) => {
            setDynamicTemplates(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => { unsubUser(); unsubTpl(); };
    }, []);

    const selectedUnit = units.find((u) => u.unit.toLowerCase() === id?.toLowerCase());
    const getPathByKet = (ket) => selectedUnit?.namas.find((item) => item.ket === ket)?.path || null;
    const getNamaByKet = (ket) => {
        const fromUnit = selectedUnit?.namas.find((item) => item.ket === ket)?.nama;
        if (fromUnit) return fromUnit;
        const global = ALL_SURAT_TYPES[ket];
        if (global) return global.nama;
        const dynamicTpl = dynamicTemplates.find(t => t.ket === ket);
        if (dynamicTpl) return dynamicTpl.nama;
        return ket || "-";
    };
    // Get view path for any surat including incoming from other units
    const getViewPath = (surat) => {
        // Global pages directly root at /
        if (surat.ket === "SU") return `/surat-umum`;
        const dynamicTpl = dynamicTemplates.find(t => t.ket === surat.ket);
        if (dynamicTpl) return `/surat-dinamis`;

        // First try current page's unit paths for specific unit templates
        const localPath = getPathByKet(surat.ket);
        if (localPath) return `/${id.toLowerCase()}/${localPath}`;

        // Fallback: use global lookup with origin unit's path
        const global = ALL_SURAT_TYPES[surat.ket];
        if (global) return `/${global.unitPath}/${global.path}`;

        return null;
    };

    const handleDelete = async (suratId) => {
        if (!hasCRUD) return alert("Anda tidak memiliki akses untuk menghapus surat di unit ini.");
        if (!confirm("Yakin ingin menghapus surat ini?")) return;
        setLoadingDelete(true);
        try {
            await deleteDoc(doc(db, "surat", suratId));
        } catch (error) {
            console.error(error);
        }
        setLoadingDelete(false);
    };

    return (
        <Layout>
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                        <Link href="/arsip2" className="hover:text-primary transition-colors">Buat Surat</Link>
                        <span>/</span>
                        <span className="text-gray-600">{id}</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Arsip Surat {id}</h1>
                    {!isDir && !isOwnUnit && (
                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Hanya menampilkan surat yang ditujukan ke unit Anda (read-only)
                        </p>
                    )}
                </div>
                {hasCRUD && (
                    <button onClick={() => setShow(true)}
                        className="px-5 py-2.5 bg-gradient-to-r from-primary to-emerald-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Buat Baru
                    </button>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Surat List */}
                <div className="flex-1">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="skeleton-card" />)}
                        </div>
                    ) : dataSurats.length > 0 ? (
                        <div className="space-y-4">
                            {dataSurats.map((tdata) => {
                                const nama = getNamaByKet(tdata.ket);
                                const viewPath = getViewPath(tdata);
                                const isIncoming = tdata.unit?.toLowerCase() !== pageUnit && tdata.tujuan_unit?.toLowerCase() === pageUnit;
                                const isLabSurat = tdata.ket === "SKBN" || tdata.unit?.toLowerCase() === "laboratorium";
                                return (
                                    <div key={tdata.id} className={`bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-shadow ${isIncoming ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100'}`}>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tdata.status_approval === "approved" ? "bg-green-100 text-green-700" :
                                                            tdata.status_approval === "rejected" ? "bg-red-100 text-red-700" :
                                                                "bg-amber-100 text-amber-700"
                                                        }`}>
                                                        {tdata.status_approval === "approved" ? "Disetujui" :
                                                            tdata.status_approval === "rejected" ? "Ditolak" :
                                                                (tdata.id_kabag && !tdata.ttd_kabag && tdata.id_dokter && !tdata.ttd_dokter) ? "Pending (Kabag & Dir)" :
                                                                    (tdata.id_kabag && !tdata.ttd_kabag) ? "Pending (Kabag)" :
                                                                        (tdata.id_dokter && !tdata.ttd_dokter) ? "Pending (Dokter)" : "Pending"}
                                                    </span>
                                                    {isIncoming && (
                                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                            </svg>
                                                            Surat Masuk
                                                        </span>
                                                    )}
                                                    {tdata.tujuan_unit && !isIncoming && (
                                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 capitalize">
                                                            → {tdata.tujuan_unit}
                                                        </span>
                                                    )}
                                                    {isIncoming && (
                                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                                                            Dari: {tdata.unit}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-base font-bold text-primary">{nama}</h3>
                                                <div className="mt-2 space-y-0.5">
                                                    <p className="text-sm text-gray-500">Tanggal: <span className="text-gray-700">{tdata.tanggal_surat || "-"}</span></p>
                                                    <p className="text-sm text-gray-500">No Surat: <span className="text-gray-700">{tdata.no_surat || "-"}</span></p>
                                                    {isLabSurat ? (
                                                        <>
                                                            <p className="text-sm text-gray-500">Pasien: <span className="text-gray-700">{tdata.nama_pasien || "-"}</span></p>
                                                            <p className="text-sm text-gray-500">Kepentingan: <span className="text-gray-700">{tdata.kepentingan_surat || "-"}</span></p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p className="text-sm text-gray-500">Lampiran: <span className="text-gray-700">{tdata.lampiran_surat || "-"}</span></p>
                                                            <p className="text-sm text-gray-500">Perihal: <span className="text-gray-700">{tdata.perihal_surat || "-"}</span></p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex sm:flex-col gap-2">
                                                {/* View - always available, uses global path lookup */}
                                                {viewPath && (
                                                    <Link href={{ pathname: viewPath, query: { id: tdata.id } }}>
                                                        <button className="p-2.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-colors" title="Lihat">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </button>
                                                    </Link>
                                                )}
                                                {id === "Laboratorium" && (
                                                    <Link href={{ pathname: `/${id.toLowerCase()}/drug-free-certificate`, query: { id: tdata.id } }}>
                                                        <button className="p-2.5 bg-cyan-50 text-cyan-600 rounded-xl hover:bg-cyan-100 transition-colors text-xs font-bold" title="English Version">
                                                            ENG
                                                        </button>
                                                    </Link>
                                                )}
                                                {/* Edit & Delete - only if hasCRUD and surat is from this unit (not incoming). If approved, only admin/direktur can edit. */}
                                                {hasCRUD && !isIncoming && (hasFullAccess || tdata.status_approval !== "approved") && (
                                                    <>
                                                        <Link href={{ pathname: `/detail-arsip/${id}/buat-surat`, query: { ket: tdata.ket, docId: tdata.id } }}>
                                                            <button className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors" title="Edit">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </button>
                                                        </Link>
                                                        <button onClick={() => handleDelete(tdata.id)} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors" title="Hapus">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mx-auto text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-gray-400 font-medium">Tidak ada data surat</p>
                        </div>
                    )}
                </div>

                {/* Filter Sidebar */}
                <div className="w-full lg:w-72 flex-shrink-0">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24">
                        <h3 className="font-bold text-gray-800 mb-4">Filter</h3>
                        <hr className="mb-4 border-gray-100" />
                        <label className="block text-sm font-medium text-gray-600 mb-1.5">Tanggal</label>
                        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm mb-3" />
                        <button onClick={() => setFilterDate(selectedDate)}
                            className="w-full py-2.5 bg-gradient-to-r from-primary to-emerald-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all mb-2">
                            Filter
                        </button>
                        {filterDate && (
                            <button onClick={() => { setFilterDate(""); setSelectedDate(""); }}
                                className="w-full py-2.5 bg-red-50 text-red-500 rounded-xl font-medium text-sm hover:bg-red-100 transition-colors">
                                Reset Filter
                            </button>
                        )}
                        <hr className="my-4 border-gray-100" />
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Jumlah Surat</span>
                                <span className="font-bold text-gray-700">{dataSurats.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Surat Masuk</span>
                                <span className="font-bold text-blue-600">{dataSurats.filter(s => s.unit?.toLowerCase() !== pageUnit && s.tujuan_unit?.toLowerCase() === pageUnit).length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Akses</span>
                                <span className={`font-semibold ${hasCRUD ? 'text-green-600' : 'text-gray-400'}`}>
                                    {hasCRUD ? 'CRUD' : 'Read Only'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Select Surat Type Modal */}
            {show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShow(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                        <button onClick={() => setShow(false)} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Pilih Jenis Surat</h2>
                        <p className="text-sm text-gray-500 mb-6">Silakan pilih jenis surat yang ingin dibuat</p>
                        {selectedUnit && selectedUnit.namas.length > 0 ? (
                            <div className="space-y-3">
                                {selectedUnit.namas.map((tdata, index) => {
                                    const colors = ["from-primary to-emerald-500", "from-blue-500 to-cyan-500", "from-purple-500 to-pink-500"];
                                    return (
                                        <Link key={index} href={{ pathname: `/detail-arsip/${id}/buat-surat`, query: { ket: tdata.ket } }} className="block">
                                            <div className={`bg-gradient-to-r ${colors[index % colors.length]} text-white p-4 rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer`}>
                                                <p className="font-semibold">{tdata.nama}</p>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-center text-gray-400 py-4">Tidak ada jenis surat tersedia untuk unit ini</p>
                        )}
                    </div>
                </div>
            )}

            {/* Loading overlay */}
            {loadingDelete && (
                <div className="fixed inset-0 z-50 bg-black/40 flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mb-3" />
                    <p className="text-white font-medium">Menghapus data...</p>
                </div>
            )}
        </Layout>
    );
}