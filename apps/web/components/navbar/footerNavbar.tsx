"use client";
import Image from "next/image";
import xdsLogo from "@/public/xds-logo.svg";
import Link from "next/link";
import { PATH } from "@/constants/path";
import { usePathname, useSearchParams } from "next/navigation";
import { useUserContext } from "@/context/store";
const FooterNavbar = () => {
  const currentUrl = usePathname();
  const { user } = useUserContext();
  const searchParams = useSearchParams();
  let allowedView = "1";

  if(currentUrl == "/shared-list") {
    allowedView = user ? "1" : "0";
  }

  return (
    <>
      {
        currentUrl != "/" && allowedView == "1" && currentUrl != "/shared-project" &&
        <footer className="bg-gray-900">
          <div className=" p-4">
            <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-3 w-full">
              <div>
                <Link href={PATH.OTHERS_HOME.path}>
                  <Image
                    className="m-auto"
                    priority
                    src={xdsLogo}
                    alt="Logo"
                    sizes="100vh"
                    style={{ width: "auto", height: "1.5rem" }}
                  />
                </Link>
              </div>
              <div>
                <ul className="flex flex-wrap items-center justify-center mt-3 text-sm font-medium text-white  sm:mt-0">
                  <li>
                    <a href="/XDS Spark Terms and Conditions of Use.pdf" target="_blank" className="hover:underline me-4 md:me-6">Terms of Use</a>
                  </li>
                  <li>
                    <a href="/XDS Spark Privacy Policy.pdf" target="_blank" className="hover:underline me-4 md:me-6">Privacy Policy</a>
                  </li>
                  <li>
                    <Link href={`${!user ? 'mailto:info@xds-spark.com?subject=XDS Spark - General Enquiry' : '/contact-us'}`} className="hover:underline">Contact Us</Link>
                  </li>
                </ul>
              </div>
              <div className="text-center"><span className="block text-sm text-white lg:text-right ">© {new Date().getFullYear()} XDS SPARK. All Rights Reserved.</span></div>
            </div>
          </div>
        </footer>
      }

    </>
  );
}
export default FooterNavbar;