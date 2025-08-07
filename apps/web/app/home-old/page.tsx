"use client";
import Image from "next/image";
import { Button, Carousel, Tooltip } from "flowbite-react";
import { useEffect, useRef, useState } from "react";
import { useUserContext } from "@/context/store";
import { useRouter } from "next/navigation";

import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { authFetcher, authPutWithData } from "@/hooks/fetcher";
import {
  recentlyViewedTypes,
  recentlyJoinedTypes,
  ServicesOpt,
  opportunityTypes,
} from "../opportunity-details/[id]/page";
import { isValidJSON, serviceColoring } from "@/constants/serviceColors";
import { useAuthentication } from "@/services/authUtils";
import Link from "next/link";
import FreeTierAlerts from "@/components/ui/freeTierAlerts";
import { useMultiTourContext } from "@/context/multiTourContext";
import { Toursteps } from "@/services/tour";
import { BodyMessageType } from "@/constants/popupBody";
import ReactSimplyCarousel from 'react-simply-carousel';

const Home = () => {
  const route = useRouter();

  const profileIdNeedToOpen = localStorage.getItem("viewCompanyProfile");
  if(profileIdNeedToOpen && profileIdNeedToOpen != "") {
    localStorage.removeItem("viewCompanyProfile");
    route.push(`/serviceproviders-details/${profileIdNeedToOpen}`);
  }

  const { user, setAccessToken } = useUserContext();
  const searchRef = useRef<HTMLInputElement>(null);
  const [openPopup, setOpenPopup] = useState<boolean>(false);
  useAuthentication({ user, isBuyerRestricted: false, isPaidUserPage: false });

  const {
    setTourState,
    tourState: { run, stepIndex, steps,tourActive },
  } = useMultiTourContext();
  
  const [isVisible, setIsVisible] = useState(true);
  const handleToggle = () => {
    setIsVisible(!isVisible);
  };

  const [foundingsponserslist, setFoundingSponsersList] = useState([]);
  const [myRecentOpportunities, setMyRecentOpportunities] = useState([]);
  const [latestOpportunities, setLatestOpportunities] = useState([]);
  const [recentViewedProfiles, setrecentViewedProfiles] = useState([]);
  const [recentJoinedProfiles, setrecentJoinedProfiles] = useState([]);
  const [sponsoredPartners, setsponsoredPartners] = useState([]);
  const [myList, setMyList] = useState([]);
  const [submittedIntrested, setSubmittedIntrested] = useState([]);
  const [popupMessage, setPopupMessage] = useState<BodyMessageType>('DEFAULT');
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [bannerAdImage, setBannerAdImage] = useState<{id:number, adImagePath:string, mobileAdImagePath:string, adURL: string, adPage: string}[]>([]);

  useEffect(() => {
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
          const response = await authFetcher(
            getEndpointUrl(ENDPOINTS.gethomepagedetails(user?.id, "")),
          );
          if (response.success) {
            const updatedLatestOpportunities = response.list.latestOpportunities.map((opportunity: opportunityTypes) => {
              return {
                ...opportunity,
                description: isValidJSON(opportunity.description) ? JSON.parse(opportunity.description) : opportunity.description,
              };
            });

            const updatedMyRecentOpportunities = response.list.myrecentOpportunities.map((opportunity: opportunityTypes) => {
              return {
                ...opportunity,
                description: isValidJSON(opportunity.description) ? JSON.parse(opportunity.description) : opportunity.description,
              };
            });
            const updatedSubmitOpportunities = response.list.submittedIntrested.map((opportunity: opportunityTypes) => {
              return {
                ...opportunity,
                description: isValidJSON(opportunity.description) ? JSON.parse(opportunity.description) : opportunity.description,
              };
            });
            setMyRecentOpportunities(updatedMyRecentOpportunities);
            setLatestOpportunities(updatedLatestOpportunities);
            setSubmittedIntrested(updatedSubmitOpportunities);
            setrecentViewedProfiles(response.list.recentViewedProfiles);
            setrecentJoinedProfiles(response.list.recentJoinedProfiles);
            setsponsoredPartners(response.list.sponsoredPartners);
            setMyList(response.list.mylist);
            setTimeout(() => {
              if(user && user.companies && user?.companies[0].isTourCompleted){
                setTourState({ run: false, stepIndex: 0, tourActive: false, steps:[]}); 
              }else{
                if(user?.email === 'pixelquest@farmoaks.com'){
                  setTourState({ run: true, stepIndex: 0, tourActive: true, steps:Toursteps });
                } 
              } 
            }, 2000);
            
          } else {
            console.log(`Api reponded with Status Code ${response.statusCode}`);
          }
        }
      } catch (error) {
        console.error(`Api reponded with Error: ${error}`);
      }
    }
    gethomepagedetails();
    getfounder();
  }, [user]);

  useEffect(() => {
    setAccessToken(null);
    const currentDate = new Date().toLocaleDateString('en-US');
    authFetcher(`${getEndpointUrl(ENDPOINTS.getHomePageBannerAds(currentDate))}`)
    .then((bannerData) => {
      setBannerAdImage(bannerData);
    });
  },[]);

  const handlesearc = () => {
    const inputServiceFocusElement = document.getElementById("default-search");
    inputServiceFocusElement?.focus();
    if (searchRef.current && searchRef.current?.value) {
      localStorage.setItem("inputsearchvalue", searchRef.current?.value.trim());
      route.push("/serviceproviders");
    }
  };

  const handleFreeRoute = (path: string, e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    e.preventDefault();
    if (user?.isPaidUser) {
      route.push(path);
    } else {
      if(path == '/my-lists'){
        setPopupMessage('MYLISTS');
      }else if(path == '/my-opportunities'){
        setPopupMessage('MYOPPORTUNITIES');
      
      }else if(path == '/opportunities'){
        setPopupMessage('BROWSEOPPORTUNITIES');
      }
      
      setOpenPopup(true);
    }
  }

  const bannerAdClicks = (bannerId: number) => {
    authPutWithData(`${getEndpointUrl(ENDPOINTS.updateAd(+bannerId))}`, {type:'click'}).catch((err) => {
      console.log(err);
    });
  }
  // console.log(run, stepIndex, steps );
  return (
    <div className="home_bg">
     {!run && (
        <div >
          {/* <Button  onClick={handleClickStart}>
            Start the tour
          </Button> */}
        </div>
      )}
      {/* Desktop ad Banner */}
      {bannerAdImage && bannerAdImage.map((imageData, index: number) =>
          (<div className="ad_banner_home">
            <Link target="_blank" href={imageData.adURL? (imageData.adURL.startsWith('http://') || imageData.adURL.startsWith('https://')? imageData.adURL: `https://${imageData.adURL}`) : '#'} onClick={() => bannerAdClicks(imageData.id)}>
            {imageData.adImagePath  && index == 0 &&
              <img src={imageData.adImagePath} />
            }
              
            </Link>
          </div>)
      ) 
      }
      
      {/* Mobile ad banners */}
      {bannerAdImage && bannerAdImage.map((imageData, index: number) =>
          (<div className="ad_banner_home_mobile">
            <Link target="_blank" href={imageData.adURL? (imageData.adURL.startsWith('http://') || imageData.adURL.startsWith('https://')? imageData.adURL: `https://${imageData.adURL}`) : '#'} onClick={() => bannerAdClicks(imageData.id)}>
            {imageData.mobileAdImagePath  && index == 0 &&
              <img src={imageData.mobileAdImagePath} />
            }
              
            </Link>
          </div>)
      ) 
      }
      <div className="w-full lg:container lg:px-0 px-2.5">
        <div className="search_section">
          <div className="w-full lg:w-[1080px] lg:px-20 lg:py-10 py-6">
            <div className="flex items-center justify-center">
              <div className="searhlogo xs_mobile_hide">
                <Image
                  className="relative top-4"
                  src="/spark_mascot_home.png"
                  alt=""
                  width={300}
                  height={300}
                />
              </div>
              <form
                className="w-full lg:ml-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handlesearc();
                }}
              >
                <div className="relative lg:w-full w-[320px] m-auto ml-1">
                  <h1 className="font-bold home_header_color serach_font_size text-center lg:pb-9 pb-3 text-xl">
                    {user && user.userRoles[0].roleCode === "buyer"
                      ? "Find your Perfect Service Provider"
                      : "Discover Opportunities and Partnerships"}
                  </h1>
                  <div className="relative">
                    <input
                      ref={searchRef}
                      type="search"
                      id="default-search"
                      className="block w-full p-4  pr-32 text-sm  font-medium border serch_border_color border_radius homesearch"
                      placeholder="Search Service Providers"
                      autoComplete="off"
                      required
                    />
                    <button
                      onClick={() => handlesearc()}
                      type="button"
                      className="text-white absolute end-2.5 bottom-2.5 search_button_color hover:search_button_color_hover focus:ring-0  font-medium border_radius text-sm px-4 py-2"
                    >
                      <svg
                        className="w-4 h-4 text-white mr-2"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 20 20"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                        />
                      </svg>{" "}
                      Search
                    </button>
                    <div className="absolute -right-8 top-4">
                      <Tooltip
                        content="Search within company name, services, company description and project highlights."
                        className="tier_tooltip"
                      >
                        <svg
                          className="w-[24px] h-[24px] text-gray-600 dark:text-white"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fillRule="evenodd"
                            d="M2 12a10 10 0 1 1 20 0 10 10 0 0 1-20 0Zm9.4-5.5a1 1 0 1 0 0 2 1 1 0 1 0 0-2ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4c0-.6-.4-1-1-1h-2Z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {/* <svg
                          className="w-[24px] h-[24px] text-gray-600 dark:text-white"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M2 12a10 10 0 1 1 20 0 10 10 0 0 1-20 0Zm9-3a1.5 1.5 0 0 1 2.5 1.1 1.4 1.4 0 0 1-1.5 1.5 1 1 0 0 0-1 1V14a1 1 0 1 0 2 0v-.5a3.4 3.4 0 0 0 2.5-3.3 3.5 3.5 0 0 0-7-.3 1 1 0 0 0 2 .1c0-.4.2-.7.5-1Zm1 7a1 1 0 1 0 0 2 1 1 0 1 0 0-2Z"
                            clip-rule="evenodd"
                          />
                        </svg> */}
                        {" "}
                      </Tooltip>
                    </div>
                  </div>
                </div>

              </form>
            </div>
          </div>
        </div>
        {user && user.userRoles[0].roleCode === "service_provider" && (
          <div className="top_brands pb-20">
            <h1 className="font-semibold home_header_color heading-sub-font lg:pb-10 pb-0">
              Our Latest Buyers
            </h1>
            <div className="top_slider">
              <div className="h-18">
                {sponsoredPartners.length ?  
                
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
                  {sponsoredPartners.map((list:{fileUrl: string, fileName: string}) => (
                    <div className={`carousel-item width_of_item` }>
                        <img
                            src={list.fileUrl} 
                            alt=""
                            width={150}
                            height={100}
                            className="inline-block"
                            touch-action="none"
                          />
                    </div>
                    ))}
                </ReactSimplyCarousel>
                :
                <Carousel indicators={true} className="-mt-5">
                  {/* <div className="our_latest_partners">
                    {sponsoredPartners && sponsoredPartners.map((list:{fileUrl: string, fileName: string}) => (
                      <div className="col_flex">
                        <Image
                          src={list.fileUrl}
                          alt="review"
                          width={150}
                          height={100}
                          className="inline-block"
                        />
                      </div>
                    ))}
                  </div> */}
                  <div className="our_latest_partners">
                    <div className="col_flex text-start">
                      <Image
                        src="/bsp_1.png"
                        alt="review"
                        width={150}
                        height={100}
                        className="inline-block"
                      />
                    </div>
                    <div className="col_flex">
                      <Image
                        src="/bsp_2.png"
                        alt="review"
                        width={150}
                        height={100}
                        className="inline-block"
                      />
                    </div>
                    <div className="col_flex">
                      <Image
                        src="/bsp_3.png"
                        alt="review"
                        width={150}
                        height={100}
                        className="inline-block"
                      />
                    </div>
                    <div className="col_flex">
                      <Image
                        src="/bsp_4.png"
                        alt="review"
                        width={150}
                        height={100}
                        className="inline-block"
                      />
                    </div>
                    <div className="text-end col_flex">
                      <Image
                        src="/bsp_1.png"
                        alt="review"
                        width={150}
                        height={100}
                        className="inline-block"
                      />
                    </div>
                  </div>
                  <div className="our_latest_partners">
                    <div className="col_flex text-start">
                      <Image
                        src="/bsp_1.png"
                        alt="review"
                        width={150}
                        height={100}
                        className="inline-block"
                      />
                    </div>
                    <div className="col_flex">
                      <Image
                        src="/bsp_2.png"
                        alt="review"
                        width={150}
                        height={100}
                        className="inline-block"
                      />
                    </div>
                    <div className="col_flex">
                      <Image
                        src="/bsp_3.png"
                        alt="review"
                        width={150}
                        height={100}
                        className="inline-block"
                      />
                    </div>
                    <div className="col_flex">
                      <Image
                        src="/bsp_4.png"
                        alt="review"
                        width={150}
                        height={100}
                        className="inline-block"
                      />
                    </div>
                    <div className="text-end col_flex">
                      <Image
                        src="/bsp_1.png"
                        alt="review"
                        width={150}
                        height={100}
                        className="inline-block"
                      />
                    </div>
                  </div>
                </Carousel>
                }
                 
              </div>
            </div>
            <div className="lg:pt-12 pt-2">
              <hr className="serch_border_color" />
            </div>
          </div>
        )}
        <div className="text-left   relative py-6 -mt-6">
          <h1 className="font-semibold home_header_color heading-sub-font">
            Thank you to our Founding Partners
          </h1>

          {isVisible ? (
            <div
              className="absolute transform_rotate_show"
              onClick={handleToggle}
            >
              <button
                type="button"
                className="text-white search_button_color round_50 focus:outline-none focus:ring-0  font-medium text-sm  text-center"
              >
                <svg
                  className="w-5 h-5 text-white"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m9 5 7 7-7 7"
                  ></path>
                </svg>
              </button>
            </div>
          ) : (
            <div
              className="absolute transform_rotate_hide"
              onClick={handleToggle}
            >
              <button
                type="button"
                className="text-white search_button_color round_50 focus:outline-none focus:ring-0  font-medium text-sm  text-center"
              >
                <svg
                  className="w-5 h-5 text-white"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m9 5 7 7-7 7"
                  ></path>
                </svg>
              </button>
            </div>
          )}
        </div>
        {isVisible && (
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-6 xl:grid-cols-6 2xl:grid-cols-6  md:grid-cols-3 sm:grid-cols-2  founding_partner_animation">
            {(foundingsponserslist.length > 0 &&
              foundingsponserslist.map(
                (foundingsponsers: foundindSponserListType, index) => (
                  <div
                    key={`founding_${index}_key`}
                    className=" bg-white border border_radius card_shadow "
                  >
                    <Link
                      href={`/serviceproviders-details/${foundingsponsers.id}`}
                    >
                      <div className="founding_partner_thumb">
                        <Image
                          className="rounded-t-sm"
                          src={
                            (foundingsponsers?.bannerAsset &&
                              foundingsponsers?.bannerAsset?.url) ||
                            "/no-image-available.jpg"
                          }
                          alt="banner"
                          width={400}
                          height={200}
                        />
                      </div>
                      <div className="p-5 h-[130px]  flex items-center justify-center founding_partner_banner_logo">
                        <Image
                          src={
                            (foundingsponsers?.logoAsset &&
                              foundingsponsers?.logoAsset?.url) ||
                            "/circle-no-image-available.jpg"
                          }
                          alt="logo"
                          width={150}
                          height={100}
                        />
                      </div>
                    </Link>
                  </div>
                ),
              )) ||
              ""}
          </div>
        )}

        {user && user.userRoles[0].roleCode === "service_provider" && (
          <div className="latest_opportunities pt-20">
            <div className="text-left   relative py-6 pt-0">
              <h1 className="font-semibold home_header_color heading-sub-font">
                Latest Opportunities{" "}
                <small
                  className={`ml-10 cursor-pointer  ${!user?.isPaidUser && 'menu_disable'} `}
                  onClick={(e) => {
                    handleFreeRoute("/opportunities", e);
                  }}
                >
                  Browse more Opportunities
                </small>
              </h1>
            </div>
            {user?.isPaidUser && latestOpportunities.length > 0 ?
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4  md:grid-cols-2 sm:grid-cols-2 founding_partner_animation">
                {(latestOpportunities.length &&
                  latestOpportunities.map((latestOpp: opportunityTypes, index) => (
                    <div
                      key={`latestopp_${index}_key`}
                      className="cursor-pointer bg-white border border_radius card_shadow"
                      onClick={() => {
                        if (user?.isPaidUser) {
                          latestOpp.companyId == user?.companyId
                            ? route.push(`/my-opportunities/${latestOpp.id}`)
                            : route.push(`/opportunity-details/${latestOpp.id}`);
                        } else {
                          setOpenPopup(true);
                        }
                      }}
                    >
                      <div className="latest_opp_thumb">
                        {" "}
                        <Image
                          className="rounded-t-sm"
                          src={
                            (latestOpp.FileUploads.length > 0 &&
                              latestOpp.FileUploads[0] &&
                              latestOpp.FileUploads[0].fileUrl) ||
                            "/no-image-available.jpg"
                          }
                          alt=""
                          width={400}
                          height={200}
                        />
                      </div>
                      <div className="p-5">
                        <div className="flex items-center space-x-6">
                          <img
                            className="block  w-10 h-10 rounded-full sm:mx-0 sm:shrink-0"
                            src={
                              (latestOpp.company.logoAsset &&
                                latestOpp.company.logoAsset.url) ||
                                "/defaultlogo.png"
                            }
                            alt="images"
                          />
                          <div className="text-center space-y-2 sm:text-left">
                            <div className="space-y-0.5 text-center">
                              <p className="text-sm text-black font-semibold">
                                {latestOpp.name}
                              </p>
                              <p className="text_xs_13 text-gray-500 font-semibold uppercase">
                                {latestOpp.showCompanyName
                                  ? latestOpp.company.name
                                  : "Anonymous"}
                              </p>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm pt-3 font-medium">
                          {" "}
                          {latestOpp.description && latestOpp.description.slice(0, 70)}
                          {latestOpp.description && latestOpp.description.length > 70 && "..."}{" "}
                        </p>
                        {/* {latestOpp.description.length == 0 || latestOpp.description.length < 30 ? 
                        <><br/><br/></>
                        :
                        <p className="text-sm pt-3 font-medium">
                          {" "}
                          {latestOpp.description.slice(0, 70)}
                          {latestOpp.description.length > 70 && "..."}{" "}
                        </p>
                        
                      } */}
                        <p className="text-sm pt-3 font-medium">
                          {" "}
                          <b>Posted: </b>
                          {new Date(latestOpp.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "2-digit",
                            },
                          )}{" "}
                        </p>
                      </div>
                    </div>
                  ))) ||
                  ""}
              </div>
              :
              (user?.isPaidUser) ?
                <div>Discover the latest opportunities posted by buyers and service providers.</div> :
                <div>View posted opportunities, and express your interest in partnering on them.</div>
            }
          </div>
        )}
        <div className="recently_viewed_profiles pt-20">
          <div className="text-left   relative py-6 pt-0">
            <h1 className="font-semibold home_header_color heading-sub-font">
              Recently Viewed Profiles{" "}
              <small
                className="ml-10 cursor-pointer"
                onClick={() => {
                  route.push("/serviceproviders");
                }}
              >
                Browse more Service Providers
              </small>
            </h1>
          </div>
          {recentViewedProfiles.length > 0 ?
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5  md:grid-cols-3 sm:grid-cols-2 founding_partner_animation cursor-pointer">
              {(recentViewedProfiles.length &&
                recentViewedProfiles.map(
                  (recentlyViewed: recentlyViewedTypes, index) => (
                    <div
                      key={`recentopp_${index}_viewed_profiles`}
                      className=" bg-white border border_radius card_shadow"
                      onClick={() => {
                        route.push(
                          `/serviceproviders-details/${recentlyViewed.viewedCompany.id}`,
                        );
                      }}
                    >
                      <div className="viewed_profile_thumb">
                        <Image
                          className="rounded-t-sm"
                          src={
                            (recentlyViewed && recentlyViewed.viewedCompany.bannerAsset?.url) ||
                            "/no-image-available.jpg"
                          }
                          alt=""
                          width={400}
                          height={200}
                        />
                      </div>
                      <div className="p-5">
                        <div className="flex items-center space-x-6">
                          <img
                            className="block  w-10 h-10 rounded-full sm:mx-0 sm:shrink-0"
                            src={
                              (recentlyViewed && recentlyViewed.viewedCompany.logoAsset?.url) ||
                              "/circle-no-image-available.jpg"
                            }
                            alt="images"
                          />
                          <div className="text-center space-y-2 sm:text-left">
                            <div className="space-y-0.5">
                              <p className="text-sm text-black font-semibold">
                                {recentlyViewed.viewedCompany.name}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2 pt-5">
                          {recentlyViewed.viewedCompany.ServicesOpt &&
                            recentlyViewed.viewedCompany.ServicesOpt.map(
                              (services: ServicesOpt, index) =>
                                services?.service && (
                                  <button
                                    key={`services_${index}_buttons`}
                                    type="button"
                                    className={`default_text_color bg_${serviceColoring[services.service.groupId]} gray_btn`}
                                  >
                                    {services?.service?.serviceName}
                                  </button>
                                ),
                            )}
                        </div>
                      </div>
                    </div>
                  ),
                )) ||
                <>
                  {(recentJoinedProfiles.length &&
                    recentJoinedProfiles.map(
                      (recentlyJoined: recentlyJoinedTypes, index) => (
                        <div
                          key={`newest_companies_${index}_key`}
                          className=" bg-white border border_radius card_shadow"
                          onClick={() => {
                            route.push(
                              `/serviceproviders-details/${recentlyJoined.id}`,
                            );
                          }}
                        >
                          <div className="viewed_profile_thumb">
                            <Image
                              className="rounded-t-sm"
                              src={
                                (recentlyJoined && recentlyJoined.bannerAsset?.url) ||
                                "/no-image-available.jpg"
                              }
                              alt=""
                              width={400}
                              height={200}
                            />
                          </div>
                          <div className="p-5">
                            <div className="flex items-center space-x-6">
                              <img
                                className="block  w-10 h-10 rounded-full sm:mx-0 sm:shrink-0"
                                src={
                                  (recentlyJoined && recentlyJoined.logoAsset?.url) ||
                                  "/circle-no-image-available.jpg"
                                }
                                alt="images"
                              />
                              <div className="text-center space-y-2 sm:text-left">
                                <div className="space-y-0.5">
                                  <p className="text-sm text-black font-semibold">
                                    {recentlyJoined.name}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2 pt-5">
                              {recentlyJoined.ServicesOpt &&
                                recentlyJoined.ServicesOpt.map(
                                  (services: ServicesOpt, index) =>
                                    services?.service && (
                                      <button
                                        key={`newest_companies_${index}_services_key`}
                                        type="button"

                                        className={`default_text_color bg_${serviceColoring[services.service.groupId]} gray_btn`}

                                      >
                                        {services?.service?.serviceName}
                                      </button>
                                    ),
                                )}
                            </div>
                          </div>
                        </div>
                      ),
                    ))}
                </> || ""
              }
            </div>
            :
            <div>View service provider profiles that you recently checked out.</div>
          }
          {/* <div className="grid grid-cols-1 gap-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4  md:grid-cols-2 sm:grid-cols-2 founding_partner_animation cursor-pointer">
            {(recentJoinedProfiles.length &&
              recentJoinedProfiles.map(
                (recentlyJoined: recentlyJoinedTypes, index) => (
                  <div
                    className=" bg-white border border_radius card_shadow"
                    onClick={() => {
                      route.push(
                        `/serviceproviders-details/${recentlyJoined.id}`,
                      );
                    }}
                  >
                    <div className="viewed_profile_thumb">
                      <Image
                        className="rounded-t-sm"
                        src={
                          (recentlyJoined && recentlyJoined.bannerAsset?.url) ||
                          "/banner_thumb_1.png"
                        }
                        alt=""
                        width={400}
                        height={200}
                      />
                    </div>
                    <div className="p-5">
                      <div className="flex items-center space-x-6">
                        <img
                          className="block  w-10 h-10 rounded-full sm:mx-0 sm:shrink-0"
                          src={
                            (recentlyJoined && recentlyJoined.logoAsset?.url) ||
                            "/Ellipse 3.png"
                          }
                          alt="images"
                        />
                        <div className="text-center space-y-2 sm:text-left">
                          <div className="space-y-0.5">
                            <p className="text-sm text-black font-semibold">
                              {recentlyJoined.name}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 pt-5">
                        {recentlyJoined.ServicesOpt &&
                          recentlyJoined.ServicesOpt.map(
                            (services: ServicesOpt, index) =>
                              services?.service && (
                                <button
                                  type="button"
                                  className="default_text_color bg_gray gray_btn"
                                >
                                  {services?.service?.serviceName}
                                </button>
                              ),
                          )}
                      </div>
                    </div>
                  </div>
                ),
              )) ||
              "No Data Found"}
          </div> */}
        </div>
        <div className="my_lists pt-20">
          <div className="text-left   relative py-6 pt-0">
            <h1 className="font-semibold home_header_color heading-sub-font">
              My Lists{" "}
              <small
                className={`ml-10 cursor-pointer  ${!user?.isPaidUser && 'menu_disable'} `}
                onClick={(e) => {
                  handleFreeRoute("/my-lists", e);
                }}
              >
                Go to My Lists
              </small>
            </h1>
          </div>
          {myList.length > 0 ?
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {(myList.length &&
                myList.map(
                  (
                    list: {
                      id: number;
                      name: string;
                      description: string;
                      updatedAt: string;
                    },
                    index,
                  ) => (
                    <div
                      key={`mylist_${index}_key`}
                      className="cursor-pointer flex items-start gap-4 border border_radius p-2.5 bg-gray-50 relative card_shadow"
                      onClick={() => {
                        if (user?.isPaidUser) {
                          route.push(`/my-lists/${list.id}`);
                        } else {
                          setOpenPopup(true);
                        }

                      }}
                    >
                      <div key={`mylist_${index}`}>
                        <h3 className="font-semibold home_header_color ">
                          <span> {list.name}</span>
                        </h3>
                        <p className="text-sm my-2.5 font-medium">
                          {list.description}
                        </p>
                        <p className="text-sm flex justify-between items-center font-medium">
                          <span>
                            <abbr className="font-medium">
                              <b>Last Edited: </b>
                            </abbr>{" "}
                            {new Date(list.updatedAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "2-digit",
                              },
                            )}
                          </span>
                        </p>
                      </div>
                    </div>
                  ),
                )) ||
                ""}
            </div>
            :
            <div>Create and manage lists of service providers any way you choose.</div>
          }
        </div>
        <div
          className={`my_recently_opportunities pt-20 ${user && user.userRoles[0].roleCode != "service_provider" && "pb-16"
            }`}
        >
          <div className="text-left   relative py-6 pt-0">
            <h1 className="font-semibold home_header_color heading-sub-font">
              My Recent Opportunities{" "}
              <small
                className={`ml-10 cursor-pointer  ${!user?.isPaidUser && 'menu_disable'} `}
                onClick={(e) => {
                  handleFreeRoute("/my-opportunities", e);
                }}
              >
                Go to My Opportunities
              </small>
            </h1>
          </div>
          {myRecentOpportunities.length > 0 ?
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4  md:grid-cols-2 sm:grid-cols-2 founding_partner_animation">
              {(myRecentOpportunities.length &&
                myRecentOpportunities.map(
                  (myOpportunity: opportunityTypes, index) => (
                    <div
                      key={`myopportunity_${index}_key`}
                      className="cursor-pointer bg-white border border_radius card_shadow relative"
                      onClick={() => {
                        if (user?.isPaidUser) {
                          myOpportunity.companyId == user?.companyId
                            ? route.push(`/my-opportunities/${myOpportunity.id}`)
                            : route.push(
                              `/opportunity-details/${myOpportunity.id}`,
                            );
                        } else {
                          setOpenPopup(true);
                        }
                      }}

                    >
                      <div className="latest_opp_thumb">
                        {" "}
                        <Image
                          className="rounded-t-sm"
                          src={
                            (myOpportunity.FileUploads.length > 0 &&
                              myOpportunity.FileUploads[0] &&
                              myOpportunity.FileUploads[0].fileUrl) ||
                            "/no-image-available.jpg"
                          }
                          alt=""
                          width={400}
                          height={200}
                        />
                      </div>
                      <div className="p-5">
                        <div className="flex items-center space-x-6">
                          <img
                            className="block  w-10 h-10 rounded-full sm:mx-0 sm:shrink-0"
                            src={
                              (myOpportunity.company.logoAsset &&
                                myOpportunity.company.logoAsset.url) ||
                              `/circle-no-image-available.jpg`
                            }
                            alt=""
                          />
                          <div className="text-center space-y-2 sm:text-left">
                            <div className="space-y-0.5 text-center">
                              <p className="text-sm text-black font-semibold">
                                {myOpportunity.name}
                              </p>
                              <p className="text_xs_13 text-gray-500 font-semibold uppercase">
                                {myOpportunity.showCompanyName
                                  ? myOpportunity.company.name
                                  : "Anonymous"}
                              </p>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm pt-3 font-medium">
                          {" "}
                          {myOpportunity.description && myOpportunity.description.slice(0, 70)}
                          {myOpportunity.description && myOpportunity.description.length > 70 && "..."}{" "}
                        </p>
                        <p className="text-sm pt-3 font-medium">
                          {" "}
                          <b>Posted: </b>
                          {new Date(myOpportunity.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "2-digit",
                            },
                          )}{" "}
                        </p>
                      </div>
                      {myOpportunity.serviceProvidersIntrests &&
                        myOpportunity.serviceProvidersIntrests.length > 0 && (
                          <div className="absolute right-4 top-4">
                            <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-bold text-dark rounded-full notification_card">
                              {myOpportunity.serviceProvidersIntrests.length}
                            </span>
                          </div>
                        )}
                    </div>
                  ),
                )) ||
                ""}
            </div>
            :
            (user?.userRoles[0]?.roleCode === 'buyer') ? 
            <div>Create and view your opportunities for Service Providers to express interest in.</div>:
            <div>View posted opportunities, and express your interest in partnering on them.</div>
             
          }

        </div>
        {user && user.userRoles[0].roleCode === "service_provider" && (
          <div className="submitted_interest pt-20 pb-16">
            <div className="text-left   relative py-6 pt-0">
              <h1 className="font-semibold home_header_color heading-sub-font">
                Submitted Interest
              </h1>
            </div>
            {submittedIntrested && submittedIntrested.length > 0 ?
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4  md:grid-cols-2 sm:grid-cols-2 founding_partner_animation">
                {(submittedIntrested.length > 0 &&
                  submittedIntrested.map((intrested: {
                        compayId: number;

                        opportunity: {
                          company: { 
                            name: string,
                            logoAsset: {
                              url: string
                            }
                          };
                          name: string;
                          showCompanyName: string;
                          id: string;
                          FileUploads: [
                            {
                              fileUrl: string;
                            },
                          ];
                          description: string;
                          createdAt: string;
                        };
                      },
                      index,
                    ) => (
                      <div
                        key={`submitted_intrested_${index}_key`}
                        className="cursor-pointer bg-white border border_radius card_shadow"
                        onClick={() => {
                          if (user?.isPaidUser) {
                            intrested.compayId == user?.companyId
                              ? route.push(
                                `/my-opportunities/${intrested.opportunity.id}`,
                              )
                              : route.push(
                                `/opportunity-details/${intrested.opportunity.id}`,
                              );
                          } else {
                            setOpenPopup(true);
                          }
                        }}
                      >
                        <div className="latest_opp_thumb">
                          <Image
                            className="rounded-t-sm"
                            src={
                              (intrested.opportunity && intrested.opportunity.FileUploads.length > 0 &&
                                intrested.opportunity.FileUploads[0] &&
                                intrested.opportunity.FileUploads[0].fileUrl) ||
                              `/no-image-available.jpg`
                            }
                            alt=""
                            width={400}
                            height={200}
                          />
                        </div>
                        <div className="p-5">
                          <div className="flex items-center space-x-6">
                            <img
                              className="block  w-10 h-10 rounded-full sm:mx-0 sm:shrink-0"
                              src={ (intrested.opportunity.company.logoAsset && intrested.opportunity.company.logoAsset.url) || "/defaultlogo.png" }
                              alt="images"
                            />
                            <div className="text-center space-y-2 sm:text-left">
                              <div className="space-y-0.5">
                                <p className="text-sm text-black font-semibold">
                                  {intrested.opportunity.name}
                                </p>
                                <p className="text_xs_13 text-gray-500 font-semibold uppercase">
                                  {intrested.opportunity.showCompanyName
                                    ? intrested.opportunity.company.name
                                    : "Anonymous"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm pt-3 font-medium">
                            {" "}
                            {intrested.opportunity.description && JSON.parse(intrested.opportunity.description).slice(0, 70)}
                            {intrested.opportunity.description && intrested.opportunity.description.length > 70 &&
                              "..."}{" "}
                          </p>
                          <p className="text-sm pt-3 font-medium">
                            {" "}
                            <b>Posted: </b>
                            {new Date(
                              intrested.opportunity.createdAt,
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "2-digit",
                            })}{" "}
                          </p>
                        </div>
                      </div>
                    ),
                  )) ||
                  ""}
              </div>
              :
              <div>Opportunities you have expressed interest in. None available yet.</div>
            }
          </div>
        )}
      </div>
      <FreeTierAlerts isOpen={openPopup} setOpenPopup={setOpenPopup} bodymessage={popupMessage} />
    </div>
  );
};

export default Home;

type foundindSponserListType = {
  logoAsset: {
    url: string;
  };
  bannerAsset: {
    url: string;
  };
  id: number;
};
