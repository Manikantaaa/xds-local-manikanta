"use client";
import Breadcrumbs from "@/components/breadcrumb";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { PATH } from "@/constants/path";
import { authFetcher, authFileFetcher } from "@/hooks/fetcher";
import { opportunitiesReportTypes } from "@/types/user.type";
import Link from "next/link";
import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import Spinner from "@/components/spinner";
import { formatDate } from "@/services/common-methods";
import { Button, Modal } from "flowbite-react";

const OpportunitiesReport = () => {
  const [opportunities, setOpportunities] = useState<opportunitiesReportTypes[]>([]);
  const [canRender, setCanRender] = useState(false);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [intrestedCompany, setIntrestedCompany] = useState<{company:{id: number, name: string}}[]>([]);
  const [oppoName, setOppoName] = useState<string>("");
  // const [totalCount, setTotalCount] = useState(0);

  const columns = [
    {
      name: "Opportunity",
      cell: (row: opportunitiesReportTypes) => row.name,
      sortable: true,
      sortFunction: (a: opportunitiesReportTypes, b: opportunitiesReportTypes) => a.name.localeCompare(b.name),
    },
    {
      name: "Buyer",
      cell: (row: opportunitiesReportTypes) => (
        <div className="text-blue-300">
          <Link href={`/admin/company/${row.company.id}`}>
            {" "}
            {row.company.name}{" "}
          </Link>
        </div>
      ),
      sortable: true,
      sortFunction: (a: opportunitiesReportTypes, b: opportunitiesReportTypes) =>
        a.company.name.localeCompare(b.company.name),
    },
    {
      name: "Author",
      cell: (row: opportunitiesReportTypes) =>
        row.company.user.firstName + " " + row.company.user.lastName,
      sortable: true,
      sortFunction: (a: opportunitiesReportTypes, b: opportunitiesReportTypes) =>
        a.company.user.firstName.localeCompare(b.company.user.firstName),
    },
    {
      name: "Status",
      cell: (row: opportunitiesReportTypes) => {
        const expiryDate = new Date(row.expiryDate);
        const currentDate = new Date();
    
        let statusText = row.isArchieve
          ? "Archived"
          : row.oppStatus === "publish"
          ? "Live"
          : "Draft";
    
        if (!row.isArchieve && expiryDate < currentDate) {
          statusText = "Expired";
        }
    
        return (
          <div>
            <button>
              <svg
                className={`w-3.5 h-3.5 me-1 flex-shrink-0 ${
                  row.isArchieve
                    ? "grey_c"
                    : statusText === "Live"
                    ? "green_c"
                    : "red_c"
                }`}
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="m12 20c4.4183 0 8-3.5817 8-8 0-4.41828-3.5817-8-8-8-4.41828 0-8 3.58172-8 8 0 4.4183 3.58172 8 8 8z" />
              </svg>
            </button>
            {statusText}
          </div>
        );
      },
      sortable: true,
      sortFunction: (a: opportunitiesReportTypes, b: opportunitiesReportTypes) => {
        const getStatusPriority = (row: opportunitiesReportTypes) => {
          const expiryDate = new Date(row.expiryDate);
          const currentDate = new Date();
    
          
          if (row.isArchieve) return 1; // Archived
          if (row.oppStatus === "draft") return 2; // Draft
          if (expiryDate < currentDate) return 3; // Expired
          return 4; // Live
        };
    
        return getStatusPriority(a) - getStatusPriority(b);
      },
    },
    {
        name: "Interested SPs",
        cell: (row: opportunitiesReportTypes) =>
            <>
                {row.serviceProvidersIntrests.length > 0 ? 
                    <button className="link_color" onClick={()=>{setOppoName(row.name); intrestedSp(row.serviceProvidersIntrests)}}>
                    {row.serviceProvidersIntrests.length}
                </button>
                : 
                    <div>0</div>
                }
            </>,
        sortable: true,
        sortFunction: (a: opportunitiesReportTypes, b: opportunitiesReportTypes) =>
            a.serviceProvidersIntrests.length - b.serviceProvidersIntrests.length,
    },
    {
        name: "Last Published",
        cell: (row: opportunitiesReportTypes) =>
        formatDate(row.updatedAt).toString(),
        sortable: true,
        sortFunction: (a: opportunitiesReportTypes, b: opportunitiesReportTypes) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
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
      label: "Opportunities",
      path: "Opportunities",
    },
  ];

  useEffect(() => {
    authFetcher(`${getEndpointUrl(ENDPOINTS.getAllOpportinitiesForStats)}`)
      .then((result) => {
        if (result.success) {
          console.log(result.data);
          setOpportunities(result.data);
        }
        setCanRender(true);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  const intrestedSp = (intrest:{company:{id : number, name: string}}[]) => {
    setIntrestedCompany(intrest);
    setOpenModal(true);
  }

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
                Opportunities
              </h1>
            </div>
          </div>
              
          <div className="py-6 datatable_style">
            <DataTable
              columns={columns}
              data={opportunities}
              highlightOnHover={true}
              pagination={true}
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 20, 40, opportunities.length]}
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
      <Modal show={openModal} onClose={() => setOpenModal(false)}>
        <Modal.Header className="modal_header">
          <b>Interested SPs for [{oppoName}]</b>
        </Modal.Header>
        <Modal.Body>
            {intrestedCompany.length > 0 && intrestedCompany.map((intrested:{company:{id: number, name: string}}) => (
                <div>
                    <Link href={`/admin/company/${intrested.company.id}`} className="link_color">{intrested.company.name}</Link>
                </div>
            ))
            }
        </Modal.Body>
        <Modal.Footer className="modal_footer">
          <Button
            className="h-[40px] button_blue"
            onClick={() => {
              setOpenModal(false);
            }}
          >
            Ok
          </Button>
        </Modal.Footer>
      </Modal>
    </>
    
  );
};

export default OpportunitiesReport;
