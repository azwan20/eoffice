import { useRouter } from "next/router";
import Link from "next/link";
import { db } from "@/lib/firebaseConfig";
import React, { useEffect, useState } from "react";
import { getDocs, getDoc, collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, orderBy, query, where } from "firebase/firestore";
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

    const totalPencairan = dataSurat.reduce((totalSemua, surat) => {
        const totalPencairanSurat = surat.rincianBelanja.reduce((subtotal, item) => {
            return subtotal + (Number(item.kuantitas * item.harga_satuan) || 0);
        }, 0);
        return totalPencairanSurat;
    }, 0);

    function formatCurrency(num) {
        if (!num) return "Rp 0";
        return "Rp " + Number(num).toLocaleString('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    }


    return (
        <>
            {dataSurat.map((value, index) => (
                <div className="template">
                    <button className="print-button" onClick={() => window.print()}>Cetak</button>
                    <HeaderSurat logos='dinkes' />
                    <div className="">
                        <div className="d-flex title">
                            <h6 className="m-0 mb-0"><b className="namaUpper">DAFTAR PEMESANAN</b></h6>
                            <p>Nomor : {value.no_surat_pemesanan} </p>
                        </div>
                        <div>
                            <div>
                                <p> </p>
                                <section className="d-flex flex-direction-coloumn" style={{ paddingLeft: '30px' }}>
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
                                </section>
                            </div>

                            <div style={{ paddingLeft: '30px' }}>
                                <div className="w-100 pt-4">
                                    <table className="w-100">
                                        <thead>
                                            <tr>
                                                <th>NO</th>
                                                <th>URAIAN</th>
                                                <th>SATUAN</th>
                                                <th>KUANTITAS</th>
                                                <th>HARGA SATUAN(Rp)</th>
                                                <th>JUMALH (Rp)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-start">
                                            <tr className="text-center">
                                                <td>1</td>
                                                <td>2</td>
                                                <td>3</td>
                                                <td>4</td>
                                                <td>5</td>
                                                <td>6=5x4</td>
                                            </tr>
                                            <tr>
                                                <td className="text-center">1</td>
                                                <td>{value.uraian}</td>
                                                <td></td>
                                                <td></td>
                                                <td></td>
                                                <td>{formatCurrency(totalPencairan)}</td>
                                            </tr>
                                            {value.rincianBelanja.map((item, index) => (
                                                <tr>
                                                    <td></td>
                                                    <td>{item.nama_uraian}</td>
                                                    <td>{item.satuan}</td>
                                                    <td>{item.kuantitas}</td>
                                                    <td>{formatCurrency(item.harga_satuan)}</td>
                                                    <td>{formatCurrency(item.kuantitas * item.harga_satuan)}</td>
                                                </tr>
                                            ))}
                                            <tr>
                                                <td colSpan='5' className="text-center"><strong>JUMLAH</strong></td>
                                                <td>{formatCurrency(totalPencairan)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div className="d-flex footer justify-content-end pe-5">
                            <span className="names">
                                <div className="mb-5">
                                    <p className="">Makassar, {formatDate(value.tgl_terima)},</p>
                                    <p className=""><strong>{value.perusahaan_kedua}</strong></p>
                                    <p className=""><strong>Selaku {value.jabatan_kedua}</strong></p>
                                </div>
                                <div>
                                    <p className="namaUpper"><b>{value.nama_user}</b></p>
                                    <p className=""><strong>Nip. {value.nip_user}</strong></p>
                                </div>
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </>
    )
}