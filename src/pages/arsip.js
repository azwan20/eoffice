import { useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { getDocs, getDoc, collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, orderBy, query, where, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import TabelArsip from "@/components/TableArsip";
import SuccessDialog from "@/components/SuccessDialog";


export default function Arsip() {
    const [dataSurat, SetDataSurat] = useState([]);
    const [dataSuratKeluar, SetDataSuratKeluar] = useState([]);
    const router = useRouter();
    const [isArsipActive, setIsArsipActive] = useState(true);
    const [Islogin, setIslogin] = useState();
    const [dataSuratMasuk, SetDataSuratMasuk] = useState([]);
    const [isHomeActive, setIsHomeActive] = useState(false);
    const [isMasukActive, setIsMasukActive] = useState(false);
    const [isKeluarActive, setIsKeluarActive] = useState(false);
    const [isBuatActive, setIsBuatActive] = useState(true);
    const [activeMenu, setActiveMenu] = useState("arsip");
    const [dataUser, setDataUser] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditMode, setEditMode] = useState(false);
    const [pihakPeratam, setPihakPeratam] = useState(false);
    const [show, setShow] = useState(false);
    const formRef = useRef(null);
    const [formFields, setFormFields] = useState({
        nama_kedua: '',
        perusahaan_kedua: '',
        jabatan_kedua: '',
        alamat_kedua: '',
        no_surat_pemesanan: '',
        daerah: '',
        kegiatan: '',
        sub_kegiatan: '',
        kode_rek: '',
        tanggal_surat: '',
        tahun_anggaran: '',
        no_surat_pemeriksaan: '',
        tanggal_surat_pemeriksaan: '',
        jawbatan_pemeriksa: '',
        no_surat_kemajuan: '',
        tanggal_surat_kemajuan: '',
        no_surat_npd: '',
        tanggal_surat_npd: '',
        nama_pptk: '',
        nip_pptk: '',
        jabatan_pptk: '',
        program: '',
        no_dpa: '',
        anggaran: '',
        no_surat_pembayaran: '',
        tanggal_surat_pembayaran: '',
        tanggal_surat_kwitansi: '',
        no_bku: '',
        terima_dari: '',
        nama_bendahara: '',
        nip_bendahara: '',
    });
    const [editId, setEditId] = useState(null);
    const [showForm, setShowForm] = useState(true);
    const [openSuccess, setOpenSuccess] = useState(false);
    const [message, setMessage] = useState(false);

    const handleButtonClick = (menu) => {
        setActiveMenu(menu);
    };

    // useEffect(() => {
    //     const user = JSON.parse(localStorage.getItem("user"));

    //     if (!user) {
    //         router.push("/"); // belum login
    //         return;
    //     }

    //     if (user.role !== "admin") {
    //         router.push("/"); // bukan admin, redirect ke home
    //     }
    // }, [router]);

    const onLogout = () => {
        // const isLogin = localStorage.getItem('isLogin');
        // if (isLogin === "true") {
        //     localStorage.setItem("isLogin", false);
        // }
        localStorage.removeItem("isLogin");
    }

    const handleShow = () => {
        setShow(!show);
    }

    const [rincianBelanja, setRincianBelanja] = useState([
        { nama_uraian: '', satuan: '', kuantitas: '', harga_satuan: '', kuantitasR: '', harga_satuanR: '', ongkos_kirimR: '', keterangan: '' }
    ]);

    const handleAddRincian = () => {
        setRincianBelanja([...rincianBelanja, { nama_uraian: '', satuan: '', kuantitas: '', harga_satuan: '', kuantitasR: '', harga_satuans: '', ongkos_kirimR: '', keterangan: '' }]);
    };

    const [rekapitulasi, setRekapitulasi] = useState([
        { nama_rekapitulasi: '', harga: '' }
    ]);

    const handleAddRekapitulasi = () => {
        setRekapitulasi([...rekapitulasi, { nama_rekapitulasi: '', harga: '' }]);
    };

    const handleFieldChange = (field, value) => {
        setFormFields((prev) => ({
            ...prev,
            [field]: value
        }));
    };

    const handleRincianChange = (index, field, value) => {
        const updated = [...rincianBelanja];
        updated[index][field] = value;
        setRincianBelanja(updated);
    };

    const handleRekaptulasiChange = (index, field, value) => {
        const updated = [...rekapitulasi];
        updated[index][field] = value;
        setRekapitulasi(updated);
    };

    // Dipanggil dari tombol Edit di tabel
    const handleEdit = (surat) => {
        setFormFields(surat);
        setRincianBelanja(surat.rincianBelanja || [
            { nama_uraian: '', satuan: '', kuantitas: '', harga_satuan: '', kuantitasR: '', harga_satuans: '', ongkos_kirimR: '', keterangan: '' }
        ]);
        setRekapitulasi(surat.rekapitulasi || [
            { nama_rekapitulasi: '', harga: '' }
        ]);
        setEditId(surat.id);
        setShowForm(true);
        setShow(true);
    };


    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, "surat", id));
            SetDataSurat((prev) => prev.filter((item) => item.id !== id));
            setOpenSuccess(true); // ✅ Success dialog muncul di parent
            setMessage('Data Berhasil Dihapus');
        } catch (error) {
            console.error("Gagal menghapus dokumen: ", error);
        }
    };

    const handleDeleteRincian = (namaUraian) => {
        setRincianBelanja((prev) =>
            prev.filter((item) => item.nama_uraian !== namaUraian)
        );
    };

    useEffect(() => {
        if (!editId) return;
        // kecilkan delay agar DOM sudah render
        const t = setTimeout(() => {
            if (formRef.current) {
                formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
                formRef.current.querySelector("input,select,textarea")?.focus();
            } else {
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        }, 50);
        return () => clearTimeout(t);
    }, [editId, showForm]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editId) {
                // mode edit
                const docRef = doc(db, "surat", editId);
                await updateDoc(docRef, {
                    ...formFields,
                    rincianBelanja,
                    rekapitulasi,
                    updatedAt: serverTimestamp()
                });
                setOpenSuccess(true);
                setMessage('Data Berhasil Siperbarui');
            } else {
                // mode tambah
                await addDoc(collection(db, "surat"), {
                    ...formFields,
                    rincianBelanja,
                    rekapitulasi,
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

    useEffect(() => {
        // Listener untuk surat
        const q = query(collection(db, "surat"), orderBy("createdAt", "asc"));
        const unsubscribeSurat = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }))
                .filter((item) => item.jenis !== "spm");
            SetDataSurat(data);
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

    const handleNamaChange = (e) => {
        const namaTerpilih = e.target.value;
        setPihakPeratam(namaTerpilih);

        // cari data user berdasarkan nama
        const user = dataUser.find((udata) => udata.nama_user === namaTerpilih);

        if (user) {
            setFormFields((prev) => ({
                ...prev,
                nama_user: user.nama_user,
                nip_user: user.nip_user,
                jabatan_user: user.jabatan_user,
                alamat_user: user.alamat_user, // kalau kedudukan = alamat
            }));
        } else {
            // reset kalau tidak ada yang dipilih
            setFormFields((prev) => ({
                ...prev,
                nama_user: '',
                nip_user: '',
                jabatan_user: '',
                alamat_user: '',
            }));
        }
    };

    const handleNamaChangePptk = (e) => {
        const namaTerpilih = e.target.value;
        setPihakPeratam(namaTerpilih);

        // cari data user berdasarkan nama
        const user = dataUser.find((udata) => udata.nama_user === namaTerpilih);

        if (user) {
            setFormFields((prev) => ({
                ...prev,
                nama_pptk: user.nama_user,
                nip_pptk: user.nip_user,
                jabatan_pptk: user.jabatan_user,
            }));
        } else {
            setFormFields((prev) => ({
                ...prev,
                nama_pptk: '',
                nip_pptk: '',
                jabatan_pptk: '',
            }));
        }
    };

    const handleNamaChangeBendahara = (e) => {
        const namaTerpilih = e.target.value;

        const user = dataUser.find((udata) => udata.nama_user === namaTerpilih);

        if (user) {
            setFormFields((prev) => ({
                ...prev,
                nama_bendahara: user.nama_user,
                nip_bendahara: user.nip_user,
            }));
        } else {
            setFormFields((prev) => ({
                ...prev,
                nama_bendahara: '',
                nip_bendahara: '',
            }));
        }
    };

    console.log('data users', rincianBelanja);

    return (
        <Layout>
            <div>
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Arsip Surat</h1>
                            <p className="text-sm text-gray-500 mt-1">Sistem pengelolaan surat berbasis digital</p>
                        </div>
                        <button onClick={handleShow}
                            className="px-5 py-2.5 bg-gradient-to-r from-primary to-emerald-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Buat Baru
                        </button>
                    </div>

                        {show && (
                            <div
                                className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center p-5 align-items-center"
                                style={{
                                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                                    zIndex: 99,
                                    overflowY: 'auto'

                                }}
                            >
                                <div className="position-fixed"
                                    style={{
                                        zIndex: 9999,
                                        right: '0',
                                        top: '0'
                                    }}
                                >
                                    <button className="bg-transparent" onClick={handleShow}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="#900000" class="bi bi-x-circle-fill" viewBox="0 0 16 16">
                                            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293z" />
                                        </svg>
                                    </button>
                                </div>
                                <Card className="w-100 rounded-5" style={{ height: '90vh', overflowY: 'auto', backgroundColor: '#f5f6f7' }}>
                                    <div className="w-100 m-auto d-flex align-items-center justify-content-center p-5" >
                                        {showForm && (
                                            <form form ref={formRef} onSubmit={handleSubmit} method="post" action="" className="w-100">
                                                <h3 className="text-center mb-3">Input Form Surat Baru</h3>
                                                <div className="formmArsips my-4">
                                                    <Card className="p-3 d-flex">
                                                        <div>
                                                            <h6 className="mb-3">Data Pihak Pertama</h6>
                                                            <p>Nama Lengkap</p>
                                                            <select value={formFields.nama_user} onChange={handleNamaChange}>
                                                                <option value="">--Pilih Pihak Pertama--</option>
                                                                {dataUser.map((udata, index) => (
                                                                    <option value={udata.nama_user}>{udata.nama_user}</option>
                                                                ))}
                                                            </select>
                                                            <p>NIP</p>
                                                            <input type="text" disabled value={formFields.nip_user} />
                                                            <p>Jabatan</p>
                                                            <input type="text" disabled value={formFields.jabatan_user} />
                                                            <p>Berkedudukan</p>
                                                            <textarea type="text" disabled value={formFields.alamat_user} />
                                                        </div>
                                                        <div>
                                                            <h6 className="mb-3">Data Pihak Kedua</h6>
                                                            <p>Nama Lengkap</p>
                                                            <input type="text" value={formFields.nama_kedua}
                                                                onChange={(e) => handleFieldChange('nama_kedua', e.target.value)} />
                                                            <p>Nama Perusahaan</p>
                                                            <input type="text" value={formFields.perusahaan_kedua}
                                                                onChange={(e) => handleFieldChange('perusahaan_kedua', e.target.value)} />

                                                            <p>Jabatan</p>
                                                            <input type="text" value={formFields.jabatan_kedua}
                                                                onChange={(e) => handleFieldChange('jabatan_kedua', e.target.value)} />

                                                            <p>Berkedudukan</p>
                                                            <textarea type="text" value={formFields.alamat_kedua}
                                                                onChange={(e) => handleFieldChange('alamat_kedua', e.target.value)} />
                                                        </div>
                                                    </Card>
                                                    <Card className="p-3 d-flex">
                                                        <div>
                                                            <h6 className="mb-3">Waktu dan Tanggal</h6>
                                                            <p>Hari</p>
                                                            <input type="text" disabled />
                                                            <p>Waktu</p>
                                                            <input type="text" disabled />
                                                            <p>Tempat</p>
                                                            <textarea type="text" disabled />
                                                        </div>

                                                    </Card>

                                                    <hr />
                                                    <Card className="p-3">
                                                        <h6 className="mb-3">Data Surat Daftar Pemesanan</h6>
                                                        <p>No Surat</p>
                                                        <input type="text" value={formFields.no_surat_pemesanan}
                                                            onChange={(e) => handleFieldChange('no_surat_pemesanan', e.target.value)} />
                                                        <p>Daerah</p>
                                                        <input type="text" value={formFields.daerah}
                                                            onChange={(e) => handleFieldChange('daerah', e.target.value)} />
                                                        <p>Kegiatan</p>
                                                        <input type="text" value={formFields.kegiatan}
                                                            onChange={(e) => handleFieldChange('kegiatan', e.target.value)} />
                                                        <p>Sub Kegiatan</p>
                                                        <input type="text" value={formFields.sub_kegiatan}
                                                            onChange={(e) => handleFieldChange('sub_kegiatan', e.target.value)} />
                                                        <p>Kode Rekening</p>
                                                        <input type="text" value={formFields.kode_rek}
                                                            onChange={(e) => handleFieldChange('kode_rek', e.target.value)} />
                                                        <p>Tanggal Barang Diterima</p>
                                                        <input type="date" value={formFields.tgl_terima}
                                                            onChange={(e) => handleFieldChange('tgl_terima', e.target.value)} />
                                                        <p>Tahun Anggaran</p>
                                                        <input type="text" value={formFields.tahun_anggaran}
                                                            onChange={(e) => handleFieldChange('tahun_anggaran', e.target.value)} />
                                                        <p>Uraian</p>
                                                        <input type="text" value={formFields.uraian}
                                                            onChange={(e) => handleFieldChange('uraian', e.target.value)} />
                                                        <Card className="border border-black mx-auto p-3 py-1 rounded-3 border-1">
                                                            <span className="d-flex justify-content-between align-items-center">
                                                                <b className="w-50">Data Uraian :</b>
                                                                <section className="d-flex justify-content-center flex-clumn align-items-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={handleAddRincian}
                                                                        className="btn-second text-white rounded-2 p-2 py-1 mt-0 border-0 btn-hover w-50">
                                                                        Tambah data
                                                                    </button>
                                                                    <select
                                                                        onChange={(e) => {
                                                                            if (e.target.value) {
                                                                                handleDeleteRincian(e.target.value);
                                                                                e.target.value = "";
                                                                            }
                                                                        }}
                                                                        className="form-select w-50"
                                                                    >
                                                                        <option value="">Hapus Uraian</option>
                                                                        {rincianBelanja.map((item, idx) => (
                                                                            <option key={idx} value={item.nama_uraian}>
                                                                                {item.nama_uraian || `Uraian ${idx + 1}`}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </section>
                                                            </span>
                                                            {rincianBelanja.map((item, index) => (
                                                                <span className="mb-3">
                                                                    <p>Nama Uraian</p>
                                                                    <input type="text" value={item.nama_uraian}
                                                                        onChange={(e) => handleRincianChange(index, 'nama_uraian', e.target.value)} />
                                                                    <p>Satuan</p>
                                                                    <input type="text" value={item.satuan}
                                                                        onChange={(e) => handleRincianChange(index, 'satuan', e.target.value)} />
                                                                    <p>Kuantitas</p>
                                                                    <input type="text" value={item.kuantitas}
                                                                        onChange={(e) => handleRincianChange(index, 'kuantitas', e.target.value)} />
                                                                    <p>Harga Satuan</p>
                                                                    <input type="text" value={item.harga_satuan}
                                                                        onChange={(e) => handleRincianChange(index, 'harga_satuan', e.target.value)} />
                                                                    <p>Keterangan</p>
                                                                    <div className="d-flex justify-content-start align-items-center">
                                                                        <input type="radio" value="baik" className="m-0" style={{ height: '20px', width: '2rem' }}
                                                                            checked={item.keterangan === "baik"} onChange={(e) => handleRincianChange(index, 'keterangan', e.target.value)} />
                                                                        <label>Baik</label>
                                                                        <input type="radio" value="tidak baik" className="m-0 ms-5" style={{ height: '20px', width: '2rem' }}
                                                                            checked={item.keterangan === "tidak baik"} onChange={(e) => handleRincianChange(index, 'keterangan', e.target.value)} />
                                                                        <label>Tidak Baik</label>
                                                                    </div>
                                                                    <hr className="p-0 m-0 mb-2" />
                                                                </span>
                                                            ))}
                                                        </Card>
                                                    </Card>

                                                    <hr />

                                                    <Card className="p-3">
                                                        <h6 className="mb-3">Data Berita Acara Pembayaran</h6>
                                                        <p>No Surat</p>
                                                        <input type="text" value={formFields.no_surat_pembayaran}
                                                            onChange={(e) => handleFieldChange('no_surat_pembayaran', e.target.value)} />
                                                        <p>Tanggal Surat</p>
                                                        <input type="date" value={formFields.tanggal_surat_pembayaran}
                                                            onChange={(e) => handleFieldChange('tanggal_surat_pembayaran', e.target.value)} />
                                                        <Card className="border border-black mx-auto p-3 py-1 rounded-3 border-1">
                                                            <span className="d-flex justify-content-between align-items-center">
                                                                <b>Rekapitulasi Pembayaran</b>
                                                                <button
                                                                    type="button"
                                                                    onClick={handleAddRekapitulasi}
                                                                    className="btn-second text-white rounded-2 p-2 py-1 border-0 btn-hover">
                                                                    Tambah data
                                                                </button>
                                                            </span>
                                                            {rekapitulasi.map((item, index) => (
                                                                <span className="mb-3">
                                                                    <p>Nama Uraian</p>
                                                                    <input type="text" value={item.nama_rekapitulasi}
                                                                        onChange={(e) => handleRekaptulasiChange(index, 'nama_rekapitulasi', e.target.value)} />
                                                                    <p>Harga</p>
                                                                    <input type="number" value={item.harga}
                                                                        onChange={(e) => handleRekaptulasiChange(index, 'harga', e.target.value)} />
                                                                    <hr className="p-0 m-0 mb-2" />
                                                                </span>
                                                            ))}
                                                        </Card>
                                                    </Card>

                                                    <hr />

                                                    <Card className="p-3">
                                                        <h6 className="mb-3">Data Berita Acara Pemeriksaan Pekerjaan</h6>
                                                        <p>No Surat</p>
                                                        <input type="text" value={formFields.no_surat_pemeriksaan}
                                                            onChange={(e) => handleFieldChange('no_surat_pemeriksaan', e.target.value)} />
                                                        <p>Tanggal Surat</p>
                                                        <input type="date" value={formFields.tanggal_surat_pemeriksaan}
                                                            onChange={(e) => handleFieldChange('tanggal_surat_pemeriksaan', e.target.value)} />
                                                        <p>Jabatan Yang Memeriksa</p>
                                                        <input type="text" value={formFields.jawbatan_pemeriksa}
                                                            onChange={(e) => handleFieldChange('jawbatan_pemeriksa', e.target.value)} />
                                                        <Card className="border border-black mx-auto p-3 py-1 rounded-3 border-1">
                                                            <section className="my-3">
                                                                <b className="text-start">Tabel Realisasi</b>
                                                            </section>
                                                            {rincianBelanja.map((items, indexs) => (
                                                                <span className="mb-3">
                                                                    <p>Nama</p>
                                                                    <input type="text" defaultValue={items.nama_uraian} readOnly />
                                                                    <p>Kuantitas</p>
                                                                    <input type="number" value={items.kuantitasR}
                                                                        onChange={(e) => handleRincianChange(indexs, 'kuantitasR', e.target.value)} />
                                                                    <p>Harga Satuan</p>
                                                                    <input type="number" value={items.harga_satuanR}
                                                                        onChange={(e) => handleRincianChange(indexs, 'harga_satuanR', e.target.value)} />
                                                                    <p>Ongkos Kirim</p>
                                                                    <input type="number" value={items.ongkos_kirimR}
                                                                        onChange={(e) => handleRincianChange(indexs, 'ongkos_kirimR', e.target.value)} />
                                                                    <hr className="p-0 m-0 mb-2" />
                                                                </span>
                                                            ))}
                                                        </Card>
                                                    </Card>

                                                    <hr />

                                                    <Card className="p-3">
                                                        <h6 className="mb-3">Data Berita Acara Kemajuan III (Ketiga) Pekerjaan</h6>
                                                        <p>No Surat</p>
                                                        <input type="text" value={formFields.no_surat_kemajuan}
                                                            onChange={(e) => handleFieldChange('no_surat_kemajuan', e.target.value)} />
                                                        <p>Tanggal Surat</p>
                                                        <input type="date" value={formFields.tanggal_surat_kemajuan}
                                                            onChange={(e) => handleFieldChange('tanggal_surat_kemajuan', e.target.value)} />
                                                    </Card>
                                                    <hr />

                                                    <Card className="p-3">
                                                        <h6 className="mb-3">Data Nota Pencairan Dana (NPD)</h6>
                                                        <p>No Surat</p>
                                                        <input type="text" value={formFields.no_surat_npd}
                                                            onChange={(e) => handleFieldChange('no_surat_npd', e.target.value)} />
                                                        <p>Tanggal Surat</p>
                                                        <input type="date" value={formFields.tanggal_surat_npd}
                                                            onChange={(e) => handleFieldChange('tanggal_surat_npd', e.target.value)} />
                                                        <p>Nama PPTK</p>
                                                        <select value={formFields.nama_pptk} onChange={handleNamaChangePptk}>
                                                            <option value="">--Pilih Pihak Pertama--</option>
                                                            {dataUser.map((udata, index) => (
                                                                <option value={udata.nama_user}>{udata.nama_user}</option>
                                                            ))}
                                                        </select>
                                                        <p>NIP</p>
                                                        <input type="text" disabled value={formFields.nip_pptk} />
                                                        <p>Jabatan</p>
                                                        <input type="text" disabled value={formFields.jabatan_pptk} />
                                                        <p>Program</p>
                                                        <input type="text" value={formFields.program}
                                                            onChange={(e) => handleFieldChange('program', e.target.value)} />
                                                        <p>No. DPA</p>
                                                        <input type="text" value={formFields.no_dpa}
                                                            onChange={(e) => handleFieldChange('no_dpa', e.target.value)} />
                                                        <p>Anggaran</p>
                                                        <input type="number" value={formFields.anggaran}
                                                            onChange={(e) => handleFieldChange('anggaran', e.target.value)} />
                                                    </Card>
                                                    <hr />

                                                    <Card className="p-3">
                                                        <h6 className="mb-3">Data Kwitnasi</h6>
                                                        <p>Tanggal Surat</p>
                                                        <input type="date" value={formFields.tanggal_surat_kwitansi}
                                                            onChange={(e) => handleFieldChange('tanggal_surat_kwitansi', e.target.value)} />
                                                        <p>No. BKU</p>
                                                        <input type="text" value={formFields.no_bku}
                                                            onChange={(e) => handleFieldChange('no_bku', e.target.value)} />
                                                        <p>Diterima Dari</p>
                                                        <input type="text" value={formFields.terima_dari}
                                                            onChange={(e) => handleFieldChange('terima_dari', e.target.value)} />
                                                        <p>Nama Bendahara</p>
                                                        <select value={formFields.nama_bendahara} onChange={handleNamaChangeBendahara}>
                                                            <option value="">--Pilih Pihak Pertama--</option>
                                                            {dataUser.map((udata, index) => (
                                                                <option value={udata.nama_user}>{udata.nama_user}</option>
                                                            ))}
                                                        </select>
                                                        <p>NIP</p>
                                                        <input type="text" disabled value={formFields.nip_bendahara} />
                                                    </Card>
                                                </div>
                                                <span className="d-flex buttonBuatSurat justify-content-center">
                                                    <button type="button" className="btn-second" onClick={() => setShowForm(false)}>Batal</button>
                                                    <button type="submit" className="btn-primer">{editId ? "Update" : "Simpan"}</button>
                                                </span>
                                            </form>
                                        )}
                                    </div>
                                </Card>
                                {/* <Card className="w-100 rounded-5" style={{ height: '90vh', overflowY: 'auto' }}>
                                    <div className="w-100 m-auto d-flex align-items-center justify-content-center p-5" >
                                        {showForm && (
                                            <form form ref={formRef} onSubmit={handleSubmit} method="post" action="" className="w-100">
                                                <h3 className="text-center mb-3">Input Form Surat Baru</h3>
                                                <div className="formmArsip d-flex my-4">
                                                    <section>
                                                        <div>
                                                            <h6 className="mb-3">Data Pihak Pertama</h6>
                                                            <p>Nama Lengkap</p>
                                                            <select value={formFields.nama_user} onChange={handleNamaChange}>
                                                                <option value="">--Pilih Pihak Pertama--</option>
                                                                {dataUser.map((udata, index) => (
                                                                    <option value={udata.nama_user}>{udata.nama_user}</option>
                                                                ))}
                                                            </select>
                                                            <p>NIP</p>
                                                            <input type="text" disabled value={formFields.nip_user} />
                                                            <p>Jabatan</p>
                                                            <input type="text" disabled value={formFields.jabatan_user} />
                                                            <p>Berkedudukan</p>
                                                            <textarea type="text" disabled value={formFields.alamat_user} />
                                                        </div>
                                                        <div>
                                                            <h6 className="mb-3">Data Surat Daftar Pemesanan</h6>
                                                            <p>No Surat</p>
                                                            <input type="text" value={formFields.no_surat_pemesanan}
                                                                onChange={(e) => handleFieldChange('no_surat_pemesanan', e.target.value)} />
                                                            <p>Daerah</p>
                                                            <input type="text" value={formFields.daerah}
                                                                onChange={(e) => handleFieldChange('daerah', e.target.value)} />
                                                            <p>Kegiatan</p>
                                                            <input type="text" value={formFields.kegiatan}
                                                                onChange={(e) => handleFieldChange('kegiatan', e.target.value)} />
                                                            <p>Sub Kegiatan</p>
                                                            <input type="text" value={formFields.sub_kegiatan}
                                                                onChange={(e) => handleFieldChange('sub_kegiatan', e.target.value)} />
                                                            <p>Kode Rekening</p>
                                                            <input type="text" value={formFields.kode_rek}
                                                                onChange={(e) => handleFieldChange('kode_rek', e.target.value)} />
                                                            <p>Tanggal Barang Diterima</p>
                                                            <input type="date" value={formFields.tgl_terima}
                                                                onChange={(e) => handleFieldChange('tgl_terima', e.target.value)} />
                                                            <p>Tahun Anggaran</p>
                                                            <input type="text" value={formFields.tahun_anggaran}
                                                                onChange={(e) => handleFieldChange('tahun_anggaran', e.target.value)} />
                                                            <p>Uraian</p>
                                                            <input type="text" value={formFields.uraian}
                                                                onChange={(e) => handleFieldChange('uraian', e.target.value)} />
                                                            <Card className="border border-black mx-auto p-3 py-1 rounded-3 border-1">
                                                                <span className="d-flex justify-content-between align-items-center">
                                                                    <b className="w-50">Data Uraian :</b>
                                                                    <section className="d-flex justify-content-center flex-clumn align-items-center">
                                                                        <button
                                                                            type="button"
                                                                            onClick={handleAddRincian}
                                                                            className="btn-second text-white rounded-2 p-2 py-1 mt-0 border-0 btn-hover w-50">
                                                                            Tambah data
                                                                        </button>
                                                                        <select
                                                                            onChange={(e) => {
                                                                                if (e.target.value) {
                                                                                    handleDeleteRincian(e.target.value);
                                                                                    e.target.value = "";
                                                                                }
                                                                            }}
                                                                            className="form-select w-50"
                                                                        >
                                                                            <option value="">Hapus Uraian</option>
                                                                            {rincianBelanja.map((item, idx) => (
                                                                                <option key={idx} value={item.nama_uraian}>
                                                                                    {item.nama_uraian || `Uraian ${idx + 1}`}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    </section>
                                                                </span>
                                                                {rincianBelanja.map((item, index) => (
                                                                    <span className="mb-3">
                                                                        <p>Nama Uraian</p>
                                                                        <input type="text" value={item.nama_uraian}
                                                                            onChange={(e) => handleRincianChange(index, 'nama_uraian', e.target.value)} />
                                                                        <p>Satuan</p>
                                                                        <input type="text" value={item.satuan}
                                                                            onChange={(e) => handleRincianChange(index, 'satuan', e.target.value)} />
                                                                        <p>Kuantitas</p>
                                                                        <input type="text" value={item.kuantitas}
                                                                            onChange={(e) => handleRincianChange(index, 'kuantitas', e.target.value)} />
                                                                        <p>Harga Satuan</p>
                                                                        <input type="text" value={item.harga_satuan}
                                                                            onChange={(e) => handleRincianChange(index, 'harga_satuan', e.target.value)} />
                                                                        <p>Keterangan</p>
                                                                        <div className="d-flex justify-content-start align-items-center">
                                                                            <input type="radio" value="baik" className="m-0" style={{ height: '20px', width: '2rem' }}
                                                                                checked={item.keterangan === "baik"} onChange={(e) => handleRincianChange(index, 'keterangan', e.target.value)} />
                                                                            <label>Baik</label>
                                                                            <input type="radio" value="tidak baik" className="m-0 ms-5" style={{ height: '20px', width: '2rem' }}
                                                                                checked={item.keterangan === "tidak baik"} onChange={(e) => handleRincianChange(index, 'keterangan', e.target.value)} />
                                                                            <label>Tidak Baik</label>
                                                                        </div>
                                                                        <hr className="p-0 m-0 mb-2" />
                                                                    </span>
                                                                ))}
                                                            </Card>
                                                        </div>
                                                        <div>
                                                            <h6 className="mb-3">Data Berita Acara Pembayaran</h6>
                                                            <p>No Surat</p>
                                                            <input type="text" value={formFields.no_surat_pembayaran}
                                                                onChange={(e) => handleFieldChange('no_surat_pembayaran', e.target.value)} />
                                                            <p>Tanggal Surat</p>
                                                            <input type="date" value={formFields.tanggal_surat_pembayaran}
                                                                onChange={(e) => handleFieldChange('tanggal_surat_pembayaran', e.target.value)} />
                                                            <Card className="border border-black mx-auto p-3 py-1 rounded-3 border-1">
                                                                <span className="d-flex justify-content-between align-items-center">
                                                                    <b>Rekapitulasi Pembayaran</b>
                                                                    <button
                                                                        type="button"
                                                                        onClick={handleAddRekapitulasi}
                                                                        className="btn-second text-white rounded-2 p-2 py-1 border-0 btn-hover">
                                                                        Tambah data
                                                                    </button>
                                                                </span>
                                                                {rekapitulasi.map((item, index) => (
                                                                    <span className="mb-3">
                                                                        <p>Nama Uraian</p>
                                                                        <input type="text" value={item.nama_rekapitulasi}
                                                                            onChange={(e) => handleRekaptulasiChange(index, 'nama_rekapitulasi', e.target.value)} />
                                                                        <p>Harga</p>
                                                                        <input type="number" value={item.harga}
                                                                            onChange={(e) => handleRekaptulasiChange(index, 'harga', e.target.value)} />
                                                                        <hr className="p-0 m-0 mb-2" />
                                                                    </span>
                                                                ))}
                                                            </Card>
                                                        </div>
                                                    </section>
                                                    <section>
                                                        <div>
                                                            <h6 className="mb-3">Data Pihak Kedua</h6>
                                                            <p>Nama Lengkap</p>
                                                            <input type="text" value={formFields.nama_kedua}
                                                                onChange={(e) => handleFieldChange('nama_kedua', e.target.value)} />
                                                            <p>Nama Perusahaan</p>
                                                            <input type="text" value={formFields.perusahaan_kedua}
                                                                onChange={(e) => handleFieldChange('perusahaan_kedua', e.target.value)} />

                                                            <p>Jabatan</p>
                                                            <input type="text" value={formFields.jabatan_kedua}
                                                                onChange={(e) => handleFieldChange('jabatan_kedua', e.target.value)} />

                                                            <p>Berkedudukan</p>
                                                            <textarea type="text" value={formFields.alamat_kedua}
                                                                onChange={(e) => handleFieldChange('alamat_kedua', e.target.value)} />
                                                        </div>
                                                        <div>
                                                            <h6 className="mb-3">Data Berita Acara Pemeriksaan Pekerjaan</h6>
                                                            <p>No Surat</p>
                                                            <input type="text" value={formFields.no_surat_pemeriksaan}
                                                                onChange={(e) => handleFieldChange('no_surat_pemeriksaan', e.target.value)} />
                                                            <p>Tanggal Surat</p>
                                                            <input type="date" value={formFields.tanggal_surat_pemeriksaan}
                                                                onChange={(e) => handleFieldChange('tanggal_surat_pemeriksaan', e.target.value)} />
                                                            <p>Jabatan Yang Memeriksa</p>
                                                            <input type="text" value={formFields.jawbatan_pemeriksa}
                                                                onChange={(e) => handleFieldChange('jawbatan_pemeriksa', e.target.value)} />
                                                            <Card className="border border-black mx-auto p-3 py-1 rounded-3 border-1">
                                                                <section className="my-3">
                                                                    <b className="text-start">Tabel Realisasi</b>
                                                                </section>
                                                                {rincianBelanja.map((items, indexs) => (
                                                                    <span className="mb-3">
                                                                        <p>Nama</p>
                                                                        <input type="text" defaultValue={items.nama_uraian} readOnly />
                                                                        <p>Kuantitas</p>
                                                                        <input type="number" value={items.kuantitasR}
                                                                            onChange={(e) => handleRincianChange(indexs, 'kuantitasR', e.target.value)} />
                                                                        <p>Harga Satuan</p>
                                                                        <input type="number" value={items.harga_satuanR}
                                                                            onChange={(e) => handleRincianChange(indexs, 'harga_satuanR', e.target.value)} />
                                                                        <p>Ongkos Kirim</p>
                                                                        <input type="number" value={items.ongkos_kirimR}
                                                                            onChange={(e) => handleRincianChange(indexs, 'ongkos_kirimR', e.target.value)} />
                                                                        <hr className="p-0 m-0 mb-2" />
                                                                    </span>
                                                                ))}
                                                            </Card>
                                                        </div>
                                                        <div>
                                                            <h6 className="mb-3">Data Berita Acara Kemajuan III (Ketiga) Pekerjaan</h6>
                                                            <p>No Surat</p>
                                                            <input type="text" value={formFields.no_surat_kemajuan}
                                                                onChange={(e) => handleFieldChange('no_surat_kemajuan', e.target.value)} />
                                                            <p>Tanggal Surat</p>
                                                            <input type="date" value={formFields.tanggal_surat_kemajuan}
                                                                onChange={(e) => handleFieldChange('tanggal_surat_kemajuan', e.target.value)} />
                                                        </div>
                                                        <div>
                                                            <h6 className="mb-3">Data Nota Pencairan Dana (NPD)</h6>
                                                            <p>No Surat</p>
                                                            <input type="text" value={formFields.no_surat_npd}
                                                                onChange={(e) => handleFieldChange('no_surat_npd', e.target.value)} />
                                                            <p>Tanggal Surat</p>
                                                            <input type="date" value={formFields.tanggal_surat_npd}
                                                                onChange={(e) => handleFieldChange('tanggal_surat_npd', e.target.value)} />
                                                            <p>Nama PPTK</p>
                                                            <select value={formFields.nama_pptk} onChange={handleNamaChangePptk}>
                                                                <option value="">--Pilih Pihak Pertama--</option>
                                                                {dataUser.map((udata, index) => (
                                                                    <option value={udata.nama_user}>{udata.nama_user}</option>
                                                                ))}
                                                            </select>
                                                            <p>NIP</p>
                                                            <input type="text" disabled value={formFields.nip_pptk} />
                                                            <p>Jabatan</p>
                                                            <input type="text" disabled value={formFields.jabatan_pptk} />
                                                            <p>Program</p>
                                                            <input type="text" value={formFields.program}
                                                                onChange={(e) => handleFieldChange('program', e.target.value)} />
                                                            <p>No. DPA</p>
                                                            <input type="text" value={formFields.no_dpa}
                                                                onChange={(e) => handleFieldChange('no_dpa', e.target.value)} />
                                                            <p>Anggaran</p>
                                                            <input type="number" value={formFields.anggaran}
                                                                onChange={(e) => handleFieldChange('anggaran', e.target.value)} />
                                                        </div>
                                                        <div>
                                                            <h6 className="mb-3">Data Kwitnasi</h6>
                                                            <p>Tanggal Surat</p>
                                                            <input type="date" value={formFields.tanggal_surat_kwitansi}
                                                                onChange={(e) => handleFieldChange('tanggal_surat_kwitansi', e.target.value)} />
                                                            <p>No. BKU</p>
                                                            <input type="text" value={formFields.no_bku}
                                                                onChange={(e) => handleFieldChange('no_bku', e.target.value)} />
                                                            <p>Diterima Dari</p>
                                                            <input type="text" value={formFields.terima_dari}
                                                                onChange={(e) => handleFieldChange('terima_dari', e.target.value)} />
                                                            <p>Nama Bendahara</p>
                                                            <select value={formFields.nama_bendahara} onChange={handleNamaChangeBendahara}>
                                                                <option value="">--Pilih Pihak Pertama--</option>
                                                                {dataUser.map((udata, index) => (
                                                                    <option value={udata.nama_user}>{udata.nama_user}</option>
                                                                ))}
                                                            </select>
                                                            <p>NIP</p>
                                                            <input type="text" disabled value={formFields.nip_bendahara} />
                                                        </div>
                                                    </section>
                                                </div>
                                                <span className="d-flex buttonBuatSurat justify-content-center">
                                                    <button type="button" className="btn-second" onClick={() => setShowForm(false)}>Batal</button>
                                                    <button type="submit" className="btn-primer">{editId ? "Update" : "Simpan"}</button>
                                                </span>
                                            </form>
                                        )}
                                    </div>
                                </Card> */}

                            </div>
                        )}
                    </div>

                    <TabelArsip dataSurat={dataSurat} onEdit={handleEdit} onDelete={handleDelete} setOpenSuccess={setOpenSuccess} />
            </div>

            <SuccessDialog open={openSuccess} message={message} setOpenSuccess={setOpenSuccess} setShow={setShow} />
        </Layout>
    )
}