"use client";
import Breadcrumbs from "@/components/breadcrumb";
import { PATH } from "@/constants/path";
import { useUserContext } from "@/context/store";
import { redirect, useRouter } from "next/navigation";
import { useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import PortfolioFiles from "@/components/portfoliofiles";
import AllAlbumsComponent from "@/components/allAlbumsComponent";
import AllProjectsComponent from "@/components/allProjectsComponent";
import Link from "next/link";
import MobileSideMenus from "@/components/mobileSideMenus";

const breadcrumbItems = [
  {
    label: PATH.HOME.name,
    path: PATH.HOME.path,
  },
  {
    label: PATH.COMPANY_PROFILE.name,
    path: PATH.COMPANY_PROFILE.path,
  },
  {
    label: PATH.OUR_WORK.name,
    path: PATH.OUR_WORK.path,
  },
];

const OurWorks = (params: { searchParams: { goto: string } }) => {
  const { user } = useUserContext();
  let stat = "1";
  if (params.searchParams.goto && params.searchParams.goto != "") {
    stat = params.searchParams.goto;
  }

  if (!user || user.userRoles[0].roleCode == 'buyer') {
    redirect(PATH.HOME.path);
  }

  if (!user.isPaidUser) {
    redirect("/company-profile/about");
  }
  const router = useRouter();
  const [status, setStatus] = useState(stat);
  function onClickStatus(val: string) {
    setStatus(val);
 
    router.push('/company-profile/our-works?goto='+val);
  }
  return (
    <>
      <div className="pb-6 pt-6 breadcrumbs_s">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:text-left flex align-middle items-cente">
          <MobileSideMenus></MobileSideMenus>
          <h1 className="font-bold  header-font">Our Work</h1>
        </div>
      </div>
      <div className="py-6">
        <div className="sm:block">
          <div className="relative border-b border-gray-200">
            <nav className="-mb-px flex gap-6" aria-label="Tabs">
              <button
                onClick={() => {
                  onClickStatus("1");
                }}
                className={`shrink-0 border-b-2 px-1 pb-2 font-bold text-sm  ${
                  status == "1"
                    ? "shrink-0 border-b-2 px-1  text-sky-600  border-sky-500 "
                    : "border-transparent default_text_color hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                Portfolio
              </button>
              <button
                onClick={() => {
                  onClickStatus("2");
                }}
                className={`shrink-0 border-b-2 px-1 pb-2 font-bold text-sm   ${
                  status == "2"
                    ? "shrink-0 border-b-2 px-1  text-sky-600  border-sky-500 "
                    : "border-transparent default_text_color hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                Project Highlights
              </button>
            </nav>
            {status == "2" && (
              <div className="absolute lg:top-0 -right-0 -top-12">
                <Link
                  className="link_color text-sm"
                  href="/company-profile/our-works/create-project"
                >
                  <svg
                    className="w-3.5 h-3.5 me-1"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.546.5a9.5 9.5 0 1 0 9.5 9.5 9.51 9.51 0 0 0-9.5-9.5ZM13.788 11h-3.242v3.242a1 1 0 1 1-2 0V11H5.304a1 1 0 0 1 0-2h3.242V5.758a1 1 0 0 1 2 0V9h3.242a1 1 0 1 1 0 2Z" />
                  </svg>
                  Create a Project
                </Link>
              </div>
            )}
            {status == "1" && (
              <div className="absolute lg:top-0 -right-0 -top-12">
                <Link
                  className="link_color text-sm"
                  href="/company-profile/our-works/create-album"
                >
                  <svg
                    className="w-3.5 h-3.5 me-1"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.546.5a9.5 9.5 0 1 0 9.5 9.5 9.51 9.51 0 0 0-9.5-9.5ZM13.788 11h-3.242v3.242a1 1 0 1 1-2 0V11H5.304a1 1 0 0 1 0-2h3.242V5.758a1 1 0 0 1 2 0V9h3.242a1 1 0 1 1 0 2Z" />
                  </svg>
                  Create New Album
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="our_work_tab_content">
        {status == "1" ? (
          <>
            <AllAlbumsComponent></AllAlbumsComponent>
          </>
        ) : status == "2" ? (
          <AllProjectsComponent></AllProjectsComponent>
        ) : (
          ""
        )}
      </div>
    </>
  );
};

export default OurWorks;