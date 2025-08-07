import { PATH } from "@/constants/path";
import { useEffect, useState } from "react";
import Breadcrumbs from "./breadcrumb";
import DataTable from "react-data-table-component";
import Link from "next/link";
import { authFetcher } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { TopReportsDto } from "@/types/user.type";
import { getRoleString } from "@/services/common-methods";
import Spinner from "@/components/spinner";

const TopViewedProfiles = () => {
  const [topViewedReports, setTopViewedReports] = useState<TopReportsDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const columns = [
    {
      name: "Views",
      cell: (row: TopReportsDto) => row.pageViewedCount,
      sortable: true,
      sortFunction: (a: TopReportsDto, b: TopReportsDto) => a.pageViewedCount - b.pageViewedCount,
    },
    {
      name: "Company",
      cell: (row: TopReportsDto) => (
        <div className="text-blue-300">
          <Link prefetch={false} href={`/admin/company/${row.companyId}`}>
            {row.company.name}
          </Link>
        </div>
      ),
      sortable: true,
      sortFunction: (a: TopReportsDto, b: TopReportsDto) => a.company.name.localeCompare(b.company.name),

    },
    {
      name: "Company Website",
      cell: (row: TopReportsDto) => (
        <div className="text-blue-300">
          <Link prefetch={false} href={(row.company.website) ? row.company.website : "#"} target="_blank">
            {row.company.website}
          </Link>
        </div>
      ),
      sortable: true,
      sortFunction: (a: TopReportsDto, b: TopReportsDto) => a.company.website.localeCompare(b.company.website),

    },
    {
      name: "Type",
      cell: (row: TopReportsDto) =>
        getRoleString(row.company.user.userRoles[0].roleCode),
      sortable: true,
      sortFunction: (a: TopReportsDto, b: TopReportsDto) => a.company.user.userRoles[0].roleCode.localeCompare(b.company.user.userRoles[0].roleCode),

    },
  ];
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
      label: PATH.DASHBOARD.name,
      path: PATH.DASHBOARD.path,
    },
  ];
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    authFetcher(`${getEndpointUrl(ENDPOINTS.getTopViewedProfiles)}`)
      .then((result) => {
        if (result.success) {
          setTotalCount(result.data.count);
          const topViewedReports: TopReportsDto[] = result.data.result;
          setTopViewedReports(topViewedReports);
        }
        setCanRender(true);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  return (
    <>
      {
        canRender ? 
        <div className="lg:col-span-4 border-l ps-8 most_active">
          <div className="pb-6 pt-6 breadcrumbs_s">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:text-left">
              <h1 className="font-bold default_text_color header-font">
                Top 20 Viewed Profiles
              </h1>
            </div>
          </div>
          <div className="py-6 datatable_style">
            <DataTable
              columns={columns}
              data={topViewedReports}
              highlightOnHover={true}
              pagination={true}
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 20]}
              paginationTotalRows={totalCount}
              paginationComponentOptions={{
                rowsPerPageText: "Records per page:",
                rangeSeparatorText: "out of",
              }}
            />
          </div>
        </div>
        :
        <div className="lg:col-span-4 border-l ps-8 most_active">
          <div className="min-h-[90vh] flex justify-center items-center">
            <Spinner />
          </div>
        </div>
      }
    </>
    
  );
};

export default TopViewedProfiles;
