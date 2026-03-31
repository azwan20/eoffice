import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { db } from "@/lib/firebaseConfig";
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import Layout from "@/components/Layout";
import { isFullAccess, ALL_UNITS } from "@/lib/roleUtils";
import dynamic from 'next/dynamic';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

export default function MasterTemplate() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [submitLoading, setSubmitLoading] = useState(false);

    const emptyFormFields = { name: "", label: "", type: "text" };
    const emptyForm = {
        ket: "", // Kode (e.g. S-JALAN)
        nama: "", // Nama Surat (e.g. Surat Jalan)
        unit: "all", // all or specific unit
        format_nomor: "", // Format nomor otomatis
        formFields: [
            { name: "no_surat", label: "Nomor Surat", type: "text" },
            { name: "tanggal_surat", label: "Tanggal Surat", type: "date" },
            { name: "perihal_surat", label: "Perihal Surat", type: "text" },
            { name: "kepada_surat", label: "Kepada Yth", type: "text" }
        ],
        layoutHtml: "<p>Dengan hormat,</p><p><br></p><p>Surat ini menyatakan bahwa...</p>"
    };

    const [form, setForm] = useState(emptyForm);

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            const parsed = JSON.parse(userData);
            setUser(parsed);
            if (!isFullAccess(parsed.jabatan_user)) {
                alert("Anda tidak memiliki akses ke halaman ini.");
                router.push("/");
            }
        } else {
            router.push("/login");
        }
    }, [router]);

    useEffect(() => {
        const q = query(collection(db, "master_template_surat"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snapshot) => {
            setTemplates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const handleOpenModal = (t = null) => {
        if (t) {
            setEditId(t.id);
            setForm({
                ket: t.ket || "",
                nama: t.nama || "",
                unit: t.unit || "all",
                format_nomor: t.format_nomor || "",
                formFields: t.formFields || emptyForm.formFields,
                layoutHtml: t.layoutHtml || ""
            });
        } else {
            setEditId(null);
            setForm(emptyForm);
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditId(null);
        setForm(emptyForm);
    };

    const handleFieldChange = (index, key, value) => {
        const newFields = [...form.formFields];
        newFields[index][key] = value;
        
        // Auto-generate 'name' variable from 'label'
        if (key === 'label' && !newFields[index]['name']) {
           newFields[index]['name'] = value.toLowerCase().replace(/[^a-z0-9]/g, '_');
        }
        setForm({ ...form, formFields: newFields });
    };

    const addField = () => setForm({ ...form, formFields: [...form.formFields, { ...emptyFormFields }] });
    const removeField = (index) => setForm({ ...form, formFields: form.formFields.filter((_, i) => i !== index) });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);

        try {
            // validate
            if (!form.ket || !form.nama) {
                alert("Kode dan Nama Surat wajib diisi!");
                setSubmitLoading(false);
                return;
            }

            const payload = {
                ket: form.ket.toUpperCase(),
                nama: form.nama,
                unit: form.unit.toLowerCase(),
                format_nomor: form.format_nomor || "",
                formFields: form.formFields,
                layoutHtml: form.layoutHtml,
                updatedAt: serverTimestamp()
            };

            if (editId) {
                await updateDoc(doc(db, "master_template_surat", editId), payload);
            } else {
                payload.createdAt = serverTimestamp();
                await addDoc(collection(db, "master_template_surat"), payload);
            }

            handleCloseModal();
        } catch (error) {
            console.error("Error saving template:", error);
            alert("Gagal menyimpan template");
        }
        setSubmitLoading(false);
    };

    const handleDelete = async (id) => {
        if (!confirm("Yakin ingin menghapus template ini? Form yang sudah dibuat dengan template ini akan kehilangan panduan render-nya.")) return;
        try {
            await deleteDoc(doc(db, "master_template_surat", id));
        } catch (error) {
            console.error("Error deleting template:", error);
            alert("Gagal menghapus template");
        }
    };

    const joditConfig = {
        readonly: false,
        height: 450,
        toolbarSticky: false,
        buttons: [
            'bold', 'italic', 'underline', 'strikethrough', '|',
            'ul', 'ol', '|',
            'outdent', 'indent', '|',
            'fontsize', 'paragraph', '|',
            'image', 'table', 'link', '|',
            'align', 'undo', 'redo', '|',
            'hr', 'eraser', 'fullsize'
        ],
        removeButtons: ['source', 'about'] // Menonaktifkan mode source agar admin tidak merusak tag
    };

    if (!user) return null;

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Master Template Surat</h1>
                    <p className="text-sm text-gray-500 mt-1">Kelola format, form input, dan desain cetak persuratan dinamis</p>
                </div>
                <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Buat Template Baru
                </button>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2].map(i => <div key={i} className="skeleton-card" />)}
                </div>
            ) : templates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(t => (
                        <div key={t.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg mb-2 inline-block">
                                        [{t.ket}]
                                    </span>
                                    <h3 className="font-bold text-gray-800 text-lg leading-tight">{t.nama}</h3>
                                    <p className="text-xs text-gray-500 mt-1 capitalize">Untuk Unit: {t.unit === 'all' ? 'Semua Unit' : t.unit}</p>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded-lg">
                                <b>Variabel Form:</b> {t.formFields?.map(f => `{{${f.name}}}`).join(', ') || 'Belum ada'}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleOpenModal(t)} className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                                    Edit
                                </button>
                                <button onClick={() => handleDelete(t.id)} className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
                    <p className="text-gray-500">Belum ada template surat dinamis yang dibuat.</p>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleCloseModal} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">{editId ? "Edit Template Surat" : "Buat Template Surat Baru"}</h2>
                                <p className="text-sm text-gray-500">Definisikan atribut surat, input form, dan desain output cetaknya.</p>
                            </div>
                            <button onClick={handleCloseModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6">
                            <form id="templateForm" onSubmit={handleSubmit} className="space-y-8">
                                {/* Section 1: Atribut Dasar */}
                                <div className="space-y-4 bg-white p-5 rounded-xl border border-gray-200">
                                    <h3 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-2">1. Konfigurasi Dasar</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Kode Template</label>
                                            <input type="text" value={form.ket} onChange={(e) => setForm({ ...form, ket: e.target.value })}
                                                placeholder="Contoh: SP, S-TUGAS"
                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary outline-none transition-all uppercase" required />
                                            <p className="text-[10px] text-gray-400 mt-1">Harus unik, huruf besar, tanpa spasi</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Surat (Label Menu)</label>
                                            <input type="text" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })}
                                                placeholder="Contoh: Surat Izin Cuti"
                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary outline-none transition-all" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Target Unit</label>
                                            <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary outline-none transition-all capitalize">
                                                <option value="all">Semua Unit (Umum)</option>
                                                {ALL_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Format Nomor Otomatis <span className="text-gray-400 font-normal">(Opsional)</span></label>
                                            <input type="text" value={form.format_nomor} onChange={(e) => setForm({ ...form, format_nomor: e.target.value })}
                                                placeholder="Cth: {{INPUT}}/RSUD/{{ROMAWI}}/{{TAHUN}}"
                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary outline-none transition-all" />
                                            <p className="text-[10px] text-gray-400 mt-1">Variabel: {'{{INPUT}}'}, {'{{NOMOR}}'}, {'{{ROMAWI}}'}, {'{{BULAN}}'}, {'{{TAHUN}}'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Form Builder */}
                                <div className="space-y-4 bg-white p-5 rounded-xl border border-gray-200">
                                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                        <div>
                                            <h3 className="text-base font-bold text-gray-800">2. Form Variables (Input Data)</h3>
                                            <p className="text-xs text-gray-500 mt-0.5">Tentukan kolom apa saja yang harus diisi saat membuat surat ini.</p>
                                        </div>
                                        <button type="button" onClick={addField} className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-sm font-medium hover:bg-green-100 flex items-center gap-1">
                                            + Tambah Input
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        {form.formFields.map((field, idx) => (
                                            <div key={idx} className="flex gap-3 items-start bg-gray-50 p-3 rounded-xl">
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    <div>
                                                        <label className="block text-[11px] uppercase font-semibold text-gray-500 mb-1">Label Input (UI)</label>
                                                        <input type="text" value={field.label} onChange={(e) => handleFieldChange(idx, 'label', e.target.value)}
                                                            placeholder="Cth: Nama Pegawai" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200" required />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] uppercase font-semibold text-gray-500 mb-1">Variable Name (Untuk Desain)</label>
                                                        <input type="text" value={field.name} onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                                                            placeholder="Cth: nama_pegawai" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 font-mono text-blue-600" required />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] uppercase font-semibold text-gray-500 mb-1">Tipe Data</label>
                                                        <select value={field.type} onChange={(e) => handleFieldChange(idx, 'type', e.target.value)}
                                                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200">
                                                            <option value="text">Teks Singkat</option>
                                                            <option value="textarea">Teks Panjang (Paragraf)</option>
                                                            <option value="date">Input Tanggal</option>
                                                            <option value="number">Angka / Uang</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => removeField(idx)} className="mt-6 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-2 text-blue-800 text-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p>Field <b>id_dokter</b> dan <b>id_kabag</b> (Penanda Tangan) selalu ada otomatis secara default. Anda tidak perlu menambahkannya lagi di sini.</p>
                                    </div>
                                </div>

                                {/* Section 3: Layout Designer */}
                                <div className="space-y-4 bg-white p-5 rounded-xl border border-gray-200">
                                    <div className="border-b border-gray-100 pb-2">
                                        <h3 className="text-base font-bold text-gray-800">3. Desain Tampilan Cetak (Layout)</h3>
                                        <p className="text-xs text-gray-500 mt-0.5">Ketik isi surat. Gunakan format kurung kurawal ganda, misal <code className="bg-gray-100 px-1 rounded text-red-500">&#123;&#123;nama_pegawai&#125;&#125;</code> untuk me-render nilai variabel form.</p>
                                    </div>
                                    
                                    <div className="flex gap-2 flex-wrap mb-2">
                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest mr-2 mt-1.5">Variabel Tersedia:</span>
                                        {form.formFields.map(f => f.name).filter(Boolean).map(name => (
                                            <span key={name} className="px-2 py-1 bg-amber-50 text-amber-700 font-mono text-[11px] rounded border border-amber-200 cursor-pointer select-all">
                                                &#123;&#123;{name}&#125;&#125;
                                            </span>
                                        ))}
                                    </div>

                                    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                                        <JoditEditor
                                            value={form.layoutHtml}
                                            config={joditConfig}
                                            tabIndex={1}
                                            onBlur={newContent => setForm({ ...form, layoutHtml: newContent })}
                                            onChange={newContent => {}} // Dummy onChange for performance
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={handleCloseModal} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors">
                                Batal
                            </button>
                            <button type="submit" form="templateForm" disabled={submitLoading}
                                className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 flex items-center gap-2">
                                {submitLoading && <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                {editId ? "Simpan Perubahan" : "Simpan Template"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
