import { useRouter } from "next/router";
import Link from "next/link";
import { db } from "@/lib/firebaseConfig";
import React, { useEffect, useState } from "react";
import { getDocs, getDoc, collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
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

export default function Template() {
    const router = useRouter();
    const { id } = router.query;
    const [dataSurat, SetDataSurat] = useState([]);
    const [dataSuratMasuk, SetDataSuratMasuk] = useState([]);
    const [dataSuratKeluar, SetDataSuratKeluar] = useState([]);

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

                    SetDataSuratMasuk(data);
                    SetDataSuratKeluar(data);
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

    function formatTanggalIndonesia(tanggalString) {
        const tanggal = new Date(tanggalString);
        return tanggal.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    }

    return (
        <>
            {dataSuratKeluar.map((value) => (
                <div className="template">
                    <button className="print-button" onClick={() => window.print()}>Cetak</button>
                    <HeaderSurat />
                    <div className="mt-5">
                        {/* <div className="d-flex title">
                            <b>SURAT KETERANGAN USAHA</b>
                            <div className="hr2" />
                            <p>Nomor : {value.no_surat} </p>
                        </div> */}
                        <div>
                            <div className="d-flex align-items-center justify-content-between">
                                {/* <p>Yang bertanda tangan di bawah ini : </p> */}
                                <section className="d-flex flex-direction-coloumn " style={{ paddingLeft: '30px' }}>
                                    <span>
                                        <p>Nomor</p>
                                        <p>Lampiran</p>
                                        <p>Perihal</p>
                                    </span>
                                    <span style={{ paddingLeft: '80px' }}>
                                        <p className="text-uppercase">: {value.no_surat_spm}</p>
                                        <p>: 1 Rangkap</p>
                                        <p>: <strong>{value.perihal}</strong> </p>
                                    </span>
                                </section>
                                <section className="" style={{ paddingLeft: '30px' }}>
                                    <p>&emsp; &emsp;Makassar, {formatTanggalIndonesia(value.tanggal_surat_spm)}</p>
                                    <p>Yth <strong>{value.namaPenerima}</strong></p>
                                    <p>&emsp; &emsp; &emsp; &emsp;Di -</p>
                                    <p>&emsp; &emsp; &emsp; &emsp; &emsp; &emsp;<strong>Makassar</strong></p>
                                </section>
                                {/* <p>Menerangkan dengan sebenarnya bahwa : </p> */}
                            </div>
                        </div>
                        <div className="penutup" style={{ paddingLeft: '180px', paddingRight: '30px' }}><p>&emsp; &emsp; &emsp; Dengan Hormat,</p></div>
                        <div className="pembuka" style={{ paddingLeft: '180px', paddingRight: '30px' }}><p>&emsp; &emsp; &emsp; Bersama ini kamu mohon untuk penerbita SPM untuk pembayaran <b>{value.isi_surat}</b> pada Sub kegiatan Operasional Pelayanan Rumah Sakit, karena telah sesuai dengan peraturan perundang-undangan yang berlaku dan dinyatakan lengkap dan sah.</p>
                        </div>
                        <div className="penutup" style={{ paddingLeft: '180px', paddingRight: '30px' }}><p>&emsp; &emsp; &emsp; Demikian kami sampaikan untuk dilaksanakan sebagaimana mestinya.</p></div>
                        <div className="d-flex footer">
                            <span>
                            </span>
                            <span className="names">
                                <div >
                                    <p className="text-center"><strong>Mengetahui,</strong></p>
                                    <p className="text-center"><strong>{value.jabatan_spm}</strong></p>
                                </div>
                                <div>
                                    <p className="namaUpper text-center"><b>{value.nama_spm}</b></p>
                                    <p className="text-center">Nip. {value.nip_spm}</p>
                                </div>
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </>
    )
}   