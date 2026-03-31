import { useRouter } from "next/router";
import Link from "next/link";
import { db } from "@/lib/firebaseConfig";
import React, { useEffect, useState } from "react";
import { getDocs, getDoc, collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";

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

useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        router.push("/"); // belum login
        return;
    }

    if (user.role !== "admin") {
        router.push("/"); // bukan admin, redirect ke home
    }
}, [router]);

export default function Template() {
    const router = useRouter();
    const { id } = router.query;
    const [dataSurat, SetDataSurat] = useState([]);
    const [dataSuratMasuk, SetDataSuratMasuk] = useState([]);
    const [dataSuratKeluar, SetDataSuratKeluar] = useState([]);


    console.log("id", id);

    useEffect(() => {
        async function fetchData() {
            if (id) {
                const data = await fetchData_ModelTransaksi(id);

                const sortedData = data.sort((a, b) => new Date(b.tanggal_surat) - new Date(a.tanggal_surat));
                SetDataSurat(data);

                if (data.length > 0) {

                    // Pisahkan data berdasarkan jenis surat
                    const suratMasuk = data.filter((surat) => surat.jenis_surat === "surat masuk");
                    const suratKeluar = data.filter((surat) => surat.jenis_surat === "surat keluar");

                    SetDataSuratMasuk(suratMasuk);
                    SetDataSuratKeluar(suratKeluar);
                }
            }
        }
        fetchData();
    }, [id]);

    const currentDate = new Date();

    const formatDate = (inputDate) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(inputDate).toLocaleDateString('id-ID', options);
    };

    return (
        <>
            {dataSuratMasuk.map((value) => (
                <div className="template">
                    <button className="print-button" onClick={() => window.print()}>Cetak</button>
                    <div className="d-flex flex-row header">
                        <span style={{ marginRight: '30px' }}>
                            <img id="logo"
                                src="https://www.datalpse.com/files/images/kldi/6311a2a15978e_300x300.png"
                                width="70" height="85" />
                        </span>
                        <span >
                            <h4>PEMERINTAH KABUPATEN LUWU UTARA</h4>
                            <h4><strong>KECAMATAN MALANGKE BARAT</strong></h4>
                            <h4><strong>DESA PAO</strong></h4>
                            <p style={{ fontSize: '10px', textAlign: 'center' }}>Dusun Amassangan II Desan Pao Kec. Malangke Barat Kab. Luwu Utara Kode Pos:92957</p>
                        </span>
                    </div>
                    <div style={{ marginBottom: '2px' }} className="hr2" />
                    <div className="hr1" />
                    <div className="">
                        <div className="d-flex title">
                            <b>SURAT TUGAS</b>
                            <div className="hr2" />
                            <p>Nomor : {value.no_surat} </p>
                        </div>
                        <div>
                            <div>
                                <p>Yang bertanda tangan di bawah ini : </p>
                                <section className="d-flex flex-direction-coloumn">
                                    <span>
                                        <p>Nama</p>
                                        <p>Nip</p>
                                        <p>Jabatan</p>
                                    </span>
                                    <span style={{ paddingLeft: '60px' }}>
                                        <p>: {value.nama_penanggungJawab}</p>
                                        <p>: {value.nip_penanggungJawab}</p>
                                        <p>: {value.jabatan_penanggungJawab}</p>
                                    </span>
                                </section>
                                <p style={{ margin: '15px', textAlign: 'center' }}>MENUGASKAN</p>
                            </div>
                            <div>
                                <p>Kepada :</p>
                                <section className="d-flex flex-direction-coloumn" style={{ paddingLeft: '100px' }}>
                                    <span>
                                        <p>Nama</p>
                                        <p>Nip</p>
                                        <p>Jabatan</p>
                                    </span>
                                    <span style={{ paddingLeft: '50px' }}>
                                        <p>: {value.nama} </p>
                                        <p>: {value.jabatan_penerima} </p>
                                        <p>: {value.alamat} </p>
                                    </span>
                                </section>
                            </div>
                        </div>
                        <p>Untuk :</p>
                        <div className="pembuka" style={{ paddingLeft: '100px' }}>
                            <p>Dalam rangka {value.isi_surat} </p>
                        </div>
                        <div className="d-flex footer">
                            <span>
                                {/* <p>Yang bermohon</p>
                                <p><b>{value.nama}</b></p> */}
                            </span>
                            <span>
                                <div className="names">
                                    <p>Ditetapkan : {value.nama_desa}</p>
                                    <p>Pada tanggal, {formatDate(currentDate)}</p>
                                    <p><b>a.n Kepala Desa Pao</b></p>
                                    <p style={{ textAlign: 'left' }}>{value.jabatan_penanggungJawab}</p>
                                </div>
                                <div>
                                    <p style={{ textAlign: 'left' }}><b>{value.nama_penanggungJawab}</b></p>
                                    <hr style={{ margin: '0' }} />
                                    <p style={{ textAlign: 'left' }}>Nip: {value.nip_penanggungJawab} </p>
                                </div>
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </>
    )
}