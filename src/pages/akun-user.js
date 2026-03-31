import { db, auth } from "@/lib/firebaseConfig";
import { getDocs, collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, orderBy, query, where, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ALL_UNITS } from "@/lib/roleUtils";

export default function AkunUser() {
    const [dataUser, setDataUser] = useState([]);
    const [show, setShow] = useState(false);
    const [editId, setEditId] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const emptyForm = {
        nama_user: '', nip_user: '', username: '', jabatan_user: '', unit_kerja: '',
        pangkat_gol_user: '', alamat_user: '', keterangan_user: '',
    };
    const [formFields, setFormFields] = useState(emptyForm);
    const [openSuccess, setOpenSuccess] = useState(false);
    const [message, setMessage] = useState("");
    const [submitLoading, setSubmitLoading] = useState(false);

    useEffect(() => {
        const qUser = query(collection(db, "user"), orderBy("createdAt", "asc"));
    
        const unsub = onSnapshot(qUser, (snapshot) => {
            setDataUser(snapshot.docs
                .map((d) => ({ id: d.id, ...d.data() }))
                .filter(u => u.jabatan_user?.toLowerCase() !== "admin" && u.nama_user?.toLowerCase() !== "admin")
            );
        });

        return () => unsub();
    }, []);

    const handleFieldChange = (field, value) => {
        setFormFields((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            if (editId) {
                const docRef = doc(db, "user", editId);
                await updateDoc(docRef, { ...formFields, updatedAt: serverTimestamp() });
                setMessage('Data berhasil diperbarui!');
            } else {
                const q = query(collection(db, "user"), where("username", "==", formFields.username));
                const qs = await getDocs(q);
                if (!qs.empty) { alert("Username sudah terdaftar!"); setSubmitLoading(false); return; }

                const email = `${formFields.username}@app.com`;
                const userCredential = await createUserWithEmailAndPassword(auth, email, "123456");
                await addDoc(collection(db, "user"), {
                    ...formFields, uid: userCredential.user.uid, email, createdAt: serverTimestamp(),
                });
                setMessage("Data berhasil disimpan!");
            }
            setOpenSuccess(true);
            setFormFields(emptyForm);
            setEditId(null);
            setShow(false);
        } catch (error) {
            console.error("Error:", error);
            setMessage("Gagal menyimpan data. Coba lagi!");
            setOpenSuccess(true);
        }
        setSubmitLoading(false);
    };

    const handleEdit = (user) => {
        setFormFields(user);
        setEditId(user.id);
        setShow(true);
    };

    const handleDelete = async (id) => {
        if (!confirm("Yakin ingin menghapus data ini?")) return;
        try {
            await deleteDoc(doc(db, "user", id));
            setMessage("Data berhasil dihapus");
            setOpenSuccess(true);
        } catch (error) {
            console.error(error);
        }
    };

    const filteredUsers = dataUser.filter(u =>
        u.nama_user?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.nip_user?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.jabatan_user?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.unit_kerja?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const unitBadge = (unit) => {
        const u = unit?.toLowerCase() || "";
        if (u.includes("yanmas")) return "bg-blue-100 text-blue-700";
        if (u.includes("umum")) return "bg-amber-100 text-amber-700";
        if (u.includes("keuangan")) return "bg-rose-100 text-rose-700";
        if (u.includes("laboratorium")) return "bg-cyan-100 text-cyan-700";
        if (u.includes("pelayanan")) return "bg-emerald-100 text-emerald-700";
        if (u.includes("penunjang")) return "bg-orange-100 text-orange-700";
        if (u.includes("keperawatan")) return "bg-pink-100 text-pink-700";
        return "bg-gray-100 text-gray-600";
    };

    return (
        <Layout>
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Data Pengguna</h1>
                    <p className="text-sm text-gray-500 mt-1">Kelola akun pengguna sistem</p>
                </div>
                <button onClick={() => { setShow(true); setEditId(null); setFormFields(emptyForm); }}
                    className="px-5 py-2.5 bg-gradient-to-r from-primary to-emerald-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah User
                </button>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari nama, NIP, jabatan, atau unit..."
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">No</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Nama</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">NIP</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Jabatan</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Unit Kerja</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Alamat</th>
                                <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredUsers.map((value, index) => (
                                <tr key={value.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center text-white text-xs font-bold">
                                                {value.nama_user?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <span className="text-sm font-semibold text-gray-700">{value.nama_user}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{value.nip_user}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{value.jabatan_user || "-"}</td>
                                    <td className="px-6 py-4">
                                        {value.unit_kerja ? (
                                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize whitespace-nowrap ${unitBadge(value.unit_kerja)}`}>
                                                {value.unit_kerja}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate">{value.alamat_user}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => handleEdit(value)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button onClick={() => handleDelete(value.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredUsers.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <p className="font-medium">Tidak ada data ditemukan</p>
                    </div>
                )}
            </div>

            {/* Modal Form */}
            {show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShow(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setShow(false)} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <h2 className="text-xl font-bold text-gray-800 mb-6">{editId ? "Edit User" : "Tambah User Baru"}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                                <input type="text" value={formFields.nama_user} onChange={(e) => handleFieldChange('nama_user', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <input type="text" value={formFields.username} onChange={(e) => handleFieldChange('username', e.target.value)}
                                    disabled={!!editId}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm disabled:bg-gray-100" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">NIP</label>
                                <input type="text" value={formFields.nip_user} onChange={(e) => handleFieldChange('nip_user', e.target.value)}
                                    disabled={!!editId}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm disabled:bg-gray-100" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Jabatan</label>
                                <input type="text" value={formFields.jabatan_user} onChange={(e) => handleFieldChange('jabatan_user', e.target.value)}
                                    placeholder="Contoh: Kepala Bagian, Staf Administrasi, Dokter Umum..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Kerja</label>
                                <select value={formFields.unit_kerja} onChange={(e) => handleFieldChange('unit_kerja', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" required>
                                    <option value="">-- Pilih Unit Kerja --</option>
                                    {ALL_UNITS.map(u => (
                                        <option key={u} value={u} className="capitalize">{u.charAt(0).toUpperCase() + u.slice(1)}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pangkat/Gol</label>
                                <input type="text" value={formFields.pangkat_gol_user} onChange={(e) => handleFieldChange('pangkat_gol_user', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                                <input type="text" value={formFields.alamat_user} onChange={(e) => handleFieldChange('alamat_user', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                                <textarea value={formFields.keterangan_user} onChange={(e) => handleFieldChange('keterangan_user', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm h-20 resize-none" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShow(false)}
                                    className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors">
                                    Batal
                                </button>
                                <button type="submit" disabled={submitLoading}
                                    className="flex-1 py-2.5 bg-gradient-to-r from-primary to-emerald-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50">
                                    {submitLoading ? "Menyimpan..." : editId ? "Update" : "Simpan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Success Toast */}
            {openSuccess && (
                <div className="fixed bottom-6 right-6 z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-4 flex items-center gap-3 animate-in slide-in-from-bottom-4">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-700">{message}</p>
                    <button onClick={() => setOpenSuccess(false)} className="text-gray-400 hover:text-gray-600 ml-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}
        </Layout>
    );
}