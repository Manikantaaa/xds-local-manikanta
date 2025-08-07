import { PATH } from "@/constants/path";
import { useUserContext } from "@/context/store";
import { redirect, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import Link from "next/link";
import { getFormattedDateForNotifications } from "@/services/common-methods";
import { authFetcher } from "@/hooks/fetcher";
import { Tooltip } from "flowbite-react";
import DOMPurify from "dompurify";
import momenttimeZone from "moment-timezone"

type NotificationProps = {
  updatedAddto?: boolean | undefined;
  notificationData: any;
  onVisibilityChange: (isVisible: boolean) => void;
};
const Notifications = (notificationProps: NotificationProps) => {

  const { user } = useUserContext();
  if (!user) {
    redirect(PATH.HOME.path);
  }

  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [unReadCount, setUnReadCount] = useState<number>(0);
  const [webUrl, setWebUrl] = useState<string>('');

  useEffect(() => { 
    setIsVisible(notificationProps.updatedAddto ?? false);
    let count = 0;
    notificationProps.notificationData.map((data: { isRead: boolean }) => {
      if (!data.isRead) {
        count = count + 1;
      }
    })
    setUnReadCount(count);
    setNotifications(notificationProps.notificationData);
    const weburl = window.location.href.split('/').slice(0, 3).join('/');
    setWebUrl(weburl);
    // Clean up the event listener when the component unmounts
  }, [notificationProps]);

  const closeSideBar = (isclosed: boolean) => {
    setUnReadCount(0);
    notificationProps.onVisibilityChange(isclosed);
  };

  const createMarkup = (html: string) => {
    const sanitizedHtml = DOMPurify.sanitize(html);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sanitizedHtml;
    const links = tempDiv.querySelectorAll('a');
    links.forEach(link => {
        link.style.color = 'blue';
        link.style.textDecoration = 'underline';
        link.target = link.href.startsWith(webUrl) ? '_self' : '_blank';
    });
    const updatedHtml = tempDiv.innerHTML;
    
    return { __html: updatedHtml };
  };

  const onClickCompanyName = (slug: string, type: number) => {
    notificationProps.onVisibilityChange(false);
    if(type == 7) {
      router.push(`/serviceproviders-details/${slug}?tab=7`);
    } else {
      router.push(`/serviceproviders-details/${slug}`);
    }
  }

  return (
    <>
      {/* AddTo List Sidebar Popup */}
      {isVisible && (
        <div className="notification_sidebar_list">
          <div onClick={()=>closeSideBar(false)} className="overly_bg" ></div>
          <div className="block p-4 bg-white border border-gray-200 shadow-lg width_400">
            <h5 className="font-bold default_text_color text-[16px] text-center mb-1">
              Notifications{unReadCount > 0 ? (" (" + unReadCount + " unread)") : ""}
            </h5>
            <div className="absolute right-3 top-4">
              <button
                type="button"
                className="bg-white hover:bg-gray-100 focus:ring-0 font-medium rounded-sm text-sm px-1.5 py-1"
                onClick={() => { closeSideBar(false); }}
                aria-label="Close Sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M10.3538 6.35375L8.70688 8L10.3538 9.64625C10.4002 9.69271 10.4371 9.74786 10.4622 9.80855C10.4873 9.86925 10.5003 9.9343 10.5003 10C10.5003 10.0657 10.4873 10.1308 10.4622 10.1914C10.4371 10.2521 10.4002 10.3073 10.3538 10.3538C10.3073 10.4002 10.2521 10.4371 10.1915 10.4622C10.1308 10.4873 10.0657 10.5003 10 10.5003C9.93431 10.5003 9.86925 10.4873 9.80855 10.4622C9.74786 10.4371 9.69271 10.4002 9.64625 10.3538L8 8.70687L6.35375 10.3538C6.3073 10.4002 6.25215 10.4371 6.19145 10.4622C6.13075 10.4873 6.0657 10.5003 6 10.5003C5.93431 10.5003 5.86925 10.4873 5.80855 10.4622C5.74786 10.4371 5.69271 10.4002 5.64625 10.3538C5.5998 10.3073 5.56295 10.2521 5.53781 10.1914C5.51266 10.1308 5.49972 10.0657 5.49972 10C5.49972 9.9343 5.51266 9.86925 5.53781 9.80855C5.56295 9.74786 5.5998 9.69271 5.64625 9.64625L7.29313 8L5.64625 6.35375C5.55243 6.25993 5.49972 6.13268 5.49972 6C5.49972 5.86732 5.55243 5.74007 5.64625 5.64625C5.74007 5.55243 5.86732 5.49972 6 5.49972C6.13268 5.49972 6.25993 5.55243 6.35375 5.64625L8 7.29313L9.64625 5.64625C9.69271 5.59979 9.74786 5.56294 9.80855 5.5378C9.86925 5.51266 9.93431 5.49972 10 5.49972C10.0657 5.49972 10.1308 5.51266 10.1915 5.5378C10.2521 5.56294 10.3073 5.59979 10.3538 5.64625C10.4002 5.6927 10.4371 5.74786 10.4622 5.80855C10.4873 5.86925 10.5003 5.9343 10.5003 6C10.5003 6.0657 10.4873 6.13075 10.4622 6.19145C10.4371 6.25214 10.4002 6.3073 10.3538 6.35375ZM14.5 8C14.5 9.28558 14.1188 10.5423 13.4046 11.6112C12.6903 12.6801 11.6752 13.5132 10.4874 14.0052C9.29973 14.4972 7.99279 14.6259 6.73192 14.3751C5.47104 14.1243 4.31285 13.5052 3.40381 12.5962C2.49477 11.6872 1.8757 10.529 1.6249 9.26809C1.37409 8.00721 1.50282 6.70028 1.99479 5.51256C2.48676 4.32484 3.31988 3.30968 4.3888 2.59545C5.45772 1.88122 6.71442 1.5 8 1.5C9.72335 1.50182 11.3756 2.18722 12.5942 3.40582C13.8128 4.62441 14.4982 6.27665 14.5 8ZM13.5 8C13.5 6.9122 13.1774 5.84883 12.5731 4.94436C11.9687 4.03989 11.1098 3.33494 10.1048 2.91866C9.09977 2.50238 7.9939 2.39346 6.92701 2.60568C5.86011 2.8179 4.8801 3.34172 4.11092 4.11091C3.34173 4.8801 2.8179 5.86011 2.60568 6.927C2.39347 7.9939 2.50238 9.09977 2.91867 10.1048C3.33495 11.1098 4.0399 11.9687 4.94437 12.5731C5.84884 13.1774 6.91221 13.5 8 13.5C9.45819 13.4983 10.8562 12.9184 11.8873 11.8873C12.9184 10.8562 13.4983 9.45818 13.5 8Z" fill="#0071C2"/>
                </svg>
              </button>
            </div>
            {notifications.length > 0 ?
            <div className="sm:block scroll_height">
              {
                notifications.map((item, index) => (
                  <div key={index} className="hover:bg-gray-100 rounded-[4px] mb-1 relative">
                    <div className="py-2 px-6">
                      <span className={`text-[13px] ${!item.isRead ? 'date_dot' : ''}`}><b>{getFormattedDateForNotifications(momenttimeZone(item.startDate ? item.startDate : item.createdAt).tz(Intl.DateTimeFormat().resolvedOptions().timeZone).format("YYYY-MM-DD hh:mm:ss A"))}</b></span>
                      {item.type == 3 &&
                       <span className="notification_tooltip"><Tooltip content="When buyer follow you, it means they're interested and they will get notified of updates to your profile" className="tier_tooltip" placement="left">
                        <svg xmlns="http://www.w3.org/2000/svg"width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M8 1.5C6.71442 1.5 5.45772 1.88122 4.3888 2.59545C3.31988 3.30968 2.48676 4.32484 1.99479 5.51256C1.50282 6.70028 1.37409 8.00721 1.6249 9.26809C1.8757 10.529 2.49477 11.6872 3.40381 12.5962C4.31285 13.5052 5.47104 14.1243 6.73192 14.3751C7.99279 14.6259 9.29973 14.4972 10.4874 14.0052C11.6752 13.5132 12.6903 12.6801 13.4046 11.6112C14.1188 10.5423 14.5 9.28558 14.5 8C14.4982 6.27665 13.8128 4.62441 12.5942 3.40582C11.3756 2.18722 9.72335 1.50182 8 1.5ZM8 13.5C6.91221 13.5 5.84884 13.1774 4.94437 12.5731C4.0399 11.9687 3.33495 11.1098 2.91867 10.1048C2.50238 9.09977 2.39347 7.9939 2.60568 6.927C2.8179 5.86011 3.34173 4.8801 4.11092 4.11091C4.8801 3.34172 5.86011 2.8179 6.92701 2.60568C7.9939 2.39346 9.09977 2.50238 10.1048 2.91866C11.1098 3.33494 11.9687 4.03989 12.5731 4.94436C13.1774 5.84883 13.5 6.9122 13.5 8C13.4983 9.45818 12.9184 10.8562 11.8873 11.8873C10.8562 12.9184 9.45819 13.4983 8 13.5ZM9 11C9 11.1326 8.94732 11.2598 8.85356 11.3536C8.75979 11.4473 8.63261 11.5 8.5 11.5C8.23479 11.5 7.98043 11.3946 7.7929 11.2071C7.60536 11.0196 7.5 10.7652 7.5 10.5V8C7.36739 8 7.24022 7.94732 7.14645 7.85355C7.05268 7.75979 7 7.63261 7 7.5C7 7.36739 7.05268 7.24021 7.14645 7.14645C7.24022 7.05268 7.36739 7 7.5 7C7.76522 7 8.01957 7.10536 8.20711 7.29289C8.39465 7.48043 8.5 7.73478 8.5 8V10.5C8.63261 10.5 8.75979 10.5527 8.85356 10.6464C8.94732 10.7402 9 10.8674 9 11ZM7 5.25C7 5.10166 7.04399 4.95666 7.1264 4.83332C7.20881 4.70999 7.32595 4.61386 7.46299 4.55709C7.60003 4.50032 7.75083 4.48547 7.89632 4.51441C8.04181 4.54335 8.17544 4.61478 8.28033 4.71967C8.38522 4.82456 8.45665 4.9582 8.48559 5.10368C8.51453 5.24917 8.49968 5.39997 8.44291 5.53701C8.38615 5.67406 8.29002 5.79119 8.16668 5.8736C8.04334 5.95601 7.89834 6 7.75 6C7.55109 6 7.36032 5.92098 7.21967 5.78033C7.07902 5.63968 7 5.44891 7 5.25Z" fill="#343741"/>
                       </svg></Tooltip></span>
                      }
                      {
                        (item.type != 1 && item.type != 7)? 
                        // <p className="m-0 text-[14px]"> {item.notificationDescription} </p>
                         <p className="m-0 text-[14px]"> {item.type == 4 ? <div className="leading-relaxed text-gray-700" dangerouslySetInnerHTML={createMarkup(item.notificationDescription)} /> : (item.type == 5 || item.type == 6 ? <span>{item.notificationDescription}<a className="link_color" href={`${item.type == 5 ? '/opportunity-details/' :'/my-opportunities/'}${item.opportunityId}`}> See details</a></span> : item.notificationDescription ) } </p>
                          :
                          <div className="flex items-start mt-2">
                            {item.type != 3 &&
                              <img
                                src={(item.notifyingCompany?.user?.assets.length > 0 && item.notifyingCompany?.user?.assets[0]?.url) || "/circle-no-image-available.jpg"}
                                alt=""
                                className="w-[30px] rounded-sm mr-2" />
                            }
                            <div className="m-0 text-[14px]">
                              {/* <Link prefetch={false} href="" onClick={() => { onClickCompanyName(item.notifyingCompany?.slug) }} className="text-sky-600">{item.notifyingCompany?.name}</Link>{" " + item.notificationDescription} */}
                              <button className="link_color" onClick={(e) => { e.preventDefault(); onClickCompanyName(item.notifyingCompany?.slug, item.type) }}>{item.notifyingCompany?.name}</button>{ item.type == 7 && ' Announcement: '}{" " + item.notificationDescription}
                            </div>
                          </div>
                      }
                    </div>
                  </div>
                ))
              }
            </div>
            :
            (user.userRoles[0].roleCode == "service_provider" && !user.isPaidUser ? "" : <div className="italic text-center text-[13px] rounded-[4px] mt-4"> You have no new notifications!</div>)
            }
            <div className="mt-5 p-2 bg-[#EEEDED] italic flex items-center text-center text-[13px] rounded-[4px]">{user.userRoles[0].roleCode == 'service_provider' && !user.isPaidUser ? <span>Please subscribe to get notified when buyers follow your profile. <Link href={"/my-profile/subscriptions"} className="link_color"><br/>Subscribe Now</Link></span> : "Notifications older than 90 days will be cleared automatically." }</div>
          </div>
        </div>
      )}
      {/* AddTo List Sidebar Popup  End*/}
    </>
  );
};

export default Notifications;
