import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { db, storage, auth } from "@/lib/firebaseConfig";
import { doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import Layout from "@/components/Layout";

export default function EditProfile() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [successMsg, setSuccessMsg] = useState("Profile berhasil diperbarui!");
    const [signaturePreview, setSignaturePreview] = useState(null);
    const [signatureFile, setSignatureFile] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [useCanvas, setUseCanvas] = useState(false);
    const canvasRef = useRef(null);
    const [drawingActive, setDrawingActive] = useState(false);

    // Password change state
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [passwordFields, setPasswordFields] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);

    const [formFields, setFormFields] = useState({
        nama_user: '', nip_user: '', username: '', jabatan_user: '', alamat_user: '', pangkat_gol_user: '', unit_kerja: '', keterangan_user: '',
    });

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            const parsed = JSON.parse(userData);
            setUser(parsed);
            setFormFields({
                nama_user: parsed.nama_user || '',
                username: parsed.username || '',
                nip_user: parsed.nip_user || '',
                jabatan_user: parsed.jabatan_user || '',
                alamat_user: parsed.alamat_user || '',
                pangkat_gol_user: parsed.pangkat_gol_user || '',
                unit_kerja: parsed.unit_kerja || '',
                keterangan_user: parsed.keterangan_user || '',
            });
            if (parsed.ttd_user) {
                setSignaturePreview(parsed.ttd_user);
            }
        }
    }, []);

    // Canvas drawing functions
    useEffect(() => {
        if (!useCanvas || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.width = canvas.offsetWidth;
        canvas.height = 200;
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, [useCanvas]);

    const startDrawing = (e) => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext("2d");
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
        const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
        ctx.beginPath();
        ctx.moveTo(x, y);
        setDrawingActive(true);
    };

    const draw = (e) => {
        if (!drawingActive || !canvasRef.current) return;
        e.preventDefault();
        const ctx = canvasRef.current.getContext("2d");
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
        const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => setDrawingActive(false);

    const clearCanvas = () => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSignatureFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setSignaturePreview(ev.target.result);
        reader.readAsDataURL(file);
        setUseCanvas(false);
    };

    const handleFieldChange = (field, value) => {
        setFormFields((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user?.id) return;
        setLoading(true);

        try {
            let ttdUrl = user.ttd_user || null;

            // Upload signature from file
            if (signatureFile) {
                const storageRef = ref(storage, `signatures/${user.id}_${Date.now()}`);
                await uploadBytes(storageRef, signatureFile);
                ttdUrl = await getDownloadURL(storageRef);
            }

            // Upload signature from canvas
            if (useCanvas && canvasRef.current) {
                const blob = await new Promise(resolve => canvasRef.current.toBlob(resolve, "image/png"));
                if (blob) {
                    const storageRef = ref(storage, `signatures/${user.id}_${Date.now()}`);
                    await uploadBytes(storageRef, blob);
                    ttdUrl = await getDownloadURL(storageRef);
                }
            }

            const docRef = doc(db, "user", user.id);
            await updateDoc(docRef, {
                ...formFields,
                ttd_user: ttdUrl,
                updatedAt: serverTimestamp(),
            });

            // Update localStorage
            const updatedUser = { ...user, ...formFields, ttd_user: ttdUrl };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setUser(updatedUser);
            setSuccessMsg("Profile berhasil diperbarui!");
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error("Error:", error);
            alert("Gagal menyimpan. Coba lagi!");
        }
        setLoading(false);
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordError("");

        if (!passwordFields.newPassword || !passwordFields.currentPassword) {
            setPasswordError("Semua field harus diisi");
            return;
        }
        if (passwordFields.newPassword.length < 6) {
            setPasswordError("Password baru minimal 6 karakter");
            return;
        }
        if (passwordFields.newPassword !== passwordFields.confirmPassword) {
            setPasswordError("Konfirmasi password tidak cocok");
            return;
        }

        setPasswordLoading(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                setPasswordError("Sesi login telah kedaluwarsa. Silakan login ulang.");
                setPasswordLoading(false);
                return;
            }

            // Re-authenticate user first
            const credential = EmailAuthProvider.credential(currentUser.email, passwordFields.currentPassword);
            await reauthenticateWithCredential(currentUser, credential);

            // Update password
            await updatePassword(currentUser, passwordFields.newPassword);

            setPasswordFields({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setShowPasswordSection(false);
            setSuccessMsg("Password berhasil diubah!");
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error("Password change error:", error);
            if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
                setPasswordError("Password lama salah");
            } else if (error.code === "auth/too-many-requests") {
                setPasswordError("Terlalu banyak percobaan. Coba lagi nanti.");
            } else {
                setPasswordError("Gagal mengubah password. Coba lagi!");
            }
        }
        setPasswordLoading(false);
    };

    const getInitials = (name) => {
        if (!name) return "U";
        return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    };

    return (
        <Layout>
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span className="text-sm">Kembali</span>
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">Edit Profile</h1>
                    <p className="text-sm text-gray-500 mt-1">Perbarui informasi profil dan tanda tangan Anda</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Avatar & Name Card */}
                    <div className="bg-gradient-to-r from-primary to-emerald-500 rounded-2xl p-6 text-white">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold backdrop-blur-sm border-2 border-white/30">
                                {getInitials(formFields.nama_user)}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">{formFields.nama_user || "Nama User"}</h2>
                                <p className="text-white/70 capitalize">{formFields.jabatan_user || "Jabatan"}</p>
                                <p className="text-white/50 text-sm mt-1">NIP: {formFields.nip_user || "-"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                        <h3 className="text-lg font-bold text-gray-800">Informasi Pribadi</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap</label>
                                <input type="text" value={formFields.nama_user} onChange={(e) => handleFieldChange('nama_user', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                                <input type="text" value={formFields.username} disabled
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-sm cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">NIP</label>
                                <input type="text" value={formFields.nip_user} disabled
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-sm cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Jabatan</label>
                                <input type="text" value={formFields.jabatan_user} disabled
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-sm cursor-not-allowed capitalize" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit Kerja</label>
                                <input type="text" value={formFields.unit_kerja} onChange={(e) => handleFieldChange('unit_kerja', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Alamat</label>
                                <input type="text" value={formFields.alamat_user} onChange={(e) => handleFieldChange('alamat_user', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Pangkat/Gol</label>
                                <input type="text" value={formFields.pangkat_gol_user} onChange={(e) => handleFieldChange('pangkat_gol_user', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Keterangan</label>
                            <textarea value={formFields.keterangan_user} onChange={(e) => handleFieldChange('keterangan_user', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm h-20 resize-none" />
                        </div>
                    </div>

                    {/* Signature Section */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-1">Tanda Tangan</h3>
                        <p className="text-sm text-gray-500 mb-5">Upload gambar atau gambar langsung tanda tangan Anda</p>

                        {/* Method Toggle */}
                        <div className="flex gap-3 mb-5">
                            <button type="button" onClick={() => setUseCanvas(false)}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${!useCanvas ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                📁 Upload Gambar
                            </button>
                            <button type="button" onClick={() => setUseCanvas(true)}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${useCanvas ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                ✏️ Gambar Langsung
                            </button>
                        </div>

                        {!useCanvas ? (
                            <div>
                                <label className="block">
                                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                                        {signaturePreview && !useCanvas ? (
                                            <img src={signaturePreview} alt="Tanda tangan" className="max-h-32 mx-auto mb-3" />
                                        ) : (
                                            <div className="text-gray-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <p className="text-sm font-medium">Klik untuk upload tanda tangan</p>
                                                <p className="text-xs mt-1">PNG, JPG (max 2MB)</p>
                                            </div>
                                        )}
                                    </div>
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                </label>
                            </div>
                        ) : (
                            <div>
                                <div className="border-2 border-gray-200 rounded-xl overflow-hidden mb-3">
                                    <canvas
                                        ref={canvasRef}
                                        className="w-full cursor-crosshair touch-none"
                                        style={{ height: "200px" }}
                                        onMouseDown={startDrawing}
                                        onMouseMove={draw}
                                        onMouseUp={stopDrawing}
                                        onMouseLeave={stopDrawing}
                                        onTouchStart={startDrawing}
                                        onTouchMove={draw}
                                        onTouchEnd={stopDrawing}
                                    />
                                </div>
                                <button type="button" onClick={clearCanvas}
                                    className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Hapus & Gambar Ulang
                                </button>
                            </div>
                        )}

                        {/* Current signature preview */}
                        {user?.ttd_user && !signatureFile && !useCanvas && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                                <p className="text-xs text-gray-500 mb-2 font-medium">Tanda tangan saat ini:</p>
                                <img src={user.ttd_user} alt="TTD" className="max-h-24" />
                            </div>
                        )}
                    </div>

                    {/* Submit Profile */}
                    <div className="flex gap-3">
                        <button type="button" onClick={() => router.back()}
                            className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors">
                            Batal
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 py-3 bg-gradient-to-r from-primary to-emerald-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50">
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Menyimpan...
                                </span>
                            ) : "Simpan Perubahan"}
                        </button>
                    </div>
                </form>

                {/* Password Change Section */}
                <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg font-bold text-gray-800">Ubah Password</h3>
                        <button type="button" onClick={() => { setShowPasswordSection(!showPasswordSection); setPasswordError(""); }}
                            className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">
                            {showPasswordSection ? "Batal" : "Ubah"}
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Ganti password login akun Anda</p>

                    {showPasswordSection && (
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            {passwordError && (
                                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {passwordError}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password Lama</label>
                                <div className="relative">
                                    <input type={showCurrentPw ? "text" : "password"}
                                        value={passwordFields.currentPassword}
                                        onChange={(e) => setPasswordFields(p => ({ ...p, currentPassword: e.target.value }))}
                                        placeholder="Masukkan password lama"
                                        className="w-full px-4 py-2.5 pr-12 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" required />
                                    <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600">
                                        {showCurrentPw ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password Baru</label>
                                <div className="relative">
                                    <input type={showNewPw ? "text" : "password"}
                                        value={passwordFields.newPassword}
                                        onChange={(e) => setPasswordFields(p => ({ ...p, newPassword: e.target.value }))}
                                        placeholder="Minimal 6 karakter"
                                        className="w-full px-4 py-2.5 pr-12 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" required />
                                    <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600">
                                        {showNewPw ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Konfirmasi Password Baru</label>
                                <input type="password"
                                    value={passwordFields.confirmPassword}
                                    onChange={(e) => setPasswordFields(p => ({ ...p, confirmPassword: e.target.value }))}
                                    placeholder="Ketik ulang password baru"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" required />
                                {passwordFields.confirmPassword && passwordFields.confirmPassword !== passwordFields.newPassword && (
                                    <p className="text-xs text-red-500 mt-1">Password tidak cocok</p>
                                )}
                            </div>
                            <button type="submit" disabled={passwordLoading || (passwordFields.confirmPassword && passwordFields.confirmPassword !== passwordFields.newPassword)}
                                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-amber-500/20 transition-all disabled:opacity-50">
                                {passwordLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Mengubah Password...
                                    </span>
                                ) : "Ubah Password"}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {/* Success Toast */}
            {success && (
                <div className="fixed bottom-6 right-6 z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-700">{successMsg}</p>
                </div>
            )}
        </Layout>
    );
}
