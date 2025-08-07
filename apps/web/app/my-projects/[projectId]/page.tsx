"use client";
import Breadcrumbs from "@/components/breadcrumb";
import { PATH } from "@/constants/path";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Modal, Button, Tooltip, Checkbox, Label, TextInput } from "flowbite-react";
import { useRouter } from "next/navigation";
import { fetcher, patch, deleteItem, authFileFetcher, authFetcher } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import DataTable from "react-data-table-component";
import "../../../public/css/detatable.css";
import { useUserContext } from "@/context/store";
import SubscriptionPopup from "@/components/subscriptionpopup";
import { useAuthentication } from "@/services/authUtils";
import Spinner from "@/components/spinner";
import { formatDate } from "@/services/common-methods";
import useCommonPostData from "@/hooks/commonPostData";
import ButtonSpinner from "@/components/ui/buttonspinner";
import { toast } from "react-toastify";
import { fallbackCopyToClipboard } from "@/services/common-methods"

interface ListdataType {
  id: number;
  name: string;
  updatedAt: string | Date;
  description: string;
  isshortlisted: boolean;
  list: {
    id: number;
    name: string;
    updatedAt: Date;
    description: string;
  };
}
interface MyListdataType {
  id: number;
  name: string;
  updatedAt: Date;
  description: string;
}

type MylistFormData = {
  companies?: number[] | undefined;
  mylist?: number[] | undefined;
  newlistname?: string | undefined;
  loggedUserId?: number;
  projectId: number;
};



const Myprojectinterestedcompanies = (params: {
  params: { projectId: number };
}) => {
  const { user } = useUserContext();
  useAuthentication({ user, isBuyerRestricted: false, isPaidUserPage: true });
  const [openArchiveModal, setOpenArchiveModal] = useState(false);
  const [listName, setListName] = useState<string>("");
  const [projectDescr, setProjectDescr] = useState<string>("");
  const [projectName, setProjectName] = useState<string>("");
  const [projectId, setProjectId] = useState<number>(0);
  const [openDeleteModal, setDeleteModal] = useState<boolean>(false);
  const [openRemoveModal, setRemoveModal] = useState<boolean>(false);
  const [archiveStatus, setArchivestatus] = useState<string>("Archive");
  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([]);

  const [updatedAddto, setUpdatedAddto] = useState<boolean>();
  const [isVisible, setIsVisible] = useState<boolean | undefined>(false);
  const [openAddModal, setOpenAddModal] = useState<boolean>(false);
  const updatedAddtoProps: boolean | undefined = false;
  const sendselectedCompanies = (companies: number[]) => companies;
  const [rowId, setRowId] = useState<number | null>(null);

  const [openAllShareModal, setAllOpenShareModal] = useState<boolean>(false);
  const [openShareModal, setOpenShareModal] = useState<boolean>(false);
  const router = useRouter();

  const [openAddtoWarningModal, setopenAddtoWarningModal] =
    useState<boolean>(false);
  const onVisibilityChange = (isVisible: boolean) => setUpdatedAddto(isVisible);
  const [isListUpdated, setIsListUpdated] = useState<boolean>(false);
  const [exportList, setexportList] = useState<boolean>(false);
  const [fileCountExceedError, setFileCountExceedError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [mylists, setMylists] = useState<ListdataType[]>([]);

  const [mylist, setMyList] = useState<MyListdataType[]>([]);

  const [selectedmylist, setselectedMyList] = useState<number[] | undefined>();
  const [newmylistinput, setNewmyListinput] = useState<string>();
  const [AfteFormSubmitMessage, setAfteFormSubmitMessage] =
    useState<boolean>(false);
  const [isListValidationFailed, setisListValidationFailed] =
    useState<boolean>();

  const [isMyListButtonEnabled, setisMyListButtonEnabled] =
    useState<boolean>(true);
  const [buttonLoader, setButtonLoader] = useState<boolean>(false);
  const [mailToButtonLoader, setMailToButtonLoader] = useState<boolean>(false);
  const [sharableUrl, setSharableUrl] = useState("");
  const [openListCopyAndShareModal, setOpenListCopyAndShareModal] = useState<boolean>(false);
  const [textCopied, setTextCopied] = useState(false);
  const [copyLinkError, setCopyLinkError] = useState<string>("");


  useEffect(() => {
    if (params.params.projectId) {
      const companiesList = async () => {
        try {
          const dataa = await fetcher(
            getEndpointUrl(ENDPOINTS.getmyprojectbyid(params.params.projectId)),
          );
          const data = dataa?.list;
          setProjectName(data[0].name);
          setProjectId(data[0].id);
          setProjectDescr(data[0].description);
          if (data[0].isArchieve != false) {
            setArchivestatus("Unarchive");
          }
        } catch (error) {
          console.error("Error fetching my lists:", error);
        }
      };


      companiesList();

    }
  }, [params]);

  useEffect(() => {
    if (params.params.projectId) {
      const companiesList = async () => {
        try {
          const data = await fetcher(
            getEndpointUrl(
              ENDPOINTS.getProjectIntrestedCompanies(params.params.projectId),
            ),
          );
          const dataa = data?.data;
          console.log(dataa);
          if (dataa.length > 0) {
            setMylists(dataa);
            // setIsLoading(false);
          }
          else {
            setMylists([]);
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

  useEffect(() => {

    const myLists = async () => {
      try {
        const dataa = await fetcher(
          getEndpointUrl(ENDPOINTS.getArchivedList(user ? user.id : 0)),
        );
        const data = dataa?.list;
        let updatedData = [...(data || [])].map((d) => {
          d.updatedAt = new Date(d.updatedAt);
          return d;
        });
        if (data.length > 0) {
          ;
          const newListIds = mylists.map(item => item.list.id);
          const newdata = updatedData.filter(item => !newListIds.includes(item.id));
          setMyList(newdata);
        }
        else {
          setMyList([]);
        }
      } catch (error) {
        console.error("Error fetching my lists:", error);
      }
    };

    myLists();

  }, [mylists]);

  const breadcrumbItems = [
    {
      label: PATH.HOME.name,
      path: PATH.HOME.path,
    },
    {
      label: PATH.MYPROJECTS.name,
      path: PATH.MYPROJECTS.path,
    },
    {
      label: projectName,
      path: projectName,
    },
  ];
  // const sortedData = useMemo(() => {
  //   return companylist
  //     .slice()
  //     .sort((a, b) => a.company?.name.localeCompare(b.company?.name));
  // }, [companylist]);
  const columns = [
    {
      name: "List Name",
      cell: (row: ListdataType) => (
        <div className="flex align-items-center gap-2 link_color">
          <Link prefetch={false} href={`/my-lists/${row.list.id}`}>
            <span>{row.list.name}</span>
          </Link>
        </div>
      ),
      sortable: true,
      sortFunction: (a: ListdataType, b: ListdataType) =>
        a.list.name.localeCompare(b.list.name),
    },
    {
      name: "Description",
      cell: (row: ListdataType) => row.list.description,
      sortable: true,
      sortFunction: (a: ListdataType, b: ListdataType) =>
        a.list.description.localeCompare(b.list.description),
    },
    {
      name: "Last Edited",
      cell: (row: ListdataType) => formatDate(row.list.updatedAt),
      sortable: true,
      sortFunction: (a: ListdataType, b: ListdataType) => {
        const dateA = a.list.updatedAt;
        const dateB = b.list.updatedAt;
        const stringA = formatDate(dateA).toString();
        const stringB = formatDate(dateB).toString();
        return stringA.localeCompare(stringB);
      },
    },
    {
      name: "Actions",
      cell: (row: ListdataType) => (
        <div className="flex gap-4">
          <button
            onClick={() => { setRemoveModal(true); setRowId(row.list.id); setListName(row.list.name); }}
            className="link_color"
          >
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
          <button
            className="link_color"
            onClick={() => { setFileCountExceedError(""); setexportList(false);setOpenShareModal(true); setRowId(row.list.id) }}
          >
            <svg
              className="w-3.5 h-3.5 text-blue-300  me-1"
              version="1.1"
              fill={mylists.length > 0 ? '#0071C2' : '#a0aec0'}
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
        </div>
      ),
    },
  ];

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
    console.log(updateSelectCompanies);
    setSelectedCompanies(updateSelectCompanies);
  };

  const setArchiveList = (id: number) => {
    setButtonLoader(true);
    patch(`${getEndpointUrl(ENDPOINTS.archiveProjectbyId(id))}`).then(() => {
      router.push("/my-projects");
    });
    setButtonLoader(false);
    setOpenArchiveModal(false);
  };
  const setDeleteList = (id: number) => {
    setButtonLoader(true);
    deleteItem(`${getEndpointUrl(ENDPOINTS.deletemyProjectApi(id))}`).then(
      () => {
        router.push("/my-projects");
      },
    );
    setButtonLoader(false);
    setDeleteModal(false);
  };
  const deleteCompanyfromList = (id: number, projectId: number) => {
    setButtonLoader(true);
    deleteItem(
      `${getEndpointUrl(ENDPOINTS.deletecompanyfromproject(projectId, id))}`,
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
  const addListsidebar = (isEnabled: boolean) => {
    if (user?.isPaidUser) {
      //   if (selectedCompanies.length > 0) {
      console.log(isVisible);
      setIsVisible(true);
      onVisibilityChange(!isEnabled);
      //   } else {
      //     setOpenAddModal(true);
      //   }
    } else if(!user?.isPaidUser && user?.userRoles[0].roleCode === "buyer") {
      setIsVisible(true);
      onVisibilityChange(!isEnabled);
    } else {
      setopenAddtoWarningModal(true);
    }
  };
  //   useEffect(() => {
  //     setIsVisible(updatedAddtoProps);
  //   }, [updatedAddtoProps, sendselectedCompanies]);
  const downloadAllListsCsv = (id: number) => {
    setButtonLoader(true);
    setFileCountExceedError("");
    authFileFetcher(
      `${getEndpointUrl(ENDPOINTS.downloadProjectIntrestedCompaniesCsv(id))}`,
    )
      .then((result) => {
        setButtonLoader(false);
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(result);
        link.download = "XDS-Spark_Project_Service_Provider_List.xlsx";
        link.click();
        setAllOpenShareModal(false);
        toast.success('Project lists exported successfully 👍');
      })
      .catch((error) => {
        if (error.message != "Bad Request") {
          setFileCountExceedError(error.message);
        } else {
          setexportList(true);
        }
        setButtonLoader(false);
      });
  };

  async function downloadCsv(id: number) {
    setButtonLoader(true);
    setexportList(false);
    setFileCountExceedError("");
    authFileFetcher(
      `${getEndpointUrl(ENDPOINTS.downloadListIntrestedCompaniesCsv(id))}`,
    )
      .then((result) => {
        setButtonLoader(false);
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(result);
        link.download = "XDS-Spark_Service_Provider_List.csv";
        link.click();
        setOpenShareModal(false);
        toast.success('Project exported successfully 👍');
      })
      .catch((error) => {
        if (error.message != "Bad Request") {
          setFileCountExceedError(error.message);
        } else {
          setexportList(true);
        }
        setButtonLoader(false);
        return;
      });
  }

  const handleMyList = (listId: number) => {
    let updatedMylist: number[] = [];
    if (selectedmylist) {
      updatedMylist = [...selectedmylist];
      const isSelected = updatedMylist.includes(listId);
      if (isSelected) {
        updatedMylist = selectedmylist.filter((list) => list != listId);
      } else {
        updatedMylist.push(listId);
      }
    } else {
      updatedMylist.push(listId);
    }
    setselectedMyList(updatedMylist);
  };

  const handleMylistinput = () => {
    const myListinputElement = document.getElementById("new_mylist_name");
    if (myListinputElement instanceof HTMLInputElement) {
      setNewmyListinput(myListinputElement.value);
    }
  };

  const { submitForm: submitMylListForm } = useCommonPostData<MylistFormData>({
    url: getEndpointUrl(ENDPOINTS.addListsToMyProjects),
  });

  const handleAddto = async () => {
    setAfteFormSubmitMessage(false);
    let loggedUserId = undefined;
    if (user && user.id) {
      loggedUserId = user.id;
    }

    const myListinputElement = document.getElementById("new_mylist_name");
    let newmylistname = "";
    if (myListinputElement instanceof HTMLInputElement) {
      newmylistname = myListinputElement.value;
    }
    if (selectedmylist?.length || newmylistname != "") {
      setisMyListButtonEnabled(false);
      const result = await submitMylListForm({
        loggedUserId: loggedUserId,
        companies: selectedCompanies,
        projectId: projectId,
        mylist: selectedmylist,
        newlistname: newmylistname,
      });
      if (result.data.success) {
        setAfteFormSubmitMessage(true);
        setselectedMyList([]);
        setNewmyListinput("");
        setIsListUpdated(!isListUpdated);
        if (myListinputElement instanceof HTMLInputElement) {
          myListinputElement.value = "";
        }
        setTimeout(() => {
          setAfteFormSubmitMessage(false);
          setIsVisible(false);
          setisMyListButtonEnabled(true);
        }, 1000);
      }
    } else {
      setisListValidationFailed(true);
    }
  };

  const getGeneratedTokenAndOpenSharingModal = async (type: string) => {
    setFileCountExceedError("");
    if (params.params.projectId) {
      if (type === "copyLink") {
        setButtonLoader(true);
      } else {
        setMailToButtonLoader(true);
      }
      await authFetcher(`${getEndpointUrl(ENDPOINTS.generateUrlForProjectSharing(params.params.projectId))}`).then((result) => {
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
          } else {
            setTextCopied(false);
            let link = `mailto:?subject=XDS Spark - Project '${projectName}'&body=Check out my project '${projectName}' from XDS Spark.%0A${encodeURIComponent(result.data.trim())}`;
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

  // const onClickCopyLink = async() => {
  //   await getGeneratedTokenAndOpenSharingModal();
  //   await navigator.clipboard.writeText(sharableUrl.trim()).then(() => {
  //     setTextCopied(true);
  //   });
  // }

  // const handleOpenLink = async () => {
  //   setTextCopied(false);
  //   await getGeneratedTokenAndOpenSharingModal();
  //   let link = `mailto:?subject=XDS Spark - Project '${projectName}'&body=Check out my project '${projectName}' from XDS Spark.%0A${encodeURIComponent(sharableUrl.trim())}`;
  //   window.open(link, '_blank');
  //   setButtonLoader(false);
  // }

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
                <h1 className="default_text_color header-font">{projectName}</h1>
              </div>
              <div className="flex gap-4 text-sm font-medium">
                <button>
                  <Link
                    prefetch={false}
                    href={`/my-projects/update-project/${params.params.projectId}`}
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
                  {archiveStatus}
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
              <p className="text-sm default_text_color font-normal">{projectDescr}</p>
            </div>
            <div className="py-6">
              <hr />
            </div>
            <div className="lg:flex justify-between">
              <div className="text-left">
                <h1 className="default_text_color heading-sub-font font-bold">
                  Service Provider Lists
                </h1>
              </div>
              <div className="text-sm font-medium lg:pt-0 pt-6">
                <span className="flex">
                  <button
                    className=" link_color "
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
                    <span className="relative">Add List to Project
                    </span>
                  </button>
                  <Tooltip
                    content="Add pre-existing or new lists of Service Providers to this project."
                    className="tier_tooltip"
                  >
                    <svg
                      className="w-[16px] h-[16px] text-gray-600 ml-1.5"
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

                  <button
                    className={` pl-3 ${mylists.length > 0 ? 'link_color' : 'text-gray-400'}`}
                    onClick={() => {
                      setAllOpenShareModal(true);
                      setFileCountExceedError("");
                      setexportList(false);
                    }}
                    disabled={mylists.length === 0}
                  >
                    <svg
                      className="w-3.5 h-3.5 text-blue-300  me-1"
                      version="1.1"
                      fill={mylists.length > 0 ? '#0071C2' : '#a0aec0'}
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
                    className="link_color pl-3"
                    onClick={() => { setOpenListCopyAndShareModal(true), setFileCountExceedError("") }}
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
                </span>
              </div>
              {/* <AddtoMyList
              updatedAddto={updatedAddto}
              onVisibilityChange={(val: boolean) => setUpdatedAddto(val)}
              selectedCompanies={selectedCompanies}
            ></AddtoMyList> */}
            </div>
            <div className="py-6 table-responsive">
              <div className="mylists_table">
                {mylists.length > 0 ?
                  <DataTable
                    customStyles={tableHeaderstyle}
                    columns={columns}
                    data={mylists}
                    highlightOnHover={true}
                  />
                  :
                  <div className="pt-6 text-center">
                    <p>There are currently no lists in this project.</p>
                    <p>Select Add List to Project to add lists of Service Providers.</p>
                  </div>
                }

              </div>
            </div>
          </div>
          :
          <div className="min-h-screen flex justify-center items-center">
            <Spinner />
          </div>
      }

      {/* Details */}
      <SubscriptionPopup isOpened={openAddModal} setOpenAddModal={setOpenAddModal} issubscribed={openAddtoWarningModal} setopenAddtoWarningModal={setopenAddtoWarningModal} isDataEmpty={true} />

      {isVisible && (
        <div className="addto_sidebar_list">
          <div className="block p-6 bg-white border border-gray-200 shadow-lg width_400">
            <h5 className="font-bold default_text_color header-font">
              Add List
            </h5>
            <div className="absolute right-3 top-4">
              <button
                type="button"
                className="bg-white hover:bg-gray-100 focus:ring-0 font-medium rounded-sm text-sm px-1.5 py-1"
                onClick={() => { setIsVisible(false); setisListValidationFailed(false) }}
                aria-label="Close Sidebar"
              >
                <svg
                  className="w-[18px] h-[18px]"
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
                    d="M6 18 18 6m0 12L6 6"
                  />
                </svg>
              </button>
            </div>
            <div className="sm:block pt-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex gap-6" aria-label="Tabs">
                  <span
                    className={`cursor-pointer flex shrink-0 border-b-2 px-1 pb-2 font-bold text-sm shrink-0 border-b-2 px-1 text-sky-600  border-sky-500 `}
                  >
                    My Lists{" "}
                    <Tooltip
                      content="Create and manage lists of Service Providers, share with others"
                      className="tier_tooltip"
                    >
                      <svg
                        className="ms-2 w-[18px] h-[18px] text-gray-600 dark:text-white"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fillRule="evenodd"
                          d="M2 12a10 10 0 1 1 20 0 10 10 0 0 1-20 0Zm9-3a1.5 1.5 0 0 1 2.5 1.1 1.4 1.4 0 0 1-1.5 1.5 1 1 0 0 0-1 1V14a1 1 0 1 0 2 0v-.5a3.4 3.4 0 0 0 2.5-3.3 3.5 3.5 0 0 0-7-.3 1 1 0 0 0 2 .1c0-.4.2-.7.5-1Zm1 7a1 1 0 1 0 0 2 1 1 0 1 0 0-2Z"
                          clipRule="evenodd"
                        />
                      </svg>{" "}
                    </Tooltip>
                  </span>
                </nav>
              </div>
              <div className="py-6">
                <div className="flex max-w-md flex-col gap-4">
                  {/* <div className="flex items-center gap-2">
                                    <Checkbox id="accept" defaultChecked />
                                    <Label htmlFor="accept" className="flex">AD Studios</Label>
                                </div> */}
                  {mylist.map((list: MyListdataType) => (
                    <div
                      key={`key_list_${list.id}`}
                      className="flex items-center gap-2"
                    >
                      <Checkbox
                        id={`list_${list.id}`}
                        checked={selectedmylist?.includes(list.id)}
                        onChange={() => handleMyList(list.id)}
                        disabled={newmylistinput ? true : false}
                      />
                      <Label htmlFor={`list_${list.id}`}>{list.name}</Label>
                    </div>
                  ))}
                  <div className="pb-6">
                    <p className="font-bold text-sm">
                      Or create a new list
                    </p>
                    <div className="mb-2 block">
                      <Label
                        htmlFor="name_list"
                        className="font-bold"
                      />
                    </div>
                    <TextInput
                      autoComplete="off"
                      name="new_mylist_name"
                      onChange={handleMylistinput}
                      id="new_mylist_name"
                      type="text"
                      placeholder="Name the new list"
                      required
                      readOnly={selectedmylist?.length ? true : false}
                    />
                    {isListValidationFailed ? (
                      <span className="errorclass text-red-650">
                        Please Select or Add atleast one List
                      </span>
                    ) : null}
                    {AfteFormSubmitMessage ? (
                      <span className="errorclass green_c text-sm">
                        Successfully Added
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="footer_bg flex  justify-between">
                <div>
                  <button
                    type="submit"
                    className="p-0.5 font-medium  focus:outline-none border rounded-sm button_cancel h-[40px] px-6 text-sm"
                    onClick={() => { setIsVisible(false); setisListValidationFailed(false) }}
                  >
                    Cancel
                  </button>{" "}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleAddto}
                    disabled={!isMyListButtonEnabled}
                    className="p-0.5 font-medium  focus:outline-none text-white text-sm border-transparent  rounded-sm focus:ring-0 button_blue h-[40px] px-6"
                  >
                    Save
                  </button>{" "}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                You are about to {archiveStatus} {projectName}
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
              setArchiveList(params.params.projectId);
            }}
            disabled={buttonLoader}
          >{buttonLoader ? <ButtonSpinner></ButtonSpinner> : archiveStatus}
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
                Clicking the Export button will download an Excel file with the list of Companies in this List. You can then share that file with your team.
              </p>
            </div>
          </div>
          {exportList &&
            <div className="font-medium text-red-600 text-sm mt-5">
              <p>There are no companies to export</p>
            </div>
          }
          {fileCountExceedError &&
            <div className="font-medium text-red-600 text-sm mt-5">
              <p>{fileCountExceedError}</p>
            </div>
          }

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
         {!fileCountExceedError && !exportList &&  <Button
            className="h-[40px] button_blue"
            onClick={() => {
              if (rowId !== null) {
                downloadCsv(rowId);
              } else {
                console.error("List Id is null. Cannot Export.");
              }
            }}
            disabled={buttonLoader}
          >{buttonLoader ? <ButtonSpinner></ButtonSpinner> : 'Export'}
          </Button>}
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
                You are about to delete {projectName}
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
              setDeleteList(params.params.projectId);
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
                You are about to delete {listName}
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
              if (rowId != null) {
                deleteCompanyfromList(params.params.projectId, rowId);
              } else {
                console.error("Company Id is null.");
              };
              setRemoveModal(false);
            }}
            disabled={buttonLoader}
          >{buttonLoader ? <ButtonSpinner></ButtonSpinner> : 'Delete'}

          </Button>
        </Modal.Footer>
      </Modal>
      <Modal
        size="sm"
        show={openAllShareModal}
        onClose={() => setAllOpenShareModal(false)}
      >
        <Modal.Header className="modal_header">
          <b>Export a file to share</b>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            <div className="">
              <p className="text-sm default_text_color font-normal leading-6">
                Clicking the Export button will download an Excel file with your Service Providers lists separated by tabs. You can share this file with your teams and studios.
              </p>
            </div>
          </div>
          {exportList && (
            <div className="font-medium text-red-600 text-sm mt-5">
              <p>There are no companies to export</p>
            </div>
          )}
          {fileCountExceedError &&
            <div className="font-medium text-red-600 text-sm mt-5">
              <p>{fileCountExceedError}</p>
            </div>
          }
        </Modal.Body>
        <Modal.Footer className="modal_footer">
          <Button
            color="gray"
            className="h-[40px] button_cancel"
            onClick={() => {
              setAllOpenShareModal(false);
            }}
          >
            Cancel
          </Button>
          {!fileCountExceedError &&
            <Button
              className="h-[40px] button_blue"
              onClick={() => downloadAllListsCsv(params.params.projectId)}
              disabled={buttonLoader}
            >{buttonLoader ? <ButtonSpinner></ButtonSpinner> : 'Export'}

            </Button>
          }
        </Modal.Footer>
      </Modal>

      <Modal
        size="sm"
        show={openListCopyAndShareModal}
        onClose={() => { setOpenListCopyAndShareModal(false); setTextCopied(false); setCopyLinkError(""); }}
      >
        <Modal.Header className="modal_header">
          <b>Share Link</b>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            <div className="">
              <p className="text-sm default_text_color font-normal leading-6">
                You are about to share a link for '{projectName}' project. This link will be valid for 4 weeks.
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
              <Button className="h-[40px] button_blue button_pad" onClick={() => getGeneratedTokenAndOpenSharingModal("mailTo")} disabled={mailToButtonLoader}>{mailToButtonLoader ? <ButtonSpinner></ButtonSpinner> : 'Email Link'}</Button>

              <Button onClick={textCopied ? () => { } : () => getGeneratedTokenAndOpenSharingModal("copyLink")} className="h-[40px] button_blue button_pad" disabled={buttonLoader}>
                {buttonLoader ? <ButtonSpinner></ButtonSpinner> :
                  <div>
                    {
                      textCopied ? (
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
                      )
                        :
                        "Copy Link"
                    }
                  </div>
                }
              </Button>
            </>
          }
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
      {/* RDetails End */}
    </>
  );
};
export default Myprojectinterestedcompanies;
