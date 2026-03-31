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

export default function BeritaAcaraPembayaran() {
    const router = useRouter();
    const [dataSurat, SetDataSurat] = useState([]);
    const [loading, setLoading] = useState(true);
    const { id } = router.query;
    const perincian = [
        {
            nama: 'Jumlah Pembayaran sampai dengan angsuran ini',
            jumlah: 20000
        },
        {
            nama: 'Jumlah Pembayaran sampai dengan yang lalu',
            jumlah: 40000
        },
        {
            nama: 'Jumlah Pembayaran Angsuran sekarang sebelum pemotongan',
            jumlah: 40000
        },
        {
            nama: 'Jumlah Potongan-potongan',
            jumlah: 40000
        },
    ];

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
        return "Rp. " + Number(num).toLocaleString('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    }

    return (
        <>
            {dataSurat.map((value) => (
                <div className="template">
                    <button className="print-button" onClick={() => window.print()}>Cetak</button>
                    <HeaderSurat logos='dinkes' />
                    <div className="pembayaran">
                        <div>
                            <div className="d-flex title">
                                <h6 className="m-0 mB-0"><strong className="namaUpper">SURAT PERMOHONAN</strong></h6>
                                <p>Nomor : {value.no_surat_pemesanan} </p>
                            </div>
                            <div>
                                <div className="">
                                    <p className="ps-3">Pada hari ini <b></b> tanggal <b></b> bulan <b></b> tahun <b></b>, kami yang bertanda tangan di bawah ini : </p>
                                    <ol>
                                        <li>
                                            <div className="d-flex ps-2">
                                                <span className="w-25">
                                                    <p>Nama</p>
                                                    <p>Jabatan</p>
                                                    <p>Berkedudukan</p>
                                                </span>
                                                <span>
                                                    <b>: {value.nama_user}</b>
                                                    <p>: {value.jabatan_user}</p>
                                                    <p>: {value.alamat_user}</p>
                                                </span>
                                            </div>
                                            <p className="ps-2">Selanjutnyta disebutkan "PIHAK PERTAMA"</p>
                                        </li>
                                        <li>
                                            <div className="d-flex ps-2">
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
                                            <p className="ps-2">Selanjutnyta disebutkan "PIHAK KEDUA"</p>
                                        </li>
                                    </ol>
                                </div>
                            </div>
                            <div className="">
                                <div className="ps-3 mb-4">
                                    <p>Sehubungan dengan pelaksanaan kegiatan/keperluan pada Bagian Pelayanan Masyarakat, kami bermaksud mengajukan permohonan kepada Bagian Umum untuk dapat membantu dalam hal sebagai berikut:</p>
                                </div>
                            </div>
                        </div>

                        <div className="">
                            <div className="ps-3">
                                <ol>
                                    <li>
                                        <div className="d-flex ps-2">
                                            <span className="w-25">
                                                <p>Hari/tanggal</p>
                                            </span>
                                            <span>
                                                <p>: Jumat 20 Feb</p>
                                            </span>
                                        </div>
                               8     </li>
                                    <li>
                                        <div className="d-flex ps-2">
                                            <span className="w-25">
                                                <p>Waktu</p>
                                            </span>
                                            <span>
                                                <p>: 13:00-15:00</p>
                                            </span>
                                        </div>
                                    </li>
                                    <li>
                                        <div className="d-flex ps-2">
                                            <span className="w-25">
                                                <p>Tempat</p>
                                            </span>
                                            <span>
                                                <p>: Aula RS</p>
                                            </span>
                                        </div>
                                    </li>
                                    <li>
                                        <div className="d-flex ps-2">
                                            <span className="w-25">
                                                <p>Berita Acara Kemajuan III (Ketiga)</p>
                                            </span>
                                            <span>
                                                <p>: {"No." + " " + value.no_surat_pemesanan + " " + "Tanggal" + " " + formatDate(value.tgl_terima)}</p>
                                            </span>
                                        </div>
                                    </li>
                                </ol>
                            </div>
                        </div>

                        <div className="">
                            <div className="ps-3">
                                <p>Permohonan ini diajukan guna mendukung kelancaran pelaksanaan tugas dan pelayanan kepada masyarakat agar berjalan secara optimal dan sesuai dengan standar operasional yang berlaku di Rumah Sakit. Demikian surat permohonan ini kami sampaikan. Besar harapan kami agar permohonan ini dapat diproses dan direalisasikan sebagaimana mestinya. Atas perhatian dan kerja sama yang baik, kami ucapkan terima kasih. </p>
                            </div>
                        </div>

                        <div className="">
                            <div className="ps-3">
                                <p>Demikian Berita Acara dibuat dengan sebenarnya dan menjadi Sah setelah ditandatangani kedua belah pihak.</p>
                            </div>
                        </div>

                        <div className="d-flex footer">
                            <span className="names">
                                <div className="mb-5">
                                    <p className="text-center"><b>PIHAK KEDUA</b></p>
                                    <p className="text-center"><b>{value.perusahaan_kedua}</b></p>
                                </div>
                                <div>
                                    <p className="namaUpper text-center"><b>{value.nama_kedua}</b></p>
                                    <p className="text-center">{value.jabatan_kedua}</p>
                                </div>
                            </span>
                            <span className="names">
                                <div className="mb-5">
                                    <p className="text-center"><b>PIHAK PERTAMA</b></p>
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