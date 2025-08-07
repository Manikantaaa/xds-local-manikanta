"use client";
import Link from "next/link";
import Image from "next/image";
import { PATH } from "@/constants/path";
import Breadcrumbs from "@/components/breadcrumb";
import { Accordion, Badge, Button, Modal, Tooltip } from "flowbite-react";
import { authFetcher, fetcher } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { useEffect, useRef, useState } from "react";
import React from "react";
import Pagination from "@/components/custompagination";
import DataTable, { SortOrder, TableColumn } from "react-data-table-component";
import { formatDate } from "@/services/common-methods";
import { OpportunitiesDto } from "@/types/user.type";
import "../../public/css/detatable.css";
import { useUserContext } from "@/context/store";
import { ServiceCapabilities } from "@/types/companies.type";
import Spinner from "@/components/spinner";
import { serviceColoring } from "@/constants/serviceColors";
import {useAuthentication} from "@/services/authUtils";
import { Toursteps } from "@/services/tour";
import { useMultiTourContext } from "@/context/multiTourContext";
import { redirect } from "next/navigation";

const Opportunities = () => {
  const { user } = useUserContext();

  if(!user) {
    redirect(PATH.HOME.path);
  }
  //user login and roler based authentication
 
  useAuthentication({ user: null, isBuyerRestricted: true, isPaidUserPage: true });
  //mobile code
  const [isMobile, setIsMobile] = useState(false);
  const [pending, setPending] = useState(true);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  const searchValueRef: React.RefObject<HTMLInputElement> = useRef(null);
  const [openServiceModal, setOpenServiceModal] = useState(false);
  const [services, setServices] = useState<ServiceCapabilities[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunitiesDto[]>([]);
  const [inputValue, setInputValue] = useState<string | "">("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedServicesstring, setSelectedServicesstring] =
    useState<string>("");

  // new states
  const [page, setPage] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  //
  const [SortField, setSortField] = useState<string>("");
  const [mobileselectedServices, setMobileselectedServices] = useState<
    string[]
  >([]);
  const [sortCustomColumn, setsortCustomColumn] = useState<string>("");
  const [sortCustomColumnField, setsortCustomColumnField] = useState<string>("");

  const {
    setTourState,
    tourState:{tourActive}
  } = useMultiTourContext();

  useEffect(() => {
    if(!pending && tourActive){
      setTourState({ run: true, stepIndex: 7,steps:Toursteps, tourActive:true });
    }
  },[pending]);

  useEffect(() => {
    async function getservices() {
      try {
        
        const serviceslist = await fetcher(
          getEndpointUrl(ENDPOINTS.getServiceAndCapabilities),
        );
       
        if (serviceslist.success) {
          const servicesList = serviceslist.data;
          const updatedServiceAndCapabilities: ServiceCapabilities[] =
            servicesList.map((service: ServiceCapabilities) => ({
              ...service,
              isChecked: false,
              showCapabilities: false,
              capabilities: service.capabilities.map(
                (capability: {
                  id: number;
                  capabilityName: string;
                  isChecked: boolean;
                }) => ({
                  ...capability,
                  isChecked: false,
                }),
              ),
            }));
          setServices(updatedServiceAndCapabilities);
        } else {
          console.log(
            `Api Responded with statuscode ${serviceslist.statuscode}`,
          );
        }
      } catch (error) {
        setPending(false);
        console.log(`Api Responded Error: ${error}`);
      }
    }
    getservices();
  }, []);

  useEffect(() => {
    async function getopportunities() {
      try {
        setPending(true);
        
        const opportunitieslist = await fetcher(
          getEndpointUrl(
            ENDPOINTS.getopportunities(
              inputValue,
              page,
              pageSize,
              selectedServicesstring,
              SortField,
              sortCustomColumn,
              sortCustomColumnField,
            ),
          ),
        );
        setPending(false);
        if (opportunitieslist.success) {
          setOpportunities(opportunitieslist.list);
          setTotalRows(opportunitieslist.count);
          setTotalPages(Math.ceil(opportunitieslist.count / pageSize));
        } else {
          console.log(
            `Api Responded with statuscode ${opportunitieslist.statuscode}`,
          );
        }
      } catch (error) {
        setPending(false);
        console.log(`Api Responded Error: ${error}`);
      }
    }
    getopportunities();
  }, [inputValue, selectedServicesstring, pageSize, page, SortField, sortCustomColumn,sortCustomColumnField]);

  const setTheSearchedStringInStats = () => {
    if(inputValue && inputValue != "") {
      authFetcher(`${getEndpointUrl(ENDPOINTS.addTheSearchedStringInStats(user.id, inputValue, true))}`).then();
    }
  }

  useEffect(() => {
    setTheSearchedStringInStats();
  }, [inputValue]);

  const columns: TableColumn<OpportunitiesDto>[] = [
    {
      name: "Opportunity",
      id:"Opportunity",
      cell: (row: OpportunitiesDto) => (
        <div className="text-blue-300">
          <Link prefetch={false} href={`/opportunity-details/${row.id}`}> {row.name} </Link>
        </div>
      ),
      selector: (row: OpportunitiesDto) => row.name,
      sortable: true,
    },
    {
      name: "Company",
      sortable: true,
      selector: (row: OpportunitiesDto) =>
        row?.showCompanyName ? row?.company?.name : "Anonymous",
    },
    {
      name: "Services",
      id: "Services",
      cell: (row: OpportunitiesDto) => (
        <div className="text-blue-300 space-y-1">
          {row.ServicesOpt?.slice(0, 3).sort((a, b) => a.service.serviceName.localeCompare(b.service.serviceName)).map(
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
          {row.ServicesOpt.length > 3 && 
          <Tooltip 
          content={
            row.ServicesOpt
              ?.sort((a, b) => a.service.serviceName.localeCompare(b.service.serviceName))
              .map((services, index, array) =>
                services.service && services.service.serviceName && (
                  <>
                    <span>{`${services?.service.serviceName}`}</span>
                    {index !== array.length - 1 && <span>, </span>}
                  </>
                )
              )
          }
            className="tier_tooltip ">
            <span className="text-xl">...</span>
          </Tooltip>
          }
        </div>
      ),
    },
    {
      name: "Industry Type",
      sortable: true,
      selector: (row: OpportunitiesDto) => row.industryTypes.name,
    },
    // {
    //   name: "Platform",
    //   sortable: true,
    //   selector: (row: OpportunitiesDto) => {
    //     const plotforms = row?.PlatformsOpt?.map(
    //       (platforms) => platforms.platforms.name,
    //     );
    //     return plotforms.length > 0 ? plotforms.join(",") : "NA";
    //   },
    // },
    {
      name: "Start",
      cell: (row: OpportunitiesDto) => {
        if (row.approxStartDateCondition == 1) {
          return "To be determined";
        } else if (row.approxStartDateCondition == 2) {
          return "Ongoing";
        } else if (row.approxStartDateCondition == 3) {
          return formatDate(row.approxStartDate);
        }
        return "";
      },
      sortable: true,
    },
    {
      name: "End",
      cell: (row: OpportunitiesDto) => {
        if (row.approxEndDateCondition == 1) {
          return "To be determined";
        } else if (row.approxEndDateCondition == 2) {
          return "Ongoing";
        } else if (row.approxEndDateCondition == 3) {
          return formatDate(row.approxEndDate);
        }
        return "";
      },
      sortable: true,
    },
    {
      name: "Staff Months",
      selector: (row: OpportunitiesDto) => row.staffMonths,
      sortable: true,
    },
    // {
    //   name: "Posted Date",
    //   selector: (row: OpportunitiesDto) => formatDate(row.createdAt).toString(),
    //   sortable: true,
    // },
    {
      name: <>Post&nbsp;Expiry Date</>,
      selector: (row: OpportunitiesDto) => formatDate(row.expiryDate).toString(),
      sortable: true,
    },
  ];
  const breadcrumbItems = [
    {
      label: PATH.HOME.name,
      path: PATH.HOME.path,
    },
    {
      label: PATH.OPPORTUNITIES.name,
      path: PATH.OPPORTUNITIES.path,
    },
  ];
  useEffect(() => {
    const stringservices = selectedServices.join(",");
    setSelectedServicesstring(stringservices);
  }, [selectedServices]);

  const handleServicesCheckboxChange = (serviceNames: string[], type: number = 0, isChecked: boolean = true) => {
    if((type == 1 || type == 2) && isChecked) {
      let checkedService: string = "";
      let checkedCapability: string = "";
      if(type == 1) {
        checkedService = serviceNames[0];
      } else {
        checkedCapability = serviceNames[0];
      }
      authFetcher(`${getEndpointUrl(ENDPOINTS.addTheSearchedServiceInStats(user.id, checkedService, checkedCapability, true))}`);
    }
    if (isMobile) {
      let mobileupdatedServices = [...mobileselectedServices];
      serviceNames.forEach((serviceName) => {
        const isSelected = mobileupdatedServices.includes(serviceName);
        if (isSelected) {
          for (let i = 0; i < services.length; i++) {
            if (services[i].serviceName == serviceName) {
              const serviceIndex = i;
              services[serviceIndex].capabilities.forEach((capabilityName) => {
                mobileupdatedServices = mobileupdatedServices.filter(
                  (service) => service !== capabilityName.capabilityName,
                );
              });
              break;
            }
          }

          mobileupdatedServices = mobileupdatedServices.filter(
            (service) => service !== serviceName,
          );
        } else {
          mobileupdatedServices.push(serviceName);
        }
      });
      setMobileselectedServices(mobileupdatedServices);
    } else {
      let updatedServices = [...selectedServices];
      serviceNames.forEach((serviceName) => {
        const isSelected = updatedServices.includes(serviceName);
        if (isSelected) {
          let serviceIndex = 0;
          for (let i = 0; i < services.length; i++) {
            if (services[i].serviceName == serviceName) {
              serviceIndex = i;
              services[serviceIndex].capabilities.forEach((capabilityName) => {
                updatedServices = updatedServices.filter(
                  (service) => service !== capabilityName.capabilityName,
                );
              });
              break;
            }
          }

          updatedServices = updatedServices.filter(
            (service) => service !== serviceName,
          );
        } else {
          updatedServices.push(serviceName);
        }
      });
      setSelectedServices(updatedServices);
    }
  };

  const mobileFilter = () => {
    setSelectedServices(mobileselectedServices);
  };

  const handleServiceSearchItems = (servicename: string) => {
    const updatesearchvalues = selectedServices?.filter(
      (item) => item != servicename,
    );
    if (isMobile) {
      setMobileselectedServices(updatesearchvalues);
    }
    setSelectedServices(updatesearchvalues);
  };
  const handleSearchButton = () => {
    const inputFocusElement = document.getElementById("voice-search");
    inputFocusElement?.focus();
    console.log(searchValueRef.current?.value);
    setInputValue(searchValueRef.current?.value.trim() || "");
  };
  const handleInputtoRemove = () => {
    setInputValue("");
    if (searchValueRef.current) searchValueRef.current.value = "";
  };

  const removeAllSearchItems = () => {
    setSelectedServices([]);
    if (isMobile) {
      setMobileselectedServices([]);
    }
    handleInputtoRemove();
  };

  const tableHeaderstyle = {
    headCells: {
      style: {
        fontWeight: "bold",
        fontSize: "14px",
        backgroundColor: "#F1F4FA",
      },
    },
  };

  const onRowsPerPageChange = (e: number) => {
    setPageSize(e);
    setPage(0);
    setCurrentPage(1);
  };

  const rowsPerPageOptions = [10, 25, 50, 100];

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
      perPageRecords={opportunities.length}
      onClick={onClick}
    ></Pagination>
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setPage((page - 1) * +pageSize);
    if (currentPage != page) {
      setPageSize(pageSize);
    }
  };
  const [isServiceVisible, setIsServiceVisible] = useState(true);
  const serviceToggle = () => {
    setIsServiceVisible(!isServiceVisible);
  };

  const handleSort = (selectedColumn: TableColumn<OpportunitiesDto>, sortDirection: SortOrder, sortedRows: OpportunitiesDto[]) => {
    if (selectedColumn.name) {
      setPage(0);
      setCurrentPage(1);
      setPending(true); 
      setsortCustomColumn((selectedColumn.name).toString()); 
      setsortCustomColumnField(sortDirection);
    }
}

  return (
    <>
      <div className="w-full lg:container">
      <div className="flex">
        <aside
          id="sidebar-multi-level-sidebar"
          className="relative z-40 w-60 box_shadow	 transition-transform -translate-x-full sm:translate-x-0 lg:flex sm:hidden xs_mobile_hide"
          aria-label="Sidebar"
        >
          <div className="h-full default_text_color font-normal w-full">
            <div className="pt-6 pb-6">
              <div className="services">
                <button
                  onClick={serviceToggle}
                  id="dropdownCheckboxButton"
                  data-dropdown-toggle="dropdownDefaultCheckbox"
                  className="text-gray font-bold rounded-lg text-sm px-3 py-0 text-center inline-flex items-center w-full relative"
                  type="button"
                >
                  Services
                  {isServiceVisible ? (
                    <svg
                      className="w-2.5 h-2.5 me-6 mt-1.5 absolute right-0 rotation_icon_180"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 10 6"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="m1 1 4 4 4-4"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-2.5 h-2.5 me-6 mt-1.5 absolute right-0 rotation_icon_0"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 10 6"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="m1 1 4 4 4-4"
                      />
                    </svg>
                  )}
                </button>
                {isServiceVisible && (
                  <div
                    id="dropdownDefaultCheckbox"
                    className="z-10  bg-white  divide-gray-100 rounded-lg"
                  >
                    {/* <ul className="p-3 pt-0 space-y-3 mt-3 text-sm default_text_color relative ul_before_border service_line_bg"> */}
                    {/* {services.map((service: serviceType, index) => (
                      <li key={`services_${index}_service.id`}>
                        <div className="flex items-center">
                          <input
                            id={`checkbox-item-${service.serviceName}`}
                            type="checkbox"
                            checked={selectedServices.includes(
                              service.serviceName,
                            )}
                            value={service.serviceName}
                            onChange={() =>
                              handleServicesCheckboxChange([
                                service.serviceName
                              ],'notMobile')
                            }
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500  focus:ring-2 "
                          />
                          <label
                            htmlFor={`checkbox-item-${service.serviceName}`}
                            className="ms-2 text-sm  default_text_color "
                          >
                            {service.serviceName}
                          </label>
                        </div>
                      </li>
                    ))} */}
                    <ul className="pt-0 space_y_3  mt-3 text-sm text-gray-700">
                      {services.map((service: ServiceCapabilities, sIndex) => (
                        <li key={`main_services_` + sIndex} className={`pl-3 relative ul_before_border ${service.groupId == 1 ? 'yellow_line_bg': (service.groupId == 2? 'pink_line_bg' : (service.groupId == 3? 'blue_line_bg': (service.groupId == 4? 'red_line_bg':'green_line_bg')))}`}>
                          <div className="flex items-center">
                            <input
                              id={`checkbox-service-${service.id}`}
                              type="checkbox"
                              value={service.id}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500  focus:ring-2 "
                              // {...register(`service`)}
                              name={service.serviceName}
                              //  checked={service.isChecked}
                              onChange={(e) =>
                                handleServicesCheckboxChange([
                                  service.serviceName,
                                ], 1, e.target.checked)
                              }
                              checked={selectedServices.includes(
                                service.serviceName,
                              )}
                            />
                            <label
                              htmlFor={`checkbox-service-${service.id}`}
                              className="ms-2 text-sm  default_text_color cursor-pointer"
                            >
                              {service.serviceName}
                            </label>
                          </div>
                          {
                            <>
                              {selectedServices.includes(service.serviceName)
                                ? service.capabilities.map(
                                  (
                                    capability: {
                                      id: number;
                                      capabilityName: string;
                                      isChecked: boolean;
                                    },
                                    cIndex,
                                  ) => (
                                    <ul
                                      className="ps-8 pt-3 space-y-3 text-sm text-gray-700 dark:text-gray-200"
                                      key={`mobileservices${service.serviceName + cIndex
                                        }`}
                                    >
                                      <li key={cIndex}>
                                        <div className="flex items-center">
                                          <input
                                            id={`checkbox-capability-${capability.id}`}
                                            type="checkbox"
                                            value={capability.id}
                                            name={capability.capabilityName}
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500  focus:ring-2 "
                                            // {...register("capability")}
                                            checked={selectedServices.includes(
                                              capability.capabilityName,
                                            )}
                                            onChange={(e) =>
                                              handleServicesCheckboxChange([
                                                capability.capabilityName,
                                              ], 2, e.target.checked)
                                            }
                                          />
                                          <label
                                            htmlFor={`checkbox-capability-${capability.id}`}
                                            className="ms-2 text-sm  default_text_color cursor-pointer"
                                          >
                                            {capability.capabilityName}
                                          </label>
                                        </div>
                                      </li>
                                    </ul>
                                  ),
                                )
                                : ""}
                            </>
                          }
                        </li>
                      ))}
                    </ul>
                    {/* </ul> */}
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>
        <div className="px-4 sm:ml-0 lg:ml-0 md:ml-0 w-full width_1024divice">
          <div className="lg:px-4">
            <div className="pb-6 pt-6 breadcrumbs_s">
              <Breadcrumbs items={breadcrumbItems} />
            </div>
            <div className="sm:flex sm:items-center sm:justify-between">
              <div className="sm:text-left">
                <h1 className="font-bold default_text_color header-font">
                  Browse Opportunities
                </h1>
              </div>
            </div>
            <div className="pt-6">
              View posted opportunities, and express your interest in partnering on them.
            </div>
            <div className="py-6">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-8">
                <form
                  className="flex items-center opportunitiesSearchForm"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSearchButton();
                  }}
                >
                  <label htmlFor="voice-search" className="sr-only">
                    Search
                  </label>
                  <div className="relative w-full">
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
                      ref={searchValueRef}
                      id="voice-search"
                      className="bg-gray-50 border border-gray-300 default_text_color text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="search term"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSearchButton}
                    className="inline-flex items-center py-2 px-6 ms-2 text-sm font-medium text-white button_blue rounded-lg border border-blue-400 hover:bg-gray-200 focus:ring-0 focus:outline-none"
                  >
                    Search
                  </button>
                </form>
              </div>
              <div className="flex flex-wrap gap-2 pt-6">
                {inputValue ? (

                  <Badge color="gray" size="xs">
                    Search: {`“${inputValue}”`}
                    <Image
                      src="cross.svg"
                      className="w-3 h-3 inline-flex ms-1 cross_icon"
                      alt=""
                      width={12}
                      height={12}
                      onClick={handleInputtoRemove}
                    />
                  </Badge>

                ) : null}
                {selectedServices?.map((searchitem, index) => (
                  <>
                    {" "}
                    <Badge
                      color="gray"
                      size="xs"
                      key={`service_badge_${index}`}
                    >
                      {searchitem}
                      <Image
                        onClick={() => handleServiceSearchItems(searchitem)}
                        src="/cross.svg"
                        className="w-3 h-3 inline-flex ms-1 cross_icon"
                        alt=""
                        width={12}
                        height={12}
                      />
                    </Badge>
                  </>
                ))}

                {selectedServices.length || searchValueRef.current?.value ? (

                  <Badge
                    size="xs"
                    className="bg_none text_blue underline cursor-pointer"
                    onClick={removeAllSearchItems}
                  >
                    Clear All
                  </Badge>

                ) : null}
              </div>
              <div className="py-6">
                <hr />
              </div>

              <div className="pb-6">
                <div className="sm:text-left pb-6">
                  <h1 className="font-bold default_text_color heading-sub-font">
                    Opportunities
                  </h1>
                </div>
                <div className="flex justify-between">
                  <div className="pb-5">
                    <span className="font-bold text-sm">Sort By : </span>
                    <select
                      name="HeadlineAct"
                      id="HeadlineAct"
                      className="border rounded-sm border-gray-300 text-sm ms-2 py-1"
                      onChange={(e) => setSortField(e.target.value)}
                    >
                      <option value=""> Sort </option>
                      <option value="AZ">Name A - Z</option>
                      <option value="ZA">Name Z - A</option>
                      <option value="PostedNew">
                        Date Posted: newest first
                      </option>
                      <option value="PostedOld">
                        Date Posted: newest last
                      </option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-between mobile_show relative z-10">
                  <Button
                    size="medium"
                    className="mobile_show button_blue text-sm mt-5 px-2.5 py-2 absolute right-0 -bottom-10"
                    onClick={() => setOpenServiceModal(true)}
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
                </div>
                 { 
                 // isLoading ?
                  // <div className="pt-4 flex justify-center items-center">
                  //   <Spinner />
                  // </div>
                  // :
                  <div className="table_list pb-6 opportunitiesdataTable">
                    <DataTable
                      customStyles={tableHeaderstyle}
                      columns={columns}
                      defaultSortFieldId="Opportunity"
                      defaultSortAsc={true}
                      data={opportunities}
                      pagination
                      fixedHeader
                      highlightOnHover
                      subHeader
                      onSort={handleSort}
                      sortServer={true}
                      progressPending={pending}
                      progressComponent={<Spinner />}
                      subHeaderComponent={
                        <div className="w-full flex justify-between">
                          <div className="select_length">
                            <span className="text-sm">Records per page:</span>
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
                          {/* <div className="search_input">
                <input
                  type="text"
                  className="w-25 form-control"
                  placeholder="Search..."
                  // value={search}
                  onChange={(e) => onChangeSearchText(e.target.value)}
                />
              </div> */}
                        </div>
                      }
                      paginationComponent={() => (
                        <CustomPagination
                          pages={totalPages}
                          page={currentPage}
                          pageSize={pageSize}
                          perPageRecords={opportunities.length}
                          onClick={handlePageChange}
                        />
                      )}
                      paginationComponentOptions={{
                        rowsPerPageText: "Records per page:",
                        rangeSeparatorText: "out of",
                      }}
                      paginationTotalRows={opportunities.length * totalPages}
                      paginationPerPage={100}
                    // onSelectedRowsChange={handleSelectedRowsChange}
                    // onChangePage={handlePageChange}
                    // onChangeRowsPerPage={handleRowsPerPageChange}

                    // subHeaderAlign="right"
                    />
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      <Modal show={openServiceModal} onClose={() => setOpenServiceModal(false)}>
        <Modal.Header className="modal_header">
          <b>Filters</b>
        </Modal.Header>
        <Modal.Body className="px-0  py-4">
          <div className="space-y-6">
            <Accordion collapseAll className="borde">
              <Accordion.Panel>
                <Accordion.Title className="py-2 rounded-none focus:ring-0 font-bold default_text_color text-sm">
                  Services
                </Accordion.Title>
                <Accordion.Content>
                  {/* <ul className="space-y-3 text-sm  relative service_line_bg" style={{ height: "200px", overflow: "auto" }}>
                  {services.map((service: service, index) => (
                      <li key={`services_sidebar_${index}`}>
                        <div className="flex items-center">
                          <input
                            key={service.id}
                            id={`mobile_checkbox-item-service-${service.serviceName}`}
                            type="checkbox"
                            checked={mobileselectedServices.includes(service.serviceName)}
                            value={service.serviceName}
                            onChange={() =>
                              handleServicesCheckboxChange([service.serviceName],'Mobile')
                            }
                          
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500  focus:ring-2 "
                          />
                          <label
                            htmlFor={`mobile_checkbox-item-service-${service.serviceName}`}
                            className="ms-2 text-sm  default_text_color "
                          >
                            {service.serviceName}
                          </label>
                        </div>
                      </li>
                    ))}
                  </ul> */}
                  <ul className="pt-0 space_y_3  mt-3 text-sm text-gray-700">
                    {services.map((service: ServiceCapabilities, sIndex) => (
                      <li key={`main_services_` + sIndex} className={`pl-3 relative ul_before_border ${service.groupId == 1 ? 'yellow_line_bg': (service.groupId == 2? 'pink_line_bg' : (service.groupId == 3? 'blue_line_bg': (service.groupId == 4? 'red_line_bg':'green_line_bg')))}`}>
                        <div className="flex items-center">
                          <input
                            id={`checkbox-service-${service.id}`}
                            type="checkbox"
                            value={service.id}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500  focus:ring-2 "
                            // {...register(`service`)}
                            name={service.serviceName}
                            //  checked={service.isChecked}
                            onChange={(e) =>
                              handleServicesCheckboxChange([
                                service.serviceName,
                              ], 1, e.target.checked)
                            }
                            checked={mobileselectedServices.includes(
                              service.serviceName,
                            )}
                          />
                          <label
                            htmlFor={`checkbox-service-${service.id}`}
                            className="ms-2 text-sm  default_text_color cursor-pointer"
                          >
                            {service.serviceName}
                          </label>
                        </div>
                        {
                          <>
                            {mobileselectedServices.includes(
                              service.serviceName,
                            )
                              ? service.capabilities.map(
                                (
                                  capability: {
                                    id: number;
                                    capabilityName: string;
                                    isChecked: boolean;
                                  },
                                  cIndex,
                                ) => (
                                  <ul
                                    className="ps-8 pt-3 space-y-3 text-sm text-gray-700 dark:text-gray-200"
                                    key={`notmobileservices${service.serviceName + cIndex
                                      }`}
                                  >
                                    <li key={cIndex}>
                                      <div className="flex items-center">
                                        <input
                                          id={`checkbox-capability-${capability.id}`}
                                          type="checkbox"
                                          value={capability.id}
                                          name={capability.capabilityName}
                                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500  focus:ring-2 "
                                          // {...register("capability")}
                                          checked={mobileselectedServices.includes(
                                            capability.capabilityName,
                                          )}
                                          onChange={(e) =>
                                            handleServicesCheckboxChange([
                                              capability.capabilityName,
                                            ], 2, e.target.checked)
                                          }
                                        />
                                        <label
                                          htmlFor={`checkbox-capability-${capability.id}`}
                                          className="ms-2 text-sm  default_text_color cursor-pointer"
                                        >
                                          {capability.capabilityName}
                                        </label>
                                      </div>
                                    </li>
                                  </ul>
                                ),
                              )
                              : ""}
                          </>
                        }
                      </li>
                    ))}
                  </ul>
                </Accordion.Content>
              </Accordion.Panel>
            </Accordion>
          </div>
        </Modal.Body>
        <Modal.Footer className="modal_footer">
          <Button
            className="px-4"
            color="gray"
            onClick={() => setOpenServiceModal(false)}
          >
            {" "}
            Cancel
          </Button>
          <Button
            className="px-4"
            onClick={() => {
              setOpenServiceModal(false), mobileFilter();
            }}
          >
            Apply
          </Button>
          {/* <Button className="px-4" onClick={() => {setOpenServiceModal(false), handleFilterData()}}>Apply</Button> */}
        </Modal.Footer>
      </Modal>
    </>
  );
};
export default Opportunities;
