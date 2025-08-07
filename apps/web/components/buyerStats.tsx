import { PATH } from "@/constants/path";
import { useEffect, useState } from "react";
import Spinner from "@/components/spinner";
import Breadcrumbs from "./breadcrumb";
import DataTable from "react-data-table-component";
import { authFetcher, authFileFetcher } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { Button, Modal, Tooltip } from "flowbite-react";
import { TRIAL_PERIOD, USER_TYPE } from "@/types/user.type";
import "../public/css/detatable.css";
import { format } from "date-fns";

export type IdName = {
  id: number;
  name: string;
}

export interface BuyerStat {
  id: number;
  buyerCompanyId: number;
  createdAt: Date;
  buyerCompany: {
    id: number;
    name: string;
    opportunities: IdName[];
    user: {
      firstName: string,
      lastName: string,
      email:string,
      isLoggedOnce: boolean,
      userType: USER_TYPE,
      isPaidUser: boolean,
      trialDuration: TRIAL_PERIOD
      BillingDetails: {id: number, isActive: boolean, subscriptionType: string}[],
      myLists: IdName[],
      myProjects: IdName[]
    };
  }
  providerDetails: {
    id: number,
    name: string,
    count: number,
    isContacted: boolean
  }[];
  mostRecentUpdate?: {
    type: string;
    id: number;
    date: Date;
  };
  followingDetails?: {
    createdAt: Date,
    followingCompanyId: number,
    followingCompanyName: string
  }[];
}

const BuyerStats = () => {

  const [isLoading, setIsLoading] = useState(true);
  const [buyerStatsList, setBuyerStatsList] = useState<BuyerStat[]>([]);
  const [openCompaniesList, setOpenCompaniesList] = useState(false);
  const [companiesList, setCompaniesList] = useState<{id: number, name: string }[]>([]);
  const [mostRecentFollowCompany, setMostRecentFollowCompany] = useState<any>();

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
      label: "Buyer Stats",
      path: "Buyer Stats",
    },
  ];

  const columns = [
     {
    name: "Date",
    cell: (row: BuyerStat) => (
      <span>
        {row.mostRecentUpdate?.date
          ? format(new Date(row.mostRecentUpdate.date), "MMMM d, yyyy")
          : "-"}
      </span>
    ),
    sortable: false,
  },
  {
    name: "First Name",
    cell: (row: BuyerStat) => <span>{row.buyerCompany?.user?.firstName || "-"}</span>,
    sortable: true,
    sortFunction: (a: BuyerStat, b: BuyerStat) =>
      (a.buyerCompany?.user?.firstName || "").localeCompare(b.buyerCompany?.user?.firstName || ""),
  },
  {
    name: "Last Name",
    cell: (row: BuyerStat) => <span>{row.buyerCompany?.user?.lastName || "-"}</span>,
    sortable: true,
    sortFunction: (a: BuyerStat, b: BuyerStat) =>
      (a.buyerCompany?.user?.lastName || "").localeCompare(b.buyerCompany?.user?.lastName || ""),
  },
  {
    name: "Company Name",
    cell: (row: BuyerStat) => <span>{row.buyerCompany?.name || "-"}</span>,
    sortable: true,
    sortFunction: (a: BuyerStat, b: BuyerStat) =>
      (a.buyerCompany?.name || "").localeCompare(b.buyerCompany?.name || ""),
  },
    {
      name: "Type",
      cell: (row: BuyerStat) => getUserType(row.buyerCompany.user),
      sortable: true,
      sortFunction: (a: BuyerStat, b: BuyerStat) =>  getUserType(a.buyerCompany?.user).localeCompare(getUserType(b.buyerCompany?.user))
    },
    // {
    //   name: "Logged-In",
    //   cell: (row: BuyerStat) => (
    //     <div>
    //       {
    //         row.buyerCompany?.user?.isLoggedOnce ?
    //         <svg
    //           className={`w-4 h-4 me-2 dark:text-green-400 flex-shrink-0 green_c`}
    //           aria-hidden="true"
    //           xmlns="http://www.w3.org/2000/svg"
    //           fill="currentColor"
    //           viewBox="0 0 20 20"
    //         >
    //           <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
    //         </svg>
    //       :
    //         <svg
    //           className={`me-2 w-4 h-4 dark:text-white red_c`}
    //           aria-hidden="true"
    //           xmlns="http://www.w3.org/2000/svg"
    //           fill="currentColor"
    //           viewBox="0 0 20 20"
    //         >
    //           <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z" />
    //         </svg>
    //       }
    //     </div>
        
    //   ),
    //   sortable: true,
    //   sortFunction: (a: BuyerStat, b: BuyerStat) => getLoggedString(a.buyerCompany?.user?.isLoggedOnce).localeCompare(getLoggedString(b.buyerCompany?.user?.isLoggedOnce)),
    // },
    {
      name: "Top Viewed Service Providers",
      cell: (row: BuyerStat) => (
        <div>
          {
            row.providerDetails && row.providerDetails.length > 0 &&
            <ul className="buyer-stat-circle-list space-y-2">
              {row.providerDetails.map((item, index) => (
                <li key={index}>
                  <span>{item.name}</span>
                  <span style={{color: "red"}}> ({item.count})</span>
                </li>
              ))}
            </ul>
          }
        </div>
      ),
      sortable: true,
      // sortFunction: (a: SearchFilterStats, b: SearchFilterStats) => {
      //   return Number(a.services?.count) - Number(b.services?.count)
      // } 
    },
    {
      name: "Contacted",
      cell: (row: BuyerStat) => (
        <div>
          {
            row.providerDetails && row.providerDetails.length > 0 &&
            <ul className="buyer-stat-circle-list space-y-2">
              {
                row.providerDetails.map((item, index) => (
                  <li key={index}>
                    <span> { (item.isContacted) ? "Yes" : "-" }</span>
                    {
                      row.mostRecentUpdate?.type == "contact" && row.mostRecentUpdate?.id == item.id &&
                      <span style={{color: "green"}}>{" (New)" }</span>
                    }
                  </li>
                ))
              }
            </ul>
          }
        </div>
      ),
      // sortFunction: (a: SearchFilterStats, b: SearchFilterStats) => {
      //   return Number(a.services?.count) - Number(b.services?.count)
      // } 
    },
    {
      name: "Opportunities",
      cell: (row: BuyerStat) => (
        <div>
          {
            (row.buyerCompany?.opportunities && row.buyerCompany?.opportunities.length > 5) ? 
            <Tooltip 
              content={ 
                <div>
                  {
                    row.buyerCompany?.opportunities.map((item, index) => (
                      <p key={index}>{item.name}{ row.mostRecentUpdate?.type == "oppotunity" && row.mostRecentUpdate?.id == item.id && " (New)" }</p>
                    ))
                  }
                </div> 
              }
            >
              <div>
                <ul className="buyer-stat-circle-list space-y-1">
                  {
                    row.buyerCompany?.opportunities.slice(0, 5).map((item, index) => (
                      <li key={index}>
                        <span> { item.name }</span>
                        {
                          row.mostRecentUpdate?.type == "oppotunity" && row.mostRecentUpdate?.id == item.id &&
                          <span style={{color: "green"}}>{" (New)" }</span>
                        }
                      </li>
                    ))
                  }
                </ul>
              </div>
            </Tooltip>
            :
            <div>
              {
                row.buyerCompany?.opportunities && row.buyerCompany?.opportunities.length > 0 &&
                <ul className="buyer-stat-circle-list space-y-1">
                  {
                    row.buyerCompany?.opportunities.map((item, index) => (
                      <li key={index}>
                        <span> { item.name }</span>
                        {
                          row.mostRecentUpdate?.type == "oppotunity" && row.mostRecentUpdate?.id == item.id &&
                          <span style={{color: "green"}}>{" (New)" }</span>
                        }
                      </li>
                    ))
                  }
                </ul>
              }
            </div>
          }
        </div>
      )
    },
    {
      name: "Lists",
      cell: (row: BuyerStat) => (
        <div>
          {
            (row.buyerCompany?.user?.myLists && row.buyerCompany?.user?.myLists.length > 5) ? 
            <Tooltip className="tier_tooltip_2"
              content={ 
                <div>
                  <ul className="buyer-stat-circle-list buyer_list_tooltip">
                  {
                    row.buyerCompany?.user?.myLists.map((item, index) => (
                      <li key={index}>
                        {item.name}{ row.mostRecentUpdate?.type == "list" && row.mostRecentUpdate?.id == item.id && " (New)" }
                      </li>
                    ))
                  }
                  </ul>
                </div> 
              }
            >
              <div>
                <ul className="buyer-stat-circle-list space-y-1">
                  {
                    row.buyerCompany?.user?.myLists.slice(0, 5).map((item, index) => (
                      <li key={index}>
                        <span> { item.name }</span>
                        {
                          row.mostRecentUpdate?.type == "list" && row.mostRecentUpdate?.id == item.id &&
                          <span style={{color: "green"}}>{" (New)" }</span>
                        }
                      </li>
                    ))
                  }
                </ul>
              </div>
            </Tooltip>
            :
            <div>
              {
                row.buyerCompany?.user?.myLists && row.buyerCompany?.user?.myLists.length > 0 &&
                <ul className="buyer-stat-circle-list">
                  {
                    row.buyerCompany?.user?.myLists.map((item, index) => (
                      <li key={index}>
                        <span> { item.name }</span>
                        {
                          row.mostRecentUpdate?.type == "list" && row.mostRecentUpdate?.id == item.id &&
                          <span style={{color: "green"}}>{" (New)" }</span>
                        }
                      </li>
                    ))
                  }
                </ul>
              }
            </div>
          }
        </div>
      ) 
    },
    {
      name: "Projects",
      cell: (row: BuyerStat) => (
        <div>
          {
            (row.buyerCompany?.user?.myProjects && row.buyerCompany?.user?.myProjects.length > 5) ? 
            <Tooltip 
              content={ 
                <div>
                  {
                    row.buyerCompany?.user?.myProjects.map((item, index) => (
                      <p key={index}>{item.name}{ row.mostRecentUpdate?.type == "project" && row.mostRecentUpdate?.id == item.id && " (New)" }</p>
                    ))
                  }
                </div> 
              }
            >
              <div>
                <ul className="buyer-stat-circle-list space-y-1">
                  {
                    row.buyerCompany?.user?.myProjects.slice(0, 5).map((item, index) => (
                      <li key={index}>
                        <span> { item.name }</span>
                        {
                          row.mostRecentUpdate?.type == "project" && row.mostRecentUpdate?.id == item.id &&
                          <span style={{color: "green"}}>{" (New)" }</span>
                        }
                      </li>
                    ))
                  }
                </ul>
              </div>
            </Tooltip>
            :
            <div>
              {
                row.buyerCompany?.user?.myProjects && row.buyerCompany?.user?.myProjects.length > 0 &&
                <ul className="buyer-stat-circle-list">
                  {
                    row.buyerCompany?.user?.myProjects.map((item, index) => (
                      <li key={index}>
                        <span> { item.name }</span>
                        {
                          row.mostRecentUpdate?.type == "project" && row.mostRecentUpdate?.id == item.id &&
                          <span style={{color: "green"}}>{" (New)" }</span>
                        }
                      </li>
                    ))
                  }
                </ul>
              }
            </div>
          }
        </div>
      )
    },
    {
      id: "follows",
      name: "Follows",
      cell: (row: BuyerStat) => (
        <div>
          {
            row.followingDetails && row.followingDetails?.length > 0 &&
            <>
              <span>{`${row.followingDetails?.length} `}</span>
              <button className="link_color" 
                onClick={(e) => { e.preventDefault(); setFollowingCompaniesList(row.followingDetails ? row.followingDetails : [], row?.mostRecentUpdate ? row.mostRecentUpdate : {type: "", id: NaN, date: new Date()}); }}>
                View List
              </button>
            </>
          }
          {
            row.mostRecentUpdate?.type == "follow" &&
            <span style={{color: "green"}}>{" (New)" }</span>
          }
        </div>
      )
    },
    {
      name: "Email",
      cell: (row: BuyerStat) => <span>{row.buyerCompany?.user?.email || "-"}</span>,
      sortable: true,
      sortFunction: (a: BuyerStat, b: BuyerStat) =>
        (a.buyerCompany?.user?.email || "").localeCompare(b.buyerCompany?.user?.email || ""),
    }

  ];

  const getBuyersStats = () => {
    authFetcher(`${getEndpointUrl(ENDPOINTS.getBuyersStats)}`).then((result) => {
      const sortedData = [...result.data].sort((a, b) => { return new Date(b.mostRecentUpdate?.date!).getTime() - new Date(a.mostRecentUpdate?.date!).getTime() });
      setBuyerStatsList(sortedData);
      setIsLoading(false);
    }).catch((err) => {
      console.log(err);
    })
  }

  function getUserType(
    user: {
    userType: USER_TYPE,
    isPaidUser: boolean,
    trialDuration: TRIAL_PERIOD
  }): string {
    if(!user.isPaidUser && user.userType == 'free') {
      return "Foundational"
    } else if(user.isPaidUser && user.userType == 'paid') {
      return "Premium";
    } else if(user.isPaidUser && user.userType == 'trial') {
      if(user.trialDuration == 'monthly') {
        return "30d Trial";
      } else if(user.trialDuration == 'eightWeeks') {
        return "8w Trial";
      } else if(user.trialDuration == 'sixMonths') {
        return "6m Trial";
      } else {
        return "1y Membership";
      }
    }
    return "";
  }

  function getLoggedString(isLogged: boolean) {
    if(isLogged) {
      return "Yes";
    }
    return "No";
  }

async function downloadCsv(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.preventDefault();
    authFileFetcher( `${getEndpointUrl(ENDPOINTS.downloadBuyerStats)}`).then((result) => {
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(result);   
        link.download = "XDS_buyer_stats.csv";
        link.click();
      }).catch((error) => {
        console.log(error);
      });
  }


  useEffect(() => {
    getBuyersStats();
  }, []);

  const setFollowingCompaniesList = (followingCompanies: {
      createdAt: Date,
      followingCompanyId: number,
      followingCompanyName: string
    }[], mostRecentUpdate: {id: number, type: string, date: Date}
  ) => {
    console.log(mostRecentUpdate);
    const companiesArr: {
      id: number, 
      name: string, 
    }[] = [];
    followingCompanies.map((item: any) => {
      companiesArr.push({ id: item.followingCompanyId, name: item.followingCompanyName });
    });
    setCompaniesList(companiesArr);
    setMostRecentFollowCompany(mostRecentUpdate);
    setOpenCompaniesList(true);
  }

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
                Buyer Stats
              </h1>
            </div>
             <div className="flex  pt-3" >
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
          <div className="py-6 datatable_style datatable_buyersttes">
            <DataTable
              columns={columns}
              data={buyerStatsList}
              highlightOnHover={true}
              pagination={true}
              paginationPerPage={10}
              paginationTotalRows={buyerStatsList.length}
              paginationRowsPerPageOptions={[10, 20, 50, 100, buyerStatsList.length]}
              paginationComponentOptions={{
                rowsPerPageText: "Records per page:",
                rangeSeparatorText: "out of",
              }}
            />
          </div>
          <Modal show={ openCompaniesList } size="md" onClose={() => setOpenCompaniesList(false)}>
            <Modal.Header>Following Companies</Modal.Header>
            <Modal.Body>
              <div className="space-y-6 pb-6">
                <ul className="buyer-stat-circle-list space-y-2">
                  {
                    companiesList.sort((a, b) => a?.name.localeCompare(b?.name)).map((item: { id: number, name: string }, index: number) => (
                      <li key={index}>
                        <span>{item.name}</span>
                        {
                          mostRecentFollowCompany?.type == "follow" && item.id == mostRecentFollowCompany.id &&
                          <span style={{color: "green"}}>{" (New)" }</span>
                        }
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

export default BuyerStats;