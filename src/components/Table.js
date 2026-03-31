import Link from "next/link";
import { useState } from "react";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog";

export default function Tabels({ suratList, pathnames, perihals, onEdit, onDelete, setOpenSuccess, IdDocument }) {
    const [path, setPath] = useState("");

    function formatTanggalIndonesia(tanggalString) {
        const tanggal = new Date(tanggalString);
        return tanggal.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    }

    console.log('from', IdDocument);

    return (
        <div className="p-5 arsips tabelTemplate arsipTable">
            <table class="table table-striped">
                <thead className="">
                    <tr className='text-center align-middle'>
                        <th scope="col" style={{ display: 'none' }}>ID</th>
                        <th scope="col">No</th>
                        <th scope="col">No.Surat</th>
                        <th scope="col">Tanggal Surat</th>
                        <th scope="col">Nama Penerima</th>
                        <th scope="col">Perihal Lampiran</th>
                        <th scope="col">Pemberi izin</th>
                        <th scope="col">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {suratList.length > 0 ? (
                        suratList.map((value, index) => (
                            <tr key={value.id}>
                                <td style={{ display: 'none' }}>{value.id}</td>
                                <td scope="row">{index + 1}</td>
                                <td>{value.no_surat_spm}</td>
                                <td>{formatTanggalIndonesia(value.tanggal_surat_spm)}</td>
                                <td>{value.namaPenerima}</td>
                                <td>{value.perihal}</td>
                                <td>
                                    <p className="text-second m-0">{value.nama_spm}</p>
                                    <p className="fs-10">Nip : {value.nip_spm}</p>
                                </td>
                                <td>
                                    <div className="d-flex justify-content-center align-items-center gap-2">
                                        <Link
                                            href={{
                                                pathname: `/sekretaris/${perihals}`,
                                                query: { id: value.id },
                                            }} >
                                            <button className="bg-info rounded-2 border-0 py-2 px-3 fw-bold text-white" >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill" viewBox="0 0 16 16">
                                                    <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0" />
                                                    <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7" />
                                                </svg>
                                            </button>
                                        </Link>
                                        <button onClick={() => onEdit(value)} className="bg-warning rounded-2 border-0 py-2 px-3 fw-bold text-white" >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                                                <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
                                                <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z" />
                                            </svg>
                                        </button>
                                        <ConfirmDeleteDialog onConfirm={() => onDelete(value.id)} onSuccess={() => setOpenSuccess(true)}>
                                            <button className="bg-danger rounded-2 border-0 py-2 px-3 fw-bold text-white" >
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
                            <td colSpan="7">
                                <h5 className="text-center text-muted">Tidak ada data</h5>
                            </td>
                        </tr>

                    )}
                </tbody>
            </table>
        </div>
    )
}