import { PATH } from "@/constants/path";
import { useEffect, useState } from "react";
import Spinner from "./spinner";
import Breadcrumbs from "./breadcrumb";
import DataTable from "react-data-table-component";
import { authFetcher, authFileFetcher } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { formatDate, getRoleString } from "@/services/common-methods";
import { Button, Modal, Select } from "flowbite-react";

export interface CompanyContactStat {
  id: number;
  totalCounts: number;
  totalMeetLinkCounts: number
  createdAt: Date;
  updatedAt: Date;
  providingCompany: {
    id: number;
    name: string;
    userName: string;
  },
  contactingCompany: { 
    id: number, 
    name: string, 
    clickCount: number,
    meetLinkCounts: number,
    role: string,
    userName: string;
    updatedAt: Date;
  }[];
}

const CompanyContactStats = () => {

  const [isLoading, setIsLoading] = useState(true);
  const [companyContactStats, setCompanyContactStats] = useState<CompanyContactStat []>([]);
  const [engagementClicks, setEngagementClicks] = useState<CompanyContactStat []>([]);
  const [opentFullContactModal, setOpentFullContactModal] = useState(false);
  const [allContactingCompanies, setAllContactingCompanies] = useState<{id: number, name: string, clickCount: number, role: string, userName: string, updatedAt: Date}[]>([]);
  const [clickTypes, setClickTypes] = useState<string>("contactClicks");
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
      label: "Engagement Clicks",
      path: "Engagement Clicks",
    },
  ];

  const columns = [
    {
      id: "spName",
      name: "Service Provider",
      cell: (row: CompanyContactStat) => (
        <div>{row.providingCompany?.name}</div>
      ),
      sortable: true,
      sortFunction: (a: CompanyContactStat, b: CompanyContactStat) => a.providingCompany?.name.localeCompare(b.providingCompany?.name)
    }, 
    { 
      id: "totalClicks",
      name: clickTypes == "contactClicks" ? "Total Clicks Received" : "Total Meeting Clicks",
      cell: (row: CompanyContactStat) => (
        <div>{row.totalCounts}</div>
      ),
      sortable: true,
      sortFunction: (a: CompanyContactStat, b: CompanyContactStat) => a.totalCounts - b.totalCounts
    },
    {
      id: "contactedBy",
      name: clickTypes == "contactClicks" ? "Contacted By" : "Meeting Booked By",
      cell: (row: CompanyContactStat) => (
        <div>
          {
            row.contactingCompany && row.contactingCompany.length > 0 &&
            <>
              <ul className="buyer-stat-circle-list space-y-2">
                {row.contactingCompany.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map((item: { id: number, name: string, clickCount: number, role: string, userName: string, updatedAt: Date }, index: number) => (
                  index < 2 ?
                  <li key={index}>
                    <span>{item.userName},</span>
                    <span>{" "+item.name}</span>
                    <span style={{color: "red"}}> ({item.clickCount})</span>
                    <span> - { getRoleString(item.role, 0) } | { formatDate(item.updatedAt) }</span>
                    {
                      row.contactingCompany.length > 2 && index == 1 && 
                        <button className="link_color" onClick={(e) => { e.preventDefault(); setAllContactingCompanies(row.contactingCompany); setOpentFullContactModal(true); }}>...See More</button>
                    }
                  </li>
                  :
                  ""
                ))}
              </ul>
            </>
          }
        </div>
      ),
      sortable: true,
      sortFunction: (a: CompanyContactStat, b: CompanyContactStat) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    }
  ];

  const getCompanyContactStats = () => {
    authFetcher(`${getEndpointUrl(ENDPOINTS.getCompanyContactStats)}`).then((result) => {
      if(result.success) {
        const filteredCompanyContactStats = result.data.filter((item:{totalCounts : number}) => item.totalCounts !== 0);
        setCompanyContactStats(result.data);
        setEngagementClicks(filteredCompanyContactStats);
      }
    }).catch((err) => {
      console.log(err);
    }).finally(() => {
      setIsLoading(false);
    });
  }

  async function downloadCsv(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.preventDefault();
    authFileFetcher( `${getEndpointUrl(ENDPOINTS.downloadCompanyContactStats(clickTypes))}`).then((result) => {
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(result);
        if(clickTypes == "contactClicks"){
          link.download = "XDS_contact_clicks.csv";
        } else {
          link.download = "XDS_meet_link_clicks.csv";
        }

        link.click();
      }).catch((error) => {
        console.log(error);
      });
  }

  useEffect(() => {
    getCompanyContactStats()
  }, []);

  useEffect(() =>{
    if(clickTypes == "contactClicks"){
      const filteredCompanyContactStats = companyContactStats.filter((item:{totalCounts : number}) => item.totalCounts !== 0);
      setEngagementClicks(filteredCompanyContactStats);
    } else {
      const updatedCompanyContactStats = companyContactStats.map((company) => {
        const filteredContactingCompanies = company.contactingCompany
          .map((contact) => {
            if (contact.meetLinkCounts && contact.meetLinkCounts !== 0) {
              return {
                ...contact,
                clickCount: contact.meetLinkCounts,
              };
            }
            return null;
          })
          .filter((contact) => contact !== null);
        if (filteredContactingCompanies.length === 0) {
          return null;
        }

        return {
          ...company,
          totalCounts: company.totalMeetLinkCounts,
          contactingCompany: filteredContactingCompanies,
        };
      })
      .filter((company) => company !== null) as CompanyContactStat[];
    setEngagementClicks(updatedCompanyContactStats);

    }
  }, [clickTypes]);

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
                { clickTypes == "contactClicks" ? "Contact Clicks" : "Meeting Clicks"}
              </h1>
            </div>
            <div className="flex  pt-3" >
              <div className="mr-4">
                    <Select id="adCompanies" className="  w-[150px]" value={clickTypes} onChange={(e) => setClickTypes(e.target.value)} >
                          <option value={"contactClicks"}>Contact Clicks</option>
                          <option value={"meetLinkClicks"}>Meeting Clicks</option>
                    </Select>
              </div>
              <button 
                className="text-sm font-medium inline-flex items-center justify-center border-gray-200 px-2 py-2 text-blue-300 transition hover:bg-gray-50 hover:text-blue-400 focus:outline-none"
                type="button"
                onClick={(e) => downloadCsv(e)} >
                  <svg
                    className="w-3.5 h-3.5 text-blue-300  me-1"
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
                          c3.617,3.61,5.427,7.898,5.427,12.847C438.536,406.942,436.729,411.224,433.109,414.841z">
                        </path>
                        <path
                          d="M224.692,323.479c3.428,3.613,7.71,5.421,12.847,5.421c5.141,0,9.418-1.808,12.847-5.421l127.907-127.908
                          c5.899-5.519,7.234-12.182,3.997-19.986c-3.23-7.421-8.847-11.132-16.844-11.136h-73.091V36.543c0-4.948-1.811-9.231-5.421-12.847
                          c-3.62-3.617-7.901-5.426-12.847-5.426h-73.096c-4.946,0-9.229,1.809-12.847,5.426c-3.615,3.616-5.424,7.898-5.424,12.847V164.45
                          h-73.089c-7.998,0-13.61,3.715-16.846,11.136c-3.234,7.801-1.903,14.467,3.999,19.986L224.692,323.479z">
                        </path>
                      </g>
                    </g>
                  </svg>
                  <span className=""> Download CSV </span>
              </button>
            </div>
          </div>
          <div className="py-6 datatable_style datatable_contactclicks">
            <DataTable
              columns={columns}
              data={engagementClicks}
              highlightOnHover={true}
              pagination={true}
              paginationPerPage={10}
              paginationTotalRows={engagementClicks.length}
              paginationRowsPerPageOptions={[10, 20, 50, 100, engagementClicks.length]}
              defaultSortFieldId="contactedBy"
              defaultSortAsc={false}
              paginationComponentOptions={{
                rowsPerPageText: "Records per page:",
                rangeSeparatorText: "out of",
              }}
            />
          </div>
          <Modal show={opentFullContactModal} onClose={() => setOpentFullContactModal(false)}>
            <Modal.Header>Contacted By</Modal.Header>
            <Modal.Body>
              <div className="space-y-6 p-6">
                <ul className="buyer-stat-circle-list space-y-2">
                  {
                    allContactingCompanies.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map((item: { id: number, name: string, clickCount: number, role: string, userName: string, updatedAt: Date }, index: number) => (
                      <li key={index}>
                        <span>{item.userName},</span>
                        <span>{" "+item.name}</span>
                        <span style={{color: "red"}}> ({item.clickCount})</span>
                        <span> - { getRoleString(item.role, 0) } | { formatDate(item.updatedAt) }</span>
                      </li>
                    ))
                  }
                </ul>
              </div>
            </Modal.Body>
            <Modal.Footer className="modal_footer">
              <Button onClick={() => setOpentFullContactModal(false)}>Close</Button>
            </Modal.Footer>
          </Modal>
        </div>
      }
    </>
  );
}

export default CompanyContactStats;