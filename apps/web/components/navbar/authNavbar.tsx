"use client";

import Image from "next/image";
import xdsLogo from "@/public/xds-logo.svg";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useUserContext } from "@/context/store";
import { PATH } from "@/constants/path";
import SubNavbar from "./subNavbar";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import * as firebaseAuth from "firebase/auth";
import { auth, realtimeDb, signOut } from "@/services/firebase";
import FreeTierAlerts from "../ui/freeTierAlerts";
import { BodyMessageType } from "@/constants/popupBody";
import { usePathname } from "next/navigation";
import usePagePermissions from "@/hooks/usePagePermissions";
import { limitToLast, off, onChildAdded, onValue, query, ref, remove } from "firebase/database";
import { authFetcher } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import Notifications from "../notifications";
import { encryptString } from "@/services/common-methods";

const AuthNavbar = () => {
  const { user, setUser, handleSignOut } = useUserContext();
  const router = useRouter();
  const [popupMessage, setPopupMessage] = useState<BodyMessageType>('DEFAULT');
  if (!user) {
    router.push(PATH.HOME.path);
  }
  const [openPopup, setOpenPopup] = useState<boolean>(false);
  const currentUrl = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);
  const [showSubnavbar, setShowSubnavbar] = useState(false);
  const params = usePathname();
  const Users_Permissions = usePagePermissions(16);
  const Group_Permissions = usePagePermissions(17);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const theEnvUrl = "" + process.env.NEXT_PUBLIC_XDS_RUN_ENVIRONMENT;
  const [showNotifications, setShowNotifications] = useState(false);

  const searchParams = useSearchParams();
  let allowedView = "1";

  if(currentUrl == "/shared-list" || currentUrl == "/shared-project") {
  // if(currentUrl == "/shared-list") {
    allowedView = user ? "1" : "0";
  }

  let globalFollowNotificationId = "";
  let globalUserNotificationId = "";
  let globalGeneralNotificationId = "";
  
  useEffect(() => {
    const intervalId = setInterval(async () => {
      refreshToken();
    }, 3420000);

    const timeout = setTimeout(() => {
      setShowSubnavbar(true);
    }, 200);
    return () => { clearInterval(intervalId), clearTimeout(timeout) };
  }, []);

  useEffect(() => {

    if (params.includes('/compare')) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    if(params.includes("/admin/")) {
      document.title = "XDS Spark - Admin";
      return
    }
    if (params.includes('update-list')) {
      document.title = "XDS Spark - " + PATH.UPDATEMYLIST.name;
      return;
    }
    if (params.includes('update-project')) {
      document.title = "XDS Spark - " + PATH.UPDATEMYPROJECTS.name;
      return;
    }
    else if (params.includes("my-lists")) {
      document.title = "XDS Spark - " + PATH.MYLISTS.name;
      return
    }
    else if (params.includes("my-projects")) {
      document.title = "XDS Spark - " + PATH.MYPROJECTS.name;
      return
    }
    else if (params.includes("my-opportunities")) {
      document.title = "XDS Spark - " + PATH.MYOPPERTUNITIES.name;
      return
    }
    else if (params.includes("opportunity-details")) {
      document.title = "XDS Spark - Browse Opportunities";
      return
    }
    else if (params.includes("company-admin/user")) {
      document.title = "XDS Spark - " + PATH.COMPANY_USERS.name;
      return
    }
    else if (params.includes("company-admin/groups")) {
      document.title = "XDS Spark - " + PATH.COMPANY_GROUPS.name;
      return
    }
    else if (params.includes("business-solutions")) {
      document.title = "XDS Spark - " + PATH.BUSINESS_SOLUTIONS.name;
      return
    }
    Object.keys(PATH).forEach((pagePath: string) => {
      const pageData = PATH[pagePath as keyof typeof PATH];

      const spliitedPath = params.split("/");

      const updatedpaths = spliitedPath.map(segment => `/${segment}`);


      if (pageData.path === params || (spliitedPath[1] && !spliitedPath[2] && pageData.path == updatedpaths[1]) || (updatedpaths[2] && pageData.path == updatedpaths[2])) {
        document.title = "XDS Spark - " + pageData.name;
      }
    });

  }, [params]);
  useEffect(() => {
    const followNotificationUrl = theEnvUrl + `/followNotification`;
    const followNotification = query(ref(realtimeDb, followNotificationUrl), limitToLast(1));
    const unsubscribeFollowNotification = onChildAdded(followNotification, (snapshot) => {
      const notificationId = snapshot.key;
      const notificationData = snapshot.val();
      if (notificationId && notificationId != globalFollowNotificationId) {
        globalFollowNotificationId = notificationId
        if(user && user.companyId) {
          if(notificationData.toCompanyIds.includes(user.companyId)) {
            deleteNotification(notificationId, followNotificationUrl);
            getAllNotifications();
          }
        }
      }
    });

    const adminNotificationUrl = theEnvUrl + `/adminNotification`;
    const adminNotification = query(ref(realtimeDb, adminNotificationUrl), limitToLast(1));
    const adminNotifications = onChildAdded(adminNotification, (snapshot) => {
      const notificationId = snapshot.key;
      const notificationData = snapshot.val();
      if (notificationId && notificationId != globalFollowNotificationId) {
        globalFollowNotificationId = notificationId
        if(user && user.companyId) {
          if(notificationData.toCompanyIds.includes(user.companyId)) {
            deleteNotification(notificationId, adminNotificationUrl);
            getAllNotifications();
          }
        }
      }
    });

    const singleUserNoUrl = theEnvUrl + `/users/${user?.companyId}/notifications`;
    const userNotification = query(ref(realtimeDb, singleUserNoUrl), limitToLast(1));
    const unsubscribeUserNotification = onChildAdded(userNotification, (snapshot) => {
      const notificationId = snapshot.key;
      if (notificationId && notificationId != globalUserNotificationId) {
        globalUserNotificationId = notificationId
        deleteNotification(notificationId, singleUserNoUrl);
        getAllNotifications();
      }
    });

    const generalNotificationUrl = theEnvUrl + `/generalNotification`;
    const generalFollowNotification = query(ref(realtimeDb, generalNotificationUrl), limitToLast(1));
    const unsubscribeGeneralNotification = onChildAdded(generalFollowNotification, (snapshot) => {
      const notificationId = snapshot.key;
      const notificationData = snapshot.val();
      if (notificationId && notificationId != globalGeneralNotificationId) {
        globalGeneralNotificationId = notificationId
        if(user && user.companyId) {
          if(notificationData.toCompanyIds.includes(user.companyId)) {
            deleteNotification(notificationId, generalNotificationUrl);
            getAllNotifications();
          }
        }
      }
    });
    
    // Cleanup listener when component unmounts
    return () => {
      off(followNotification, 'child_added', unsubscribeFollowNotification);
      off(userNotification, 'child_added', unsubscribeUserNotification);
      off(generalFollowNotification, 'child_added', unsubscribeGeneralNotification);
      off(adminNotification, 'child_added', adminNotifications);
    };
  }, []);

  useEffect(() => {
    if(notificationCount == 0){
      getAllNotifications();
    }
  }, [!showNotifications]);

  async function refreshToken() {
    try {
      const newAccessToken = await firebaseAuth
        .getAuth()
        .currentUser?.getIdToken(true);
      if (newAccessToken) {
        Cookies.remove("token");
        Cookies.set("token", newAccessToken, { secure: true, sameSite: 'Lax' });
      } else {
        setUser(null);
        Cookies.remove("token");
        await signOut(auth);
        router.push("/");
      }
    } catch (err) {
      setUser(null);
      Cookies.remove("token");
      await signOut(auth);
      router.push("/");
    }
  }

  const handleFreeRoute = (path: string, e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    e.preventDefault();
    if (user?.isPaidUser) {
      router.push(path);
    } else if (user?.userRoles[0].roleCode === "buyer") {
      router.push(path);
    } else {
      setOpenPopup(true);
    }
  }

  const handlesearc = () => {
    const inputServiceFocusElement = document.getElementById("default-search");
    inputServiceFocusElement?.focus();
    if (searchRef.current && searchRef.current?.value) {
      localStorage.setItem("inputsearchvalue", searchRef.current?.value.trim());
      router.push("/serviceproviders");
    }
  };

  const deleteNotification = async (notificationId: string, theFollowUrl: string) => {
    const commentRef = ref(realtimeDb, theFollowUrl + `/${notificationId}`);
    try {
      await remove(commentRef);
      console.log("Comment deleted successfully.");
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const getAllNotifications = async(clickedNotificationIcon = false) => {
    const currentDate = encryptString(new Date().toLocaleDateString('en-US'), process.env.NEXT_PUBLIC_XDS_EMAIL_SECRET_KEY);
    const theNotifications = await authFetcher(`${getEndpointUrl(ENDPOINTS.getNotifications(currentDate))}`);
    if(theNotifications.success) {
      setNotifications(theNotifications.data);
      setNotificationCount(theNotifications.data.filter((item: any) => !item.isRead).length);
      if(clickedNotificationIcon) {
        setShowNotifications(true);
      }
    }
  }

  const makeNotificationsRead = async() => { 
    // if(notificationCount == 0) {
    //   getAllNotifications(true);
    // } else {
      await authFetcher(`${getEndpointUrl(ENDPOINTS.markNotificationsRead)}`);
      setNotificationCount(0);
    // }
  }

  const openNotifications = () => {
    setShowNotifications(!showNotifications);
    makeNotificationsRead();
  }
  
  return (
    <>
      {/* <Joyride steps={Toursteps} showProgress = {true} continuous={true} showSkipButton={true}/> */}
      {/* <nav className="bg-gradient-to-r header_bg border-gray-200 dark:bg-gray-900 w-full"> */}
      <nav className={`bg-gradient-to-r header_bg border-gray-200 dark:bg-gray-900 w-full ${currentUrl == "/home" ? "header_bg_height" : ""}`}>
        <div className="flex flex-wrap items-center justify-between lg:p-2 h-[3rem] pl-2 pr-0">
          <Link className="z-[2]" href={user?.userRoles[0]?.roleCode == 'admin' ? PATH.REGISTRATIONS.path : PATH.OTHERS_HOME.path}>
            <Image
              priority
              src={xdsLogo}
              alt="Logo"
              sizes="100vh"
              style={{ width: "auto", height: "1.5rem" }}
            />
          </Link>
          {
           currentUrl != "/password-change" && allowedView == "1" && showSubnavbar &&
            <div className="flex items-center z-[2]" id="sidebarmenu">
              {/* <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-semibold text-white rounded-full notification_top">
              3
              </span> */}
              {user?.userRoles[0].roleCode !== 'admin' && (!user?.isPaidUser || user.userType != 'paid') &&
                <Link href="/my-profile/subscriptions"><button
                  className="inline-block shrink-0 rounded-md subscribe_top_btn_2 flex"
                >
                  <svg className="mr-0.5 lg:top-[1px]" fill="#fff" id="Capa_1" enable-background="new 0 0 511.883 511.883" height="14" viewBox="0 0 511.883 511.883" width="14" xmlns="http://www.w3.org/2000/svg"><g><path d="m511.883 148.305-126.977 45.249 7.559 15.117c10.759 21.546.39 48.153-27.466 55.898-.352.117-38.936 10.474-50.654-24.624l-11.294-33.926 32.139-32.153-79.307-118.945-79.307 118.945 32.139 32.153-11.294 33.926c-7.31 21.899-22.998 29.282-50.801 23.994-3.036-1.479-18.891-2.166-27.861-21.694-4.951-10.752-4.746-22.983.542-33.574l7.544-15.103-126.845-45.278 56.593 218.672h133.079l66.211-66.211 66.211 66.211h133.109z" /><path d="m228.455 354.534h54.856v54.856h-54.856z" transform="matrix(.707 -.707 .707 .707 -195.142 292.811)" /><path d="m189.672 396.962h-128.789v60h188.789z" /><path d="m450.883 396.962h-128.789l-60 60h188.789z" /></g></svg><span className="lg:flex hidden ms-[2px]"> {user?.userRoles[0].roleCode == "buyer" ? 'Upgrade' : 'Subscribe'}</span> 
                </button></Link>
              }
              <Link href="/faq" className="ms-4 px-0">
                <img src="/mark.png" />
              </Link>

              { user && user?.userRoles[0].roleCode != 'admin' && 
                <div>
                  <button type="button" className="ms-4 px-0 relative" onClick={() => openNotifications()}>
                    <svg  xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M20.7936 16.4944C20.2733 15.5981 19.4999 13.0622 19.4999 9.75C19.4999 7.76088 18.7097 5.85322 17.3032 4.4467C15.8967 3.04018 13.989 2.25 11.9999 2.25C10.0108 2.25 8.10311 3.04018 6.69659 4.4467C5.29007 5.85322 4.49989 7.76088 4.49989 9.75C4.49989 13.0631 3.72551 15.5981 3.2052 16.4944C3.07233 16.7222 3.00189 16.9811 3.00099 17.2449C3.00008 17.5086 3.06874 17.768 3.20005 17.9967C3.33135 18.2255 3.52065 18.4156 3.74886 18.5478C3.97708 18.6801 4.23613 18.7498 4.49989 18.75H8.32583C8.49886 19.5967 8.95904 20.3577 9.62851 20.9042C10.298 21.4507 11.1357 21.7492 11.9999 21.7492C12.8641 21.7492 13.7018 21.4507 14.3713 20.9042C15.0407 20.3577 15.5009 19.5967 15.674 18.75H19.4999C19.7636 18.7496 20.0225 18.6798 20.2506 18.5475C20.4787 18.4151 20.6678 18.225 20.799 17.9963C20.9302 17.7676 20.9988 17.5083 20.9979 17.2446C20.9969 16.9809 20.9265 16.7222 20.7936 16.4944ZM11.9999 20.25C11.5347 20.2499 11.081 20.1055 10.7013 19.8369C10.3215 19.5683 10.0343 19.1886 9.87926 18.75H14.1205C13.9655 19.1886 13.6783 19.5683 13.2985 19.8369C12.9187 20.1055 12.4651 20.2499 11.9999 20.25ZM4.49989 17.25C5.22176 16.0087 5.99989 13.1325 5.99989 9.75C5.99989 8.1587 6.63203 6.63258 7.75725 5.50736C8.88247 4.38214 10.4086 3.75 11.9999 3.75C13.5912 3.75 15.1173 4.38214 16.2425 5.50736C17.3677 6.63258 17.9999 8.1587 17.9999 9.75C17.9999 13.1297 18.7761 16.0059 19.4999 17.25H4.49989Z" fill="#3758F9"/>
                    </svg>
                    {notificationCount > 0 &&
                        <span className="label_notification">{ notificationCount > 0 ? notificationCount : "" }</span>
                    }
                  </button>
                </div>
              }
              {/* <Link href="" className="ms-3 px-0" onClick={makeNotificationsRead}>
                <img src="/mark.png" />
              </Link> */}
              <DropdownMenu>
                <DropdownMenuTrigger className="focus-visible:outline-none">
                  <Avatar className="mx-4  w-8 h-8 text-sm">
                    <AvatarFallback className=" text-sm font-semibold">
                      {/* {getAliasName(
                      user?.firstName as string,
                      user?.lastName as string,
                    )} */}
                      <svg className="-mb-0.5 w-[24px] h-[24px] text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M5 7h14M5 12h14M5 17h14" />
                      </svg>
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="overflow-visible mr-1"
                  side="left"
                  collisionPadding={5}
                  id="newMenus"
                >
                  {user &&
                    user.userRoles[0] &&
                    (user.userRoles[0].roleCode == "buyer" ||
                      user.userRoles[0].roleCode == "service_provider") ? (
                    <div className="mobile_show">
                      <Link href={PATH.HOME.path}>
                        <DropdownMenuItem className="py-2">
                          {PATH.HOME.name}
                          <div className="absolute right-[-3%] top-1/4 transform h-0 w-0 border-y-8 border-y-transparent border-l-[11px] border-l-white"></div>
                        </DropdownMenuItem>
                      </Link>
                      <Link href={PATH.BROWSESERVICEPROVIDERS.path}>
                        <DropdownMenuItem className="py-2">
                          {PATH.BROWSESERVICEPROVIDERS.name}
                        </DropdownMenuItem>
                      </Link>
                      {/* {user &&
                        user.userRoles[0] &&
                        user.userRoles[0].roleCode == "buyer" ? (
                        <span onClick={(e) => handleFreeRoute(PATH.OPPORTUNITIES.path, e)}>
                          <DropdownMenuItem className="py-2">
                            {PATH.OPPORTUNITIES.name}
                          </DropdownMenuItem>
                        </span>
                      ) : (
                        ""
                      )} */}
                      <span onClick={(e) => handleFreeRoute(PATH.MYLISTS.path, e)}>
                        <DropdownMenuItem className="py-2">
                          {PATH.MYLISTS.name}
                        </DropdownMenuItem>
                      </span>
                      <span onClick={(e) => handleFreeRoute(PATH.MYPROJECTS.path, e)}>
                        <DropdownMenuItem className="py-2">
                          {PATH.MYPROJECTS.name}
                        </DropdownMenuItem>
                      </span>
                      <Link href={PATH.BUSINESS_SOLUTIONS.path}>
                        <DropdownMenuItem className="py-2">
                          {PATH.BUSINESS_SOLUTIONS.name}
                          <div className="absolute right-[-3%] top-1/4 transform h-0 w-0 border-y-8 border-y-transparent border-l-[11px] border-l-white"></div>
                        </DropdownMenuItem>
                      </Link>
                      {user.userRoles[0].roleCode == "buyer" &&
                        <span onClick={(e) => handleFreeRoute(PATH.MYOPPERTUNITIES.path, e)}>
                          <DropdownMenuItem className="py-2">
                          Post Opportunities
                          </DropdownMenuItem>`
                        </span>
                      }
                      {/*  */}
                    </div>
                  ) : (
                    ""
                  )}
                  <DropdownMenuLabel className="text-sm font-bold min-w-[250px] relative px-4 py-2">
                    My Account
                    <div className="xs_mobile_hide absolute right-[-3%] top-1/4 transform h-0 w-0 border-y-8 border-y-transparent border-l-[11px] border-l-white"></div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="m-0" />
                  {user &&
                    user.userRoles[0] &&
                    (user.userRoles[0].roleCode == "buyer" ||
                      user.userRoles[0].roleCode == "service_provider") ? (
                    <div >
                      <Link href={PATH.PERSONAL_SETTINGS.path}>
                        <DropdownMenuItem className="py-2">
                          {PATH.PERSONAL_SETTINGS.name}
                        </DropdownMenuItem>
                      </Link>

                      {!user?.isCompanyUser &&
                        <Link

                          href={PATH.SUBSCRIPTION_IN_MY_PROFILE.path}
                        >
                          <DropdownMenuItem className="py-2">
                            {PATH.SUBSCRIPTION.dropdownName}
                          </DropdownMenuItem>
                        </Link>
                      }
                      {user &&
                        user.userRoles[0] &&
                        user.userRoles[0].roleCode == "service_provider" ? (
                        <>
                          <Link href={`/serviceproviders-details/${user.slug}`}>
                            <DropdownMenuItem className="py-2">
                              View Company Profile
                            </DropdownMenuItem>
                          </Link>
                          <Link href="/company-profile/general-info">
                            <DropdownMenuItem className="py-2">
                              Edit Company Profile
                            </DropdownMenuItem>
                          </Link>
                        </>
                      ) : (
                        ""
                      )}

                      {((!user.isCompanyUser) || (Group_Permissions.isCompanyUser && Group_Permissions.canRead) || (Users_Permissions.canRead && Users_Permissions.canRead)) &&

                        (user?.isPaidUser) ? <Link href={((!user.isCompanyUser || Users_Permissions && Users_Permissions.canRead) ? PATH.COMPANY_USERS.path : PATH.COMPANY_GROUPS.path)}>
                        <DropdownMenuItem className="py-2">
                          {PATH.COMPANY_USERS.name}
                        </DropdownMenuItem>
                      </Link>
                        :
                        (!user.isCompanyUser) && <DropdownMenuItem className="py-2 text-gray-900" disabled={true}>
                          {PATH.COMPANY_USERS.name}
                        </DropdownMenuItem>



                      }

                      <Link href="/contact-us">
                        <DropdownMenuItem className="py-2">
                          Contact Us
                        </DropdownMenuItem>
                      </Link>
                    </div>
                  ) : (
                    <div>
                        <Link href={PATH.REGISTRATIONS.path}>
                          <DropdownMenuItem className="py-2">
                            {PATH.REGISTRATIONS.name}
                          </DropdownMenuItem>
                        </Link>
                        <Link href={PATH.USERS.path}>
                          <DropdownMenuItem className="py-2">
                            {PATH.USERS.name}
                          </DropdownMenuItem>
                        </Link>
                        <Link href={PATH.COMPANY.path}>
                          <DropdownMenuItem className="py-2">
                            {PATH.COMPANY.name}
                          </DropdownMenuItem>
                        </Link>
                        <Link href={PATH.REPORTS.path}>
                          <DropdownMenuItem className="py-2">
                            {PATH.REPORTS.name}
                          </DropdownMenuItem>
                        </Link>
                        <Link href={PATH.UPLOADACTIVE.path}>
                          <DropdownMenuItem className="py-2">
                            {PATH.UPLOADACTIVE.name}
                          </DropdownMenuItem>
                        </Link>
                        <Link href={PATH.CONTENT.path}>
                          <DropdownMenuItem className="py-2">
                            {PATH.CONTENT.name}
                          </DropdownMenuItem>
                        </Link>
                      </div>
                  )}

                  <DropdownMenuItem onClick={handleSignOut} className="py-2">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          }
        </div>
        <Notifications
          updatedAddto={ showNotifications }
          notificationData = { notifications }
          onVisibilityChange={(val: boolean) => setShowNotifications(val)}
        ></Notifications>
        {currentUrl == '/home' &&
          <div className="search_bar_ontop absolute top-[6px] w-full z-[1] searh_mobile_style">
            <form className="w-[94%] lg:w-[402px] mx-auto" onSubmit={(e) => {
              e.preventDefault();
              handlesearc();
            }}>
              <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pt-1 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M21.5308 20.4686L16.8368 15.7755C18.1973 14.1421 18.8757 12.047 18.7309 9.92618C18.5861 7.80531 17.6293 5.82191 16.0593 4.38859C14.4894 2.95526 12.4274 2.18235 10.3021 2.23065C8.17687 2.27895 6.15205 3.14474 4.64888 4.64791C3.14571 6.15108 2.27993 8.1759 2.23163 10.3011C2.18333 12.4264 2.95623 14.4885 4.38956 16.0584C5.82289 17.6283 7.80629 18.5852 9.92715 18.73C12.048 18.8748 14.1431 18.1963 15.7765 16.8358L20.4696 21.5299C20.5393 21.5995 20.622 21.6548 20.713 21.6925C20.8041 21.7302 20.9017 21.7497 21.0002 21.7497C21.0988 21.7497 21.1963 21.7302 21.2874 21.6925C21.3784 21.6548 21.4612 21.5995 21.5308 21.5299C21.6005 21.4602 21.6558 21.3775 21.6935 21.2864C21.7312 21.1954 21.7506 21.0978 21.7506 20.9992C21.7506 20.9007 21.7312 20.8031 21.6935 20.7121C21.6558 20.621 21.6005 20.5383 21.5308 20.4686ZM3.75021 10.4992C3.75021 9.16421 4.14609 7.85917 4.88779 6.74914C5.62949 5.63911 6.6837 4.77394 7.9171 4.26305C9.1505 3.75216 10.5077 3.61849 11.8171 3.87894C13.1264 4.13939 14.3292 4.78226 15.2732 5.72627C16.2172 6.67027 16.8601 7.87301 17.1205 9.18238C17.381 10.4917 17.2473 11.8489 16.7364 13.0823C16.2255 14.3158 15.3603 15.37 14.2503 16.1117C13.1403 16.8534 11.8352 17.2492 10.5002 17.2492C8.71061 17.2473 6.99488 16.5355 5.72944 15.27C4.46399 14.0046 3.7522 12.2888 3.75021 10.4992Z" fill="#343741" />
                  </svg>
                </div>
                <input type="search" ref={searchRef} id="default-search" className="block w-full h-[34px] ps-10 text-sm text-gray-900 border border-gray-300 rounded-sm bg-gray-50 focus:ring-0 focus:border-gray-300 appearance-none outline-none" placeholder="Search Service Providers" required />
              </div>
            </form>
          </div>
        }

        {
           currentUrl != "/password-change" && allowedView == "1" && showSubnavbar &&
          <div>
            <SubNavbar />
          </div>
        }
        <FreeTierAlerts isOpen={openPopup} setOpenPopup={setOpenPopup} bodymessage={popupMessage} />
      </nav>
    </>
  );
};

export default AuthNavbar;

const getAliasName = (firstName: string, lastName: string) => {
  const firstInitial = firstName.charAt(0).toUpperCase();
  const lastInitial = lastName.charAt(0).toUpperCase();
  return `${firstInitial}${lastInitial}`;
};
