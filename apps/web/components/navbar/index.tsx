"use client";
import { usePathname } from "next/navigation";
import AuthNavbar from "./authNavbar";
import UnauthenticatedNavbar from "./unauthenticatedNavbar";
import { useUserContext } from "@/context/store";
import HeaderStatic from "../header-static";

const Navbar = () => {
  const { user } = useUserContext();
  const currentUrl = usePathname();
  
  // const isLoggingOut = typeof window !== "undefined" && localStorage.getItem("clickedLogout") === "1";

  // if (isLoggingOut) return null;

  return user ? <AuthNavbar /> : 
  (currentUrl.includes("business-solutions") || currentUrl.includes("shared-list") || currentUrl.includes("shared-project") ||
   currentUrl.includes("signup-options")) ? <HeaderStatic/> : <UnauthenticatedNavbar />;
};

export default Navbar;
