"use client";

import { Dialog, DialogActions, DialogContent, DialogTitle, Button } from "@mui/material";
import { useRouter } from "next/router";

export default function SuccessDialog({
    open,
    setOpenSuccess,
    message,
    redirectPath
}) {
    const router = useRouter();

    const handleOk = () => {
        setOpenSuccess(false);

        if (redirectPath) {
            router.push(redirectPath); // 🔥 redirect
        }
    };

    return (
        <Dialog open={open} onClose={handleOk}>
            <DialogTitle>Sukses</DialogTitle>
            <DialogContent>
                <p>{message}</p>
            </DialogContent>
            <DialogActions>
                <Button
                    className="m-auto"
                    onClick={handleOk}
                    variant="contained"
                >
                    OK
                </Button>
            </DialogActions>
        </Dialog>
    );
}
