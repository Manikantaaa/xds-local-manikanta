"use client";

import Breadcrumbs from "@/components/breadcrumb";
import { PATH } from "@/constants/path";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Modal, Button, Tooltip } from "flowbite-react";
import { fetcher, patch, deleteItem, authFileFetcher, authFetcher } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import DataTable from "react-data-table-component";
import "../../public/css/detatable.css";
import { formatDate } from "@/services/common-methods";
import { redirect } from "next/navigation";
import { useUserContext } from "@/context/store";
import { useAuthentication } from "@/services/authUtils";
import Spinner from "@/components/spinner";
import { useMultiTourContext } from "@/context/multiTourContext";
import { Toursteps } from "@/services/tour";
import ButtonSpinner from "@/components/ui/buttonspinner";
import { toast } from "react-toastify";
import { fallbackCopyToClipboard } from "@/services/common-methods"

interface ListdataType {
  id: number;
  name: string;
  updatedAt: Date;
  description: string;
}
const Mylists = () => {
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [mylists, setMylists] = useState<ListdataType[]>([]);
  const [listRowId, setListRowId] = useState<number>(0);
  const [archiveListModel, setArchiveListMdel] = useState<boolean>(false);
  const [listName, setListName] = useState<string>("");
  const [showTable, setShowTable] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [openShareModal, setOpenShareModal] = useState<boolean>(false);
  const [isListUpdated, setIsListUpdated] = useState<boolean>(false);
  const [exportList, setexportList] = useState<boolean>(false);
  const [fileCountExceedError, setFileCountExceedError] = useState<string>("");
  const [copyLinkError, setCopyLinkError] = useState<string>("");
  const [buttonLoader, setButtonLoader] = useState<boolean>(false);
  const [mailToButtonLoader, setMailToButtonLoader] = useState<boolean>(false);
  const { user } = useUserContext();
  const [openListCopyAndShareModal, setOpenListCopyAndShareModal] = useState<boolean>(false);
  const [theList, setTheList] = useState<ListdataType>();
  const [sharableUrl, setSharableUrl] = useState("");
  const [textCopied, setTextCopied] = useState(false);

  useAuthentication({ user, isBuyerRestricted: false, isPaidUserPage: true });

  const {
    setTourState,
    tourState: { run, stepIndex, steps, tourActive },
  } = useMultiTourContext();

  useEffect(() => {
    if (!isLoading && tourActive) {
      setTourState({ run: true, stepIndex: 4, steps: Toursteps, tourActive: true });
    }
  }, [isLoading]);
  const breadcrumbItems = [
    {
      label: PATH.HOME.name,
      path: PATH.HOME.path,
    },
    {
      label: PATH.MYLISTS.name,
      path: PATH.MYLISTS.path,
    },
  ];

  useEffect(() => {
    const fetchMyLists = async () => {
      try {
        const dataa = await fetcher(
          getEndpointUrl(ENDPOINTS.getArchivedList(user ? user.id : 0)),
        );
        const data = dataa?.list;
        const updatedData = [...(data || [])].map((d) => {
          d.updatedAt = new Date(d.updatedAt);
          return d;
        });
        if (data.length > 0) {
          setShowTable(true);
        }
        else {
          setShowTable(false);
        }
        setIsLoading(false);
        setMylists(updatedData);
        setArchiveListMdel(false);
        setDeleteModal(false);
        setButtonLoader(false);
      } catch (error) {
        setIsLoading(false);
        console.error("Error fetching my lists:", error);
      }
    };
    fetchMyLists();
  }, [isListUpdated]);

  const columns = [
    {
      name: "List Name",
      cell: (row: ListdataType) => (
        <div className="flex align-items-center gap-2 link_color">
          <Link prefetch={false} href={`/my-lists/${row.id}`}>
            <span>{row.name}</span>
          </Link>
        </div>
      ),
      sortable: true,
      sortFunction: (a: ListdataType, b: ListdataType) =>
        a.name.localeCompare(b.name),
    },
    {
      name: "Description",
      cell: (row: ListdataType) => row.description,
      sortable: true,
      sortFunction: (a: ListdataType, b: ListdataType) =>
        a.description.localeCompare(b.description),
    },
    {
      name: "Last Edited",
      cell: (row: ListdataType) => formatDate(row.updatedAt),
      sortable: true,
      sortFunction: (a: ListdataType, b: ListdataType) => {
        const dateA = a.updatedAt;
        const dateB = b.updatedAt;
        const stringA = formatDate(dateA).toString();
        const stringB = formatDate(dateB).toString();
        return stringA.localeCompare(stringB);
      },
    },
    {
      name: "Actions",
      cell: (row: ListdataType) => (
        <div className="flex gap-4">
          <button>
            <Link
              prefetch={false}
              href={`/my-lists/update-list/${row.id}`}
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
            onClick={() => setToArchivedList(row.id, row.name)}
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
            Archive
          </button>
          <button
            onClick={() => setDeleteList(row.id, row.name)}
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
            onClick={() => exportListCompanies(row.id)}
          >
            <svg
              className="w-3.5 h-3.5 text-blue-300  me-1"
              version="1.1"
              fill="#0071C2"
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
            onClick={() => { setOpenListCopyAndShareModal(true); setFileCountExceedError(""); setTheList(row); setListRowId(row.id) }}
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
      ),
    },
  ];
  const exportListCompanies = (id: number) => {
    setListRowId(id);
    setOpenShareModal(true);
    setexportList(false);
    setFileCountExceedError("");
  };

  const getGeneratedTokenAndOpenSharingModal = async (type: string) => {
    // setTheList(list);
    setFileCountExceedError("");
    if (type === "copyLink") {
      setButtonLoader(true);
    } else {
      setMailToButtonLoader(true);
    }
    await authFetcher(`${getEndpointUrl(ENDPOINTS.generateUrlForListSharing(listRowId))}`).then((result) => {
      if (result.success && result.data) {
        if (type === "copyLink") {
          // alert(result.data+'copy');
          navigator.clipboard.writeText(result.data.trim())
            .then(() => {
              setTextCopied(true);
              setButtonLoader(false);
              console.log("Text copied successfully!");
            })
            .catch((error) => {
              fallbackCopyToClipboard(result.data.trim());
              setCopyLinkError(result.data.trim());
              console.error("Failed to copy text:", error);
              // alert("Copying to clipboard failed. Please try again or manually copy the link.");
              setButtonLoader(false);
            });
        }
        else {
          // alert(result.data+'mailTo');
          let link = `mailto:?subject=XDS Spark - List '${theList?.name}'&body=Check out my List '${theList?.name}' from XDS Spark.%0A${encodeURIComponent(result.data.trim())}`;
          window.open(link, '_blank');
          setMailToButtonLoader(false);
        }
        // setSharableUrl(result.data);
      }
    }).catch((err) => {
      setFileCountExceedError(err.message);
      console.log(err);
    }).finally(() => {
      setButtonLoader(false);
      setMailToButtonLoader(false);
    });
  }

  const setToArchivedList = (id: number, name: string) => {
    setListRowId(id);
    setListName(name);
    setArchiveListMdel(true);
  };
  const setArchiveList = (id: number) => {
    setButtonLoader(true);
    patch(`${getEndpointUrl(ENDPOINTS.archiveListbyId(id))}`).then(() => {
      // setButtonLoader(false);
      setIsListUpdated(!isListUpdated);
    });
  };
  const setDeleteList = (id: number, name: string) => {
    setListRowId(id);
    setListName(name);
    setDeleteModal(true);
  };
  const deleteMylist = (id: number) => {
    setButtonLoader(true);
    deleteItem(`${getEndpointUrl(ENDPOINTS.deletemylistApi(id))}`).then(() => {
      // setButtonLoader(false);
      setIsListUpdated(!isListUpdated);
    });
    // setDeleteModal(false);
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
  async function downloadCsv(id: number) {
    setButtonLoader(true);
    setFileCountExceedError("");
    authFileFetcher(
      `${getEndpointUrl(ENDPOINTS.downloadListIntrestedCompaniesCsv(id))}`,
    )
      .then((result) => {
        setButtonLoader(false);
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
          setexportList(true);
        }
        setButtonLoader(false);

        return;
      });
  }

  // const handleOpenLink = async() => {
  //   setMailToButtonLoader(true);
  //   setTextCopied(false);
  //   await getGeneratedTokenAndOpenSharingModal();
  //   let link = `mailto:?subject=XDS Spark - List '${theList?.name}'&body=Check out my List '${theList?.name}' from XDS Spark.%0A${encodeURIComponent(sharableUrl.trim())}`;
  //   window.open(link, '_blank');
  //   setMailToButtonLoader(false);
  // }

  // const onClickCopyLink = async () => {
  //   setButtonLoader(true);
  //   await navigator.clipboard.writeText(sharableUrl.trim()).then(() => {
  //     setTextCopied(true);
  //     setButtonLoader(false);
  //   });
  // }

  return (
    <>
      {!isLoading ?
        <div className="w-full lg:container px-5 pos_r">
          <div className="pb-6 pt-6 breadcrumbs_s">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
          <div className="flex justify-between">
            <div className="text-left">
              <h1 className="default_text_color header-font">My Lists</h1>
            </div>
            <div className="text-sm font-medium space-x-4 createnewList">
              <Link href="/my-lists/create-list" className="link_color">
                <svg
                  className="w-3.5 h-3.5 me-1"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.546.5a9.5 9.5 0 1 0 9.5 9.5 9.51 9.51 0 0 0-9.5-9.5ZM13.788 11h-3.242v3.242a1 1 0 1 1-2 0V11H5.304a1 1 0 0 1 0-2h3.242V5.758a1 1 0 0 1 2 0V9h3.242a1 1 0 1 1 0 2Z" />
                </svg>
                New List
              </Link>
            </div>
          </div>
          <div className="pt-6">
            Create and manage lists of service providers any way you choose!
          </div>
          <div className="pt-6">
            <hr />
          </div>
          {showTable ?
            <div className="card py-6">
              <div className="mylists_table">
                <DataTable
                  customStyles={tableHeaderstyle}
                  columns={columns}
                  data={mylists}
                  highlightOnHover={true}
                />
              </div>
            </div>
            :
            <div className="pt-6 text-center">
              <p className="text-sm font-normal italic">
                It looks like you don&apos;t have any Lists yet.
                <br />
                You can use Lists to group and organize Service Providers.
              </p>
              <p className="pt-6 text-sm font-normal">
                <Link href="/my-lists/create-list" className="link_color underline">
                  Click here to create a List
                </Link>
              </p>
            </div>
          }
          <div className="text-sm py-6 font-medium">
            <Link href="/my-lists/archived-list" className="link_color">
              Show Archived Lists
            </Link>
          </div>
          <Modal
            size="sm"
            show={deleteModal}
            onClose={() => setDeleteModal(false)}
          >
            <Modal.Header className="modal_header font-bold">
              <b>Are you sure?</b>
            </Modal.Header>
            <Modal.Body>
              <div className="space-y-6 text-sm font-normal">
                You are about to delete {listName}. Deleting will also remove this list from any associated Projects you have created.
              </div>
            </Modal.Body>
            <Modal.Footer className="modal_footer">
              <Button
                color="gray"
                type="submit"
                className="button_cancel h-[40px] px-4 border-gray-50-100"
                onClick={() => setDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (listRowId !== null) {
                    deleteMylist(listRowId);
                  } else {
                    console.error("deleteListId is null. Cannot delete.");
                  }
                }}
                className="px-4 h-[40px] button_blue"
                disabled={buttonLoader}
              >{buttonLoader ? <ButtonSpinner></ButtonSpinner> : 'Delete'}

              </Button>
            </Modal.Footer>
          </Modal>
          <Modal
            size="sm"
            show={archiveListModel}
            onClose={() => setArchiveListMdel(false)}
          >
            <Modal.Header className="modal_header font-bold">
              <b>Are you sure?</b>
            </Modal.Header>
            <Modal.Body>
              <div className="space-y-6 text-sm font-normal">
                You are about to archive {listName}
              </div>
            </Modal.Body>
            <Modal.Footer className="modal_footer">
              <Button
                color="gray"
                type="submit"
                className="button_cancel h-[40px] px-4 border-gray-50-100"
                onClick={() => setArchiveListMdel(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (listRowId !== null) {
                    setArchiveList(listRowId);
                  } else {
                    console.error("archivedListId is null. Cannot delete.");
                  }
                }}
                className="px-4 h-[40px] button_blue"
                disabled={buttonLoader}
              >{buttonLoader ? <ButtonSpinner></ButtonSpinner> : 'Archive'}

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
              {!fileCountExceedError && !exportList && <Button
                className="h-[40px] button_blue"
                onClick={() => {
                  if (listRowId !== null) {
                    downloadCsv(listRowId);
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
                    You are about to share a link for '{theList?.name}' list. This link will be valid for 4 weeks.
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
                  <Button className="h-[40px] button_blue button_pad" onClick={() => { getGeneratedTokenAndOpenSharingModal("mailTo"); }} disabled={mailToButtonLoader}>{mailToButtonLoader ? <ButtonSpinner></ButtonSpinner> : 'Email Link'}</Button>

                  <Button size="sm" onClick={textCopied ? () => { } : () => { getGeneratedTokenAndOpenSharingModal("copyLink"); }} className="h-[40px] button_blue button_pad" disabled={buttonLoader} >
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
        </div>
        :
        <div className="min-h-screen flex justify-center items-center">
          <Spinner />
        </div>
      }
    </>
  );
};
export default Mylists;
