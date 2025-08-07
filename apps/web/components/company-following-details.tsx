import { PATH } from "@/constants/path";
import { useEffect, useState } from "react";
import Spinner from "./spinner";
import Breadcrumbs from "./breadcrumb";
import DataTable from "react-data-table-component";
import { authFetcher, authFileFetcher } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { getRoleString } from "@/services/common-methods";
import { Button, Modal, Select } from "flowbite-react";
export interface BuyerFollowDetails {
  id: number;
  name: string;
  user: {
    firstName: string;
    lastName: string;
  };
  _count: {
    followingCompanies: number;
  }
  followingCompanies: {
    followedCompany: {
      id: number, 
      name: string, 
    }
  }[];
}

export interface SpFollowDetails {
  id: number;
  name: string;
  user: {
    firstName: string;
    lastName: string;
  };
  _count: {
    followedCompanies: number;
  }
}

const CompanyFollowingDetails = () => {

  const [isLoading, setIsLoading] = useState(false);
  const [buyerFollowStats, setBuyerFollowStats] = useState<BuyerFollowDetails []>([]);
  const [spFollowStats, setSpFollowStats] = useState<SpFollowDetails []>([]);
  const [openCompaniesList, setOpenCompaniesList] = useState(false);
  const [companiesList, setCompaniesList] = useState<{id: number, name: string }[]>([]);
  const [followingListModalHeading, setFollowingListModalHeading] = useState("");
  const [userRole, setUserRole] = useState("buyer");

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
      label: "Following Stats",
      path: "Following Stats",
    },
  ];

  const columnsForBuyerFollowDetails = [
    {
      id: "buyer",
      name: "Buyer",
      cell: (row: BuyerFollowDetails) => (
        <div>{row?.name + ", " + row.user.firstName + " " + row.user.lastName}</div>
      ),
      sortable: true,
      sortFunction: (a: BuyerFollowDetails, b: BuyerFollowDetails) => a?.name.localeCompare(b?.name)
    }, 
    {
      id: "followingCount",
      name: "# Following Companies",
      cell: (row: BuyerFollowDetails) => (
        <div>
          { row.followingCompanies?.length + " " }
        </div>
      ),
      sortable: true,
      sortFunction: (a: BuyerFollowDetails, b: BuyerFollowDetails) => b?.followingCompanies?.length - a?.followingCompanies?.length
    },
    {
      id: "followingList",
      name: "Following Companies List",
      cell: (row: BuyerFollowDetails) => (
        <div>
          {
            row.followingCompanies?.length > 0 && 
            <button className="link_color" onClick={(e) => { e.preventDefault(); setFollowingCompaniesList(row?.followingCompanies); }}>View List</button>
          }
        </div>
      )
    }
  ];

  const columnsForSpFollowDetails = [
    {
      id: "serviceProvider",
      name: "Service Provider",
      cell: (row: SpFollowDetails) => (
        <div>{row?.name + ", " + row.user.firstName + " " + row.user.lastName}</div>
      ),
      sortable: true,
      sortFunction: (a: SpFollowDetails, b: SpFollowDetails) => a?.name.localeCompare(b?.name)
    }, 
    {
      id: "followedCount",
      name: "# Follows",
      cell: (row: SpFollowDetails) => (
        <div>
          { row._count.followedCompanies }
        </div>
      ),
      sortable: true,
      sortFunction: (a: SpFollowDetails, b: SpFollowDetails) => b?._count.followedCompanies - a?._count.followedCompanies
    }
  ];

  const getCompaniesFollowingDetails = (role: string) => {
    setIsLoading(true);
    authFetcher(`${getEndpointUrl(ENDPOINTS.getCompaniesFollowingDetails(role))}`).then((result) => {
      if(result.success) {
        if(role == "service_provider") {
          setSpFollowStats(result.data);
        } else {
          setBuyerFollowStats(result.data);
        }
      }
    }).catch((err) => {
      console.log(err);
    }).finally(() => {
      setIsLoading(false);
    });
  }

  const setFollowingCompaniesList = (companies: {
    followedCompany: {
      id: number, 
      name: string, 
    }
  }[]) => {
    const companiesArr: {
      id: number, 
      name: string, 
    }[] = [];
    companies.map((item) => {
      companiesArr.push(item.followedCompany);
    });
    setFollowingListModalHeading("Following Companies");
    setCompaniesList(companiesArr);
    setOpenCompaniesList(true);
  }

  // const setFollowedCompaniesList = (companies: {
  //   followedCompany: {
  //     id: number, 
  //     name: string, 
  //   }
  // }[]) => {
  //   const companiesArr: {
  //     id: number, 
  //     name: string, 
  //   }[] = [];
  //   companies.map((item) => {
  //     companiesArr.push(item.followedCompany);
  //   });
  //   setFollowingListModalHeading("Following Companies");
  //   setCompaniesList(companiesArr);
  //   setOpenCompaniesList(true);
  // }

  useEffect(() => {
    getCompaniesFollowingDetails(userRole);
  }, []);

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
                Following Stats
              </h1>
            </div>
            <div className="grid grid-cols-1 gap-1 lg:grid-cols-1 xl:grid-cols-1 2xl:grid-cols-1 md:grid-cols-1 sm:grid-cols-1 pt-3 pr-1" >
              <div>
                <Select id="adCompanies" value={userRole} onChange={(e) =>{ setUserRole(e.target.value); getCompaniesFollowingDetails(e.target.value); }} >
                  <option value="buyer">Buyer</option>
                  <option value="service_provider">Service Provider</option>
                </Select>
              </div>
            </div>
          </div>
          
            {
              userRole == "buyer" ? 
              <div className="py-6 datatable_style">
                <DataTable
                columns={columnsForBuyerFollowDetails}
                data={buyerFollowStats}
                highlightOnHover={true}
                pagination={true}
                paginationPerPage={10}
                paginationTotalRows={buyerFollowStats.length}
                paginationRowsPerPageOptions={[10, 20, 50, 100, buyerFollowStats.length]}
                paginationComponentOptions={{
                  rowsPerPageText: "Records per page:",
                  rangeSeparatorText: "out of",
                }}
                defaultSortFieldId="followingCount"
              />
              </div>
              :
              <div className="py-6 datatable_style">
              <DataTable
                columns={columnsForSpFollowDetails}
                data={spFollowStats}
                highlightOnHover={true}
                pagination={true}
                paginationPerPage={10}
                paginationTotalRows={spFollowStats.length}
                paginationRowsPerPageOptions={[10, 20, 50, 100, spFollowStats.length]}
                paginationComponentOptions={{
                  rowsPerPageText: "Records per page:",
                  rangeSeparatorText: "out of",
                }}
                defaultSortFieldId="followedCount"
              />
              </div>
            }
            

          <Modal show={ openCompaniesList } size="md" onClose={() => setOpenCompaniesList(false)}>
            <Modal.Header>{ followingListModalHeading }</Modal.Header>
            <Modal.Body>
              <div className="space-y-6 pb-6">
                <ul className="buyer-stat-circle-list space-y-2">
                  {
                    companiesList.sort((a, b) => a?.name.localeCompare(b?.name)).map((item: { id: number, name: string }, index: number) => (
                      <li key={index}>{item.name}</li>
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

export default CompanyFollowingDetails;