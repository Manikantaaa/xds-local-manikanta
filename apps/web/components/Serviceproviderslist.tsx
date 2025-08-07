"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import DataTable, { SortOrder, TableColumn } from "react-data-table-component";
import Image from "next/image";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { authFetcher, authPostdata, fetcher } from "@/hooks/fetcher";
import Spinner from "@/components/spinner";
import { Button, Modal, Tooltip } from "flowbite-react";
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { useUserContext } from "@/context/store";
import Pagination from "@/components/custompagination";
import "../public/css/detatable.css";
import { PATH } from "@/constants/path";
import { redirect } from "next/navigation";
import { serviceColoring } from "@/constants/serviceColors";
import { BodyMessageType } from "@/constants/popupBody";
import FreeTierAlerts from "./ui/freeTierAlerts";
import axios from "axios";
import { useRandomDataContext } from "@/context/random-data-store";
import { useRouter } from "next/navigation";
import ColumnsFilter from "./columnsFilter";
import { ApiResponse, ServiceProvidersListProps, ShuffleListPostData } from "@/types/serviceprovidersidebar.type";
import { fallbackCopyToClipboard } from "@/services/common-methods"
import ButtonSpinner from "./ui/buttonspinner";

const Serviceproviderslist = (searchValuesProps: ServiceProvidersListProps) => {

  const subject = "Enquiry from XDS Spark";
  const body = "“This email was originally generated from XDS Spark”";

  const { user } = useUserContext();
  const { companyCounts, setCompanyCounts } = useRandomDataContext();
  const [selctedCompanyCounts, setSelctedCompanyCounts] = useState<number>(0);
  const router = useRouter();
  if (!user) {
    redirect(PATH.HOME.path);
  }

  const [pending, setPending] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [isVisible, setIsVisible] = useState<boolean | undefined>(false);
  const [data, setData] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([]);
  const [isAllSelected, setIsAllSelected] = useState<boolean>(false);
  const [unSelectedCompanies, setUnselectedCompanies] = useState<number[]>([]);
  const [disableGenerateLink, setDisableGenerateLink] = useState<boolean>(true);
  // new states
  const [page, setPage] = useState(0);
  const [totalRows, setTotalRows] = useState(0);

  let recordsPerPage = 25;
  if (localStorage.getItem("recordsPerPage")) {
    recordsPerPage = Number(localStorage.getItem("recordsPerPage"));
  }
  const [pageSize, setPageSize] = useState(recordsPerPage);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filteredCompanies, setFilteredCompanies] = useState<number[]>([]);
  //
  const [SortField, setSortField] = useState<string>("");

  //
  const [openPopup, setOpenPopup] = useState<boolean>(false);
  const [popupMessage, setPopupMessage] = useState<BodyMessageType>('DEFAULT');
  const [updatedColumns, setUpdatedColumns] = useState<TableColumn<ApiResponse>[]>([])
  const [columnNamesOrder, setColumnNamesOrder] = useState<{ id: string; visible: boolean }[]>([]);
  const [openListCopyAndShareModal, setOpenListCopyAndShareModal] = useState<boolean>(false);
  const [textCopied, setTextCopied] = useState(false);
  const [copyLinkError, setCopyLinkError] = useState<string>("");
  const [buttonLoader, setButtonLoader] = useState<boolean>(false);

  const [getToken, setGetToken] = useState<string>("");
  

  const servicesearch =
    searchValuesProps.searchValues?.servicesearchValue || "";
  const inputsearch = searchValuesProps.searchValues?.InputsearchValue || localStorage.getItem('inputsearchvalue') || "";
  const regionsearch = searchValuesProps.searchValues?.countrySearchValue || "";
  const companysizesearch =
    searchValuesProps.searchValues?.companySizeSearchValue || "";
  const rowsPerPageOptions = [25, 50, 100, 150];

  const [isSelectAllReset, setisSelectAllReset] = useState<boolean>(true);
  const defaultHideColumns = ["contact_info", "game_engines", "performance_ratings", "country", "partner_status"];


  const columns = [
    {
      name: <>
        <div className="text-blue-300">
          <label htmlFor={`checkbox-item-all`} className="sr-only">
            Checkbox Label
          </label>
          <input
            id={`checkbox-item-all`}
            type="checkbox"
            disabled = {true}
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="w-4 h-4 checkboxspall bg-gray-100 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-0 dark:bg-gray-600 dark:border-gray-500"
          />
        </div>
        
        {/* <div className="flex items-center mb-4"><input disabled id="disabled-checkbox" type="checkbox" value="" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" /><label className="ms-2 text-sm font-medium text-gray-400 dark:text-gray-500">Disabled checkbox</label></div> */}
        </>,
      id: "checkboxsp",
      cell: (row: ApiResponse) => (
        <div className="text-blue-300">
          <label htmlFor={`checkbox-item-${row.id}`} className="sr-only">
            Checkbox Label
          </label>
          <input
            id={`checkbox-item-${row.id}`}
            type="checkbox"
            onChange={(e) => handleSelectedCompanies(row.id, e.target.checked)}
            className="w-4 h-4 checkboxsp text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-0 dark:bg-gray-600 dark:border-gray-500"
          />
        </div>
      ),
    },
    {
      name: "Logo",
      id: "logo",
      cell: (row: ApiResponse) => (
        <div className="text-blue-300 serviceprovider_logo_thumb">
          <Image
            src={row.logoAsset?.url || "/circle-no-image-available.jpg"}
            className="w-10"
            alt=""
            width={210}
            height={210}
          />
        </div>
      ),
      omit: !columnNamesOrder.some((value) => value.id === "logo" && value.visible)
    },
    {
      name: "Name",
      id: "name",
      cell: (row: ApiResponse) => (
        <div className="text-blue-300">
          <Link prefetch={false} href={`/serviceproviders-details/${row.slug}`}> {row.name} </Link>
        </div>
      ),
      sortable: true,
      omit: !columnNamesOrder.some((value) => value.id === "name" && value.visible),
      sortFunction: (a: ApiResponse, b: ApiResponse) =>
        a.name.localeCompare(b.name),
    },
    {
      name: (
        <>
          Tier{" "}
          <Tooltip
            content="Represents Premier members that may have a completed profile."
            className="tier_tooltip"
          >
            <svg
              className="w-4 h-4 text-gray-800 ml-2 cursor-pointer xs_mobile_hide"
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
          </Tooltip>{" "}
        </>
      ),
      id: "tier",
      omit: !columnNamesOrder.some((value) => value.id === "tier" && value.visible),
      cell: (row: ApiResponse) =>
        (row && row.user?.isPaidUser) ? (
          <div className="text-center">

            <Image
              alt=""
              data-nimg="1"
              loading="lazy"
              width="20"
              height="20"
              decoding="async"
              src="/tier-cup.svg"
            />
          </div>
        ) : (
          "-"
        ),
      sortable: true,
      sortFunction: (a: ApiResponse, b: ApiResponse) =>
        (a.user?.isPaidUser ? 1 : 0) - (b.user?.isPaidUser ? 1 : 0)
    },
    {
      name: 'Following',
      id: "following",
      omit: ((!columnNamesOrder.some((value) => value.id === "following" && value.visible)) || (user.userRoles[0].roleCode != 'buyer')),
      cell: (row: ApiResponse) =>
        (row && row.followedCompanies[0]?.companyId) ? (
          <div className="text-center">
            <svg className="w-[22px] h-[22px] text-gray-800 dark:text-white" aria-hidden="true" xmlns="
            http://www.w3.org/2000/svg"
            width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="#0071c2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5.365V3m0 2.365a5.338 5.338 0 0 1 5.133 5.368v1.8c0 2.386 1.867 2.982 1.867 4.175 0 .593 0 1.292-.538 1.292H5.538C5 18 5 17.301 5 16.708c0-1.193 1.867-1.789 1.867-4.175v-1.8A5.338 5.338 0 0 1 12 5.365ZM8.733 18c.094.852.306 1.54.944 2.112a3.48 3.48 0 0 0 4.646 0c.638-.572 1.236-1.26 1.33-2.112h-6.92Z"/>
            </svg>
          </div>
        ) : (
          "-"
        ),
      sortable: true,
      sortFunction: (a: ApiResponse, b: ApiResponse) =>
        (a.followedCompanies[0]?.companyId ? 1 : 0) - (b.followedCompanies[0]?.companyId ? 1 : 0)
    },
    {
      name: "Core Services",
      id: "core_services",
      omit: !columnNamesOrder.some((value) => value.id === "core_services" && value.visible),
      cell: (row: ApiResponse) => (
        <div className="text-blue-300 space-y-1">
          {row.ServicesOpt?.slice(0, 3).map(
            (services, index) =>
              services.service &&
              services.service.serviceName && (
                <span key={index} className=" inline-block">
                  <button
                    type="button"
                    className={`text-gray-900 bg_${serviceColoring[services.service.groupId]} focus:outline-none font-medium rounded-sm text-sm px-2 py-1 me-2 cursor-default`}
                  >
                    {services.service && services.service.serviceName}
                  </button>
                </span>
              ),
          )}
        </div>
      ),
    },

    {
      name: `Company Size`,
      id: "company_size",
      omit: !columnNamesOrder.some((value) => value.id === "company_size" && value.visible),
      cell: (row: ApiResponse) => row.companySizes?.size,
    },
    {
      name: "Website",
      id: "website",
      omit: !columnNamesOrder.some((value) => value.id === "website" && value.visible),
      cell: (row: ApiResponse) => (
        <div className="text-blue-300 whte_nowrap w-[150px]">
          <Link prefetch={false} href={row.website.startsWith('http://') || row.website.startsWith('https://') ? row.website : `https://${row.website}`} target="__blank" title={row.website}>
            {row.website}
          </Link>
        </div>
      ),

    },
    {
      name: "Country",
      id: "country",
      omit: !columnNamesOrder.some((value) => value.id === "country" && value.visible),
      cell: (row: ApiResponse) => {
        if (row.CompanyAddress) {
          const countriesToShow = row.CompanyAddress.slice(0, 3);
          const uniqueCountryNames = new Set();
          const uniqueAddresses = countriesToShow.filter(address => {
            if (uniqueCountryNames.has(address.Country.name)) {
              return false;
            } else {
              uniqueCountryNames.add(address.Country.name);
              return true;
            }
          })
          const countryNames = uniqueAddresses.map((countries) => countries.Country?.name).join(", ");
          return (
            <span>
              {countryNames}
              {row.CompanyAddress.length > 3 && "..."}
            </span>
          );
        }

        return "";
      },
      sortable: true,
      sortFunction: (a: ApiResponse, b: ApiResponse) => {
        const countryNamesA =
          a.CompanyAddress.map((countries) => countries.Country.name).join(
            ", ",
          ) || "";
        const countryNamesB =
          b.CompanyAddress.map((countries) => countries.Country.name).join(
            ", ",
          ) || "";

        return countryNamesA.localeCompare(countryNamesB);
      },
    },
    {
      id: "partner_status",
      name:
        <>
          Partner Status{" "}
          <Tooltip
            content="The status that Service Providers hold with your company, as per your input in the My Spark tab."
            className="tier_tooltip"
          >
            <svg
              className="w-4 h-4 text-gray-800 ml-2 cursor-pointer xs_mobile_hide"
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
          </Tooltip>{" "}
        </>,
      omit: !user?.isPaidUser || !columnNamesOrder.some((value) => value.id === "partner_status" && value.visible),
      cell: (row: ApiResponse) => {
        return (row?.sPBuyerCompanyRatings[0]?.prefferedPartner) ? (row?.sPBuyerCompanyRatings[0]?.prefferedPartner === "yes") ? <Tooltip content="Considered a top-tier partner with a successful track record." trigger="hover">
          <svg className="w-[28px] h-[28px] text-green-500 m-[1.5px]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
            <path fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm13.707-1.293a1 1 0 0 0-1.414-1.414L11 12.586l-1.793-1.793a1 1 0 0 0-1.414 1.414l2.5 2.5a1 1 0 0 0 1.414 0l4-4Z" clip-rule="evenodd" />
          </svg>
        </Tooltip> : (row?.sPBuyerCompanyRatings[0]?.prefferedPartner == "inprogress") ?
          <Tooltip content="Assessment may not have begun, or is in progress." trigger="hover"> <svg className="w-[32px] h-[32px] inprogress_2" fill="#d22824" xmlns="http://www.w3.org/2000/svg" data-name="Layer 1" viewBox="0 0 100 125" x="0px" y="0px">
            <path d="M50,3.44A46.56,46.56,0,1,0,96.56,50,46.55,46.55,0,0,0,50,3.44Zm6.61,51.37A22.08,22.08,0,0,1,71.82,72.59,2.86,2.86,0,0,1,69,75.87H31a2.86,2.86,0,0,1-2.84-3.28A22.09,22.09,0,0,1,43.39,54.81,4,4,0,0,0,46.21,51v-1.9a4,4,0,0,0-2.82-3.86A22.09,22.09,0,0,1,28.18,27.41,2.86,2.86,0,0,1,31,24.13H69a2.86,2.86,0,0,1,2.84,3.28A22.08,22.08,0,0,1,56.61,45.19a4.05,4.05,0,0,0-2.82,3.87v1.88A4.05,4.05,0,0,0,56.61,54.81Z" /></svg></Tooltip>
          : (row?.sPBuyerCompanyRatings[0]?.prefferedPartner == "no") ?
            <Tooltip content="Approved for work with your company." trigger="hover"><svg className="w-[24px] h-[24px] ml-1" fill="#f5700c" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="minus_"><path d="m256 0c-141.38 0-256 114.62-256 256s114.62 256 256 256 256-114.62 256-256-114.62-256-256-256zm131.5 256a37.69 37.69 0 0 1 -37.69 37.69h-187.62a37.69 37.69 0 0 1 -37.69-37.69 37.69 37.69 0 0 1 37.69-37.69h187.62a37.69 37.69 0 0 1 37.69 37.69z" /></g></g></svg></Tooltip> : "-" : "-"


      },
      sortable: true,
    },
    {
      name: "Contact Info",
      id: "contact_info",
      omit: !columnNamesOrder.some((value) => value.id === "contact_info" && value.visible),
      cell: (row: ApiResponse) =>
        <div>
          {row.CompanyContacts.length > 0 ?
            row.CompanyContacts[0].name + " | " : ''}
          {row.CompanyContacts.length > 0 && (
            <p> <Link className="text-blue-300" href={`mailto:${row.CompanyContacts[0].email}?subject=${subject}&body=${body}`} target="_blank" onClick={() => updateConacted(user?.companyId, row.id)}>
              {row.CompanyContacts[0].email}
            </Link></p>
          )}
        </div>,
      sortable: true,
      sortFunction: (a: ApiResponse, b: ApiResponse) =>
        (a.website ?? "").localeCompare(b.website ?? ""),
    },
    {
      name: "Game Engines",
      id: "game_engines",
      omit: !columnNamesOrder.some((value) => value.id === "game_engines" && value.visible),
      cell: (row: ApiResponse) => row.CompanyGameEngines.length > 0 && `${row.CompanyGameEngines.map((engine) => engine.gameEngineName).join(', ')}`,
      sortable: false,
      // sortFunction: (a: ApiResponse, b: ApiResponse) =>
      //   (a.website ?? "").localeCompare(b.website ?? ""),
    },
    {
      name: "Performance Ratings",
      id: "performance_ratings",
      omit: !columnNamesOrder.some((value) => value.id === "performance_ratings" && value.visible),
      cell: (row: ApiResponse) => {
        // Calculate the average overallRating
        // const avgOverallRating = row.sPBuyerprojectcompanyId.reduce((acc, curr) => {
        //   return acc + (curr.overallRating || 0);
        // }, 0) / row.sPBuyerprojectcompanyId.length;
        const avgOverallRating = row.sPBuyerCompanyRatings[0]?.avgPerformanceRating ? row.sPBuyerCompanyRatings[0]?.avgPerformanceRating : 0;

        return (
          <div className="performance_ratings">
            {avgOverallRating > 0 ? (
              <>
                {Array.from({ length: 5 }).map((_, index) => (
                  <span
                    key={index}
                    className={`rate_card ${index < avgOverallRating
                      ? avgOverallRating <= 2
                        ? 'star_red'
                        : avgOverallRating <= 4
                          ? 'star_orange'
                          : 'star_green'
                      : ''
                      } w-[21px] h-[21px]`}
                  ></span>
                ))}
              </>
            ) : (
              <div className="inline-flex items-center text-base">
                -
              </div>
            )}
          </div>
        );
      },
      sortable: true,
      sortFunction: (a: ApiResponse, b: ApiResponse) =>
        (a.website ?? "").localeCompare(b.website ?? ""),
    },
  ];

  function updateConacted(loggedCompanyId: number, providerCompanyId: number) {
    authFetcher(`${getEndpointUrl(ENDPOINTS.buyerContacted(loggedCompanyId, providerCompanyId, "contactLink"))}`);
  }

  const tableHeaderstyle = {
    headCells: {
      style: {
        fontWeight: "bold",
        fontSize: "14px",
        backgroundColor: "#F1F4FA",
      },
    },
  };

  const isEmptyObject = (obj: string | {[serviceName: string]: string[]}) => {
    return Object.entries(obj).length === 0;
  };

  // Useeffect Starts here
  useEffect(() => {

    let PreviousCompanySizes = "";
    const LocalPreviousCompanySizes = localStorage.getItem("oldCompanySizes");
    if (LocalPreviousCompanySizes) {
      PreviousCompanySizes = JSON.parse(LocalPreviousCompanySizes);
    } else {
      PreviousCompanySizes = "";
    }

    let PreviousCountriesSearch = "";
    const LocalPrevCountrySearch = localStorage.getItem("previouscountrysearch");
    if (LocalPrevCountrySearch) {
      PreviousCountriesSearch = JSON.parse(LocalPrevCountrySearch);
    } else {
      PreviousCountriesSearch = "";
    }
    const selectedEvents = localStorage.getItem('StoredEvents');
    console.log(searchValuesProps.searchValues?.currentSelectedEvents, inputsearch, servicesearch, companysizesearch, regionsearch, searchValuesProps.isPremiumUsersOnly, searchValuesProps.searchValues?.selectedPlatforms);
    if( searchValuesProps.searchValues?.currentSelectedEvents.length == 0 && inputsearch == "" && (servicesearch == "" || isEmptyObject(servicesearch)) && companysizesearch == "" && regionsearch == "" && searchValuesProps.isPremiumUsersOnly == false && searchValuesProps.searchValues?.selectedPlatforms?.length == 0){
      setDisableGenerateLink(true);
    } else {
      setDisableGenerateLink(false);
    }
    // let previousServiceSearch = "";
    // const localPrevServiceSearch = localStorage.getItem("previousServiceSearches")
    // if (localPrevServiceSearch) {
    //   previousServiceSearch = JSON.parse(localPrevServiceSearch);
    // }
    // let selectedCapabilities = "";
    // const localSelectedCapabilities = localStorage.getItem("selectedServiceCapabilities")
    // if (localSelectedCapabilities) {
    //   selectedCapabilities = localSelectedCapabilities;
    // } 
    let selectedCapabilityId = "";
    const localSelectedCapabilityId = localStorage.getItem("selectedIdServiceCapabilities")
    if (localSelectedCapabilityId) {
      selectedCapabilityId = localSelectedCapabilityId;
    }
    let isPremiumUsersOnly = false;
    const premiumUsers = localStorage.getItem("prevIsPremiumUsersOnly")
    if (premiumUsers) {
      if (premiumUsers === "True")
        isPremiumUsersOnly = true;
    }

    let recordsPerPage = 25;
    if (localStorage.getItem("recordsPerPage")) {
      recordsPerPage = Number(localStorage.getItem("recordsPerPage"));
    }

    let eventSelectedValues = "";
    if (searchValuesProps.searchValues?.currentSelectedEvents && searchValuesProps.searchValues?.currentSelectedEvents.length > 0) {
      eventSelectedValues = JSON.stringify(searchValuesProps.searchValues?.currentSelectedEvents);
    } else {
      const LocalEventValues = localStorage.getItem("StoredEvents");
      if (LocalEventValues) {
        eventSelectedValues = LocalEventValues;
      }
    }
    let platformSelectedValues = "";
    if (searchValuesProps.searchValues?.selectedPlatforms && searchValuesProps.searchValues?.selectedPlatforms.length > 0) {
      platformSelectedValues = JSON.stringify(searchValuesProps.searchValues?.selectedPlatforms);
    } else {
      const LocalPlatformstValues = localStorage.getItem("oldPlatforms");
      if (LocalPlatformstValues && LocalPlatformstValues != "[]") {
        platformSelectedValues = LocalPlatformstValues;
      }
    }
    setPending(true);
    
    //
    const source = axios.CancelToken.source();
    async function getserviceprovidersList() {

      if (
        inputsearch == "" &&
        (servicesearch == "" || (typeof (servicesearch) == "object" && Object.keys(servicesearch).length <= 0)) &&
        companysizesearch == "" &&
        regionsearch == "" &&
        SortField == "" &&
        (searchValuesProps.isPremiumUsersOnly == false || searchValuesProps.isPremiumUsersOnly == null) &&
        PreviousCompanySizes == "" &&
        PreviousCountriesSearch == "" &&
        searchValuesProps.sortCustomColumn == "" &&
        searchValuesProps.sortCustomColumnField == "" &&
        (eventSelectedValues == "[]" || eventSelectedValues == "" || eventSelectedValues.length == 0) &&
        (platformSelectedValues == "[]" || platformSelectedValues == "" || platformSelectedValues.length == 0) &&
        (selectedCapabilityId == "{}" || selectedCapabilityId == "" || selectedCapabilityId.length == 0)
      ) {
        let needsSuffle = 0;
        const currentDate = new Date();
        const currentDateString = currentDate.toDateString();
        const lastExecutedDateString = localStorage.getItem('lastExecutedDate');
        handleSelectAll(false, false)
        setFilteredCompanies([]);
        if (currentDateString !== lastExecutedDateString) {
          needsSuffle = 1;
          localStorage.setItem('lastExecutedDate', currentDateString);
        }
        if (needsSuffle == 1) {
          const spsList = await authPostdata<ShuffleListPostData>(`${getEndpointUrl(ENDPOINTS.getServiceProviderShuffle)}`, { listIds: [], needsSuffle: needsSuffle, recordsPerPage }).catch((err) => {
            setPending(false);
          });
          setPending(false);
          setData(spsList.list);
          setTotalRows(spsList.totalpages);
          setTotalPages(Math.ceil(spsList.totalpages / recordsPerPage));
          if (spsList.shuffledIds && spsList.shuffledIds.length > 0) {
            localStorage.setItem("sPsListId", JSON.stringify(spsList.shuffledIds))
          }
        } else {
          let sPsListIds = [];
          let listString: string | null = "";
          if (localStorage.getItem("sPsListId") && localStorage.getItem("sPsListId") != "") {
            listString = localStorage.getItem("sPsListId");
          }
          if (listString) {
            sPsListIds = JSON.parse(listString);
          }
          if (sPsListIds && sPsListIds.length > 0) {
            const theList = getTheListToSend(sPsListIds, page, recordsPerPage);
            theList.filter(item => item)
            const spsList = await authPostdata<ShuffleListPostData>(`${getEndpointUrl(ENDPOINTS.getServiceProviderShuffle)}`, { listIds: theList, needsSuffle: needsSuffle, recordsPerPage }).catch((err) => {
              console.log(err);
              setPending(false);
            });
            setPending(false);
            setData(spsList.list);
            setTotalRows(sPsListIds.length);
            setTotalPages(Math.ceil(sPsListIds.length / recordsPerPage));
          }
          setPending(false);
        }
      } else {
        
        if(isSelectAllReset){
          handleSelectAll(false, false);
        }else{
          setisSelectAllReset(true);
        }
        const response = await fetcher(
          getEndpointUrl(
            ENDPOINTS.getserviceproviders(
              encodeURIComponent(inputsearch),
              page,
              recordsPerPage,
              //    encodeURIComponent(previousServiceSearch),
              PreviousCompanySizes,
              PreviousCountriesSearch,
              SortField,
              searchValuesProps.sortCustomColumn,
              searchValuesProps.sortCustomColumnField,
              //    encodeURIComponent(selectedCapabilities) || "",
              encodeURIComponent(selectedCapabilityId) || "",
              isPremiumUsersOnly,
              eventSelectedValues,
              encodeURIComponent(platformSelectedValues),
            ),
          ), source.token,
        ).catch(error => {

        }).finally(() => {
          setPending(false)
        });
        if (response && response.success) {
          setData(response.list);
          setTotalRows(response.totalpages);
          setTotalPages(Math.ceil(response.totalpages / pageSize));
          setFilteredCompanies(response.currentSearchCompanyIds);
        } else {
          if (!response) { setPending(true) };
          console.log(`Api responded with statuscode ${response && response.statusCode}`);
        }
      }
    }
    getserviceprovidersList();
    return () => {
      source.cancel('Operation canceled by the user.');
    };
  }, [
    inputsearch,
    page,
    pageSize,
    servicesearch,
    companysizesearch,
    regionsearch,
    SortField,
    searchValuesProps.searchValues?.selectedCapabilities,
    searchValuesProps.sortCustomColumn,
    searchValuesProps.sortCustomColumnField,
    searchValuesProps.isPremiumUsersOnly,
    searchValuesProps.searchValues?.currentSelectedEvents,
    searchValuesProps.searchValues?.selectedPlatforms,
  ]);

  useEffect(()=>{
    if(data.length == 0){
      setDisableGenerateLink(true);
    }
  },[data])

  useEffect(() => {
    if (searchValuesProps.clearAddtoCompanies) {
      setSelectedCompanies([]);
      setUnselectedCompanies([]);
      setSelctedCompanyCounts(0);
      setIsAllSelected(false);
      setCompanyCounts(0);
      searchValuesProps.sendselectedCompanies([]);
      const checkboxes = document.getElementsByClassName('checkboxsp') as HTMLCollectionOf<HTMLInputElement>;
      Array.from(checkboxes).forEach(checkbox => {
        checkbox.checked = false;
      });
      const checkboxesall = document.getElementsByClassName('checkboxspall') as HTMLCollectionOf<HTMLInputElement>;
      Array.from(checkboxesall).forEach(checkbox => {
        checkbox.checked = false;
      });
      localStorage.setItem("comparingCompanies", JSON.stringify([]));
    }
  }, [searchValuesProps.clearAddtoCompanies]);
  useEffect(() => {
    setIsVisible(searchValuesProps.updatedAddtoProps);
  }, [
    searchValuesProps.updatedAddtoProps,
    searchValuesProps.sendselectedCompanies,
  ]);
  
  useEffect(() => {
    setPage(0);
    setCurrentPage(1);
  }, [
    inputsearch,
    servicesearch,
    companysizesearch,
    regionsearch,
    searchValuesProps.isPremiumUsersOnly
  ]);

  useEffect(() => {
    async function fetchSettigs() {
      const localStorageReOrderConfig = await fetcher(getEndpointUrl(ENDPOINTS.getUserSettings))
      if (localStorageReOrderConfig && localStorageReOrderConfig[0]) {
        let ColumnNames: { id: string, visible: boolean }[] = JSON.parse(localStorageReOrderConfig[0].userSPTableOrder);
        const newColumns = columns.filter(col => !ColumnNames.some(storedCol => storedCol.id === col.id)).map(col => ({ id: col.id, visible: false }));

        let allColumns = [...ColumnNames, ...newColumns]
        if(user && user.userRoles[0].roleCode != 'buyer') {
          allColumns = allColumns.filter(col=> col.id != 'following');
        }
        const ReorderedColumns = allColumns
          .map((name: { id: string }) => getColumnById(name.id))
          .filter((column) => column !== undefined && column?.id !== undefined) as TableColumn<ApiResponse>[];
        if (ReorderedColumns && ReorderedColumns != undefined) {
          setUpdatedColumns(ReorderedColumns);
        }
        setColumnNamesOrder(allColumns);
      } else {
        let columnNames = columns.map(col => ({
          id: col.id,
          visible: defaultHideColumns.includes(col.id) ? false : true,
        }));
        if(user && user.userRoles[0].roleCode != 'buyer') {
          columnNames = columnNames.filter(col=> col.id != 'following');
        }
        columnNames && setColumnNamesOrder(columnNames)
        setUpdatedColumns(columns);
      }

    }
    fetchSettigs();
  }, []);

  useEffect(() => {
    const sendDataOnUnmount = async () => {
      try {
        const userSettingsource = axios.CancelToken.source();
        await authPostdata(`${getEndpointUrl(ENDPOINTS.saveUserSettings)}`, { columnsData: JSON.stringify(columnNamesOrder) }, userSettingsource.token);
      } catch (error) {
        console.error("Failed to send data on unmount", error);
      }
    };
    if (columnNamesOrder.length > 0) {
      sendDataOnUnmount();
      const ReorderedColumns = columnNamesOrder
        .map((name: { id: string }) => getColumnById(name.id))
        .filter((column) => column !== undefined && column?.id !== undefined) as TableColumn<ApiResponse>[];
      if (ReorderedColumns && ReorderedColumns != undefined) {
        ReorderedColumns && setUpdatedColumns(ReorderedColumns);
      }
    }

  }, [columnNamesOrder])
  // Useeffect Ends here

  const handleKeyDown = (event: { key: string }) => {
    if (event.key === "Escape") {
      setOpenModal(false);
    }
  };

  const getTheListToSend = (listIds: number[], pageNo: number, pageSize: number) => {
    const newList: number[] = [];
    if (listIds && listIds.length > 0) {
      for (let i = pageNo; i < pageSize + pageNo; i++) {
        if (listIds[i]) {
          newList.push(listIds[i]);
        }
      }
    }
    return newList;
  }

  const addListsidebar = (isEnabled: boolean) => {
    if (user?.isPaidUser) {
      if (selectedCompanies.length > 0) {
        setIsVisible(!isEnabled);
        searchValuesProps.onVisibilityChange(!isEnabled);
      } else {
        setOpenModal(true);
      }
    }  else if(!user?.isPaidUser && user?.userRoles[0].roleCode =="buyer") {
      if (selectedCompanies.length > 0) {
        setIsVisible(!isEnabled);
        searchValuesProps.onVisibilityChange(!isEnabled);
      } else {
        setOpenModal(true);
      }
    }  else {
      setPopupMessage('ADDTO')
      setOpenPopup(true);
    }
  };

  function handleSelectAll(isChecked: boolean, shouldClearAll: boolean = true) {
    setFilteredCompanies((prevFilteredCompanies) => {
      if (isChecked) {
        setIsAllSelected(true)
        setSelectedCompanies(prevFilteredCompanies);
        setSelctedCompanyCounts(prevFilteredCompanies.length);
        setCompanyCounts(prevFilteredCompanies.length);
        setUnselectedCompanies([]);
        const checkboxes = document.getElementsByClassName('checkboxsp') as HTMLCollectionOf<HTMLInputElement>;
        Array.from(checkboxes).forEach(checkbox => {
          checkbox.checked = true;
        });
        localStorage.setItem("comparingCompanies", JSON.stringify(prevFilteredCompanies));
      } else {
        setIsAllSelected(false)

        setSelctedCompanyCounts(0);
        
        const checkboxes = document.getElementsByClassName('checkboxsp') as HTMLCollectionOf<HTMLInputElement>;
        Array.from(checkboxes).forEach(checkbox => {
          checkbox.checked = false;
        });
        if(shouldClearAll){
          setCompanyCounts(0)
          setSelectedCompanies([]);
          localStorage.setItem("comparingCompanies", JSON.stringify([]));
        }
      }
      searchValuesProps.sendselectedCompanies(prevFilteredCompanies);
      return prevFilteredCompanies;
    });
  }

  const handleSelectedCompanies = (comp_id: number, isChecked: boolean) => {
    setSelectedCompanies((prevSelectedCompanies) => {
      const updatedSelectedCompanies = isChecked
        ? [...prevSelectedCompanies, comp_id]
        : prevSelectedCompanies.filter((id) => id !== comp_id);

      // Update local storage
      const comparingCompaniesString = localStorage.getItem("comparingCompanies");
      const comparingCompanies = comparingCompaniesString
        ? JSON.parse(comparingCompaniesString)
        : [];

      let updatedComparingCompanies = isChecked
        ? [...comparingCompanies, comp_id]
        : comparingCompanies.filter((id: number) => id !== comp_id);

      const updatedComparingIds = new Set(updatedComparingCompanies)
      updatedComparingCompanies = Array.from(updatedComparingIds);

      localStorage.setItem("comparingCompanies", JSON.stringify(updatedComparingCompanies));

      // Update company counts
      setCompanyCounts(updatedComparingCompanies.length);
      setSelctedCompanyCounts(updatedSelectedCompanies.length);

      const updatedSelectedIds = new Set(updatedSelectedCompanies)
      const UniqupdatedSelectedCompanies = Array.from(updatedSelectedIds);

      // Send the updated list to props
      searchValuesProps.sendselectedCompanies(UniqupdatedSelectedCompanies);

      return updatedSelectedCompanies;
    });

    setUnselectedCompanies((prevUnselectedCompanies) => {
      const updatedUnselectedCompanies = isChecked
        ? prevUnselectedCompanies.filter((id) => id !== comp_id)
        : [...prevUnselectedCompanies, comp_id];

      if (updatedUnselectedCompanies.length == 0 && filteredCompanies.length > 0) {
        const checkboxes = document.getElementsByClassName('checkboxspall') as HTMLCollectionOf<HTMLInputElement>;
        Array.from(checkboxes).forEach(checkbox => {
          checkbox.checked = true;
        });
      } else {
        const checkboxes = document.getElementsByClassName('checkboxspall') as HTMLCollectionOf<HTMLInputElement>;
        Array.from(checkboxes).forEach(checkbox => {
          checkbox.checked = false;
        });
      }
      return updatedUnselectedCompanies;
    });
  }
  // new
  // const handleSelectedCompanies =
  //   (comp_id: number, isChecked: boolean) => {
  //     setSelectedCompanies((prevSelectedCompanies) => {

  //       const updateSelectCompanies = isChecked
  //         ? [...prevSelectedCompanies, comp_id]
  //         : prevSelectedCompanies.filter((companyId) => companyId !== comp_id);

  //       const comparingCompaniesString = localStorage.getItem("comparingCompanies");
  //       let comparingCompanies: any[] = [];
  //       if (comparingCompaniesString) {
  //         const comparingCompaniesjson = JSON.parse(comparingCompaniesString);
  //         comparingCompanies = [...comparingCompaniesjson];
  //       }
  //       if (isChecked) {

  //         if (comparingCompanies && !comparingCompanies.includes(comp_id)) {
  //           setUnselectedCompanies((prev) => prev.filter((prev) => prev != comp_id));
  //           setSelctedCompanyCounts((prevVal) => prevVal + 1);
  //           comparingCompanies.push(comp_id);
  //           setCompanyCounts((prevVal) => prevVal + 1);
  //           localStorage.setItem("comparingCompanies", JSON.stringify(comparingCompanies));
  //         }
  //       } else {
  //         if (comparingCompanies && comparingCompanies.includes(comp_id)) {
  //           setUnselectedCompanies((prev) => [...prev, comp_id]);
  //           comparingCompanies = comparingCompanies.filter((item: any) => item != comp_id);
  //           setCompanyCounts((prevVal) => prevVal - 1);
  //           setSelctedCompanyCounts((prevVal) => prevVal - 1);
  //           localStorage.setItem("comparingCompanies", JSON.stringify(comparingCompanies));
  //         }
  //       }
  //       const uniqIds = new Set(updateSelectCompanies)
  //       const uniqueArray = Array.from(uniqIds);
  //       searchValuesProps.sendselectedCompanies(uniqueArray);

  //       if (unSelectedCompanies.length == 0) {
  //         const checkboxes = document.getElementsByClassName('checkboxspall') as HTMLCollectionOf<HTMLInputElement>;
  //         Array.from(checkboxes).forEach(checkbox => {
  //           checkbox.checked = true;
  //         });
  //       } else {
  //         const checkboxes = document.getElementsByClassName('checkboxspall') as HTMLCollectionOf<HTMLInputElement>;
  //         Array.from(checkboxes).forEach(checkbox => {
  //           checkbox.checked = false;
  //         });
  //       }



  //       return updateSelectCompanies;
  //     });
  //   };


  //old
  // const handleSelectedCompanies = (comp_id: number, isChecked: boolean) => {
  //   let updateSelectCompanies = [...selectedCompanies];
  //   const isSelected = updateSelectCompanies.includes(comp_id);
  //   if (isSelected) {
  //     updateSelectCompanies = updateSelectCompanies.filter(
  //       (companies) => companies != comp_id,
  //     );
  //   } else {
  //     updateSelectCompanies.push(comp_id);
  //   }
  //   searchValuesProps.sendselectedCompanies(updateSelectCompanies);
  //   setSelectedCompanies(updateSelectCompanies);

  //   const comparingCompaniesString = localStorage.getItem("comparingCompanies");
  //   let comparingCompanies = [];
  //   if (comparingCompaniesString) {
  //     comparingCompanies = JSON.parse(comparingCompaniesString);
  //   }
  //   if (isChecked) {
  //     setSelctedCompanyCounts((prevVal) => prevVal + 1);
  //     if (comparingCompanies && !comparingCompanies.includes(comp_id)) {
  //       comparingCompanies.push(comp_id);
  //       setCompanyCounts((prevVal) => prevVal + 1);
  //       localStorage.setItem("comparingCompanies", JSON.stringify(comparingCompanies));
  //     }
  //   } else {
  //     if (comparingCompanies) {
  //       comparingCompanies = comparingCompanies.filter((item: any) => item != comp_id);
  //       setCompanyCounts((prevVal) => prevVal - 1);
  //       setSelctedCompanyCounts((prevVal) => prevVal - 1);
  //       localStorage.setItem("comparingCompanies", JSON.stringify(comparingCompanies));
  //     }
  //   }

  //   // if (isChecked) {
  //   //   console.log(JSON.stringify(companyIds) + " - " + comp_id);
  //   //   if (companyIds && !companyIds.includes(comp_id)) {
  //   //     setCompanyIds((prevIds) => [...prevIds, comp_id]);
  //   //   }
  //   // } else {
  //   //   console.log(JSON.stringify(companyIds) + " - " + comp_id);
  //   //   setCompanyIds((prevIds) => [...prevIds].filter((id) => id !== comp_id));
  //   // }
  // };
  const onRowsPerPageChange = (e: number) => {
    localStorage.setItem("recordsPerPage", e.toString())
    setPageSize(e);
    setPage(0);
    setCurrentPage(1);
  };

  const CustomPagination = ({
    pages,
    page,
    pageSize,
    onClick,
  }: {
    pages: number;
    page: number;
    pageSize: number;
    perPageRecords: number;
    onClick: (pageNumber: number) => void;
  }) => (
    <Pagination
      page={page}
      pages={pages}
      pageSize={pageSize}
      totalrecords={totalRows}
      perPageRecords={data.length}
      onClick={onClick}
    ></Pagination>
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setisSelectAllReset(false);
    setPage((page - 1) * +pageSize);
    if (currentPage != page) {
      setPageSize(pageSize);
    }
  };

  const handleSort = (selectedColumn: TableColumn<ApiResponse>, sortDirection: SortOrder, sortedRows: ApiResponse[]) => {
    if (selectedColumn.name) {
      setPage(0);
      setisSelectAllReset(false);
      setCurrentPage(1);
      setPending(true);
      if (typeof selectedColumn.name === 'object') {
        const nameProps = (selectedColumn.name as React.ReactElement).props;
        if (nameProps && nameProps.children && Array.isArray(nameProps.children) && nameProps.children.length > 0) {
          searchValuesProps.setsortCustomColumn(nameProps.children[0].toString());
          searchValuesProps.setsortCustomColumnField(sortDirection);
        }
      } else {
        searchValuesProps.setsortCustomColumn(selectedColumn.name.toString());
      }
      searchValuesProps.setsortCustomColumnField(sortDirection);
    }
  }

  const openCampareTo = () => {
    if (user?.isPaidUser) {
      router.push("/compare");
    } else if(!user?.isPaidUser && user?.userRoles[0].roleCode =="buyer") {
      router.push("/compare");
    } else {
      setPopupMessage('FREE_COMPARE_COMPANIES')
      setOpenPopup(true);
    }
  }

  const getColumnById = (id: string) => {
    return columns.find(column => column.id === id);
  };

  //   const handleSelectCheckBox = (selected: {
  //     allSelected: boolean;
  //     selectedCount: number;
  //     selectedRows: ApiResponse[]
  //   }) => {
  //     const updatedCompanies = selected.selectedRows.map((row) => row.id)
  //   setSelectedCompanies(updatedCompanies);
  // }

  useEffect(() => {
    if (isAllSelected) {
      const checkboxes = document.getElementsByClassName('checkboxsp') as HTMLCollectionOf<HTMLInputElement>;

      Array.from(checkboxes).forEach(checkbox => {
        const checkBoxIdString = checkbox.id.split('-')
        const checkBoxId = Number(checkBoxIdString[2])
        if (!unSelectedCompanies.includes(checkBoxId)) {
          checkbox.checked = true;
        }
      });
      if (unSelectedCompanies.length == 0) {
        const checkboxesall = document.getElementsByClassName('checkboxspall') as HTMLCollectionOf<HTMLInputElement>;
        Array.from(checkboxesall).forEach(checkbox => {
          checkbox.checked = true;
        });
      }

    }
  }, [data]);

  useEffect(() => {

    const checkboxesall = document.getElementsByClassName('checkboxspall') as HTMLCollectionOf<HTMLInputElement>;
    Array.from(checkboxesall).forEach(checkbox => {
       if (filteredCompanies.length <= 0) {
        checkbox.disabled = true;
        checkbox.classList.add('bg-gray-100');
       } else {
         checkbox.disabled = false;
         checkbox.classList.remove('bg-gray-100');
       }
    });

  }, [filteredCompanies])

  const generateShareLink = async() => {
    const selectedserviceIds = localStorage.getItem('selectedIdServiceCapabilities');
    const selectedServiceCapbilities = localStorage.getItem('selectedServiceCapabilities');
    const prevIsPremiumUsersOnly = localStorage.getItem('prevIsPremiumUsersOnly');
    const countrySearchValue = localStorage.getItem('previouscountrysearch');
    const inputElementValue = localStorage.getItem('inputsearchvalue');
    const oldCompanySizes = localStorage.getItem('oldCompanySizes')
    const localEventValues = localStorage.getItem('StoredEvents');
    const regionCheckboxFilter = localStorage.getItem('regionCheckboxFilter');
    const postData = {
      selectedServiceIds: selectedserviceIds || "",
      selectedSevices: selectedServiceCapbilities || "",
      isPremium: prevIsPremiumUsersOnly || "",
      countrySearchValue: countrySearchValue || "",
      inputValue: inputElementValue || "",
      selctedCompanySize: oldCompanySizes || "",
      selectedEventValues: localEventValues || "",
      regionCheckboxFilter: regionCheckboxFilter || "",
    }
    const result = await authPostdata(`${getEndpointUrl(ENDPOINTS.generateFilterShareLink)}`,  postData);
    if(result.status && result.token){
      setGetToken(result.token);
      setOpenListCopyAndShareModal(true);
    }
  }

  const copyingFiltersList = async() => {
    setButtonLoader(true);
    if(getToken != ""){
      const baseUrl = window.location.href;
      fallbackCopyToClipboard(baseUrl+'?token='+getToken);
    }
    setButtonLoader(false);
    setTextCopied(true);
  }
  return ( 
    <>
      <div className="py-6">
        <hr />
        <div className="sm:text-left py-6">
          <h1 className="font-bold default_text_color heading-sub-font">
            Service Providers
          </h1>
        </div>
        <div className="flex justify-between relative">
          <div className="pb-5 serviceproviderSortBy">
            <span className="font-bold text-sm">Sort By : </span>
            <select
              name="HeadlineAct"
              id="HeadlineAct"
              className="border rounded-sm border-gray-300 text-sm ms-2 py-1"
              onChange={(e) => { setSortField(e.target.value); searchValuesProps.setsortCustomColumn(""), searchValuesProps.setsortCustomColumnField("") }}
            >
              <option value="">Sort </option>
              <option value="NameA_Z">Company Name: A - Z</option>
              <option value="NameZ_A">Company Name: Z - A</option>
              <option value="FoundNewFirst">Date Founded: Newest First</option>
              <option value="FoundOldFirst">Date Founded: Newest Last</option>
              <option value="Company_L_S">Company Size: Large - Small</option>
              <option value="Company_S_L">Company Size: Small - Large</option>
            </select>
          </div>
        </div>
        <div className="relative">
          <Button
            size="medium"
            onClick={() => searchValuesProps.onFilterChange(true)}
            className="mobile_show button_blue text-sm mt-5 px-2.5 py-2 absolute right-0 -bottom-10 z-10"
          >
            <svg
              className="w-5 h-5 me-2"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M10.8 5a3 3 0 0 0-5.6 0H4a1 1 0 1 0 0 2h1.2a3 3 0 0 0 5.6 0H20a1 1 0 1 0 0-2h-9.2ZM4 11h9.2a3 3 0 0 1 5.6 0H20a1 1 0 1 1 0 2h-1.2a3 3 0 0 1-5.6 0H4a1 1 0 1 1 0-2Zm1.2 6H4a1 1 0 1 0 0 2h1.2a3 3 0 0 0 5.6 0H20a1 1 0 1 0 0-2h-9.2a3 3 0 0 0-5.6 0Z" />
            </svg>
            Filters
          </Button>
          <div className="lg:absolute right-0 -bottom-8 z-10 lg:pb-0 pb-4">
            {searchValuesProps.generateLinkUser &&
              <button
              className={`addtotour text-sm font-medium inline-flex items-center justify-center gap-1.5 rounded-sm border-0 border-gray-200 px-3 py-1 link_color transition hover:bg-gray-0 hover:text-blue-400 focus:outline-none ${!disableGenerateLink ? "service_provider cursor-pointer" : 'link_disabled'}`}
              type="button"
              disabled={disableGenerateLink}
              onClick={ generateShareLink }
            >
              <Image
                src="plus.svg"
                className={`w-3.5 h-3.5 link_color`}
                alt=""
                width={14}
                height={14}
              />
              <span className="">Generate Link </span>
            </button>
            }

            <button
              className={`addtotour text-sm font-medium inline-flex items-center justify-center gap-1.5 rounded-sm border-0 border-gray-200 px-3 py-1 link_color transition hover:bg-gray-0 hover:text-blue-400 focus:outline-none  ${(companyCounts > 5 || selctedCompanyCounts < 1 || (!user?.isPaidUser && user.userRoles[0].roleCode === "service_provider")) && 'link_disabled'}`}
              type="button"
              onClick={() => { openCampareTo() }}
              disabled={companyCounts > 5 || selctedCompanyCounts < 1}
            >
              <Image
                src="plus.svg"
                className={`w-3.5 h-3.5 link_color`}
                alt=""
                width={14}
                height={14}
              />
              <span className="">Compare selected</span>
            </button>
            <button
              className={`addtotour text-sm font-medium inline-flex items-center justify-center gap-1.5 rounded-sm border-0 border-gray-200 px-3 py-1 link_color transition hover:bg-gray-0 hover:text-blue-400 focus:outline-none ${((!user?.isPaidUser && user.userRoles[0].roleCode === "service_provider") || selctedCompanyCounts < 1) && 'link_disabled'}`}
              type="button"
              disabled={selctedCompanyCounts < 1}
              onClick={() => addListsidebar(isVisible || false)}
            >
              <Image
                src="plus.svg"
                className={`w-3.5 h-3.5 link_color`}
                alt=""
                width={14}
                height={14}
              />
              <span className="">Add to... </span>
            </button>

          </div>
        </div>
        {
          <div className=" serviceprovider_list py-6 pt-0">
            <DataTable
              customStyles={tableHeaderstyle}
              columns={updatedColumns}
              data={data}
              pagination
              fixedHeader
              highlightOnHover
              subHeader
              defaultSortAsc={false}
              onSort={handleSort}
              sortServer={true}
              // selectableRows
              // onSelectedRowsChange={(row) => handleSelectCheckBox(row)}
              // selectableRowSelected = {(row) => selectedCompanies.includes(row.id)}
              subHeaderComponent={
                <>
                  <div className="w-full flex justify-between">
                    <div className="select_length">
                      <span className="text-sm">
                        <abbr className="xs_mobile_hide">Records</abbr> per page:
                      </span>
                      <select
                        defaultValue={pageSize}
                        onChange={(e) =>
                          onRowsPerPageChange(Number(e.target.value))
                        }
                      >
                        {rowsPerPageOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <ColumnsFilter setColumnNamesOrder={setColumnNamesOrder} columnNamesOrder={columnNamesOrder} />
                </>
              }
              paginationComponent={() => (
                <CustomPagination
                  pages={totalPages}
                  page={currentPage}
                  pageSize={pageSize}
                  perPageRecords={data.length}
                  onClick={handlePageChange}
                />
              )}
              paginationComponentOptions={{
                rowsPerPageText: "Records per page:",
                rangeSeparatorText: "out of",
              }}
              paginationTotalRows={data.length * totalPages}
              paginationPerPage={100}
              progressPending={pending}
              progressComponent={<Spinner />}
            />
          </div>
        }
      </div >


      {/* Model for Warning  */}

      < Modal
        show={openModal}
        size="md"
        onClose={() => setOpenModal(false)}
        popup
        onKeyDown={handleKeyDown}
      >
        <Modal.Header />
        <Modal.Body>
          <div className="text-center">
            <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
              Please select atleast one service provider to proceed
            </h3>
            <div className="flex justify-center gap-4">
              <Button
                className="button_blue"
                onClick={() => setOpenModal(false)}
              >
                {"Okay"}
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal >
      <Modal
            size="sm"
            show={openListCopyAndShareModal}
            onClose={() => { setOpenListCopyAndShareModal(false); setTextCopied(false); setCopyLinkError("");}}
          >
            <Modal.Header className="modal_header">
              <b>Generate Link</b>
            </Modal.Header>
            <Modal.Body>
              <div className="space-y-6">
                <div className="">
                  <p className="text-sm default_text_color font-normal leading-6">
                    You are about to generate a link for the selected filters.
                  </p>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer className="modal_footer">
              {!copyLinkError &&
                <>
                  <Button size="sm" onClick={textCopied ? () => { } : copyingFiltersList} className="h-[40px] button_blue button_pad" disabled={buttonLoader} >
                    {buttonLoader ? <ButtonSpinner></ButtonSpinner> :
                      <div>
                        {textCopied ? (
                          <>
                            Link Copied
                            <svg
                              className="w-4 h-4 ml-2 dark:text-white flex-shrink-0"
                              aria-hidden="true"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                            </svg>
                          </>
                        ) : (
                          "Copy Link"
                        )}
                      </div>
                    }
                  </Button>
                </>}

              {/* {
              textCopied &&
              <svg
                className="w-4 h-4 me-2 dark:text-green-400 flex-shrink-0 green_c"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
              </svg>
            } */}
            </Modal.Footer>
          </Modal>

      {/* Model for Add to Warning Modal*/}

      < FreeTierAlerts isOpen={openPopup} setOpenPopup={setOpenPopup} bodymessage={popupMessage} />
    </>
  );
};
export default Serviceproviderslist;
