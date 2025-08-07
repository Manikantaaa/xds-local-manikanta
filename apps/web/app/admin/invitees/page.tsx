"use client";
import Breadcrumbs from "@/components/breadcrumb";
import { PATH } from "@/constants/path";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { redirect } from "next/navigation";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { authFetcher, authFileFetcher, deleteItem } from "@/hooks/fetcher";
import { userInvitees } from "@/types/user.type";
import { formatDate, getRoleString, getUserType } from "@/services/common-methods";
import { Select, Tooltip, } from "flowbite-react";
import "../../../public/css/detatable.css";
import Spinner from "@/components/spinner";
import useSWR from "swr";
/* eslint-disable @typescript-eslint/no-explicit-any */

const AllInviteesList = () => {
  const [canRender, setCanRender] = useState(false);
  const [invitees, setInvitees] = useState<userInvitees[]>([]);
  const [TabNumber, setTabNumber] = useState<number>(2);
  const [isSelectLiveUsers, setIsSelectLiveUsers] = useState(false);
  const [isSelectArchiveUsers, setIsSelectArchiveUsers] = useState(false);
  const [userrole, setUserRole] = useState<string>("all");
  const [searchString, setSearchString] = useState("");
  const columns = [
    {
      id: "createdAt",
      name: "Date Created",
      cell: (row: userInvitees) => formatDate(row.createdAt),
      sortable: true,
      sortFunction: (a: userInvitees, b: userInvitees) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      id: "loginDate",
      name: "Last login",
      cell: (row: userInvitees) => row.lastLoginDate ?  formatDate(row.lastLoginDate) : '-',
      sortable: true,
      sortFunction: (a: userInvitees, b: userInvitees) => {
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
      cell: (row: userInvitees) => (
        <div className="text-blue-300">
          <Link prefetch={false} href={`/admin/invitees/${row.id}`} passHref>
            {" "}
            {row.firstName} {row.LastName}
          </Link>
          
        </div>
      ),
      sortable: true,
      sortFunction: (a: userInvitees, b: userInvitees) => a.firstName.localeCompare(b.firstName),
    },
    {
        id: "email",
        name: "Email",
        cell: (row: userInvitees) => (
          <div className="text-blue-300">
            <Link prefetch={false} href={`mailto:${row.email}`}>
              {" "}
              {`${row.email}`}{" "}
            </Link>
          </div>
        ),
        sortable: true,
        sortFunction: (a: userInvitees, b: userInvitees) =>
          a.email.localeCompare(b.email),
      },
    {
      id: "company",
      name: "Company",
      cell: (row: userInvitees) => (
        <div className="text-blue-300">
          <Link prefetch={false} href={`/admin/company/${row.companies.id}`}>
            {" "}
            {row.companies.name}{" "}
          </Link>
        </div>
      ),
      sortable: true,
      sortFunction: (a: userInvitees, b: userInvitees) => a.companies.name.localeCompare(b.companies.name),
    },
    {
      id: "role",
      name: "Role",
      cell: (row: userInvitees) => getRoleString(row.companies.user.userRoles[0].roleCode),
      sortFunction: (a: userInvitees, b: userInvitees) =>
        getRoleString(a.companies.user.userRoles[0].roleCode).localeCompare(
          getRoleString(b.companies.user.userRoles[0].roleCode),
        ),
      sortable: true,
    },
    {
        id: "createdBy",
        name: "Created By",
        cell: (row: userInvitees) => (
          <div className="text-blue-300">
            <Link prefetch={false} href={`/admin/users/${row.companies.user.id}`}>
              {row.companies.user.firstName} {row.companies.user.lastName}
            </Link>
          </div>
        ),
        sortable: true,
        sortFunction: (a: userInvitees, b: userInvitees) => a.companies.user.firstName.localeCompare(b.companies.user.firstName),
      },
    {
      id: "group",
      name: "Group",
      cell: (row: userInvitees) => (<div>
      {row.groups && row.groups.name}
    </div>),
      sortFunction: (a: userInvitees, b: userInvitees) => a.groups && b.groups && a.groups.name.localeCompare(b.groups.name),
      sortable: true,
    },
    {
        id: "type",
        name: "Sub Status",
        cell: (row: userInvitees) =>
        getUserType({
          userType: row.companies?.user?.userType,
          trialDuration: row.companies?.user?.trialDuration,
        }),
        sortable: true,
        sortFunction: (a: userInvitees, b: userInvitees) =>
        getUserType({
          userType: a.companies?.user?.userType,
          trialDuration: a.companies?.user?.trialDuration,
        }).localeCompare(
          getUserType({
            userType: b.companies?.user?.userType,
            trialDuration: b.companies?.user?.trialDuration,
          })
        ),
        },
    {
      id: "loggedInStatus",
      name: "Logged-In Status",
      cell: (row: userInvitees) => returnLoggedStatus(row.isLoggedInOnce),
      sortable: true,
      sortFunction: (a: userInvitees, b: userInvitees) => returnLoggedStatus(a.isLoggedInOnce).localeCompare(returnLoggedStatus(b.isLoggedInOnce)),
    },
    {
      id: "Status",
      name: "Status",
      cell: (row: userInvitees) => (
        <div>
          <button>
            <svg
              className={`w-3.5 h-3.5 me-1 flex-shrink-0 ${row.isArchieve ? "red_c" : "green_c"}`}
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
      sortFunction: (a: userInvitees, b: userInvitees) => {
        return a.isArchieve === b.isArchieve ? 0 : a.isArchieve ? 1 : -1;
      },
    },
    {
      id: "actions",
      name: "Actions",
      cell: (row: userInvitees) => (
          <>
              <button onClick={() => setArchieveStatus(row.id, row.isArchieve)}>
                <Tooltip content={`${row.isArchieve ? 'Live' : 'Archive'}`}>
                  {" "}
                  {row.isArchieve ? 
                  <svg
                    className={`w-4 h-4 me-2 green_c flex-shrink-0 ${row.isArchieve ? "green_c" : "red_c"
                      }`}
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                  </svg>
                  :
                  <svg
                    className={`w-4 h-4 me-2 green_c flex-shrink-0 red_c`}
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z" />
                  </svg>
                  }
                </Tooltip>
              </button>
            <button onClick={() => deleteCompany(row.id)}>
              <Tooltip content="Delete">
                <svg
                  className="me-2 w-4 h-4 blue_c "
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
      ),
    },
  ];

  function returnLoggedStatus(loggedStatus: boolean) {
    return loggedStatus ? "Yes" : "No"
  }

  const setArchieveStatus = async(id: number, archive: boolean) => {
    let alertmsg = "";
    if(archive) {
      alertmsg = "Are you sure want to Un-Archive this user";
    } else {
      alertmsg = "Are you sure want to Archive this user";
    }
    if (confirm(alertmsg)) {
        await authFetcher(`${getEndpointUrl(ENDPOINTS.updateArchiveStatusAdminUser(id))}`).then(() => {
          mutate();
        });
      }
  }

  const deleteCompany = (id: number) => {
    if (confirm("Are you sure want to delete this user")) {
        deleteItem(`${getEndpointUrl(ENDPOINTS.deleteAdminUser(+id))}`).then(() => {
          mutate();
        });
      }
  }

  const breadcrumbItems = [
    {
      label: PATH.HOME.name,
      path: PATH.HOME.path,
    },
    {
      label: PATH.INVITEES.name,
      path: PATH.INVITEES.path,
    },
  ];


  const { data: userData, mutate } = useSWR(
    `${getEndpointUrl(
      ENDPOINTS.getAllInvitees(
        searchString,
        "",
        "",
        userrole,
      ),
    )}`,
    authFetcher,
  );

useEffect(()=>{
    if (userData && userData.success) {
      const fetchedUsersData = userData.data?.result
      setInvitees(fetchedUsersData);
      setCanRender(true);
    }
}, [userData])

useEffect (() => {
  if(TabNumber === 1) {
    redirect(PATH.USERS.path);
  }
}, [TabNumber]);

function getUsersOnFilter(
  isLive: boolean,
  isArchive: boolean,
  isDownloadCsv: boolean = false,
) {
  let isLiveVal = "";
  let isArchieveVal = "";

  if (isLive) {
    isLiveVal = "live";
  }
  if (isArchive) {
    isArchieveVal = "archive";
  }
  if(isDownloadCsv) {
    authFileFetcher(`${getEndpointUrl(ENDPOINTS.downloadInviteesCsv(
      searchString, 
      isLiveVal, 
      isArchieveVal,
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
        ENDPOINTS.getAllInvitees(
          searchString,
          isLiveVal,
          isArchieveVal,
          userrole,
        ),
      )}`,
    ).then((result) => {
      
      setInvitees(result.data?.result);
    });
  }
}

function clickedLive(e: React.ChangeEvent<HTMLInputElement>) {
  setIsSelectLiveUsers(e.target.checked);
  getUsersOnFilter(
    e.target.checked,
    isSelectArchiveUsers,
    false
  );
}

function clickedArchieved(e: React.ChangeEvent<HTMLInputElement>) {
  setIsSelectArchiveUsers(e.target.checked);
  getUsersOnFilter(
    isSelectLiveUsers,
    e.target.checked,
    false
  );
}

function searchRecords(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
  e.preventDefault();
  setSearchString(searchString);
}

async function downloadCsv(
  e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
) {
  e.preventDefault();
  setCanRender(false);
  getUsersOnFilter(isSelectLiveUsers, isSelectArchiveUsers, true);
}

  return (
    <>
    <div className="w-full px-5 pos_r">
      <div className="pb-6 pt-6 breadcrumbs_s">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      {
        canRender ?
          <>
            <div className="flex items-center justify-between -mt-3 md:-mt-0">
              <div className="sm:text-left">
                <h1 className="font-bold text-gray-900 header-font">Invitees</h1>
              </div>
              <button className="text-sm font-medium inline-flex items-center justify-center gap-1.5 border-gray-200 px-5 py-2 text-blue-300 transition hover:bg-gray-50 hover:text-blue-400 focus:outline-none" onClick={(e)=>downloadCsv(e)}>
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
                Download Excel</button>
            </div>
            <div className="pt-6">
            <div className=" text-sm font-bold pb-2">Filter by Status</div>
            <div className="flex items-center mb-2">
              <input
                id="default-checkbox-1"
                type="checkbox"
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
                        className="mbobile_w_tabs shrink-0 border-b-2 px-1 pb-2 font-bold text-sm border-transparent default_text_color hover:border-gray-300 hover:text-gray-700">
                        Created via registrations
                    </button>
                    <button
                        onClick={() => {
                            setTabNumber(2);
                        }}
                        className = "mbobile_w_tabs shrink-0 border-b-2 px-1 pb-2 font-bold text-sm shrink-0 border-b-2 px-1  text-sky-600  border-sky-500"
                        // className={`shrink-0 border-b-2 px-1 pb-2 font-bold text-sm   ${TabNumber == 2
                        //     ? "shrink-0 border-b-2 px-1  text-sky-600  border-sky-500 "
                        //     : "border-transparent default_text_color hover:border-gray-300 hover:text-gray-700"
                        //     }`}
                    >
                        Created via company admins
                    </button>
                </nav>
            </div>
              <div className=" py-6 relative companies_table">
                <DataTable
                  columns={columns}
                  data={invitees}
                  highlightOnHover={true}
                  pagination={true}
                //   selectableRows={true}
                  paginationPerPage={10}
                  defaultSortFieldId="createdAt" // Specify the default sorted column (e.g., 'name')
                  defaultSortAsc={false}
                  paginationRowsPerPageOptions={[10, 20, 50, 100]}
                />
              </div>
            </div>
            </>
          :
            <div className="min-h-screen flex justify-center items-center">
              <Spinner />
            </div>
          }
          </div>
    </>

  );
};
export default AllInviteesList;
/* eslint-disable @typescript-eslint/no-explicit-any */
