"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Tooltip } from "flowbite-react";
import "../../public/css/detatable.css";
import Image from "next/image";
import { PATH } from "@/constants/path";
import Breadcrumbs from "@/components/breadcrumb";
import Servicessidenavbar from "@/components/servicessidenavbar";
import Serviceproviderslist from "@/components/Serviceproviderslist";
import { useUserContext } from "@/context/store";
import AddtoMyList from "@/components/addtomylistsidebar";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import MobileViewServiceProviderSideBar from "@/components/mobileserviceprovidersidebar";
import { useMultiTourContext } from "@/context/multiTourContext";
import { Toursteps } from "@/services/tour";
import { authFetcher, authPutWithData } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import Link from "next/link";
import ServicesGrid from "@/components/servicesgrid";
import { SelectedPlatformsType, sponsoredServices } from "@/types/serviceprovidersidebar.type";
import Spinner from "@/components/spinner";
import { encryptString, setCrousalAgain } from "@/services/common-methods";
import FadeSlider from "@/components/ui/fadeslider";

const Serviceproviders = () => {
  const { user } = useUserContext();
  const route = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? "";
  const filtersToken = localStorage.getItem("selectedFilters");

  const [shareLinkToken, setshareLinkToken] = useState(filtersToken)
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  if (!user) {
    if (token != "" && token != null) {
      localStorage.setItem('selectedFilters', token);
    }
    redirect(PATH.HOME.path);
  }

  useEffect(() => {
    async function getTokenResponse(filtersToken: string) {
      await authFetcher(getEndpointUrl(ENDPOINTS.getFilterData(filtersToken))).then((result: any) => {
        if (result) {
          localStorage.removeItem("selectedFilters");
          route.replace('/serviceproviders');
          setshareLinkToken(null)
          if (result.countrySearchValue != "") {
            localStorage.setItem("previouscountrysearch", result.countrySearchValue);
          } else {
            localStorage.removeItem("previouscountrysearch");
          }

          if (result.selctedCompanySize != "") {
            localStorage.setItem("oldCompanySizes", result.selctedCompanySize);
          } else {
            localStorage.removeItem("oldCompanySizes");
          }

          if (result.selectedEventValues != "") {
            localStorage.setItem("StoredEvents", result.selectedEventValues);
            setCurrentSelectedEvents(JSON.parse(result.selectedEventValues));
          } else {
            localStorage.removeItem("StoredEvents");
          }

          if (result.selectedServiceIds != "") {
            localStorage.setItem("selectedIdServiceCapabilities", result.selectedServiceIds);
          } else {
            localStorage.removeItem("selectedIdServiceCapabilities");
          }

          if (result.selectedSevices != "") {
            localStorage.setItem("selectedServiceCapabilities", result.selectedSevices);
          } else {
            localStorage.removeItem("selectedServiceCapabilities");
          }

          if (result.inputValue) {
            localStorage.setItem("inputsearchvalue", result.inputValue);
          } else {
            localStorage.removeItem("inputsearchvalue");
          }

          if (result.isPremium != "") {
            localStorage.setItem("prevIsPremiumUsersOnly", result.isPremium);
              setIsPremiumUsersOnly(true);
          } else {
            localStorage.removeItem("prevIsPremiumUsersOnly");
          }

          if (result.regionCheckboxFilter != "") {
            localStorage.setItem("regionCheckboxFilter", result.regionCheckboxFilter);
          } else {
            localStorage.removeItem("regionCheckboxFilter");
          }

          setTimeout(() => {
            setIsLoadingToken(false)
          }, 100);
        }
      })
    }

    if (user && (filtersToken || token)) {
      getTokenResponse(filtersToken ?? token)
    } else {
      setIsLoadingToken(false)
    }

  }, [filtersToken, token])



  const [openServiceModal, setOpenServiceModal] = useState(false);
  const breadcrumbItems = [
    {
      label: PATH.HOME.name,
      path: PATH.HOME.path,
    },
    {
      label: PATH.BROWSESERVICEPROVIDERS.name,
      path: PATH.BROWSESERVICEPROVIDERS.path,
    },
  ];

  interface SelectedEvent {
    id: number;
    name: string;
  }

  type SearchValueTypes = {
    InputsearchValue: string;
    servicesearchValue: { [serviceName: string]: string[] } | string;
    selectedCapabilities: string;
    countrySearchValue: string;
    companySizeSearchValue: string;
    updatedAddtoProps: boolean;
    sendselectedCompanies: number[];
    currentSelectedEvents: SelectedEvent[];
    selectedPlatforms: SelectedPlatformsType[];
  };
  const [inputValue, setInputValue] = useState<string | "">();
  const [submmitedinputvalue, SetSubmmitedinputvalue] = useState<string | "">();
  const [serviceSearchValue, setSearchValue] = useState<{ [serviceName: string]: string[] }>();
  const [servicesearchvalues, setSearchValues] = useState<{ [serviceName: string]: string[] }>();
  const [removedsearchvalues, setremovedSearchValues] = useState<{ [serviceName: string]: string[] }>();
  const [allsearchesvalues, setAllsearachvalues] = useState<SearchValueTypes>();
  const [isLocalvalueSet, setIsLocalValueSet] = useState<boolean>()
  //
  const [sortCustomColumn, setsortCustomColumn] = useState<string>("");
  const [sortCustomColumnField, setsortCustomColumnField] = useState<string>("");
  const [generateshareLinkUser, setGenerateShareLinkUser] = useState<boolean>(false);

  //country change
  const [regionSearchValue, setRegionSearchValue] = useState<string>();
  const [RegionSearchValuesForBadge, setRegionSearchValuesForBadge] =
    useState<string[]>();
  const [removedregionsearchvalues, setremovedRegionSearchValues] =
    useState<string[]>();

  //company size
  const [CompanySizeSearchValue, setCompanySizeSearchValue] =
    useState<string>();
  const [CompanySizeSearchValuesForBadge, setCompanySizeSearchValuesForBadge] =
    useState<string[]>();

  const [removedCompanySizeSearchValue, setRemovedCompanySizeSearchValue] =
    useState<string[]>();

  const [updatedAddto, setUpdatedAddto] = useState<boolean>();
  const [selectedCompanies, setselectedCompanies] = useState<number[]>([]);
  const [selectedPlatformsForBadge, setSelectedPlatformsForBadge] = useState<SelectedPlatformsType[]>([])
  //handler methods starts

  //mobile code
  const [isMobile, setIsMobile] = useState(false);
  const [statSearchString, setStatSearchString] = useState("");
  const [bannerAdImage, setBannerAdImage] = useState<{ id: number, adImagePath: string, mobileAdImagePath: string, adURL: string, adPage: string }[]>([]);
  //
  const [selectedCapabilities, setSelectedCapabilities] = useState<string>("");
  //
  const [isPremiumUsersOnly, setIsPremiumUsersOnly] = useState(false);

  //
  const [isLoadedFirst, setIsLoadedFist] = useState<boolean>(true);
  //
  const [sponseredServices, setSponseredServices] = useState<sponsoredServices[]>([]);
  //
  const [isAddtoCompleted, setIsAddtoCompleted] = useState<boolean>(false);
  const [currentSelectedEvents, setCurrentSelectedEvents] = useState<SelectedEvent[]>([]);
  const [removedEvents, setRemovedEvents] = useState<number[]>();
  const [removedPlatform, setRemovedPlatform] = useState<SelectedPlatformsType[]>();
  const [addedSponseredServices, setAddedSponseredServices] = useState<{ serviceName: string, capability: string, isChecked: boolean, serviceId: string | number, capabilityId: number }>()
  const [webUrl, setWebUrl] = useState<string>('');
  const {
    setTourState,
    tourState: { tourActive }
  } = useMultiTourContext();

  const userCheckForGenerateLink = async () => {
    const checkEmail = await authFetcher(getEndpointUrl(ENDPOINTS.checkGenerateFilterLinkUser)).then((result) => {
      if (result.status && result.data) {
        setGenerateShareLinkUser(result.data);
      }
    });
  }

  useEffect(() => {

    if (shareLinkToken) {
      return;
    }
    userCheckForGenerateLink();
    if (tourActive) {
      setTourState({ run: true, stepIndex: 1, steps: Toursteps, tourActive: true });
    }
    const weburl = window.location.href.split('/').slice(0, 3).join('/');
    setWebUrl(weburl);
    async function getSponseredServices() {
      const currentDate = encryptString(new Date().toLocaleDateString('en-US'), process.env.NEXT_PUBLIC_XDS_EMAIL_SECRET_KEY);
      const sponseredServices = await authFetcher(getEndpointUrl(ENDPOINTS.getSponseredServices(currentDate)));
      setSponseredServices(sponseredServices);
      if (sponseredServices.length < 39) {
        setIsLoadedFist(false);
      }
    }
    getSponseredServices();

    const oldCompanySizes = localStorage.getItem("oldCompanySizes");
    if (oldCompanySizes) {
      handleCompanySizes(JSON.parse(oldCompanySizes));
      setCompanySizeSearchValue(JSON.parse(oldCompanySizes));
    }

    const currentDate = new Date().toLocaleDateString('en-US');
    authFetcher(`${getEndpointUrl(ENDPOINTS.getBannerAds(currentDate))}`)
      .then((bannerData) => {
        const ads = setCrousalAgain(bannerData, "spsCrousal");
        setBannerAdImage(ads);
      });

    let previouscountrysearch: string[] = [];
    const countrySearchValue = localStorage.getItem("previouscountrysearch");
    if (countrySearchValue) {
      previouscountrysearch = JSON.parse(countrySearchValue);
    }
    setRegionSearchValuesForBadge(previouscountrysearch);
    const prevIsPremiumUsersOnly = localStorage.getItem("prevIsPremiumUsersOnly");
    if (prevIsPremiumUsersOnly) {
      if (prevIsPremiumUsersOnly === "True") {
        setIsPremiumUsersOnly(true);
      }
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();


    if (window.innerWidth < 768) {
      const oldEvents = localStorage.getItem("StoredEvents");
      if (oldEvents) {
        setCurrentSelectedEvents(JSON.parse(oldEvents));
      }
    } else {
      const LocalEventValues = localStorage.getItem("StoredEvents");
      if (LocalEventValues) {
        setCurrentSelectedEvents(JSON.parse(LocalEventValues));
      }
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };

  }, [shareLinkToken]);

  const handleSearchChange = (value: { [serviceName: string]: string[] }) => {
    //const resultString = Object.keys(value).join(",");
    //
    const newObj = { ...value };
    setSearchValues(newObj);
    //
    setSearchValue(value);
    setsortCustomColumn("")
    setsortCustomColumnField("")
  };
  const onCapabilityChange = (value: { [serviceName: string]: string[] }) => {
    setSelectedCapabilities(JSON.stringify(value));
  };
  const handleInputtoRemove = () => {
    setInputValue("");

    const inputElement = document.getElementById("input-search");
    if (inputElement instanceof HTMLInputElement) {
      inputElement.value = "";
    }
    localStorage.removeItem("inputsearchvalue");
    SetSubmmitedinputvalue("");
  };
  const handleCompanySizes = (comp_size: string[]) => {
    const resultString = comp_size.join(",");
    setCompanySizeSearchValuesForBadge(comp_size);
    setCompanySizeSearchValue(resultString);
    //
    setsortCustomColumn("")
    setsortCustomColumnField("")
  };
  const handlePlatformChange = (platforms: SelectedPlatformsType[]) => {
    setSelectedPlatformsForBadge(platforms);
    setsortCustomColumn("")
    setsortCustomColumnField("")
  };
  const handleServiceSearchItems = (servicename: string, capabilityName: string) => {

    if (capabilityName && capabilityName != "") {
      let updatesearchvalues = servicesearchvalues && servicesearchvalues[servicename]
        ? servicesearchvalues[servicename].filter(item => item !== capabilityName)
        : [];
      if (servicesearchvalues && servicesearchvalues[servicename]) {
        servicesearchvalues[servicename] = updatesearchvalues;
      }

    } else if (servicesearchvalues) {
      delete servicesearchvalues[servicename];
    }
    setSearchValues(servicesearchvalues);
    setsortCustomColumn("")
    setsortCustomColumnField("");
    const transformedObject = { [servicename]: [capabilityName] };
    setremovedSearchValues(transformedObject);
  };

  const handleRegionSearchItems = (country: string) => {
    const updateregionsearchvalues = RegionSearchValuesForBadge?.filter(
      (item) => item != country,
    );
    localStorage.setItem("previouscountrysearch", JSON.stringify(updateregionsearchvalues))
    setRegionSearchValuesForBadge(updateregionsearchvalues);
    setsortCustomColumn("")
    setsortCustomColumnField("")
    setremovedRegionSearchValues([country]);
  };
  const handleRemoveCompanySizeSearchItems = (company_size: string) => {
    const updateCompanySizeSearchvalues =
      CompanySizeSearchValuesForBadge?.filter(
        (comp_size) => comp_size != company_size,
      );
    setsortCustomColumn("")
    setsortCustomColumnField("")
    setCompanySizeSearchValuesForBadge(updateCompanySizeSearchvalues);
    setRemovedCompanySizeSearchValue([company_size]);
  };

  const removeAllSearchItems = () => {
    localStorage.removeItem("previouscountrysearch");
    localStorage.removeItem("oldCompanySizes");
    localStorage.removeItem("regionCheckboxFilter");
    localStorage.removeItem("previousServiceSearches");
    localStorage.removeItem("inputsearchvalue");
    localStorage.removeItem("selectedServiceCapabilities");
    localStorage.removeItem("selectedIdServiceCapabilities");
    localStorage.removeItem("StoredEvents");
    localStorage.removeItem("oldPlatforms");
    servicesearchvalues && setremovedSearchValues(servicesearchvalues);
    setSelectedCapabilities("");
    setSearchValues({});
    if (currentSelectedEvents && currentSelectedEvents?.length > 0) {
      const evenids = currentSelectedEvents.map((event) => event.id)
      setRemovedEvents(evenids);
      setCurrentSelectedEvents([]);
    }

    setremovedRegionSearchValues(RegionSearchValuesForBadge);
    setRemovedCompanySizeSearchValue(CompanySizeSearchValuesForBadge);
    setRemovedPlatform(selectedPlatformsForBadge);
    setSelectedPlatformsForBadge([]);
    handleInputtoRemove();
    setsortCustomColumn("")
    setsortCustomColumnField("")
  };

  const handleCountryChange = (value: string[]) => {
    const resultString = value.join(",");
    setRegionSearchValuesForBadge(value);
    setRegionSearchValue(resultString);
    setsortCustomColumn("")
    setsortCustomColumnField("")
  };
  const handleSearchButton = useCallback(() => {
    const inputElement = document.getElementById("input-search");
    if (inputElement instanceof HTMLInputElement) {
      if (!isLocalvalueSet) {
        setIsLocalValueSet(true)
        if (localStorage.getItem("inputsearchvalue")) {

          inputElement.value = localStorage.getItem("inputsearchvalue") || "";
          // localStorage.removeItem("inputsearchvalue");
        }
      }
      // inputElement.focus();
      const value = inputElement.value.trim();
      localStorage.setItem("inputsearchvalue", value);
      setInputValue(value);
      SetSubmmitedinputvalue(value);
      (value != statSearchString) ? setStatSearchString(value) : "";
    }
    // if(localStorage.getItem('inputsearchvalue')){
    //   setInputValue(localStorage.getItem('inputsearchvalue') || "");
    //   SetSubmmitedinputvalue(localStorage.getItem('inputsearchvalue') || "");
    //   localStorage.removeItem("inputsearchvalue");
    // }
    const updatedSearchValues = {
      InputsearchValue: inputValue || "",
      servicesearchValue: serviceSearchValue || "",
      selectedCapabilities: selectedCapabilities || "",
      countrySearchValue: regionSearchValue || "",
      companySizeSearchValue: CompanySizeSearchValue || "",
      updatedAddtoProps: false,
      sendselectedCompanies: [],
      currentSelectedEvents: currentSelectedEvents,
      selectedPlatforms: selectedPlatformsForBadge,
    };
    setAllsearachvalues(updatedSearchValues);
    if ((inputValue && inputValue?.length > 0) || (serviceSearchValue && Object.keys(serviceSearchValue).length > 0) || (selectedCapabilities && selectedCapabilities.length > 0 && selectedCapabilities != "{}") || (regionSearchValue && regionSearchValue.length > 0) || (CompanySizeSearchValue && CompanySizeSearchValue.length > 0) || (currentSelectedEvents && currentSelectedEvents.length > 0)) {
      // setIsLoadedFist(false)
    }

  }, [
    inputValue,
    serviceSearchValue,
    regionSearchValue,
    CompanySizeSearchValue,
    statSearchString,
    currentSelectedEvents,
    selectedPlatformsForBadge,
  ]);

  const setTheSearchedStringInStats = () => {
    if (statSearchString && statSearchString != "") {
      authFetcher(`${getEndpointUrl(ENDPOINTS.addTheSearchedStringInStats(user.id, statSearchString, false))}`).then();
    }
  }

  useEffect(() => {
    if (!shareLinkToken) {
      handleSearchButton();
    }

    // scrollToTop();
  }, [
    serviceSearchValue,
    submmitedinputvalue,
    regionSearchValue,
    inputValue,
    CompanySizeSearchValue,
    handleSearchButton
  ]);

  useEffect(() => {
    setTheSearchedStringInStats();
  }, [statSearchString])


  const bannerAdClicks = (bannerId: number) => {
    authPutWithData(`${getEndpointUrl(ENDPOINTS.updateAd(+bannerId))}`, { type: 'click' }).catch((err) => {
      console.log(err);
    });
  }
  // for setting Previous Searches

  //
  const onEventUpdated = (updatedEvents: SelectedEvent[]) => {
    setCurrentSelectedEvents(updatedEvents)
  }
  //
  const handleRemoveEvents = (id: number) => {
    setCurrentSelectedEvents((prev) => {
      let updatedEvents = prev.filter(event => event.id !== id);
      localStorage.setItem("StoredEvents", JSON.stringify(updatedEvents));
      return updatedEvents;
    })
    setRemovedEvents([id]);
  }
  const handleRemovePlatform = (currentPlatform: SelectedPlatformsType) => {
    setSelectedPlatformsForBadge((prev) => {
      let updatedEvents = prev.filter(platform => platform.id !== currentPlatform.id);
      return updatedEvents;
    })
    setRemovedPlatform([currentPlatform]);
  }
  const handleSponseredServices = (serviceId: number, serviceName: string) => {
    const serviceIds = { [serviceId + 'a']: [] };
    const serviceNames = { [serviceName]: [] };
    onCapabilityChange(serviceIds),
      handleSearchChange(serviceNames);
    localStorage.setItem("selectedIdServiceCapabilities", JSON.stringify(serviceIds));
    localStorage.setItem("selectedServiceCapabilities", JSON.stringify(serviceNames));
    const sponsoredServices: {
      serviceName: string;
      capability: string;
      isChecked: boolean;
      serviceId: string | number;
      capabilityId: number;
    } = {
      serviceName,
      capability: "",
      isChecked: true,
      serviceId: serviceId,
      capabilityId: 0,
    }
    setAddedSponseredServices(sponsoredServices);
  }

  async function scrollToTop() {
    window.scrollTo({
      top: 150,
      behavior: 'smooth' // Smooth scrolling behavior
    });
  };


  useEffect(() => {
    if (isAddtoCompleted) {
      setselectedCompanies([])
      setIsAddtoCompleted(false)
    }
  }, [isAddtoCompleted])


  if (isLoadingToken) {
    return <>
    <div className="min-h-screen flex justify-center items-center">
      <Spinner />
    </div></>
  }
  return (
    <>
      <div className="w-full lg:container">
        {
          isMobile && bannerAdImage.length > 0 &&
          <FadeSlider images={bannerAdImage} webUrl={webUrl} onClickBannerAdClicks={(val: number) => bannerAdClicks(val)} isMobile={isMobile}/>
        }
        <div className="flex">
          {!isMobile ? (
            <Servicessidenavbar
              onRegionChange={handleCountryChange}
              onSearchChange={handleSearchChange}
              onCapabilityChange={onCapabilityChange}
              // onEventChange={onEventUpdated}
              setCurrentSelectedEvents={setCurrentSelectedEvents}
              SelectedEvents={currentSelectedEvents}
              onCompanysizeChange={handleCompanySizes}
              handlePlatformChange={handlePlatformChange}
              removedsearchvalues={removedsearchvalues}
              removedregionsearchvalues={removedregionsearchvalues}
              removedcompanysizesearchvalues={removedCompanySizeSearchValue}
              removedEventsValues={removedEvents}
              removedPlatformValues={removedPlatform}
              handleCapabilityChangeValues={addedSponseredServices}
            ></Servicessidenavbar>
          ) : (
            <MobileViewServiceProviderSideBar
              onRegionChange={handleCountryChange}
              onSearchChange={handleSearchChange}
              onCapabilityChange={onCapabilityChange}
              // onEventChange={onEventUpdated}
              onCompanysizeChange={handleCompanySizes}
              removedsearchvalues={removedsearchvalues}
              removedregionsearchvalues={removedregionsearchvalues}
              removedcompanysizesearchvalues={removedCompanySizeSearchValue}
              openServiceModal={openServiceModal}
              setOpenServiceModal={setOpenServiceModal}
              removedEventsValues={removedEvents}
              handlePlatformChange={handlePlatformChange}
              removedPlatformValues={removedPlatform}
              handleCapabilityChangeValues={addedSponseredServices}
              setCurrentSelectedEvents={setCurrentSelectedEvents}

            />
          )}

          <div className="px-4 sm:ml-0 lg:ml-0 md:ml-0 w-full width_1024divice">
            <div className="lg:px-4 relative">
              <div className="pb-6 pt-6 breadcrumbs_s">
                <Breadcrumbs items={breadcrumbItems} />
              </div>
              {/* Desktop ad Banner */}
              {
                bannerAdImage && bannerAdImage.length > 0 &&
                <div className="small_banner">
                  <FadeSlider images={bannerAdImage} webUrl={webUrl} onClickBannerAdClicks={(val: number) => bannerAdClicks(val)} />
                </div>
              }
              {/* {bannerAdImage && bannerAdImage.map((imageData, index: number) =>
              (<div className="small_banner">
                <Link target={`${imageData.adURL.startsWith(webUrl) ? '_self' : '_blank'}`} href={imageData.adURL ? (imageData.adURL.startsWith('http://') || imageData.adURL.startsWith('https://') ? imageData.adURL : `https://${imageData.adURL}`) : '#'} onClick={() => bannerAdClicks(imageData.id)}>
                  {imageData.adImagePath && index == 0 &&
                    <img src={imageData.adImagePath} />
                  }

                </Link>
                <div className="flex flex-row-reverse text-xs pr-1"><Link target="_blank" className="advertise_banner" href="mailto:info@xds-spark.com?subject=XDS Spark - Banner Ad Enquiry">
                  {"Advertise on Spark"}
                </Link></div>
              </div>)
              )
              } */}


              {/* Mobile ad banners */}
              {/* <div className="ad_banner_home_mobile pb-6">
                <img src="/mobile_banner.jpg" />
              </div> */}
              <div className="sm:flex sm:items-center sm:justify-between">
                <div className="sm:text-left">
                  <h1 className="font-bold default_text_color header-font">
                    Browse Service Providers
                  </h1>
                </div>
              </div>
              <div className="py-6">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-8">
                  <form
                    className="flex items-start serviceprovidersearch"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSearchButton();
                    }}
                  >
                    <label htmlFor="voice-search" className="sr-only">
                      Search
                    </label>
                    <div className="relative lg:w-full w-[240px]">
                      <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 12 12"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g id="&#226;&#152;&#160;&#239;&#184;&#143; Icon / Color">
                            <path
                              id="Union"
                              d="M8.45324 8.98349L11.3571 11.8881C11.4306 11.9608 11.5266 11.9976 11.6226 11.9976C11.7186 11.9976 11.8146 11.9608 11.8881 11.8881C12.0343 11.7411 12.0343 11.5041 11.8881 11.3571L9.21461 8.6843C11.0001 6.6243 10.9145 3.49228 8.95782 1.53506C6.91083 -0.511688 3.58017 -0.511688 1.53468 1.53506C-0.511559 3.58181 -0.511559 6.91331 1.53468 8.96006C2.52668 9.95156 3.84485 10.4976 5.24625 10.4976C5.4532 10.4976 5.62116 10.3296 5.62116 10.1226C5.62116 9.91556 5.4532 9.74756 5.24625 9.74756C4.0443 9.74756 2.91508 9.27956 2.0648 8.42981C0.310985 6.67481 0.310985 3.82031 2.0648 2.06531C3.81786 0.310313 6.67164 0.311063 8.4277 2.06531C10.1815 3.82031 10.1815 6.67481 8.4277 8.42981C8.28149 8.57606 8.28149 8.81381 8.4277 8.96006C8.43594 8.96834 8.44446 8.97615 8.45324 8.98349Z"
                              fill="#343741"
                            />
                          </g>
                        </svg>
                      </div>
                      <input
                        type="search"
                        id="input-search"
                        // value={inputValue}
                        // onChange={handleInputChange}
                        onInput={(e) => {
                          if (e.currentTarget.value == "") {
                            handleInputtoRemove();
                          }
                        }}
                        className="bg-gray-50 border border-gray-300 default_text_color text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2"
                        placeholder="Search for Service Providers"
                        autoComplete="off"
                        required
                      />
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={handleSearchButton}
                        className="button_blue inline-flex items-center py-2 lg:px-6 px-2 ms-2 text-sm  text-white  rounded-lg border border-blue-400 hover:bg-gray-200 focus:ring-0 focus:outline-none"
                      >
                        Search
                      </button>
                      <div className="absolute -right-7 top-1.5">
                        <Tooltip
                          content="Search within company name, services, company description and project highlights."
                          className="tier_tooltip "
                        >
                          <svg
                            className="w-[22px] h-[22px] text-gray-600 dark:text-white"
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
                          {" "}
                        </Tooltip>
                      </div>
                    </div>
                  </form>
                </div>
                {(allsearchesvalues?.InputsearchValue.length ||
                  //  allsearchesvalues?.servicesearchValue.length ||
                  allsearchesvalues?.countrySearchValue.length ||
                  allsearchesvalues?.companySizeSearchValue.length ||
                  selectedCapabilities != "{}" && selectedCapabilities.length > 0 ||
                  isPremiumUsersOnly ||
                  (currentSelectedEvents && currentSelectedEvents.length > 0) || !isLoadedFirst) &&
                  <div className="flex items-center pt-3">
                    <input id="default-checkbox" type="checkbox" onClick={() => { setIsPremiumUsersOnly((prevStatus) => !prevStatus), localStorage.setItem("prevIsPremiumUsersOnly", isPremiumUsersOnly ? "False" : "True") }} checked={isPremiumUsersOnly} value="" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2 " />
                    <label htmlFor="default-checkbox" className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">Premium Members Only</label>
                    <Tooltip
                      content="Display Premium members only in results, as they are likely to have more complete profiles."
                      className="tier_tooltip "
                    >
                      <svg
                        className="w-[16px] h-[16px] text-gray-600 ml-1"
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
                    </Tooltip>
                  </div>
                }
                <div className="flex flex-wrap gap-2 pt-6" key={`inputValues`}>
                  {inputValue ? (
                    <Badge color="gray" size="xs" key={`inputValue`}>
                      Search: {inputValue}
                      <Image
                        onClick={handleInputtoRemove}
                        src="/cross.svg"
                        className="w-3 h-3 inline-flex ms-1 cross_icon"
                        alt=""
                        width={12}
                        height={12}
                      />
                    </Badge>
                  ) : null}

                  {servicesearchvalues && Object.keys(servicesearchvalues).map((searchitem, index) => (
                    <>
                      <Badge key={`searchitem-${index}`} color="gray" size="xs">
                        {searchitem}
                        <Image
                          onClick={() => handleServiceSearchItems(searchitem, "")}
                          src="/cross.svg"
                          className="w-3 h-3 inline-flex ms-1 cross_icon"
                          alt=""
                          width={12}
                          height={12}
                        />
                      </Badge>


                      {servicesearchvalues[searchitem].filter((emptyVlaues) => emptyVlaues != "").map((caps, index) => (
                        <Badge key={`searchitem-${index}`} color="gray" size="xs">
                          {caps}
                          <Image
                            onClick={() => handleServiceSearchItems(searchitem, caps)}
                            src="/cross.svg"
                            className="w-3 h-3 inline-flex ms-1 cross_icon"
                            alt=""
                            width={12}
                            height={12}
                          />
                        </Badge>
                      ))}
                    </>
                  ))}

                  {RegionSearchValuesForBadge?.map((country, index) => (
                    <Badge key={`region-search${index}`} color="gray" size="xs">
                      {country}
                      <Image
                        onClick={() => handleRegionSearchItems(country)}
                        src="/cross.svg"
                        className="w-3 h-3 inline-flex ms-1 cross_icon"
                        alt=""
                        width={12}
                        height={12}
                      />
                    </Badge>
                  ))}

                  {CompanySizeSearchValuesForBadge?.map((company_size, index) => (
                    <Badge key={`companysize-${index}`} color="gray" size="xs">
                      {company_size}
                      <Image
                        onClick={() =>
                          handleRemoveCompanySizeSearchItems(company_size)
                        }
                        src="/cross.svg"
                        className="w-3 h-3 inline-flex ms-1 cross_icon"
                        alt=""
                        width={12}
                        height={12}
                      />
                    </Badge>
                  ))}

                  {currentSelectedEvents?.map((eventsSelected) => (
                    <Badge key={`companyEvents-${eventsSelected.id}`} color="gray" size="xs">
                      {eventsSelected.name}
                      <Image
                        onClick={() =>
                          handleRemoveEvents(eventsSelected.id)
                        }
                        src="/cross.svg"
                        className="w-3 h-3 inline-flex ms-1 cross_icon"
                        alt=""
                        width={12}
                        height={12}
                      />
                    </Badge>
                  ))}
                  {selectedPlatformsForBadge?.map((platfromselected) => (
                    <Badge key={`companyplatforms_${platfromselected.id}`} color="gray" size="xs">
                      {platfromselected.name}
                      <Image
                        onClick={() =>
                          handleRemovePlatform(platfromselected)
                        }
                        src="/cross.svg"
                        className="w-3 h-3 inline-flex ms-1 cross_icon"
                        alt=""
                        width={12}
                        height={12}
                      />
                    </Badge>
                  ))}

                  {allsearchesvalues?.InputsearchValue.length ||
                    //  allsearchesvalues?.servicesearchValue.length ||
                    allsearchesvalues?.countrySearchValue.length ||
                    allsearchesvalues?.companySizeSearchValue.length ||
                    selectedPlatformsForBadge.length > 0 ||
                    selectedCapabilities != "{}" && selectedCapabilities.length > 0 ||
                    currentSelectedEvents && currentSelectedEvents.length > 0 ? (
                    <Badge
                      size="xs"
                      onClick={removeAllSearchItems}
                      className="bg_none text_blue underline cursor-pointer"
                    >
                      Clear All
                    </Badge>
                  ) : null}
                </div>

                <AddtoMyList
                  updatedAddto={updatedAddto}
                  onVisibilityChange={(val: boolean) => setUpdatedAddto(val)}
                  selectedCompanies={selectedCompanies}
                  setIsAddtoCompleted={setIsAddtoCompleted}
                ></AddtoMyList>
                {allsearchesvalues?.InputsearchValue.length ||
                  //  allsearchesvalues?.servicesearchValue.length ||
                  allsearchesvalues?.countrySearchValue.length ||
                  allsearchesvalues?.companySizeSearchValue.length ||
                  selectedCapabilities != "{}" && selectedCapabilities.length > 0 ||
                  isPremiumUsersOnly ||
                  !isLoadedFirst ||
                  selectedPlatformsForBadge.length > 0 ||
                  (currentSelectedEvents && currentSelectedEvents.length > 0) ?
                  <Serviceproviderslist
                    isPremiumUsersOnly={isPremiumUsersOnly}
                    searchValues={allsearchesvalues}
                    onVisibilityChange={(val: boolean) => setUpdatedAddto(val)}
                    onFilterChange={(val: boolean) => setOpenServiceModal(val)}
                    updatedAddtoProps={updatedAddto}
                    setsortCustomColumn={setsortCustomColumn}
                    sortCustomColumn={sortCustomColumn}
                    setsortCustomColumnField={setsortCustomColumnField}
                    sortCustomColumnField={sortCustomColumnField}
                    sendselectedCompanies={(companies) =>
                      setselectedCompanies(companies)
                    }
                    clearAddtoCompanies={isAddtoCompleted}
                    generateLinkUser={generateshareLinkUser}
                  ></Serviceproviderslist>

                  :
                  <div className="pos_r">
                    <div className=""><hr /></div>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5 sm:grid-cols-3 py-6 ">
                      {sponseredServices && sponseredServices.map((servicesSP) => (
                        <ServicesGrid key={`sponseredServices_${servicesSP.Services.id}`} sponseredServices={servicesSP} onClick={() => { handleSponseredServices(servicesSP.Services.id, servicesSP.Services.serviceName) }}></ServicesGrid>
                      ))
                      }

                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default Serviceproviders;
