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

export default function Template() {
    const router = useRouter();
    const [dataSurat, SetDataSurat] = useState([]);
    const [loading, setLoading] = useState(true);
    const { id } = router.query;

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

    function formatTanggalIndonesia(tanggalString) {
        const tanggal = new Date(tanggalString);
        return tanggal.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    }

    const totalPencairan = dataSurat.reduce((totalSemua, surat) => {
        const totalPencairanSurat = surat.rincianBelanja.reduce((subtotal, item) => {
            return subtotal + (Number(item.jumlah_harga) || 0);
        }, 0);
        return totalSemua + surat.jumlah_harga;
    }, 0);

    function formatCurrency(num) {
        if (!num) return "0";
        return Number(num).toLocaleString('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    }


    return (
        <>
            {dataSurat.map((value, index) => (
                <div className="template">
                    <button className="print-button" onClick={() => window.print()}>Cetak</button>
                    <div className="d-flex justify-content-center align-items-center">
                        <section className="me-5">
                            <img id="logo"
                                src="https://makassarkota.go.id/wp-content/uploads/2024/02/logo-makassarkota.png"
                                width="60" height="70" />
                        </section>
                        <section className="header">
                            <h4>PEMERINTAH KOTA MAKASSAR</h4>
                            <h2><strong>RSUD DAYA KOTA MAKASSAR</strong></h2>
                            <p><strong>Jl. Perintis Kemerdekaan KM. 14 Daya, Kec. Biringkanaya, Kota Makassar, Sulawesi Selatan 90243</strong></p>
                            <p><strong>Email :</strong>rsud.daya@makassarkota.go.id <strong>| Website : </strong>www.rsudkotamakassar.or.id</p>
                        </section>
                    </div>
                    <div style={{ marginBottom: '2px' }} className="hr2" />
                    <div className="hr1" />
                    <div className="mt-5">
                    </div>
                    <div className="">
                        <div className="d-flex title">
                            <h6 className="m-0"><b className="namaUpper">NOTA PENCAIRAN DANA (NPD)</b></h6>
                            <p className="m-0 text-uppercase">No : {value.no_surat_npd} </p>
                            <p className="m-0">Tanggal : {formatTanggalIndonesia(value.tanggal_surat_npd)}</p>
                        </div>
                        <div>
                            <div>
                                <section className="d-flex flex-direction-coloumn" style={{ paddingLeft: '30px' }}>
                                    <span className="w-25">
                                        <p className="mb-3 mt-3">Jenis NPD</p>
                                        <p>PPTK</p>
                                        <p>Program</p>
                                        <p>Kegiatan</p>
                                        <p>Sub Kegiatan</p>
                                        <p>No. DPA</p>
                                        <p>Tahun Anggaran</p>
                                    </span>
                                    <span className="w-75">
                                        <div className="d-flex mb-1 w-100 mt-0">
                                            <span className="w-25">: <b className="ogede">O</b>Tu</span>
                                            <span><b className="ogede">O</b>Ls</span>
                                        </div>
                                        <p>: {value.nama_pptk}</p>
                                        <p>: {value.program}</p>
                                        <p>: {value.kegiatan}</p>
                                        <p>: {value.sub_kegiatan}</p>
                                        <p>: {value.no_dpa}</p>
                                        <p>: {value.tahun_anggaran}</p>
                                    </span>
                                </section>
                            </div>

                            <div style={{ paddingLeft: '30px' }}>
                                <p>Rincian Belanja : </p>
                                <div className="w-100">
                                    <table className="w-100">
                                        <thead>
                                            <tr>
                                                <th>No</th>
                                                <th>Kode Rekening</th>
                                                <th>Uraian</th>
                                                <th>Anggaran</th>
                                                <th>Sisa Anggaran</th>
                                                <th>Pencairan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-start">
                                            <tr>
                                                <td>{index + 1}</td>
                                                <td>{value.kode_rek}</td>
                                                <td className="text-start ps-2">{value.uraian}</td>
                                                <td>{formatCurrency(value.anggaran)}</td>
                                                <td>{formatCurrency(value.anggaran - value.jumlah_harga)}</td>
                                                <td>{formatCurrency(value.jumlah_harga)}</td>
                                            </tr>
                                            <tr>
                                                <td colSpan='5' className="text-center"><strong>Jumlah</strong></td>
                                                <td>{formatCurrency(totalPencairan)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div className="d-flex footer">
                            <span className="names">
                                <div >
                                    <p className="text-center">Diesetujui oleh,</p>
                                    <p className="text-center">Pengguna Anggaran</p>
                                    <p className="text-center">(PA)</p>
                                </div>
                                <div>
                                    <p className="text-center namaUpper"><b>{value.nama_user}</b></p>
                                    <p className="text-center">Nip. {value.nip_user}</p>
                                </div>
                            </span>
                            <span className="names">
                                <div >
                                    <p className="text-center">Disiapkan oleh,</p>
                                    <p className="text-center">{value.jabatan_pptk}</p>
                                    <p className="text-center">(PPTK)</p>
                                </div>
                                <div>
                                    <p className="text-center namaUpper"><b>{value.nama_pptk}</b></p>
                                    <p className="text-center">Nip. {value.nip_pptk}</p>
                                </div>
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </>
    )
}