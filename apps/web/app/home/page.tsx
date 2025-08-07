"use client";
import { PATH } from "@/constants/path";
import "../../public/css/homeland.css";
import Link from "next/link";
import React, { useEffect, useRef, useState } from 'react';
import { Tooltip } from "flowbite-react";
import { authFetcher, authPostdata, authPut, authPutWithData, deleteItem } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/context/store";
import { useAuthentication } from "@/services/authUtils";
import { useMultiTourContext } from "@/context/multiTourContext";
import { BodyMessageType } from "@/constants/popupBody";
import { recentlyViewedTypes } from "../opportunity-details/[id]/page";
import { Toursteps } from "@/services/tour";
import { encryptString, formatDate, formatDateRange, setCrousalAgain } from "@/services/common-methods";
import ReactSimplyCarousel from 'react-simply-carousel';
import { eventTypes } from "@/types/event.types";
import FreeTierAlerts from "@/components/ui/freeTierAlerts";
import Spinner from "@/components/spinner";
import { createGroupUser } from "@/types/user.type";
import usePagePermissions from "@/hooks/usePagePermissions";
import CompanyAdminIcon from "@/components/ui/companyAdminIcon";
import CompanyUserIcon from "@/components/ui/companyUserIcon";
import HomeFadeSlider from "@/components/ui/homefadeslider";
import { set } from "date-fns";

interface getdataType {
  ArticleCategory: {
    categoryName: string,
  },
  EndDate: string,
  StartDate: string,
  description: string,
  id: number,
  isActive: boolean,
  logoPath: string,
  signedUrl: string,
  title: string,
  webUrl: string,
  displayOrder: number,
  categoryId: number,
  updatedAt: Date,
  advtId: number,
}
interface justJoinedCompanies {
  companyId: number,
  userCategory: string,
  categoryType: number,
  displayDate: Date,
  Companies: {
    name: string,
    slug: string,
    updatedAt: Date,
    logoAsset: {
      url: string,
    }
  }
}
interface recentUpdatedCompanies {
  categories: number[],
  companyId: number,
  logoUrl: string,
  name: string,
  slug: string,
  updatedAt: Date,
  userCategory: string,
}

const HomeLanding = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [allArticles, setAllArticles] = useState<getdataType[]>([]);
  const [mainArticles, setMainArticles] = useState<getdataType[]>([]);
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };
  const route = useRouter();

  const profileIdNeedToOpen = localStorage.getItem("viewCompanyProfile");
  const oppDetailsOpen = localStorage.getItem("viewOppDetails");
  const viewIntrestedOppDetails = localStorage.getItem("viewIntrestedOppDetails");
  const generalInfoPageOpen = localStorage.getItem("generalInfo");
  const filtersToken = localStorage.getItem("selectedFilters");
  if (filtersToken && filtersToken != "") {
    route.push(`/serviceproviders`);
  }
  if (profileIdNeedToOpen && profileIdNeedToOpen != "") {
    localStorage.removeItem("viewCompanyProfile");
    route.push(`/serviceproviders-details/${profileIdNeedToOpen}`);
  }
  if (oppDetailsOpen && oppDetailsOpen != "") {
    localStorage.removeItem("viewOppDetails");
    route.push(`/opportunity-details/${oppDetailsOpen}`);
  }
  if (viewIntrestedOppDetails && viewIntrestedOppDetails != "") {
    localStorage.removeItem("viewIntrestedOppDetails");
    route.push(`/my-opportunities/${viewIntrestedOppDetails}`);
  }
  if (generalInfoPageOpen && generalInfoPageOpen != "") {
    localStorage.removeItem("generalInfo");
    route.push(`/company-profile/${generalInfoPageOpen}`);
  }

  const { user, setAccessToken } = useUserContext();
  const searchRef = useRef<HTMLInputElement>(null);
  const [openPopup, setOpenPopup] = useState<boolean>(false);
  useAuthentication({ user, isBuyerRestricted: false, isPaidUserPage: false });

  const {
    setTourState,
    tourState: { run, stepIndex, steps, tourActive },
  } = useMultiTourContext();

  const [foundingsponserslist, setFoundingSponsersList] = useState([]);
  const [recentViewedProfiles, setrecentViewedProfiles] = useState([]);
  const [sponsoredPartners, setsponsoredPartners] = useState<{ fileUrl: string, fileName: string }[]>([]);
  const [myList, setMyList] = useState<{ id: number, name: string, description: string, updatedAt: string }[]>([]);
  const [myProjects, setMyProjets] = useState([]);
  const [justJoined, setJustJoined] = useState<justJoinedCompanies[]>([]);
  const [announcements, setAnnouncements] = useState<justJoinedCompanies[]>([]);
  const [testmonial, setTestmonial] = useState<justJoinedCompanies[]>([]);
  const [freshAndUpdated, setFreshAndUpdated] = useState<recentUpdatedCompanies[]>([]);
  const [popupMessage, setPopupMessage] = useState<BodyMessageType>('DEFAULT');
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [eventList, setEventList] = useState<eventTypes[]>([]);
  const [pageLoader, setPageLoader] = useState<boolean>(false);
  const [bannerAdImage, setBannerAdImage] = useState<{ id: number, adImagePath: string, mobileAdImagePath: string, adURL: string, adPage: string }[]>([]);
  const [webUrl, setWebUrl] = useState<string>('');
  const [comanypUserList, setComanypUserList] = useState<{ id: number, firstName: string, LastName: string, lastLoginDate: Date }[]>([]);
  const [newUserDisable, setNewUserDisable] = useState<boolean>(false);
  const Users_Permissions = usePagePermissions(16);
  const Group_Permissions = usePagePermissions(17);

  useEffect(() => {
    setAccessToken(null);
    async function getfounder() {
      try {
        const response = await authFetcher(
          getEndpointUrl(ENDPOINTS.getfoundingsponsers),
        );
        if (response.success) {
          setFoundingSponsersList(response.list);
        } else {
          console.log(`Api reponded with Status Code ${response.statusCode}`);
        }
      } catch (error) {
        console.error(`Api reponded with Error: ${error}`);
      }
    }
    async function gethomepagedetails() {
      try {
        if (user?.id) {
          setPageLoader(false);
          const currentDate = encryptString(new Date().toLocaleDateString('en-US'), process.env.NEXT_PUBLIC_XDS_EMAIL_SECRET_KEY);
          const response = await authFetcher(
            getEndpointUrl(ENDPOINTS.gethomepagedetails(user?.id, currentDate)),
          );
          if (response.success) {
            if (response.list.articles) {
              const activeArticle = response.list.articles;
              const filteredArticles = activeArticle.filter((article: { categoryId: number; }) => article.categoryId !== 1);
              setAllArticles(filteredArticles);
              const mainArticle = activeArticle.filter((articles: { categoryId: number; }) => articles.categoryId == 1);
              setMainArticles(mainArticle);
            }
            if(response.list.announcements && response.list.announcements.length > 0) {
              const allAnnouncements = response.list.announcements;
              const filteredAnnouncements = allAnnouncements.filter((announcement: { categoryType: string; }) => announcement.categoryType == "Announcement");
              setAnnouncements(filteredAnnouncements);
              const filteredTestmonials = allAnnouncements.filter((announcement: { categoryType: string; }) => announcement.categoryType == "Testimonial");
              setTestmonial(filteredTestmonials);
            }
            setrecentViewedProfiles(response.list.recentViewedProfiles);
            setsponsoredPartners(response.list.sponsoredPartners);
            setMyList(response.list.mylist);
            setMyProjets(response.list.myProjects);
            setJustJoined(response.list.justJoinedUsers);
            setFreshAndUpdated(response.list.freshAndUpdatedUsers);
            const bannerAds = setCrousalAgain(response.list.bannerAdImage, "homepageCrousal");
            setBannerAdImage(bannerAds);
            setTimeout(() => {
              if (user && user.companies && user?.companies[0].isTourCompleted) {
                setTourState({ run: false, stepIndex: 0, tourActive: false, steps: [] });
              } else {
                if (user?.email === 'pixelquest@farmoaks.com') {
                  setTourState({ run: true, stepIndex: 0, tourActive: true, steps: Toursteps });
                }
              }
            }, 2000);
            if (response.list.companyUsers) {
              const newUser = {
                id: user.id,
                firstName: user?.firstName,
                LastName: user?.lastName,
                lastLoginDate: user?.lastLoginDate,
              };
              const updatedRes = [newUser, ...response.list.companyUsers];
              setComanypUserList(updatedRes);
            }

            setPageLoader(true);
          } else {
            setPageLoader(true);
            console.log(`Api reponded with Status Code ${response.statusCode}`);
          }
        }
      } catch (error) {
        setPageLoader(true);
        console.error(`Api reponded with Error: ${error}`);
      }
    }
    gethomepagedetails();
    // getAllArticles();
    getAllEvents();
    getfounder();
    const weburl = window.location.href.split('/').slice(0, 3).join('/');
    setWebUrl(weburl);
  }, [user]);

  // useEffect(() => {
  //   setAccessToken(null);
  //   const currentDate = new Date().toLocaleDateString('en-US');
  //   authFetcher(`${getEndpointUrl(ENDPOINTS.getHomePageBannerAds(currentDate))}`)
  //     .then((bannerData) => {
  //       setBannerAdImage(bannerData);
  //     });
  // }, []);

  const bannerAdClicks = (bannerId: number) => {
    authPutWithData(`${getEndpointUrl(ENDPOINTS.updateAd(+bannerId))}`, { type: 'click' }).catch((err) => {
      console.log(err);
    });
  }
  // const getAllArticles = async () => {
  //   const articleCategories = await authFetcher(`${getEndpointUrl(ENDPOINTS.getAtciveArticles)}`).catch((error) => {
  //     console.log(error);
  //   });
  //   if (articleCategories) {
  //     const filteredArticles = articleCategories.filter((article: { categoryId: number; }) => article.categoryId !== 1);
  //     setAllArticles(filteredArticles);
  //     const mainArticle = articleCategories.filter((articles: { categoryId: number; }) => articles.categoryId == 1);
  //     setMainArticles(mainArticle);
  //     // setIsLoading(false);
  //   }
  // }

  const formatDateDiff = (date1: any, date2: any) => {
    const diffMs = Math.abs(date1 - date2);
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;

    return 'just now';
  }

  const getAllEvents = async () => {
    setIsLoading(true);
    setEventList([]);
    const allFaqQuestions = await authFetcher(
      getEndpointUrl(ENDPOINTS.getallActiveEvents(0)),
    );

    if (allFaqQuestions && allFaqQuestions.success == true) {
      if (allFaqQuestions.data) {
        setIsLoading(false);
        setEventList(allFaqQuestions.data);
      }
    } else {
      setIsLoading(false);
    }
  };

  const addAttendee = async (eventId: number) => {
    await authPut(`${getEndpointUrl(ENDPOINTS.addAttendee(eventId))}`);
    // setLoad(true);
    setEventList((prevEventList: any) => {
      return prevEventList.map((event: eventTypes) => {
        if (event.id === eventId) {
          const newAttendee = {
            companyId: user?.companyId,
          };
          return {
            ...event,
            EventAttendees: [...(event.EventAttendees || []), newAttendee],
          };
        }
        return event;
      });
    });
  }
  const removeAttendee = async (eventId: number) => {
    // setButtonLoader(true);
    // setLoadingEvents((prevEvnts) => ({
    //   ...prevEvnts, [eventId]: true
    // }))
    await deleteItem(`${getEndpointUrl(ENDPOINTS.removeAttendee(eventId))}`).then(() => {
      // setLoad(true);

      setEventList((prevEventList: any) => {
        return prevEventList.map((event: eventTypes) => {
          if (event.id === eventId && event.EventAttendees) {
            const newEventAttendees = [...event.EventAttendees];
            newEventAttendees.splice(0, 10);
            return {
              ...event,
              EventAttendees: newEventAttendees,
            };
          }
          return event;
        });
      });
    })
  }
  const handleEventAttendees = (eventId: number, eventName: string) => {
    localStorage.setItem("StoredEvents", JSON.stringify([{ id: eventId, name: eventName }]));
    route.push(PATH.BROWSESERVICEPROVIDERS.path)
  }

  return (
    <>
      {
        bannerAdImage && bannerAdImage.length > 0 && pageLoader &&
        <div className="bg-[#f1f1f1;]">
          <HomeFadeSlider images={bannerAdImage} webUrl={webUrl} onClickBannerAdClicks={(val: number) => bannerAdClicks(val)} />
        </div>
      }
      {pageLoader ?
        <div className="home_land_bg">
          {/* {bannerAdImage && bannerAdImage.map((imageData, index: number) =>
          (<div className="ad_banner_home">
            <Link target={`${imageData.adURL.startsWith(webUrl) ? '_self' : '_blank'}`} href={imageData.adURL ? (imageData.adURL.startsWith('http://') || imageData.adURL.startsWith('https://') ? imageData.adURL : `https://${imageData.adURL}`) : '#'} onClick={() => bannerAdClicks(imageData.id)}>
              {imageData.adImagePath && index == 0 &&
                <img src={imageData.adImagePath} />
              }
            </Link>
            <div className="flex flex-row-reverse text-xs"><Link target="_blank" className="advertise_banner" href="mailto:info@xds-spark.com?subject=XDS Spark - Banner Ad Enquiry">
              {"Advertise on Spark"}
            </Link></div>
          </div>)
          )
          } */}

          {/* Mobile ad banners */}
          {/* {bannerAdImage && bannerAdImage.map((imageData, index: number) =>
          (<div className="ad_banner_home_mobile">
            <Link target={`${imageData.adURL.startsWith(webUrl) ? '_self' : '_blank'}`} href={imageData.adURL ? (imageData.adURL.startsWith('http://') || imageData.adURL.startsWith('https://') ? imageData.adURL : `https://${imageData.adURL}`) : '#'} onClick={() => bannerAdClicks(imageData.id)}>
              {imageData.mobileAdImagePath && index == 0 &&
                <img src={imageData.mobileAdImagePath} />
              }
            </Link>
            <div className="flex flex-row-reverse text-xs"><Link target="_blank" className="advertise_banner" href="mailto:info@xds-spark.com?subject=XDS Spark - Banner Ad Enquiry">
              {"Advertise on Spark"}
            </Link></div>
          </div>)
          )
          } */}
          <div className="w-full px-5 pos_r container py-6 pb-10">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8">
              <div className="grid_cols_1 lg:col-span-2 lg:pr-10">
                {mainArticles && mainArticles[0] &&
                  <>
                    <h1 className="home_title"> <Link href={mainArticles[0].webUrl && (mainArticles[0].webUrl.startsWith('mailto:') ? mainArticles[0].webUrl : (mainArticles[0].webUrl.startsWith('http://') || mainArticles[0].webUrl.startsWith('https://') ?
                      mainArticles[0].webUrl : `https://${mainArticles[0].webUrl}`))} target={`${mainArticles[0].webUrl.startsWith(webUrl) ? '_self' : '_blank'}`}>{mainArticles[0]?.title}</Link> </h1>
                    <p className="text-base text-gray-950 mt-1.5">{mainArticles[0]?.description}</p>
                    <div className={`artical_image_style ${mainArticles[0]?.title == "" ? '' : 'mt-6'} overflow-hidden`} style={{ background: 'lightgray 50% / cover no-repeat' }}>
                      <Link href={mainArticles[0].webUrl && (mainArticles[0].webUrl.startsWith('mailto:') ? mainArticles[0].webUrl : (mainArticles[0].webUrl.startsWith('http://') || mainArticles[0].webUrl.startsWith('https://') ?
                        mainArticles[0].webUrl : `https://${mainArticles[0].webUrl}`))} target={`${mainArticles[0].webUrl.startsWith(webUrl) ? '_self' : '_blank'}`}>
                        <img src={mainArticles[0]?.signedUrl} className="h-full w-full" />
                      </Link>
                    </div>
                    <div className="py-3.5"><hr /></div>
                  </>
                }
                <h2 className="home_land_sub_title flex">What's Fresh in Spark {user && user.userRoles[0].roleCode == "service_provider" && <Tooltip content={`Service Providers get noticed! If you have a 100% complete profile, you greatly increase your chances of appearing in this space.`} className="tier_tooltip absolute" placement="bottom"><svg
                  className="w-[16px] h-[16px] text-gray-600 ml-1"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="#343434"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M2 12a10 10 0 1 1 20 0 10 10 0 0 1-20 0Zm9.4-5.5a1 1 0 1 0 0 2 1 1 0 1 0 0-2ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4c0-.6-.4-1-1-1h-2Z"
                    clipRule="evenodd"
                  />
                </svg></Tooltip>}</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2 mt-6">
                  {justJoined && justJoined.length > 0 && justJoined.map((joined: any) => (
                    <>

                      <div className="grid_articals news_artical_bg relative">
                        <div className="flex flex-row-reverse items-start gap-4  w-full justify-between">
                          <img
                            src={joined.userCategory}
                            alt=""
                            className="w-24 rounded-sm object-cover"
                          />
                          <div>
                            <h4 className="text-sm font_top_subtitle font-semibold mb-0.5">Just Joined</h4>
                            <h3 className="news_artical_title text-xl font-semibold pr-4 leading-6">{joined.Companies?.name + ' joined Spark'}</h3>
                            <p className="mt-2 text-sm">
                              {formatDateDiff(new Date(), new Date(joined.displayDate).setHours(0, 0, 0, 0))}
                            </p>
                          </div>
                        </div>
                        <Link href={`/serviceproviders-details/${joined.Companies?.slug}`} className=" after:absolute after:inset-0"></Link>
                      </div>

                    </>
                  ))
                  }
                  {freshAndUpdated && freshAndUpdated.length > 0 && freshAndUpdated.map((fresh: any) => (
                    <div className="grid_articals news_artical_bg relative">
                      <div className="flex flex-row-reverse items-start gap-4  w-full justify-between">
                        <img
                          src={fresh.userCategory}
                          alt=""
                          className="w-24 rounded-sm object-cover"
                        />
                        <div>
                          <h4 className="text-sm font_top_subtitle font-semibold mb-0.5">Fresh & Updated</h4>
                          <h3 className="news_artical_title text-xl font-semibold pr-4 leading-6">{fresh.name}  updated their {(fresh.categories.length > 1 ? <>Profile<span className="inline-flex relative z-[40]"><Tooltip className="tier_tooltip" content={`${(fresh.categories[0] ? 'Portfolio' : '') + '' + (fresh.categories[1] ? ', Projects' : '') + '' + (fresh.categories[2] ? ', Due Diligence' : '')}`}>...</Tooltip></span></> : (fresh.categories[0] == 2 ? 'Portfolio' : (fresh.categories[0] == 3 ? 'Projects' : (fresh.categories[0] == 4 ? 'Due Diligence' : ''))))}</h3>
                          <p className="mt-2 text-sm">
                            {formatDateDiff(new Date(), new Date(fresh.updatedAt).setHours(0, 0, 0, 0))}
                          </p>
                        </div>
                      </div>
                      <Link className=" after:absolute after:inset-0" href={`/serviceproviders-details/${fresh.slug}`}></Link>
                    </div>

                  ))}
                  {allArticles && allArticles.length > 0 && allArticles.map((items: getdataType) => {
                    const articleTitle = items.categoryId === 3 ? items.title.replace("Get to know ", "") : items.title;
                    const hasMatchingCompany = justJoined.length > 0 && justJoined.some(joinCompanies => joinCompanies.Companies.name !== articleTitle) ||
                      freshAndUpdated.length > 0 && freshAndUpdated.some(freshCompanies => freshCompanies.name !== articleTitle);
                    return (
                      <>
                        {(items.categoryId != 2 && items.categoryId != 4 && items.categoryId != 5) && hasMatchingCompany ? (
                          <div className="grid_articals news_artical_bg relative">
                            <div className="flex flex-row-reverse items-start gap-4 w-full justify-between">
                              <img
                                src={items.signedUrl}
                                alt=""
                                className="w-24 rounded-sm object-cover"
                              />
                              <div>
                                <h4 className="text-sm font_top_subtitle font-semibold mb-0.5">
                                  {items.ArticleCategory.categoryName}
                                </h4>
                                <h3 className="news_artical_title text-xl font-semibold pr-4 leading-6">
                                  {items.title.length > 42 ? (
                                    <>
                                      {items.title.substring(0, 42)}
                                      <span className="inline-flex relative z-[40]">
                                        <Tooltip content={`${items.title}`} className="tier_tooltip">...</Tooltip>
                                      </span>
                                    </>
                                  ) : (
                                    items.title
                                  )}
                                </h3>
                                <p className="mt-2 text-sm">
                                  {formatDateDiff(new Date(), new Date(items.StartDate).setHours(0, 0, 0, 0))}
                                </p>
                              </div>
                            </div>
                            <Link
                              className="after:absolute after:inset-0"
                              onClick={() => items.advtId && bannerAdClicks(items.advtId)}
                              href={items.webUrl && (items.webUrl.startsWith('mailto:') ? items.webUrl : (items.webUrl.startsWith('http://') || items.webUrl.startsWith('https://') ?
                                items.webUrl : `https://${items.webUrl}`))}
                              target={`${items.webUrl.startsWith(webUrl) ? '_self' : '_blank'}`}
                            ></Link>
                          </div>
                        ) : (
                          (items.categoryId != 2 && items.categoryId != 4 && items.categoryId != 5) && justJoined.length === 0 && freshAndUpdated.length === 0 &&
                          <div className="grid_articals news_artical_bg relative">
                            <div className="flex flex-row-reverse items-start gap-4 w-full justify-between">
                              <img
                                src={items.signedUrl}
                                alt=""
                                className="w-24 rounded-sm object-cover"
                              />
                              <div>
                                <h4 className="text-sm font_top_subtitle font-semibold mb-0.5">
                                  {items.ArticleCategory.categoryName}
                                </h4>
                                <h3 className="news_artical_title text-xl font-semibold pr-4 leading-6">
                                  {items.title.length > 42 ? (
                                    <>
                                      {items.title.substring(0, 42)}
                                      <span className="inline-flex relative z-[40]">
                                        <Tooltip content={`${items.title}`} className="tier_tooltip">...</Tooltip>
                                      </span>
                                    </>
                                  ) : (
                                    items.title
                                  )}
                                </h3>
                                <p className="mt-2 text-sm">
                                  {formatDateDiff(new Date(), new Date(items.StartDate).setHours(0, 0, 0, 0))}
                                </p>
                              </div>
                            </div>
                            <Link
                              className="after:absolute after:inset-0"
                              onClick={() => items.advtId && bannerAdClicks(items.advtId)}
                              href={items.webUrl && (items.webUrl.startsWith('mailto:') ? items.webUrl : (items.webUrl.startsWith('http://') || items.webUrl.startsWith('https://') ?
                                items.webUrl : `https://${items.webUrl}`))}
                              target={`${items.webUrl.startsWith(webUrl) ? '_self' : '_blank'}`}
                            ></Link>
                          </div>
                        )}
                      </>
                    );
                  })}

                </div>
                <div className="py-3.5">
                  <hr />
                </div>
                {(announcements.length > 0 || allArticles.length> 0)&& 
                  <><h2 className="home_land_sub_title flex">News & Announcements
                      <Tooltip content={`Service Providers can post news about their companies under Edit Company Profile and Post Announcements`} className="tier_tooltip absolute" placement="bottom"><svg
                      className="w-[16px] h-[16px] text-gray-600 ml-1"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="#343434"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2 12a10 10 0 1 1 20 0 10 10 0 0 1-20 0Zm9.4-5.5a1 1 0 1 0 0 2 1 1 0 1 0 0-2ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4c0-.6-.4-1-1-1h-2Z"
                        clipRule="evenodd"
                      />
                    </svg></Tooltip>
                    </h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2 mt-6">
                      {announcements && announcements.length > 0 && announcements.map((joined: any) => (
                        <>
                          <div className="grid_articals news_artical_bg relative">
                            <div className="flex flex-row-reverse items-start gap-4  w-full justify-between">
                              <img
                                src={joined.SpAnnouncements.imageUrl ? joined.SpAnnouncements.imageUrl : '/no-image-available.jpg'}
                                alt=""
                                className="w-24 rounded-sm object-cover"
                              />
                              <div>
                                <h4 className="text-sm font_top_subtitle font-semibold mb-0.5">{joined.Companies?.name}'s  Announcement</h4>
                                <h3 className="news_artical_title text-xl font-semibold pr-4 leading-6 line-clamp-2">{joined.SpAnnouncements?.title}</h3>
                                <p className="mt-2 text-sm">
                                  {formatDateDiff(new Date(), new Date(joined.displayDate).setHours(0, 0, 0, 0))}
                                </p>
                              </div>
                            </div>
                            <Link href={`/serviceproviders-details/${joined.Companies?.slug}?tab=7`} className=" after:absolute after:inset-0"></Link>
                          </div>

                        </>
                      ))
                      }
                      {allArticles && allArticles.length > 0 && allArticles.map((items: getdataType) => {
                        return (
                          <>
                            {(items.categoryId == 2 || items.categoryId == 4 || items.categoryId == 5) && (
                              <div className="grid_articals news_artical_bg relative">
                                <div className="flex flex-row-reverse items-start gap-4 w-full justify-between">
                                  <img
                                    src={items.signedUrl}
                                    alt=""
                                    className="w-24 rounded-sm object-cover"
                                  />
                                  <div>
                                    <h4 className="text-sm font_top_subtitle font-semibold mb-0.5">
                                      {items.ArticleCategory.categoryName}
                                    </h4>
                                    <h3 className="news_artical_title text-xl font-semibold pr-4 leading-6">
                                      {items.title.length > 42 ? (
                                        <>
                                          {items.title.substring(0, 42)}
                                          <span className="inline-flex relative z-[40]">
                                            <Tooltip content={`${items.title}`} className="tier_tooltip">...</Tooltip>
                                          </span>
                                        </>
                                      ) : (
                                        items.title
                                      )}
                                    </h3>
                                    <p className="mt-2 text-sm">
                                      {formatDateDiff(new Date(), new Date(items.StartDate).setHours(0, 0, 0, 0))}
                                    </p>
                                  </div>
                                </div>
                                <Link
                                  className="after:absolute after:inset-0"
                                  onClick={() => items.advtId && bannerAdClicks(items.advtId)}
                                  href={items.webUrl && (items.webUrl.startsWith('mailto:') ? items.webUrl : (items.webUrl.startsWith('http://') || items.webUrl.startsWith('https://') ?
                                    items.webUrl : `https://${items.webUrl}`))}
                                  target={`${items.webUrl.startsWith(webUrl) ? '_self' : '_blank'}`}
                                ></Link>
                              </div>
                            )
                            }
                          </>
                        );
                      })}
                    </div>
                    <div className="py-3.5">
                      <hr />
                    </div>
                  </>
                } 
                {(testmonial.length > 0 ) && 
                  <><h2 className="home_land_sub_title flex">Latest Testimonials
                      <Tooltip content="Service Providers can post testimonials of their projects under Edit Company Profile > Our Work and Project Highlights" className="tier_tooltip absolute" placement="bottom"><svg
                      className="w-[16px] h-[16px] text-gray-600 ml-1"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="#343434"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2 12a10 10 0 1 1 20 0 10 10 0 0 1-20 0Zm9.4-5.5a1 1 0 1 0 0 2 1 1 0 1 0 0-2ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4c0-.6-.4-1-1-1h-2Z"
                        clipRule="evenodd"
                      />
                    </svg></Tooltip>
                    </h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2 mt-6">
                      {testmonial && testmonial.length > 0 && testmonial.map((projectTestmonial: any) => (
                        <>
                          <div className="grid_articals news_artical_bg relative cursor-pointer" 
                          // onClick={() => updateClicks(projectTestmonial.testimonials.id, projectTestmonial.Companies?.slug, projectTestmonial.testimonials.name)}
                          >
                            <div className="flex items-start gap-4  w-full justify-between">
                              <img
                                src={projectTestmonial.Companies.logoAsset.url ? projectTestmonial.Companies.logoAsset.url : '/no-image-available.jpg'}
                                alt=""
                                className="w-24 rounded-sm object-cover"
                              />
                              <div>
                                <h4 className="text-sm font_top_subtitle font-semibold mb-0.5">{projectTestmonial.Companies?.name}</h4>
                                <h3 className="news_artical_title text-xl font-semibold pr-4 leading-6 line-clamp-2">{`${projectTestmonial.testimonials?.testimonial_company} provided a testimonial`}</h3>
                                <p className="mt-2 text-sm">
                                  {formatDateDiff(new Date(), new Date(projectTestmonial.displayDate).setHours(0, 0, 0, 0))}
                                </p>
                              </div>
                            </div>
                            <Link href={`/serviceproviders-details/${projectTestmonial.Companies?.slug}?tab=1&&projectId=${projectTestmonial.testimonials.name}-${projectTestmonial.testimonials.id}`} className=" after:absolute after:inset-0"></Link>
                          </div>

                        </>
                      ))
                      }
                      {/* {allArticles && allArticles.length > 0 && allArticles.map((items: getdataType) => {
                        return (
                          <>
                            {(items.categoryId == 2 || items.categoryId == 4 || items.categoryId == 5) && (
                              <div className="grid_articals news_artical_bg relative">
                                <div className="flex flex-row-reverse items-start gap-4 w-full justify-between">
                                  <img
                                    src={items.signedUrl}
                                    alt=""
                                    className="w-24 rounded-sm object-cover"
                                  />
                                  <div>
                                    <h4 className="text-sm font_top_subtitle font-semibold mb-0.5">
                                      {items.ArticleCategory.categoryName}
                                    </h4>
                                    <h3 className="news_artical_title text-xl font-semibold pr-4 leading-6">
                                      {items.title.length > 42 ? (
                                        <>
                                          {items.title.substring(0, 42)}
                                          <span className="inline-flex relative z-[40]">
                                            <Tooltip content={`${items.title}`} className="tier_tooltip">...</Tooltip>
                                          </span>
                                        </>
                                      ) : (
                                        items.title
                                      )}
                                    </h3>
                                    <p className="mt-2 text-sm">
                                      {formatDateDiff(new Date(), new Date(items.StartDate).setHours(0, 0, 0, 0))}
                                    </p>
                                  </div>
                                </div>
                                <Link
                                  className="after:absolute after:inset-0"
                                  onClick={() => items.advtId && bannerAdClicks(items.advtId)}
                                  href={items.webUrl && (items.webUrl.startsWith('mailto:') ? items.webUrl : (items.webUrl.startsWith('http://') || items.webUrl.startsWith('https://') ?
                                    items.webUrl : `https://${items.webUrl}`))}
                                  target={`${items.webUrl.startsWith(webUrl) ? '_self' : '_blank'}`}
                                ></Link>
                              </div>
                            )
                            }
                          </>
                        );
                      })} */}
                    </div>
                    <div className="py-3.5">
                      <hr />
                    </div>
                  </>
                }
                <div className="home_founding_partners_section">
                  <h2 className="home_land_sub_title">Thank you to our Platinum Partners
                    <button onClick={toggleVisibility}>

                      {!isVisible ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" className="ml-2.5 cursor-pointer">
                        <path d="M20.2959 9.79586L12.7959 17.2959C12.6914 17.4007 12.5672 17.484 12.4304 17.5407C12.2937 17.5975 12.1471 17.6267 11.999 17.6267C11.851 17.6267 11.7043 17.5975 11.5676 17.5407C11.4309 17.484 11.3067 17.4007 11.2021 17.2959L3.70215 9.79586C3.4908 9.58451 3.37207 9.29787 3.37207 8.99898C3.37207 8.7001 3.4908 8.41345 3.70215 8.20211C3.91349 7.99076 4.20014 7.87203 4.49902 7.87203C4.79791 7.87203 5.08455 7.99076 5.2959 8.20211L12 14.9062L18.704 8.20117C18.9154 7.98983 19.202 7.87109 19.5009 7.87109C19.7998 7.87109 20.0864 7.98983 20.2978 8.20117C20.5091 8.41252 20.6278 8.69916 20.6278 8.99805C20.6278 9.29693 20.5091 9.58358 20.2978 9.79492L20.2959 9.79586Z" fill="#0071C2" />
                      </svg> : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" className="ml-2.5 cursor-pointer rotate-180">
                        <path d="M20.2959 9.79586L12.7959 17.2959C12.6914 17.4007 12.5672 17.484 12.4304 17.5407C12.2937 17.5975 12.1471 17.6267 11.999 17.6267C11.851 17.6267 11.7043 17.5975 11.5676 17.5407C11.4309 17.484 11.3067 17.4007 11.2021 17.2959L3.70215 9.79586C3.4908 9.58451 3.37207 9.29787 3.37207 8.99898C3.37207 8.7001 3.4908 8.41345 3.70215 8.20211C3.91349 7.99076 4.20014 7.87203 4.49902 7.87203C4.79791 7.87203 5.08455 7.99076 5.2959 8.20211L12 14.9062L18.704 8.20117C18.9154 7.98983 19.202 7.87109 19.5009 7.87109C19.7998 7.87109 20.0864 7.98983 20.2978 8.20117C20.5091 8.41252 20.6278 8.69916 20.6278 8.99805C20.6278 9.29693 20.5091 9.58358 20.2978 9.79492L20.2959 9.79586Z" fill="#0071C2" />
                      </svg>}
                    </button>
                  </h2>
                  {isVisible && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2  lg:gap-x-6 lg:gap-y-4 mt-6">
                      {(foundingsponserslist.length > 0 && foundingsponserslist.map((foundingsponsers: foundindSponserListType, index) => (
                        <div className="partner_cols" key={`founding_${index}_key`}>
                          <Link
                            href={`/serviceproviders-details/${foundingsponsers.slug}`}
                          >
                            <div className="partner_bg_card overflow-hidden">

                              <img
                                src={
                                  (foundingsponsers?.bannerAsset &&
                                    foundingsponsers?.bannerAsset?.url) ||
                                  "/no-image-available.jpg"
                                }
                                alt="banner"
                                className="aspect-square h-full w-full object-cover"
                              />
                              <div className="px-5">
                                <img
                                  className="w-20"
                                  src={
                                    (foundingsponsers?.logoAsset &&
                                      foundingsponsers?.logoAsset?.url) ||
                                    "/circle-no-image-available.jpg"
                                  }
                                  alt="logo"
                                />
                              </div>
                            </div>
                          </Link>
                        </div>
                      ),
                      )) ||
                        ""}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid_cols_2 lg:pl-6">
                {isLoading &&
                  <>
                    <h2 className="home_land_sub_title mb-2">Upcoming Events</h2>
                    <div className="flex justify-center items-center pt-2">
                      <Spinner />
                    </div>
                  </>
                }
                {eventList && eventList.length > 0 &&
                  <>
                    <h2 className="home_land_sub_title mb-2">Upcoming Events</h2>
                    <div className="space-y-2">
                      {eventList.map((event: eventTypes) => (
                        <div className="flex items-stretch home_side_bar_lg relative">
                          <img
                            src={event.signedUrl}
                            alt=""
                            className="aspect-square w-[50px] rounded-sm object-cover"
                          />
                          <div>
                            <p className="text-sm font-medium pr-5"><span className="font-bold">{event.eventName}: </span></p><p className="text-sm font-medium pr-5">{formatDateRange(new Date(event.eventStartDate), new Date(event.eventEndDate))}</p>
                            <p className="text-sm font-medium">
                              {event.eventLocation}

                            </p>
                            {event.EventAttendees && event.EventAttendees.find((attendee: { companyId: number }) => attendee && (attendee.companyId === user?.companyId)) &&
                              <button className="attending_button mt-2">You're attending</button>
                            }
                            <span onClick={() => handleEventAttendees(event.id, event.eventName)} className="link_color text-sm underline font-medium cursor-pointer">See who else is attending</span>
                          </div>
                          {event.EventAttendees && event.EventAttendees.find((attendee: { companyId: number }) => attendee && attendee.companyId === user?.companyId) ?
                            (user?.userRoles[0].roleCode == 'service_provider' ?
                              <div>
                                {user && user.isPaidUser ?
                                  <button className="absolute right-0.5 top-2" onClick={() => removeAttendee(event.id)}>
                                    <Tooltip className="custom_tooltip" content="Click to remove yourself from this event" placement="left">
                                      <svg
                                        className="w-5 h-5 me-2 dark:text-green-400 flex-shrink-0 orange_c"
                                        fill="currentColor"
                                        viewBox="0 0 512 512"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <g id="Layer_2" data-name="Layer 2">
                                          <g id="minus_">
                                            <path d="M256 0C114.62 0 0 114.62 0 256s114.62 256 256 256 256-114.62 256-256S397.38 0 256 0zm120 256a37.69 37.69 0 0 1-37.69 37.69H173.69A37.69 37.69 0 0 1 136 256a37.69 37.69 0 0 1 37.69-37.69h164.62A37.69 37.69 0 0 1 376 256z" />
                                          </g>
                                        </g>
                                      </svg>
                                    </Tooltip>
                                  </button>
                                  :
                                  <button className="absolute right-0.5 top-2" onClick={() => { setPopupMessage("EVENTS"); setOpenPopup(true) }}>
                                    <Tooltip className="custom_tooltip" content="Click to remove yourself from this event" placement="left">
                                      <svg
                                        className="w-5 h-5 me-2 dark:text-green-400 flex-shrink-0 orange_c"
                                        fill="currentColor"
                                        viewBox="0 0 512 512"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <g id="Layer_2" data-name="Layer 2">
                                          <g id="minus_">
                                            <path d="M256 0C114.62 0 0 114.62 0 256s114.62 256 256 256 256-114.62 256-256S397.38 0 256 0zm120 256a37.69 37.69 0 0 1-37.69 37.69H173.69A37.69 37.69 0 0 1 136 256a37.69 37.69 0 0 1 37.69-37.69h164.62A37.69 37.69 0 0 1 376 256z" />
                                          </g>
                                        </g>
                                      </svg>
                                    </Tooltip>
                                  </button>
                                }
                              </div>
                              :
                              ''
                            )
                            :
                            (user?.userRoles[0].roleCode == 'service_provider' ?
                              <div>
                                {user && user.isPaidUser ?
                                  <button className="absolute right-2 top-2" onClick={() => addAttendee(event.id)}>
                                    <Tooltip className="custom_tooltip" content="Click to let others at Spark know you'll be attending" placement="left"> <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <g id="PlusCircle">
                                        <path id="Vector" d="M12 2.25C10.0716 2.25 8.18657 2.82183 6.58319 3.89317C4.97982 4.96451 3.73013 6.48726 2.99218 8.26884C2.25422 10.0504 2.06114 12.0108 2.43735 13.9021C2.81355 15.7934 3.74215 17.5307 5.10571 18.8943C6.46928 20.2579 8.20656 21.1865 10.0979 21.5627C11.9892 21.9389 13.9496 21.7458 15.7312 21.0078C17.5127 20.2699 19.0355 19.0202 20.1068 17.4168C21.1782 15.8134 21.75 13.9284 21.75 12C21.7468 9.41513 20.7185 6.93705 18.8907 5.10927C17.063 3.28149 14.5849 2.25323 12 2.25ZM15.75 12.75H12.75V15.75C12.75 15.9489 12.671 16.1397 12.5303 16.2803C12.3897 16.421 12.1989 16.5 12 16.5C11.8011 16.5 11.6103 16.421 11.4697 16.2803C11.329 16.1397 11.25 15.9489 11.25 15.75V12.75H8.25C8.05109 12.75 7.86033 12.671 7.71967 12.5303C7.57902 12.3897 7.5 12.1989 7.5 12C7.5 11.8011 7.57902 11.6103 7.71967 11.4697C7.86033 11.329 8.05109 11.25 8.25 11.25H11.25V8.25C11.25 8.05109 11.329 7.86032 11.4697 7.71967C11.6103 7.57902 11.8011 7.5 12 7.5C12.1989 7.5 12.3897 7.57902 12.5303 7.71967C12.671 7.86032 12.75 8.05109 12.75 8.25V11.25H15.75C15.9489 11.25 16.1397 11.329 16.2803 11.4697C16.421 11.6103 16.5 11.8011 16.5 12C16.5 12.1989 16.421 12.3897 16.2803 12.5303C16.1397 12.671 15.9489 12.75 15.75 12.75Z" fill="#0071C2" />
                                      </g>
                                    </svg></Tooltip>
                                  </button>
                                  :
                                  <button className="absolute right-2 top-2" onClick={() => { setPopupMessage("EVENTS"); setOpenPopup(true) }}>
                                    <Tooltip className="custom_tooltip" content="Click to let others at Spark know you'll be attending" placement="left"> <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <g id="PlusCircle">
                                        <path id="Vector" d="M12 2.25C10.0716 2.25 8.18657 2.82183 6.58319 3.89317C4.97982 4.96451 3.73013 6.48726 2.99218 8.26884C2.25422 10.0504 2.06114 12.0108 2.43735 13.9021C2.81355 15.7934 3.74215 17.5307 5.10571 18.8943C6.46928 20.2579 8.20656 21.1865 10.0979 21.5627C11.9892 21.9389 13.9496 21.7458 15.7312 21.0078C17.5127 20.2699 19.0355 19.0202 20.1068 17.4168C21.1782 15.8134 21.75 13.9284 21.75 12C21.7468 9.41513 20.7185 6.93705 18.8907 5.10927C17.063 3.28149 14.5849 2.25323 12 2.25ZM15.75 12.75H12.75V15.75C12.75 15.9489 12.671 16.1397 12.5303 16.2803C12.3897 16.421 12.1989 16.5 12 16.5C11.8011 16.5 11.6103 16.421 11.4697 16.2803C11.329 16.1397 11.25 15.9489 11.25 15.75V12.75H8.25C8.05109 12.75 7.86033 12.671 7.71967 12.5303C7.57902 12.3897 7.5 12.1989 7.5 12C7.5 11.8011 7.57902 11.6103 7.71967 11.4697C7.86033 11.329 8.05109 11.25 8.25 11.25H11.25V8.25C11.25 8.05109 11.329 7.86032 11.4697 7.71967C11.6103 7.57902 11.8011 7.5 12 7.5C12.1989 7.5 12.3897 7.57902 12.5303 7.71967C12.671 7.86032 12.75 8.05109 12.75 8.25V11.25H15.75C15.9489 11.25 16.1397 11.329 16.2803 11.4697C16.421 11.6103 16.5 11.8011 16.5 12C16.5 12.1989 16.421 12.3897 16.2803 12.5303C16.1397 12.671 15.9489 12.75 15.75 12.75Z" fill="#0071C2" />
                                      </g>
                                    </svg></Tooltip>
                                  </button>
                                }
                              </div>
                              :
                              ''
                            )
                          }
                        </div>
                      ))}
                    </div>
                    <div className="py-3.5">
                      <hr />
                    </div>
                  </>
                }
                {recentViewedProfiles && recentViewedProfiles.length > 0 &&
                  <>
                    <h2 className="home_land_sub_title">Recently Viewed Profiles <Link href="/serviceproviders" className="link_color font-semibold text-sm">[Browse More]</Link></h2>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 mt-2">
                      {(recentViewedProfiles.length > 0 && recentViewedProfiles.map(
                        (recentlyViewed: recentlyViewedTypes, index) => (
                          <div className="home_side_bar_lg card_item_center">
                            <div className="flex items-start gap-4">
                              <img
                                src={(recentlyViewed && recentlyViewed.viewedCompany.logoAsset?.url) || "/circle-no-image-available.jpg"}
                                alt=""
                                className="w-[40px] rounded-sm" />
                              <div>
                                <Link href={`/serviceproviders-details/${recentlyViewed.viewedCompany.slug}`} className="link_color text-sm underline font-medium break-all">{recentlyViewed.viewedCompany.name}</Link>
                              </div>
                            </div>
                          </div>
                        )))}
                    </div>
                    <div className="py-3.5"> <hr /></div>
                  </>
                }

                {myList && myList.length > 0 &&
                  <>
                    <h2 className="home_land_sub_title pb-2">My Lists
                      {((user && user.isPaidUser) || user?.userRoles[0].roleCode === "buyer") && myList.length > 2 &&
                        <Link href="/my-lists" className="link_color font-semibold text-sm"> [View All]</Link>
                      }
                    </h2>
                    <div className="space-y-2">
                      {myList.map((
                        list: {
                          id: number;
                          name: string;
                          description: string;
                          updatedAt: string;
                        },
                        index: number,
                      ) => (
                        index < 3 && <>
                          <div className="flex items-stretch gap-4 home_side_bar_lg">
                            {user?.isPaidUser || user?.userRoles[0].roleCode === "buyer" ?
                              <Link href={`/my-lists/${list.id}`}>
                                <div>
                                  <div className="link_color text-sm underline font-medium block">{list.name}</div>
                                  <p className="text-sm font-medium line-clamp-2">{list.description}</p>
                                </div>
                              </Link>
                              :
                              <div onClick={() => { setPopupMessage("MYLISTS"); setOpenPopup(true) }} className="cursor-pointer">
                                <div>
                                  <div className="flex flex-start link_color text-sm underline font-medium block ">{list.name}</div>
                                  <p className="text-sm font-medium line-clamp-2">{list.description}</p>
                                </div>
                              </div>
                            }
                          </div>
                        </>
                      ))}
                    </div>
                    <div className="py-3.5"> <hr /></div>
                  </>
                }
                {myProjects && myProjects.length > 0 &&
                  <>
                    <h2 className="home_land_sub_title pb-2">My Projects
                      {((user && user.isPaidUser) || user?.userRoles[0].roleCode === "buyer") && myProjects.length > 3 &&
                        <Link href="/my-projects" className="link_color font-semibold text-sm"> [View All]</Link>
                      }
                    </h2>
                    <div className="space-y-2">
                      {myProjects.map((
                        project: {
                          id: number;
                          name: string;
                          description: string;
                          updatedAt: string;
                        },
                        index: number,) => (
                        <>
                          {index < 3 &&
                            <div className="flex items-stretch gap-4 home_side_bar_lg">
                              {(user && user.isPaidUser) || user?.userRoles[0].roleCode === "buyer" ?
                                <Link href={`/my-projects/${project.id}`}>
                                  <div>
                                    <div className="link_color text-sm underline font-medium block">{project.name}</div>
                                    <p className="text-sm font-medium line-clamp-2">{project.description}</p>
                                  </div>
                                </Link>
                                :
                                <div className="cursor-pointer" onClick={() => { setPopupMessage("MYPROJECTS"); setOpenPopup(true) }}>
                                  <div>
                                    <div className="link_color text-sm underline font-medium block">{project.name}</div>
                                    <p className="text-sm font-medium line-clamp-2">{project.description}</p>
                                  </div>
                                </div>
                              }
                            </div>
                          }
                        </>
                      ))}
                    </div>
                    <div className="py-3.5"> <hr /></div>
                  </>
                }
                {((Users_Permissions.isCompanyUser && Users_Permissions.canRead) || (Group_Permissions.isCompanyUser && Group_Permissions.canRead) || (!user?.isCompanyUser)) && user?.isPaidUser &&
                  <>
                    <div className="user_table_list">
                      <h2 className="home_land_sub_title">Company Admin
                        <Link href="/company-admin/users" className="link_color font-semibold text-sm"> [Manage]</Link>
                      </h2>
                      <div className="mt-2">
                        <table>
                          <tr>
                            <th>Current Users</th>
                            <th>Last Login</th>
                          </tr>
                          {comanypUserList.length > 0 && comanypUserList.map((companyUser: { id: number, firstName: string, LastName: string, lastLoginDate: Date }, index: number) => (
                            index < 5 && <><tr>
                              <td>{index == 0 ? <CompanyAdminIcon></CompanyAdminIcon> : <CompanyUserIcon></CompanyUserIcon>}{companyUser.firstName} {companyUser.LastName} {(user?.isCompanyUser && user?.CompanyAdminId == companyUser.id) ? '(You)' : (!user?.isCompanyUser && index == 0 ? '(You)' : '')}</td>
                              <td className="text-center">{companyUser.lastLoginDate ? formatDate(companyUser.lastLoginDate) : '-'}</td>
                            </tr>
                            </>
                          ))
                          }
                          {comanypUserList.length == 1 &&
                            <tr>
                              <td colSpan={2}><p className="text-[14px] italic text-gray-500 text-center">You have not added any team members.</p></td>
                            </tr>
                          }
                        </table>
                        {((user?.isCompanyUser && Users_Permissions.canRead) || (!user?.isCompanyUser)) &&
                          <>{comanypUserList.length < user.companyUsersLimit + 1 &&
                            <div className="flex justify-end pr-2 mt-2">
                              <p className="text-[13px] font-bold link_color"><Link href="/company-admin/users/create-user"><u>+ Add User</u></Link></p>
                            </div>
                          }
                          </>

                        }

                      </div>
                    </div>
                    <div className="py-3.5"> <hr /></div>
                  </>
                }

                {sponsoredPartners && sponsoredPartners.length > 0 &&
                  <>
                    <h2 className="home_land_sub_title">Our Latest Buyers</h2>
                    {/* <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 mt-4"> */}
                    <div className="top_slider mt-4">
                      <div className="h-18">
                        <ReactSimplyCarousel
                          activeSlideIndex={activeSlideIndex}
                          onRequestChange={setActiveSlideIndex}
                          responsiveProps={[
                            {
                              itemsToShow: 5,
                              itemsToScroll: 1,
                            },
                          ]}
                          autoplay={true}
                          autoplayDirection='forward'
                          autoplayDelay={1250}
                          swipeRatio={1}
                          speed={1000}

                        >
                          {sponsoredPartners.map((list: { fileUrl: string, fileName: string }) => (
                            <div className={`carousel-item w-[100px]`}>
                              <img
                                src={list.fileUrl}
                                alt=""
                                width={82}
                                height={51}
                                className="inline-block"
                                touch-action="none"
                              />
                            </div>
                          ))}
                        </ReactSimplyCarousel>
                      </div>
                    </div>
                  </>
                }

              </div>
            </div>

          </div>
          <FreeTierAlerts isOpen={openPopup} setOpenPopup={setOpenPopup} bodymessage={popupMessage} />
        </div>
        :
        <div className="min-h-screen flex justify-center items-center">
          <Spinner />
        </div>
      }
    </>
  );
};

export default HomeLanding;

type foundindSponserListType = {
  logoAsset: {
    url: string;
  };
  bannerAsset: {
    url: string;
  };
  id: number;
  slug: string,
};
