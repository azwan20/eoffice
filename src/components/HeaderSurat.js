export default function HeaderSurat({ logos }) {
    return (
        <>
            <div className="d-flex justify-content-center align-items-center mb-2 px-2">
                <section className="me-2">
                    <img className="h-[100px] w-auto object-contain"
                        src="https://makassarkota.go.id/wp-content/uploads/2024/02/logo-makassarkota.png" />
                </section>
                <section className="header">
                    <h4>PEMERINTAH KOTA MAKASSAR</h4>
                    {logos === 'dinkes' ? (
                        <>
                            <h4 className="mb-0"><strong>DINAS KESEHATAN</strong></h4>
                            {/* <p><strong>Dinas Kesehatan Kota Makassar Jl. Teduh Bersinar No. 1 Makassar </strong></p> */}
                            <p><strong>Jl. Teduh Bersinar No. 1 Telp. (0411) 881549 Fax (0411) 887710 Makassar 90221 </strong></p>
                        </>
                    ) : (
                        <>
                            <h2 className="text-second text-bold" style={{fontSize: '36px'}}><strong>RSUD KOTA MAKASSAR</strong></h2>
                            <p><strong>Jl. Perintis Kemerdekaan KM. 14 Daya, Kec. Biringkanaya, Kota Makassar, Sulawesi Selatan 90243</strong></p>
                            <p><strong>Email :</strong>rsud.daya@makassarkota.go.id <strong>| Website : </strong>www.rsudkotamakassar.or.id</p>
                        </>
                    )}
                </section>
                <section className="ms-2">
                    <img className="h-[100px] w-auto object-contain"
                        src="/logo-rs.jpeg" />
                </section>
            </div>
            <div style={{ marginBottom: '2px' }} className="hr2" />
            <div className="hr1" />
        </>
    )
}