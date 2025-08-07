"use client";
import Navbar from "@/components/navbar";
import SubNavbar from "@/components/navbar/subNavbar";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
function MainNavbar() {
  const siteNavbarRef = useRef<HTMLDivElement | null>(null);
  //console.log("Scrolled down");
  useEffect(() => {
    const handleScroll = () => {
      if (siteNavbarRef.current) {
        if (window.scrollY > 50) {
          siteNavbarRef.current.classList.add("fixed_top");
        } else {
          siteNavbarRef.current.classList.remove("fixed_top");
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

    const currentUrl = usePathname();
  return (
    <>
      <div ref={siteNavbarRef} className="w-full header_animation">
      {
              currentUrl != "/" && currentUrl != "/" &&   <Navbar />
      }
        {/* <SubNavbar /> */}
      </div>
    </>
  );
}

export default MainNavbar;
