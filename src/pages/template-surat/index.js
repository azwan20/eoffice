import SekretarisAside from "../sekretarisAside";
import Link from "next/link";
import { db } from "@/lib/firebaseConfig";
import { getDocs, getDoc, collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, orderBy, query, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSearchParams } from "next/navigation";
import Tabels from "@/components/Table";
import { Button, Card } from "@mui/material";
import SuccessDialog from "@/components/SuccessDialog";

export default function BuatSuart() {
    const [dataSuratMasuk, SetDataSuratMasuk] = useState([]);
    const [IdDocument, setIdDocument] = useState("");
    const [kode, setKode] = useState("");
    const searchParams = useSearchParams();
    const perihals = searchParams.getAll("perihals"); // kalau multiple query param
    const [formFields, setFormFields] = useState({
        no_surat_spm: '',
        nama_spm: '',
        nip_spm: '',
        jabatanKades: '',
        jabatan_spm: '',
        nip_penerima: '',
        perihal: '',
        namaPenerima: '',
        isi_surat: '',
        tanggal_surat_spm: '',
        jenis: 'spm'
    });

    const [rincianBelanja, setRincianBelanja] = useState([
        { kode_rek: '', uraian: '', anggaran: '', pencairan: '' }
    ]);
    const [editId, setEditId] = useState(null);
    const [showForm, setShowForm] = useState(true);
    const [openSuccess, setOpenSuccess] = useState(false);
    const [message, setMessage] = useState(false);

    const router = useRouter();
    const { id } = router.query;

    const [isHomeActive, setIsHomeActive] = useState(false);
    const [isMasukActive, setIsMasukActive] = useState(true);
    const [isKeluarActive, setIsKeluarActive] = useState(false);
    const [isBuatActive, setIsBuatActive] = useState(true);
    const [suratList, setSuratList] = useState([]);
    const [dataUser, setDataUser] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditMode, setEditMode] = useState(false);
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Listener untuk surat
        const q = query(collection(db, "surat"), orderBy("createdAt", "asc"));
        const unsubscribeSurat = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }))
                .filter((item) => item.jenis === "spm");
            setSuratList(data);
        });

        // Listener untuk user
        const qUser = query(collection(db, "user"), orderBy("createdAt", "asc"));
        const unsubscribeUser = onSnapshot(qUser, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }));
            setDataUser(data);
        });

        // cleanup listener saat unmount
        return () => {
            unsubscribeSurat();
            unsubscribeUser();
        };
    }, []);

    const handleButtonClick = (buttonType) => {
        if (buttonType === "home") {
            setIsHomeActive(false);
            setIsMasukActive(false);
            setIsKeluarActive(false);
            setIsBuatActive(false);
        } else if (buttonType === "masuk") {
            setIsHomeActive(false);
            setIsMasukActive(true);
            setIsKeluarActive(false);
            setIsBuatActive(false);
        } else if (buttonType === "npd") {
            setIsHomeActive(false);
            setIsMasukActive(false);
            setIsKeluarActive(true);
            setIsBuatActive(false);
        } else if (buttonType === "arsip") {
            setIsHomeActive(false);
            setIsMasukActive(false);
            setIsKeluarActive(false);
            setIsBuatActive(true);
        }
    };

    const handleFieldChange = (field, value) => {
        setFormFields((prev) => ({
            ...prev,
            [field]: value
        }));
    };

    const handleNamaChange = (e) => {
        const namaTerpilih = e.target.value;

        const user = dataUser.find((udata) => udata.nama_user === namaTerpilih);

        if (user) {
            setFormFields((prev) => ({
                ...prev,
                nama_spm: user.nama_user,
                nip_spm: user.nip_user,
                jabatan_spm: user.jabatan_user,
                alamat_spm: user.alamat_user, // kalau kedudukan = alamat
            }));
        } else {
            // reset kalau tidak ada yang dipilih
            setFormFields((prev) => ({
                ...prev,
                nama_spm: '',
                nip_spm: '',
                jabatan_spm: '',
                alamat_spm: '',
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editId) {
                // mode edit
                const docRef = doc(db, "surat", editId);
                await updateDoc(docRef, {
                    ...formFields,
                    rincianBelanja,
                    updatedAt: serverTimestamp()
                });
                setOpenSuccess(true);
                setMessage('Data Berhasil Siperbarui');
            } else {
                // mode tambah
                await addDoc(collection(db, "surat"), {
                    ...formFields,
                    rincianBelanja,
                    createdAt: serverTimestamp()
                });
                setOpenSuccess(true);
                setMessage('Data Berhasil Disimpan');
            }

            setEditId(null);
        } catch (error) {
            console.error("Error: ", error);
            setOpenSuccess(true);
            setMessage("Gagal menyimpan data. Coba lagi!");
        }
    };

    const handleEditClick = () => {
        setEditMode(true);
    };

    const handleCancelClick = () => {
        setEditMode(false);
        setSelectedRows([]);
    };

    let visibleSku = false;
    let visibleSt = false;
    let visibleSkd = false;
    let visibleSktm = false;
    let visibleSkpo = false;
    let visibleLainnya = false;

    perihals.forEach((value) => {
        switch (value.trim()) {
            case "surat-perintah-membayar":
                visibleSku = true;
                break;
            case "nota-pencairan-dana":
                visibleSt = true;
                break;
            case "berita-acara-3":
                visibleSktm = true;
                break;
            case "daftar-pemesanan":
                visibleSkd = true;
                break;
            case "Surat Keterangan Pindah":
                visibleSkpo = true;
                break;
            default:
                visibleLainnya = true;
                break;
        }
    });

    const handleShow = () => {
        setShow(!show);
    }

    const handleEdit = (surat) => {
        setFormFields(surat);
        setEditId(surat.id);
        setShowForm(true);
        setShow(true);
    };

    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, "surat", id));
            setDataUser((prev) => prev.filter((item) => item.id !== id));
            setOpenSuccess(true);
            setMessage('Data Berhasil Dihapus');
        } catch (error) {
            console.error("Gagal menghapus dokumen: ", error);
        }
    };

    console.log('data surat', IdDocument);

    return (
        <>
            <div className="d-flex buatSurat">
                <SekretarisAside isHomeActive={isHomeActive} isMasukActive={isMasukActive} isKeluarActive={isKeluarActive} handleButtonClick={handleButtonClick} />
                <article style={{ height: '100vh', overflowY: 'auto' }}>
                    {visibleSku && (
                        <div className="p-3">
                            <div className="d-flex align-items-center justify-content-between px-3 py-0">
                                <div>
                                    <h5 className="text-start text-second fw-bold">Form Permohonan Penerbitan Surat Perintah Membayar (SPM)</h5>
                                    <p className="text-grey mb-0">Sistem pengelolaan surat berbasis digital </p>
                                </div>
                                <button onClick={handleShow} className="btn-second m-0 text-white p-3 rounded-3 py-2 border-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-plus-circle-fill m-0 p-0 me-2" viewBox="0 0 16 16">
                                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3z" />
                                    </svg>
                                    Buat Baru</button>
                            </div>
                            {show && (
                                <div>
                                    <form onSubmit={handleSubmit} method="post" action="">
                                        <div className="inputanUsers">
                                            <span>
                                                <p>No Surat</p>
                                                <p>Nama Pemberi Izin</p>
                                                <p>Nip Pemberi Izin</p>
                                                <p>Jabatan Pemberi Izin</p>
                                                <p>Perihal</p>
                                                <p>Nama Penerima</p>
                                                <p>Isi surat</p>
                                                <p>Tanggal Surat</p>
                                            </span>
                                            <span>
                                                <input type="text" value={formFields.no_surat_spm}
                                                    onChange={(e) => handleFieldChange('no_surat_spm', e.target.value)} />
                                                <select value={formFields.nama_spm} onChange={handleNamaChange}>
                                                    <option value="">--Pilih Pihak Pertama--</option>
                                                    {dataUser.map((udata, index) => (
                                                        <option value={udata.nama_user}>{udata.nama_user}</option>
                                                    ))}
                                                </select>
                                                <input type="text" disabled value={formFields.nip_spm} />
                                                <input type="text" disabled value={formFields.jabatan_spm} />
                                                <input type="text" value={formFields.perihal}
                                                    onChange={(e) => handleFieldChange('perihal', e.target.value)} />
                                                <input type="text" value={formFields.namaPenerima}
                                                    onChange={(e) => handleFieldChange('namaPenerima', e.target.value)} />
                                                <textarea value={formFields.isi_surat}
                                                    onChange={(e) => handleFieldChange('isi_surat', e.target.value)} />
                                                <input type="date" value={formFields.tanggal_surat_spm}
                                                    onChange={(e) => handleFieldChange('tanggal_surat_spm', e.target.value)} />
                                            </span>
                                        </div>
                                        <span className="d-flex buttonBuatSurat justify-content-center">
                                            <button type="submit" style={{ backgroundColor: '#BBA482' }}>Simpan</button>
                                            <button onClick={handleShow} style={{ backgroundColor: '#900000' }}>Batal</button>
                                        </span>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}

                    <Tabels suratList={suratList} isEditMode={isEditMode} onDelete={handleDelete} perihals={perihals} onEdit={handleEdit} setOpenSuccess={setOpenSuccess} IdDocument={IdDocument} pathnames="/sekretaris/nota-pencairan-dana" />
                </article >
            </div >

            <SuccessDialog open={openSuccess} message={message} setOpenSuccess={setOpenSuccess} setShow={setShow} />
        </>
    )
}