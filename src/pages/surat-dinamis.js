import { useRouter } from "next/router";
import { db } from "@/lib/firebaseConfig";
import React, { useEffect, useState } from "react";
import { getDoc, collection, doc, query, where, getDocs } from "firebase/firestore";
import HeaderSurat from "@/components/HeaderSurat";

export default function SuratDinamis() {
    const router = useRouter();
    const { id } = router.query;
    
    const [surat, setSurat] = useState(null);
    const [template, setTemplate] = useState(null);
    const [dokter, setDokter] = useState(null);
    const [kabag, setKabag] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (!id) return;

            // 1. Ambil data surat
            const docRef = doc(db, "surat", id);
            const docSnapshot = await getDoc(docRef);
            
            if (!docSnapshot.exists()) {
                setLoading(false);
                return;
            }
            
            const dataSurat = { id: docSnapshot.id, ...docSnapshot.data() };
            setSurat(dataSurat);

            // 2. Ambil master template dari ket
            const q = query(collection(db, "master_template_surat"), where("ket", "==", dataSurat.ket));
            const templateDocs = await getDocs(q);
            if (!templateDocs.empty) {
                setTemplate(templateDocs.docs[0].data());
            }

            // 3. Ambil dokter (penanda tangan 1)
            if (dataSurat.id_dokter) {
                const docDokter = await getDoc(doc(db, "user", dataSurat.id_dokter));
                if (docDokter.exists()) setDokter(docDokter.data());
            }

            // 4. Ambil kabag (penanda tangan 2)
            if (dataSurat.id_kabag) {
                const docKabag = await getDoc(doc(db, "user", dataSurat.id_kabag));
                if (docKabag.exists()) setKabag(docKabag.data());
            }

            setLoading(false);
        }

        fetchData();
    }, [id]);

    const formatDate = (inputDate) => {
        if (!inputDate) return "-";
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(inputDate).toLocaleDateString('id-ID', options);
    };

    if (loading) return <div className="p-10 text-center">Memuat dokumen...</div>;
    if (!surat) return <div className="p-10 text-center">Dokumen tidak ditemukan.</div>;

    // Regex replacement for {{variable_name}}
    let renderedHtml = template?.layoutHtml || "<p><i>Template belum memiliki desain layout.</i></p>";
    if (template && surat) {
        renderedHtml = renderedHtml.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, key) => {
            // Check if key is a date to format it nicely, but usually let it raw or format if recognizable
            let val = surat[key];
            if (!val) return "-";
            
            // basic date detection pattern YYYY-MM-DD
            if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return formatDate(val);
            }
            return String(val).replace(/\n/g, "<br>");
        });
        
        // Membersihkan tag <p><br></p> kosong bawaan editor yang membuat spasi berlebih
        renderedHtml = renderedHtml.replace(/<p[^>]*><br><\/p>/g, "");
    }

    return (
        <div className="template template-dinamis">
            <button className="print-button" onClick={() => window.print()}>Cetak</button>
            <HeaderSurat logos='' />
            
            {/* <div className="my-5">
                <p className="text-end pe-5">Makassar, {formatDate(surat.tanggal_surat || new Date())}</p>
            </div> */}
            
            <div className="px-8 mt-6">
                <div 
                    className="dynamic-content p-0 mb-0" 
                    dangerouslySetInnerHTML={{ __html: renderedHtml }} 
                />
                
                <div className="d-flex footer mt-0" style={{ justifyContent: (!dokter || !kabag) ? 'flex-end' : 'space-between' }}>
                    {dokter && (
                        <span className="names">
                            <div className="mb-5">
                                <p className="text-center text-uppercase"><b>{dokter.jabatan_user || "-"}</b></p>
                            </div>
                            {surat.ttd_dokter && (
                                <div className="text-center mb-2">
                                    <img src={surat.ttd_dokter} alt="TTD" style={{ height: '60px', objectFit: 'contain', margin: '0 auto' }} />
                                </div>
                            )}
                            <div>
                                <p className="namaUpper text-center"><b>{dokter.nama_user || "-"}</b></p>
                                <p className="text-center">Pangkat/Gol : {dokter.pangkat_gol_user || "-"}</p>
                                <p className="text-center">Nip. {dokter.nip_user || "-"}</p>
                            </div>
                        </span>
                    )}
                    {kabag && (
                        <span className="names" style={!dokter ? { marginLeft: 'auto' } : {}}>
                            <div className="mb-1">
                                <p className="text-center text-uppercase"><b>{kabag.jabatan_user || "-"}</b></p>
                            </div>
                            {surat.ttd_kabag && (
                                <div className="text-center mb-2">
                                    <img src={surat.ttd_kabag} alt="TTD" style={{ height: '60px', objectFit: 'contain', margin: '0 auto' }} />
                                </div>
                            )}
                            <div>
                                <p className="namaUpper text-center"><b>{kabag.nama_user || "-"}</b></p>
                                <p className="text-center">Pangkat/Gol : {kabag.pangkat_gol_user || "-"}</p>
                                <p className="text-center">Nip. {kabag.nip_user || "-"}</p>
                            </div>
                        </span>
                    )}
                </div>
            </div>
            {/* CSS overrides untuk Jodit Editor di area cetak */}
            <style jsx global>{`
                .template-dinamis .dynamic-content {
                    font-family: inherit;
                    font-size: 16px;
                    line-height: 1.5;
                    white-space: pre-wrap;
                }
                .template-dinamis .dynamic-content p {
                    margin-bottom: 0.5rem;
                }
                .template-dinamis .dynamic-content table {
                    border-collapse: collapse;
                    width: 100%;
                }
                /* Default border tipis untuk tabel agar rapi seperti di editor */
                .template-dinamis .dynamic-content table:not([style*="border: 0"]):not([style*="border-width: 0"]):not([style*="border: none"]) td,
                .template-dinamis .dynamic-content table:not([style*="border: 0"]):not([style*="border-width: 0"]):not([style*="border: none"]) th {
                    border: 1px solid black;
                    padding: 8px;
                }
                /* Hapus border untuk tata letak kolom yang di-set "border width 0" di properties */
                .template-dinamis .dynamic-content table[style*="border: 0"] td,
                .template-dinamis .dynamic-content table[style*="border-width: 0"] td,
                .template-dinamis .dynamic-content table[style*="border: none"] td,
                .template-dinamis .dynamic-content table[style*="border: 0"] th,
                .template-dinamis .dynamic-content table[style*="border-width: 0"] th,
                .template-dinamis .dynamic-content table[style*="border: none"] th {
                    border: none !important;
                    padding: 2px 8px;
                }
            `}</style>
        </div>
    );
}
