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
    const [dataSurat, SetDataSurat] = useState([]);
    const [loading, setLoading] = useState(true);
    const { id } = router.query;
    const tanggalSelected = (tgl) => tgl;
    const date = new Date(dataSurat[0]?.tanggal_surat_pemeriksaan);
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


    // const dates = tanggalSelected('2025-07-16');
    // console.log('dates', dates); // 👉 "2025-07-16"


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
                <div className="template">
                    <button className="print-button" onClick={() => window.print()}>Cetak</button>
                    <HeaderSurat logos='dinkes' />
                    <div className="">
                        <div>
                            <div className="d-flex title">
                                <h6 className="m-0 mB-0"><b className="namaUpper">BERITA ACARA KEMAJUAN III (KETIGA) PEKERJAAN</b></h6>
                                <p>Nomor : {value.no_surat_pemeriksaan} </p>
                            </div>
                            <div>
                                <div className="ps-5">
                                    <p>Pada hari ini <b>{hari}</b> tanggal <b>{tanggal}</b> bulan <b>{bulan}</b> tahun <b>{tahun} ({date.toLocaleDateString('id-ID')})</b>, kami yang bertanda tangan di bawah ini : </p>
                                    <ol>
                                        <li>
                                            <div className="d-flex ps-3">
                                                <span className="w-25">
                                                    <p>Nama</p>
                                                    <p>Jabatan</p>
                                                    <p>Berkedudukan</p>
                                                </span>
                                                <span>
                                                    <b>: {value.nama_user}</b>
                                                    <p>: {value.jabatan_user} Selaku {value.jawbatan_pemeriksa}</p>
                                                    <p>: {value.alamat_user}</p>
                                                </span>
                                            </div>
                                            <p className="ps-3">Selanjutnyta disebutkan "PIHAK PERTAMA"</p>
                                        </li>
                                        <li>
                                            <div className="d-flex ps-3">
                                                <span className="w-25">
                                                    <p>Nama</p>
                                                    <p>Jabatan</p>
                                                    <p>Berkedudukan</p>
                                                </span>
                                                <span>
                                                    <p>: {value.nama_kedua}</p>
                                                    <p>: {value.jabatan_kedua + " " + value.perusahaan_kedua}</p>
                                                    <p>: {value.alamat_kedua}</p>
                                                </span>
                                            </div>
                                            <p className="ps-3">Selanjutnyta disebutkan "PIHAK KEDUA"</p>
                                        </li>
                                    </ol>
                                </div>
                            </div>
                            <div className="ps-5">
                                <div className="ps-3 mb-4">
                                    <p>Kedua belah pihak : </p>
                                    <p>Telah menyetujui kemajuan Pekerjaan {value.uraian} selama bulan <b>Mei</b> Senilai {formatCurrency(value.jumlah_harga)} ({numberToWords(value.jumlah_harga)} Rupiah) dengan persentase realisasi senilai <b>65%</b> dan dapat mengajukan permintaan pembayaran selama Bulan <b>April</b> kemajuan berdasarkan Surar Pesanan Nomor : {value.no_surat_pemesanan} Tanggal {formatDate(value.tgl_terima)}</p>
                                </div>
                                <div className="ps-3"><p>Demikian Berita Acara Kemajuan Pekerjaan ini dibuat untuk menjadi bahan selanjutnya.</p></div>
                            </div>
                        </div>
                        <div className="d-flex footer">
                            <span className="names">
                                <div>
                                    <p className=""><b>PIHAK KEDUA</b></p>
                                    <p className="text-center"><b>{value.perusahaan_kedua}</b></p>
                                </div>
                                <div>
                                    <p className="namaUpper"><b>{value.nama_kedua}</b></p>
                                    <p className="text-nonbold">{value.jabatan_kedua}</p>
                                </div>
                            </span>
                            <span className="names">
                                <div>
                                    <p><b>PIHAK PERTAMA</b></p>
                                    <p><b>{value.jabatan_user}</b></p>
                                    <p><b>Selaku {value.jawbatan_pemeriksa}</b></p>
                                </div>
                                <div>
                                    <p className="namaUpper"><b>{value.nama_user}</b></p>
                                    <p>Nip. {value.nip_user}</p>
                                </div>
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </>
    )
}