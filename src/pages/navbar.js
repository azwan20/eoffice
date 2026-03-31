import Link from "next/link";
import { useState } from "react";

export default function Navbar({ isHomeActive, isMasukActive, isKeluarActive, isArsipActive, handleButtonClick }) {

    return (
        <>
            <nav className="navbar navbars">
                <div className="container-fluid">
                    <Link href="/sekretaris/home">
                        <span className={`mb-0 ${isHomeActive ? "active" : ""}`} onClick={() => handleButtonClick("home")}>
                            <p>Home</p>
                        </span>
                    </Link>
                    <Link href="/sekretaris/surat-masuk">
                        <span className={`mb-0 ${isMasukActive ? "active" : ""}`} onClick={() => handleButtonClick("masuk")}>
                            <p>Masuk</p>
                        </span>
                    </Link>
                    <Link href="/sekretaris/surat-keluar">
                        <span className={`mb-0 ${isKeluarActive ? "active" : ""}`} onClick={() => handleButtonClick("keluar")}>
                            <p>Keluar</p>
                        </span>
                    </Link>
                    <Link href="/sekretaris/arsip">
                        <span className={`mb-0 ${isArsipActive ? "active" : ""}`} onClick={() => handleButtonClick("arsip")}>
                            <p>Arsip</p>
                        </span>
                    </Link>
                </div>
            </nav>
            <style jsx>{`
                span {
                    background-color: #ffffff;
                    border: none;
                    color : #000;
                    padding: 10px;
                    cursor: pointer;
                }

                span.active {
                    background-color: #BBA482;
                    color: #ffffff;
                }

                .logout {

                }
            `}</style>
        </>
    );
}
