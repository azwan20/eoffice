import { useRouter } from "next/router";
import Link from "next/link";
import { db } from "@/lib/firebaseConfig";
import React, { useEffect, useState } from "react";
import { getDocs, getDoc, collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, serverTimestamp, orderBy, query, where } from "firebase/firestore";
import HeaderSurat from "@/components/HeaderSurat";

async function fetchData_ModelTransaksi(id) {
    const docRef = doc(db, "surat", id);
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
        const data = { id: docSnapshot.id, ...docSnapshot.data() };
        return [data];
    } else {
        // Handle case where the document doesn't exist
        return [];
    }
}

export default function SuratKetBebasNarkoba() {
    const router = useRouter();
    const [dataSurat, SetDataSurat] = useState([]);
    const [dataUser, setDataUser] = useState([]);
    const { id } = router.query;
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (id) {
                const data = await fetchData_ModelTransaksi(id);

                SetDataSurat(data);
            }
        }
        fetchData();
    }, [id]);

    const currentDate = new Date();

    const formatDate = (inputDate) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(inputDate).toLocaleDateString('id-ID', options);
    };

    function formatCurrency(num) {
        if (!num) return "Rp 0";
        return "Rp " + Number(num).toLocaleString('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    }

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "user"), (snapshot) => {
            const users = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }));

            setDataUser(users);
        });

        return () => unsubscribe();
    }, []);

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

    const getNamaDokter = (id) => {
        const user = dataUser.find((u) => u.id === id);
        return user ? user.nama_user : "-";
    };

    console.log('datauserss', dataUser);
    return (
        <>
            {dataSurat.map((value) => (
                <div className="template">
                    <button className="print-button" onClick={() => window.print()}>Cetak</button>
                    <HeaderSurat />
                    <div className="px-5" style={{ lineHeight: '2', fontFamily: 'Times New Roman' }}>
                        <div>
                            <div className="d-flex title mb-4 mt-5">
                                <h6 className="mb-2"><b className="namaUpper" style={{ letterSpacing: '3px' }}>SURAT KETERANGAN BEBAS NARKOBA</b></h6>
                                <h6><b>No : {value.no_surat} </b></h6>
                            </div>
                            <div>
                                <div className="ps-5">
                                    <p style={{ fontSize: '14px' }}>Yang  bertanda tangan di bawah ini {getNamaDokter(value.id_dokter)} adalah Dokter  yang bertugas di RSUD Kota Makassar, dalam hal ini menjalankan tugas dengan mengingat sumpah yang telah diucapkan waktu menerima jabatan menerangkan bahwa ia telah memeriksa dengan teliti kepada : </p>
                                    <div className="d-flex" style={{ lineHeight: '3' }}>
                                        <span className="w-25">
                                            <p>Nama</p>
                                            <p>Tempat/Tgl. Lahir</p>
                                            <p>Jenis Kelain</p>
                                            <p>Alamat</p>
                                        </span>
                                        <span className="text-uppercase">
                                            <p>: {value.nama_pasien}</p>
                                            <p>: {`${value.tempatlahir_pasien}, ${formatDate(value.tgllahir_pasien)}`}</p>
                                            <p>: {value.jk_pasien}</p>
                                            <p>: {value.alamat_pasien}</p>
                                        </span>
                                    </div>
                                    <p>Setelah yang bersangkutan diperiksa, dinyatakan pada saat ini <strong className="text-uppercase">{value.hasil_narkoba}</strong> menggunakan Narkotika, Psikotropika, Prekursor dan zat adiktif lainnya.</p>
                                </div>
                            </div>
                            <div className="ps-5">
                                <p>Surat keterangan ini di berikan untuk : </p>
                                <div className="text-center my-3"><b className="text-uppercase">{value.kepentingan_surat}</b></div>
                                <p>Demikian keterangan ini diberikan untuk dipergunakan sebagaimana mestinya.</p>
                            </div>
                        </div>
                        <div className="d-flex footer">
                            <span>

                            </span>
                            <span>
                                <div>
                                    <p className="text-end pe-5">Makassar, {formatDate(value.tanggal_surat)}</p>
                                    <p className="text-center mt-2"><b>Dokter Pemeriksa</b></p>
                                    {value.ttd_dokter && (
                                        <div className="text-center my-2">
                                            <img src={value.ttd_dokter} alt="TTD" style={{ height: '60px', objectFit: 'contain', margin: '0 auto' }} />
                                        </div>
                                    )}
                                    <p className="namaUpper text-center"><b>{getNamaDokter(value.id_dokter)}</b></p>
                                </div>
                            </span>
                        </div>
                    </div>

                    <div className="page-break"></div>

                    <div>
                        <HeaderSurat />
                        <div className="px-5" style={{ lineHeight: '2', fontFamily: 'Times New Roman' }}>
                            <div className="py-5">
                                <div>
                                    <div className="ps-5">
                                        <p style={{ fontSize: '14px', marginBottom: '16px' }}>Penanggung Jawab  Laboratorium : <span style={{ textDecoration: 'underline' }}>{getNamaDokter(value.id_dokter)}</span></p>
                                        <div className="d-flex" style={{ lineHeight: '3' }}>
                                            <span className="w-25">
                                                <p>Nama</p>
                                                <p>Tempat/Tgl. Lahir</p>
                                                <p>Jenis Kelain</p>
                                                <p>Alamat</p>
                                            </span>
                                            <span className="text-uppercase">
                                                <p>: {value.nama_pasien}</p>
                                                <p>: {`${value.tempatlahir_pasien}, ${formatDate(value.tgllahir_pasien)}`}</p>
                                                <p>: {value.jk_pasien}</p>
                                                <p>: {value.alamat_pasien}</p>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="ps-5">
                                    <div className="text-center my-3"><strong>PEMERIKSAAN NARKOBA</strong></div>
                                    <table class="table" style={{ fontSize: '14px' }}>
                                        <thead>
                                            <tr>
                                                <th scope="col">No</th>
                                                <th scope="col">Jenis Pemerikassan</th>
                                                <th scope="col">Hasil</th>
                                                <th scope="col">Nilai Rujukan</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td scope="row">1</td>
                                                <td>AMP</td>
                                                <td>{value.amp}</td>
                                                <td>{value.amp?.split(" ")[0]}</td>
                                            </tr>
                                            <tr>
                                                <td scope="row">2</td>
                                                <td>THC</td>
                                                <td>{value.thc}</td>
                                                <td>{value.thc?.split(" ")[0]}</td>
                                            </tr>
                                            <tr>
                                                <td scope="row">3</td>
                                                <td>MOP</td>
                                                <td>{value.mop}</td>
                                                <td>{value.mop?.split(" ")[0]}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            ))}
        </>
    )
}