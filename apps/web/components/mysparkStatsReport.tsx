"use client";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { authFetcher } from "@/hooks/fetcher";
import { formatDate, getRoleString, getUserType } from "@/services/common-methods";
import { Select} from "flowbite-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import Breadcrumbs from "./breadcrumb";
import { PATH } from "@/constants/path";
import Spinner from "./spinner";
import { mysparkReportTypes } from "@/types/user.type";

const MysparkStatsReport = () => {

    const [mysparkStats, setMysparkStats ] = useState<mysparkReportTypes[]>([]);
    const [loader, setLoader] = useState(true);
    const [industryType, setIndustryType] = useState("admin");
    const breadcrumbItems = [
        {
        label: PATH.HOME.name,
        path: PATH.HOME.path,
        },
        {
        label: PATH.REPORTS.name,
        path: PATH.REPORTS.path,
        },
        {
        label: "My Spark Stats",
        path: "My Spark Stats",
        },
    ];
  
  useEffect(() =>{
    const getMysparkData = () => {
      setLoader(true);
      authFetcher(`${getEndpointUrl(ENDPOINTS.getMysparkReport(industryType))}`)
        .then((result) => {
          if (result.length > 0) {
            const activeBuyers: mysparkReportTypes[] = result;
            setMysparkStats(activeBuyers);
          }
          setLoader(false);
        })
        .catch((err) => {
          setLoader(false);
          console.log(err);
        });
    }
    getMysparkData();
  },[industryType]);

  const mySparkStatsTable = [
    {
        id: "date",
        name: "Last Updated",
        cell: (row: mysparkReportTypes) => formatDate(row.updatedAt),
        sortable: true,
        sortFunction: (a: mysparkReportTypes, b: mysparkReportTypes) =>
          new Date(a.updatedAt).getTime() -
          new Date(b.updatedAt).getTime(),
    },
    {
        id: "userName",
        name: "User Name",
        cell: (row: mysparkReportTypes) => (
          <div className="text-blue-300">
            <Link prefetch={false} href={`/admin/users/${row.userId}`} passHref>
              {" "}
              {row.userName}
            </Link>
            <Link prefetch={false} href={`/admin/company/${row.companyId}`} passHref>
              {", "}
              {row.companyname}{" "}
            </Link>
          </div>
        ),
        sortable: true,
        sortFunction: (a: mysparkReportTypes, b: mysparkReportTypes) =>
          a.userName.localeCompare(b.userName),
    },
    {
        id: "role",
        name: "Role",
        cell: (row: mysparkReportTypes) => getRoleString(row.roleCode),
        sortFunction: (a: mysparkReportTypes, b: mysparkReportTypes) =>
          getRoleString(a.roleCode).localeCompare(
            getRoleString(b.roleCode),
          ),
        sortable: true,
    },
    {
        id: "type",
        name: "Type",
        cell: (row: mysparkReportTypes) => getUserType(row),
        sortable: true,
        sortFunction: (a: mysparkReportTypes, b: mysparkReportTypes) => getUserType(a).localeCompare(getUserType(b)),
    },
    {
        id: "updatedCompanies",
        name: "# My Spark Tabs",
        cell: (row: mysparkReportTypes) => row.companiesUpdatedCount,
        sortable: true,
        sortFunction: (a: mysparkReportTypes, b: mysparkReportTypes) => a.companiesUpdatedCount - b.companiesUpdatedCount,
    },
    {
        id: "updatedCompanies",
        name: "Completion %",
        cell: (row: mysparkReportTypes) => (
            <div>
                <ul className="buyer-stat-circle-list space-y-2">
                    <li>Partner Status - <span style={{color: "red"}}>{row.partnerStatus}%</span></li>
                    <li>Legal & Security - <span style={{color: "red"}}>{row.average}%</span></li>
                    <li>Rates by Service - <span style={{color: "red"}}>{row.rateServicesAverage}%</span></li>
                    <li>Project Performance - <span style={{color: "red"}}>{row.projectPerformanceAverage}%</span></li>
                    <li>Notes - <span style={{color: "red"}}>{row.notesAverage}%</span></li>
                </ul>
            </div>
          ),
        // sortable: true,
        // sortFunction: (a: mysparkReportTypes, b: mysparkReportTypes) => (a.notesAverage).toLocaleString().localeCompare((b.notesAverage).toLocaleString()),
    },
  ]

  return (
    <>
      <div className="lg:col-span-4 border-l ps-8 most_active">
        <div className="pb-6 pt-6 breadcrumbs_s">
            <Breadcrumbs items={breadcrumbItems} />
        </div>
        <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:text-left">
            <h1 className="font-bold default_text_color header-font">
                My Spark Stats
            </h1>
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-1 xl:grid-cols-1 2xl:grid-cols-1 md:grid-cols-1 sm:grid-cols-1 pt-3" >
          <div className="pr-2">
            <Select id="industryType" value={ industryType } onChange={(e) => setIndustryType(e.target.value)}>
              <option value="admin">All Users</option>
              <option value="buyer">Buyer</option>
              <option value="service_provider">Service Provider</option>
            </Select>
          </div>
          </div>
        </div>
        { !loader ?
        <div className="py-6 datatable_style myspark_dataTable">
            <DataTable
            columns={mySparkStatsTable}
            data={mysparkStats}
            highlightOnHover
            pagination={true}
            paginationPerPage={10}
            defaultSortFieldId="date" // Specify the default sorted column (e.g., 'name')
            defaultSortAsc={false}
            paginationRowsPerPageOptions={[10, 20, 50, 100, mysparkStats.length]}
            paginationComponentOptions={{
                rowsPerPageText: "Records per page:",
                rangeSeparatorText: "out of",
            }}
            />
        </div>
        : 
            <div className="min-h-[60vh] flex justify-center items-center">
              <Spinner />
            </div>
        }
      </div>
    </>
  );
};

export default MysparkStatsReport;
