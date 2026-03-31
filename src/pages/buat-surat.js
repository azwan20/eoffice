import Link from "next/link";
import { db } from "@/lib/firebaseConfig";
import { getDocs, collection } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";

async function fetchDataFromFirestore() {
    const querySnapshot = await getDocs(collection(db, "surat"));
    const data = [];
    querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
    });
    return data;
}

export default function BuatSurat() {
    const [dataSurat, SetDataSurat] = useState([]);
    const [dataSuratMasuk, SetDataSuratMasuk] = useState([]);
    const router = useRouter();

    useEffect(() => {
        async function fetchData() {
            const data = await fetchDataFromFirestore();
            const sortedData = data.sort((a, b) => new Date(b.tanggal_surat) - new Date(a.tanggal_surat));
            SetDataSurat(sortedData);
            const suratMasuk = sortedData.filter((surat) => surat.jenis_surat === "surat masuk");
            SetDataSuratMasuk(suratMasuk);
        }
        fetchData();
    }, []);

    return (
        <Layout>
            <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Buat Surat</h1>
                <p className="text-sm text-gray-500 mb-4">Halaman ini akan segera diperbarui.</p>
                <Link href="/arsip2">
                    <button className="px-5 py-2.5 bg-gradient-to-r from-primary to-emerald-500 text-white rounded-xl font-semibold text-sm">
                        Ke Halaman Buat Surat
                    </button>
                </Link>
            </div>
        </Layout>
    )
}