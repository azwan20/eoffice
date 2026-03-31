import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { useState } from "react";

// ConfirmDeleteDialog.js
export default function ConfirmDeleteDialog({ onConfirm, onSuccess, children }) {
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    await onConfirm();      // Hapus data
    onSuccess?.();          // ✅ panggil success callback
    setOpen(false);         // Tutup confirm dialog
  };

  return (
    <>
      <span onClick={() => setOpen(true)} style={{ cursor: "pointer" }}>
        {children}
      </span>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          Apakah Anda yakin ingin menghapus data ini?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Batal</Button>
          <Button onClick={handleConfirm} color="error" variant="contained">
            Hapus
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
