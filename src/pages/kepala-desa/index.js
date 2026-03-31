import { useEffect, useState } from "react";
import SekretarisAside from "./sekretarisAside";
import { db } from "@/lib/firebaseConfig";
import { getDocs, collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import Link from "next/link";
import { CircularProgress } from "@mui/material";

async function fetchDataFromFirestore() {
    const querySnapshot = await getDocs(collection(db, "surat"));

    const data = [];

    querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
    });
    return data;
}

export default function Home() {
    const [dataSurat, SetDataSurat] = useState([]);
    const [dataSuratMasuk, SetDataSuratMasuk] = useState([]);
    const [dataSuratKeluar, SetDataSuratKeluar] = useState([]);
    const router = useRouter();
    const [Islogin, setIslogin] = useState();

    useEffect(() => {
        async function fetchData() {
            const data = await fetchDataFromFirestore();
            SetDataSurat(data);

            // Pisahkan data berdasarkan jenis surat
            const suratMasuk = data.filter((surat) => surat.jenis_surat === "surat masuk");
            const suratKeluar = data.filter((surat) => surat.jenis_surat === "surat keluar");

            SetDataSuratMasuk(suratMasuk);
            SetDataSuratKeluar(suratKeluar);
        }

        const isLogins = localStorage.getItem('isLogin')
        if (!isLogins) {
            router.push('/sekretaris');
        } else {
            setIslogin(isLogins);
        }

        fetchData();
    }, []);

    if (!Islogin) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
            }}>
                <CircularProgress />
            </div>
        );
    }

    const onLogout = () => {
        // const isLogin = localStorage.getItem('isLogin');
        // if (isLogin === "true") {
        //     localStorage.setItem("isLogin", false);
        // }
        localStorage.removeItem("isLogin");
    }

    return (
        <>
            <div className="sekretaris d-flex">
                <SekretarisAside />
                <article style={{ maxHeight: '100vh', overflowY: 'auto' }}>
                    <div className="d-flex align-items-center justify-content-between p-2 title-mobile">
                        <img className="imgProfile" src="https://upload.wikimedia.org/wikipedia/commons/b/bc/Luwu_Utara_Logo_%28North_Luwu%29.png" alt="Profile" width={55} height={70} />
                        <h3 className="imgProfile" style={{ textAlign: 'center', margin: 'auto' }}>Kantor Desa Pao</h3>
                        <Link href="/sekretaris">
                            <button className='logout imgProfile' onClick={onLogout}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none">
                                    <path d="M1.66667 15C1.20833 15 0.816111 14.8369 0.49 14.5108C0.163889 14.1847 0.000555556 13.7922 0 13.3333V1.66667C0 1.20833 0.163333 0.816111 0.49 0.49C0.816667 0.163889 1.20889 0.000555556 1.66667 0H6.66667C7.1269 0 7.5 0.373096 7.5 0.833333C7.5 1.29357 7.1269 1.66667 6.66667 1.66667H1.66667V13.3333H6.66667C7.1269 13.3333 7.5 13.7064 7.5 14.1667C7.5 14.6269 7.1269 15 6.66667 15H1.66667ZM11.4377 11.0623C11.1065 11.3935 10.5675 11.3863 10.2452 11.0465C9.93483 10.7192 9.94166 10.2042 10.2606 9.88521L11.8125 8.33333H5.83333C5.3731 8.33333 5 7.96024 5 7.5C5 7.03976 5.3731 6.66667 5.83333 6.66667H11.8125L10.2606 5.11479C9.94166 4.79583 9.93483 4.28085 10.2452 3.95353C10.5675 3.6137 11.1065 3.60655 11.4377 3.93771L15 7.5L11.4377 11.0623Z" fill="white" />
                                </svg>
                            </button>
                        </Link>
                    </div>
                    <h1 style={{ textAlign: 'center', margin: '20px' }}>Daftar Arsip Surat Masuk dan Keluar</h1>
                    <table class="table">
                        <thead>
                            <tr className='text-center align-middle'>
                                <th scope="col" style={{ display: 'none' }}>ID</th>
                                <th scope="col">No</th>
                                <th scope="col">No.Surat</th>
                                <th scope="col">Tanggal Masuk</th>
                                <th scope="col">Nama Penerima</th>
                                <th scope="col">Alamat Pengirim</th>
                                <th scope="col">Tanggal Keluar</th>
                                <th scope="col">Tanggal Surat</th>
                                <th scope="col">Perihal Lampiran</th>
                                <th scope="col">Sifat Surat</th>
                                <th scope="col">Jenis Surat</th>
                                <th scope="col">No WhatsApp</th>
                                <th scope="col">File Arsip</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dataSurat.map((value, index) => (
                                <tr key={value.id}>
                                    <td style={{ display: 'none' }}></td>
                                    <td>{index + 1}</td>
                                    <td>{value.no_surat}</td>
                                    <td>{value.tanggal_masuk}</td>
                                    <td>{value.nama}</td>
                                    <td>{value.alamat}</td>
                                    <td>{value.tanggal_keluar}</td>
                                    <td>{value.tanggal_surat}</td>
                                    <td>{value.perihal}</td>
                                    <td>{value.sifat_surat}</td>
                                    <td><b>{value.jenis_surat}</b></td>
                                    <td>{value.no_wa}</td>
                                    <td>{value.file ? <Link style={{ width: '40px' }} href={value.file} target="_blank">Lihat</Link> : null}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </article>
            </div>
        </>
    )
}