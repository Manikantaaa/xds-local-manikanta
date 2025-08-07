"use client";
import { PATH } from "@/constants/path";
import { useUserContext } from "@/context/store";
import { useRouter } from "next/navigation";
import "../public/css/style.css";
import "../public/css/staticpage.css";
import React, { useEffect } from 'react';
import XdsMainHome from "@/components/xds-main-home";
// import XdsOldHome from "@/components/xds-old-home";


export const dynamic = "force-dynamic";
export default function Home() {

  const { user } = useUserContext();
  const router = useRouter();


  useEffect(() => {
    localStorage.removeItem("clickedLogout");
    const updateMetaDescription = () => {
      const metaTag = document.querySelector('meta[name="description"]');
      const metaTitle = document.querySelector('meta[property="og:title"]');
      if (metaTag) {
        metaTag.setAttribute("content", "XDS Spark is a B2B platform to connect Buyers with Service Providers, and be the ONE true source for information for external development for creative industries");
      }
      if (metaTitle) {
        metaTitle.setAttribute("content", 'XDS-Spark Connectavity');
      }
    };
    updateMetaDescription();
  }, []);

  async function onClickLoginLink() {
    if (user) {
      if (user.userRoles) {
        user.userRoles[0].roleCode;
        if (user.userRoles[0].roleCode == "admin") {
          router.push(PATH.USERS.path);
        } else {
          router.push(PATH.OTHERS_HOME.path);
        }
      }
    } else {
      router.push(PATH.LOGIN.path);
    }
  }

  return (
    <>
      {/* <XdsMainHome></XdsMainHome> */} {/* If live This comment is enable required */}
      {/* <XdsOldHome></XdsOldHome> */}
      <XdsMainHome></XdsMainHome>
    </>
  );

}
