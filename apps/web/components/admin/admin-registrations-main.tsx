"use client";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import useSWR from "swr";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { authFetcher, authFileFetcher, authPut } from "@/hooks/fetcher";
import "../../public/css/detatable.css";
import { Tooltip } from "flowbite-react";
import Spinner from "@/components/spinner";

import {
  formatDate,
  getRoleString,
  getStatusString,
  getUserTypeString,
} from "@/services/common-methods";
import { APPROVAL_STATUS } from "@/constants/approvalStatus";
import { toast } from "react-toastify";
import { AllRegistrations } from "@/types/all-registrations.type";
import { USER_TYPE } from "@/types/user.type";
const AdminRegistrationsMain = () => {
  const [registrations, setRegistrations] = useState<AllRegistrations[]>([]);
  const [reviewCounts, setReviewCounts] = useState<{ needsReview: string, underReview: string }>({ needsReview: '', underReview: '' });
  const [needsReviewCount, setNeedsReviewCount] = useState<number>(0);
  const [underReviewCount, setUnderReviewCount] = useState<number>(0);
  const [canRender, setCanRender] = useState(false);
  const [isApprovedChecked, setIsApprovedChecked] = useState(false);
  const [isRejectedChecked, setIsRejectedChecked] = useState(false);
  const [isNeedsReviewChecked, setIsNeedsReviewChecked] = useState(true);
  const [searchString, setSearchString] = useState("");
  const [needReview, setNeedReview] = useState("pending");
  const [approveChecked, setApproveChecked] = useState("");
  const [rejectChecked, setRejectChecked] = useState("");
  const [isUnderReviewChecked, setIsUnderReviewChecked] = useState(false);
  const [underReviewChecked, setUnderReviewChecked] = useState("");

  const columns = [
    {
      id: "date",
      name: "Date",
      cell: (row: AllRegistrations) =>
        formatDate(row.submissionDate).toString(),
      sortable: true,
      sortFunction: (a: AllRegistrations, b: AllRegistrations) =>
        new Date(a.submissionDate).getTime() -
        new Date(b.submissionDate).getTime(),
    },
    {
      id: "name",
      name: "Name",
      cell: (row: AllRegistrations) => (
        <div className="text-blue-300">
          <Link prefetch={false} href={`/admin/registrations/${row.user.id}`}>
            {row.user.firstName + " " + row.user.lastName}
          </Link>
        </div>
      ),
      sortable: true,
      sortFunction: (a: AllRegistrations, b: AllRegistrations) =>
        a.user.firstName.localeCompare(b.user.firstName),
    },
    {
      id: "email",
      name: "Email",
      cell: (row: AllRegistrations) => (
        <div className="text-blue-300">
          <Link prefetch={false} href={`mailto:${row.user.email}`}> {row.user.email} </Link>
        </div>
      ),
      sortable: true,
      sortFunction: (a: AllRegistrations, b: AllRegistrations) =>
        a.user.email.localeCompare(b.user.email),
    },
    {
      id: "linkedin",
      name: "Linkedin",
      cell: (row: AllRegistrations) => (
        <div className="text-blue-300">
          <Link prefetch={false} href={row.user.linkedInUrl} target="_blank">
            {row.user.linkedInUrl}
          </Link>
        </div>
      ),
      sortable: true,
      sortFunction: (a: AllRegistrations, b: AllRegistrations) =>
        a.user.linkedInUrl.localeCompare(b.user.linkedInUrl),
    },
    {
      id: "company",
      name: "Company",
      cell: (row: AllRegistrations) => (
        <div className="text-blue-300">
          <Link prefetch={false} href={`/admin/company/${row.user.companies[0]?.id}`}>
            {" "}
            {row.user.companies[0]?.name}{" "}
          </Link>
        </div>
      ),
      sortable: true,
      sortFunction: (a: AllRegistrations, b: AllRegistrations) =>
        a.user.companies[0]?.name.localeCompare(b.user.companies[0]?.name),
    },
    {
      id: "website",
      name: "Company Website",
      cell: (row: AllRegistrations) => (
        <div className="text-blue-300">
          <Link
            prefetch={false}
            href={row.user.companies[0]?.website &&
              (row.user.companies[0]?.website.startsWith('http://') || row.user.companies[0]?.website.startsWith('https://') ?
                row.user.companies[0]?.website : `https://${row.user.companies[0]?.website}`)}
            // href={`${row.user.companies[0]?.website}`}
            target="_blank"
          >
            {row.user.companies[0]?.website}
          </Link>
        </div>
      ),
      sortable: true,
      sortFunction: (a: AllRegistrations, b: AllRegistrations) =>
        a.user.companies[0]?.website.localeCompare(
          b.user.companies[0]?.website,
        ),
    },
    {
      id: "role",
      name: "Role",
      cell: (row: AllRegistrations) =>
        getRoleString(row.user.userRoles[0]?.roleCode, 0),
      sortable: true,
      sortFunction: (a: AllRegistrations, b: AllRegistrations) =>
        getRoleString(a.user.userRoles[0]?.roleCode).localeCompare(
          getRoleString(b.user.userRoles[0]?.roleCode),
        ),
    },
    {
      id: "type",
      name: "Current Type",
      cell: (row: AllRegistrations) => getUserTypeString(row.user, "register"),
      sortable: true,
      sortFunction: (a: AllRegistrations, b: AllRegistrations) => getUserTypeString(a.user, "register").localeCompare(getUserTypeString(b.user, "register")),
    },
    {
      id: "status",
      name: "Status",
      sortable: true,
      cell: (row: AllRegistrations) => (
        <div>
          <button>
            <svg
              className={`w-3.5 h-3.5 me-1 flex-shrink-0 ${getColorClassBasedOnStatus(
                row.approvalStatus,
              )}`}
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="m12 20c4.4183 0 8-3.5817 8-8 0-4.41828-3.5817-8-8-8-4.41828 0-8 3.58172-8 8 0 4.4183 3.58172 8 8 8z" />
            </svg>
          </button>
          {getStatusString(row.approvalStatus)}
        </div>
      ),
      sortFunction: (a: AllRegistrations, b: AllRegistrations) =>
        getStatusString(a.approvalStatus).localeCompare(
          getStatusString(b.approvalStatus),
        ),
    },
    {
      id: "payment",
      name: "Subscribed",
      sortable: true,
      cell: (row: AllRegistrations) =>( row.user.userType == "paid" || row.user.userType == "init") ? (row.approvalStatus == APPROVAL_STATUS.completed ? "Yes" : "No") : "-",
      sortFunction: (rowA: AllRegistrations, rowB: AllRegistrations) => {
        const getRank = (value: string): number => {
          if (value === "Yes") return 2; // Highest priority
          if (value === "No") return 1;
          return 0; // "-"
        };
        const valueA = (rowA.user.userType == "paid" || rowA.user.userType == "init")? rowA.approvalStatus === APPROVAL_STATUS.completed ? "Yes" : "No" : "-";
        const valueB = (rowB.user.userType == "paid" || rowA.user.userType == "init")? rowB.approvalStatus === APPROVAL_STATUS.completed ? "Yes" : "No" : "-";
        return getRank(valueB) - getRank(valueA);
      }
    },
    {
      id: "actions",
      name: "Actions",
      cell: (row: AllRegistrations) => (
        <div>
          <>
            <button
              onClick={(e) => { e.preventDefault(); onClickUnderReview(row.user.id) }}
              disabled={row.approvalStatus != APPROVAL_STATUS.pending}
            >
              {row.approvalStatus != APPROVAL_STATUS.pending ? (
                // <svg className="w-5 h-5 me-2 dark:text-green-400 flex-shrink-0 gray_c"
                //   fill="currentColor" 
                //   xmlns="http://www.w3.org/2000/svg" 
                //   data-name="Layer 1" 
                //   viewBox="0 0 100 125" x="0px" y="0px"
                // >
                //   <path d="M50,3.44A46.56,46.56,0,1,0,96.56,50,46.55,46.55,0,0,0,50,3.44Zm6.61,51.37A22.08,22.08,0,0,1,71.82,72.59,2.86,2.86,0,0,1,69,75.87H31a2.86,2.86,0,0,1-2.84-3.28A22.09,22.09,0,0,1,43.39,54.81,4,4,0,0,0,46.21,51v-1.9a4,4,0,0,0-2.82-3.86A22.09,22.09,0,0,1,28.18,27.41,2.86,2.86,0,0,1,31,24.13H69a2.86,2.86,0,0,1,2.84,3.28A22.08,22.08,0,0,1,56.61,45.19a4.05,4.05,0,0,0-2.82,3.87v1.88A4.05,4.05,0,0,0,56.61,54.81Z" />
                // </svg>
                <svg
                  className="w-4 h-4 me-2 dark:text-green-400 flex-shrink-0 gray_c"
                  fill="currentColor"
                  viewBox="0 0 512 512"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g id="Layer_2" data-name="Layer 2">
                    <g id="minus_">
                      <path d="m256 0c-141.38 0-256 114.62-256 256s114.62 256 256 256 256-114.62 256-256-114.62-256-256-256zm131.5 256a37.69 37.69 0 0 1 -37.69 37.69h-187.62a37.69 37.69 0 0 1 -37.69-37.69 37.69 37.69 0 0 1 37.69-37.69h187.62a37.69 37.69 0 0 1 37.69 37.69z" />
                    </g>
                  </g>
                </svg>
              ) : (
                <Tooltip content="Under Review">
                  <svg
                    className="w-4 h-4 me-2 dark:text-green-400 flex-shrink-0 orange_c"
                    fill="currentColor"
                    viewBox="0 0 512 512"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g id="Layer_2" data-name="Layer 2">
                      <g id="minus_">
                        <path d="m256 0c-141.38 0-256 114.62-256 256s114.62 256 256 256 256-114.62 256-256-114.62-256-256-256zm131.5 256a37.69 37.69 0 0 1 -37.69 37.69h-187.62a37.69 37.69 0 0 1 -37.69-37.69 37.69 37.69 0 0 1 37.69-37.69h187.62a37.69 37.69 0 0 1 37.69 37.69z" />
                      </g>
                    </g>
                  </svg>
                </Tooltip>
              )}
            </button>

            <button
              onClick={(e) => { (row.user.userType == "free") ? onClickApproveToFoundationalUser(e, row.id) : onClickApproveStatus(e, row.id) }}
              disabled={row.approvalStatus == APPROVAL_STATUS.approved || row.approvalStatus == APPROVAL_STATUS.pwdCreated || row.approvalStatus == APPROVAL_STATUS.completed}
            >
              {(row.approvalStatus == APPROVAL_STATUS.approved || row.approvalStatus == APPROVAL_STATUS.pwdCreated || row.approvalStatus == APPROVAL_STATUS.completed) ? (
                <svg
                  className={`w-4 h-4 me-2 dark:text-green-400 flex-shrink-0 ${(row.approvalStatus == APPROVAL_STATUS.approved || row.approvalStatus == APPROVAL_STATUS.pwdCreated || row.approvalStatus == APPROVAL_STATUS.completed)
                      ? "gray_c"
                      : "green_c"
                    }`}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                </svg>
              ) : (
                <Tooltip content="Approve">
                  {" "}
                  <svg
                    className={`w-4 h-4 me-2 dark:text-green-400 flex-shrink-0 ${(row.approvalStatus == APPROVAL_STATUS.approved || row.approvalStatus == APPROVAL_STATUS.pwdCreated || row.approvalStatus == APPROVAL_STATUS.completed)
                        ? "gray_c"
                        : "green_c"
                      }`}
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                  </svg>
                </Tooltip>
              )}
            </button>

            <button
              onClick={(e) => onClickRejectStatus(e, row.id)}
              disabled={row.approvalStatus == APPROVAL_STATUS.rejected || row.approvalStatus == APPROVAL_STATUS.completed}
            >
              {(row.approvalStatus == APPROVAL_STATUS.rejected || row.approvalStatus == APPROVAL_STATUS.completed) ? (
                <svg
                  className={`me-2 w-4 h-4 dark:text-white ${(row.approvalStatus == APPROVAL_STATUS.rejected || row.approvalStatus == APPROVAL_STATUS.completed)
                      ? "gray_c"
                      : "red_c"
                    }`}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z" />
                </svg>
              ) : (
                <Tooltip content="Reject">
                  {" "}
                  <svg
                    className={`me-2 w-4 h-4 dark:text-white ${(row.approvalStatus == APPROVAL_STATUS.rejected || row.approvalStatus == APPROVAL_STATUS.completed)
                        ? "gray_c"
                        : "red_c"
                      }`}
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z" />
                  </svg>
                </Tooltip>
              )}
            </button>

            <button
              onClick={(e) => onClickDeleteRegistration(e, row.id)}
              disabled={row.approvalStatus == APPROVAL_STATUS.completed}
            >
              {
                (row.approvalStatus == APPROVAL_STATUS.completed) ?
                  <svg
                    className="me-2 w-4 h-4 blue_c dark:text-white gray_c"
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
                  :
                  <Tooltip content="Delete">
                    {" "}
                    <svg
                      className="me-2 w-4 h-4 blue_c  dark:text-white"
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
                  </Tooltip>
              }

            </button>
          </>
        </div>
      ),
    },
  ];

  const { data: registrationsData, mutate } = useSWR(
    `${getEndpointUrl(
      ENDPOINTS.filteredRegistrations(
        searchString,
        needReview,
        approveChecked,
        rejectChecked,
        underReviewChecked
      ),
    )}`,
    authFetcher,
  );

  const resetAsyncForm = useCallback(async () => {
    await mutate();
  }, []);

  useEffect(() => {
    if (registrationsData && registrationsData.success) {
      setRegistrations(registrationsData.data?.result);
      setNeedsReviewCount(registrationsData.data?.reviewsCount.needsReview);
      setUnderReviewCount(registrationsData.data?.reviewsCount.underReview);
      setCanRender(true);
    }
    document.title = "XDS Spark - Admin";
  }, [
    registrationsData,
    resetAsyncForm,
    searchString,
  ]);

  function handleReviewChecked(e: React.ChangeEvent<HTMLInputElement>) {
    setIsNeedsReviewChecked(e.target.checked);
    let needReview: string = "";
    let approveChecked: string = "";
    let rejectChecked: string = "";
    let underReviewChecked: string = "";
    if (e.target.checked) {
      needReview = "pending";
      setNeedReview("pending");
    } else {
      setNeedReview("");
    }
    if (isApprovedChecked) {
      approveChecked = "approved";
    }
    if (isRejectedChecked) {
      rejectChecked = "rejected";
    }
    if (isUnderReviewChecked) {
      underReviewChecked = "underReview";
    }
    authFetcher(
      `${getEndpointUrl(
        ENDPOINTS.filteredRegistrations(
          searchString,
          needReview,
          approveChecked,
          rejectChecked,
          underReviewChecked
        ),
      )}`,
    ).then((response) => {
      if (response.success) {
        setRegistrations(response.data?.result);
        setNeedsReviewCount(response.data?.reviewsCount.needsReview);
        setUnderReviewCount(response.data?.reviewsCount.underReview);
      }
    });
  }

  function handleApprovedChecked(e: React.ChangeEvent<HTMLInputElement>) {
    setIsApprovedChecked(e.target.checked);
    let needReview: string = "";
    let approveChecked: string = "";
    let rejectChecked: string = "";
    let underReviewChecked: string = "";
    if (e.target.checked) {
      approveChecked = "approved";
      setApproveChecked("approved");
    } else {
      setApproveChecked("");
    }
    if (isNeedsReviewChecked) {
      needReview = "pending";
    }
    if (isRejectedChecked) {
      rejectChecked = "rejected";
    }
    if (isUnderReviewChecked) {
      underReviewChecked = "underReview";
    }
    authFetcher(
      `${getEndpointUrl(
        ENDPOINTS.filteredRegistrations(
          searchString,
          needReview,
          approveChecked,
          rejectChecked,
          underReviewChecked
        ),
      )}`,
    ).then((response) => {
      if (response.success) {
        setRegistrations(response.data?.result);
        setNeedsReviewCount(response.data?.reviewsCount.needsReview);
        setUnderReviewCount(response.data?.reviewsCount.underReview);
      }
    });
  }

  async function handleRejectedChecked(e: React.ChangeEvent<HTMLInputElement>) {
    setIsRejectedChecked(e.target.checked);
    let needReview: string = "";
    let approveChecked: string = "";
    let rejectChecked: string = "";
    let underReviewChecked: string = "";
    if (e.target.checked) {
      rejectChecked = "rejected";
      setRejectChecked("rejected");
    } else {
      setRejectChecked("");
    }
    if (isNeedsReviewChecked) {
      needReview = "pending";
    }
    if (isApprovedChecked) {
      approveChecked = "approved";
    }
    if (isUnderReviewChecked) {
      underReviewChecked = "underReview";
    }
    await authFetcher(
      `${getEndpointUrl(
        ENDPOINTS.filteredRegistrations(
          searchString,
          needReview,
          approveChecked,
          rejectChecked,
          underReviewChecked
        ),
      )}`,
    ).then((response) => {
      if (response.success) {
        setRegistrations(response.data?.result);
        setNeedsReviewCount(response.data?.reviewsCount.needsReview);
        setUnderReviewCount(response.data?.reviewsCount.underReview);
      }
    });
  }

  async function handleUnderReviewChecked(e: React.ChangeEvent<HTMLInputElement>) {
    setIsUnderReviewChecked(e.target.checked);
    let needReview: string = "";
    let approveChecked: string = "";
    let rejectChecked: string = "";
    let underReviewChecked: string = "";
    if (e.target.checked) {
      underReviewChecked = "underReview";
      setUnderReviewChecked("underReview");
    } else {
      setUnderReviewChecked("");
    }
    if (isNeedsReviewChecked) {
      needReview = "pending";
    }
    if (isApprovedChecked) {
      approveChecked = "approved";
    }
    if (isRejectedChecked) {
      rejectChecked = "rejected";
    }
    await authFetcher(
      `${getEndpointUrl(
        ENDPOINTS.filteredRegistrations(
          searchString,
          needReview,
          approveChecked,
          rejectChecked,
          underReviewChecked
        ),
      )}`,
    ).then((response) => {
      if (response.success) {
        setRegistrations(response.data?.result);
        setNeedsReviewCount(response.data?.reviewsCount.needsReview);
        setUnderReviewCount(response.data?.reviewsCount.underReview);
      }
    });
  }

  async function downloadCsv(
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) {
    e.preventDefault();
    let approveChecked = "";
    let needReview = "";
    let rejectChecked = "";
    if (isApprovedChecked) {
      approveChecked = "approved";
    }
    if (isNeedsReviewChecked) {
      needReview = "pending";
    }
    if (isRejectedChecked) {
      rejectChecked = "rejected";
    }
    authFileFetcher(
      `${getEndpointUrl(
        ENDPOINTS.downloadRegistrationsCsv(
          searchString,
          needReview,
          approveChecked,
          rejectChecked,
        ),
      )}`,
    )
      .then((result) => {
        const blob = new Blob([result], { type: "text/csv" });
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(result);
        link.download = "registrations.csv";
        link.click();
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function getColorClassBasedOnStatus(color: string): string {
    if (color == APPROVAL_STATUS.approved || color == APPROVAL_STATUS.pwdCreated || color == APPROVAL_STATUS.completed) {
      return "green_c";
    } else if (color == APPROVAL_STATUS.rejected) {
      return "red_c";
    } else if (color == APPROVAL_STATUS.pending) {
      return "gray_c";
    } else if (color == APPROVAL_STATUS.underReview) {
      return "orange_c";
    } else {
      return "";
    }
  }

  async function onClickApproveStatus(
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    id: number,
  ) {
    e.preventDefault();
    if (confirm("Are you sure want to approve the Registration")) {
      await authPut(`${getEndpointUrl(ENDPOINTS.approveRegistration(id))}`).then((result) => {
        if (result && result.success) {
          toast.success("Your changes have been saved 👍");
          mutate();
        }
      }).catch((err) => {
        console.log(err);
        // toast.error('An Error occurred, Try Again Later');
      });
    }
  }

  async function onClickApproveToFoundationalUser(
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    id: number,
  ) {
    e.preventDefault();
    if (confirm("Are you sure want to approve the Registration")) {
      await authPut(`${getEndpointUrl(ENDPOINTS.completeFoundationalUsersRequest(id))}`).then((result) => {
        if (result && result.success) {
          toast.success("Your changes have been saved 👍");
          mutate();
        }
      }).catch((err) => {
        console.log(err);
        // toast.error('An Error occurred, Try Again Later');
      });
    }
  }

  async function onClickRejectStatus(
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    id: number,
  ) {
    e.preventDefault();
    if (confirm("Are you sure want to reject the Registration")) {
      await authPut(`${getEndpointUrl(ENDPOINTS.rejectRegistration(id))}`).then((result) => {
        if (result && result.success) {
          toast.success("Your changes have been saved 👍");
          mutate();
        }
      }).catch((err) => {
        console.log(err);
        // toast.error('An Error occurred, Try Again Later');
      });
    }
  }

  function onClickDeleteRegistration(
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    id: number,
  ) {
    e.preventDefault();
    if (confirm("Are you sure want to delete this Registration Request")) {
      authFetcher(`${getEndpointUrl(ENDPOINTS.deleteRegistration(id))}`)
        .then(() => {
          mutate();
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }

  function searchRecords(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.preventDefault();
    setSearchString(searchString);
  }

  function getTypeString(type: USER_TYPE) {
    if (type == "free") {
      return "Foundational"
    }
    return "Premium";
  }

  const onClickUnderReview = (userId: number) => {
    if (confirm("Are you sure want to make this under review")) {
      authFetcher(`${getEndpointUrl(ENDPOINTS.makeUnderReviewRegistration(userId))}`)
        .then(() => {
          mutate();
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }

  return (
    <>
      {
        canRender ?
          <div>
            <div className="flex items-center justify-between -mt-3 md:-mt-0">
              <div className="sm:text-left">
                <h1 className="font-bold text-gray-900 header-font">Registrations</h1>
              </div>
              <div className="flex flex-row gap-4 sm:mt-0 sm:flex-row sm:items-start">
                <button
                  className="text-sm font-medium inline-flex items-center justify-center gap-1.5 border-gray-200 px-5 py-2 text-blue-300 transition hover:bg-gray-50 hover:text-blue-400 focus:outline-none"
                  type="button"
                  onClick={(e) => downloadCsv(e)}
                >
                  {" "}
                  <svg
                    className="w-3.5 h-3.5 text-blue-300"
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
                  <span className=""> Download Excel </span>
                </button>
              </div>
            </div>
            <div className="pt-6">
              <div className=" text-sm font-bold mb-2">Filter by Status</div>
              <div className="flex items-center mb-2">
                <input
                  id="default-checkbox-1"
                  type="checkbox"
                  checked={isNeedsReviewChecked}
                  onChange={(e) => handleReviewChecked(e)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label
                  htmlFor="default-checkbox-1"
                  className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                >
                  Needs Review {(needsReviewCount > 0) ? <span style={{ color: "green" }}>[ {needsReviewCount} ]</span> : ""}
                </label>
              </div>
              <div className="flex items-center mb-2">
                <input
                  id="default-checkbox-4"
                  type="checkbox"
                  checked={isUnderReviewChecked}
                  onChange={(e) => handleUnderReviewChecked(e)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label
                  htmlFor="default-checkbox-4"
                  className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                >
                  Under Review {(underReviewCount > 0) ? <span style={{ color: "#f5700c" }}>[ {underReviewCount} ]</span> : ""}
                </label>
              </div>
              <div className="flex items-center mb-2">
                <input
                  id="default-checkbox-2"
                  type="checkbox"
                  checked={isApprovedChecked}
                  onChange={(e) => handleApprovedChecked(e)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label
                  htmlFor="default-checkbox-2"
                  className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                >
                  Approved
                </label>
              </div>
              <div className="flex items-center mb-2">
                <input
                  id="default-checkbox-3"
                  type="checkbox"
                  checked={isRejectedChecked}
                  onChange={(e) => handleRejectedChecked(e)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label
                  htmlFor="default-checkbox-3"
                  className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                >
                  Rejected
                </label>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-8 py-6">
                <form className="flex items-center">
                  <label htmlFor="voice-search" className="sr-only">
                    Search
                  </label>
                  <div className="relative w-full">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                      <svg
                        className="w-4 h-4 text-gray-500 dark:text-gray-400"
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
                          d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                        />
                      </svg>
                    </div>
                    <input
                      type="search"
                      id="voice-search"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      onChange={(e) => setSearchString(e.target.value.trim())}
                      placeholder="Search..."
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    onClick={(e) => {
                      searchRecords(e);
                    }}
                    className="inline-flex items-center py-2 px-3 ms-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg border border-white-700 focus:outline-none "
                  >
                    <svg
                      className="w-4 h-4 me-2"
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
                        d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                      />
                    </svg>
                    Search
                  </button>
                </form>
              </div>
              <div className="registration_table">
                <DataTable
                  columns={columns}
                  data={registrations}
                  highlightOnHover={true}
                  pagination={true}
                  defaultSortFieldId="date" // Specify the default sorted column (e.g., 'name')
                  defaultSortAsc={false}
                  paginationPerPage={10}
                  paginationTotalRows={registrations.length}
                  paginationRowsPerPageOptions={[10, 20, 50, 100, registrations.length]}
                  paginationComponentOptions={{
                    rowsPerPageText: "Records per page:",
                    rangeSeparatorText: "out of",
                  }}
                />
              </div>
            </div>
          </div>
          :
          <div className="min-h-screen flex justify-center items-center">
            <Spinner />
          </div>
      }

    </>
  );
}
export default AdminRegistrationsMain;