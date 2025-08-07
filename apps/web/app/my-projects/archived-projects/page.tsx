"use client";
import Breadcrumbs from "@/components/breadcrumb";
import { PATH } from "@/constants/path";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Modal, Button } from "flowbite-react";
import { fetcher, patch, deleteItem, authFileFetcher } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import DataTable from "react-data-table-component";
import "../../../public/css/detatable.css";
import { formatDate } from "@/services/common-methods";
import { redirect } from "next/navigation";
import { useUserContext } from "@/context/store";
import { useAuthentication } from "@/services/authUtils";
import Spinner from "@/components/spinner";
import ButtonSpinner from "@/components/ui/buttonspinner";
import { toast } from "react-toastify";

interface ProjectdataType {
  id: number;
  name: string;
  updatedAt: Date;
  description: string;
}
const Myprojects = () => {
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [unArchiveModal, setUnArchiveModal] = useState<boolean>(false);
  const [deleteListId, setDeleteListId] = useState<number | null>(null);
  const [mylists, setMylists] = useState<ProjectdataType[]>([]);
  const [archivedList, setArchivedListId] = useState<number | null>(null);
  const [projectName, setProjectName] = useState<string>("");
  const [openShareModal, setOpenShareModal] = useState<boolean>(false);
  const [isListUpdated, setIsListUpdated] = useState<boolean>(false);
  const { user } = useUserContext();
  const [showTable, setShowTable] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [exportList, setexportList] = useState<boolean>(false);
  const [buttonLoader, setButtonLoader] = useState<boolean>(false);

  useAuthentication({ user, isBuyerRestricted: false , isPaidUserPage: true });

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
      label: PATH.ARCHIVEDPROJECT.name,
      path: PATH.ARCHIVEDPROJECT.path,
    },
  ];
  useEffect(() => {
    const fetchMyLists = async () => {
      try {
        const dataa = await fetcher(
          getEndpointUrl(ENDPOINTS.getArchivedProjects(user ? user?.id : 0)),
        );
        const data = dataa?.list;
        const updatedData = [...(data || [])].map((d) => {
          d.updatedAt = new Date(d.updatedAt);
          return d;
        });
        if (data.length > 0) {
          setShowTable(true);
        } else {
          setShowTable(false);
        }
        setIsLoading(false);
        setMylists(updatedData);
        setDeleteModal(false);
        setUnArchiveModal(false);
        setButtonLoader(false);
      } catch (error) {
        console.error("Error fetching my lists:", error);
      }
    };

    fetchMyLists();
  }, [isListUpdated]);

  const columns = [
    {
      name: "Project Name",
      cell: (row: ProjectdataType) => (
        <div className="flex align-items-center gap-2 link_color">
          <Link prefetch={false} href={`/my-projects/${row.id}`}>
            <span>{row.name}</span>
          </Link>
        </div>
      ),
      sortable: true,
      sortFunction: (a: ProjectdataType, b: ProjectdataType) =>
        a.name.localeCompare(b.name),
    },
    {
      name: "Description",
      cell: (row: ProjectdataType) => row.description,
      sortable: true,
      sortFunction: (a: ProjectdataType, b: ProjectdataType) =>
        a.description.localeCompare(b.description),
    },
    {
      name: "Last Edited",
      cell: (row: ProjectdataType) => formatDate(row.updatedAt),
      sortable: true,
      sortFunction: (a: ProjectdataType, b: ProjectdataType) => {
        const dateA = a.updatedAt;
        const dateB = b.updatedAt;
        const stringA = formatDate(dateA).toString();
        const stringB = formatDate(dateB).toString();
        return stringA.localeCompare(stringB);
      },
    },
    {
      name: "Actions",
      cell: (row: ProjectdataType) => (
        <div className="flex gap-4">
          <button>
              <Link
              href={`/my-projects/update-project/${row.id}`}
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
            UnArchive
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
          <button className="link_color" onClick={() => exportProject(row.id)}>
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
            Share
          </button>
        </div>
      ),
    },
  ];

  const exportProject = (id: number) => {
    setArchivedListId(id);
    setOpenShareModal(true);
    setexportList(false);
  };
  const setDeleteList = (id: number, name: string) => {
    setDeleteListId(id);
    setProjectName(name);
    setDeleteModal(true);
  };
  const setToArchivedList = (id: number, name: string) => {
    setArchivedListId(id);
    setProjectName(name);
    setUnArchiveModal(true);
  };
  const deleteMylist = (id: number) => {
    setButtonLoader(true);
    deleteItem(`${getEndpointUrl(ENDPOINTS.deletemyProjectApi(id))}`).then(
      () => {
        setIsListUpdated(!isListUpdated);
      },
    );
  };
  const setArchiveList = (id: number) => {
    setButtonLoader(true);
    patch(`${getEndpointUrl(ENDPOINTS.archiveProjectbyId(id))}`).then(() => {
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
  const downloadCsv = (id: number) => {
    setButtonLoader(true);
    authFileFetcher(
      `${getEndpointUrl(ENDPOINTS.downloadProjectIntrestedCompaniesCsv(id))}`,
    )
      .then((result) => {
        setButtonLoader(false);
        // const blob = new Blob([result], { type: 'text/csv' });
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(result);
        link.download = "companies.csv";
        link.click();
        toast.success('Project exported successfully 👍');
        setOpenShareModal(false);
      })
      .catch((error) => {
        setButtonLoader(false);
        setexportList(true);
        console.log(error);
      });
  };
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
              <h1 className="default_text_color header-font">
                Archived Projects
              </h1>
            </div>
          </div>
          <div className="pt-6">
            <hr />
          </div>
          {showTable ? (
            <div className="card py-6">
              <div className="myproject_archived_table">
                <DataTable
                  customStyles={tableHeaderstyle}
                  columns={columns}
                  data={mylists}
                  highlightOnHover={true}
                />
              </div>
            </div>
          ) : (
            <div className="pt-6 text-center">
              <p className="text-sm font-normal italic">
                You have no archived projects to display
              </p>
            </div>
          )}

          <div className="text-sm font-medium py-6">
            <Link prefetch={false} href="/my-projects" className="link_color">
              Show My Projects
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
                You are about to delete {projectName}
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
                  if (deleteListId !== null) {
                    deleteMylist(deleteListId);
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
            show={unArchiveModal}
            onClose={() => setUnArchiveModal(false)}
          >
            <Modal.Header className="modal_header font-bold">
              <b>Are you sure?</b>
            </Modal.Header>
            <Modal.Body>
              <div className="space-y-6 text-sm font-normal">
                You are about to unarchive {projectName}
              </div>
            </Modal.Body>
            <Modal.Footer className="modal_footer">
              <Button
                color="gray"
                type="submit"
                className="button_cancel h-[40px] px-4 border-gray-50-100"
                onClick={() => setUnArchiveModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (archivedList !== null) {
                    setArchiveList(archivedList);
                  } else {
                    console.error("archivedListId is null. Cannot delete.");
                  }
                }}
                className="px-4 h-[40px] button_blue"
                disabled={buttonLoader}
              >{buttonLoader ? <ButtonSpinner></ButtonSpinner> : 'Unarchive'}
                
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
                    Clicking the Export button will download an Excel file with
                    the list of Companies in this List. You can then share that
                    file with your team.
                  </p>
                </div>
              </div>
              {exportList && (
                <div className="font-medium text-red-600 text-sm mt-5">
                  <p>There are no companies to export</p>
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
              <Button
                className="h-[40px] button_blue"
                onClick={() => {
                  if (archivedList !== null) {
                    downloadCsv(archivedList);
                  } else {
                    console.error("Project Id is null. Cannot Export.");
                  }
                }}
                disabled={buttonLoader}
              >{buttonLoader ? <ButtonSpinner></ButtonSpinner> : 'Export'}
                
              </Button>
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
export default Myprojects;
