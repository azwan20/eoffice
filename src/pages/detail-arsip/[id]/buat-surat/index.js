import { useRouter } from "next/router";
import Link from "next/link";
import { db } from "@/lib/firebaseConfig";
import React, { useEffect, useState } from "react";
import { getDocs, getDoc, collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, orderBy, query, where, onSnapshot, runTransaction } from "firebase/firestore";
import Layout from "@/components/Layout";
import SuccessDialog from "@/components/SuccessDialog";
import { canCRUD, isDirektur, ALL_UNITS, isFullAccess } from "@/lib/roleUtils";

async function fetchData_ModelTransaksi(id) {
    const docRef = doc(db, "surat", id);
    const docSnapshot = await getDoc(docRef);
    if (docSnapshot.exists()) {
        return [{ id: docSnapshot.id, ...docSnapshot.data() }];
    }
    return [];
}

function Pasiens({ formFields, handleFieldChange }) {
    return (
        <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-2">Data Pasien</h3>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input type="text" value={formFields.nama_pasien}
                    onChange={(e) => handleFieldChange('nama_pasien', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tempat</label>
                    <input type="text" value={formFields.tempatlahir_pasien}
                        onChange={(e) => handleFieldChange('tempatlahir_pasien', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tgl. Lahir</label>
                    <input type="date" value={formFields.tgllahir_pasien}
                        onChange={(e) => handleFieldChange('tgllahir_pasien', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Kelamin</label>
                <div className="flex gap-4">
                    {["Laki-Laki", "Perempuan"].map(opt => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" value={opt} checked={formFields.jk_pasien === opt}
                                onChange={(e) => handleFieldChange('jk_pasien', e.target.value)}
                                className="w-4 h-4 text-primary border-gray-300 focus:ring-primary" />
                            <span className="text-sm text-gray-600">{opt}</span>
                        </label>
                    ))}
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                <textarea value={formFields.alamat_pasien}
                    onChange={(e) => handleFieldChange('alamat_pasien', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm h-20 resize-none" />
            </div>
        </div>
    );
}

export default function BuatSurat() {
    const router = useRouter();
    const { id, ket } = router.query;
    const unit = router.query.id;
    const docId = router.query.docId;
    const [dataUser, setDataUser] = useState([]);
    const [editId, setEditId] = useState(null);
    const [formDokter, setFormDokter] = useState([]);
    const [formKabag, setFormKabag] = useState([]);
    const [formFields, setFormFields] = useState({
        id_dokter: '', id_kabag: '', nama_pasien: '', tempatlahir_pasien: '',
        lampiran_surat: '', perihal_surat: '', isi_surat: '', tgllahir_pasien: '',
        jk_pasien: '', alamat_pasien: '', no_surat: '', tanggal_surat: '',
        hasil_narkoba: '', kepentingan_surat: '', amp: '', thc: '', mop: '',
    });
    const [loadingSave, setLoadingSave] = useState(false);
    const [useAutoNumber, setUseAutoNumber] = useState(false);


    const [selectedSurat, setSelectedSurat] = useState(null);
    const [openSuccess, setOpenSuccess] = useState(false);
    const [message, setMessage] = useState("");
    const [redirectPath, setRedirectPath] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const [tujuanUnit, setTujuanUnit] = useState("");

    // Role-based access check
    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            const parsed = JSON.parse(userData);
            setCurrentUser(parsed);
            // Check if user can create surat in this unit
            if (id && !canCRUD(parsed.jabatan_user, id, parsed.unit_kerja)) {
                alert("Anda tidak memiliki akses untuk membuat surat di unit ini.");
                router.push(`/detail-arsip/${id}`);
            }
        }
    }, [id]);

    const PASIEN_FIELDS = ["nama_pasien", "tempatlahir_pasien", "tgllahir_pasien", "jk_pasien", "alamat_pasien"];
    const FORM_CONFIG = {
        SKBN: ["no_surat", "tanggal_surat", "hasil_narkoba", "kepentingan_surat", "amp", "thc", "mop"],
        SPY: ["no_surat", "tanggal_surat", "lampiran_surat", "perihal_surat", "isi_surat"],
        SU: ["no_surat", "tanggal_surat", "kepada_surat", "perihal_surat", "isi_surat_custom"]
    };
    const formConfig = {
        SKBN: { title: "Surat Keterangan Bebas Narkoba", fields: ["direktur", "pasien", "alamat", "hasil_lab"] },
        SPY: { title: "Surat Pemberian Izin", fields: ["direktur", "pimpinan", "alamat"] },
        SU: { title: "Surat Umum / Custom", fields: ["direktur", "pimpinan"] }
    };
    const [dynamicTemplates, setDynamicTemplates] = useState([]);

    const dynamicTpl = dynamicTemplates.find(t => t.ket === ket);

    const activeFields = dynamicTpl 
        ? dynamicTpl.formFields.map(f => f.name) 
        : (FORM_CONFIG[ket] || []);
        
    const config = dynamicTpl 
        ? { title: dynamicTpl.nama, fields: ["direktur", "pimpinan"] }
        : formConfig[ket];

    useEffect(() => {
        if (!editId && dynamicTpl?.format_nomor) {
            setUseAutoNumber(true);
        } else {
            setUseAutoNumber(false);
        }
    }, [dynamicTpl, editId]);

    useEffect(() => {
        if (!docId) return;
        const fetchData = async () => {
            const docRef = doc(db, "surat", docId);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data();

                // Validation for approved letters
                const userData = localStorage.getItem("user");
                if (userData) {
                    const parsed = JSON.parse(userData);
                    if (data.status_approval === "approved" && !isFullAccess(parsed.jabatan_user)) {
                        alert("Surat yang sudah disetujui tidak dapat diedit lagi.");
                        router.push(`/detail-arsip/${id}`);
                        return;
                    }
                }

                setSelectedSurat(data);
                setFormFields((prev) => ({
                    ...prev, ...data,
                    tanggal_surat: data.tanggal_surat ? new Date(data.tanggal_surat).toISOString().split("T")[0] : "",
                    tgllahir_pasien: data.tgllahir_pasien ? new Date(data.tgllahir_pasien).toISOString().split("T")[0] : ""
                }));
                setEditId(docId);
            }
        };
        fetchData();
    }, [docId, id, router]);

    useEffect(() => {
        if (!selectedSurat || dataUser.length === 0) return;
        if (selectedSurat.id_dokter) {
            const dokter = dataUser.find((u) => u.id === selectedSurat.id_dokter);
            if (dokter) setFormDokter({ nama_user: dokter.nama_user, nip_user: dokter.nip_user, jabatan_user: dokter.jabatan_user, alamat_user: dokter.alamat_user });
        }
        if (selectedSurat.id_kabag) {
            const kabag = dataUser.find((u) => u.id === selectedSurat.id_kabag);
            if (kabag) setFormKabag({ nama_user: kabag.nama_user, nip_user: kabag.nip_user, jabatan_user: kabag.jabatan_user, alamat_user: kabag.alamat_user });
        }
    }, [selectedSurat, dataUser]);

    useEffect(() => {
        const qUser = query(collection(db, "user"), orderBy("createdAt", "asc"));
        const unsubUser = onSnapshot(qUser, (snapshot) => {
            setDataUser(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        });

        const qTpl = query(collection(db, "master_template_surat"));
        const unsubTpl = onSnapshot(qTpl, (snapshot) => {
            setDynamicTemplates(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        });

        return () => { unsubUser(); unsubTpl(); };
    }, []);

    const getFinalData = () => {
        const configFields = config?.fields || [];
        const data = {};
        activeFields.forEach((key) => { data[key] = formFields[key]; });
        if (configFields.includes("pasien")) PASIEN_FIELDS.forEach((key) => { data[key] = formFields[key]; });
        if (configFields.includes("direktur")) data.id_dokter = formFields.id_dokter;
        if (configFields.includes("pimpinan")) data.id_kabag = formFields.id_kabag;
        return data;
    };

    const handleFieldChange = (field, value) => setFormFields((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoadingSave(true);
        try {
            const finalData = getFinalData();
            
            // Validasi kelengkapan data form
            const emptyFields = Object.keys(finalData).filter(key => {
                // Abaikan pengecekan no_surat jika disetel otomatis (sebab akan digenerate di bawah)
                if (key === 'no_surat' && useAutoNumber && !editId) return false;
                // Lampiran biasanya opsional
                if (key === 'lampiran_surat') return false; 
                
                const val = finalData[key];
                return val === undefined || val === null || String(val).trim() === "";
            });

            if (emptyFields.length > 0) {
                setMessage("Lengkapi form yang kosong");
                setOpenSuccess(true);
                setRedirectPath(""); 
                setLoadingSave(false);
                return;
            }
            
            // Logika Penomoran Surat Otomatis menggunakan Transaksi Firestore
            if (useAutoNumber && !editId && dynamicTpl?.format_nomor) {
                // Gunakan tanggal dari form jika ada, jika tidak gunakan waktu hari ini
                const refDate = formFields.tanggal_surat ? new Date(formFields.tanggal_surat) : new Date();
                const year = refDate.getFullYear();
                const month = refDate.getMonth() + 1;
                const counterId = `${year}_${ket}`;
                
                const newNoSurat = await runTransaction(db, async (transaction) => {
                    const counterRef = doc(db, "counters_surat", counterId);
                    const counterDoc = await transaction.get(counterRef);
                    let seq = 1;
                    if (counterDoc.exists()) {
                        seq = counterDoc.data().seq + 1;
                    }
                    transaction.set(counterRef, { seq, year, ket, updatedAt: serverTimestamp() }, { merge: true });
                    
                    const roman = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
                    
                    let format = dynamicTpl.format_nomor;
                    format = format.replace(/\{\{NOMOR\}\}/g, seq);
                    format = format.replace(/\{\{TAHUN\}\}/g, year);
                    format = format.replace(/\{\{BULAN\}\}/g, month);
                    format = format.replace(/\{\{ROMAWI\}\}/g, roman[month]);
                    format = format.replace(/\{\{INPUT\}\}/g, formFields.no_surat || "___");
                    
                    return format;
                });
                finalData.no_surat = newNoSurat;
            }

            if (editId) {
                await updateDoc(doc(db, "surat", editId), { ...finalData, updatedAt: serverTimestamp() });
                setMessage("Data Berhasil Diperbarui");
            } else {
                await addDoc(collection(db, "surat"), {
                    ...finalData,
                    unit: id.toLowerCase(),
                    ket: ket,
                    tujuan_unit: tujuanUnit || "",
                    createdAt: serverTimestamp()
                });
                setMessage("Data Berhasil Disimpan");
            }
            setRedirectPath(`/detail-arsip/${id}`);
            setOpenSuccess(true);
            setEditId(null);
        } catch (error) {
            console.error(error);
            setMessage("Gagal menyimpan data");
            setOpenSuccess(true);
        } finally {
            setLoadingSave(false);
        }
    };

    const handleDokterChange = (e) => {
        const user = dataUser.find((u) => u.nama_user === e.target.value);
        if (user) {
            setFormDokter({ nama_user: user.nama_user, nip_user: user.nip_user, jabatan_user: user.jabatan_user, alamat_user: user.alamat_user });
            setFormFields((prev) => ({ ...prev, id_dokter: user.id }));
        } else {
            setFormFields((prev) => ({ ...prev, id_dokter: '' }));
        }
    };

    const handleNamaChange = (e) => {
        const user = dataUser.find((u) => u.nama_user === e.target.value);
        if (user) {
            setFormKabag({ nama_user: user.nama_user, nip_user: user.nip_user, jabatan_user: user.jabatan_user, alamat_user: user.alamat_user });
            setFormFields((prev) => ({ ...prev, id_kabag: user.id }));
        } else {
            setFormFields((prev) => ({ ...prev, id_kabag: '' }));
        }
    };

    const FIELD_MASTER = {
        no_surat: { label: "Nomor Surat", type: "text" },
        tanggal_surat: { label: "Tanggal Surat", type: "date" },
        hasil_narkoba: { label: "Hasil Narkoba", type: "radio", options: ["Ya", "Tidak"] },
        kepentingan_surat: { label: "Kepentingan Surat", type: "select", options: ["KELENGKAPAN BERKAS PENGURUSAN NIDN"] },
        lampiran_surat: { label: "Lampiran Surat", type: "text" },
        perihal_surat: { label: "Perihal Surat", type: "text" },
        kepada_surat: { label: "Tujuan (Kepada Yth)", type: "text" },
        isi_surat: { label: "Isi Permohonan", type: "textarea" },
        isi_surat_custom: { label: "Isi Surat (Pesan Utama)", type: "textarea" },
        amp: { label: "AMP", type: "select", options: ["Positif (+)", "Negatif (-)"] },
        thc: { label: "THC", type: "select", options: ["Positif (+)", "Negatif (-)"] },
        mop: { label: "MOP", type: "select", options: ["Positif (+)", "Negatif (-)"] },
    };

    if (dynamicTpl) {
        dynamicTpl.formFields.forEach(f => {
            if (!FIELD_MASTER[f.name]) {
                // Determine form rendering based on db-configured type
                FIELD_MASTER[f.name] = {
                    label: f.label,
                    type: f.type === 'number' ? 'text' : f.type, // Map number to text initially, add logic later if needed
                };
            }
        });
    }

    const inputClasses = "w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm";

    const renderField = (fieldKey) => {
        const field = FIELD_MASTER[fieldKey];
        if (!field) return null;
        
        if (fieldKey === 'no_surat' && dynamicTpl?.format_nomor && !editId) {
            const hasInputTag = dynamicTpl.format_nomor.includes('{{INPUT}}');
            
            // Generate live preview string
            let previewValue = dynamicTpl.format_nomor;
            const refDatePreview = formFields.tanggal_surat ? new Date(formFields.tanggal_surat) : new Date();
            const yearPrev = refDatePreview.getFullYear();
            const monthPrev = refDatePreview.getMonth() + 1;
            const romanPreview = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
            
            previewValue = previewValue.replace(/\{\{NOMOR\}\}/g, "(Oto)");
            previewValue = previewValue.replace(/\{\{TAHUN\}\}/g, yearPrev);
            previewValue = previewValue.replace(/\{\{BULAN\}\}/g, monthPrev);
            previewValue = previewValue.replace(/\{\{ROMAWI\}\}/g, romanPreview[monthPrev] || "-");
            previewValue = previewValue.replace(/\{\{INPUT\}\}/g, formFields[fieldKey] || "___");
            
            return (
                <div key={fieldKey}>
                    <div className="flex justify-between items-end mb-1">
                        <label className="block text-sm font-medium text-gray-700">{field.label}</label>
                        <label className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded cursor-pointer select-none">
                            <input type="checkbox" checked={!useAutoNumber} onChange={(e) => setUseAutoNumber(!e.target.checked)} className="rounded text-blue-600 border-blue-300 w-3 h-3" />
                            Isi Manual Mutlak
                        </label>
                    </div>
                    {useAutoNumber ? (
                        <div className="space-y-1">
                            {hasInputTag && (
                                <input type="text" value={formFields[fieldKey] || ''} onChange={(e) => handleFieldChange(fieldKey, e.target.value)} className={inputClasses} placeholder="Ketik kode unik nomor (Bagian Depan)..." required />
                            )}
                            <div className="px-3 py-2 bg-gray-50 text-gray-400 italic font-mono text-xs rounded-lg border border-gray-100 flex gap-2">
                                <span>Preview saat disimpan:</span>
                                <span className="font-bold text-gray-600">{previewValue}</span>
                            </div>
                        </div>
                    ) : (
                        <input type="text" value={formFields[fieldKey] || ''} onChange={(e) => handleFieldChange(fieldKey, e.target.value)} className={inputClasses} placeholder="Ketik nomor surat manual selengkapnya..." required />
                    )}
                </div>
            );
        }

        switch (field.type) {
            case "text": return (
                <div key={fieldKey}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                    <input type="text" value={formFields[fieldKey] || ''} onChange={(e) => handleFieldChange(fieldKey, e.target.value)} className={inputClasses} />
                </div>
            );
            case "textarea": return (
                <div key={fieldKey}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                    <textarea value={formFields[fieldKey]} onChange={(e) => handleFieldChange(fieldKey, e.target.value)} className={`${inputClasses} h-28 resize-none`} />
                </div>
            );
            case "date": return (
                <div key={fieldKey}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                    <input type="date" value={formFields[fieldKey]} onChange={(e) => handleFieldChange(fieldKey, e.target.value)} className={inputClasses} />
                </div>
            );
            case "radio": return (
                <div key={fieldKey}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
                    <div className="flex gap-4">
                        {field.options.map((opt) => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" value={opt} checked={formFields[fieldKey] === opt}
                                    onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
                                    className="w-4 h-4 text-primary border-gray-300 focus:ring-primary" />
                                <span className="text-sm text-gray-600">{opt}</span>
                            </label>
                        ))}
                    </div>
                </div>
            );
            case "select": return (
                <div key={fieldKey}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                    <select value={formFields[fieldKey]} onChange={(e) => handleFieldChange(fieldKey, e.target.value)} className={inputClasses}>
                        <option value="">--Pilih--</option>
                        {field.options.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                    </select>
                </div>
            );
            default: return null;
        }
    };

    const fields = activeFields;
    const mid = Math.ceil(fields.length / 2);
    const leftFields = fields.slice(0, mid);
    const rightFields = fields.slice(mid);

    return (
        <Layout>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                <Link href="/arsip2" className="hover:text-primary transition-colors">Buat Surat</Link>
                <span>/</span>
                <Link href={`/detail-arsip/${id}`} className="hover:text-primary transition-colors">{id}</Link>
                <span>/</span>
                <span className="text-gray-600">Form</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">{config?.title || "Buat Surat"}</h1>

            {loadingSave && (
                <div className="fixed inset-0 z-50 bg-black/40 flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mb-3" />
                    <p className="text-white font-medium">Menyimpan data...</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* User Data Card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Input Data User</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {config?.fields.includes("direktur") && (
                            <div className="space-y-4">
                                <h3 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-2">
                                    Data {ket === 'SKBN' ? 'Dokter Bertugas' : 'Pemberi Izin'}
                                </h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                                    <select value={formDokter.nama_user} onChange={handleDokterChange} className={inputClasses}>
                                        <option value="">--Pilih--</option>
                                        {dataUser.map((u) => (<option key={u.id} value={u.nama_user}>{u.nama_user}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">NIP</label>
                                    <input type="text" disabled value={formDokter.nip_user || ''} className={`${inputClasses} bg-gray-50`} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Jabatan</label>
                                    <input type="text" disabled value={formDokter.jabatan_user || ''} className={`${inputClasses} bg-gray-50`} />
                                </div>
                            </div>
                        )}
                        {config?.fields.includes("pimpinan") && (
                            <div className="space-y-4">
                                <h3 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-2">Data Kepala Bagian</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                                    <select value={formKabag.nama_user} onChange={handleNamaChange} className={inputClasses}>
                                        <option value="">--Pilih--</option>
                                        {dataUser.map((u) => (<option key={u.id} value={u.nama_user}>{u.nama_user}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">NIP</label>
                                    <input type="text" disabled value={formKabag.nip_user || ''} className={`${inputClasses} bg-gray-50`} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Jabatan</label>
                                    <input type="text" disabled value={formKabag.jabatan_user || ''} className={`${inputClasses} bg-gray-50`} />
                                </div>
                            </div>
                        )}
                        {config?.fields.includes("pasien") && (
                            <Pasiens formFields={formFields} handleFieldChange={handleFieldChange} />
                        )}
                    </div>
                </div>

                {/* Surat Data Card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Data Isi Surat</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-4">
                            {leftFields.map((fieldKey) => renderField(fieldKey))}
                        </div>
                        <div className="space-y-4">
                            {rightFields.map((fieldKey) => renderField(fieldKey))}
                        </div>
                    </div>
                </div>

                {/* Tujuan Unit Card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-2">Tujuan Surat</h2>
                    <p className="text-sm text-gray-500 mb-4">Opsional — pilih jika surat ditujukan ke unit lain</p>
                    <select value={tujuanUnit} onChange={(e) => setTujuanUnit(e.target.value)} className={inputClasses}>
                        <option value="">-- Tidak ada (internal unit) --</option>
                        {ALL_UNITS.filter(u => u !== id?.toLowerCase()).map(u => (
                            <option key={u} value={u} className="capitalize">{u.charAt(0).toUpperCase() + u.slice(1)}</option>
                        ))}
                    </select>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-center">
                    <button type="button" onClick={() => router.back()}
                        className="px-8 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors">
                        Batal
                    </button>
                    <button type="submit" disabled={loadingSave}
                        className="px-8 py-3 bg-gradient-to-r from-primary to-emerald-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50">
                        {editId ? "Update" : "Simpan"}
                    </button>
                </div>
            </form>

            <SuccessDialog open={openSuccess} setOpenSuccess={setOpenSuccess} message={message} redirectPath={redirectPath} />
        </Layout>
    );
}