import { PATH } from "@/constants/path";
import { useEffect, useState } from "react";
import Breadcrumbs from "./breadcrumb";
import DataTable from "react-data-table-component";
import Link from "next/link";
import { authFetcher } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { TopReportsDto } from "@/types/user.type";
import Spinner from "@/components/spinner";

const TopViewedFoundingSponcers = () => {
  const [topViewedFoundingSponcers, setTopViewedFoundingSponcers] = useState<
    TopReportsDto[]
  >([]);
  const [canRender, setCanRender] = useState(false);
  const columns = [
    {
      name: "Page Visits",
      cell: (row: TopReportsDto) => row.pageViewedCount,
      sortable: true,
      sortFunction: (a: TopReportsDto, b: TopReportsDto) => a.pageViewedCount - b.pageViewedCount,
    },
    {
      name: "Founding Sponsors",
      cell: (row: TopReportsDto) => (
        <div className="text-blue-300">
          <Link prefetch={false} href={`/admin/company/${row.companyId}`}>
            {" "}
            {row.company.name}{" "}
          </Link>
        </div>
      ),
      sortable: true,
      sortFunction: (a: TopReportsDto, b: TopReportsDto) => a.company.name.localeCompare(b.company.name),
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
      label: "Top Viewed Founding Sponsors",
      path: "Top Viewed Founding Sponsors",
    },
  ];

  useEffect(() => {
    authFetcher(`${getEndpointUrl(ENDPOINTS.topViewedSponcers)}`)
      .then((result) => {
        if (result.success) {
          const topViewedReports: TopReportsDto[] = result.data.result;
          setTopViewedFoundingSponcers(topViewedReports);
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
                Top Viewed Founding Sponsors
              </h1>
            </div>
          </div>
          <div className="py-6 datatable_style">
            <DataTable
              columns={columns}
              data={topViewedFoundingSponcers}
              highlightOnHover={true}
              pagination={false}
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 20]}
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

export default TopViewedFoundingSponcers;
