import { Card } from "@mui/material";

export default function BreadCrumb( {judul} ) {
    return (
        <>
            <Card className="p-3 mb-4 shadow-none border border-2 rounded-2">
                <h3 className="fs-4">{judul}</h3>
                <nav aria-label="breadcrumb mb-0">
                    <ol class="breadcrumb mb-1">
                        <li class="breadcrumb-item"><a href="#">Home</a></li>
                        <li class="breadcrumb-item"><a href="#">Library</a></li>
                        <li class="breadcrumb-item active" aria-current="page">Data</li>
                    </ol>
                </nav>
            </Card>
        </>
    )
}