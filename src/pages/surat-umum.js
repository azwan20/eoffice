import { useRouter } from "next/router";
import Link from "next/link";
import { db } from "@/lib/firebaseConfig";
import React, { useEffect, useState } from "react";
import { getDoc, collection, doc, onSnapshot } from "firebase/firestore";
import HeaderSurat from "@/components/HeaderSurat";

async function fetchData_ModelTransaksi(id) {
    const docRef = doc(db, "surat", id);
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
        const data = { id: docSnapshot.id, ...docSnapshot.data() };
        return [data];
    } else {
        return [];
    }
}

export default function TemplateSuratUmum() {
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

            // ambil dokter (penanda tangan 1)
            if (surat.id_dokter) {
                const docRef = doc(db, "user", surat.id_dokter);
                const snap = await getDoc(docRef);
                if (snap.exists()) setDokter(snap.data());
            }

            // ambil kabag (penanda tangan 2)
            if (surat.id_kabag) {
                const docRef = doc(db, "user", surat.id_kabag);
                const snap = await getDoc(docRef);
                if (snap.exists()) setKabag(snap.data());
            }

            setLoading(false);
        }

        fetchData();
    }, [id]);

    const formatDate = (inputDate) => {
        if (!inputDate) return "-";
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(inputDate).toLocaleDateString('id-ID', options);
    };

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
                <div key={index} className="template">
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
                                        <p>Perihal</p>
                                    </span>
                                    <span style={{ paddingLeft: '120px' }}>
                                        <p>: {value.no_surat || "-"}</p>
                                        <p>: {value.perihal_surat || "-"}</p>
                                    </span>
                                </section>
                            </div>

                            <div>
                                <p> </p>
                                <section className="" style={{ paddingLeft: '30px' }}>
                                    <p>Yth. {value.kepada_surat || "-"}</p>
                                    <p>Di-</p>
                                    <p className="mb-3">&emsp; &emsp; &emsp; Tempat</p>
                                    {value.isi_surat_custom && (
                                        <p className="mb-3">Dengan hormat,</p>
                                    )}
                                </section>
                            </div>

                            <div>
                                <section className="" style={{ paddingLeft: '30px', paddingRight: '30px' }}>
                                    <p style={{ whiteSpace: 'pre-wrap', textAlign: 'justify' }}>&emsp; &emsp; &emsp; {value.isi_surat_custom}</p>
                                    <br />
                                    <p>Demikian surat ini disampaikan, atas perhatian dan kerjasamanya kami ucapkan terima kasih.</p>
                                </section>
                            </div>

                        </div>
                        <div className="d-flex footer mt-5" style={{ justifyContent: (!dokter || !kabag) ? 'flex-end' : 'space-between' }}>
                            {dokter && (
                                <span className="names">
                                    <div className="mb-5">
                                        <p className="text-center text-uppercase"><b>{dokter.jabatan_user || "-"}</b></p>
                                    </div>
                                    {value.ttd_dokter && (
                                        <div className="text-center mb-2">
                                            <img src={value.ttd_dokter} alt="TTD" style={{ height: '60px', objectFit: 'contain', margin: '0 auto' }} />
                                        </div>
                                    )}
                                    <div>
                                        <p className="namaUpper text-center"><b>{dokter.nama_user || "-"}</b></p>
                                        <p className="text-center">Pangkat/Gol : {dokter.pangkat_gol_user || "-"}</p>
                                        <p className="text-center">Nip. {dokter.nip_user || "-"}</p>
                                    </div>
                                </span>
                            )}
                            {kabag && (
                                <span className="names" style={!dokter ? { marginLeft: 'auto' } : {}}>
                                    <div className="mb-5">
                                        <p className="text-center text-uppercase"><b>{kabag.jabatan_user || "-"}</b></p>
                                    </div>
                                    {value.ttd_kabag && (
                                        <div className="text-center mb-2">
                                            <img src={value.ttd_kabag} alt="TTD" style={{ height: '60px', objectFit: 'contain', margin: '0 auto' }} />
                                        </div>
                                    )}
                                    <div>
                                        <p className="namaUpper text-center"><b>{kabag.nama_user || "-"}</b></p>
                                        <p className="text-center">Pangkat/Gol : {kabag.pangkat_gol_user || "-"}</p>
                                        <p className="text-center">Nip. {kabag.nip_user || "-"}</p>
                                    </div>
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </>
    )
}
