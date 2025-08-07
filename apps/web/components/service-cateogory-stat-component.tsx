import { PATH } from "@/constants/path";
import { useEffect, useState } from "react";
import Spinner from "./spinner";
import Breadcrumbs from "./breadcrumb";
import DataTable from "react-data-table-component";
import { authFetcher } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { Button, Modal, Select } from "flowbite-react";

export interface ServiceCategory {
  serviceName: string;
  totalCount: number
  sponsoredCompanies: {
    name: string,
    counts: number,
  }[];
}

const ServiceCategoryStatComponent = () => {

  const [isLoading, setIsLoading] = useState(false);
  const [serviceCategoryStats, setServiceCategoryStats] = useState<ServiceCategory[]>([]);
  const [openCompaniesList, setOpenCompaniesList] = useState(false);
  const [companiesList, setCompaniesList] = useState<{ name: string, count: number }[]>([]);
  const [filterVal, setFilterVal] = useState("");

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
      label: "Service Category Stats",
      path: "Service Category Stats",
    },
  ];

  const columnsForBuyerFollowDetails = [
    {
      id: "sc",
      name: "Service Category",
      cell: (row: ServiceCategory) => (
        <div>{row.serviceName}</div>
      ),
      sortable: true,
      sortFunction: (a: ServiceCategory, b: ServiceCategory) => a?.serviceName.localeCompare(b?.serviceName)
    }, 
    {
      id: "tcr",
      name: "Total Clicks Received",
      cell: (row: ServiceCategory) => (
        <span style={{color: "red"}}>{row.totalCount}</span>
      ),
      sortable: true,
      sortFunction: (a: ServiceCategory, b: ServiceCategory) => b.totalCount - a.totalCount
    },
    {
      id: "scc",
      name: "Sponsored Company Clicks",
      cell: (row: ServiceCategory) => (
        <div>
          {
            row.sponsoredCompanies?.length > 0 &&
            <>
              <ul className="buyer-stat-circle-list space-y-2">
                {row.sponsoredCompanies.sort((a, b) => b.counts - a.counts).map((item: { name: string, counts: number }, index: number) => (
                  index < 10 ?
                  <div>
                    <li key={index}>
                      <span>{item.name + " "}</span>
                      <span style={{color: "red"}}>({item.counts})</span>
                    </li>
                    {
                      row.sponsoredCompanies.length > 10 && index == 9 &&
                      <button style={{marginTop: "3px"}} className="link_color" onClick={(e) => { e.preventDefault(); setFollowingCompaniesList(row.sponsoredCompanies);}}>...See More</button>
                    }
                  </div>
                  :
                  ""
                ))}
              </ul>
            </>
          }
        </div>
      )
    }
  ];

  const setFollowingCompaniesList = (sponsoredCompanies: { name: string, counts: number }[]) => {
    const companiesArr: {
      name: string,
      count: number, 
    }[] = [];
    sponsoredCompanies.map((item) => {
      companiesArr.push({name: item.name, count: item.counts}); 
    });
    setCompaniesList(companiesArr);
    setOpenCompaniesList(true);
  }

  const getServiceCategoryStats = () => {
    setIsLoading(true);
    authFetcher(`${getEndpointUrl(ENDPOINTS.getServiceCategoryStats(filterVal))}`).then((result) => {
      console.log(result)
      if(result.success) {
        setServiceCategoryStats(result.data);
      }
    }).catch((err) => {
      console.log(err);
    }).finally(() => {
      setIsLoading(false);
    });
  }

  useEffect(() => {
    getServiceCategoryStats();
  }, [filterVal]);

  return(
    <>
      {
        isLoading ? 
        <div className="lg:col-span-4 border-l ps-8 most_active">
          <div className="min-h-[90vh] flex justify-center items-center">
            <Spinner />
          </div>
        </div>
        :
        <div className="lg:col-span-4 border-l ps-8 most_active">
          <div className="pb-6 pt-6 breadcrumbs_s">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:text-left">
              <h1 className="font-bold default_text_color header-font">
                Service Category Stats
              </h1>
            </div>
            <div className="grid grid-cols-1 gap-1 lg:grid-cols-1 xl:grid-cols-1 2xl:grid-cols-1 md:grid-cols-1 sm:grid-cols-1 pt-3 pr-1" >
              <div>
                <Select id="adCompanies" value={filterVal} onChange={(e) =>{ setFilterVal(e.target.value) }} >
                  <option value="">All Users</option>
                  <option value="buyer">Buyers</option>
                  <option value="service_provider">Service Providers</option>
                </Select>
              </div>
            </div>
          </div>
          <div className="py-6 datatable_style">
            <DataTable
            columns={columnsForBuyerFollowDetails}
            data={serviceCategoryStats}
            highlightOnHover={true}
            defaultSortFieldId="tcr"
            // defaultSortAsc={false}
            pagination={true}
            paginationPerPage={10}
            paginationTotalRows={serviceCategoryStats.length}
            paginationRowsPerPageOptions={[10, 20, 50, 100, serviceCategoryStats.length]}
            paginationComponentOptions={{
              rowsPerPageText: "Records per page:",
              rangeSeparatorText: "out of",
            }}
          />
          </div>
          <Modal show={ openCompaniesList } size="md" onClose={() => setOpenCompaniesList(false)}>
            <Modal.Header>Sponsored Company Clicks</Modal.Header>
            <Modal.Body>
              <div className="space-y-6 pb-6">
                <ul className="buyer-stat-circle-list space-y-2">
                  {
                    companiesList.sort((a, b) => b.count - a.count).map((item: { name: string, count: number }, index: number) => (
                      // <li key={index}>{item.name}{`(${item.count})`}</li>
                      <li key={index}>
                        <span>{item.name + " "}</span>
                        <span style={{color: "red"}}>({item.count})</span>
                      </li>
                    ))
                  }
                </ul>
              </div>
            </Modal.Body>
            <Modal.Footer className="modal_footer">
              <Button onClick={() => setOpenCompaniesList(false)}>Close</Button>
            </Modal.Footer>
          </Modal>
        </div>
      }
    </>
  );
}

export default ServiceCategoryStatComponent;