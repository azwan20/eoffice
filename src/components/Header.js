import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { db } from "@/lib/firebaseConfig";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { getUserUnit, getUserRole, isDirektur, isFullAccess } from "@/lib/roleUtils";

export default function Header() {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const dropdownRef = useRef(null);
    const notifRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    // Fetch notifications - surat baru masuk yang relevan
    useEffect(() => {
        if (!user) return;

        const jabatan = user.jabatan_user?.toLowerCase() || "";
        const unitKerja = user.unit_kerja || "";
        const userUnit = getUserUnit(jabatan, unitKerja);
        const hasFullAcc = isFullAccess(jabatan);

        // Listen to all recent surat, then filter client-side
        const qSurat = query(collection(db, "surat"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(qSurat, (snapshot) => {
            const allSurat = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

            // Filter surat that are relevant to this user and still pending
            const relevant = allSurat.filter((surat) => {
                // Only show pending/new surat
                if (surat.status_approval === "approved" || surat.status_approval === "rejected") return false;

                // Admin & Direktur see all pending
                if (hasFullAcc) return true;

                if (!userUnit) return false;

                const suratUnit = surat.unit?.toLowerCase() || "";
                const tujuanUnit = surat.tujuan_unit?.toLowerCase() || "";

                // Surat dari unit user sendiri
                if (suratUnit === userUnit) return true;
                // Surat yang ditujukan ke unit user
                if (tujuanUnit === userUnit) return true;

                return false;
            });

            setNotifications(relevant.slice(0, 10));
        });

        return () => unsub();
    }, [user]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setNotifOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("user");
        document.cookie = "token=; Max-Age=0; path=/";
        router.push("/login");
    };

    const getInitials = (name) => {
        if (!name) return "U";
        return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Selamat Pagi";
        if (hour < 15) return "Selamat Siang";
        if (hour < 18) return "Selamat Sore";
        return "Selamat Malam";
    };

    const getTimeAgo = (timestamp) => {
        if (!timestamp) return "";
        let date;
        if (timestamp?.toDate) {
            date = timestamp.toDate();
        } else if (timestamp?.seconds) {
            date = new Date(timestamp.seconds * 1000);
        } else {
            date = new Date(timestamp);
        }
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Baru saja";
        if (diffMins < 60) return `${diffMins} menit lalu`;
        if (diffHours < 24) return `${diffHours} jam lalu`;
        if (diffDays < 7) return `${diffDays} hari lalu`;
        return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    };

    const getSuratLabel = (surat) => {
        if (surat.ket === "SKBN") return "Surat Keterangan Bebas Narkoba";
        if (surat.ket === "SPY") return "Surat Permohonan";
        return surat.perihal_surat || surat.ket || "Surat Baru";
    };

    const userUnit = getUserUnit(user?.jabatan_user || "", user?.unit_kerja || "");

    return (
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
            {/* Left side */}
            <div className="flex items-center gap-3 lg:ml-0 ml-12">
                <div>
                    <h2 className="text-lg font-bold text-gray-800">{getGreeting()} 👋</h2>
                    <p className="text-sm text-gray-500">Sistem pengelolaan surat digital RSUD Daya</p>
                </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
                {/* Notification bell */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => { setNotifOpen(!notifOpen); setDropdownOpen(false); }}
                        className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        {notifications.length > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 animate-pulse">
                                {notifications.length > 9 ? "9+" : notifications.length}
                            </span>
                        )}
                    </button>

                    {/* Notification dropdown */}
                    {notifOpen && (
                        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50" style={{ animation: 'fadeSlideDown 0.2s ease-out' }}>
                            {/* Header */}
                            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-sm font-bold text-gray-800">Notifikasi</h3>
                                    </div>
                                    {notifications.length > 0 && (
                                        <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                                            {notifications.length} baru
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Notification list */}
                            <div className="max-h-80 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="py-10 text-center">
                                        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                            </svg>
                                        </div>
                                        <p className="text-sm text-gray-400 font-medium">Tidak ada notifikasi baru</p>
                                        <p className="text-xs text-gray-300 mt-1">Semua surat sudah ditindaklanjuti</p>
                                    </div>
                                ) : (
                                    notifications.map((surat, index) => {
                                        const tujuanUnit = surat.tujuan_unit?.toLowerCase() || "";
                                        const suratUnit = surat.unit?.toLowerCase() || "";
                                        const isIncoming = tujuanUnit === userUnit && suratUnit !== userUnit;

                                        return (
                                            <Link
                                                key={surat.id}
                                                href={`/detail-arsip/${surat.unit ? surat.unit.charAt(0).toUpperCase() + surat.unit.slice(1) : ""}`}
                                                onClick={() => setNotifOpen(false)}
                                            >
                                                <div className={`px-5 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 last:border-b-0 ${index === 0 ? 'bg-primary/[0.02]' : ''}`}>
                                                    <div className="flex items-start gap-3">
                                                        {/* Icon */}
                                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                                            isIncoming
                                                                ? 'bg-blue-100 text-blue-600'
                                                                : 'bg-amber-100 text-amber-600'
                                                        }`}>
                                                            {isIncoming ? (
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                </svg>
                                                            ) : (
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                </svg>
                                                            )}
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                {isIncoming && (
                                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 uppercase tracking-wide">Masuk</span>
                                                                )}
                                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 uppercase tracking-wide">Pending</span>
                                                            </div>
                                                            <p className="text-sm font-semibold text-gray-700 truncate">
                                                                {getSuratLabel(surat)}
                                                            </p>
                                                            <p className="text-xs text-gray-400 mt-0.5 truncate">
                                                                {isIncoming ? `Dari unit ${suratUnit}` : `Unit ${suratUnit}`}
                                                                {surat.no_surat ? ` · ${surat.no_surat}` : ""}
                                                            </p>
                                                        </div>

                                                        {/* Time */}
                                                        <span className="text-[10px] text-gray-300 flex-shrink-0 mt-1">
                                                            {getTimeAgo(surat.createdAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })
                                )}
                            </div>

                            {/* Footer */}
                            {notifications.length > 0 && (
                                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                                    <Link href="/" onClick={() => setNotifOpen(false)}>
                                        <p className="text-xs text-center text-primary font-semibold hover:underline cursor-pointer">
                                            Lihat semua di halaman Home →
                                        </p>
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* User dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false); }}
                        className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200"
                    >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-primary/20">
                            {getInitials(user?.nama_user)}
                        </div>
                        <div className="hidden md:block text-left">
                            <p className="text-sm font-semibold text-gray-700 leading-tight">{user?.nama_user || "User"}</p>
                            <p className="text-xs text-gray-400 capitalize">{user?.jabatan_user || "Staff"}</p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Dropdown menu */}
                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2">
                            <div className="px-4 py-3 border-b border-gray-100">
                                <p className="text-sm font-semibold text-gray-700">{user?.nama_user}</p>
                                <p className="text-xs text-gray-400">NIP: {user?.nip_user}</p>
                            </div>
                            <Link href="/edit-profile">
                                <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors text-gray-600 hover:text-gray-800">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span className="text-sm">Edit Profile</span>
                                </div>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 w-full transition-colors text-red-500 hover:text-red-600"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                <span className="text-sm">Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Inline animation keyframes */}
            <style jsx>{`
                @keyframes fadeSlideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </header>
    );
}