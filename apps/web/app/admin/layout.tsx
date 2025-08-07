"use client";
import { PATH } from "@/constants/path";
import { ExcelFileStoreContext } from "@/context/localFileStore";
import { useUserContext } from "@/context/store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const dynamic = 'force-dynamic';

export default function AdminProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUserContext();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (!user) {
      router.push(PATH.HOME.path);
    } else {
      if (
        user &&
        user.userRoles &&
        user.userRoles[0] &&
        user.userRoles[0].roleCode &&
        user?.userRoles[0].roleCode == "admin"
      ) {
        setIsAdmin(true);
      } else {
        router.push(PATH.HOME.path);
      }
    }
  }, [user, router]);
  return <ExcelFileStoreContext>{isAdmin && children}</ExcelFileStoreContext>;
}
