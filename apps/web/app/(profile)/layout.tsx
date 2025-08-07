"use client";
import FreeTierAlerts from "@/components/ui/freeTierAlerts";
import { PATH } from "@/constants/path";
import { BodyMessageType } from "@/constants/popupBody";
import { useUserContext } from "@/context/store";
import { useProfileStatusContext } from "@/context/profilePercentage";
import { Button, Modal, Tooltip } from "flowbite-react";
import Link from "next/link";
import { redirect, useParams, useSearchParams } from "next/navigation";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { authFetcher, authPut } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import usePagePermissions from "@/hooks/usePagePermissions";

export default function MyProfileLayout({
  children,
  props
}: {
  children: React.ReactNode;
  props: { text: string }
}) {
  const { user } = useUserContext();
  const { profilepercentage } = useProfileStatusContext();
  const { setProfilepercentage } = useProfileStatusContext();
  const [pageTitle, setPageTitle] = useState("XDS Spark");
  const [archiveListModel, setArchiveListMdel] = useState<boolean>(false);
  if (!user) {
    localStorage.setItem("generalInfo", "general-info");
    redirect(PATH.HOME.path);
  }
  const Users_Permissions = usePagePermissions(16);
  const Group_Permissions = usePagePermissions(17);
  const AnnouncementPermissions = usePagePermissions(19);
  const [popupMessage, setPopupMessage] = useState<BodyMessageType>('DEFAULT');
  const [openPopup, setOpenPopup] = useState<boolean>(false);
  const [profileStatusPopup, setProfileStatusPopup] = useState<boolean>(true);
  const [eventsAvailableFlag, setEventsAvailableFlag] = useState<boolean>(false);
  const pathname = usePathname();
  const [isEventsLoaded, setIsEventsLoaded] = useState<boolean>(true);
  const handleFreeRoute = (pageName: string) => {
    if (pageName == 'ourwork') {
      setPopupMessage('SETTINGS_OURWORKS');
    } else if (pageName == 'services') {
      setPopupMessage('SETTINGS_SERVICES');
    } else if (pageName == 'certificate') {
      setPopupMessage('SETTINGS_CERT_DILIGENCE');
    } else if (pageName == 'contact') {
      setPopupMessage('SETTINGS_CONTACTS');
    } else if (pageName == 'EVENTS') {
      setPopupMessage("EVENTS");
    } else if (pageName == 'COMPANY_ADMIN') {
      setPopupMessage('COMPANY_ADMIN_ACCESS');
    } else if(pageName == 'announcements') {
      setPopupMessage('ANNOUNCEMENTS');
    } else {
      setPopupMessage('DEFAULT');
    }
    setOpenPopup(true);
  }

  useEffect(() => {
    if (profilepercentage && profilepercentage.generalInfoProfilePerc == 20 && profilepercentage.aboutProfilePerc == 16 && profilepercentage.certificationsProfilePerc == 16 && profilepercentage.contactsProfilePerc == 16 && profilepercentage.ourWorkAlbumsProfilePerc == 8 && profilepercentage.ourWorkProjectProfilePerc == 8 && profilepercentage.servicesProfilePerc == 16 && profilepercentage.bannerAssetId != null && !profilepercentage.profileCompleted) {
      setProfilepercentage({
        generalInfoProfilePerc: profilepercentage.generalInfoProfilePerc,
        aboutProfilePerc: profilepercentage.aboutProfilePerc,
        ourWorkAlbumsProfilePerc: profilepercentage.ourWorkAlbumsProfilePerc,
        ourWorkProjectProfilePerc: profilepercentage.ourWorkProjectProfilePerc,
        servicesProfilePerc: profilepercentage.servicesProfilePerc,
        certificationsProfilePerc: profilepercentage.certificationsProfilePerc,
        contactsProfilePerc: profilepercentage.contactsProfilePerc,
        profileCompleted: true,
        bannerAssetId: profilepercentage.bannerAssetId,
      });
      setProfileStatusPopup(false);
    }
  }, [profilepercentage]);
  useEffect(() => {
    if (profilepercentage?.profileCompleted === true && !profileStatusPopup) {
      setArchiveListMdel(true);
    }
  }, [!profileStatusPopup]);

  const updateProfileStatus = async () => {
    await authPut(`${getEndpointUrl(ENDPOINTS.updateProfileStatus(user.companyId))}`)
      .then(() => {
        setProfileStatusPopup(true);
        setArchiveListMdel(false);
      });
  }

  useEffect(() => {
    async function getEventsCount() {
      await authFetcher(`${getEndpointUrl(ENDPOINTS.getEventsCount)}`)
        .then((res) => {
          setEventsAvailableFlag(res.EventsAvailable)
        });
    }
    if (isEventsLoaded) {
      getEventsCount();
      setIsEventsLoaded(false);
    }
  }, [isEventsLoaded]);

  const paramsPath = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {

    if (searchParams.get("goto") && searchParams.get("goto") == '1') {
      document.title = "XDS Spark - " + PATH.ALBUMS.name;
      return
    } else if (searchParams.get("goto") && searchParams.get("goto") == '2') {
      document.title = "XDS Spark - " + PATH.PROJECTS.name;
      return
    } else if (paramsPath.includes("update-album")) {
      document.title = "XDS Spark - " + PATH.UPDATE_ALBUM.name;
      return
    } else if (paramsPath.includes("update-project")) {
      document.title = "XDS Spark - " + PATH.UPDATEPROJECT.name;
      return
    }

    Object.keys(PATH).forEach((pagePath: string) => {
      const pageData = PATH[pagePath as keyof typeof PATH];
      if (pageData.path === paramsPath) {
        document.title = "XDS Spark - " + pageData.name;
      }
    });
  }, [paramsPath, searchParams]);
  return (
    <>
      <title> {pageTitle}</title>
      <div className="w-full lg:container">
        {/* <Sidebar /> */}
        <aside
          id="sidebar-multi-level-sidebar"
          className="absolute z-40 w-60 box_shadow h-screen transition-transform -translate-x-full sm:translate-x-0 lg:flex sm:hidden xs_mobile_hide"
          aria-label="Sidebar"
        >
          <div className="h-full">
            <div className="p-6">
              <div className="sm:text-left pb-2.5">
                <h1 className="font-bold  heading-sub-font">My Profile</h1>
              </div>
              <ul className="space-y-2.5 text-left text-gray-900  text-sm">
                <li className="flex items-center space-x-3  relative">
                  <Link
                    href="/my-profile/personal-settings"
                    className={
                      pathname.includes("/my-profile/personal-settings")
                        ? "side_link_active_color"
                        : "side_link_color"
                    }
                  >
                    Personal Settings
                  </Link>
                </li>
                <li className="flex items-center space-x-3 relative">
                  <Link
                    href="/my-profile/change-password"
                    className={
                      pathname.includes("/my-profile/change-password")
                        ? "side_link_active_color"
                        : "side_link_color"
                    }
                  >
                    Change Password
                  </Link>
                </li>
                <li className="flex items-center space-x-3 relative">
                  <Link
                    href="/my-profile/security-settings"
                    className={
                      pathname.includes("/my-profile/security-settings")
                        ? "side_link_active_color"
                        : "side_link_color"
                    }
                  >
                    Security Settings
                  </Link>
                </li>
                {!user?.isCompanyUser &&
                  <li className="flex items-center space-x-3 relative">
                    <Link
                      href="/my-profile/subscriptions"
                      className={
                        pathname.includes("/my-profile/subscriptions")
                          ? "side_link_active_color"
                          : "side_link_color"
                      }
                    >
                      Subscription Details
                    </Link>
                  </li>
                }
              </ul>
              {user &&
                user.userRoles[0] &&
                user.userRoles[0].roleCode == "service_provider" &&
                user.isPaidUser ? (
                <>
                  <div className="sm:text-left pt-2.5 pb-2.5">
                    <h1 className="font-bold text-gray-900 heading-sub-font">
                      Company Profile
                    </h1>
                  </div>
                  <ul className="space-y-2.5 text-left text-gray-900 text-sm">
                    <li className="flex items-center space-x-3 relative">
                      <Link
                        href="/company-profile/general-info"
                        className={
                          pathname.includes("/company-profile/general-info")
                            ? "side_link_active_color"
                            : "side_link_color"
                        }
                      >
                        General Info
                      </Link>
                      {profilepercentage && profilepercentage.generalInfoProfilePerc != 0 && profilepercentage.bannerAssetId != null && !profilepercentage.profileCompleted ?
                        <div className="absolute -right-12">
                          <button>
                            <Tooltip content="This section is 100% complete" className="tier_tooltip">
                              {" "}
                              <svg
                                className={`w-4 h-4 me-2 green_c flex-shrink-0 green_c`}
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                              </svg>
                            </Tooltip>
                          </button>
                        </div>
                        :
                        (profilepercentage && !profilepercentage.profileCompleted ?
                          <div className="absolute -right-12">
                            <button>
                              <Tooltip content="This section is incomplete" className="tier_tooltip">
                                <svg version="1.1"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className={`w-4 h-4 me-2  flex-shrink-0 `}
                                  x="0px" y="0px" viewBox="0 0 512 512" fill="#6c6d6d">
                                  <g>
                                    <path d="M256,0C115.03,0,0,115.05,0,256c0,140.97,115.05,256,256,256c140.97,0,256-115.05, 256-256C512,115.03,396.95,0,256,0z M256,482C131.383,482,30,380.617,30,256S131.383,30,256,30s226,101.383,226,226S380.617,482,256,482z">
                                    </path></g>
                                </svg>
                              </Tooltip>
                            </button>
                          </div>
                          : ''
                        )
                      }
                    </li>
                    <li className="flex items-center space-x-3 relative">
                      <Link
                        href="/company-profile/about"
                        className={
                          pathname.includes("/company-profile/about")
                            ? "side_link_active_color"
                            : "side_link_color"
                        }
                      >
                        About
                      </Link>
                      {profilepercentage && !profilepercentage.profileCompleted && profilepercentage.aboutProfilePerc != 0 ?
                        <div className="absolute -right-12">
                          <button>
                            <Tooltip content="This section is 100% complete" className="tier_tooltip">
                              {" "}
                              <svg
                                className={`w-4 h-4 me-2 green_c flex-shrink-0 green_c`}
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                              </svg>
                            </Tooltip>
                          </button>
                        </div>
                        :
                        (profilepercentage && !profilepercentage.profileCompleted ?
                          <div className="absolute -right-12">
                            <button>
                              <Tooltip content="This section is incomplete" className="tier_tooltip">
                                <svg version="1.1"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className={`w-4 h-4 me-2  flex-shrink-0 `}
                                  x="0px" y="0px" viewBox="0 0 512 512" fill="#6c6d6d">
                                  <g>
                                    <path d="M256,0C115.03,0,0,115.05,0,256c0,140.97,115.05,256,256,256c140.97,0,256-115.05, 256-256C512,115.03,396.95,0,256,0z M256,482C131.383,482,30,380.617,30,256S131.383,30,256,30s226,101.383,226,226S380.617,482,256,482z">
                                    </path></g>
                                </svg>
                              </Tooltip>
                            </button>
                          </div>
                          : ''
                        )
                      }

                    </li>
                    <li className="flex items-center space-x-3 relative">
                      <Link
                        href="/company-profile/our-works?goto=1"
                        className={
                          pathname.includes("/company-profile/our-works")
                            ? "side_link_active_color"
                            : "side_link_color"
                        }
                      >
                        Our Work
                      </Link>
                      {profilepercentage && (profilepercentage.ourWorkAlbumsProfilePerc + profilepercentage.ourWorkProjectProfilePerc) == 16 && !profilepercentage.profileCompleted ?
                        <div className="absolute -right-12">
                          <button>
                            <Tooltip content="This section is 100% complete" className="tier_tooltip">
                              {" "}
                              <svg
                                className={`w-4 h-4 me-2 green_c flex-shrink-0 green_c`}
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                              </svg>
                            </Tooltip>
                          </button>
                        </div>
                        :
                        (profilepercentage && !profilepercentage.profileCompleted ?
                          <div className="absolute -right-12">
                            <button>
                              <Tooltip content="This section is incomplete" className="tier_tooltip">
                                <svg version="1.1"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className={`w-4 h-4 me-2  flex-shrink-0 `}
                                  x="0px" y="0px" viewBox="0 0 512 512" fill="#6c6d6d">
                                  <path d="M256,0C115.03,0,0,115.05,0,256c0,140.97,115.05,256,256,256c140.97,0,256-115.05, 256-256C512,115.03,396.95,0,256,0z M256,482C131.383,482,30,380.617,30,256S131.383,30,256,30s226,101.383,226,226S380.617,482,256,482z">
                                  </path>
                                </svg>
                              </Tooltip>
                            </button>
                          </div>
                          : ''
                        )
                      }
                    </li>
                    <li className="flex items-center space-x-3 relative">
                      <Link
                        href="/company-profile/services"
                        className={
                          pathname.includes("/company-profile/services")
                            ? "side_link_active_color"
                            : "side_link_color"
                        }
                      >
                        Services
                      </Link>
                      {profilepercentage && !profilepercentage.profileCompleted && profilepercentage.servicesProfilePerc != 0 ?
                        <div className="absolute -right-12">
                          <button>
                            <Tooltip content="This section is 100% complete" className="tier_tooltip">
                              {" "}
                              <svg
                                className={`w-4 h-4 me-2 green_c flex-shrink-0 green_c`}
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                              </svg>
                            </Tooltip>
                          </button>
                        </div>
                        :
                        (profilepercentage && !profilepercentage.profileCompleted ?
                          <div className="absolute -right-12">
                            <button>
                              <Tooltip content="This section is incomplete" className="tier_tooltip">
                                <svg version="1.1"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className={`w-4 h-4 me-2  flex-shrink-0 `}
                                  x="0px" y="0px" viewBox="0 0 512 512" fill="#6c6d6d">
                                  <g>
                                    <path d="M256,0C115.03,0,0,115.05,0,256c0,140.97,115.05,256,256,256c140.97,0,256-115.05, 256-256C512,115.03,396.95,0,256,0z M256,482C131.383,482,30,380.617,30,256S131.383,30,256,30s226,101.383,226,226S380.617,482,256,482z">
                                    </path></g>
                                </svg>
                              </Tooltip>
                            </button>
                          </div>
                          : ''
                        )
                      }

                    </li>
                    <li className="flex items-center space-x-3 relative">
                      <Link
                        href="/company-profile/due-diligence"
                        className={
                          pathname.includes(
                            "/company-profile/due-diligence",
                          )
                            ? "side_link_active_color"
                            : "side_link_color"
                        }
                      >
                        Due Diligence
                      </Link>
                      {profilepercentage && profilepercentage.certificationsProfilePerc != 0 && !profilepercentage.profileCompleted ?
                        <div className="absolute -right-12">
                          <button>
                            <Tooltip content="This section is 100% complete" className="tier_tooltip">
                              {" "}
                              <svg
                                className={`w-4 h-4 me-2 green_c flex-shrink-0 green_c`}
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                              </svg>
                            </Tooltip>
                          </button>
                        </div>
                        :
                        (profilepercentage && !profilepercentage.profileCompleted ?
                          <div className="absolute -right-12">
                            <button>
                              <Tooltip content="This section is incomplete" className="tier_tooltip">
                                <svg version="1.1"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className={`w-4 h-4 me-2  flex-shrink-0 `}
                                  x="0px" y="0px" viewBox="0 0 512 512" fill="#6c6d6d">
                                  <g>
                                    <path d="M256,0C115.03,0,0,115.05,0,256c0,140.97,115.05,256,256,256c140.97,0,256-115.05, 256-256C512,115.03,396.95,0,256,0z M256,482C131.383,482,30,380.617,30,256S131.383,30,256,30s226,101.383,226,226S380.617,482,256,482z">
                                    </path></g>
                                </svg>
                              </Tooltip>
                            </button>
                          </div>
                          :
                          ''
                        )
                      }
                    </li>
                    <li className="flex items-center space-x-3 relative">
                      <Link passHref
                        href="/company-profile/contacts"
                        className={
                          pathname.includes("/company-profile/contacts")
                            ? "side_link_active_color"
                            : "side_link_color"
                        }
                      >
                        Contacts
                      </Link>
                      {profilepercentage && profilepercentage.contactsProfilePerc != 0 && !profilepercentage.profileCompleted ?
                        <div className="absolute -right-12">
                          <button>
                            <Tooltip content="This section is 100% complete" className="tier_tooltip">
                              {" "}
                              <svg
                                className={`w-4 h-4 me-2 green_c flex-shrink-0 green_c`}
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                              </svg>
                            </Tooltip>
                          </button>
                        </div>
                        :
                        (profilepercentage && !profilepercentage.profileCompleted ?
                          <div className="absolute -right-12">
                            <button>
                              <Tooltip content="This section is incomplete" className="tier_tooltip">
                                <svg version="1.1"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className={`w-4 h-4 me-2  flex-shrink-0 `}
                                  x="0px" y="0px" viewBox="0 0 512 512" fill="#6c6d6d">
                                  <g>
                                    <path d="M256,0C115.03,0,0,115.05,0,256c0,140.97,115.05,256,256,256c140.97,0,256-115.05, 256-256C512,115.03,396.95,0,256,0z M256,482C131.383,482,30,380.617,30,256S131.383,30,256,30s226,101.383,226,226S380.617,482,256,482z">
                                    </path></g>
                                </svg>
                              </Tooltip>
                            </button>
                          </div>
                          : ''
                        )

                      }

                    </li>
                    {eventsAvailableFlag &&
                      <li className="flex items-center space-x-3 relative">
                        <Link passHref
                          href="/company-profile/events"
                          className={
                            pathname.includes("/company-profile/events")
                              ? "side_link_active_color"
                              : "side_link_color"
                          }
                        >
                          Events
                        </Link>
                      </li>}
                      {
                        ((!AnnouncementPermissions.isCompanyUser) || (AnnouncementPermissions.isCompanyUser && AnnouncementPermissions.canRead)) &&
                        <li className="flex items-center space-x-3 relative">
                          <Link passHref
                            href="/company-profile/post-announcements"
                            className={
                              pathname.includes("/company-profile/post-announcements")
                                ? "side_link_active_color"
                                : "side_link_color"
                            }
                          >
                            Post Announcements
                          </Link>
                          {
                            !(user?.companies[0]?.addedAnnouncement) &&
                            <span className="new-badge new-badge-side absolute right-[-42px]">NEW</span>
                          }
                        </li>
                      }
                    <li className="flex items-center space-x-3 relative py-3">
                      <Link
                        href={`/serviceproviders-details/${user.slug}`}
                        className="link_color"
                      >
                        View Company Profile
                      </Link>
                    </li>
                  </ul>
                </>
              ) : user &&
                user.userRoles[0] &&
                user.userRoles[0].roleCode == "service_provider" &&
                !user.isPaidUser ? (
                <>
                  <div className="sm:text-left pt-2.5 pb-2.5">
                    <h1 className="font-bold text-gray-900 heading-sub-font">
                      Company Profile
                    </h1>
                  </div>
                  <ul className="space-y-2.5 text-left text-gray-900 text-sm">
                    {user?.userRoles[0].roleCode === 'service_provider' ?
                      <li className="flex items-center space-x-3 relative">
                        <Link
                          href="/company-profile/general-info"
                          className={
                            pathname.includes("/company-profile/general-info")
                              ? "side_link_active_color"
                              : "side_link_color"
                          }
                        >
                          General Info
                        </Link>
                      </li>
                      :
                      <li onClick={() => handleFreeRoute('generalinfo')} className="flex items-center space-x-3 relative text-gray-500 ">
                        General Info
                      </li>
                    }
                    <li className="flex items-center space-x-3 relative">
                      <Link
                        href="/company-profile/about"
                        className={
                          pathname.includes("/company-profile/about")
                            ? "side_link_active_color"
                            : "side_link_color"
                        }
                      >
                        About
                      </Link>
                    </li>
                    <li onClick={() => handleFreeRoute('ourwork')} className="flex items-center cursor-pointer space-x-3 relative text-gray-500">
                      Our Work
                    </li>
                    <li className="flex items-center space-x-3 relative">
                      <Link
                        href="/company-profile/services"
                        className={
                          pathname.includes("/company-profile/services")
                            ? "side_link_active_color"
                            : "side_link_color"
                        }
                      >
                        Services
                      </Link>
                    </li>
                    {/* <li onClick={() => handleFreeRoute('services')} className="flex items-center space-x-3 rtl:space-x-reverse text-gray-500">
                      Services
                    </li> */}
                    <li onClick={() => handleFreeRoute('certificate')} className="flex items-center cursor-pointer space-x-3 relative text-gray-500">
                      Due Diligence
                    </li>
                    <li onClick={() => handleFreeRoute('contact')} className="flex items-center cursor-pointer space-x-3 relative text-gray-500">
                      Contacts
                    </li>
                    {eventsAvailableFlag &&
                      <li onClick={() => handleFreeRoute('EVENTS')} className="flex items-center cursor-pointer space-x-3 relative text-gray-500">
                        Events
                      </li>
                    }
                    <li onClick={() => handleFreeRoute('announcements')} className="flex items-center cursor-pointer space-x-3 relative text-gray-500">
                      <span>Post Announcements</span>
                      {
                        !(user?.companies[0]?.addedAnnouncement) &&
                        <span className="new-badge new-badge-side absolute right-[-50px]">NEW</span>
                      }
                    </li>
                    <li className="flex items-center space-x-3 relative py-3">
                      <Link
                        href={`/serviceproviders-details/${user.slug}`}
                        className="link_color"
                      >
                        View Company Profile
                      </Link>
                    </li>
                  </ul>
                </>
              ) : (
                ""
              )}

              {((!Users_Permissions.isCompanyUser) || (Users_Permissions.isCompanyUser && (Users_Permissions.canRead) || Group_Permissions.canRead)) &&
                <div className="sm:text-left pt-2.5 pb-2.5">
                  <h1 className="font-bold text-gray-900 heading-sub-font inline-flex">

                   
                      <>
                        <span>Company Admin</span>

                        <Tooltip content="Create and manage user accounts to collaborate with colleagues, and adjust their access permissions under Groups." className="tier_tooltip_company_admin">

                          <svg className="ms-1 -mt-0.5 w-4 h-4 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="8" height="8 " fill="currentColor" viewBox="0 0 24 24">
                            <path fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm9.008-3.018a1.502 1.502 0 0 1 2.522 1.159v.024a1.44 1.44 0 0 1-1.493 1.418 1 1 0 0 0-1.037.999V14a1 1 0 1 0 2 0v-.539a3.44 3.44 0 0 0 2.529-3.256 3.502 3.502 0 0 0-7-.255 1 1 0 0 0 2 .076c.014-.398.187-.774.48-1.044Zm.982 7.026a1 1 0 1 0 0 2H12a1 1 0 1 0 0-2h-.01Z" clip-rule="evenodd" />
                          </svg>
                        </Tooltip>
                      </>
                    
                  </h1>
                </div>
              }
              <ul className="space-y-2.5 text-left text-gray-900 text-sm">
                {((!Users_Permissions.isCompanyUser && user?.isPaidUser) || (Users_Permissions.isCompanyUser && Users_Permissions.canRead)) ?
                  <li className="flex items-center space-x-3 relative">
                    <Link href="/company-admin/users"
                      className={pathname.includes("/company-admin/users")
                        ? "side_link_active_color"
                        : "side_link_color"
                      }>
                      Users
                    </Link>
                  </li>
                  :
                  (!Users_Permissions.isCompanyUser && !user?.isPaidUser) &&
                  <li onClick={() => handleFreeRoute('COMPANY_ADMIN')} className="flex items-center cursor-pointer space-x-3 relative text-gray-500 ">
                    Users
                  </li>
                }
                {((!Group_Permissions.isCompanyUser && user?.isPaidUser) || (Group_Permissions.isCompanyUser && Group_Permissions.canRead)) ?
                  <li className="flex items-center space-x-3 relative">
                    <Link href="/company-admin/groups"
                      className={pathname.includes("/company-admin/groups")
                        ? "side_link_active_color"
                        : "side_link_color"
                      }>
                      Groups
                    </Link>
                  </li>
                  :
                  (!user?.isPaidUser && !Users_Permissions.isCompanyUser) &&
                  <li onClick={() => handleFreeRoute('COMPANY_ADMIN')} className="flex items-center cursor-pointer space-x-3 relative text-gray-500 ">
                    Groups
                  </li>
                }


                {/* <li className="flex items-center space-x-3 relative">
                  <Link href="/company-profile/general-info" className="side_link_color" >
                  Permissions
                  </Link>
                </li>
                <li className="flex items-center space-x-3 relative">
                  <Link href="/company-profile/general-info" className="side_link_color" >
                  Settings
                  </Link>
                </li> */}
              </ul>

            </div>
          </div>
        </aside>
        {archiveListModel &&
          <div className="animation_overlay_1">
            <div className="animation_overlay_spread"></div>
          </div>
        }
        <Modal
          size="sm"
          show={archiveListModel}
          onClose={() => setArchiveListMdel(false)}
          className="congrats_bg_white_r"
        >
          <Modal.Header className="modal_header">

          </Modal.Header>
          <Modal.Body>
            <div className="-mt-5 block"><img src="/profile_completed.png" className="m-auto" /></div>
            <h4 className="congartulation_title">Congratulations!</h4>
            <div className="space-y-6 font-normal  m-auto text-center text-[14px]">

              You've completed your profile! Continue to make regular updates so buyers see your latest info and creations.
            </div>
          </Modal.Body>
          <Modal.Footer className="modal_footer congrats_modal_footer">
            <Button
              onClick={updateProfileStatus}
            >
              Ok
            </Button>
          </Modal.Footer>
        </Modal>

        <div className="px-4 sm:ml-64 lg:ml-64  md:ml-0">
          <div className="lg:px-4">{children}</div>
        </div>
        <FreeTierAlerts isOpen={openPopup} setOpenPopup={setOpenPopup} bodymessage={popupMessage} />
        {/* <ToastContainer position="bottom-right" style={{ width: "350px" }} /> */}
      </div>
    </>
  );
}
