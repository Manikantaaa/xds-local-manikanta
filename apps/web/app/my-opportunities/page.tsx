"use client";
import Link from "next/link";
import Breadcrumbs from "@/components/breadcrumb";
import { PATH } from "@/constants/path";
import React, { useState, useEffect, useMemo } from "react";
import { Modal, Button } from "flowbite-react";
import { fetcher, patch } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import DataTable from "react-data-table-component";
import "../../public/css/detatable.css";
import { formatDate } from "@/services/common-methods";
import { useUserContext } from "@/context/store";
import { useAuthentication } from "@/services/authUtils";
import Spinner from "@/components/spinner";
import { useMultiTourContext } from "@/context/multiTourContext";
import { Toursteps } from "@/services/tour";
import { redirect, useRouter } from "next/navigation";
import ButtonSpinner from "@/components/ui/buttonspinner";
interface ListdataType {

  
  updatedAt: string | number | Date;
  id: number;
  name: string;
  createdAt: Date;
  description: string;
  approxEndDate: Date;
  approxStartDate: Date;
  staffMonths: string;
  approxEndDateCondition: string,
  approxStartDateCondition: string,
  expiryDate: Date;
  PlatformsOpt?: [
    {
      platforms: {
        name: string;
      };
    },
  ];
  industryTypes: {
    name: string;
  };
  serviceProvidersIntrests: {
    length: number;
  };
  oppStatus: string;
  anyNewIntrest: boolean;
}
const MyOpportunities = () => {
  const Router = useRouter();
  const [mylists, setMylists] = useState<ListdataType[]>([]);
  const [archivedListId, setArchivedListId] = useState<number | null>(null);
  const [archiveListModel, setArchiveListMdel] = useState<boolean>(false);
  const [listName, setListName] = useState<string>("");
  const [showTable, setShowTable] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isListUpdated, setIsListUpdated] = useState<boolean>(false);
  const { user } = useUserContext();
  const [buttonLoader, setButtonLoader] = useState<boolean>(false);
  useAuthentication({ user, isBuyerRestricted: false, isPaidUserPage: true });
  if (user && user?.userRoles[0].roleCode === 'service_provider') {
    redirect(PATH.HOME.path);
  }
  const breadcrumbItems = [
    {
      label: PATH.HOME.name,
      path: PATH.HOME.path,
    },
    {
      label: PATH.MYOPPERTUNITIES.name,
      path: PATH.MYOPPERTUNITIES.path,
    },
  ];

  const {
    setTourState,
    tourState:{tourActive}
  } = useMultiTourContext();

  useEffect(() => {
    if(!isLoading && tourActive){
      setTourState({ run: true, stepIndex: 6,steps:Toursteps, tourActive:true });
    }
  },[isLoading]);
  
  useEffect(() => {
    const fetchMyLists = async () => {
      try {
        const dataa = await fetcher(
          getEndpointUrl(ENDPOINTS.getmyopportunities(user ? user.companyId : 0)),
        );
        const data = dataa?.data;
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
        setButtonLoader(false);
        setArchiveListMdel(false);
      } catch (error) {
        console.error("Error fetching my lists:", error);
      }
    };
    fetchMyLists();
  }, [isListUpdated]);

  const sortedData = useMemo(() => {
    return mylists.slice().sort((a: ListdataType, b: ListdataType) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return dateB - dateA;
    });
  }, [mylists]);

  const columns = [
    {
      name: "Opportunity",
      cell: (row: ListdataType) => {
          return (
            <div className="flex align-items-center gap-2 link_color">
                
                  <span className="cursor-pointer" onClick={() => Router.push(`/opportunity-details/${row.id}`)}>{row.name}</span>
                
            </div>
          )
      },
      sortable: true,
      sortFunction: (a: ListdataType, b: ListdataType) =>
        a.name.localeCompare(b.name),
    },
    {
      name: "#Interested",
      cell: (row: ListdataType) => (
        <div className={`flex align-items-center gap-2 link_color underline add_event_class_to_parent ${row.anyNewIntrest ? 'count_blink' : ''}`}>
          <Link prefetch={false} href={`/my-opportunities/${row.id}`}>
            <span>{row.serviceProvidersIntrests?.length}</span>
          </Link>
        </div>
      ),
      sortable: true,
      sortFunction: (a: ListdataType, b: ListdataType) => {
        return (
          (a.serviceProvidersIntrests?.length || 0) -
          (b.serviceProvidersIntrests?.length || 0)
        );
      },
    },
    {
      name: "Industry Type",
      cell: (row: ListdataType) => row.industryTypes?.name,
      sortable: true,
      sortFunction: (a: ListdataType, b: ListdataType) =>
        a.industryTypes?.name.localeCompare(b.industryTypes?.name),
    },

    {
      name: "Platform",
      cell: (row: ListdataType) => {
        if (row.PlatformsOpt) {
          const countriesToShow = row.PlatformsOpt.slice(0, 3);
          const platformnames = countriesToShow
            .map((PlatformsOpt) => PlatformsOpt.platforms.name)
            .join(", ");
          return (
            <span>
              {platformnames}
              {row.PlatformsOpt.length > 2 && "..."}
            </span>
          );
        }
        return "";
      },
      sortable: true,
      sortFunction: (a: ListdataType, b: ListdataType) => {
        const compareResult = a.PlatformsOpt && b.PlatformsOpt && a?.PlatformsOpt[0]?.platforms.name.localeCompare(b?.PlatformsOpt[0].platforms.name);
        return compareResult || 0; // If compareResult is undefined, return 0
      }
    },
    {
      name: "	Start",
      cell: (row: ListdataType) => {
        if (row.approxStartDateCondition == '3') {
          return formatDate(row.approxStartDate);
        } else {
          if (row.approxStartDateCondition == '1') {
            return 'To be determined';
          } else if (row.approxStartDateCondition == '2') {
            return 'Ongoing';
          }
        }
      },
      sortable: true,
      sortFunction: (a: ListdataType, b: ListdataType) => {
        const dateA = a.approxStartDate;
        const dateB = b.approxStartDate;
        const stringA = formatDate(dateA).toString();
        const stringB = formatDate(dateB).toString();
        return stringA.localeCompare(stringB);
      },
    },
    {
      name: "	End",
      cell: (row: ListdataType) => {
        if (row.approxEndDateCondition == '3') {
          return formatDate(row.approxEndDate);
        } else {
          if (row.approxEndDateCondition == '1') {
            return 'To be determined';
          } else if (row.approxEndDateCondition == '2') {
            return 'Ongoing';
          }
        }
      },
      sortable: true,
      sortFunction: (a: ListdataType, b: ListdataType) => {
        const dateA = a.approxEndDate;
        const dateB = b.approxEndDate;
        const stringA = formatDate(dateA).toString();
        const stringB = formatDate(dateB).toString();
        return stringA.localeCompare(stringB);
      },
    },

    {
      name: "Staff Months",
      cell: (row: ListdataType) => String(row.staffMonths),
      sortable: true,
      sortFunction: (a: ListdataType, b: ListdataType) => {
        const staffMonthsA = Number(a.staffMonths);
        const staffMonthsB = Number(b.staffMonths);
        return (staffMonthsA - staffMonthsB);
      }
    },
    {
      name: "	Posted Date",
      cell: (row: ListdataType) => formatDate(row.createdAt),
      sortable: true,
      sortFunction: (a: ListdataType, b: ListdataType) => {
        const dateA = a.createdAt;
        const dateB = b.createdAt;
        const stringA = formatDate(dateA).toString();
        const stringB = formatDate(dateB).toString();
        return stringA.localeCompare(stringB);
      },
    },
    {
      name: "Status",
      cell: (row: ListdataType) => {
        const expiryDate = new Date(row.expiryDate);
        const currentDate = new Date();
        if (expiryDate < currentDate) {
          return "Expired";
        }
        return row.oppStatus === "publish" ? "Live" : "Draft";
      },
      sortable: true,
      sortFunction: (a: ListdataType, b: ListdataType) => {
        // Compare based on expiry date first
        const expiryDateA = new Date(a.expiryDate);
        const expiryDateB = new Date(b.expiryDate);

        if (expiryDateA < expiryDateB) {
          return -1;
        } else if (expiryDateA > expiryDateB) {
          return 1;
        }

        // If expiry dates are the same, then compare statuses
        const statusOrder = { Live: 0, Draft: 1, Expired: 2 };

        const statusA = a.oppStatus === "publish" ? "Live" : "Draft";
        const statusB = b.oppStatus === "publish" ? "Live" : "Draft";

        if (statusOrder[statusA] < statusOrder[statusB]) {
          return -1;
        } else if (statusOrder[statusA] > statusOrder[statusB]) {
          return 1;
        }

        // If statuses are equal, fallback to default sorting by status
        return a.oppStatus.localeCompare(b.oppStatus);
      },
    },
    {
      name: "Actions",
      cell: (row: ListdataType) => (
        <div className="flex gap-4 items-start">
          <button>
            <Link
              prefetch={false}
              href={`/my-opportunities/update-opportunity/${row.id}`}
              className="link_color"
            >
              <svg
                className="w-3.5 h-3.5 block m-auto"
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
              className="w-3.5 h-3.5 block m-auto"
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
        </div>
      ),
    }

  ];
  const setToArchivedList = (id: number, name: string) => {
    setArchivedListId(id);
    setListName(name);
    setArchiveListMdel(true);
  };
  const setArchiveList = (id: number) => {
    setButtonLoader(true);
    patch(`${getEndpointUrl(ENDPOINTS.archiveOpportunitybyId(id, user ? user?.companyId : 0))}`).then(
      () => {
        setIsListUpdated(!isListUpdated);
      },
    );
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

  const conditionalRowStyles = [
    {
      when: (row: ListdataType) =>  row.anyNewIntrest ,
      style: {
        backgroundColor: "#ebe7fe",
        borderLeft:"4px solid #0071c2",
      },
      className: (row: ListdataType) => row.anyNewIntrest ? 'active_row' : 'testttjjjjjjjjjjjjjjjjj',
    },
  ];

  useEffect(() => {
    document.querySelectorAll('.add_event_class_to_parent').forEach((child) => {
      const parent = child.parentElement;
      if (parent) {
        const anchor = child.querySelector('a');
        parent.classList.add('custom_class_for_parent');
        if (anchor) {
          const href = anchor.getAttribute('href');
          parent.addEventListener('click', (e) => {
            e.preventDefault(); 
            console.log(href);
            Router.push(`${href}`);
          });
        }
      }
    });
  }, [sortedData]);
 

  // const handleOpportunityStatus = (id: number) => {
  //   patch(`${getEndpointUrl(ENDPOINTS.updatemyopportunitystatus(id))}`).then(
  //     () => {
  //       setIsListUpdated(!isListUpdated);
  //     },
  //   );
  // }
  return (
    <>
      {
        !isLoading ?
          <div className="w-full lg:container px-5 pos_r">
            <div className="pb-6 pt-6 breadcrumbs_s">
              <Breadcrumbs items={breadcrumbItems} />
            </div>
            <div className="lg:flex justify-between">
              <div className="text-left">
                <h1 className="default_text_color header-font">Post Opportunities</h1>
              </div>
              <div className="text-sm font-medium space-x-4 createOpportunity text-end">
                {/* <Link
                  href="/my-opportunities/create-opportunity"
                  className="link_color"
                >
                  <svg
                    className="w-3.5 h-3.5 me-1"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.546.5a9.5 9.5 0 1 0 9.5 9.5 9.51 9.51 0 0 0-9.5-9.5ZM13.788 11h-3.242v3.242a1 1 0 1 1-2 0V11H5.304a1 1 0 0 1 0-2h3.242V5.758a1 1 0 0 1 2 0V9h3.242a1 1 0 1 1 0 2Z" />
                  </svg> */}
                  <button
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors  button_blue text-primary-foreground hover:bg-primary/90 h-10 p-3"
                    type="button"
                    onClick={() => Router.push(`/my-opportunities/create-opportunity`)}
                  >
                  Post a New Opportunity
                  </button>
                {/* </Link> */}
                                  
              </div>
            </div>
            <div className="pt-6">
              Create opportunities for Service Providers to view, and express their interest.
            </div>
            <div className="pt-6">
              <hr />
            </div>
            {showTable ?
              <div className="card py-6">
                <div className="my_opportunity_table_style">
                  <DataTable
                    customStyles={tableHeaderstyle}
                    columns={columns}
                    data={sortedData}
                    highlightOnHover={true}
                    conditionalRowStyles={conditionalRowStyles}
                    className= "Myoppportunities"
                  />
                </div>
              </div>
              :
              <div className="pt-6 text-center">
                <p className="text-sm font-normal italic">
                  It looks like you don&apos;t have any Opportunities yet.
                </p>
                <p className="pt-6 text-sm font-normal">
                  <Link
                    href="/my-opportunities/create-opportunity"
                    className="link_color underline"
                  >
                    Click here to create an Opportunity
                  </Link>
                </p>
              </div>
            }

            <div className="text-sm font-medium py-6">
              <Link
                href="/my-opportunities/archived-opportunities"
                className="link_color"
              >
                Show Archived Opportunities
              </Link>
            </div>
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
                    if (archivedListId !== null) {
                      setArchiveList(archivedListId);
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
          </div>
          :
          <div className="min-h-screen flex justify-center items-center">
            <Spinner />
          </div>
      }
    </>
  );
};
export default MyOpportunities;
