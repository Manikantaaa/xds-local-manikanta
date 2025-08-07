"use client";
import Breadcrumbs from "@/components/breadcrumb";
import { PATH } from "@/constants/path";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Modal, Button } from "flowbite-react";
import { authFetcher, fetcher, patch } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import DataTable from "react-data-table-component";
import Image from "next/image";
import AddtoMyList from "@/components/addtomylistsidebar";
import "../../../public/css/detatable.css";
import { useUserContext } from "@/context/store";
import { formatDate } from "@/services/common-methods";
import { redirect, useParams } from "next/navigation";
import SubscriptionPopup from "@/components/subscriptionpopup";
import { serviceColoring } from "@/constants/serviceColors";
import { useAuthentication } from "@/services/authUtils";
import Spinner from "@/components/spinner";
import CustomLightBox from "@/components/ui/lightbox";
// import { number } from "yup";

interface ListdataType {
  id: number;

  createdAt: Date;
  description: string;
  isNewIntrest: boolean;
  opportunityIntrested:{
    fileUrl: string;
    type: string;
    thumbnailUrl: string;
    thumbnail: string;
  }[];
  opportunity: {
    name: string;
  };
  company: {
    name: string;
    slug: string,
    id: number;
    website: string;
    logoAsset: {
      url: string | "/16by9 image.png";
    };
    bannerAsset: {
      url: string;
    };
    ServicesOpt?: [
      {
        service: {
          serviceName: string;
          groupId: number;
        };
      },
    ];
    CompanyAddress: [
      {
        city: string;
        Country: {
          name: string;
        };
      },
    ];
    companySizes?: {
      size: string;
    };
    user?: {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      linkedInUrl: string;
      approvalStatus: string;
      stripeCustomerId: string;
      accessExpirationDate: string;
      isArchieve: boolean;
      isDelete: boolean;
      status: string;
      createdAt: string;
      updatedAt: string;
      userRoles?: [
        {
          roleCode: string;
        },
      ];
    };
  };
}
const Myopportunitiesinterestedcompanies = (params: {
  params: { opportunityId: number };
}) => {
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [companylist, setCompanyList] = useState<ListdataType[]>([]);
  const [opportunityName, setOpportunityName] = useState<string>("");
  const [description, setdescription] = useState<string>("");
  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([]);
  const [openAddModal, setOpenAddModal] = useState<boolean>(false);
  const { user, intrestCount, setIntrestCount } = useUserContext();
  const [openAddtoWarningModal, setopenAddtoWarningModal] =
    useState<boolean>(false);
  const updatedAddtoProps: boolean | undefined = false;
  const [isVisible, setIsVisible] = useState<boolean | undefined>(false);
  const [updatedAddto, setUpdatedAddto] = useState<boolean>();
  const onVisibilityChange = (isVisible: boolean) => setUpdatedAddto(isVisible);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [companiesLists, setCompaniesLists] = useState<boolean>(false);
  const [fullportfolioModal, setFullportfolioModal] = useState(false);
  const [currentAlbumPopupData, setCurrentAlbumPopupData] = useState<{fileUrl: string, type: string, thumbnail: string,}[]>([]);
  const [activeSlider, setActiveSlider] = useState<number | undefined>(undefined);
  const [isOpenSilder, setIsOpenSilder] = useState<boolean>(false);
  const [currentLightBoxItems, setCurrentLightBoxItems] = useState<{fileUrl: string, type: string, thumbnail: string,}[]>([]);
  const paramsdata = useParams();
  const opportunityId = Number(paramsdata.id);
  useAuthentication({ user, isBuyerRestricted: false, isPaidUserPage: true });
  if (!user) {
    localStorage.setItem("viewIntrestedOppDetails", params.params.opportunityId.toString());
    redirect(PATH.STATIC_PAGE.path);
  }
  if (user && user?.userRoles[0].roleCode === 'service_provider') {
    redirect(PATH.HOME.path);
  }
  useEffect(() => {
    setIsVisible(updatedAddto);
  }, [updatedAddto]);

  useEffect(() => {
    if (params.params.opportunityId) {
      const getOpportunity = async () => {
        try {
          const dataa = await fetcher(
            getEndpointUrl(
              ENDPOINTS.getmyopportunitybyid(params.params.opportunityId),
            ),
          );
          const data = dataa?.data;
          setOpportunityName(data[0].name);
        } catch (error) {
          console.error("Error fetching my lists:", error);
        }
      };
      getOpportunity();
    }
  }, [params]);

  useEffect(() => {
    if (params.params.opportunityId) {
      const companiesList = async () => {
        try {
          const data = await fetcher(
            getEndpointUrl(
              ENDPOINTS.opportunityintrestedcompanies(
                params.params.opportunityId,
              ),
            ),
          );
          const dataa = data?.intrestedList?.data;
          if (dataa.length > 0) {
            setCompanyList(dataa);
            setCompaniesLists(true);

            // setdescription(dataa[0]?.description);
            // setOpportunityId(data[0]?.id);


          }
          setIntrestCount(data?.count);
          setIsLoading(false);
        } catch (error) {
          console.error("Error fetching my list Details:", error);
          setIsLoading(false);
          setCompaniesLists(false);
        }
      };
      companiesList();
    }
  }, [params]);
  // const tableHeaderstyle = {
  //   headCells: {
  //     style: {
  //       fontWeight: "bold",
  //       fontSize: "14px",
  //       backgroundColor: "#F1F4FA",
  //     },
  //   },
  // };
  const handleSelectedCompanies = (comp_id: number) => {
    let updateSelectCompanies = [...selectedCompanies];
    const isSelected = updateSelectCompanies.includes(comp_id);
    if (isSelected) {
      updateSelectCompanies = updateSelectCompanies.filter(
        (companies) => companies != comp_id,
      );
    } else {
      updateSelectCompanies.push(comp_id);
    }
    setSelectedCompanies(updateSelectCompanies);
  };
  // const columns = [
  //   {
  //     name: "",
  //     cell: (row: ListdataType) => (
  //       <div className="text-blue-300">
  //         <input
  //           id="checkbox-item-5"
  //           type="checkbox"
  //           value=""
  //           title="checkbox"
  //           onChange={() => handleSelectedCompanies(row.company?.id)}
  //           className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
  //         />
  //       </div>
  //     ),
  //     sortable: true,
  //   },
  //   {
  //     name: "Logo",
  //     cell: (row: ListdataType) => (
  //       <div className="text-blue-300">
  //         <Image
  //           src={row.company?.logoAsset?.url || "/no-image-available.jpg"}
  //           className="w-10"
  //           alt=""
  //           width={210}
  //           height={210}
  //         />
  //       </div>
  //     ),
  //   },
  //   {
  //     name: "Name",
  //     cell: (row: ListdataType) => (
  //       <Link
  //         prefetch={false}
  //         href={`/serviceproviders-details/${row.company?.slug}`}
  //         className="link_color"
  //       >
  //         <span>{row.company?.name}</span>
  //       </Link>
  //     ),
  //     sortable: true,
  //     sortFunction: (a: ListdataType, b: ListdataType) =>
  //       a.company.name.localeCompare(b.company.name),
  //   },
  //   {
  //     name: "Core Services",
  //     cell: (row: ListdataType) => (
  //       <div className="text-blue-300 space-y-1">
  //         {row.company?.ServicesOpt?.slice(0, 3).map(
  //           (services, index) =>
  //             services.service &&
  //             services.service.serviceName && (
  //               <span key={index} className="inline-block">
  //                 <button
  //                   type="button"
  //                   className={`text-gray-900 bg_${serviceColoring[services.service.groupId]} focus:outline-none font-medium rounded-sm text-sm px-2 py-1 me-2`}
  //                 >
  //                   {services.service.serviceName}
  //                 </button>
  //               </span>
  //             ),
  //         )}
  //       </div>
  //     ),
  //     // sortable: true,
  //   },
  //   {
  //     name: "Country",
  //     cell: (row: ListdataType) => {
  //       if (row.company?.CompanyAddress) {
  //         const countriesToShow = row.company.CompanyAddress.slice(0, 3);
  //         const countryNames = countriesToShow
  //           .map((address) => address.Country.name)
  //           .join(", ");
  //         return (
  //           <span>
  //             {countryNames}
  //             {row.company.CompanyAddress.length > 3 && "..."}
  //           </span>
  //         );
  //       }
  //       return "";
  //     },
  //     sortable: true,
  //     sortFunction: (a: ListdataType, b: ListdataType) => {
  //       const countryNameA =
  //         a.company?.CompanyAddress?.[0]?.Country?.name || "";
  //       const countryNameB =
  //         b.company?.CompanyAddress?.[0]?.Country?.name || "";
  //       return countryNameA.localeCompare(countryNameB);
  //     },
  //   },
  //   {
  //     name: "Employees",
  //     cell: (row: ListdataType) => row.company?.companySizes?.size,
  //     sortable: true,
  //     sortFunction: (a: ListdataType, b: ListdataType) => {
  //       const sizeNameA = a.company?.companySizes?.size || "";
  //       const sizeNameB = b.company?.companySizes?.size || "";
  //       return sizeNameA.localeCompare(sizeNameB);
  //     },
  //   },
  //   {
  //     name: "Website",
  //     cell: (row: ListdataType) => (
  //       <Link
  //         prefetch={false}
  //         href={row.company?.website || "#"}
  //         target="__blank"
  //         className="link_color"
  //       >
  //         <span>{row.company?.website}</span>
  //       </Link>
  //     ),
  //     sortable: true,
  //     sortFunction: (a: ListdataType, b: ListdataType) => {
  //       const websiteNameA = a.company?.website.toLowerCase() || "";
  //       const websiteNameB = b.company?.website.toLowerCase() || "";
  //       return websiteNameA.localeCompare(websiteNameB);
  //     },
  //   },
  //   {
  //     name: "Contact Name",
  //     cell: (row: ListdataType) =>
  //       `${row.company?.user?.firstName} ${row.company?.user?.lastName}`,
  //     sortable: true,
  //     sortFunction: (a: ListdataType, b: ListdataType) => {
  //       const nameA = `${a.company?.user?.firstName} ${a.company?.user?.lastName}`;
  //       const nameB = `${b.company?.user?.firstName} ${b.company?.user?.lastName}`;
  //       return nameA.localeCompare(nameB);
  //     },
  //   },
  //   {
  //     name: "Date Submitted",
  //     cell: (row: ListdataType) => formatDate(row.createdAt),
  //     sortable: true,
  //     sortFunction: (a: ListdataType, b: ListdataType) => {
  //       const dateA = a.createdAt;
  //       const dateB = b.createdAt;
  //       const stringA = formatDate(dateA).toString();
  //       const stringB = formatDate(dateB).toString();
  //       return stringA.localeCompare(stringB);
  //     },
  //   },
  //   {
  //     name: "Interest Details",
  //     cell: (row: ListdataType) => (
  //       <div className="flex gap-4">
  //         <button className="link_color" onClick={(e) => { e.preventDefault(); setValuesForOpportunity(row.description) }}>
  //           View details
  //         </button>
  //       </div>
  //     ),
  //   },
  // ];
  const addListsidebar = (isEnabled: boolean) => {
    if (user?.isPaidUser) {
      if (selectedCompanies.length > 0) {
        setIsVisible(!isEnabled);
        onVisibilityChange(!isEnabled);
      } else {
        setOpenAddModal(true);
      }
    } else if (!user?.isPaidUser && user?.userRoles[0].roleCode === "buyer") {
      if (selectedCompanies.length > 0) {
        setIsVisible(!isEnabled);
        onVisibilityChange(!isEnabled);
      } else {
        setOpenAddModal(true);
      }
    } else {
      setopenAddtoWarningModal(true);
    }
  };
  useEffect(() => {
    setIsVisible(updatedAddtoProps);
  }, [updatedAddtoProps]);
  const breadcrumbItems = [
    {
      label: PATH.HOME.name,
      path: PATH.HOME.path,
    },
    {
      label: PATH.MYOPPERTUNITIES.name,
      path: PATH.MYOPPERTUNITIES.path,
    },
    {
      label: opportunityName,
      path: opportunityName,
    },
  ];

  const setValuesForOpportunity = async (intrestedDescription: string) => {
    setdescription(intrestedDescription);
    setOpenModal(true)
    // if(isNewIntrest) {
    //   makeTheIntrestAsNotNew(oppIntrestInd);
    // }
  }

  // async function makeTheIntrestAsNotNew(oppIntrestId: number) {
  //   if(user) {
  //     patch(`${getEndpointUrl(ENDPOINTS.setIntrestToRead(user?.id, oppIntrestId.toString()))}`).then((result) => {
  //       if(result && result.success) {
  //         setIntrestCount(result.data);
  //         const newCompanyList = [...companylist];
  //         for(let item of newCompanyList) {
  //           if(item.id == oppIntrestId) {
  //             item.isNewIntrest = false;
  //           }
  //         }
  //         setCompanyList(newCompanyList);
  //       }
  //     }).catch((err) => {
  //       console.log(err);
  //     });
  //   }
  // }

  function setAlbumIndex(fileIndex: number) {
    setActiveSlider(fileIndex);
    setIsOpenSilder(true);
    setCurrentLightBoxItems(currentAlbumPopupData);
  }

  const conditionalRowStyles = [
    {
      when: (row: ListdataType) => row.isNewIntrest,
      style: {
        backgroundColor: "#ebe7fe",
        borderLeft: "4px solid #0071c2",
      },
      // className: (row: ListdataType) => row.isNewIntrest ? 'active_row' : 'testttjjjjjjjjjjjjjjjjj',
    },
  ];

  const setFilesToView = (data: {fileUrl: string, type: string, thumbnail: string}[]) => {
    setCurrentAlbumPopupData(data);
    setFullportfolioModal(true)
  }

  const sortTheInterestedCompanies = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const sortOrder = event.target.value;
  
    const sortedList = [...companylist].sort((a, b) => {
      if (sortOrder === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortOrder === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortOrder === "A-Z") {
        return a.company.name.localeCompare(b.company.name);
      }
      if (sortOrder === "Z-A") {
        return b.company.name.localeCompare(a.company.name);
      }
      return 0;
    });
  
    setCompanyList(sortedList);
  };
  return (
    <>
      {
        !isLoading ?
          <div className="w-full lg:container  px-5 pos_r">
            <div className="pb-6 pt-6 breadcrumbs_s">
              <Breadcrumbs items={breadcrumbItems} />
            </div>
            <div className="lg:flex justify-between">
              <div className="text-left  lg:mb-0 mb-2.5">
                <h1 className="default_text_color header-font">{opportunityName}</h1>
              </div>
              <div className="text-sm font-medium space-x-4 createnewList flex">
              {companylist && companylist.length > 0 && (
                  <>
                    <div className="addtotour text-sm font-medium inline-flex items-center justify-center gap-1.5 rounded-sm border-0 border-gray-200 px-3 py-1 link_color transition hover:bg-gray-0 hover:text-blue-400 focus:outline-none">
                      <Button
                        className="link_color"
                        color="white"
                        onClick={() => addListsidebar(isVisible || false)}
                        disabled={selectedCompanies.length < 1}
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.546.5a9.5 9.5 0 1 0 9.5 9.5 9.51 9.51 0 0 0-9.5-9.5ZM13.788 11h-3.242v3.242a1 1 0 1 1-2 0V11H5.304a1 1 0 0 1 0-2h3.242V5.758a1 1 0 0 1 2 0V9h3.242a1 1 0 1 1 0 2Z" />
                        </svg>
                        <span className="pl-0.5">Add To...</span>
                        
                      </Button>
                    </div>
                    <div className="select_sortbg flex">
                      <span className=" font-bold text-sm"><abbr className="sort_by">Sort by</abbr></span>
                      <select
                      name="HeadlineAct"
                      id="HeadlineAct"
                      className="mt-1.5l border-gray-300 text-gray-700 sm:text-sm"
                      onChange={sortTheInterestedCompanies}
                      >
                        <option value="newest">Submitted Date (newest first)</option>
                        <option value="oldest">Submitted Date (oldest first)</option>
                        <option value="A-Z">Company Name (A-Z)</option>
                        <option value="Z-A">Company Name (Z-A)</option>
                      </select>
                    </div>
                  </>
                  )}
                {/* <button className="addtotour text-sm font-medium inline-flex items-center justify-center gap-1.5 rounded-sm border-0 border-gray-200 px-3 py-1 link_color transition hover:bg-gray-0 hover:text-blue-400 focus:outline-none link_disabled" type="button" >
                  <img alt="" loading="lazy" width="14" height="14" decoding="async" data-nimg="1" className="w-3.5 h-3.5 link_color" src="/plus.svg" />
                  <span className="">Add to... </span></button> */}
                  
              </div>
              <AddtoMyList
                updatedAddto={updatedAddto}
                onVisibilityChange={(val: boolean) => setUpdatedAddto(val)}
                selectedCompanies={selectedCompanies}
              ></AddtoMyList>
        </div>
            {/* <div className="py-6 table-responsive">
              {companylist && companylist.length > 0 ?
                <div className="datatable_style my_opportunity_table_style_2">
                  <DataTable
                    customStyles={tableHeaderstyle}
                    columns={columns}
                    data={companylist}
                    highlightOnHover={true}
                    conditionalRowStyles={conditionalRowStyles}
                  />
                </div>
                :
                <p className="py-10 text-center">This opportunity has no interests</p>
              }
            </div> */}
            <div className="">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:gap-5 sm:grid-cols-3 py-6 ">
                  {companylist && companylist.map((company: ListdataType, index)=>(
                    <>
                    <div className="overflow-hidden rounded-lg shadow transition hover:shadow-lg card_shadow p-2.5 border_gray_c">
                    <article className="">
                    <div className="pb-2.5">
                      <label htmlFor="Option1">
                        <div className="">
                          <input type="checkbox" 
                          className="size-4 rounded-sm border-gray-300"
                           id={`option_${index}`}
                          onChange={() => handleSelectedCompanies(company.company?.id)} />
                        </div>
                      </label>
                    </div>
                    <Link
                        prefetch={false}
                        href={`/serviceproviders-details/${company.company?.slug}`}
                        className="link_color"
                      >
                      <img
                        alt=""
                        src={company?.company.bannerAsset?.url || "/no-image-available.jpg"}
                        className="h-44 w-full object-cover rounded-sm"                        
                      />
                    </Link>
                    <div className="bg-white p-2.5">
                      <h3 className="text-lg font-semibold pb-2 text-[#0071C2]">
                        <Link
                          prefetch={false}
                          href={`/serviceproviders-details/${company.company?.slug}`}
                          className="link_color"
                        >
                          <span>{company.company?.name}</span>
                        </Link>
                      </h3>
                      <ul className="space-y-2.5 text-sm font-medium">
                        { company.company.CompanyAddress.length > 0 &&  
                          <li className="flex items-center">
                            {company.company.CompanyAddress[0].city +","} {company.company.CompanyAddress[0].Country.name}
                          </li>
                        }
                        <li className="flex items-center">
                          <Link href={company.company.website.startsWith('http://') || company.company.website.startsWith('https://') ? company.company.website : `https://${company.company.website}`} target= "_blank"className="trancate hover:text-blue-350 text-[#0071C2]" >
                          {company.company.website.length > 30 
                            ? company.company.website.slice(0, 30) + "..." 
                            : company.company.website}</Link>
                        </li>
                        <li className="items-center space-y-1">
                        {company.company?.ServicesOpt?.slice(0, 3).map(
                            (services, index) =>
                              services.service &&
                              services.service.serviceName && (
                                <span key={index} className="inline-block">
                                  <button
                                    type="button"
                                    className={`text-gray-900 bg_${serviceColoring[services.service.groupId]} focus:outline-none font-medium rounded-sm text-sm px-2 py-1 me-2 cursor-auto`}
                                  >
                                    {services.service.serviceName}
                                  </button>
                                </span>
                              ),
                          )}
                        </li>
                      </ul>
                      {company.opportunityIntrested.length > 0 && 
                        <>
                          <p className="my-2.5 text-sm font-medium opacity-90">Selected portfolio highlights</p>
                          <div className="grid grid-cols-5 gap-4 lg:grid-cols-5 lg:gap-2 mb-1 items-center">
                            {company.opportunityIntrested.map((intrestedCompany:{fileUrl: string, type: string, thumbnailUrl: string}, index)=>(
                              <>
                                { index < 4 &&
                                  <button className="" onClick={() => setFilesToView(company.opportunityIntrested)}>
                                  <img alt="" src={intrestedCompany.thumbnailUrl} className=" h-8 w-full object-cover rounded-[4px]" />
                                </button>
                                }
                              </>
                              ))
                            }
                              <div className=" text-center text-xs font-medium link_color cursor-pointer" onClick={() => setFilesToView(company.opportunityIntrested)}>
                              11  More
                              </div>
                          </div>
                        </>
                      }
                      <ul className="space-y-2.5 text-sm font-medium mt-2.5">
                        <li className="flex items-center">

                          Employees: {company.company.companySizes ? company.company.companySizes?.size : 'NA'}
                        </li>
                        <li className="flex items-center">
                          <button onClick={()=>setValuesForOpportunity(company.description)} className="hover:text-blue-350 text-[#0071C2]" >
                            View written submission </button>
                        </li>
                      </ul>
                    </div>
                  </article>
                  </div>
                    </>
                  ))}
               </div>
            </div>
          </div>
          :
          <div className="min-h-screen flex justify-center items-center">
            <Spinner />
          </div>
      }
      {/* Details */}
      <SubscriptionPopup isDataEmpty={companiesLists} isOpened={openAddModal} setOpenAddModal={setOpenAddModal} issubscribed={openAddtoWarningModal} setopenAddtoWarningModal={setopenAddtoWarningModal} />
      <Modal show={openModal} onClose={() => setOpenModal(false)}>
        <Modal.Header className="modal_header">
          <b>Details</b>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            <div className="">{description}</div>
          </div>
        </Modal.Body>
        <Modal.Footer className="modal_footer">
          <Button
            className="h-[40px] button_blue"
            onClick={() => {
              setOpenModal(false);
            }}
          >
            Ok
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal
        size="6xl"
        className="fullportfolio"
        show={fullportfolioModal}
        onClose={() => setFullportfolioModal(false)}
      >
        <Modal.Header className="modal_header font-bold p-0"></Modal.Header>
        <Modal.Body className="modal_body">
          <div className="space-y-6 text-sm">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4 ">
              {currentAlbumPopupData != undefined && currentAlbumPopupData && currentAlbumPopupData.map((portfolios, index) =>

                <div
                  // key={`imagediv_${portfolios.id}`}
                  className="relative popup_thumbnails"
                  onClick={() => setAlbumIndex(index)}
                >
                  <Image
                    // key={`image_${portfolios.id}`}
                    width={640}
                    height={360}
                    className="h-auto max-w-full"
                    src={portfolios.type === 'image' ? portfolios.thumbnail || "" : portfolios.thumbnail || "/video-thumb.jpg"}
                    alt="image description"
                    // onClick={() => setAlbumIndex(index)}
                  />
                  {portfolios.type !== 'image' &&
                    <div className="absolute inset-0 flex justify-center items-center">
                      <Image
                        src="/play-icon.png"
                        alt="Play icon"
                        width={33}
                        height={33}
                        // onClick={() => setAlbumIndex(index)}
                      />
                    </div>
                  }

                </div>
              )}

            </div>
          </div>
        </Modal.Body>
      </Modal>
      {/* RDetails End */}
      {isOpenSilder && <CustomLightBox setIsOpenSilder={(value: boolean) => setIsOpenSilder(value)} openSlider={isOpenSilder} activeSlider={activeSlider} setCurrentLightBoxItems={(value: {fileUrl: string, type: string, thumbnail: string,}[]) => setCurrentLightBoxItems(value)} currentItems={currentLightBoxItems}></CustomLightBox>}
    </>
  );
};
export default Myopportunitiesinterestedcompanies;
