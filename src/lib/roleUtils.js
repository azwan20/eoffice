/**
 * Utility functions for role-based access control.
 * 
 * unit_kerja values (new field):
 *   "umum", "yanmas", "keuangan", "pelayanan medik",
 *   "penunjang medik", "keperawatan", "laboratorium"
 * 
 * jabatan_user: free text (e.g. "Kepala Bagian", "Staf", "Dokter Umum", "Admin")
 * 
 * Roles detected from jabatan_user:
 *   "direktur" - full access + can approve
 *   "admin"    - full access, CANNOT approve (no signature authority)
 *   "kabag"    - unit-scoped + can approve
 *   "dokter"   - unit-scoped + can approve
 *   "pegawai"  - unit-scoped, cannot approve
 */

// All valid units in the system
export const ALL_UNITS = [
    "umum", "yanmas", "keuangan", "pelayanan medik",
    "penunjang medik", "keperawatan", "laboratorium",
];

/**
 * Extract the unit from user data.
 * Priority: unit_kerja field > parsing jabatan_user (backward-compatible)
 */
export function getUserUnit(jabatan) {
    // Priority 1: use unit_kerja if available
    // if (unitKerja) {
    //     const uk = unitKerja.toLowerCase().trim();
    //     if (uk && uk !== "direktur") return uk;
    //     if (uk === "direktur") return null;
    // }

    // Priority 2: fallback to parsing jabatan (backward-compatible)
    if (!jabatan) return null;
    const j = jabatan.toLowerCase().trim();
    if (j === "direktur" || j === "admin") return null;
    const cleaned = j.replace(/^(pegawai|kabag|dokter)\s+/, "");
    const match = ALL_UNITS.find(u => cleaned === u);
    return match || cleaned || null;
}

/**
 * Get the role type from jabatan.
 * Returns: "direktur" | "admin" | "kabag" | "dokter" | "pegawai"
 */
export function getUserRole(jabatan) {
    if (!jabatan) return "pegawai";
    const j = jabatan.toLowerCase().trim();
    if (j.includes("direktur")) return "direktur";
    if (j.includes("admin")) return "admin";
    if (j.includes("kabag")) return "kabag";
    if (j.includes("dokter")) return "dokter";
    return "pegawai";
}

/**
 * Check if user is a direktur.
 */
export function isDirektur(jabatan) {
    return getUserRole(jabatan) === "direktur";
}

/**
 * Check if user is an admin (full access but no approve).
 */
export function isAdmin(jabatan) {
    return getUserRole(jabatan) === "admin";
}

/**
 * Check if user has full access (direktur OR admin).
 * Both can see all units, CRUD everywhere.
 */
export function isFullAccess(jabatan) {
    const role = getUserRole(jabatan);
    return role === "direktur" || role === "admin";
}

/**
 * Check if user can approve/reject surat.
 * Admin CANNOT approve (no signature authority).
 * Only direktur, kabag, dokter can approve.
 */
export function canApprove(jabatan) {
    const role = getUserRole(jabatan);
    return role === "direktur" || role === "kabag" || role === "dokter";
}

/**
 * Check if user can access a specific unit.
 * FullAccess (direktur+admin) can access all. Others only their own unit.
 */
export function canAccessUnit(jabatan, unitName, unitKerja) {
    if (isFullAccess(jabatan)) return true;
    const userUnit = getUserUnit(jabatan, unitKerja);
    return userUnit === unitName?.toLowerCase();
}

/**
 * Check if user can CRUD surat in a given unit.
 * FullAccess (direktur+admin) can CRUD everywhere.
 */
export function canCRUD(jabatan, unitName, unitKerja) {
    if (isFullAccess(jabatan)) return true;
    const userUnit = getUserUnit(jabatan, unitKerja);
    return userUnit === unitName?.toLowerCase();
}
