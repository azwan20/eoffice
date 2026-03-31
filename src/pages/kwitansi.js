import { useRouter } from "next/router";
import Link from "next/link";
import { db } from "@/lib/firebaseConfig";
import React, { useEffect, useState } from "react";
import { getDocs, getDoc, collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, orderBy, query, where } from "firebase/firestore";
import HeaderSurat from "@/components/HeaderSurat";
import CetakPDF from "@/components/Cetak";

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
    const date = new Date(dataSurat[0]?.tgl_terima);
    const hari = getDayName(date);
    const tanggal = numberToWords(date.getDate());
    const bulan = getMonthName(date);
    const tahun = numberToWords(date.getFullYear());


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

    function terbilang(n) {
        const satuan = ["", "Satu", "Dua", "Tiga", "Empat", "Lima",
            "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];

        n = Math.floor(n);

        if (n < 12) return satuan[n];
        else if (n < 20) return terbilang(n - 10) + " Belas";
        else if (n < 100) return terbilang(Math.floor(n / 10)) + " Puluh " + terbilang(n % 10);
        else if (n < 200) return "Seratus " + terbilang(n - 100);
        else if (n < 1000) return terbilang(Math.floor(n / 100)) + " Ratus " + terbilang(n % 100);
        else if (n < 2000) return "Seribu " + terbilang(n - 1000);
        else if (n < 1000000) return terbilang(Math.floor(n / 1000)) + " Ribu " + terbilang(n % 1000);
        else if (n < 1000000000) return terbilang(Math.floor(n / 1000000)) + " Juta " + terbilang(n % 1000000);
        else if (n < 1000000000000) return terbilang(Math.floor(n / 1000000000)) + " Milyar " + terbilang(n % 1000000000);
        else if (n < 1000000000000000) return terbilang(Math.floor(n / 1000000000000)) + " Triliun " + terbilang(n % 1000000000000);
        else return "";
    }

    function terbilangRupiah(n) {
        if (!n || n === 0) return "";
        return terbilang(n).trim() + " Rupiah";
    }

    function formatCurrency(num) {
        if (!num) return "Rp 0";
        return Number(num).toLocaleString('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    }

    function numberToWords(num) {
        const satuan = [
            '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima',
            'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
        ];

        if (num < 12) return satuan[num];
        if (num < 20) return satuan[num - 10] + ' Belas';
        if (num < 100) {
            return satuan[Math.floor(num / 10)] + ' Puluh ' + satuan[num % 10];
        }
        if (num < 200) return 'Seratus ' + numberToWords(num - 100);
        if (num < 1000) {
            return satuan[Math.floor(num / 100)] + ' Ratus ' + numberToWords(num % 100);
        }
        if (num < 2000) return 'Seribu ' + numberToWords(num - 1000);
        if (num < 1000000) {
            return numberToWords(Math.floor(num / 1000)) + ' Ribu ' + numberToWords(num % 1000);
        }
        if (num < 1000000000) {
            return numberToWords(Math.floor(num / 1000000)) + ' Juta ' + numberToWords(num % 1000000);
        }
        return num; // fallback
    }

    // Ambil nama hari dalam bahasa Indonesia
    function getDayName(date) {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        return days[date.getDay()];
    }

    // Ambil nama bulan
    function getMonthName(date) {
        const months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        return months[date.getMonth()];
    }

    useEffect(() => {
        if (id && totalPencairan > 0) {
            const updateJumlahHarga = async () => {
                try {
                    const docRef = doc(db, "surat", id);
                    await updateDoc(docRef, {
                        jumlah_harga: totalPencairan,
                    });
                } catch (err) {
                    console.error("Gagal update jumlah_harga:", err);
                }
            };

            updateJumlahHarga();
        }
    }, [id, totalPencairan]);

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

    return (
        <>
            {dataSurat.map((value) => (
                <div className="template" style={{ height: '100vh' }}>
                    <button className="print-button" onClick={() => window.print()}>Cetak</button>
                    {/* <CetakPDF /> */}
                    <div className="h-100">
                        <div className="d-flex title">
                            <h6 className="m-0 mB-0"><b className="">KWITANSI</b></h6>
                        </div>

                        <table className="w-100 w-100" style={{ height: '90vh' }}>
                            <tr className="p-0">
                                <td className="position-relative text-center" rowSpan={2} style={{ width: '15%', height: '100%', borderStyle: 'double', borderWidth: '3px' }}>
                                    <section className="vertical position-absolute m-auto text-center" style={{ left: '-475px', top: '45%', width: '90vh' }}>
                                        <h3 className="mb-0">PEMERINTAH KOTA MAKASSAR</h3>
                                        <h4 className="my-2"><strong>DINAS KESEHATAN</strong></h4>
                                        <p><strong>Dinas Kesehatan Kota Makassar Jl. Teduh Bersinar No. 1 Makassar </strong></p>
                                    </section>
                                </td>

                                <td className="borderless d-flex m-0" style={{ width: '110%' }}>
                                    <div className="ps-1">
                                        <div className="d-flex">
                                            <span className="w-25">
                                                <p>TAHUN ANGGARAN</p>
                                            </span>
                                            <span>
                                                <p>: {value.tahun_anggaran}</p>
                                            </span>
                                        </div>
                                        <div className="d-flex">
                                            <span className="w-25">
                                                <p>KODE REKENING</p>
                                            </span>
                                            <span>
                                                <p>: {value.kode_rek}</p>
                                            </span>
                                        </div>
                                        <div className="d-flex">
                                            <span className="w-25">
                                                <p>BKU NO.</p>
                                            </span>
                                            <span>
                                                <p>: {value.no_bku}</p>
                                            </span>
                                        </div>
                                        <div className="d-flex">
                                            <span className="w-25">
                                                <p>TANGGAL</p>
                                            </span>
                                            <span>
                                                <p>: {formatDate(value.tanggal_surat_kwitansi)}</p>
                                            </span>
                                        </div>
                                        <div className="d-flex">
                                            <span className="w-25">
                                                <p>Sudah Terima Dari</p>
                                            </span>
                                            <span>
                                                <p className="text-uppercase">: {value.terima_dari}</p>
                                            </span>
                                        </div>
                                        <div className="d-flex">
                                            <span className="w-25">
                                                <p>Terbilang</p>
                                            </span>
                                            <span>
                                                <p className="ps-3">: {numberToWords(value.jumlah_harga)} Rupiah</p>
                                            </span>
                                        </div>
                                        <div className="d-flex w-100">
                                            <div className="" style={{ width: '160px' }}>
                                                <p style={{ width: '160px' }}>Untuk Pembayaran</p>
                                            </div>
                                            <div>
                                                <p>: {value.uraian} (). Pada Sub Kegiatan {value.sub_kegiatan} Kegiatan {value.kegiatan} Pada Rumah Sakit Umum Daerah Daya Kota Makassar Sesuai Surat Pesanan Nomor : {value.no_surat_pemesanan}. Tanggal {formatDate(value.tgl_terima)}, BA, Pemeriksaan Pekerjaan Nomor : {value.no_surat_pemeriksaan} Tanggal {formatDate(value.tanggal_surat_pemeriksaan)}, BA, Kemajuan III (Ketiga) Nomor : {value.no_surat_kemajuan} Tanggal {formatDate(value.tanggal_surat_kemajuan)}, BA, Pembayaran Nomor : {value.no_surat_pembayaran} Tanggal {formatDate(value.tanggal_surat_pembayaran)} </p>
                                            </div>
                                        </div>
                                        <div className="d-flex footer">
                                            <span className="names">
                                                <div className="mb-5">
                                                    <p className="text-center"><b>DIKETAHUI DISETUJUI</b></p>
                                                    <p className="text-center"><b>{value.terima_dari}</b></p>
                                                </div>
                                                <div>
                                                    <p className="namaUpper text-center"><b>{value.nama_user}</b></p>
                                                    <p className="text-center">Nip. {value.nip_user}</p>
                                                </div>
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-end pe-5 my-3">
                                            <p className="mb-0">Makassar, {formatDate(value.tanggal_surat_kwitansi)}</p>
                                        </div>
                                        <div className="d-flex footer">
                                            <span className="names">
                                                <div className="mb-5">
                                                    <p></p>
                                                    <p className="text-center"><b>Bendahara Pengeluaran</b></p>
                                                </div>
                                                <div>
                                                    <p className="namaUpper text-center"><b>{value.nama_bendahara}</b></p>
                                                    <p className="text-center">Nip. {value.nip_bendahara}</p>
                                                </div>
                                            </span>
                                            <span className="names">
                                                <div className="mb-5">
                                                    <p className="text-center"><b>Yang Menerima</b></p>
                                                    <p className="text-center"><b>{value.perusahaan_kedua}</b></p>
                                                </div>
                                                <div>
                                                    <p className="namaUpper text-center"><b>{value.nama_kedua}</b></p>
                                                    <p className="text-center">{value.jabatan_kedua}</p>
                                                </div>
                                            </span>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <p>Jumlah Uang</p>
                                </td>
                                <td> : </td>
                                <td>
                                    <p>Rp {formatCurrency(value.jumlah_harga)}</p>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            ))}
        </>
    )
}