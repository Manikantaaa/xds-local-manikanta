"use client";

import { PATH } from "@/constants/path";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useUserContext } from "@/context/store";
import { useEffect, useState } from "react";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { authFetcher } from "@/hooks/fetcher";
import usePagePermissions from "@/hooks/usePagePermissions";

const MobileSideMenus = () => {
  const { user } = useUserContext();
  const Users_Permissions = usePagePermissions(16);
  const Group_Permissions = usePagePermissions(17);
  const [eventsAvailableFlag, setEventsAvailableFlag] = useState<boolean>(false);
  //mobile code
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [])
  useEffect(() => {
    async function getEventsCount() {
      await authFetcher(`${getEndpointUrl(ENDPOINTS.getEventsCount)}`)
        .then((res) => {
          setEventsAvailableFlag(res.EventsAvailable);

        });
    }
    if (isMobile && user && user?.isPaidUser) {
      getEventsCount();
    }
  }, [isMobile])
  return (
    <div className="mobile_show">
      <DropdownMenu>
        <DropdownMenuTrigger className="focus-visible:outline-none  button_blue px-1 rounded-sm text-white me-2">
          <svg
            className="w-[26px] h-[26px] text-white"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-width="2"
              d="M9 8h10M9 12h10M9 16h10M5 8h0m0 4h0m0 4h0"
            />
          </svg>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="ms-4">
          <div className="">
            <DropdownMenuLabel className="text-sm font-bold relative px-3 py-2">
              My Profile
            </DropdownMenuLabel>
            <Link prefetch={false} href={PATH.PERSONAL_SETTINGS.path}>
              <DropdownMenuItem className="py-2">
                {PATH.PERSONAL_SETTINGS.name}
                {/* <div className="absolute right-[-3%] top-1/4 transform h-0 w-0 border-y-8 border-y-transparent border-l-[11px] border-l-white"></div> */}
              </DropdownMenuItem>
            </Link>
            <Link prefetch={false} href={PATH.CHANGE_PASSWORD.path}>
              <DropdownMenuItem className="py-2">
                {PATH.CHANGE_PASSWORD.name}
              </DropdownMenuItem>
            </Link>
            {!user?.isCompanyUser &&
              <Link prefetch={false} href={PATH.SECURITY_SETTINGS.path}>
                <DropdownMenuItem className="py-2">
                  {PATH.SECURITY_SETTINGS.name}
                </DropdownMenuItem>
              </Link>
            }
            {!user?.isCompanyUser &&
              <Link prefetch={false} href={PATH.SUBSCRIPTION_IN_MY_PROFILE.path}>
                <DropdownMenuItem className="py-2">
                  {PATH.SUBSCRIPTION_IN_MY_PROFILE.name}
                </DropdownMenuItem>
              </Link>
            }
            {
              (user && user.userRoles[0] && user.userRoles[0].roleCode == 'service_provider') &&
              <div>
                <DropdownMenuLabel className="text-sm font-bold min-w-[250px] relative px-3 py-2">
                  Company Profile
                </DropdownMenuLabel>
                <Link prefetch={false} href={PATH.GENERAL_INFO.path}>
                  <DropdownMenuItem className="py-2">
                    {PATH.GENERAL_INFO.name}
                  </DropdownMenuItem>
                </Link>
                <Link prefetch={false} href={PATH.OUR_WORK.path}>
                  <DropdownMenuItem className="py-2">
                    {PATH.OUR_WORK.name}
                  </DropdownMenuItem>
                </Link>
                <Link prefetch={false} href={PATH.SERVICES.path}>
                  <DropdownMenuItem className="py-2">
                    {PATH.SERVICES.name}
                  </DropdownMenuItem>
                </Link>
                <Link prefetch={false} href={PATH.DUE_DILIGENCE.path}>
                  <DropdownMenuItem className="py-2">
                    {PATH.DUE_DILIGENCE.name}
                  </DropdownMenuItem>
                </Link>
                <Link prefetch={false} href={PATH.ABOUT.path}>
                  <DropdownMenuItem className="py-2">
                    {PATH.ABOUT.name}
                  </DropdownMenuItem>
                </Link>
                <Link prefetch={false} href={PATH.CONTACT.path}>
                  <DropdownMenuItem className="py-2">
                    {PATH.CONTACT.name}
                  </DropdownMenuItem>
                </Link>
                {eventsAvailableFlag &&
                  <Link prefetch={false} href={PATH.EVENTS.path}>
                    <DropdownMenuItem className="py-2">
                      {PATH.EVENTS.name}
                    </DropdownMenuItem>
                  </Link>
                }
                <Link prefetch={false} href={PATH.POST_ANNOUNCEMENTS.path}>
                  <DropdownMenuItem className="py-2">
                    {PATH.POST_ANNOUNCEMENTS.name}
                  </DropdownMenuItem>
                </Link>
              </div>
            }

              {((!user?.isCompanyUser) || (Group_Permissions.isCompanyUser && Group_Permissions.canRead) || (Users_Permissions.canRead && Users_Permissions.canRead)) && 
                       
                (user?.isPaidUser) ? 
                <>
                <DropdownMenuLabel className="text-sm font-bold min-w-[250px] relative px-3 py-2">
                  Company Admin
                </DropdownMenuLabel>
                <Link href={(( !user.isCompanyUser || Users_Permissions && Users_Permissions.canRead) ? PATH.COMPANY_USERS.path : PATH.COMPANY_GROUPS.path)}>
                  <DropdownMenuItem className="py-2">
                    Users
                  </DropdownMenuItem>
                </Link>
                <Link href={(( !user.isCompanyUser || Group_Permissions && Group_Permissions.canRead) ? PATH.COMPANY_GROUPS.path : PATH.COMPANY_GROUPS.path)}>
                  <DropdownMenuItem className="py-2">
                    {PATH.COMPANY_GROUPS.name}
                  </DropdownMenuItem>
                </Link>
                </>
                :
                    (!user?.isCompanyUser) && 
                    <>
                    <DropdownMenuLabel className="text-sm font-bold min-w-[250px] relative px-3 py-2">
                      Company Admin
                    </DropdownMenuLabel>
                      <DropdownMenuItem className="py-2 text-gray-900" disabled = {true}>
                        Users
                      </DropdownMenuItem>
                      <DropdownMenuItem className="py-2 text-gray-900" disabled = {true}>
                        {PATH.COMPANY_GROUPS.name}
                      </DropdownMenuItem>
                    </>
              }
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default MobileSideMenus;
