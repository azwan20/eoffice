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
        return new Date(inputDate).toLocaleDateString('en-US', options);
    };

    const translateGender = (jk) => {
        if (!jk) return "-";
        const lower = jk.toLowerCase();
        if (lower === "laki-laki" || lower === "laki laki") return "Male";
        if (lower === "perempuan") return "Female";
        return jk;
    };

    const translateHasilNarkoba = (hasil) => {
        if (!hasil) return "-";
        const lower = hasil.toLowerCase().trim();
        if (lower === "tidak" || lower === "negatif" || lower === "tidak positif") return "NOT";
        if (lower === "positif") return "POSITIVE";
        if (lower.includes("tidak") || lower.includes("bebas") || lower.includes("negatif")) return "NOT";
        if (lower.includes("positif")) return "POSITIVE";
        return hasil;
    };

    const translateKepentingan = (kepentingan) => {
        if (!kepentingan) return "-";
        const lower = kepentingan.toLowerCase().trim();

        // Exact/specific phrase matches
        if (lower.includes("kelengkapan berkas pengurusan nidn")) return "DOCUMENT COMPLETION FOR NIDN (NATIONAL LECTURER ID) PROCESSING";
        if (lower.includes("kelengkapan berkas")) return "DOCUMENT COMPLETION";
        if (lower.includes("pengurusan nidn")) return "NIDN (NATIONAL LECTURER ID) PROCESSING";
        if (lower.includes("melamar pekerjaan") || lower.includes("lamaran kerja")) return "JOB APPLICATION";
        if (lower.includes("pekerjaan") || lower.includes("kerja")) return "EMPLOYMENT PURPOSE";
        if (lower.includes("pendidikan") || lower.includes("sekolah") || lower.includes("kuliah")) return "EDUCATIONAL PURPOSE";
        if (lower.includes("perjalanan") || lower.includes("travel")) return "TRAVEL PURPOSE";
        if (lower.includes("visa")) return "VISA APPLICATION";
        if (lower.includes("persyaratan") || lower.includes("syarat")) return "REQUIREMENT PURPOSE";
        if (lower.includes("pribadi") || lower.includes("personal")) return "PERSONAL PURPOSE";
        if (lower.includes("instansi") || lower.includes("lembaga")) return "INSTITUTIONAL PURPOSE";
        if (lower.includes("cpns") || lower.includes("pns")) return "CIVIL SERVANT APPLICATION";
        if (lower.includes("seleksi")) return "SELECTION PROCESS";
        if (lower.includes("pendaftaran")) return "REGISTRATION PURPOSE";
        if (lower.includes("administrasi")) return "ADMINISTRATIVE PURPOSE";
        if (lower.includes("pengurusan")) return "PROCESSING PURPOSE";
        if (lower.includes("keperluan dinas")) return "OFFICIAL PURPOSE";
        if (lower.includes("beasiswa")) return "SCHOLARSHIP APPLICATION";

        // General word-by-word fallback translation
        const wordMap = {
            "kelengkapan": "COMPLETION", "berkas": "DOCUMENT", "pengurusan": "PROCESSING",
            "persyaratan": "REQUIREMENT", "pendaftaran": "REGISTRATION", "keperluan": "PURPOSE",
            "administrasi": "ADMINISTRATION", "seleksi": "SELECTION", "lamaran": "APPLICATION",
            "pekerjaan": "EMPLOYMENT", "pendidikan": "EDUCATION", "dinas": "OFFICIAL",
            "surat": "CERTIFICATE", "keterangan": "STATEMENT", "bebas": "FREE",
            "narkoba": "DRUGS", "untuk": "FOR", "dan": "AND", "atau": "OR",
        };

        const words = lower.split(/\s+/);
        const translated = words.map(w => wordMap[w] || w.toUpperCase());
        return translated.join(" ");
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
                    <button className="print-button" onClick={() => window.print()}>Print</button>
                    <HeaderSurat />
                    <div className="px-5" style={{ lineHeight: '2', fontFamily: 'Times New Roman' }}>
                        <div>
                            <div className="d-flex title mb-4 mt-5">
                                <h6 className="mb-2"><b className="namaUpper" style={{ letterSpacing: '3px' }}>drug free certificate</b></h6>
                                <h6><b>No : {value.no_surat} </b></h6>
                            </div>
                            <div>
                                <div className="ps-5">
                                    <p style={{ fontSize: '14px' }}>
                                        I, the undersigned, {getNamaDokter(value.id_dokter)} a physician on duty at Makassar City Regional General Hospital, hereby declare, in accordance with my professional oath, that I have carefully examined the following individual:</p>
                                    <div className="d-flex" style={{ lineHeight: '3' }}>
                                        <span className="w-25">
                                            <p>Name</p>
                                            <p>Place/Date of Birth</p>
                                            <p>Gender</p>
                                            <p>Address</p>
                                        </span>
                                        <span className="text-uppercase">
                                            <p>: {value.nama_pasien}</p>
                                            <p>: {`${value.tempatlahir_pasien}, ${formatDate(value.tgllahir_pasien)}`}</p>
                                            <p>: {translateGender(value.jk_pasien)}</p>
                                            <p>: {value.alamat_pasien}</p>
                                        </span>
                                    </div>
                                    <p>Based on the examination conducted, the individual is hereby declared to be <strong className="text-uppercase">{translateHasilNarkoba(value.hasil_narkoba)}</strong> using narcotics, psychotropic substances, precursors, or other addictive substances at the time of examination.</p>
                                </div>
                            </div>
                            <div className="ps-5">
                                <p>This certificate is issued for the purpose of: : </p>
                                <div className="text-center my-3"><b className="text-uppercase">{translateKepentingan(value.kepentingan_surat)}</b></div>
                                <p>This certificate is made to be used as appropriately required.</p>
                            </div>
                        </div>
                        <div className="d-flex footer">
                            <span>

                            </span>
                            <span>
                                <div>
                                    <p className="text-end pe-5">Makassar, {formatDate(value.tanggal_surat)}</p>
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
                                        <p style={{ fontSize: '14px', marginBottom: '16px' }}>Laboratory Person in Charge: <span style={{ textDecoration: 'underline' }}>{getNamaDokter(value.id_dokter)}</span></p>
                                        <div className="d-flex" style={{ lineHeight: '3' }}>
                                            <span className="w-25">
                                                <p>Name</p>
                                                <p>Place/Date of Birth</p>
                                                <p>Gender</p>
                                                <p>Address</p>
                                            </span>
                                            <span className="text-uppercase">
                                                <p>: {value.nama_pasien}</p>
                                                <p>: {`${value.tempatlahir_pasien}, ${formatDate(value.tgllahir_pasien)}`}</p>
                                                <p>: {translateGender(value.jk_pasien)}</p>
                                                <p>: {value.alamat_pasien}</p>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="ps-5">
                                    <div className="text-center my-3"><strong>DRUG TEST RESULTS</strong></div>
                                    <table class="table" style={{ fontSize: '14px' }}>
                                        <thead>
                                            <tr>
                                                <th scope="col">No</th>
                                                <th scope="col">Type of Examination</th>
                                                <th scope="col">Result</th>
                                                <th scope="col">Reference Value</th>
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