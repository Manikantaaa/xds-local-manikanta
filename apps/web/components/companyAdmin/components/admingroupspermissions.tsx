import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { authFetcher } from "@/hooks/fetcher";
import { groupPermissionListType } from "@/types/user.type";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DataTable from "react-data-table-component";
import Spinner from "@/components/spinner";
import EnableRightSVG from "@/components/ui/enablerightsvg";
import DeleteCrossSvg from "@/components/ui/deletecrosssvg";
import { AdminGroupsType } from "@/types/companies.type";
import { Label, Radio } from "flowbite-react";
const CompanyAdminPermissions = () => {

    const paramsdata = useParams()
    const [compnayPermissionsList, setCompnayPermissionsList] = useState<groupPermissionListType[]>([]);
    const [compnayGroupsList, setCompnayGroupsList] = useState<AdminGroupsType[]>([]);
    const [loaderEnabled, isLoaderEnabled] = useState<boolean>(true);
    const [showContent, setShowContent] = useState<number>(0);
    const [selectedGroupID, setSelectedGroupID] = useState<number>(0);
    useEffect(() => {
        async function getGroupsPermissionsList() {
            await authFetcher(`${getEndpointUrl(ENDPOINTS.getGroupPermissionsById(Number(selectedGroupID)))}`)
                .then((res: groupPermissionListType[]) => {
                    setCompnayPermissionsList(res);
                });
        }

        getGroupsPermissionsList().finally(() => { isLoaderEnabled(false); });
    }, [selectedGroupID])

    useEffect(() => {
        async function getGroupsList() {
            await authFetcher(`${getEndpointUrl(ENDPOINTS.findCompanyAdminGroups(Number(paramsdata.companyId)))}`)
                .then((res: AdminGroupsType[]) => {
                    setSelectedGroupID(res[0].id)
                    setCompnayGroupsList(res);
                });
        }
        getGroupsList();
    }, [paramsdata]);
    const columns = [
        {
            name: "Object",
            cell: (row: groupPermissionListType) => (
                <div className="text-blue-300 cursor-pointer">
                    <span onClick={() => setShowContent((prev) => prev === row.id ? 0 : row.id)}>
                        {row.name}
                        <svg style={{ transform: showContent == row.id ? "rotate(90deg)" : "rotate(0deg)" }} xmlns="http://www.w3.org/2000/svg" className="ml-1" width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M11.3535 8.35403L6.35354 13.354C6.30708 13.4005 6.25193 13.4373 6.19124 13.4625C6.13054 13.4876 6.06549 13.5006 5.99979 13.5006C5.93409 13.5006 5.86904 13.4876 5.80834 13.4625C5.74764 13.4373 5.69249 13.4005 5.64604 13.354C5.59958 13.3076 5.56273 13.2524 5.53759 13.1917C5.51245 13.131 5.49951 13.066 5.49951 13.0003C5.49951 12.9346 5.51245 12.8695 5.53759 12.8088C5.56273 12.7481 5.59958 12.693 5.64604 12.6465L10.2929 8.00028L5.64604 3.35403C5.55222 3.26021 5.49951 3.13296 5.49951 3.00028C5.49951 2.8676 5.55222 2.74035 5.64604 2.64653C5.73986 2.55271 5.86711 2.5 5.99979 2.5C6.13247 2.5 6.25972 2.55271 6.35354 2.64653L11.3535 7.64653C11.4 7.69296 11.4369 7.74811 11.4621 7.80881C11.4872 7.86951 11.5002 7.93457 11.5002 8.00028C11.5002 8.06599 11.4872 8.13105 11.4621 8.19175C11.4369 8.25245 11.4 8.30759 11.3535 8.35403Z" fill="#0071C2" />
                        </svg>
                    </span>
                    {
                        showContent === row.id &&
                        <div className="show_content overflow-hidden" >
                            <p>{row.name}</p>
                        </div>
                    }
                </div>
            ),
        },
        {
            name: "Read",
            cell: (row: groupPermissionListType) => (
                <span>
                    {row.permissions[0].canRead ? <EnableRightSVG></EnableRightSVG> : <DeleteCrossSvg></DeleteCrossSvg>}
                </span>
            ),
        },
        {
            name: "Edit",
            cell: (row: groupPermissionListType) => (
                <div>
                    {row.permissions[0].canWrite ? <EnableRightSVG></EnableRightSVG> : <DeleteCrossSvg></DeleteCrossSvg>}
                </div>
            ),
        },
        {
            name: "Delete",
            cell: (row: groupPermissionListType) => (
                <span>

                    {row.permissions[0].canDelete ? <EnableRightSVG></EnableRightSVG> : <DeleteCrossSvg></DeleteCrossSvg>}
                </span>
            ),
        },
    ];

    const handleGroupPermissions = (groupId: number) => {
        setSelectedGroupID(groupId);
    }
    console.log(selectedGroupID)
    return (
        <div className="pt-6">
            <fieldset className="flex max-w-md flex-col gap-4">
                <legend className="mb-4">Groups</legend>
                {compnayGroupsList.map((group) =>
                    <div className="flex items-center gap-2">
                        <Radio checked={selectedGroupID == group.id} id={group.name + "_" + group.id} name="countries" onClick={() => handleGroupPermissions(group.id)} value={`${group.id}`} defaultChecked />
                        <Label htmlFor={group.name + "_" + group.id}>{group.name}</Label>
                    </div>
                )}
            </fieldset>
            <div className="companies_table companyadminuser pt-6">
                <DataTable
                    columns={columns}
                    data={compnayPermissionsList}
                    highlightOnHover={true}
                    progressPending={loaderEnabled}
                    progressComponent={<Spinner></Spinner>}
                />
            </div>
        </div>
    )
}

export default CompanyAdminPermissions;