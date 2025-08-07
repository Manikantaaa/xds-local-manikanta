import { formatDate } from "@/services/common-methods";
import { Announcement } from "./post-announcement-component";
import { PATH } from "@/constants/path";
import { useEffect } from "react";
import { authPostdata, authPut } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { useUserContext } from "@/context/store";
import { useRouter } from "next/navigation";
// import { LazyLoadImage } from "react-lazy-load-image-component";
import usePagePermissions from "@/hooks/usePagePermissions";

const AnnouncementDisplay = ({ viewingCompanyId, announcements, setAnnouncements, openCommonFreeAlertPopup }: { viewingCompanyId: number, announcements: Announcement[], setAnnouncements: (arg: Announcement[]) => void, openCommonFreeAlertPopup: (val: string) => void }) => {

  const { user } = useUserContext();
  const router = useRouter();

  useEffect(() => {
    if (announcements && announcements.length > 0) {
      const idArr = announcements.map((item) => item.id);
      addOrUpdateViewCountAnnouncementStat(idArr);
    }
  }, []);
  const AnnouncementPermissions = usePagePermissions(19);
  const addOrUpdateViewCountAnnouncementStat = async (annoucementIds: number[]) => {
    await authPostdata(getEndpointUrl(ENDPOINTS.manageAnnouncementStatViewCount), { ids: annoucementIds })
  }

  const onClickAnnouncementLink = async (theUrl: string, announcementId: number) => {
    await authPut(getEndpointUrl(ENDPOINTS.manageAnnouncementStatVisitCount(announcementId)));
    const fullUrl = theUrl?.startsWith('http') ? theUrl : `https://${theUrl}`;
    window.open(fullUrl, "_blank");
  }

  const onClickHere = async () => {
    if (user && user.isPaidUser) {
      router.push(PATH.POST_ANNOUNCEMENTS.path);
    } else {
      openCommonFreeAlertPopup("announcements");
    }
  }

  const updatinglinks = (decsription: string) => decsription.replace(
    /(https?:\/\/[^\s]+)/g,
    (url) => `<a href="${url}" target="_blank" class="link_color" rel="noopener noreferrer">${url}</a>`
  );

  function formatTitle(title: string) {
    if (title.length > 100) {
      return (
        <>
          {title.slice(0, 100)}
          <br />
          {title.slice(100)}
        </>
      );
    }
    return title;
  }

  return (
    <>
      {
        announcements && announcements.length > 0 ?
        <div className="py-12">
          {
            announcements.length > 0 && announcements.map((announcement: Announcement) => (
              <div className="space-y-4 mb-4">
                <article
                  className="border border-gray-200 rounded-[6px] relative">
                  <div className="lg:flex items-start gap-4 p-4">
                    {
                      user?.companyId == viewingCompanyId && (!AnnouncementPermissions.isCompanyUser || (AnnouncementPermissions.isCompanyUser && AnnouncementPermissions.canWrite)) &&
                      <div className="absolute right-5 top-[14px] text-blue-300 text-[14px] cursor-pointer announcement_edit_button" 
                        onClick={(e) => {
                          e.preventDefault();
                          router.push(`${PATH.POST_ANNOUNCEMENTS.path}?announcementId=${announcement.id}`);
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 32 32" fill="none"><path d="M28.4138 9.17125L22.8288 3.585C22.643 3.39924 22.4225 3.25188 22.1799 3.15134C21.9372 3.0508 21.6771 2.99905 21.4144 2.99905C21.1517 2.99905 20.8916 3.0508 20.6489 3.15134C20.4062 3.25188 20.1857 3.39924 20 3.585L4.58626 19C4.39973 19.185 4.25185 19.4053 4.15121 19.648C4.05057 19.8907 3.99917 20.151 4.00001 20.4138V26C4.00001 26.5304 4.21072 27.0391 4.5858 27.4142C4.96087 27.7893 5.46958 28 6.00001 28H11.5863C11.849 28.0008 12.1093 27.9494 12.352 27.8488C12.5947 27.7482 12.815 27.6003 13 27.4138L28.4138 12C28.5995 11.8143 28.7469 11.5938 28.8474 11.3511C28.948 11.1084 28.9997 10.8483 28.9997 10.5856C28.9997 10.3229 28.948 10.0628 28.8474 9.82015C28.7469 9.57747 28.5995 9.35698 28.4138 9.17125ZM6.41376 20L17 9.41375L19.0863 11.5L8.50001 22.085L6.41376 20ZM6.00001 22.4138L9.58626 26H6.00001V22.4138ZM12 25.5863L9.91376 23.5L20.5 12.9138L22.5863 15L12 25.5863ZM24 13.5863L18.4138 8L21.4138 5L27 10.585L24 13.5863Z" ></path></svg> Edit Post
                      </div>
                    }
                    <img
                      src={announcement.imageUrl}
                      alt=""
                      className="size-20 rounded-lg object-cover w-32"
                    />
                    {/* <LazyLoadImage
                  effect="blur"
                  className="size-20 rounded-lg object-cover w-32"
                  src={announcement.imageUrl}
                  alt="image description"
                  // onLoad={() => {
                  //   announcement.isImageLoaded = true;
                  //   setAnnouncements([...announcements]);
                  // }}
                /> */}
                    <div className="lg:mt-0 mt-2 bg-white">
                      <time className="block text-xs text-gray-500">{ formatDate(new Date(announcement.createdAt)) }</time>
                      <div>
                        <h3 className="mt-0.5 text-lg font-medium text-gray-900"> {formatTitle(announcement.title)} </h3>
                        <p className="text-sm py-1" dangerouslySetInnerHTML={{ __html: updatinglinks(announcement.description) }}/>
                        {
                          announcement.linkUrl &&
                          <div className="flex items-center space-x-4 py-2">
                            <a href={announcement.linkUrl ? (announcement.linkUrl.startsWith('http://') || announcement.linkUrl.startsWith('https://') ? announcement.linkUrl : `https://${announcement.linkUrl}`) : '#'}
                              target="_blank"
                              onClick={(e) => {
                                e.preventDefault();
                                announcement.linkUrl && onClickAnnouncementLink(announcement.linkUrl, announcement.id);
                              }}
                              className="link_color text-sm break-all">
                              {announcement.linkUrl}
                              <svg className="w-5 h-5 link_color  ml-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.213 9.787a3.391 3.391 0 0 0-4.795 0l-3.425 3.426a3.39 3.39 0 0 0 4.795 4.794l.321-.304m-.321-4.49a3.39 3.39 0 0 0 4.795 0l3.424-3.426a3.39 3.39 0 0 0-4.794-4.795l-1.028.961" />
                              </svg>
                            </a>
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            ))
          }
        </div>
        :
        <>
          <div className="sm:text-left py-5">
            <h1 className="font-bold default_text_color header-font">
              Announcements
            </h1>
          </div>
          <div>
            <p>You do not have any announcements. { ((!AnnouncementPermissions.isCompanyUser) || (AnnouncementPermissions.isCompanyUser && AnnouncementPermissions.canWrite)) &&  <><button className="text-blue-300" onClick={(e) => { e.preventDefault(); onClickHere() }}><b>Click here</b></button> to post interesting news and announcements about your company.</>}</p>
          </div>
          <div className="flex items-center space-x-4 py-6 bg-white rounded-lg shadow w-full max-w-4xl">
            <div className="w-32 h-32 bg-gray-200 rounded-md">
              <img src="/announcement_placeholder.png" alt="" className="w-full h-full object-cover rounded-md" />
            </div>
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-300 rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>
          </div>
        </>
      }
    </>
  );
}

export default AnnouncementDisplay;