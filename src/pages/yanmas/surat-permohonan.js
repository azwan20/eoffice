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

export default function Template() {
    const router = useRouter();
    const [dataSurat, SetDataSurat] = useState([]);
    const [dataUser, setDataUser] = useState([]);
    const [dokter, setDokter] = useState(null);
    const [kabag, setKabag] = useState(null);
    const { id } = router.query;
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (!id) return;

            const data = await fetchData_ModelTransaksi(id);
            SetDataSurat(data);

            const surat = data[0];

            if (!surat) return;

            // ambil dokter
            if (surat.id_dokter) {
                const docRef = doc(db, "user", surat.id_dokter);
                const snap = await getDoc(docRef);
                if (snap.exists()) setDokter(snap.data());
            }

            // ambil kabag
            if (surat.id_kabag) {
                const docRef = doc(db, "user", surat.id_kabag);
                const snap = await getDoc(docRef);
                if (snap.exists()) setKabag(snap.data());
            }

            setLoading(false);
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

    return (
        <>
            {dataSurat.map((value, index) => (
                <div className="template">
                    <button className="print-button" onClick={() => window.print()}>Cetak</button>
                    <HeaderSurat logos='' />
                    <div className="my-5">
                        <p className="text-end pe-5">Makassar, {formatDate(value.tanggal_surat)}</p>
                    </div>
                    <div className="">
                        <div>
                            <div>
                                <p> </p>
                                <section className="d-flex flex-direction-coloumn pb-4" style={{ paddingLeft: '30px' }}>
                                    <span>
                                        <p>Nomor</p>
                                        <p>Lampiran</p>
                                        <p>Perihal</p>
                                    </span>
                                    <span style={{ paddingLeft: '120px' }}>
                                        <p>: {value.no_surat}</p>
                                        <p>: {value.lampiran_surat} </p>
                                        <p>: {value.perihal_surat}</p>
                                    </span>
                                </section>
                                {/* <section className="d-flex flex-direction-coloumn" style={{ paddingLeft: '30px' }}>
                                    <span>
                                        <p>Daerah</p>
                                        <p>Nama Kegiatan</p>
                                        <p>Nama Sub Kegiatan</p>
                                        <p>Kode Rekening</p>
                                        <p>Uraian</p>
                                        <p>Penyedia</p>
                                        <p>Tanggal Barang Diterima</p>
                                        <p>Tahun Anggaran</p>
                                    </span>
                                    <span style={{ paddingLeft: '120px' }}>
                                        <p>: {value.daerah}</p>
                                        <p>: {value.kegiatan} </p>
                                        <p>: {value.sub_kegiatan}</p>
                                        <p>: {value.kode_rek}</p>
                                        <p>: {value.uraian} </p>
                                        <p>: {value.perusahaan_kedua}</p>
                                        <p>: {formatDate(value.tgl_terima)}</p>
                                        <p>: {value.tahun_anggaran}</p>
                                    </span>
                                </section> */}
                            </div>

                            <div>
                                <p> </p>
                                <section className="" style={{ paddingLeft: '30px' }}>
                                    <p>Yth. Plt Direktur</p>
                                    <p>RSUD DAYA KOTA MAKSSAR</p>
                                    <p>Di-</p>
                                    <p className="mb-3">&emsp; &emsp; &emsp; Tempat</p>
                                    <p className="mb-3">&emsp; &emsp; &emsp; Dengan hormat,</p>
                                </section>
                            </div>

                            <div>
                                <section className="" style={{ paddingLeft: '30px' }}>
                                    <p>&emsp; &emsp; &emsp; Untuk Upaya Peningkatan mutu palayanan Rumah Sakit yang dilakukan dengan membangun sistem dan budaya mutu terhadap kegiatan pelayanan dan sarana fisik, baik berupa dokumen maupun fssilitas dan peralatan
                                        di RSUD Daya Kota Makassar, dengan ini kami memohon permintaan <strong>"{value.isi_surat}"</strong></p>
                                    <p>Demikian permohonan kami, atas perhatian dan kerjasamanya kami ucapkan terima kasih</p>
                                </section>
                            </div>


                        </div>
                        <div className="d-flex footer">
                            <span className="names">
                                <div className="mb-5">
                                    <p className="text-center text-uppercase"><b>{dokter?.unit_kerja || "-"}</b></p>
                                </div>
                                {value.ttd_dokter && (
                                    <div className="text-center mb-2">
                                        <img src={value.ttd_dokter} alt="TTD" style={{ height: '60px', objectFit: 'contain', margin: '0 auto' }} />
                                    </div>
                                )}
                                <div>
                                    <p className="namaUpper text-center"><b>{dokter?.nama_user || "-"}</b></p>
                                    <p className="text-center">Pangkat/Gol : {dokter?.pangkat_gol_user}</p>
                                    <p className="text-center">Nip. {dokter?.nip_user || "-"}</p>
                                </div>
                            </span>
                            <span className="names">
                                <div className="mb-5">
                                    <p className="text-center text-uppercase"><b>{kabag?.unit_kerja || "-"}</b></p>
                                </div>
                                {value.ttd_kabag && (
                                    <div className="text-center mb-2">
                                        <img src={value.ttd_kabag} alt="TTD" style={{ height: '60px', objectFit: 'contain', margin: '0 auto' }} />
                                    </div>
                                )}
                                <div>
                                    <p className="namaUpper text-center"><b>{kabag?.nama_user || "-"}</b></p>
                                    <p className="text-center">Pangkat/Gol : {kabag?.pangkat_gol_user}</p>
                                    <p className="text-center">Nip. {kabag?.nip_user || "-"}</p>
                                </div>
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </>
    )
}