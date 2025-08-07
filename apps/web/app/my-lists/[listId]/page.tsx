"use client";
import Breadcrumbs from "@/components/breadcrumb";
import { PATH } from "@/constants/path";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Modal, Button } from "flowbite-react";
import { redirect, useRouter } from "next/navigation";
import { fetcher, deleteItem, patch, authFileFetcher, authFetcher } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import DataTable from "react-data-table-component";
import Image from "next/image";
import AddtoMyList from "@/components/addtomylistsidebar";
import "../../../public/css/detatable.css";
import { useUserContext } from "@/context/store";
import SubscriptionPopup from "@/components/subscriptionpopup";
import { serviceColoring } from "@/constants/serviceColors";
import { useAuthentication } from "@/services/authUtils";
import Spinner from "@/components/spinner";
import ButtonSpinner from "@/components/ui/buttonspinner";
import { toast } from "react-toastify";
import { useRandomDataContext } from "@/context/random-data-store";
import { fallbackCopyToClipboard } from "@/services/common-methods"
interface ListdataType {
  id: number;
  name: string;
  updatedAt: string | Date;
  description: string;
  company: {
    name: string;
    id: number;
    slug: string,
    website: string;
    logoAsset: {
      url: string | "/16by9 image.png";
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
        location_name: string;
        Country: {
          name: string;
        };
      },
    ];
    CompanyContacts: [
      {
        name: string;
        email: string;
        title: string;
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

      // assets?:[{
      //     url:string,
      // }],
      userRoles?: [
        {
          roleCode: string;
        },
      ];
    };
  };
}
const Mylistinterestedcompanies = (params: { params: { listId: number } }) => {
  const [openArchiveModal, setOpenArchiveModal] = useState<boolean>(false);
  const [companylist, setCompanyList] = useState<ListdataType[]>([]);
  const [listName, setListName] = useState<string>("");
  const [listDescr, setListDescr] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");
  const [openDeleteModal, setDeleteModal] = useState<boolean>(false);
  const [openRemoveModal, setRemoveModal] = useState<boolean>(false);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [listId, setListId] = useState<number | null>(null);
  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([]);
  const [archiveStatus, setArchivestatus] = useState<string>("Archive");
  const [openAddModal, setOpenAddModal] = useState<boolean>(false);
  const [openShareModal, setOpenShareModal] = useState<boolean>(false);
  const [mailToButtonLoader, setMailToButtonLoader] = useState<boolean>(false);
  const router = useRouter();
  const { user } = useUserContext();
  const [openAddtoWarningModal, setopenAddtoWarningModal] =
    useState<boolean>(false);
  const [isListUpdated, setIsListUpdated] = useState<boolean>(false);

  const updatedAddtoProps: boolean | undefined = false;
  const [isVisible, setIsVisible] = useState<boolean | undefined>(false);
  const [updatedAddto, setUpdatedAddto] = useState<boolean>();

  const onVisibilityChange = (isVisible: boolean) => setUpdatedAddto(isVisible);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [exportLists, setExportList] = useState<boolean>(false);
  const [companiesLists, setCompaniesLists] = useState<boolean>(false);
  const [buttonLoader, setButtonLoader] = useState<boolean>(false);
  const [openListCopyAndShareModal, setOpenListCopyAndShareModal] = useState<boolean>(false);
  const [sharableUrl, setSharableUrl] = useState("");
  const [textCopied, setTextCopied] = useState(false);
  const [fileCountExceedError, setFileCountExceedError] = useState<string>("");
  const { companyCounts, setCompanyCounts } = useRandomDataContext();
  const [copyLinkError, setCopyLinkError] = useState<string>("");

  useEffect(() => {
    setIsVisible(updatedAddto);
  }, [updatedAddto]);

  useAuthentication({ user, isPaidUserPage: true, isBuyerRestricted: false, });

  useEffect(() => {
    if (params.params.listId) {
      const companiesList = async () => {
        try {
          const dataa = await fetcher(
            getEndpointUrl(ENDPOINTS.getmylistbyid(params.params.listId)),
          );
          const data = dataa?.list;
          // console.log(data);
          if (data.length > 0) {
            setListName(data[0].name);
            setListDescr(data[0].description);
            if (data[0].isArchieve != false) {
              setArchivestatus("Unarchive");
            }
          } else {
            router.push("/page-not-found");
          }
        } catch (error) {
          console.error("Error fetching my lists:", error);
        }
      };
      companiesList();
    }
  }, [params]);
  const breadcrumbItems = [
    {
      label: PATH.HOME.name,
      path: PATH.HOME.path,
    },
    {
      label: PATH.MYLISTS.name,
      path: PATH.MYLISTS.path,
    },
    {
      label: listName,
      path: listName,
    },
  ];
  useEffect(() => {
    if (params.params.listId) {
      const companiesList = async () => {
        try {
          const data = await fetcher(
            getEndpointUrl(
              ENDPOINTS.getListIntrestedCompanies(params.params.listId),
            ),
          );
          const dataa = data?.data;
          if (dataa.length > 0) {
            setCompanyList(dataa);
            setCompaniesLists(true);
            // setIsLoading(false);
          }
          else {
            setCompanyList([]);
            setCompaniesLists(false);
            // setIsLoading(true);
          }
          setButtonLoader(false);
          setRemoveModal(false);
          setIsLoading(false);
        } catch (error) {
          console.error("Error fetching my list Details:", error);
        }
      };
      companiesList();
    }
  }, [params, isListUpdated]);
  const setArchiveList = (id: number) => {
    setButtonLoader(true);
    patch(`${getEndpointUrl(ENDPOINTS.archiveListbyId(id))}`).then(() => {
      setButtonLoader(false);
      setOpenArchiveModal(false);
      router.push("/my-lists");
    });
  };
  const setDeleteList = (id: number) => {
    setButtonLoader(true);
    deleteItem(`${getEndpointUrl(ENDPOINTS.deletemylistApi(id))}`).then(() => {
      setButtonLoader(false);
      setDeleteModal(false);
      router.push("/my-lists");
    });
  };
  const removeCompanyfromList = (comapanyId: number, listid: number) => {
    setButtonLoader(true);
    deleteItem(
      `${getEndpointUrl(ENDPOINTS.deletecompanyfromlist(comapanyId, listid))}`,
    ).then(() => {
      setIsListUpdated(!isListUpdated);
    });
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
  const handleSelectedCompanies = (comp_id: number, isChecked: boolean) => {
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
    const comparingCompaniesString = localStorage.getItem("comparingCompanies");
    const comparingCompanies = comparingCompaniesString ? JSON.parse(comparingCompaniesString) : [];
    let updatedComparingCompanies = isChecked ? [...comparingCompanies, comp_id] : comparingCompanies.filter((id: number) => id !== comp_id);
    const updatedComparingIds = new Set(updatedComparingCompanies)
    updatedComparingCompanies = Array.from(updatedComparingIds);
    localStorage.setItem("comparingCompanies", JSON.stringify(updatedComparingCompanies));
    setCompanyCounts(updatedComparingCompanies.length);
  };
  const removeCompanyfromListById = (
    companyId: number,
    listId: number,
    comapanyName: string,
  ) => {
    setCompanyId(companyId);
    setListId(listId);
    setCompanyName(comapanyName);
    setRemoveModal(true);
  };
  const columns = [
    {
      name: "",
      cell: (row: ListdataType) => (
        <div className="text-blue-300">
          <input
            id="checkbox-item-5"
            type="checkbox"
            value=""
            onChange={(e) => handleSelectedCompanies(row.company?.id, e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
          />
        </div>
      ),
      sortable: true,
    },
    {
      name: "Logo",
      cell: (row: ListdataType) => (
        <div className="text-blue-300">
          <Image
            src={row.company?.logoAsset?.url || "/circle-no-image-available.jpg"}
            className="w-10"
            alt=""
            width={210}
            height={210}
          />
        </div>
      ),
    },
    {
      name: "Name",
      cell: (row: ListdataType) => (
        <Link
          prefetch={false}
          href={`/serviceproviders-details/${row.company?.slug}`}
          className="link_color"
        >
          <span>{row.company?.name}</span>
        </Link>
      ),
      sortable: true,
      sortFunction: (a: ListdataType, b: ListdataType) =>
        a.company.name.localeCompare(b.company.name),
    },
    {
      name: "Core Services",
      cell: (row: ListdataType) => (
        <div className="text-blue-300 space-y-1">
          {row.company?.ServicesOpt?.slice(0, 3).map(
            (services, index) =>
              services.service &&
              services.service.serviceName && (
                <span key={index} className="inline-block">
                  <button
                    type="button"
                    className={`text-gray-900 bg_${serviceColoring[services.service.groupId]} focus:outline-none font-medium rounded-sm text-sm px-2 py-1 me-2`}
                  >
                    {services.service.serviceName}
                  </button>
                </span>
              ),
          )}
        </div>
      ),
      // sortable: true,
    },
    {
      name: "Country",
      cell: (row: ListdataType) => {
        if (row.company?.CompanyAddress) {
          const countriesToShow = row.company.CompanyAddress.slice(0, 3);
          const countryNames = countriesToShow
            .map((address) => address.Country.name)
            .join(", ");
          return (
            <span>
              {countryNames}
              {row.company.CompanyAddress.length > 3 && "..."}
            </span>
          );
        }
        return "";
      },
      sortable: true,
      sortFunction: (a: ListdataType, b: ListdataType) => {
        const countryNameA =
          a.company?.CompanyAddress?.[0]?.Country?.name || "";
        const countryNameB =
          b.company?.CompanyAddress?.[0]?.Country?.name || "";
        return countryNameA.localeCompare(countryNameB);
      },
    },
    {
      name: "Employees",
      cell: (row: ListdataType) => row.company?.companySizes?.size,
      sortable: true,
      sortFunction: (a: ListdataType, b: ListdataType) => {
        const sizeNameA = a.company?.companySizes?.size || "";
        const sizeNameB = b.company?.companySizes?.size || "";
        return sizeNameA.localeCompare(sizeNameB);
      },
    },
    {
      name: "Website",
      cell: (row: ListdataType) => (
        <Link
          prefetch={false}
          href={row.company?.website || "#"}
          target="__blank"
          className="link_color"
        >
          <span>{row.company?.website}</span>
        </Link>
      ),
      sortable: true,
      sortFunction: (a: ListdataType, b: ListdataType) => {
        const websiteNameA = a.company?.website.toLowerCase() || "";
        const websiteNameB = b.company?.website.toLowerCase() || "";
        return websiteNameA.localeCompare(websiteNameB);
      },
    },
    {
      name: "Contact Name",
      cell: (row: ListdataType) =>
        `${row.company?.CompanyContacts[0]?.name || ''}`,
      sortable: true,
      sortFunction: (a: ListdataType, b: ListdataType) => {
        const nameA = a.company?.CompanyContacts[0]?.name.toLowerCase() || "";
        const nameB = b.company?.CompanyContacts[0]?.name.toLowerCase() || "";
        return nameA.localeCompare(nameB);
      },
    },
    {
      name: "Actions",
      cell: (row: ListdataType) => (
        <div className="flex gap-4">
          <button
            onClick={() =>
              removeCompanyfromListById(
                row.company?.id,
                row.id,
                row.company.name,
              )
            }
            className="link_color"
          >
            <svg
              className="w-[16px] h-[16px] link_color me-1"
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
                d="m13 7-6 6m0-6 6 6m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            Remove
          </button>
        </div>
      ),
    },
  ];
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

  const downloadCsv = (id: number) => {
    setButtonLoader(true);
    setExportList(false);
    authFileFetcher(
      `${getEndpointUrl(ENDPOINTS.downloadListIntrestedCompaniesCsv(id))}`,
    )
      .then((result) => {
        setButtonLoader(false);
        // const blob = new Blob([result], { type: 'text/csv' });
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(result);
        link.download = "XDS-Spark_Service_Provider_List.xlsx";
        link.click();
        setOpenShareModal(false);
        toast.success('List exported successfully 👍');
      })
      .catch((error) => {
        if (error.message != "Bad Request") {
          setFileCountExceedError(error.message);
        } else {
          setExportList(true);
        }
        setButtonLoader(false);
        console.log(error);
      });
  };

  const getGeneratedTokenAndOpenSharingModal = async (type: string) => {
    setFileCountExceedError("");
    if (params.params.listId) {
      if (type === "copyLink") {
        setButtonLoader(true);
      } else {
        setMailToButtonLoader(true);
      }
      await authFetcher(`${getEndpointUrl(ENDPOINTS.generateUrlForListSharing(params.params.listId))}`).then((result) => {
        if (result.success && result.data) {
          if (type === "copyLink") {
            navigator.clipboard.writeText(result.data.trim()).then(() => {
              setTextCopied(true);
              setButtonLoader(false);
            })
            .catch((error) => {
              setCopyLinkError(result.data.trim());
              console.error("Failed to copy text:", error);
              setButtonLoader(false);
            });
          }
          else {
            setTextCopied(false);
            let link = `mailto:?subject=XDS Spark - List '${listName}'&body=Check out my List '${listName}' from XDS Spark.%0A${encodeURIComponent(result.data.trim())}`;
            window.open(link, '_blank');
            setMailToButtonLoader(false);
          }
          // setSharableUrl(result.data);
        }
        // setOpenListCopyAndShareModal(true);
      }).catch((err) => {
        console.log(err);
        setFileCountExceedError(err.message);
        setMailToButtonLoader(false);
        setButtonLoader(false);
      });
    }
  }

  // const handleOpenLink = () => {
  //   setTextCopied(false);
  //   let link = `mailto:?subject=XDS Spark - List '${listName}'&body=Check out my List '${listName}' from XDS Spark.%0A${encodeURIComponent(sharableUrl.trim())}`;
  //   window.open(link, '_blank');
  // }

  // const onClickCopyLink = () => {
  //   navigator.clipboard.writeText(sharableUrl.trim()).then(() => {
  //     setTextCopied(true);
  //   });
  // }

  const openCampareTo = () => {
    router.push("/compare");
  }

  return (
    <>
      {
        !isLoading ?
          <div className="w-full lg:container px-5 pos_r">
            <div className="pb-6 pt-6 breadcrumbs_s">
              <Breadcrumbs items={breadcrumbItems} />
            </div>
            <div className="flex justify-between">
              <div className="text-left">
                <h1 className="default_text_color header-font">{listName}</h1>
              </div>
              <div className="flex gap-4 text-sm font-medium">
                <button>
                  <Link
                    prefetch={false}
                    href={`/my-lists/update-list/${params.params.listId}`}
                    className="link_color"
                  >
                    <svg
                      className="w-3.5 h-3.5 me-1"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="m13.835 7.578-.005.007-7.137 7.137 2.139 2.138 7.143-7.142-2.14-2.14Zm-10.696 3.59 2.139 2.14 7.138-7.137.007-.005-2.141-2.141-7.143 7.143Zm1.433 4.261L2 12.852.051 18.684a1 1 0 0 0 1.265 1.264L7.147 18l-2.575-2.571Zm14.249-14.25a4.03 4.03 0 0 0-5.693 0L11.7 2.611 17.389 8.3l1.432-1.432a4.029 4.029 0 0 0 0-5.689Z" />
                    </svg>
                    Edit
                  </Link>
                </button>
                <button
                  onClick={() => setOpenArchiveModal(true)}
                  className="link_color"
                >
                  <svg
                    className="w-3.5 h-3.5 me-1"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 18 18"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M1 5v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H1Zm0 0V2a1 1 0 0 1 1-1h5.443a1 1 0 0 1 .8.4l2.7 3.6H1Z"
                    />
                  </svg>
                  <span>{archiveStatus}</span>
                </button>
                <button className="link_color" onClick={() => setDeleteModal(true)}>
                  <svg
                    className="w-3.5 h-3.5 me-1"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 18 20"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M1 5h16M7 8v8m4-8v8M7 1h4a1 1 0 0 1 1 1v3H6V2a1 1 0 0 1 1-1ZM3 5h12v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5Z"
                    />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
            <div className=" pt-6">
              <p className="text-sm default_text_color font-normal">{listDescr}</p>
            </div>
            <div className="py-6">
              <hr />
            </div>
            <div className="lg:flex justify-between">
              <div className="text-left">
                <h1 className="default_text_color heading-sub-font font-bold">
                  Service Providers
                </h1>
              </div>
              <div className="lg:mt-0 mt-3 text-sm font-medium space-x-3">
                <button
                  className={`link_color transition hover:text-blue-400 focus:outline-none ${(companyCounts > 5 || selectedCompanies.length < 1) && 'link_disabled'}`}
                  type="button"
                  onClick={() => { openCampareTo() }}
                  disabled={companyCounts > 5 || selectedCompanies.length < 1}
                >
                  <svg
                    className="w-3.5 h-3.5 me-1"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.546.5a9.5 9.5 0 1 0 9.5 9.5 9.51 9.51 0 0 0-9.5-9.5ZM13.788 11h-3.242v3.242a1 1 0 1 1-2 0V11H5.304a1 1 0 0 1 0-2h3.242V5.758a1 1 0 0 1 2 0V9h3.242a1 1 0 1 1 0 2Z" />
                  </svg>
                  <span className="">Compare selected</span>
                </button>
                <button
                  className="link_color transition hover:bg-gray-50 hover:text-blue-400 focus:outline-none"
                  type="button"
                  onClick={() => addListsidebar(isVisible || false)}
                >
                  <svg
                    className="w-3.5 h-3.5 me-1"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.546.5a9.5 9.5 0 1 0 9.5 9.5 9.51 9.51 0 0 0-9.5-9.5ZM13.788 11h-3.242v3.242a1 1 0 1 1-2 0V11H5.304a1 1 0 0 1 0-2h3.242V5.758a1 1 0 0 1 2 0V9h3.242a1 1 0 1 1 0 2Z" />
                  </svg>
                  Add to...
                </button>
                <button
                  className={`${companylist.length > 0 ? 'link_color' : 'text-gray-400'}`}
                  onClick={() => {
                    setFileCountExceedError(""), setOpenShareModal(true), setExportList(false);
                  }}
                  disabled={companylist.length === 0}
                >
                  <svg
                    className="w-3.5 h-3.5 text-blue-300  me-1"
                    version="1.1"
                    fill={companylist.length > 0 ? '#0071C2' : '#a0aec0'}
                    id="fi_25407"
                    xmlns="http://www.w3.org/2000/svg"
                    x="0px"
                    y="0px"
                    viewBox="0 0 475.078 475.077"
                  >
                    <g>
                      <g>
                        <path
                          d="M467.083,318.627c-5.324-5.328-11.8-7.994-19.41-7.994H315.195l-38.828,38.827c-11.04,10.657-23.982,15.988-38.828,15.988
                  c-14.843,0-27.789-5.324-38.828-15.988l-38.543-38.827H27.408c-7.612,0-14.083,2.669-19.414,7.994
                  C2.664,323.955,0,330.427,0,338.044v91.358c0,7.614,2.664,14.085,7.994,19.414c5.33,5.328,11.801,7.99,19.414,7.99h420.266
                  c7.61,0,14.086-2.662,19.41-7.99c5.332-5.329,7.994-11.8,7.994-19.414v-91.358C475.078,330.427,472.416,323.955,467.083,318.627z
                    M360.025,414.841c-3.621,3.617-7.905,5.424-12.854,5.424s-9.227-1.807-12.847-5.424c-3.614-3.617-5.421-7.898-5.421-12.844
                  c0-4.948,1.807-9.236,5.421-12.847c3.62-3.62,7.898-5.431,12.847-5.431s9.232,1.811,12.854,5.431
                  c3.613,3.61,5.421,7.898,5.421,12.847C365.446,406.942,363.638,411.224,360.025,414.841z M433.109,414.841
                  c-3.614,3.617-7.898,5.424-12.848,5.424c-4.948,0-9.229-1.807-12.847-5.424c-3.613-3.617-5.42-7.898-5.42-12.844
                  c0-4.948,1.807-9.236,5.42-12.847c3.617-3.62,7.898-5.431,12.847-5.431c4.949,0,9.233,1.811,12.848,5.431
                  c3.617,3.61,5.427,7.898,5.427,12.847C438.536,406.942,436.729,411.224,433.109,414.841z"
                        ></path>
                        <path
                          d="M224.692,323.479c3.428,3.613,7.71,5.421,12.847,5.421c5.141,0,9.418-1.808,12.847-5.421l127.907-127.908
                  c5.899-5.519,7.234-12.182,3.997-19.986c-3.23-7.421-8.847-11.132-16.844-11.136h-73.091V36.543c0-4.948-1.811-9.231-5.421-12.847
                  c-3.62-3.617-7.901-5.426-12.847-5.426h-73.096c-4.946,0-9.229,1.809-12.847,5.426c-3.615,3.616-5.424,7.898-5.424,12.847V164.45
                  h-73.089c-7.998,0-13.61,3.715-16.846,11.136c-3.234,7.801-1.903,14.467,3.999,19.986L224.692,323.479z"
                        ></path>
                      </g>
                    </g>
                  </svg>
                  Export
                </button>

                <button
                  className="link_color"
                  onClick={() => {setOpenListCopyAndShareModal(true); setFileCountExceedError("")}}
                >
                  <svg
                    className="w-[18px] h-[18px] me-1"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="2"
                      d="m8 10.9 7-3.2m-7 5.4 7 3.2M8 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm12 5.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm0-11a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"
                    />
                  </svg>
                  Share Link
                </button>
              </div>
              <AddtoMyList
                updatedAddto={updatedAddto}
                onVisibilityChange={(val: boolean) => setUpdatedAddto(val)}
                selectedCompanies={selectedCompanies}
              ></AddtoMyList>
            </div>
            <div className="py-6 table-responsive">
              <div className="list_intrested_table">
                <DataTable
                  customStyles={tableHeaderstyle}
                  columns={columns}
                  data={companylist}
                  highlightOnHover={true}
                />
              </div>
            </div>
          </div>
          :
          <div className="min-h-screen flex justify-center items-center">
            <Spinner />
          </div>

      }

      <SubscriptionPopup isOpened={openAddModal} setOpenAddModal={setOpenAddModal} isDataEmpty={companiesLists} issubscribed={openAddtoWarningModal} setopenAddtoWarningModal={setopenAddtoWarningModal} />
      {/* Details */}
      <Modal
        show={openArchiveModal}
        onClose={() => setOpenArchiveModal(false)}
        size="sm"
      >
        <Modal.Header className="modal_header">
          <b>Are you sure?</b>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            <div className="">
              <p className="text-sm default_text_color font-normal leading-6">
                You are about to {archiveStatus} {listName}
              </p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="modal_footer">
          <Button
            color="gray"
            className="h-[40px] button_cancel"
            onClick={() => {
              setOpenArchiveModal(false);
            }}
          >
            Cancel
          </Button>
          <Button
            className="h-[40px] button_blue"
            onClick={() => {
              setArchiveList(params.params.listId);
            }}
            disabled={buttonLoader}
          >{buttonLoader ? <ButtonSpinner></ButtonSpinner> : archiveStatus}

          </Button>
        </Modal.Footer>
      </Modal>
      <Modal
        show={openDeleteModal}
        onClose={() => setDeleteModal(false)}
        size="sm"
      >
        <Modal.Header className="modal_header">
          <b>Are you sure?</b>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            <div className="">
              <p className="text-sm default_text_color font-normal leading-6">
                You are about to delete {listName}. Deleting will also remove this list from any associated Projects you have created.
              </p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="modal_footer">
          <Button
            color="gray"
            className="h-[40px] button_cancel"
            onClick={() => {
              setDeleteModal(false);
            }}
          >
            Cancel
          </Button>
          <Button
            className="h-[40px] button_blue"
            onClick={() => {
              setDeleteList(params.params.listId);
            }}
            disabled={buttonLoader}
          >{buttonLoader ? <ButtonSpinner></ButtonSpinner> : 'Delete'}

          </Button>
        </Modal.Footer>
      </Modal>
      <Modal
        show={openRemoveModal}
        onClose={() => setRemoveModal(false)}
        size="sm"
      >
        <Modal.Header className="modal_header">
          <b>Are you sure?</b>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            <div className="">
              <p className="text-sm default_text_color font-normal leading-6">
                You are about to remove {companyName}
              </p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="modal_footer">
          <Button
            color="gray"
            className="h-[40px] button_cancel"
            onClick={() => {
              setRemoveModal(false);
            }}
          >
            Cancel
          </Button>
          <Button
            className="h-[40px] button_blue"
            onClick={() => {
              if (companyId != null && listId != null) {
                removeCompanyfromList(companyId, listId);
              } else {
                console.error("Company Id is null.");
              }
            }}
            disabled={buttonLoader}
          >{buttonLoader ? <ButtonSpinner></ButtonSpinner> : 'Remove'}
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal
        size="sm"
        show={openShareModal}
        onClose={() => setOpenShareModal(false)}
      >
        <Modal.Header className="modal_header">
          <b>Export a file to share</b>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            <div className="">
              <p className="text-sm default_text_color font-normal leading-6">
                Clicking the Export button will download an Excel file with the
                list of Companies in this List. You can then share that file
                with your team.
              </p>
            </div>
          </div>
          {exportLists && (
            <div className="font-medium text-red-600 text-sm mt-5">
              <p>There are no companies to export</p>
            </div>
          )}
          {fileCountExceedError && (
            <div className="font-medium text-red-600 text-sm mt-5">
              <p>{fileCountExceedError}</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="modal_footer">
          <Button
            color="gray"
            className="h-[40px] button_cancel"
            onClick={() => {
              setOpenShareModal(false);
            }}
          >
            Cancel
          </Button>
          {!fileCountExceedError && <Button
            className="h-[40px] button_blue"
            onClick={() => downloadCsv(params.params.listId)}
            disabled={buttonLoader}
          >{buttonLoader ? <ButtonSpinner></ButtonSpinner> : 'Export'}
          </Button>
          }
        </Modal.Footer>
      </Modal>
      <Modal
        size="sm"
        show={openListCopyAndShareModal}
        onClose={() => { setOpenListCopyAndShareModal(false); setTextCopied(false); setCopyLinkError("");}}
      >
        <Modal.Header className="modal_header">
          <b>Share Link</b>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            <div className="">
              <p className="text-sm default_text_color font-normal leading-6">
                You are about to share link for '{listName}' list. This link is valid only for 4 weeks.
              </p>
            </div>
          </div>
          {copyLinkError &&
              <div className="font-medium text-sm mt-5" >
                Please <button className="link_color underline" onClick={()=>fallbackCopyToClipboard(copyLinkError)}>Click Here</button> to copy the link to clipboard.
              </div>
          }
          {fileCountExceedError &&
            <div className="font-medium text-red-600 text-sm mt-5">
              <p>{fileCountExceedError}</p>
            </div>
          }
        </Modal.Body>
        <Modal.Footer className="modal_footer">
          {!fileCountExceedError && !copyLinkError &&
          <>
            <Button className="h-[40px] button_blue button_pad" onClick={() => getGeneratedTokenAndOpenSharingModal("mailTo")} disabled={mailToButtonLoader}>
              {mailToButtonLoader ? <ButtonSpinner></ButtonSpinner> : 'Email Link'}
            </Button>

            <Button onClick={textCopied ? () => { } : () => getGeneratedTokenAndOpenSharingModal("copyLink")} className="h-[40px] button_blue button_pad" disabled={buttonLoader}>
              {buttonLoader ? <ButtonSpinner></ButtonSpinner> :
                <div>
                  {
                    textCopied ?
                      <> Link Copied
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
                      :
                      "Copy Link"
                  }
                </div>
              }
            </Button>
          </>
          }
        </Modal.Footer>
      </Modal>
      {/* RDetails End */}
    </>
  );
};
export default Mylistinterestedcompanies;
