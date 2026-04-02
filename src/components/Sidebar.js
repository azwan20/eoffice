import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { getUserUnit, isDirektur, isFullAccess, ALL_UNITS } from "@/lib/roleUtils";

export default function Sidebar() {
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) setUser(JSON.parse(userData));
    }, []);

    const isActive = (href) => {
        if (href === "/") return router.pathname === "/";
        // Exact match for paths that could conflict
        return router.asPath === href || router.pathname === href;
    };

    const handleLogout = () => {
        localStorage.removeItem("user");
        document.cookie = "token=; Max-Age=0; path=/";
        router.push("/login");
    };

    useEffect(() => {
        setMobileOpen(false);
    }, [router.pathname]);

    const jabatan = user?.jabatan_user || "";
    const unitKerja = user?.unit_kerja || "";
    const hasFullAccess = isFullAccess(jabatan);

    // Build menu items based on role
    const menuItems = [
        {
            key: "home",
            label: "Home",
            href: "/",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
                </svg>
            ),
        },
    ];

    // Show Akun User and Master Template for fullAccess roles
    if (hasFullAccess) {
        menuItems.push({
            key: "master-template",
            label: "Master Surat",
            href: "/master-template",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
        });
        menuItems.push({
            key: "user",
            label: "Akun User",
            href: "/akun-user",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
        });
    }

    // Surat Masuk
    menuItems.push({
        key: "surat-masuk",
        label: "Surat Masuk",
        href: "/surat-masuk",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
    });

    // Buat Surat
    menuItems.push({
        key: "arsip2",
        label: "Buat Surat",
        href: "/arsip2",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
        ),
    });

    return (
        <>
            {/* Mobile hamburger */}
            <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary rounded-lg text-white shadow-lg"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                transition-all duration-300 ease-in-out
                w-64 bg-gradient-to-b from-slate-900 to-slate-850
                flex flex-col h-screen flex-shrink-0
                shadow-2xl lg:shadow-xl
            `}>
                {/* Logo area */}
                <div className="px-6 py-8 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-sm">SIDARA</h2>
                            <p className="text-gray-400 text-xs">Sistem Digital Administrasi Rumah Sakit</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                    <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Menu Utama</p>
                    {menuItems.map((item) => (
                        <Link key={item.key} href={item.href}>
                            <div className={`
                                flex items-center gap-3 px-3 py-2.5 rounded-xl
                                transition-all duration-200 cursor-pointer group
                                ${isActive(item.href)
                                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }
                            `}>
                                <span className={`${isActive(item.href) ? 'text-white' : 'text-gray-500 group-hover:text-primary'} transition-colors`}>
                                    {item.icon}
                                </span>
                                <span className="font-medium text-sm">{item.label}</span>
                            </div>
                        </Link>
                    ))}
                </nav>

                {/* User info + Logout */}
                <div className="px-4 pb-6 border-t border-white/10 pt-4">
                    {user && (
                        <div className="px-3 py-2 mb-2">
                            <p className="text-white text-xs font-medium truncate">{user.nama_user}</p>
                            <p className="text-gray-500 text-[10px] capitalize truncate">{user.jabatan_user} · {user.unit_kerja || getUserUnit(user.jabatan_user)}</p>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full
                            text-red-400 hover:bg-red-500/10 hover:text-red-300
                            transition-all duration-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="font-medium text-sm">Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
