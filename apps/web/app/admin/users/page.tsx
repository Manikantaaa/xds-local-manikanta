"use client";
import AdminUsersMain from "@/components/admin/admin-users-main";
import Breadcrumbs from "@/components/breadcrumb";
import { PATH } from "@/constants/path";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { useUserContext } from "@/context/store";
import { authFetcher, authFileFetcher } from "@/hooks/fetcher";
import { formatDate, getRoleString, getUserTypeString } from "@/services/common-methods";
import { Users } from "@/types/user.type";
import Link from "next/link";
import { redirect, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import useSWR from "swr";
import { Select, Tooltip } from "flowbite-react";
import FlaggedUsers from "@/components/flaggedUsers";
import "@/public/css/detatable.css";
import Spinner from "@/components/spinner";

const AllUsers = () => {
  const breadcrumbItems = [
    {
      label: PATH.HOME.name,
      path: PATH.HOME.path,
    },
    {
      label: PATH.USERS.name,
      path: PATH.USERS.path,
    },
  ];
  const { user } = useUserContext();
  const router = useRouter();
  if (!user) {
    router.push(PATH.HOME.path);
  }
  
  const [allUsers, setAllUsers] = useState<Users[]>([]);
  const [flaggedUsers, setFlaggedUsers] = useState([]);
  const [flaggedUsersCount, setFlaggedUsersCount] = useState<{id: number}[]>([]);
  const [searchString, setSearchString] = useState("");
  const [isSelectLiveUsers, setIsSelectLiveUsers] = useState(false);
  const [isSelectArchiveUsers, setIsSelectArchiveUsers] = useState(false);
  const [isSelectPaidUsers, setIsSelectPaidUsers] = useState(false);
  const [isSelectFreeUsers, setIsSelectFreeUsers] = useState(false);
  const [isSelectTrial, setIsSelectTrial] = useState(false);
  const [isSelectFlaggedUsers, setIsSelectFlaggedUsers] = useState(false);
  const [isLiveVal, setIsLiveVal] = useState("");
  const [isArchieveVal, SetisArchieveVal] = useState("");
  const [isPaidVal, setIsPaidVal] = useState("");
  const [isFreeVal, setIsFreeVal] = useState("");
  const [isTrialVal, setTrialVal] = useState("");
  const [isFlaggedVal, setIsFlaggedVal] = useState("");
  const [canRender, setCanRender] = useState(false);
  const [reportsRender, setReportsRender] = useState(false);
  const [userrole, setUserRole] = useState<string>("all");
  const [TabNumber, setTabNumber] = useState<number>(1);
  // const [isLoading, setIsLoading] = useState(false);
  
  const columns = [
    {
      id: "date",
      name: "Date Created",
      cell: (row: Users) => formatDate(row.createdAt),
      sortable: true,
      sortFunction: (a: Users, b: Users) => {
        // Parse createdAt strings to extract date components
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
    
        // Compare the Date objects
        return dateA.getTime() - dateB.getTime();
      },
    }, 
    {
      id: "loginDate",
      name: "Last login",
      cell: (row: Users) => row.lastLoginDate ?  formatDate(row.lastLoginDate) : '-',
      sortable: true,
      sortFunction: (a: Users, b: Users) => {
        // Parse createdAt strings to extract date components
        const dateA = a.lastLoginDate ? new Date(a.lastLoginDate).getTime() : 0;
        const dateB = b.lastLoginDate ? new Date(b.lastLoginDate).getTime() : 0;
    
        // Compare the Date objects
        return dateA - dateB;
      },
    },    
    {
      id: "name",
      name: "Name",
      cell: (row: Users) => (
        <div className="text-blue-300">
          <Link prefetch={false} href={`/admin/users/${row.id}`}>
            {row.firstName + " " + row.lastName}
          </Link>
        </div>
      ),
      sortable: true,
      sortFunction: (a: Users, b: Users) =>
        a.firstName.localeCompare(b.firstName),
    },
    {
      id: "email",
      name: "Email",
      cell: (row: Users) => (
        <div className="text-blue-300">
          <Link href={"mailto:" + row.email}> {row.email} </Link>
        </div>
      ),
      sortable: true,
      sortFunction: (a: Users, b: Users) => a.email.localeCompare(b.email),
    },
    {
      id: "company",
      name: "Company",
      cell: (row: Users) => row.companies[0]?.name,
      sortable: true,
      sortFunction: (a: Users, b: Users) =>
        a.companies[0]?.name.localeCompare(b.companies[0]?.name),
    },
    {
      id: "website",
      name: "Company Website",
      cell: (row: Users) => (
        <div className="text-blue-300">
          <Link prefetch={false} 
            href={row.companies[0]?.website &&
            (row.companies[0]?.website.startsWith('http://') || row.companies[0]?.website.startsWith('https://') ?
            row.companies[0]?.website : `https://${row.companies[0]?.website}`)}
            // href={row.companies[0]?.website}
            target="_blank">
            {row.companies[0]?.website}
          </Link>
        </div>
      ),
      sortable: true,
      sortFunction: (a: Users, b: Users) =>
        a.companies[0]?.website.localeCompare(b.companies[0]?.website),
    },
    {
      id: "role",
      name: "Role",
      cell: (row: Users) => getRoleString(row.userRoles[0].roleCode),
      sortFunction: (a: Users, b: Users) =>
        getRoleString(a.userRoles[0].roleCode).localeCompare(
          getRoleString(b.userRoles[0].roleCode),
        ),
      sortable: true,
    },
    {
      id: "type",
      name: "Sub Status",
      cell: (row: Users) => getUserTypeString(row),
      sortable: true,
      sortFunction: (a: Users, b: Users) => getUserTypeString(a).localeCompare(getUserTypeString(b)),
    },
    {
      id: "loggedInStatus",
      name: "Logged-In Status",
      cell: (row: Users) => returnLoggedStatus(row.isLoggedOnce),
      sortable: true,
      sortFunction: (a: Users, b: Users) => returnLoggedStatus(a.isLoggedOnce).localeCompare(returnLoggedStatus(b.isLoggedOnce)),
    },
    {
      id: "status",
      name: "Status",
      cell: (row: Users) => (
        <div>
          <button>
            <svg
              className={`w-3.5 h-3.5 me-1 flex-shrink-0 ${
                row.isArchieve ? "red_c" : "green_c"
              }`}
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="m12 20c4.4183 0 8-3.5817 8-8 0-4.41828-3.5817-8-8-8-4.41828 0-8 3.58172-8 8 0 4.4183 3.58172 8 8 8z" />
            </svg>
          </button>
          {row.isArchieve ? "Archived" : "Live"}
        </div>
      ),
      sortable: true,
      sortFunction: (a: Users, b: Users) => {
        return a.isArchieve === b.isArchieve ? 0 : a.isArchieve ? 1 : -1;
      },
    },
    {
      id: "actions",
      name: "Actions",
      cell: (row: Users) => (
        <div>
          <>
            {row.isArchieve ? (
              <button onClick={() => unArchiveUser(row.id)}>
                <Tooltip content="Live">
                  {" "}
                  <svg
                    className={`w-4 h-4 me-2 green_c flex-shrink-0 green_c`}
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                  </svg>
                </Tooltip>
              </button>
            ) : (
              <button onClick={() => archiveUser(row.id)}>
                <Tooltip content="Archive">
                  {" "}
                  <svg
                    className={`w-4 h-4 me-2 green_c flex-shrink-0 red_c`}
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z" />
                  </svg>
                </Tooltip>
              </button>
            )}
            {/* <button onClick={(e) => sendMailConfirmation(e, row.id)}>
              <svg
                className="me-2 w-4 h-4 red_c dark:text-white"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z" />
              </svg>
            </button> */}
            <button onClick={() => deleteUser(row.id)}>
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
            </button>
          </>
        </div>
      ),
      // <button className='btn btn-success' onClick={() => handleButtonClick(row)}>Click Me</button>,
    },
  ];

  const { data: userData, mutate } = useSWR(
    `${getEndpointUrl(
      ENDPOINTS.getUsers(
        searchString,
        isLiveVal,
        isArchieveVal,
        isPaidVal,
        isFreeVal,
        isFlaggedVal,
        isTrialVal,
        userrole,
      ),
    )}`,
    authFetcher,
  );

  function unArchiveUser(id: number) {
    if (confirm("Are you sure want to Un-Archive this user")) {
      authFetcher(`${getEndpointUrl(ENDPOINTS.unArchiveUser(+id))}`).then(
        () => {
          mutate();
        },
      );
    }
  }

  function archiveUser(id: number) {
    if (confirm("Are you sure want to Archive this user")) {
      authFetcher(`${getEndpointUrl(ENDPOINTS.archiveUser(+id))}`).then(() => {
        mutate();
      });
    }
  }

  function deleteUser(id: number) {
    if (confirm("Are you sure want to delete this user")) {
      authFetcher(`${getEndpointUrl(ENDPOINTS.deleteUser(+id))}`).then(() => {
        mutate();
      });
    }
  }

  useEffect(() => {
    if (userData && userData.success) {
      const fetchedUsersData = userData.data?.result
      setAllUsers(fetchedUsersData);
      setFlaggedUsers(userData.data?.flaggedUsers);
      let reportsCount:{id: number}[] = [];
      userData.data.flaggedUsers.map((item: any) => {
          if (!item.isReportResolved){
            reportsCount.push({id: item.id});
          }
      });
      setFlaggedUsersCount(reportsCount);
      setCanRender(true);
      setReportsRender(false);
    }
  }, [userData, searchString, reportsRender]);

  function searchRecords(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.preventDefault();
    setSearchString(searchString);
  }

  function getUsersOnFilter(
    isLive: boolean,
    isArchive: boolean,
    isPaid: boolean,
    isFree: boolean,
    isFlagged: boolean,
    isDownloadCsv: boolean = false,
    isTrial: boolean
  ) {
    let isLiveVal = "";
    let isArchieveVal = "";
    let isPaidVal = "";
    let isFreeVal = "";
    let isFlaggedVal = "";
    let isTrailVal = ""

    if (isLive) {
      isLiveVal = "live";
    }
    if (isArchive) {
      isArchieveVal = "archive";
    }
    if (isPaid) {
      isPaidVal = "paid";
    }
    if (isFree) {
      isFreeVal = "free";
    }
    if (isFlagged) {
      isFlaggedVal = "flagged";
    }
    if(isTrial) {
      isTrailVal = "trail"
    }
    if(isDownloadCsv) {
      authFileFetcher(`${getEndpointUrl(ENDPOINTS.downloadUsersCsv(
        searchString, 
        isLiveVal, 
        isArchieveVal, 
        isPaidVal, 
        isFreeVal, 
        isFlaggedVal,
        isTrailVal,
        userrole,
      ))}`).then((result) => {
        setCanRender(true);
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(result);
        link.download = "XDS-Spark_Users_Export.csv";
        link.click();
      })
      .catch((error) => {
        setCanRender(true);
        console.log(error);
      });
    } else {
      authFetcher(
        `${getEndpointUrl(
          ENDPOINTS.getUsers(
            searchString,
            isLiveVal,
            isArchieveVal,
            isPaidVal,
            isFreeVal,
            isFlaggedVal,
            isTrailVal,
            userrole,
          ),
        )}`,
      ).then((result) => {
        setAllUsers(result.data?.result);
      });
    }
  }

  function clickedLive(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.checked) {
      setIsLiveVal("live");
    } else {
      setIsLiveVal("");
    }
    setIsSelectLiveUsers(e.target.checked);
    getUsersOnFilter(
      e.target.checked,
      isSelectArchiveUsers,
      isSelectPaidUsers,
      isSelectFreeUsers,
      isSelectFlaggedUsers,
      false,
      isSelectTrial
    );
  }

  function clickedArchieved(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.checked) {
      SetisArchieveVal("archive");
    } else {
      SetisArchieveVal("");
    }
    setIsSelectArchiveUsers(e.target.checked);
    getUsersOnFilter(
      isSelectLiveUsers,
      e.target.checked,
      isSelectPaidUsers,
      isSelectFreeUsers,
      isSelectFlaggedUsers,
      false,
      isSelectTrial
    );
  }

  function clickedPaidUsers(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.checked) {
      setIsPaidVal("paid");
    } else {
      setIsPaidVal("");
    }
    setIsSelectPaidUsers(e.target.checked);
    getUsersOnFilter(
      isSelectLiveUsers,
      isSelectArchiveUsers,
      e.target.checked,
      isSelectFreeUsers,
      isSelectFlaggedUsers,
      false,
      isSelectTrial
    );
  }

  function clickedFreeUsers(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.checked) {
      setIsFreeVal("free");
    } else {
      setIsFreeVal("");
    }
    setIsSelectFreeUsers(e.target.checked);
    getUsersOnFilter(
      isSelectLiveUsers,
      isSelectArchiveUsers,
      isSelectPaidUsers,
      e.target.checked,
      isSelectFlaggedUsers,
      false,
      isSelectTrial
    );
  }

  function clickedTrailUsers(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.checked) {
      setTrialVal("trail");
    } else {
      setIsFreeVal("");
    }
    setIsSelectTrial(e.target.checked);
    getUsersOnFilter(
      isSelectLiveUsers,
      isSelectArchiveUsers,
      isSelectPaidUsers,
      isSelectFreeUsers,
      isSelectFlaggedUsers,
      false,
      e.target.checked
    );
  }

  function clickedFlaggedUsers(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.checked) {
      setIsFlaggedVal("flagged");
      setIsSelectLiveUsers(false);
      setIsSelectArchiveUsers(false);
      setIsSelectPaidUsers(false);
      setIsSelectFreeUsers(false);
      setIsSelectTrial(false);
    } else {
      setIsFlaggedVal("");
    }
    setIsSelectFlaggedUsers(e.target.checked);
    getUsersOnFilter(
      isSelectLiveUsers,
      isSelectArchiveUsers,
      isSelectPaidUsers,
      isSelectFreeUsers,
      e.target.checked,
      false,
      isSelectTrial
    );
  }

  function returnLoggedStatus(loggedStatus: boolean) {
    return loggedStatus ? "Yes" : "No"
  }

  async function downloadCsv(
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) {
    e.preventDefault();
    setCanRender(false);
    getUsersOnFilter(isSelectLiveUsers, isSelectArchiveUsers, isSelectPaidUsers, isSelectFreeUsers, isSelectFlaggedUsers, true, isSelectTrial);
  }
  useEffect (() => {
    if(TabNumber === 2) {
      redirect(PATH.INVITEES.path);
    }
  }, [TabNumber]);
  return (
    <div className="w-full px-5 pos_r">
      <div className="pb-6 pt-6 breadcrumbs_s">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      {
        canRender ? 
        <div>
          <div className="flex items-center justify-between -mt-3 md:-mt-0">
            <div className="sm:text-left">
              <h1 className="font-bold text-gray-900 header-font">Users</h1>
            </div>
            <div className="mt-4 flex flex-col gap-4 sm:mt-0 sm:flex-row sm:items-start">
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
            <div className=" text-sm font-bold pb-2">Filter by Status</div>
            <div className="flex items-center mb-2">
              <input
                id="default-checkbox-1"
                type="checkbox"
                disabled={(isFlaggedVal && isFlaggedVal == "flagged") ? true : false}
                checked={isSelectLiveUsers}
                onChange={(e) => clickedLive(e)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label
                htmlFor="default-checkbox-1"
                className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                Live
              </label>
            </div>
            <div className="flex items-center mb-2">
              <input
                id="default-checkbox-2"
                type="checkbox"
                disabled={(isFlaggedVal && isFlaggedVal == "flagged") ? true : false}
                checked={isSelectArchiveUsers}
                onChange={(e) => clickedArchieved(e)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label
                htmlFor="default-checkbox-2"
                className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                Archived
              </label>
            </div>
            <div className="flex items-center mb-2">
              <input
                id="default-checkbox-3"
                type="checkbox"
                checked={isSelectPaidUsers}
                disabled={(isFlaggedVal && isFlaggedVal == "flagged") ? true : false}
                onChange={(e) => clickedPaidUsers(e)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label
                htmlFor="default-checkbox-3"
                className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                Premium (paid)
              </label>
            </div>
            <div className="flex items-center mb-2">
              <input
                id="default-checkbox-4"
                type="checkbox"
                disabled={(isFlaggedVal && isFlaggedVal == "flagged") ? true : false}
                checked={isSelectFreeUsers}
                onChange={(e) => clickedFreeUsers(e)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label
                htmlFor="default-checkbox-4"
                className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                Foundational (free)
              </label>
            </div>
            <div className="flex items-center mb-2">
              <input
                id="default-checkbox-5"
                type="checkbox"
                disabled={(isFlaggedVal && isFlaggedVal == "flagged") ? true : false}
                checked={isSelectTrial}
                onChange={(e) => clickedTrailUsers(e)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label
                htmlFor="default-checkbox-5"
                className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                Trial users
              </label>
            </div>
            {/* <div className="flex items-center">
              <input
                id="default-checkbox-6"
                type="checkbox"
                checked={isSelectFlaggedUsers}
                onChange={(e) => clickedFlaggedUsers(e)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label
                htmlFor="default-checkbox-6"
                className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                Reported companies {(flaggedUsersCount.length > 0) ? <span style={{ color: "red" }}>[ {flaggedUsersCount.length} ]</span> : ""}
              </label>
            </div> */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-8 py-6 ">
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
                    placeholder="Search by Name, Email, Company"
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
              <div className="inline-flex justify-end">
              <div className="text-sm flex items-center font-bold mr-2">Filter by Role: </div>
              <Select value={ userrole } onChange={(e) => setUserRole(e.target.value)}>
                <option value="all">All</option>
                <option value="buyer">Buyer</option>
                <option value="service_provider">Service Provider</option>
              </Select>
              </div>
            </div>
            <div className="relative border-b border-gray-200">
                <nav className="-mb-px flex gap-6 pt-6" aria-label="Tabs">
                    <button
                        onClick={() => {
                            setTabNumber(1)
                        }}
                        className={`mbobile_w_tabs shrink-0 border-b-2 px-1 pb-2 font-bold text-sm  ${TabNumber == 1
                            ? "shrink-0 border-b-2 px-1  text-sky-600  border-sky-500 "
                            : "border-transparent default_text_color hover:border-gray-300 hover:text-gray-700"
                            }`}
                    >
                        Created via registrations
                    </button>
                    <button
                        onClick={() => {
                            setTabNumber(2);
                        }}
                        className={`mbobile_w_tabs shrink-0 border-b-2 px-1 pb-2 font-bold text-sm   ${TabNumber == 2
                            ? "shrink-0 border-b-2 px-1  text-sky-600  border-sky-500 "
                            : "border-transparent default_text_color hover:border-gray-300 hover:text-gray-700"
                            }`}
                    >
                        Created via company admins
                    </button>
                </nav>
            </div>
            <div className="our_work_tab_content">
                <div className=" py-6 relative user_table">

                  <DataTable
                    columns={columns}
                    data={allUsers}
                    highlightOnHover
                    pagination={true}
                    paginationPerPage={10}
                    defaultSortFieldId="date" // Specify the default sorted column (e.g., 'name')
                    defaultSortAsc={false}
                    paginationTotalRows={allUsers.length}
                    paginationRowsPerPageOptions={[10, 20, 50, 100, allUsers.length]}
                    paginationComponentOptions={{
                      rowsPerPageText: "Records per page:",
                      rangeSeparatorText: "out of",
                    }}
                  />
    
                  {/* {
                    (isFlaggedVal && isFlaggedVal == "flagged") ?
                      <FlaggedUsers flaggedUsers={flaggedUsers} reportsRender ={reportsRender} searchString = {(val: boolean)=>{mutate();setReportsRender(val)}}></FlaggedUsers>
                      :
                      <DataTable
                        columns={columns}
                        data={allUsers}
                        highlightOnHover
                        pagination={true}
                        paginationPerPage={10}
                        defaultSortFieldId="date" // Specify the default sorted column (e.g., 'name')
                        defaultSortAsc={false}
                        paginationTotalRows={allUsers.length}
                        paginationRowsPerPageOptions={[10, 20, 50, 100, allUsers.length]}
                        paginationComponentOptions={{
                          rowsPerPageText: "Records per page:",
                          rangeSeparatorText: "out of",
                        }}
                      />
                    } */}
                </div>
            </div>
          </div>
        </div>
        :
        <div className="min-h-screen flex justify-center items-center">
          <Spinner />
        </div>
      }
    </div>
  );
};

export default AllUsers;
