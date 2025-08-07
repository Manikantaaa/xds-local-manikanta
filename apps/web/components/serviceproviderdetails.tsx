"use client";
import Breadcrumbs, { CrumbItem } from "@/components/breadcrumb";
import { PATH } from "@/constants/path";
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Button, Modal, Label, Textarea, Tooltip, Select } from "flowbite-react";
import ServiceproviderContactUs from "@/components/serviceproviderscontactus";
import ServiceproviderAboutUs from "@/components/serviceprovidersaboutus";
import ServiceproviderCertificateAndDiligence from "@/components/serviceproviderscertificate";
import ServiceproviderOurWork from "@/components/serviceprovidersourwork";
import profileimage from "@/public/no-image-available.jpg";
import { redirect, useSearchParams, useParams, useRouter } from "next/navigation";
import { authFetcher, authPutWithData, fetcher } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import AddtoMyList from "@/components/addtomylistsidebar";
import { useUserContext } from "@/context/store";
import useCommonPostData from "@/hooks/commonPostData";
import { serviceColoring } from "@/constants/serviceColors";
import Spinner from "@/components/spinner";
import FreeTierAlerts from "@/components/ui/freeTierAlerts";
import { BodyMessageType } from "@/constants/popupBody";
import MySparkMain from "@/components/my-spark-main";
import { ApiResponse, CompanyAddressType, cdDataType, companyContactTypes, companyPortfolioMainTypes, portfolioTypes, CompanyPlatformExperience, CompanyGameEngines } from "@/types/serviceProviderDetails.type";
import { formatDate } from "@/services/common-methods";
import { sanitizeData } from "@/services/sanitizedata";
import EventsDisplay from "@/components/EventsDisplay";
import { faqQuestions } from "@/types/event.types";
import { useRandomDataContext } from "@/context/random-data-store";
import usePagePermissions from "@/hooks/usePagePermissions";
import AnnouncementDisplay from "./AnnouncementsDisplay";
import { Announcement } from "./post-announcement-component";


const ServiceProviderDetails = () => {
  const { user } = useUserContext();
  const { companyCounts, setCompanyCounts } = useRandomDataContext();
  const paramsdata = useParams();
  const searchParams = useSearchParams();
  const [compantId, setCompantId] = useState<number | null>(null)
  const ParamData = paramsdata.id;
  // var compantId = 0;
  const route = useRouter();

  useEffect(() => {
    if (typeof ParamData === "string" && isNaN(Number(ParamData))) {

      async function getcompanyId() {
        const getcompanyIds = await fetcher(
          getEndpointUrl(ENDPOINTS.getcompanyIdbySlug(typeof ParamData === "string" ? ParamData : "")),
        )
        if (!getcompanyIds) {
          route.replace("/not-found")
        }
        setCompantId(getcompanyIds.id);
      }
      getcompanyId();
    } else {
      async function getcompanyName() {
        const getcompanyIds = await fetcher(
          getEndpointUrl(ENDPOINTS.getcompanySlugbyId(Number(ParamData)))
        )
        if (!getcompanyIds) {
          route.replace("/not-found")
          return
        }
        route.replace(`/serviceproviders-details/${getcompanyIds.slug}`);
      }
      getcompanyName();
    }
  }, []);

  if (!user || (typeof ParamData != "string" && !Number.isNaN(ParamData))) {
    document.title = "XDS Spark - Profile";
    localStorage.setItem("viewCompanyProfile", ParamData.toString());
    redirect(PATH.LOGIN.path);
  }

  const [popupMessage, setPopupMessage] = useState<BodyMessageType>('DEFAULT');
  const [canRender, setCanRender] = useState(false);
  const [breadcrumbItems, setBreadcrumbItems] = useState<CrumbItem[]>([]);
  const [openAddtoWarningModal, setopenAddtoWarningModal] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [thankModal, setThankModal] = useState(false);
  const [data, setData] = useState<ApiResponse>();
  const [CertificationAndDiligence, setCertificationAndDiligence] =
    useState<cdDataType>();
  const [dueDiligencePlatforms, setDueDiligencePlatforms] =
    useState<CompanyPlatformExperience[]>([]);
  const [getGameEngines, setGetGameEngines] = useState<CompanyGameEngines[]>([]);
  const [portfolioProjects, setportfolioProjects] = useState<
    companyPortfolioMainTypes[]
  >([]);
  const [CompanyContacts, setCompanyContacts] = useState<companyContactTypes[]>(
    [],
  );
  const [companyAddress, setCompanyAddress] = useState<CompanyAddressType[]>(
    [],
  );
  const [portfolio, setPortfolio] = useState<portfolioTypes[]>([]);
  const LoggedCompanyId = user.companyId;
  const [isPaidUser, setisPaidUser] = useState<boolean>(false);
  const [reportDescription, setReportDescription] = useState("");
  const [isFlaggedCompany, setIsFlaggedCompany] = useState(false);
  const [partnerStatus, setPartnerStatus] = useState<string>("Select");
  const [performancerating, setPerformancerating] = useState<number>(0);
  const [isUpdated, setIsUpdated] = useState<boolean>(false);
  const [lastUpdateddate, setLastUpdatedDate] = useState<string>('');
  const [rating, setrating] = useState<number>(0);
  const [eventList, setEventList] = useState<faqQuestions[]>([]);
  const [isActiveEventsAvailable, setIsActiveEventsAvailable] = useState<boolean>(false);
  const [isFollowed, setIsFollowed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [recentAnnouncement, setRecentAnnouncement] = useState<Announcement | null>(null);
  const [awareOrAnnouncement, setAawareOrAnnouncement] = useState(false);
  const [portfolioProjectName, setPortfolioProjectName] = useState<string>("");

  const partnerStatus_access = usePagePermissions(15);
  useEffect(() => {
    async function getserviceprovidersDetails() {
      const response = await fetcher(
        getEndpointUrl(ENDPOINTS.getserviceprovidersdetails(Number(compantId))),
      );
      if (response.success && response.list) {
        if (response.list.user?.userRoles[0].roleCode == "buyer") {
          route.push(PATH.HOME.path);
        }
        setData(response.list);
        // start
        if (user?.isPaidUser) {
          if (response.list && response.list.user?.isPaidUser) {
            setStatus("1");
          } else {
            setStatus("3");
          }
          setisPaidUser(true);
        } else {
          setisPaidUser(false);
          if (user?.userRoles[0].roleCode == "buyer") {
            setStatus("1");
            setisPaidUser(true);
          } else {
            if (user?.companyId == response.list?.id) {
              //  free user own profile view
              setStatus("3");
            } else {
              // free user other profile views
              // setStatus("6");
            }
          }

        }
        const tab = searchParams.get('tab');
        const projectId = searchParams.get('projectId');
        setPortfolioProjectName(projectId ? projectId : "");
        if (tab == "7") {
          setStatus("7");
        } else if (tab == "1") {
          setStatus("1");
        }
        //end

        if (response.list.ServiceProviderAnnouncements && response.list.ServiceProviderAnnouncements.length > 0) {
          const orderSortedAnnouncements = response.list.ServiceProviderAnnouncements;
          // .sort((a: Announcement, b: Announcement) => a.orderValue - b.orderValue);
          setRecentAnnouncement(orderSortedAnnouncements[0]);
          setAnnouncements(orderSortedAnnouncements);
        }

        if (response.evenstAvaialble) {
          setIsActiveEventsAvailable(Number(response.evenstAvaialble) > 0);
        }
        if (response.list.CertificationAndDiligence) {
          setCertificationAndDiligence(response.list.CertificationAndDiligence);
        }
        if (response.list.CompanyPlatformExperience) {
          setDueDiligencePlatforms(response.list.CompanyPlatformExperience);
        }
        if (response.list.CompanyGameEngines) {
          setGetGameEngines(response.list.CompanyGameEngines);
        }
        if (response.list.portfolioProjects) {
          const formattedData = response.list.portfolioProjects.map((item: companyPortfolioMainTypes) => {
            const fileUploads = item.FileUploads.map((file: any) => {
              return {
                ...file,
                isLoaded: false // Add the isLoaded property here
              }
            });
            return {
              ...item,
              FileUploads: fileUploads,
            }
          });
          setportfolioProjects(formattedData);
        }
        if (response.list.CompanyContacts) {
          setCompanyContacts(response.list.CompanyContacts);
        }
        if (response.list.portfolioAlbum && response.list.portfolioAlbum[0]) {
          const filteredPortfolio = response.list?.portfolioAlbum?.map((item: portfolioTypes) => {
            return {
              ...item,
              isLoaded: false // Add the isLoaded property here
            };
          });
          setPortfolio(filteredPortfolio);
        }
        if (response.list.CompanyAddress) {
          setCompanyAddress(response.list.CompanyAddress);
        }
        if (response.flaggedDetails && response.flaggedDetails.companyId && response.flaggedDetails.companyId == user?.companyId) {
          setIsFlaggedCompany(true);
        }
        setCanRender(true);
        setBreadcrumbItems([
          {
            label: PATH.HOME.name,
            path: PATH.HOME.path,
          },
          {
            label: PATH.SERVICEPROVIDER_DETAILS.name,
            path: PATH.SERVICEPROVIDER_DETAILS.path,
          },
          {
            label: response.list.name,
            path: response.list.name,
          },
        ]);
        if (response.followDetails && response.followDetails.id) {
          if (response.followDetails.isActive) {
            setIsFollowed(true);
          } else {
            setIsFollowed(false);
          }
        }
        const res = await fetcher(
          getEndpointUrl(ENDPOINTS.updatevisitingcount(response.list.id, LoggedCompanyId)),
        );
      } else {
        route.push(PATH.HOME.path);
        console.log(`Api responded with statuscode ${response.statusCode}`);
      }
    }
    const allEvents = async () => {
      setEventList([]);
      const getallEvents = await authFetcher(
        getEndpointUrl(ENDPOINTS.getallActiveEvents(Number(compantId))),
      );

      if (getallEvents && getallEvents.success == true) {
        if (getallEvents.data) {
          setEventList(getallEvents.data);
          if (!isPaidUser && getallEvents.data.length <= 0) {
            setStatus("0");
          } else {
            setStatus("6");
          }
        }
      }
    };
    if (compantId) {
      allEvents();
      getserviceprovidersDetails();
      // getProjectPerformanceReviewDetails();
      getOverAllRatesdata();
    }
  }, [compantId]);

  // async function getProjectPerformanceReviewDetails() {
  //   if (user?.companyId != compantId) {
  //     const details = await authFetcher(`${getEndpointUrl(ENDPOINTS.getAllProjectPerformanceReviews(Number(compantId)))}`).catch((error) => {
  //       console.log(error);
  //     });
  //     if (details) {
  //       if (details.performanceReviews) {
  //         // console.log(details.performanceReviews);
  //         const reviewDetails = details.performanceReviews;
  //         const reviewslenth = reviewDetails.length;
  //         let count = 0;
  //         let overAllRatinglenth = 0;
  //         if (reviewslenth > 0) {
  //           reviewDetails.map((item: { overallRating: number }) => {
  //             if (item.overallRating > 0) {
  //               count = count + item.overallRating;
  //               overAllRatinglenth++;
  //             }

  //           })
  //           const ratingValue = count / overAllRatinglenth;
  //           if (ratingValue > 0 && ratingValue < 1) {
  //             setrating(1);
  //           } else {
  //             setrating(Math.round(ratingValue));
  //           }

  //         }
  //       }
  //     }
  //   }
  // }

  const getOverAllRatesdata = async () => {
    if (user?.companyId != compantId) {
      await authFetcher(`${getEndpointUrl(ENDPOINTS.getOverallRatings(Number(compantId)))}`)
        .then((result) => {
          if (result.data && result.success == true) {
            setPartnerStatus(result.data.prefferedPartner);
            setPerformancerating(result.data.performanceRating);
            setLastUpdatedDate(formatDate(result.data.updatedAt));
            setrating(result.data.avgPerformanceRating);
            // setSecurityStatus(result.data.securityStatus);
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }
  const [status, setStatus] = useState("1");

  // useEffect(() => {
  //   console.log(data);
  //   if (data !== undefined && data.user !== undefined) {
  //     if(user?.isPaidUser){
  //       if(user?.companyId == data?.id){
  //         setStatus("1");
  //       }else{
  //         setStatus("3");
  //       }

  //       setisPaidUser(true);
  //     }else{
  //       setisPaidUser(false);
  //       if(user?.companyId == data?.id){
  //         setStatus("");
  //       }else{
  //         setStatus("3");
  //       }        
  //     }
  //     if (!data?.user?.isPaidUser) {

  //       // if ((user?.companyId == data?.id)) {
  //       //   setStatus("3");
  //       // } else {
  //       //   setStatus("");
  //       // }
  //     }
  //   }
  // }, [data,user]);
  function onClickStatus1(val: string) {
    setStatus(val);
  }

  //
  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([]);
  useEffect(() => {
    setSelectedCompanies([Number(compantId)]);
  }, [compantId]);
  const [isVisible, setIsVisible] = useState<boolean | undefined>(false);
  const [updatedAddto, setUpdatedAddto] = useState<boolean>();

  const onVisibilityChange = (isVisible: boolean) => setUpdatedAddto(isVisible);

  useEffect(() => {
    setIsVisible(updatedAddto);
  }, [updatedAddto]);
  const addListsidebar = (isEnabled: boolean) => {
    if (selectedCompanies.length > 0) {
      setIsVisible(!isEnabled);
      onVisibilityChange(!isEnabled);
    } else {
      setOpenModal(true);
    }
  };

  const { error, success, submitForm: reportCompanySubmit } = useCommonPostData<{
    loggedCompanyId: number,
    reportedCompanyId: number,
    description: string,
  }>({
    url: getEndpointUrl(ENDPOINTS.reportAUser),
  });

  function setCompanyAsReported() {
    if (reportDescription != "") {
      const postData = {
        description: reportDescription,
        loggedCompanyId: LoggedCompanyId,
        reportedCompanyId: Number(compantId)
      }
      reportCompanySubmit(postData).then((result) => {
        const data = result.data;
        if (data.success) {
          setOpenModal(false);
          setThankModal(true);

        } else {
          setOpenModal(false);
        }
      }).catch((err) => {
        console.log(err);
      })
    }

  }

  function openCommonFreeAlertPopup(tabName: string) {
    if (tabName === 'ourwork') {
      if (user?.id === data?.id) {
        setPopupMessage('OWN_SERVICE_PROVIDER_OURWORK');
      } else {
        setPopupMessage('SERVICE_PROVIDER_OURWORK');
      }
    } else if (tabName == 'certificationanddiligence') {
      if (user?.id === data?.id) {
        setPopupMessage('OWN_SERVICE_PROVIDER_CERT_DILIGENCE');
      } else {
        setPopupMessage('SERVICE_PROVIDER_CERT_DILIGENCE');
      }
    } else if (tabName == 'contact') {
      if (user?.id === data?.id) {
        setPopupMessage('OWN_SERVICE_PROVIDER_CONTACT');
      } else {
        setPopupMessage('SERVICE_PROVIDER_CONTACT');
      }
    } else if (tabName == 'website') {
      if (user?.id === data?.id) {
        setPopupMessage('OWN_SERVICE_PROVIDER_WEBSITE');
      } else {
        setPopupMessage('SERVICE_PROVIDER_WEBSITE');
      }
    } else if (tabName == 'addto') {
      setPopupMessage('SERVICE_PROVIDER_ADDTO');
    } else if (tabName == 'about') {
      setPopupMessage('SERVICE_PROVIDER_ABOUT');
    } else if (tabName == 'myspark') {
      setPopupMessage('SERVICE_PROVIDER_MY_SPARK');
    } else if (tabName == 'EVENTS') {
      setPopupMessage("EVENTS");
    } else if (tabName == 'announcements') {
      setPopupMessage('ANNOUNCEMENTS')
    } else {
      setPopupMessage('DEFAULT')
    }
    setopenAddtoWarningModal(true);
  }

  useEffect(() => {
    if (isUpdated == true) {
      const updateData = async () => {
        let sendingData = {
          buyerId: (user && user.companyId) ? user.companyId : 0,
          prefferedPartner: partnerStatus,
          companyId: compantId,
        }
        sendingData = sanitizeData(sendingData);
        await authPutWithData(`${getEndpointUrl(ENDPOINTS.setAlloverratings)}`, sendingData)
          .then((result) => {
            getOverAllRatesdata();
          })
          .catch((err) => {
            console.log(err);
          });
        setIsUpdated(false);
      }
      updateData();
    }
  }, [isUpdated]);

  const onClickCompare = () => {
    const comparingCompaniesString = localStorage.getItem("comparingCompanies");
    let comparingCompanies = comparingCompaniesString ? JSON.parse(comparingCompaniesString) : [];
    if (comparingCompanies && !comparingCompanies.includes(compantId)) {
      comparingCompanies.push(compantId);
      setCompanyCounts((prevVal) => prevVal + 1);
      localStorage.setItem("comparingCompanies", JSON.stringify(comparingCompanies));
    }
    route.push("/compare")
  }

  const onClickFollow = () => {
    if (compantId) {
      setIsLoading(true)
      let isFollow = true;
      if (isFollowed) {
        isFollow = false;
      }
      authFetcher(`${getEndpointUrl(ENDPOINTS.followUnfollowCompany(compantId, isFollow))}`).then((result) => {
        if (result && result.success) {
          setIsFollowed(result.data);
        }
        setIsLoading(false);
      }).catch((err) => {
        console.log(err);
        setIsLoading(false);
      });
    }
  }

  return (
    <>
      {
        canRender ?
        <>
      
          <div className="w-full lg:container px-5 pos_r">
            <div className="pb-6 pt-6  flex justify-between">
              <div className="breadcrumbs_s sevice_provider_breadcrum">
                <Breadcrumbs items={breadcrumbItems} />
              </div>
              {
                (LoggedCompanyId != compantId) ?
                  <div
                    onClick={() => { isFlaggedCompany ? "" : setOpenModal(true) }}
                    className="text-sm text-blue-300"
                  >
                    <Link href="#">

                      {isFlaggedCompany ?
                        <svg id="Capa_1" className=" mr-1 mt-1 text-red-300" fill="#df1c1c" enable-background="new 0 0 512 512" height="16" viewBox="0 0 512 512" width="16" xmlns="http://www.w3.org/2000/svg"><path d="m444.32 32.52c-1.992-1.333-49.336-32.52-98.32-32.52-39.844 0-69.038 16.216-97.28 31.89-26.045 14.458-50.655 28.11-82.72 28.11-30.432 0-61.725-15.857-75-23.465v-36.535h-30v512h30v-201.638c18.781 9.097 46.472 19.638 75 19.638 39.844 0 69.038-16.216 97.28-31.89 26.045-14.458 50.655-28.11 82.72-28.11 39.771 0 81.284 27.217 81.694 27.495l23.306 15.454v-275.976z" /></svg>
                        :
                        <svg id="fi_2814368" className=" mr-1 mt-1" fill="#005ec4" enable-background="new 0 0 512 512" height="16" viewBox="0 0 512 512" width="16" xmlns="http://www.w3.org/2000/svg"><path id="_x3C_Group_x3E__7_" d="m346 0c-39.836 0-69.038 16.209-97.28 31.885-26.048 14.458-50.652 28.115-82.72 28.115-30.314 0-61.633-15.81-75-23.451v-36.549h-30v512h30v-201.544c18.779 9.068 46.615 19.544 75 19.544 39.835 0 69.039-16.209 97.28-31.885 26.048-14.458 50.653-28.115 82.72-28.115 39.771 0 81.28 27.216 81.68 27.481l23.32 15.547v-276.056c-30.845-20.356-68.492-36.972-105-36.972zm75 259.543c-18.779-9.068-46.615-19.543-75-19.543-39.836 0-69.038 16.209-97.28 31.885-26.048 14.458-50.652 28.115-82.72 28.115-30.319 0-61.644-15.815-75-23.45v-206.094c18.779 9.068 46.615 19.544 75 19.544 39.835 0 69.039-16.209 97.28-31.885 26.048-14.458 50.653-28.115 82.72-28.115 30.316 0 61.643 15.814 75 23.45z"></path></svg>
                      }
                      {isFlaggedCompany ? <span style={{ color: "red" }}>Reported</span> : <span>Report</span>}

                    </Link>
                  </div>
                  : ""
              }

            </div>
            {isPaidUser ? (
              <div
                className={`grid grid-cols-1 gap_20 ${data?.bannerAsset?.url ? "lg:grid-cols-2" : "lg:grid-cols-2"
                  }`}
              >
                <div className="first_grid relative">
                  <div className="flex items-start gap_20">
                    <div className="user_profile_company_thumb">
                      <Image
                        src={data?.logoAsset?.url || profileimage}
                        alt=""
                        className="aspect-square w-36 rounded-lg object-cover"
                        width={150}
                        height={150}
                      />
                    </div>
                    <div>
                      <h3 className="profile_title_font default_text_color">
                        {data?.name}
                      </h3>
                      {
                        (user.companyId == data?.id) ?
                          <div className="py-2.5 pl-1">
                            <button
                              onClick={() => {
                                route.push("/company-profile/general-info");
                              }}
                              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors  button_blue text-primary-foreground hover:bg-primary/90 h-10 p-5"
                              type="button"
                            >
                              Edit Profile
                            </button>
                          </div>
                          :
                          ""
                      }

                      {/* <p
                    className={`${
                      data?.bannerAsset?.url ? "hidden" : ""
                    } py-2.5 default_text_color font-medium text-xl`}
                  >
                    {data?.shortDescription}
                  </p> */}
                    </div>
                  </div>
                  <p
                    className={`${data?.bannerAsset?.url ? "" : ""
                      } pt-2.5 default_text_color font-medium text-xl`}
                  >
                    {data?.shortDescription}
                  </p>

                  {/* Green color :#0e9f6e */}
                  {/* orange color :#f5700c */}
                  {/* gray color :#9ca3af */}
                  {/* red color :#d22824 */}
                  {/* not applicable color :#4074ff */}
                  <ul className={`myspark_text pt-6 space-y-4 ${status == "5" ? '' : 'hidden'} `} >
                    {((!partnerStatus_access.isCompanyUser) || (partnerStatus_access.isCompanyUser && partnerStatus_access.canRead)) &&
                      <li>
                        <div className="flex items-center justify-start">
                          <div className="flex-1 lg:max-w-[300px] w-[200px]">
                            <div className=" text-gray-900 font-bold text-xl inline-flex"> Partner Status
                              <Tooltip className="tier_tooltip_partner_status" content={<div className="space-y-2"><p>This is the status this Service Provider currently holds with your company.</p>
                                <p><strong>Preferred -</strong> Considered a top-tier partner with a successful track record.</p>
                                <p><strong>Partner -</strong> Approved for work with your company.</p>
                                <p><strong>Pending Evaluation -</strong> Assessment may not have begun, or is in progress.</p></div>} trigger="hover">
                                <svg className="w-[20px] h-[20px] text-gray-700 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                  <path fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm9.408-5.5a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2h-.01ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4a1 1 0 0 0-1-1h-2Z" clip-rule="evenodd" />
                                </svg>
                              </Tooltip></div>
                          </div>
                          <div className="inline-flex text_box_readuce items-center">

                            <Select disabled={(partnerStatus_access.isCompanyUser && !partnerStatus_access.canWrite)} id="partnerStatus" className="w-[115px] " value={partnerStatus} onChange={(e) => { setPartnerStatus(e.target.value); setIsUpdated(true); }} sizing="sm">
                              <option value="Select">Select</option>
                              <option value="yes">Preferred</option>
                              <option value="no">Partner</option>
                              <option value="inprogress">Pending Evaluation</option>
                            </Select>

                            <div className="pl-2">
                              {partnerStatus && partnerStatus == "yes" &&
                                <Tooltip content="Considered a top-tier partner with a successful track record." trigger="hover">
                                  <svg className="w-[28px] h-[28px] text-green-500 m-[1.5px]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                    <path fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm13.707-1.293a1 1 0 0 0-1.414-1.414L11 12.586l-1.793-1.793a1 1 0 0 0-1.414 1.414l2.5 2.5a1 1 0 0 0 1.414 0l4-4Z" clip-rule="evenodd" />
                                  </svg>
                                </Tooltip>
                              }

                              {partnerStatus && partnerStatus == "no" &&
                                <Tooltip content="Approved for work with your company." trigger="hover"><svg className="w-[24px] h-[24px] ml-1" fill="#f5700c" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="minus_"><path d="m256 0c-141.38 0-256 114.62-256 256s114.62 256 256 256 256-114.62 256-256-114.62-256-256-256zm131.5 256a37.69 37.69 0 0 1 -37.69 37.69h-187.62a37.69 37.69 0 0 1 -37.69-37.69 37.69 37.69 0 0 1 37.69-37.69h187.62a37.69 37.69 0 0 1 37.69 37.69z" /></g></g></svg></Tooltip>
                              }

                              {partnerStatus && partnerStatus == "inprogress" &&
                                <Tooltip content="Assessment may not have begun, or is in progress." trigger="hover"> <svg className="w-[32px] h-[32px] inprogress_2" fill="#d22824" xmlns="http://www.w3.org/2000/svg" data-name="Layer 1" viewBox="0 0 100 125" x="0px" y="0px">
                                  <path d="M50,3.44A46.56,46.56,0,1,0,96.56,50,46.55,46.55,0,0,0,50,3.44Zm6.61,51.37A22.08,22.08,0,0,1,71.82,72.59,2.86,2.86,0,0,1,69,75.87H31a2.86,2.86,0,0,1-2.84-3.28A22.09,22.09,0,0,1,43.39,54.81,4,4,0,0,0,46.21,51v-1.9a4,4,0,0,0-2.82-3.86A22.09,22.09,0,0,1,28.18,27.41,2.86,2.86,0,0,1,31,24.13H69a2.86,2.86,0,0,1,2.84,3.28A22.08,22.08,0,0,1,56.61,45.19a4.05,4.05,0,0,0-2.82,3.87v1.88A4.05,4.05,0,0,0,56.61,54.81Z" /></svg></Tooltip>
                              }
                            </div>
                          </div>
                        </div>
                      </li>
                    }
                    <li>
                      <div className="flex items-center">
                        <div className="flex-1 lg:max-w-[300px] w-[200px]">
                          <div className=" text-gray-900 font-bold text-xl inline-flex"> Performance Rating <Tooltip className="tier_tooltip_partner_status" content="Represents an average of all Performance Ratings & Reviews from below." trigger="hover">
                            <svg className="w-[20px] h-[20px] text-gray-700 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                              <path fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm9.408-5.5a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2h-.01ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4a1 1 0 0 0-1-1h-2Z" clip-rule="evenodd" />
                            </svg>
                          </Tooltip></div>
                        </div>
                        <div className="inline-flex items-center text-base">
                          <div className="">
                            <div className="flex items-center space-x-2">
                              {rating !== undefined && rating > 0 ?
                                <>
                                  {Array.from({ length: 5 }).map((_, index) => (
                                    <span
                                      key={index}
                                      className={`rate_card ${index < rating ? (rating == 1 || rating == 2 ? 'star_red' : (rating == 3 || rating == 4 ? 'star_orange' : 'star_green')) : ''} w-[21px] h-[21px]`}
                                    ></span>
                                  ))}
                                </>
                                : <div className="inline-flex items-center text-base font-semibold text-gray-900">
                                  No ratings submitted
                                </div>
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                    <li>
                      <div className="flex items-center">
                        <div className="flex-1 lg:max-w-[300px] w-[200px]">
                          <div className=" text-gray-900 font-bold text-xl inline-flex"> Last Profile Update <Tooltip className="tier_tooltip_partner_status" content="Represents the last date that you updated any items below." trigger="hover">
                            <svg className="w-[20px] h-[20px] text-gray-700 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                              <path fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm9.408-5.5a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2h-.01ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4a1 1 0 0 0-1-1h-2Z" clip-rule="evenodd" />
                            </svg>
                          </Tooltip></div>
                        </div>
                        <div className="inline-flex items-center text-base font-semibold text-gray-900">{lastUpdateddate !== '' ? lastUpdateddate : 'No updates made'}</div>
                      </div>
                    </li>
                  </ul>
                  <div
                    className={`${data?.bannerAsset?.url ? "relative" : "relative"
                      } pt-6 bottom-0 left-0 xs_mobile_relative`}
                  >
                    <p className="pb-2.5 text-sm">
                      <span className="font-bold">Company size :</span>{" "}
                      {data?.companySizes?.size}
                    </p>
                    <div className="space-y-1">
                      {data?.ServicesOpt?.map(
                        (services) =>
                          services.service &&
                          services.service.serviceName && (
                            <button
                              key={`user_2${services.service.serviceName}`}
                              type="button"
                              className={`default_text_color cursor-default bg_${serviceColoring[services.service.groupId]} focus:outline-none font-medium rounded-sm text_xs_13 px-2 py-1 mr-1`}
                            >
                              {services.service.serviceName}
                            </button>
                          ),
                      )}
                    </div>
                    {
                      recentAnnouncement && recentAnnouncement.title &&
                      <div className="space-y-1 announcement_heading mt-6" onClick={() => { onClickStatus1("7") }}>
                        <span className="text-blue-300" onClick={() => { onClickStatus1("7") }}><b>Announcements:</b> {" " + recentAnnouncement.title}</span>
                        <span className="new-badge relative -top-[1px]" style={{ cursor: 'pointer' }}>NEW</span>
                      </div>
                    }
                  </div>
                </div>
                <div
                  className={`opportuniy_main_thumb Second_grid ${data?.bannerAsset?.url ? "" : "hidden"
                    }`}
                >
                  <Image
                    className="h-auto max-w-full"
                    src={data?.bannerAsset?.url || profileimage}
                    alt="image description"
                    width={854}
                    height={480}
                  />
                </div>
              </div>
            ) : (
              <div className={`grid grid-cols-1 gap_20 ${data?.bannerAsset?.url ? "lg:grid-cols-2" : "lg:grid-cols-2"
                }`}>
                <div className="first_grid relative">
                  <div className="lg:flex items-start gap_20">
                    <Image
                      src={data?.logoAsset?.url || profileimage}
                      alt=""
                      className="aspect-square w-36 rounded-lg object-cover"
                      width={150}
                      height={150}
                    />
                    <div className="">
                      <h3 className="profile_title_font text-gray-900">
                        {data?.name}
                      </h3>
                      <div className="py-2.5 pl-1">
                        <button
                          onClick={() => {
                            route.push("/billing-payment");
                          }}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors  button_blue text-primary-foreground hover:bg-primary/90 h-10 p-5"
                          type="button"
                        >
                          {user.companyId == data?.id
                            ? "Subscribe to enable editing of this company profile"
                            : "Subscribe to view this and all other company profiles"}
                        </button>
                      </div>

                      {<Link prefetch={false} href={`${user.userRoles[0].roleCode == 'buyer' ? '/buyer-benefits' : '/benefits'}`} className="link_color text-sm pl-1">
                        Click here to learn more about the benefits of subscribing
                        to XDS Spark
                      </Link>
                      }
                    </div>
                  </div>
                  <p
                    className={`${data?.bannerAsset?.url ? "" : ""
                      } pt-2.5 default_text_color font-medium text-xl`}
                  >
                    {data?.shortDescription}
                  </p>
                  <div className="relative bottom-0 left-0 pt-6">
                    <p className="pb-2.5 text-sm">
                      <span className="font-bold">Company size :</span>{" "}
                      {data?.companySizes?.size}
                    </p>
                    <div className="space-y-1">
                      {data?.ServicesOpt?.map(
                        (services) =>
                          services.service &&
                          services.service.serviceName && (
                            <button
                              key={services.service.serviceName}
                              type="button"
                              className={`cursor-default default_text_color bg_${serviceColoring[services.service.groupId]} focus:outline-none font-medium rounded-sm text_xs_13 px-2 py-1 mr-1`}
                            >
                              {services.service.serviceName}
                            </button>
                          ),
                      )}
                    </div>
                  </div>
                </div>
                <div className={`opportuniy_main_thumb Second_grid ${data?.bannerAsset?.url ? "" : "hidden"
                  }`}>
                  <Image
                    className="h-auto max-w-full"
                    src={data?.bannerAsset?.url || profileimage}
                    alt="image description"
                    width={640}
                    height={348}
                  />
                </div>
              </div>
            )}
            <div className="sm:block pt-6">
              <div className="border-b border-t border-gray-200 relative">
                <nav className="-mb-px flex gap-2 lg:gap-6 overflow-auto" aria-label="Tabs">
                  <span
                    onClick={() => {
                      if (isPaidUser || user?.userRoles[0].roleCode == "buyer") {
                        onClickStatus1("1");
                      } else {
                        openCommonFreeAlertPopup('ourwork');
                      }
                    }}
                    className={`${(!isPaidUser && user?.userRoles[0].roleCode != "buyer") ? "opacity-50" : "cursor-pointer"
                      }  shrink-0 border-b-2 px-1 py-2 font-bold text-sm ${status == "1"
                        ? "shrink-0 border-b-2 px-1  text-sky-600  border-sky-500 "
                        : "border-transparent default_text_color hover:border-gray-300 hover:text-gray-700"
                      }`}
                  >
                    Our Work
                  </span>
                  <span
                    onClick={() => {
                      if (
                        (!isPaidUser && (user?.companyId == data?.id || user?.userRoles[0].roleCode == "buyer")) ||
                        isPaidUser
                      ) {
                        onClickStatus1("3");
                      } else {
                        openCommonFreeAlertPopup('about');
                      }
                    }}
                    className={`shrink-0 border-b-2 px-1 py-2 font-bold  text-sm ${status == "3"
                      ? "shrink-0 border-b-2 px-1  text-sky-600  border-sky-500 "
                      : "border-transparent default_text_color hover:border-gray-300 hover:text-gray-700"
                      }  ${!isPaidUser && (user?.companyId == data?.id || user?.userRoles[0].roleCode == "buyer")
                        ? "cursor-pointer "
                        : isPaidUser
                          ? "cursor-pointer"
                          : "opacity-50"
                      }`}
                  >
                    About
                  </span>
                  <span
                    onClick={() => {
                      if (isPaidUser) {
                        onClickStatus1("2");
                      } else {
                        openCommonFreeAlertPopup('certificationanddiligence')
                      }
                    }}
                    className={`${!isPaidUser ? "opacity-50" : "cursor-pointer certi_mobile"
                      } shrink-0 border-b-2 px-1 py-2 font-bold  text-sm ${status == "2"
                        ? "shrink-0 border-b-2 px-1  text-sky-600  border-sky-500 "
                        : "border-transparent default_text_color hover:border-gray-300 hover:text-gray-700"
                      }`}
                  >
                    Due Diligence
                  </span>
                  <span
                    onClick={() => {
                      if (isPaidUser) {
                        onClickStatus1("4");
                      } else {
                        openCommonFreeAlertPopup('contact')
                      }
                    }}
                    className={`${(!isPaidUser) ? "opacity-50" : "cursor-pointer"
                      }  shrink-0 border-b-2 px-1 py-2 font-bold  text-sm ${status == "4"
                        ? "shrink-0 border-b-2 px-1  text-sky-600  border-sky-500 "
                        : "border-transparent default_text_color hover:border-gray-300 hover:text-gray-700"
                      }`}
                  >
                    Contacts
                  </span>
                  {(eventList.length > 0 || (!isPaidUser && isActiveEventsAvailable)) &&
                    <span
                      onClick={() => {
                        if ((user?.id !== data?.user?.id && !isPaidUser && eventList.length > 0) || ((isPaidUser) && eventList.length >= 0)) {
                          onClickStatus1("6");
                        } else {
                          openCommonFreeAlertPopup('EVENTS');
                        }

                      }}
                      className={`shrink-0 border-b-2 px-1 py-2 font-bold  text-sm ${status == "6"
                        ? "shrink-0 border-b-2 px-1  text-sky-600  border-sky-500 "
                        : "border-transparent default_text_color hover:border-gray-300 hover:text-gray-700"
                        } ${(eventList.length <= 0 || (user?.id === data?.user?.id && !isPaidUser)) ? "opacity-50" : "cursor-pointer"}`}
                    >
                      Events
                    </span>
                  }

                  {
                    announcements.length > 0 ?
                      <>
                        <span
                          onClick={() => {
                            onClickStatus1("7");
                            // if (isPaidUser) {
                            //   onClickStatus1("7");
                            // } else {
                            //   openCommonFreeAlertPopup('announcements');
                            // }
                          }}
                          className={`cursor-pointer certi_mobile shrink-0 border-b-2 px-1 py-2 font-bold  text-sm ${status == "7"
                            ? "shrink-0 border-b-2 px-1  text-sky-600  border-sky-500 "
                            : "border-transparent default_text_color hover:border-gray-300 hover:text-gray-700"
                            }`}
                        >
                          Announcements
                          {
                            !data?.addedAnnouncement && user.companyId == data?.id &&
                            <span className="new-badge relative -top-[1px]">NEW</span>
                          }
                        </span>

                      </>
                      :
                      user?.userRoles[0].roleCode != "buyer" && user.companyId == data?.id &&
                      <>
                        <span
                          onClick={() => {
                            onClickStatus1("7");
                            // if (isPaidUser) {
                            //   onClickStatus1("7");
                            // } else {
                            //   openCommonFreeAlertPopup('announcements');
                            // }
                          }}
                          className={`cursor-pointer certi_mobile shrink-0 border-b-2 px-1 py-2 font-bold  text-sm ${status == "7"
                            ? "shrink-0 border-b-2 px-1  text-sky-600  border-sky-500 "
                            : "border-transparent default_text_color hover:border-gray-300 hover:text-gray-700"
                            }`}
                        >
                          Announcements
                          {
                            !data?.addedAnnouncement && user.companyId == data?.id &&
                            <span className="new-badge relative -top-[1px]">NEW</span>
                          }
                        </span>

                      </>
                  }

                  {
                    (LoggedCompanyId != compantId) ?
                      //  (LoggedCompanyId && compantId) ? 
                      <span
                        onClick={() => {
                          if (isPaidUser) {
                            onClickStatus1("5");
                          } else {
                            openCommonFreeAlertPopup('myspark')
                          }
                        }}
                        className={`inline-flex ${(!isPaidUser) ? "opacity-50" : "cursor-pointer"
                          }  shrink-0 border-b-2 px-1 py-2 font-bold  text-sm ${status == "5"
                            ? "shrink-0 border-b-2 px-1  text-sky-600  border-sky-500 "
                            : "border-transparent default_text_color hover:border-gray-300 hover:text-gray-700"
                          }`}
                      >
                        My Spark
                        <Tooltip className="tier_tooltip_partner_status " content="Maintain important info about this Service Provider that only YOU can see." trigger="hover">
                          <svg className="w-[16px] h-[16px] text-gray-700 ms-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                            <path fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm9.408-5.5a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2h-.01ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4a1 1 0 0 0-1-1h-2Z" clip-rule="evenodd" />
                          </svg>
                        </Tooltip>
                      </span>
                      :
                      ""
                  }

                </nav>
                <div className="absolute right-0 top-0 mt-1 xs_mobile_top_55">
                  {
                    LoggedCompanyId != compantId && user.userRoles[0].roleCode == "buyer" &&
                    <button
                      className={`text-sm inline-flex items-center justify-center gap-1.5 rounded-sm border-0 border-gray-200 px-3 mx-3 py-1 text-blue-300 transition hover:bg-gray-0 hover:text-blue-400 focus:outline-none ${(!isPaidUser || companyCounts >= 5) ? "link_disabled" : ""}  ${isFollowed ? "unfollow_button" : "follow_button"}`}
                      type="button"
                      onClick={() => onClickFollow()}
                      disabled={isLoading}
                    >
                      {
                        isFollowed ?
                          <>
                            <svg xmlns="
                            http://www.w3.org/2000/svg"
                              width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M13.8623 10.9963C13.5154 10.3988 12.9998 8.70813 12.9998 6.5C12.9998 5.17392 12.473 3.90215 11.5353 2.96447C10.5976 2.02678 9.32585 1.5 7.99976 1.5C6.67368 1.5 5.40191 2.02678 4.46423 2.96447C3.52655 3.90215 2.99976 5.17392 2.99976 6.5C2.99976 8.70875 2.48351 10.3988 2.13664 10.9963C2.04806 11.1482 2.0011 11.3207 2.00049 11.4966C1.99989 11.6724 2.04566 11.8453 2.1332 11.9978C2.22074 12.1503 2.34694 12.277 2.49908 12.3652C2.65122 12.4534 2.82392 12.4999 2.99976 12.5H5.55039C5.66575 13.0645 5.97253 13.5718 6.41885 13.9361C6.86517 14.3004 7.42362 14.4994 7.99976 14.4994C8.5759 14.4994 9.13436 14.3004 9.58068 13.9361C10.027 13.5718 10.3338 13.0645 10.4491 12.5H12.9998C13.1756 12.4998 13.3482 12.4532 13.5002 12.365C13.6523 12.2768 13.7784 12.15 13.8659 11.9975C13.9533 11.845 13.999 11.6722 13.9984 11.4964C13.9978 11.3206 13.9508 11.1481 13.8623 10.9963ZM7.99976 13.5C7.68965 13.4999 7.38719 13.4037 7.13401 13.2246C6.88083 13.0455 6.68938 12.7924 6.58601 12.5H9.41351C9.31014 12.7924 9.11869 13.0455 8.86552 13.2246C8.61234 13.4037 8.30988 13.4999 7.99976 13.5ZM2.99976 11.5C3.48101 10.6725 3.99976 8.755 3.99976 6.5C3.99976 5.43913 4.42119 4.42172 5.17134 3.67157C5.92148 2.92143 6.9389 2.5 7.99976 2.5C9.06063 2.5 10.078 2.92143 10.8282 3.67157C11.5783 4.42172 11.9998 5.43913 11.9998 6.5C11.9998 8.75313 12.5173 10.6706 12.9998 11.5H2.99976Z" fill="#0071C2" />
                            </svg>
                            {isLoading ?
                              <div role="status">
                                <svg aria-hidden="true" className="inline w-4 h-4 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                                </svg>
                                <span className="sr-only">Loading...</span>
                              </div>
                              : 'Unfollow'
                            }

                          </>
                          :
                          <>
                            <svg xmlns="
                            http://www.w3.org/2000/svg"
                              width="16" height="16" viewBox="0 0 16 16" fill="#000">
                              <path d="M13.8623 10.9963C13.5154 10.3988 12.9998 8.70813 12.9998 6.5C12.9998 5.17392 12.473 3.90215 11.5353 2.96447C10.5976 2.02678 9.32585 1.5 7.99976 1.5C6.67368 1.5 5.40191 2.02678 4.46423 2.96447C3.52655 3.90215 2.99976 5.17392 2.99976 6.5C2.99976 8.70875 2.48351 10.3988 2.13664 10.9963C2.04806 11.1482 2.0011 11.3207 2.00049 11.4966C1.99989 11.6724 2.04566 11.8453 2.1332 11.9978C2.22074 12.1503 2.34694 12.277 2.49908 12.3652C2.65122 12.4534 2.82392 12.4999 2.99976 12.5H5.55039C5.66575 13.0645 5.97253 13.5718 6.41885 13.9361C6.86517 14.3004 7.42362 14.4994 7.99976 14.4994C8.5759 14.4994 9.13436 14.3004 9.58068 13.9361C10.027 13.5718 10.3338 13.0645 10.4491 12.5H12.9998C13.1756 12.4998 13.3482 12.4532 13.5002 12.365C13.6523 12.2768 13.7784 12.15 13.8659 11.9975C13.9533 11.845 13.999 11.6722 13.9984 11.4964C13.9978 11.3206 13.9508 11.1481 13.8623 10.9963ZM7.99976 13.5C7.68965 13.4999 7.38719 13.4037 7.13401 13.2246C6.88083 13.0455 6.68938 12.7924 6.58601 12.5H9.41351C9.31014 12.7924 9.11869 13.0455 8.86552 13.2246C8.61234 13.4037 8.30988 13.4999 7.99976 13.5ZM2.99976 11.5C3.48101 10.6725 3.99976 8.755 3.99976 6.5C3.99976 5.43913 4.42119 4.42172 5.17134 3.67157C5.92148 2.92143 6.9389 2.5 7.99976 2.5C9.06063 2.5 10.078 2.92143 10.8282 3.67157C11.5783 4.42172 11.9998 5.43913 11.9998 6.5C11.9998 8.75313 12.5173 10.6706 12.9998 11.5H2.99976Z" fill="white" />
                            </svg>
                            {isLoading ?
                              <div role="status">
                                <svg aria-hidden="true" className="inline w-4 h-4 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                                </svg>
                                <span className="sr-only">Loading...</span>
                              </div>
                              :
                              <Tooltip className="tier_tooltip_4" content="Follow this company to be notified when they update their portfolio, projects or other profile details." trigger="hover">Follow
                              </Tooltip>
                            }
                          </>
                      }
                    </button>
                  }
                  <button
                    className={`text-sm inline-flex items-center justify-center gap-1.5 rounded-sm border-0 border-gray-200 px-3 py-1 text-blue-300 transition hover:bg-gray-0 hover:text-blue-400 focus:outline-none ${(!isPaidUser || companyCounts >= 5) ? "link_disabled" : ""} `}
                    type="button"
                    onClick={() => { onClickCompare() }}
                    disabled={!isPaidUser || companyCounts >= 5}
                  >
                    <Image
                      src="/plus.svg"
                      className={`w-3.5 h-3.5 link_color`}
                      alt=""
                      width={640}
                      height={360}
                    />
                    <span className="">Compare</span>
                  </button>
                  <div className={`text-sm inline-flex items-center justify-center gap-1.5 rounded-sm border-0 border-gray-200 px-3 py-1 ${!isPaidUser && 'link_disabled'}`}>
                    <Image
                      width={640}
                      height={360}
                      src="/exit-right.svg"
                      className="w-3 h-3 text-blue-300"
                      alt=""
                    />
                    {isPaidUser ?
                      <a
                        href={data?.website &&
                          (data.website.startsWith('http://') || data.website.startsWith('https://') ?
                            data.website : `https://${data.website}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-300 hover:text-blue-400 focus:outline-none"
                      >
                        Website
                      </a>
                      :
                      <span className="cursor-pointer" onClick={() => openCommonFreeAlertPopup('website')}>Website</span>
                    }
                  </div>
                  {(data?.user?.id != user?.id) &&
                    <button
                      className={`text-sm inline-flex items-center justify-center gap-1.5 rounded-sm border-0 border-gray-200 px-3 py-1 text-blue-300 transition hover:bg-gray-0 hover:text-blue-400 focus:outline-none ${!isPaidUser && 'link_disabled'}`}
                      type="button"
                      onClick={() => {
                        if (isPaidUser) {
                          addListsidebar(isVisible || false);
                        } else {
                          openCommonFreeAlertPopup('addto');
                        }
                      }}
                    >
                      <Image
                        width={640}
                        height={360}
                        src="/plus.svg"
                        className="w-3 h-3 text-blue-300"
                        alt=""
                      />
                      <span className=""> Add To...</span>
                    </button>
                  }
                </div>
              </div>
            </div>
  </div>
            {status == "1" ? (
              <>
                <div className="sm:block pt-6">
                  <div className="w-full  pos_r">
                    <ServiceproviderOurWork
                      isPaidProfile={data?.user?.isPaidUser || false}
                      portfolio={portfolio}
                      companyProjects={portfolioProjects}
                      setPortfolio={(arg: any) => setPortfolio(arg)}
                      setCompanyProjects={(arg: any) => setportfolioProjects(arg)}
                      portfolioProjectName={portfolioProjectName}
                    />
                  </div>
                </div>
              </>
              // <ServiceProvidersOurWorkAlbums portfolio={portfolio}
              // companyProjects={portfolioProjects} />
            ) : status == "2" ? (
              <div className="w-full lg:container px-5 pos_r">
              <ServiceproviderCertificateAndDiligence
                isPaidProfile={data?.user?.isPaidUser || false}
                cdData={CertificationAndDiligence}
                platforms={dueDiligencePlatforms}
                gameEngines={getGameEngines}
                address={companyAddress}
              ></ServiceproviderCertificateAndDiligence>
              </div>
            ) : status == "3" ? (
              <div className="w-full lg:container px-5 pos_r">
              <ServiceproviderAboutUs isPaidProfile={data?.user?.isPaidUser || false} companyId={Number(compantId)} aboutdesc={data && data.about} profilePdf={data && data.profilePdfPath} /></div>
            ) : status == "4" ? (
              <div className="w-full lg:container px-5 pos_r">
              <ServiceproviderContactUs isPaidProfile={data?.user?.isPaidUser || false} CompanyContacts={CompanyContacts} loggedCompanyId={LoggedCompanyId} providerCompanyId={Number(compantId)} /></div>
            ) : status == "5" ? (
              <div className="w-full lg:container px-5 pos_r">
              <MySparkMain companyId={Number(compantId)} setrating={(val: number) => setrating(val)} setLastUpdatedDate={(val: string) => setLastUpdatedDate(val)} isCompanyUser={user.isCompanyUser || false}></MySparkMain>
              </div>
            ) : (status == "6") ? (
              <div className="w-full lg:container px-5 pos_r">
              <EventsDisplay companyId={Number(compantId)} eventList={eventList}></EventsDisplay>
              </div>
            ) : (status == "7") ? (
              <div className="w-full lg:container px-5 pos_r">
              <AnnouncementDisplay viewingCompanyId={Number(compantId)} announcements={announcements} setAnnouncements={(arg: Announcement[]) => setAnnouncements(arg)} openCommonFreeAlertPopup={(val: string) => openCommonFreeAlertPopup(val)}></AnnouncementDisplay>
              </div>
            ) : ("")
            }        
           </>
          :
          <div className="min-h-screen flex justify-center items-center">
            <Spinner />
          </div>
      }

      {/* Add to side bar for adding to my List and My Projects */}
      <AddtoMyList
        updatedAddto={updatedAddto}
        onVisibilityChange={(val: boolean) => setUpdatedAddto(val)}
        selectedCompanies={selectedCompanies}
      ></AddtoMyList>
      {/* Add to side bar for adding to my List and My Projects */}
      {/* Report this Service Provider */}
      <Modal show={openModal} onClose={() => setOpenModal(false)}>
        <Modal.Header className="modal_header">
          <b>Report this Service Provider</b>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            <div className="">
              <div className="mb-2 block">
                <Label
                  htmlFor="comment"
                  className="font-bold text-xs"
                  value="Please explain why you are reporting this company *"
                />
              </div>
              <Textarea
                id="comment"
                placeholder=""
                required
                rows={8}
                className="w-full focus:border-blue-500"
                onChange={(e) => setReportDescription(e.target.value)}
              />
              <p className="pt-6 text-sm default_text_color">
                Note: Submissions are not anonymous. Our team will review this
                report and may contact you for further details.
              </p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="modal_footer">
          <Button
            className="h-[40px]"
            color="gray"
            onClick={() => setOpenModal(false)}
          >
            Cancel
          </Button>
          <Button
            className="h-[40px] button_blue"
            onClick={(e: any) => {
              e.preventDefault();
              setCompanyAsReported();
            }}
          >
            Submit
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Report this Service Provider End */}

      {/*Thank you */}
      <Modal show={thankModal} onClose={() => { setThankModal(false); setIsFlaggedCompany(true); }}>
        <Modal.Header className="modal_header font-bold">
          <b>Thank you</b>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-6 text-sm">
            Our team will review this report and may contact you for further
            details.
          </div>
        </Modal.Body>
        <Modal.Footer className="modal_footer">
          <Button
            onClick={() => { setThankModal(false); setIsFlaggedCompany(true); }}
            className="px-4 h-[40px] button_blue"
          >
            Ok
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Thank you End */}
      <FreeTierAlerts isOpen={openAddtoWarningModal} setOpenPopup={setopenAddtoWarningModal} bodymessage={popupMessage} />
    </>
  );
};
export default ServiceProviderDetails;


