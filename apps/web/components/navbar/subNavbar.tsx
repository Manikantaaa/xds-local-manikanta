"use client";
import { useUserContext } from "@/context/store";
import { use, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PATH } from "@/constants/path";
import { useRouter } from "next/navigation";
import FreeTierAlerts from "../ui/freeTierAlerts";
import { BodyMessageType } from "@/constants/popupBody";
import { authFetcher, patch } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import Link from "next/link";
import Image from "next/image";
import { useRandomDataContext } from "@/context/random-data-store";
const SubNavbar = () => {
  const { user, intrestCount, setIntrestCount } = useUserContext();
  const router = useRouter();
  if (!user) {
    router.push(PATH.HOME.path);
  }
  const [submenu, setSubmenu] = useState(true);
  const [openPopup, setOpenPopup] = useState<boolean>(false);
  const pathname = usePathname();
  const [popupMessage, setPopupMessage] = useState<BodyMessageType>('DEFAULT');
  const { companyCounts, setCompanyCounts } = useRandomDataContext();

  function manuStatus() {
    setSubmenu(!submenu);
  }

  useEffect(() => {
    const comparingCompaniesString = localStorage.getItem("comparingCompanies");
    let comparingCompanies = [];
    if (comparingCompaniesString) {
      comparingCompanies = JSON.parse(comparingCompaniesString);
    }
    setCompanyCounts(comparingCompanies.length)
  }, [localStorage.getItem("comparingCompanies")])

  useEffect(() => {
    getCountOfNewIntrests();
  }, [])

  async function getCountOfNewIntrests() {
    if (user && user.userRoles[0].roleCode !== 'admin') {
      await authFetcher(`${getEndpointUrl(ENDPOINTS.getCountOfNewIntrests)}`).then((result) => {
        if (result && result.success && result.data) {
          setIntrestCount(result.data);
        }
      }).catch((err) => {
        console.log(err);
      });
    }
  }

  const handleFreeRoute = (path: string, e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    e.preventDefault();
    if (user?.isPaidUser) {
      router.push(path);
    } else if (!user?.isPaidUser && user?.userRoles[0].roleCode == "buyer") {
      router.push(path);
    } else {

      if (path == '/my-lists') {
        setPopupMessage('MYLISTS');
      } else if (path == '/my-opportunities') {
        setPopupMessage('MYOPPORTUNITIES');
      } else if (path == '/opportunities') {
        setPopupMessage('BROWSEOPPORTUNITIES');
      } else if (path == '/my-projects') {
        setPopupMessage('MYPROJECTS');
      }
      setOpenPopup(true);
    }
  }

  return (
    <>
      <div className="bg-orange-400 h-[2.25rem] font-bold flex justify-center  gap-4 text-sm xs_mobile_hide">
        <nav className="sub_nav_bg  dark:bg-gray-900  w-full z-20 top-0 start-0">
          <div className="flex flex-wrap items-center text-center  justify-evenly mx-auto p-2">
            <Image priority src="/spark_mascot.png" alt="mascot" width={210} height={210} className="m-auto mobile_show" />

            <div className="md:order-0 space-x-0 md:space-x-0 lg:space-x-0 xl:space-x-0 mobile_show">
              <button
                onClick={() => {
                  manuStatus();
                }}

                data-collapse-toggle="navbar-sticky"
                type="button"
                className="inline-flex items-center  w-6 h-6 justify-center text-sm text-gray-500 rounded-lg md:hidden focus:outline-none focus:ring-0  dark:text-gray-400 "
                aria-controls="navbar-sticky"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                <svg
                  className="w-5 h-5"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 17 14"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M1 1h15M1 7h15M1 13h15"
                  />
                </svg>
              </button>
            </div>
            <div
              className={`items-center justify-between w-full md:flex md:w-auto md:order-1 ${submenu ? "hidden" : ""
                }`}
              id="navbar-sticky"
            >
              {user && user.userRoles[0].roleCode == "admin" ? (
                <ul className="flex flex-col font-bold md:space-x-8  md:flex-row md:mt-0">
                  {/* <li>
                  <Link
                    href="/home"
                    className={`block py-2 px-3 md:p-0 hover:text-white ${pathname.includes("/home") ? "text-white" : "text-gray-900"}`}
                  >
                    Home
                  </Link>
                </li> */}
                  {/* <li>
                    <span className={`block py-2 px-3 md:p-0 hover:text-white addhovereffect ${pathname.includes("/admin/dashboard")
                      ? "text-white"
                      : "text-gray-900"
                      }`}
                      onClick={(e) => { e.preventDefault(); router.push("/admin/dashboard"); }}
                    >
                      Dashboard
                    </span>
                  </li> */}

                  <li>
                    <span className={`block py-2 px-3 md:p-0 hover:text-white addhovereffect ${pathname.includes("/admin/registrations")
                      ? "text-white"
                      : "text-gray-900"
                      }`}
                      onClick={(e) => { e.preventDefault(); router.push("/admin/registrations"); }}
                    >
                      Registrations
                    </span>
                  </li>
                  <li>
                    <span className={`block py-2 px-3 md:p-0 hover:text-white addhovereffect ${pathname.includes("/admin/users") || pathname.includes("/admin/invitees")
                      ? "text-white"
                      : "text-gray-900"
                      }`}
                      onClick={(e) => { e.preventDefault(); router.push("/admin/users"); }}
                    >
                      Users
                    </span>
                  </li>
                  <li>
                    <span className={`block py-2 px-3 md:p-0 hover:text-white addhovereffect ${pathname.includes("/admin/company")
                      ? "text-white"
                      : "text-gray-900"
                      }`}
                      onClick={(e) => { e.preventDefault(); router.push("/admin/company"); }}
                    >
                      Companies
                    </span>
                  </li>
                  <li>
                    <span className={`block py-2 px-3 md:p-0 hover:text-white addhovereffect ${pathname.includes("/admin/reports")
                      ? "text-white"
                      : "text-gray-900"
                      }`}
                      onClick={(e) => { e.preventDefault(); router.push("/admin/reports"); }}
                    >
                      Reports
                    </span>
                  </li>
                  <li>
                    <span className={`block py-2 px-3 md:p-0 hover:text-white addhovereffect ${pathname.includes("/admin/latest-partners")
                      ? "text-white"
                      : "text-gray-900"
                      }`}
                      onClick={(e) => { e.preventDefault(); router.push("/admin/latest-partners"); }}
                    >
                      Upload Active Buyer Logos
                    </span>
                  </li>
                  <li>
                    <span className={`block py-2 px-3 md:p-0 hover:text-white addhovereffect ${(pathname.includes("/admin/faq") || pathname.includes("/admin/advertisements") || pathname.includes("/admin/events") || pathname.includes("/admin/services") || pathname.includes("/admin/articles"))
                      ? "text-white"
                      : "text-gray-900"
                      }`}
                      onClick={(e) => { e.preventDefault(); router.push("/admin/faq"); }}
                    >
                      Content
                    </span>
                  </li>
                </ul>
              ) : (
                <ul className="flex flex-col font-bold md:space-x-8  md:flex-row md:mt-0">
                  <li>
                    <Link className={`block py-2 px-3 md:p-0 hover:text-white addhovereffect ${pathname.includes("/home")
                      ? "text-white"
                      : "text-gray-900"
                      }`}
                      href={"/home"}
                    // onClick={(e) => { e.preventDefault(); router.push("/home"); }}
                    >
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link className={`block py-2 px-3 md:p-0 hover:text-white addhovereffect ${pathname.includes("/serviceproviders")
                      ? "text-white"
                      : "text-gray-900"
                      }`}
                      href={"/serviceproviders"}
                    // onClick={(e) => { e.preventDefault(); router.push("/serviceproviders"); }}
                    >
                      Browse Service Providers
                    </Link>
                  </li>
                  <li>
                    {user?.isPaidUser ?
                      <Link className={`block py-2 px-3 md:p-0 hover:text-white addhovereffect ${!user?.isPaidUser && 'menu_disable'} ${pathname.includes("my-lists")
                        ? "text-white"
                        : "text-gray-900"
                        }`}
                        href={"/my-lists"}
                      >
                        My Lists
                      </Link>
                      :
                      <span className={`block py-2 px-3 md:p-0 hover:text-white addhovereffect ${!user?.isPaidUser && user?.userRoles[0].roleCode == "service_provider" && 'menu_disable'} ${pathname.includes("my-lists")
                        ? "text-white"
                        : "text-gray-900"
                        }`}
                        onClick={(e) => { handleFreeRoute("/my-lists", e); }}
                      >
                        My Lists
                      </span>
                    }
                  </li>
                  <li>

                    {user?.isPaidUser ?
                      <Link className={`block py-2 px-3 md:p-0 hover:text-white addhovereffect ${!user?.isPaidUser && 'menu_disable'} ${pathname.includes("/my-projects")
                        ? "text-white"
                        : "text-gray-900"
                        }`}
                        // onClick={(e) => { handleFreeRoute("/my-projects", e); }}
                        href={"/my-projects"}
                      >
                        My Projects
                      </Link>
                      :
                      <span className={`block py-2 px-3 md:p-0 hover:text-white addhovereffect ${!user?.isPaidUser && user?.userRoles[0].roleCode == "service_provider" && 'menu_disable'} ${pathname.includes("/my-projects")
                        ? "text-white"
                        : "text-gray-900"
                        }`}
                        onClick={(e) => { handleFreeRoute("/my-projects", e); }}
                      >
                        My Projects
                      </span>
                    }
                  </li>
                  <li>
                    <Link className={`block py-2 px-3 md:p-0 hover:text-white addhovereffect ${pathname.includes("/business-solutions")
                      ? "text-white"
                      : "text-gray-900"
                      }`}
                      href={PATH.BUSINESS_SOLUTIONS.path}
                    >
                      {PATH.BUSINESS_SOLUTIONS.name}
                    </Link>
                  </li>
                  <li className="relative">
                    {user?.userRoles[0].roleCode == "buyer" &&
                      <Link className={`block py-2 px-3 md:p-0 hover:text-white addhovereffect ${pathname.includes("/my-opportunities")
                        ? "text-white"
                        : "text-gray-900"
                        }`}
                        href={"/my-opportunities"}
                      // onClick={(e) => { handleFreeRoute("/my-opportunities", e) }}
                      >
                        {
                          (intrestCount && intrestCount > 0) ?
                            <div className="absolute  items-center justify-center text-xs font-bold subscribe_top_btn border-1 notification_bg  rounded-full ">{intrestCount}</div>
                            :
                            ""
                        }

                        Post Opportunities
                        {
                          (intrestCount && intrestCount > 0) ?
                            <svg id="Layer_4" enable-background="new 0 0 24 24" fill="#474747" height="16" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg"><g><path d="m21.379 16.913c-1.512-1.278-2.379-3.146-2.379-5.125v-2.788c0-3.519-2.614-6.432-6-6.92v-1.08c0-.553-.448-1-1-1s-1 .447-1 1v1.08c-3.387.488-6 3.401-6 6.92v2.788c0 1.979-.867 3.847-2.388 5.133-.389.333-.612.817-.612 1.329 0 .965.785 1.75 1.75 1.75h16.5c.965 0 1.75-.785 1.75-1.75 0-.512-.223-.996-.621-1.337z" /><path d="m12 24c1.811 0 3.326-1.291 3.674-3h-7.348c.348 1.709 1.863 3 3.674 3z" /></g></svg>
                            :
                            ""
                        }
                      </Link>
                      // :
                      // <span className={`block py-2 px-3 md:p-0 hover:text-white addhovereffect ${!user?.isPaidUser && user?.userRoles[0].roleCode =="service_provider" && 'menu_disable'} ${pathname.includes("/my-opportunities")
                      //   ? "text-white"
                      //   : "text-gray-900"
                      //   }`}
                      //   onClick={(e) => { handleFreeRoute("/my-opportunities", e) }}
                      // >
                      //   {
                      //     (intrestCount && intrestCount > 0) ?
                      //       <div className="absolute  items-center justify-center text-xs font-bold subscribe_top_btn border-1 notification_bg  rounded-full ">{intrestCount}</div>
                      //       :
                      //       ""
                      //   }

                      //   My Opportunities
                      //   {
                      //     (intrestCount && intrestCount > 0) ?
                      //       <svg id="Layer_4" enable-background="new 0 0 24 24" fill="#474747" height="16" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg"><g><path d="m21.379 16.913c-1.512-1.278-2.379-3.146-2.379-5.125v-2.788c0-3.519-2.614-6.432-6-6.92v-1.08c0-.553-.448-1-1-1s-1 .447-1 1v1.08c-3.387.488-6 3.401-6 6.92v2.788c0 1.979-.867 3.847-2.388 5.133-.389.333-.612.817-.612 1.329 0 .965.785 1.75 1.75 1.75h16.5c.965 0 1.75-.785 1.75-1.75 0-.512-.223-.996-.621-1.337z" /><path d="m12 24c1.811 0 3.326-1.291 3.674-3h-7.348c.348 1.709 1.863 3 3.674 3z" /></g></svg>
                      //       :
                      //       ""
                      //   }
                      // </span>
                    }
                  </li>
                  {/* {user && user.userRoles[0].roleCode == "service_provider" ? (
                    <li>
                      {user?.isPaidUser ?
                        <Link className={`block py-2 px-3 md:p-0 hover:text-white addhovereffect ${!user?.isPaidUser && 'menu_disable'} ${pathname.includes("/opportunities")
                          ? "text-white"
                          : "text-gray-900"
                          }`}
                          href={"/opportunities"}
                         // onClick={(e) => handleFreeRoute("/opportunities", e)}
                        >
                          Browse Opportunities
                        </Link>
                        :
                        <span className={`block py-2 px-3 md:p-0 hover:text-white addhovereffect ${!user?.isPaidUser && 'menu_disable'} ${pathname.includes("/opportunities")
                          ? "text-white"
                          : "text-gray-900"
                          }`}
                          onClick={(e) => handleFreeRoute("/opportunities", e)}
                        >
                          Browse Opportunities
                        </span>
                      }
                    </li>
                  ) : (
                    ""
                  )} */}
                  <li className="absolute right-[20px]">
                    <Link
                      style={
                        {
                          cursor: companyCounts < 1 ? 'not-allowed' : 'pointer',
                          pointerEvents: companyCounts < 1 ? 'none' : 'auto'
                        }
                      }
                      className={`block py-2 px-3 md:p-0 hover:text-white addhovereffect ${pathname.includes("/compare")
                        ? "text-white"
                        : "text-gray-900"
                        } ${((!user?.isPaidUser && user?.userRoles[0].roleCode === "service_provider") || companyCounts < 1) ? "menu_disable" : ""}`}
                      href={(!user?.isPaidUser && user?.userRoles[0].roleCode === "service_provider") ? "" : "/compare"}
                      onClick={() => {
                        if (!user?.isPaidUser && user?.userRoles[0].roleCode === "service_provider") {
                          setPopupMessage('FREE_COMPARE_COMPANIES')
                          setOpenPopup(true);
                        }
                      }}
                    >
                      Compare({companyCounts >= 5 ? "5" : companyCounts})
                    </Link>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </nav>
      </div>
      <FreeTierAlerts isOpen={openPopup} setOpenPopup={setOpenPopup} bodymessage={popupMessage} />
    </>
  );
};
// {
//     userRole == "admin" ?
//     <div className="h-[2.25rem] font-bold flex justify-center items-center gap-4 text-sm">
//         <Link href="#">Registrations</Link>
//         <Link href={PATH.HOME.path}>Users</Link>
//         <Link href="#">Companies</Link>
//         <Link href="#">Reports</Link>
//     </div>
//     :
//     <div className="h-[2.25rem] font-bold flex justify-center items-center gap-4 text-sm">
//         <Link href={PATH.HOME.path}>{PATH.HOME.name}</Link>
//         <Link href="#">Browse Service Providers</Link>
//         <Link href="#">My Opportunities</Link>
//     </div>
// }
export default SubNavbar;
