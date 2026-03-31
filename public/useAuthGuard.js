// hooks/useAuthGuard.js

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function useAuthGuard(allowedRoles = []) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
      router.push("/login");
      return;
    }

    if (allowedRoles.length && !allowedRoles.includes(user.jabatan_user)) {
      router.push("/"); // atau halaman unauthorized
      return;
    }

    setLoading(false);
  }, [router]);

  return { loading };
}