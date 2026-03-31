import { Card, CardBody, CardSubtitle, CardTitle } from "reactstrap";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebaseConfig";
import { collection, getDocs, where, query } from "firebase/firestore";
import { useRouter } from "next/navigation";


const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const SalesChart = () => {
    const [dataLayanan, setDataLayanan] = useState(new Array(12).fill(0));
    const [dataPasien, setDataPasien] = useState(new Array(12).fill(0));
    const [dataPendapatan, setDataPendapatan] = useState(new Array(12).fill(0));
    const [dataPsikolog, setDataPsikolog] = useState(new Array(12).fill(0));

    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            const layananSnapshot = await getDocs(collection(db, "surat"));
            const userSnapshot = await getDocs(collection(db, "user"));

            const layananPerBulan = new Array(12).fill(0);
            const pasienPerBulan = new Array(12).fill(0);
            const pendapatanPerBulan = new Array(12).fill(0);
            const psikologPerBulan = new Array(12).fill(0);

            const filteredOrders = layananSnapshot.docs
                .map((doc) => doc.data())
                .filter((order) => order.jenis === "spm");

            const filteredarsip = layananSnapshot.docs
                .map((doc) => doc.data())
                .filter((order) => order.jenis !== "spm");

            layananSnapshot.forEach((doc) => {
                const { createdAt } = doc.data();
                if (createdAt) {
                    const month = createdAt.toDate().getMonth();
                    layananPerBulan[month] += 1;
                }
            });

            userSnapshot.forEach((doc) => {
                const { createdAt } = doc.data();
                if (createdAt) {
                    const month = createdAt.toDate().getMonth();
                    pasienPerBulan[month] += 1;
                }
            });

            filteredOrders.forEach((doc) => {
                 const { createdAt } = doc;
                if (createdAt) {
                    const month = createdAt.toDate().getMonth();
                    pendapatanPerBulan[month] += 1;
                }
            });

            filteredarsip.forEach((doc) => {
                const { createdAt } = doc;
                if (createdAt) {
                    const month = createdAt.toDate().getMonth();
                    psikologPerBulan[month] += 1;
                }
            });

            setDataLayanan(layananPerBulan);
            setDataPasien(pasienPerBulan);
            setDataPendapatan(pendapatanPerBulan);
            setDataPsikolog(psikologPerBulan);
        };

        fetchData();
    }, []);

    // Fetch data dengan filter UID
    // useEffect(() => {
    //     const fetchData = async () => {
    //         try {
    //             const user = auth.currentUser;

    //             if (!user && !idPsikolog) {
    //                 console.warn("No user is logged in and no idPsikolog is provided. Skipping fetchData.");
    //                 return;
    //             }

    //             const currentUserUid = isAdminPage ? idPsikolog : user?.uid;

    //             if (!currentUserUid) {
    //                 console.warn("No valid user or idPsikolog found. Skipping fetchData.");
    //                 return;
    //             }

    //             const layananQuery = query(collection(db, "dataLayanan"), where("idPsikolog", "==", currentUserUid));
    //             const ordersQuery = query(collection(db, "orders"), where("idPsikolog", "==", currentUserUid));

    //             const [layananSnapshot, ordersSnapshot] = await Promise.all([
    //                 getDocs(layananQuery),
    //                 getDocs(ordersQuery),
    //             ]);

    //             const filteredOrders = ordersSnapshot.docs
    //                 .map((doc) => doc.data())
    //                 .filter((order) => order.status === "Selesai");

    //             const layananPerBulan = new Array(12).fill(0);
    //             const pasienPerBulan = new Array(12).fill(0);
    //             const pendapatanPerBulan = new Array(12).fill(0);

    //             layananSnapshot.forEach((doc) => {
    //                 const { createdAt } = doc.data();
    //                 if (createdAt?.toDate) {
    //                     const month = createdAt.toDate().getMonth();
    //                     layananPerBulan[month] += 1;
    //                 }
    //             });

    //             filteredOrders.forEach((doc) => {
    //                 const { createdAt } = doc;
    //                 if (createdAt?.toDate) {
    //                     const month = createdAt.toDate().getMonth();
    //                     pasienPerBulan[month] += 1;
    //                 }
    //             });

    //             filteredOrders.forEach((order) => {
    //                 const { createdAt, totalPembayaran } = order;
    //                 if (createdAt?.toDate && totalPembayaran) {
    //                     const month = createdAt.toDate().getMonth();
    //                     pendapatanPerBulan[month] += totalPembayaran / 1000;
    //                 }
    //             });

    //             setDataLayananPsikolog(layananPerBulan);
    //             setDataPasienPsikolog(pasienPerBulan);
    //             setDataPendapatanPsikolog(pendapatanPerBulan);

    //         } catch (error) {
    //             console.error("Error fetching data:", error);
    //         }
    //     };

    //     fetchData();
    // }, []);

    const chartoptions = {
        series: [
            {
                name: "SPM",
                data: dataPendapatan,
            },
            {
                name: "User",
                data: dataPasien,
            },
            {
                name: "Arsip",
                data: dataPsikolog,
            },
        ],
        options: {
            chart: {
                type: "area",
            },
            dataLabels: {
                enabled: false,
            },
            grid: {
                strokeDashArray: 3,
                borderColor: "rgba(0,0,0,0.1)",
            },

            stroke: {
                curve: "smooth",
                width: 1,
            },
            xaxis: {
                categories: [
                    "Jan",
                    "Feb",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "Aug",
                    "Sep",
                    "Okt",
                    "Nov",
                    "Dec"
                ],
            },
        },
    };
    return (
        <Card>
            <CardBody>
                <CardTitle tag="h5" className="text-underline text-second">Ringakasan Perbulan</CardTitle>
                <Chart
                    type="area"
                    width="100%"
                    height="300"
                    options={chartoptions.options}
                    series={chartoptions.series}
                />
            </CardBody>
        </Card>
    );
};

export default SalesChart;