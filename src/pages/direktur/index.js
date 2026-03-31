// import { useEffect, useState } from "react";
// import SekretarisAside from "../sekretarisAside";
// import Navbar from "../navbar";
// import Link from "next/link";
// import { db } from "@/lib/firebaseConfig";
// import { getDocs, collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
// import { useRouter } from "next/router";
// import { Card, CircularProgress } from "@mui/material";
// import SalesChart from "@/components/Chart";
// import { formatDistanceToNow } from "date-fns";
// import { useAuth } from "../../../public/AuthContext";

// export default function Arsip() {
//     const router = useRouter();
//     const [isHomeActive, setIsHomeActive] = useState(true);
//     const [isMasukActive, setIsMasukActive] = useState(false);
//     const [isKeluarActive, setIsKeluarActive] = useState(false);
//     const [Islogin, setIslogin] = useState();
//     const auth = useAuth();
//     const currentUser = auth?.currentUser;
//     const [dataUser, setDataUser] = useState([]);
//     const [dataLayanan, setDataLayanan] = useState([]);
//     const [orderLength, setOrderLength] = useState([]);
//     const [totalPembayaran, setTotalPembayaran] = useState([]);
//     const [activeMenu, setActiveMenu] = useState("home");

//     useEffect(() => {
//         const user = JSON.parse(localStorage.getItem("user"));

//         if (!user) {
//             router.push("/");
//             return;
//         }

//         if (user.role !== "admin") {
//             router.push("/");
//         }
//     }, [router]);

//     const handleButtonClick = (menu) => {
//         setActiveMenu(menu);
//     };

//     console.log('data users', totalPembayaran);

//     useEffect(() => {
//         const fetchDataUserAndLayanan = async () => {
//             try {
//                 // Ambil semua data dari koleksi dataUser
//                 const dataUserSnapshot = await getDocs(collection(db, "user"));
//                 const allDataUser = dataUserSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//                 setDataUser(allDataUser);

//                 // Ambil semua data dari koleksi dataLayanan
//                 const dataLayananSnapshot = await getDocs(collection(db, "surat"));
//                 const allDataLayanan = dataLayananSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//                 setDataLayanan(allDataLayanan);

//                 const filteredOrders = allDataLayanan.filter((item) => item.jenis === "spm");
//                 const totalPembayaran = allDataLayanan.filter((item) => item.jenis !== "spm");

//                 setOrderLength(filteredOrders);
//                 setTotalPembayaran(totalPembayaran);

//             } catch (error) {
//                 console.error("Error mengambil data dari koleksi dataUser atau dataLayanan:", error);
//             }
//         };

//         // fetchUserData();
//         fetchDataUserAndLayanan();
//     }, [currentUser]);

//     const dataHead = [
//         {
//             nama: "Surat Masuk",
//             jumalah: orderLength.length,
//             ket: "Total Surat masuk",
//             color: 'rgb(241, 218, 105)',
//             icon:
//                 <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" class="bi bi-file-text-fill" viewBox="0 0 16 16">
//                     <path d="M12 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2M5 4h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1 0-1m-.5 2.5A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5M5 8h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1 0-1m0 2h3a.5.5 0 0 1 0 1H5a.5.5 0 0 1 0-1" />
//                 </svg>
//         },
//         {
//             nama: "User",
//             jumalah: dataUser.length,
//             ket: "Jumlah User",
//             color: 'rgb(146, 189, 245)',
//             icon:
//                 <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" class="bi bi-people-fill" viewBox="0 0 16 16">
//                     <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5.784 6A2.24 2.24 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.3 6.3 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5" />
//                 </svg>
//         },
//         {
//             nama: "Arsip",
//             jumalah: totalPembayaran.length,
//             ket: "Jumlah Arsip",
//             color: 'rgb(231, 121, 125)',
//             icon: <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" class="bi bi-archive-fill" viewBox="0 0 16 16">
//                 <path d="M12.643 15C13.979 15 15 13.845 15 12.5V5H1v7.5C1 13.845 2.021 15 3.357 15zM5.5 7h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1M.8 1a.8.8 0 0 0-.8.8V3a.8.8 0 0 0 .8.8h14.4A.8.8 0 0 0 16 3V1.8a.8.8 0 0 0-.8-.8z" />
//             </svg>
//         },
//     ]

//     const formatRelativeTime = (timestamp) => {
//         const createdTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
//         return formatDistanceToNow(createdTime, { addSuffix: true });
//     };


//     return (
//         <>
//             <div className="sekretaris homeSekretaris d-flex">
//                 {/* <SekretarisAside activeMenu={activeMenu} handleButtonClick={handleButtonClick} /> */}
//                 <article style={{ maxHeight: '100vh', overflowY: 'auto' }}>
//                     <div className="konten align-items-center">
//                         <h5 className="text-start text-second fw-bold">Arsip Surat RSUD DAYA KOTA MAKASSAR</h5>
//                         <p className="text-grey">Sistem pengelolaan surat berbasis digital </p>
//                         <hr />
//                         <div className="d-flex gap-3">
//                             {dataHead.map((tdata, index) => (
//                                 <article style={{ backgroundColor: tdata.color }} key={tdata.id}>
//                                     <div>
//                                         <p>{tdata.nama}</p>
//                                         <h4>{tdata.jumalah}</h4>
//                                         <p className="mb-0">{tdata.ket}</p>
//                                     </div>
//                                     <div>
//                                         {tdata.icon}
//                                     </div>
//                                 </article>
//                             ))}
//                         </div>
//                         <hr />
//                         {/* <img src='https://historicalhospitals.com/wp-content/uploads/2021/06/rsud-makassar.jpg' width={'100%'} height={'100%'} style={{backgroundSize: 'contain'}} /> */}
//                         <div className="d-flex justify-content-between gap-3">
//                             <Link href="/sekretaris/template-surat?perihals=surat-perintah-membayar"><button className="btn-hover-sm">
//                                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-file-earmark-plus-fill me-2" viewBox="0 0 16 16">
//                                     <path d="M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0M9.5 3.5v-2l3 3h-2a1 1 0 0 1-1-1M8.5 7v1.5H10a.5.5 0 0 1 0 1H8.5V11a.5.5 0 0 1-1 0V9.5H6a.5.5 0 0 1 0-1h1.5V7a.5.5 0 0 1 1 0" />
//                                 </svg> Buat Surat SPM</button>
//                             </Link>
//                             <Link href="/sekretaris/arsip"><button className="btn-hover-sm"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-file-earmark-plus-fill me-2" viewBox="0 0 16 16">
//                                 <path d="M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0M9.5 3.5v-2l3 3h-2a1 1 0 0 1-1-1M8.5 7v1.5H10a.5.5 0 0 1 0 1H8.5V11a.5.5 0 0 1-1 0V9.5H6a.5.5 0 0 1 0-1h1.5V7a.5.5 0 0 1 1 0" />
//                             </svg> Tambah User Baru</button>
//                             </Link>
//                             <Link href="/sekretaris/arsip"><button className="btn-hover-sm"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-file-earmark-plus-fill me-2" viewBox="0 0 16 16">
//                                 <path d="M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0M9.5 3.5v-2l3 3h-2a1 1 0 0 1-1-1M8.5 7v1.5H10a.5.5 0 0 1 0 1H8.5V11a.5.5 0 0 1-1 0V9.5H6a.5.5 0 0 1 0-1h1.5V7a.5.5 0 0 1 1 0" />
//                             </svg> Buat Surat Lengkap</button>
//                             </Link>
//                         </div>

//                         <div className="d-flex gap-3" style={{ height: '50vh' }}>
//                             <Card className="h-100 p-3" style={{ width: '30%' }}>
//                                 <h6 className="mb-4 text-second text-underline">Riwayat Pembuatan</h6>
//                                 {totalPembayaran.map((items, ind) => (
//                                     <div className="d-flex justify-content-between align-items-center">
//                                         <p>{items.perusahaan_kedua}</p>
//                                         <p className="fs-10 text-grey">{formatRelativeTime(items.createdAt)}</p>
//                                     </div>
//                                 ))}
//                             </Card>
//                             <Card className="h-100" style={{ width: '70%' }}>
//                                 <SalesChart />
//                             </Card>
//                         </div>
//                     </div>
//                 </article>
//                 <Navbar isHomeActive={isHomeActive} isMasukActive={isMasukActive} isKeluarActive={isKeluarActive} handleButtonClick={handleButtonClick} />
//             </div>
//         </>
//     )
// }