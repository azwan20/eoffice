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

    // Hitung total harga dari semua surat & rincianBelanja
    const totalHarga = dataSurat.reduce((acc, surat) => {
        const subtotal = surat.rincianBelanja.map((sub, item) => {
            return (Number(sub.kuantitas) * Number(sub.harga_satuan) + Number(sub.ongkos_kirimR));
        }, 0);
        return subtotal;
    }, 0);

    // Hitung total bobot (kuantitasR * harga_satuanR * ongkos_kirimR)
    const totalBobot = dataSurat.reduce((acc, surat) => {
        const subtotal = surat.rincianBelanja.map((sub, item) => {
            return (Number(sub.kuantitasR) * Number(sub.harga_satuan) + Number(sub.ongkos_kirimR));
        }, 0);
        return subtotal;
    }, 0);

    const jumlahBobot = dataSurat.reduce((acc, surat) => {
        const subtotal = surat.rincianBelanja.reduce((sub, item) => {
            return sub + (Number(item.kuantitasR) * Number(item.harga_satuanR) + Number(item.ongkos_kirimR));
        }, 0);
        return acc + subtotal;
    }, 0);

    const sumBobot = dataSurat.reduce((acc, surat) => {
        const subtotal = surat.rincianBelanja.reduce((sub, item) => {
            return sub + (Number(item.kuantitasR) * Number(item.harga_satuanR) + Number(item.ongkos_kirimR));
        }, 0);
        return acc + subtotal;
    }, 0);


    return (
        <>
            {dataSurat.map((value) => (
                <div className="template">
                    <button className="print-button" onClick={() => window.print()}>Cetak</button>
                    <HeaderSurat logos='dinkes' />
                    <div className="">
                        <div className="d-flex title">
                            <h6 className="m-0 mB-0"><b className="namaUpper">BERITA ACARA PEMERIKSAAN PEKERJAAN</b></h6>
                            <p>Nomor : {value.no_surat_pemesanan} </p>
                        </div>
                        <div>
                            <div className="ps-5">
                                <p>Pada hari ini <b>{hari}</b> tanggal <b>{tanggal}</b> bulan <b>{bulan}</b> tahun <b>{tahun} ({date.toLocaleDateString('id-ID')})</b>, kami yang bertanda tangan di bawah ini : </p>

                                <div className="d-flex ps-5">
                                    <span className="w-25">
                                        <p>Nama</p>
                                        <p>Jabatan</p>
                                    </span>
                                    <span>
                                        <p>: {value.nama_user}</p>
                                        <p>: {value.jabatan_user}</p>
                                    </span>
                                </div>
                                <p>Telah memeriksa Barang/Pekerjaan yang diserahkan <b>{value.perusahaan_kedua}</b> berdasarkan Surat Pesanan Nomor : {value.no_surat_pemesanan} Tanggal {formatDate(value.tgl_terima)}, dengan rincian terlampir : </p>
                            </div>
                            <div>
                                <div className="w-100 pt-4">
                                    <table className="w-100">
                                        <thead>
                                            <tr>
                                                <th rowSpan={2}>No</th>
                                                <th rowSpan={2}>Nama</th>
                                                <th rowSpan={2}>Vol</th>
                                                <th rowSpan={2}>Kemasan</th>
                                                <th rowSpan={2}>Harga Satuan(Rp)</th>
                                                <th rowSpan={2}>Ongkos Kirim (Rp)</th>
                                                <th rowSpan={2}>Total Harga (Rp)</th>
                                                <th colspan={5}>Ralisasi</th>
                                                <th rowSpan={2}>Bobot Yang Masuk %</th>
                                                <th rowSpan={2}>Ket</th>
                                            </tr>
                                            <tr>
                                                <th>Kuantitas</th>
                                                <th>Harga Satuan(Rp)</th>
                                                <th>Ongkos Kirim (Rp)</th>
                                                <th>Total Harga (Rp)</th>
                                                <th>Bobot %</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-start">
                                            <tr className="text-start">
                                                <td></td>
                                                <td><b>{"(" + value.kode_rek + ")" + " " + value.uraian}</b></td>
                                                <td></td>
                                                <td></td>
                                                <td></td>
                                                <td></td>
                                                <td></td>
                                                <td></td>
                                                <td></td>
                                                <td></td>
                                                <td></td>
                                                <td></td>
                                                <td></td>
                                                <td></td>
                                            </tr>
                                            {value.rincianBelanja.map((item, index) => (
                                                <tr>
                                                    <td>{index + 1}</td>
                                                    <td>{item.nama_uraian}</td>
                                                    <td>{item.kuantitas}</td>
                                                    <td>{item.satuan}</td>
                                                    <td>{formatCurrency(item.harga_satuan)}</td>
                                                    <td>{formatCurrency(item.ongkos_kirimR)}</td>
                                                    <td>{formatCurrency(totalHarga[index])}</td>
                                                    <td>{item.kuantitasR}</td>
                                                    <td>{formatCurrency(item.harga_satuan)}</td>
                                                    <td>{formatCurrency(item.ongkos_kirimR)}</td>
                                                    <td>{formatCurrency(totalBobot[index])}</td>
                                                    <td>{((totalBobot[index] / totalHarga[index]) * 100).toFixed(2) + "%"}</td>
                                                    <td>{((totalBobot[index] / totalHarga[index]) * 100).toFixed(2) + "%"}</td>
                                                    <td>{item.keterangan == 'baik' ? '✓' : 'X'}</td>
                                                </tr>
                                            ))}
                                            <tr>
                                                <td colSpan='6' className="text-center"><strong>JUMLAH</strong></td>
                                                <td><b>{formatCurrency(totalPencairan)}</b></td>
                                                <td></td>
                                                <td></td>
                                                <td></td>
                                                <td><b>{formatCurrency(jumlahBobot)}</b></td>
                                                <td>{((jumlahBobot / totalPencairan) * 100).toFixed(2) + "%"}</td>
                                                <td>{((jumlahBobot / totalPencairan) * 100).toFixed(2) + "%"}</td>
                                                <td></td>
                                                <td></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="pembuka ps-5">
                            <p>Terbilang : <b><i>{terbilangRupiah(totalPencairan)} </i></b></p>
                            <p><i>(Harga di atas sudah temasuk pajak-pajak yang berlaku)</i></p>
                            <p className="my-3">&emsp; &emsp; &emsp; Barang/Bahan yang terdapat Baik diterima tanda (√), yang selanjutnya diserahkan oleh rekanan kepada Bendaharawan Barang, sedangkan yang tidak baik kami beri tanda (X) yang selankjutnya dikembalikan untuk diganti.</p>
                            <p>Demikian Berita Acara ini dibuat dengan sebenar-benarnya untuk dipergunakan sebagaimana mestinya.</p>
                        </div>
                        <div className="d-flex footer">
                            <span className="names">
                                <div className="mb-5">
                                    <p className="">Yang Menyerahkan</p>
                                    <p className="text-center"><b>{value.perusahaan_kedua}</b></p>
                                </div>
                                <div>
                                    <p className="namaUpper text-center"><b>{value.nama_kedua}</b></p>
                                    <p className="text-center">{value.jabatan_kedua}</p>
                                </div>
                            </span>
                            <span className="names">
                                <div className="mb-5">
                                    <p className="text-center">Yang Memeriksa</p>
                                    <p className="text-center"><b>{value.jabatan_user}</b></p>
                                    <p className="text-center"><b>Selaku Pejabat Pembuat Komitmen</b></p>
                                </div>
                                <div>
                                    <p className="namaUpper text-center"><b>{value.nama_user}</b></p>
                                    <p className="text-center">Nip. {value.nip_user}</p>
                                </div>
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </>
    )
}