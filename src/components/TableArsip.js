import { Card } from "@mui/material";
import Link from "next/link";
import { useState } from "react";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog";

export default function TabelArsip({ dataSurat, pathnames, onEdit, onDelete, setOpenSuccess }) {
    const [path, setPath] = useState("");
    const perihals = ['daftar-pemesanan', 'berita-acara-pemeriksaan-pekerjaan', 'berita-acara-kemajuan-III-pekerjaan', 'berita-acara-pembayaran', 'nota-pencairan-dana', 'kwitansi'];
    const bodyTable = [
        { label: 'Surat Pesanan', color: '#FF5733' }, // merah-oranye
        { label: 'Berita Acara Pemeriksaan Pekerjaan', color: '#33A1FF' }, // biru
        { label: 'Berita Acara Kemajuan III', color: '#28A745' }, // hijau
        { label: 'Berita Acara Pembayaran', color: '#FFC300' }, // kuning
        { label: 'Nota Pencairan (NPD)', color: '#8E44AD' }, // ungu
        { label: 'Kwitansi', color: '#FF33A6' }, // pink
    ];
    const perihals1 = 'surat-perintah-membayar';

    function formatTanggalIndonesia(tanggalString) {
        const tanggal = new Date(tanggalString);
        return tanggal.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    }

    console.log('from', path);

    return (
        <div className="p-3 pt-0 arsipTable">
            <hr />
            {/* <Card className="rounded-4 p-3">
                <table class="table table-bordered table-striped">
                    <thead>
                        <tr className='text-center align-middle'>
                            <th scope="col" style={{ display: 'none' }}>ID</th>
                            <th scope="col">No</th>
                            <th scope="col">Tanggal</th>
                            <th scope="col">Penyedia</th>
                            <th scope="col">Surat Pesanan</th>
                            <th scope="col">Berita Acara Pemeriksaan Pekerjaan</th>
                            <th scope="col">Berita Acara Kemajuan III</th>
                            <th scope="col">Berita Acara Pembayaran</th>
                            <th scope="col">Nota Pencairan (NPD)</th>
                            <th scope="col">Kwitansi</th>
                            <th scope="col">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dataSurat.length > 0 ? (
                            dataSurat.map((value, index) => (
                                <tr key={value.id}>
                                    <td style={{ display: 'none' }}></td>
                                    <td>{index + 1}</td>
                                    <td>{formatTanggalIndonesia(value.tgl_terima)}</td>
                                    <td>{value.perusahaan_kedua}</td>
                                    {bodyTable.map((b, ind) => (
                                        <td>
                                            <div className="d-flex justify-content-center align-items-center gap-1">
                                                <Link
                                                    href={{
                                                        pathname: `/sekretaris/${perihals[ind]}`,
                                                        query: { id: value.id },
                                                    }} >
                                                    <button className="bg-info rounded-2 border-0 py-2 px-3 fw-bold text-white" >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill" viewBox="0 0 16 16">
                                                            <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0" />
                                                            <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7" />
                                                        </svg>
                                                    </button>
                                                </Link>
                                            </div>
                                        </td>
                                    ))}
                                    <td>
                                        <div className="d-flex justify-content-center align-items-center gap-1">
                                            <button onClick={() => onEdit(value)} className="bg-warning rounded-2 border-0 py-2 px-3 fw-bold text-white" >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                                                    <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
                                                    <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z" />
                                                </svg>
                                            </button>
                                            <ConfirmDeleteDialog onConfirm={() => onDelete(value.id)} onSuccess={() => setOpenSuccess(true)}>
                                                <button variant="contained" color="error" className="bg-danger rounded-2 border-0 py-2 px-3 fw-bold text-white" >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
                                                        <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5" />
                                                    </svg>
                                                </button>
                                            </ConfirmDeleteDialog>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="10">
                                    <h5 className="text-center text-muted">Tidak ada data</h5>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card> */}
            <div className="px-3">
                {dataSurat.length > 0 ? (
                    dataSurat.map((value, index) => (
                        <Card className="rounded-4 p-3 pb-0 px-1 cards mb-4">
                            <div className="d-flex justify-content-between">
                                <div className="d-flex gap-2 align-items-center w-50">
                                    <div style={{ width: '30%' }}>
                                        <h6 className="text-primer fw-bold ps-3">{value.perusahaan_kedua}</h6>
                                    </div>
                                    <div style={{ width: '70%' }}>
                                        <b>Tanggal :</b>
                                        <p className="text-grey fs-12 mb-1">{formatTanggalIndonesia(value.tgl_terima)}</p>
                                        <b>Pihak 1 :</b>
                                        <p className="text-grey fs-12 mb-1">{value.nama_user} </p>
                                        <b>Pihak 2 :</b>
                                        <p className="text-grey fs-12 mb-1">{value.nama_kedua}</p>
                                        <b>Perihal :</b>
                                        <p className="text-grey fs-12 mb-1">{value.kegiatan}</p>
                                    </div>
                                </div>
                                <div className="d-flex justify-content-between gap-2">
                                    <div className="d-flex flex-column flex-fill">
                                        {bodyTable.slice(0, 3).map((item, ind) => (
                                            <Link
                                                href={{
                                                    pathname: `/sekretaris/${perihals[ind]}`,
                                                    query: { id: value.id },
                                                }} >
                                                <button
                                                    key={ind}
                                                    className="mb-2 text-white fw-bold border-0 py-2 rounded-2"
                                                    style={{ backgroundColor: item.color }}
                                                >
                                                    {item.label}
                                                </button>
                                            </Link>
                                        ))}
                                    </div>
                                    <div className="d-flex flex-column flex-fill">
                                        {bodyTable.slice(3).map((item, ind) => (
                                            <Link
                                                href={{
                                                    pathname: `/sekretaris/${perihals[ind + 3]}`,
                                                    query: { id: value.id },
                                                }} >
                                                <button
                                                    key={ind + 3}
                                                    className="mb-2 text-white fw-bold border-0 py-2 rounded-2"
                                                    style={{ backgroundColor: item.color }}
                                                >
                                                    {item.label}
                                                </button>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="d-flex">
                                <ConfirmDeleteDialog onConfirm={() => onDelete(value.id)} onSuccess={() => setOpenSuccess(true)}>
                                    <button variant="contained" color="error" className="bg-danger rounded-2 border-0 py-2 px-3 fw-bold text-white" >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash3-fill me-2" viewBox="0 0 16 16">
                                            <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5" />
                                        </svg> Hapus
                                    </button>
                                </ConfirmDeleteDialog>
                                <button onClick={() => onEdit(value)} className="bg-warning rounded-2 border-0 py-2 px-3 fw-bold text-white" >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pencil-square me-2" viewBox="0 0 16 16">
                                        <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
                                        <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z" />
                                    </svg> Ubah
                                </button>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div>

                        <h5 className="text-center text-muted">Tidak ada data</h5>
                    </div>
                )}
            </div>

            <hr />

        </div>
    )
}