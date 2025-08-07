import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { authFetcher } from "@/hooks/fetcher";
import { createGroupUser } from "@/types/user.type";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DataTable from "react-data-table-component";
import { formatDate } from "@/services/common-methods";
import Spinner from "@/components/spinner";
import { AdminGroupsType } from "@/types/companies.type";
const CompanyAdminGroups = () => {

    const paramsdata = useParams()
    const [compnayGroupsList, setCompnayGroupsList] = useState<AdminGroupsType[]>([]);
    const [loaderEnabled, isLoaderEnabled] = useState<boolean>(true);
    useEffect(() => {
        if (paramsdata.companyId) {
            async function getGroupsList() {
                await authFetcher(`${getEndpointUrl(ENDPOINTS.findCompanyAdminGroups(Number(paramsdata.companyId)))}`)
                    .then((res: AdminGroupsType[]) => {
                        isLoaderEnabled(false);
                        setCompnayGroupsList(res);
                    });
            }
            getGroupsList();
        }
    }, [paramsdata])
    
     const columns = [
        {
            name: "Group",
            selector: (row: AdminGroupsType) => row.name,
            cell: (row: AdminGroupsType) => (
                 row?.name
            ),
            sortable: true,
        },
        {
            name: "Users",
            selector: (row: AdminGroupsType) => row._count.companyadminuser,
            cell: (row: AdminGroupsType) => (
                row._count.companyadminuser
            ),
            sortable: true,
        },


        
    ];
    return (
        <div className="companies_table companyadminuser pt-6">
        <DataTable
                    columns={columns}
                    data={compnayGroupsList}
                    highlightOnHover={true}
                    progressPending={loaderEnabled}
                    progressComponent={<Spinner></Spinner>}
                />
        </div>
    )
}

export default CompanyAdminGroups;