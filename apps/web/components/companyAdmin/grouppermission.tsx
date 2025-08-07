import Link from "next/link";
import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import DeleteCrossSvg from "../ui/deletecrosssvg";
import EnableRightSVG from "../ui/enablerightsvg";
import { useParams } from "next/navigation";
import { authFetcher } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { groupPermissionListType, onlyPermissionsType } from "@/types/user.type";
import useCommonPostData from "@/hooks/commonPostData";
import { toast } from "react-toastify";
import usePreventBackNavigation from "@/hooks/usePreventBackNavigation";
import Spinner from "../spinner";
import usePagePermissions from "@/hooks/usePagePermissions";
import DisableRightSVG from "../ui/disableRightSVG";
import DisabledDeleteCrossSvg from "../ui/disabledDeletesvg";
const GroupPermissions = (props: {setDataChangePopup:(dataChange: boolean) => void}) => {
    const paramsdata = useParams();
    const [showContent, setShowContent] = useState<number>(0);

    const groupsPermissions = usePagePermissions(17);
    const columns = [
        {
            name: "",
            cell: (row: groupPermissionListType) => (
                <div className="">
                    <span onClick={() => setShowContent((prev) => prev === row.id ? 0 : row.id)}>
                      <b>{row.name}</b>
                      <p className="show_content overflow-hidden">{row.description}</p>
                      {/* <div className="show_content overflow-hidden" >
                        <p>{row.description}</p>
                      </div> */}
                      {/* <svg style={{transform: showContent == row.id ? "rotate(90deg)" : "rotate(0deg)"}} xmlns="http://www.w3.org/2000/svg" className="ml-1" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M11.3535 8.35403L6.35354 13.354C6.30708 13.4005 6.25193 13.4373 6.19124 13.4625C6.13054 13.4876 6.06549 13.5006 5.99979 13.5006C5.93409 13.5006 5.86904 13.4876 5.80834 13.4625C5.74764 13.4373 5.69249 13.4005 5.64604 13.354C5.59958 13.3076 5.56273 13.2524 5.53759 13.1917C5.51245 13.131 5.49951 13.066 5.49951 13.0003C5.49951 12.9346 5.51245 12.8695 5.53759 12.8088C5.56273 12.7481 5.59958 12.693 5.64604 12.6465L10.2929 8.00028L5.64604 3.35403C5.55222 3.26021 5.49951 3.13296 5.49951 3.00028C5.49951 2.8676 5.55222 2.74035 5.64604 2.64653C5.73986 2.55271 5.86711 2.5 5.99979 2.5C6.13247 2.5 6.25972 2.55271 6.35354 2.64653L11.3535 7.64653C11.4 7.69296 11.4369 7.74811 11.4621 7.80881C11.4872 7.86951 11.5002 7.93457 11.5002 8.00028C11.5002 8.06599 11.4872 8.13105 11.4621 8.19175C11.4369 8.25245 11.4 8.30759 11.3535 8.35403Z" fill="#0071C2" />
                      </svg> */}
                    </span>
                    {/* {
                      showContent === row.id &&
                      <div className="show_content overflow-hidden" >
                        <p>{row.name}</p>
                      </div>
                    } */}
                </div>
            ),
        },
        {
            name: "Read",
            cell: (row: groupPermissionListType) => (
                <span>
                    {isEditable ? row.permissions[0].canRead ? <span onClick={() => togglePermission(row.id, "canRead", false)}><EnableRightSVG></EnableRightSVG></span> : <span onClick={() => togglePermission(row.id, "canRead", true)}><DeleteCrossSvg></DeleteCrossSvg></span>
                    : row.permissions[0].canRead ? <DisableRightSVG></DisableRightSVG> : <DisabledDeleteCrossSvg></DisabledDeleteCrossSvg>
                    }
                </span>
            ),
        },
        {
            name: "Edit",
            cell: (row: groupPermissionListType) => (
                <div>
                    { isEditable ? row.permissions[0].canWrite ? <span onClick={() => togglePermission(row.id, "canWrite", false)}><EnableRightSVG></EnableRightSVG></span> : <span onClick={() => togglePermission(row.id, "canWrite", true)}><DeleteCrossSvg></DeleteCrossSvg></span> 
                    : row.permissions[0].canWrite ? <DisableRightSVG></DisableRightSVG> : <DisabledDeleteCrossSvg></DisabledDeleteCrossSvg>
                    }
                </div>
            ),
        },
        {
            name: "Delete",
            cell: (row: groupPermissionListType) => (
                <span>
                    {isEditable ? [12,15].includes(row.id) ? "-" :  row.permissions[0].canDelete ? <span onClick={() => togglePermission(row.id, "canDelete", false)}><EnableRightSVG></EnableRightSVG></span> : <span onClick={() => togglePermission(row.id, "canDelete", true)}><DeleteCrossSvg></DeleteCrossSvg> </span>
                    : [12,15].includes(row.id) ? "-" :  row.permissions[0].canDelete ? <DisableRightSVG></DisableRightSVG> : <DisabledDeleteCrossSvg></DisabledDeleteCrossSvg>
                    } 
                </span>
            ),
        },
    ];

    const [groupPermissionsList, setGroupPermissionList] = useState<groupPermissionListType[]>([]);
    const [originalGroupPermissionsList, setOriginalGroupPermissionList] = useState<groupPermissionListType[]>([]);
    const [isEditable, setIsEditable] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    //
    useEffect(() => {
        if (paramsdata.id) {
            async function getGroupsList() {
                await authFetcher(`${getEndpointUrl(ENDPOINTS.getGroupPermissionsById(Number(paramsdata.id)))}`)
                    .then((res) => {
                        // isLoaderEnabled(false)
                        const OriginalGroup = JSON.parse(JSON.stringify(res));
                        setGroupPermissionList(res);
                        setOriginalGroupPermissionList(OriginalGroup);
                    }).finally(() => {
                        setIsLoading(false)
                    });
            }
            getGroupsList();
        }
    }, []);

    const togglePermission = (pageId: number, action: 'canRead' | 'canWrite' | 'canDelete', setaccess: boolean) => {

        if (!isEditable) {
            return;
        }
        props.setDataChangePopup(true);
        setGroupPermissionList((prevPermissionsList) => {
            return prevPermissionsList.map((page) => {
                if (page.id == pageId) {

                    if((action == "canDelete" || action == "canWrite") && setaccess == true){
                        page.permissions[0].canRead = true;
                    }

                    if(action == "canRead" && setaccess == false){
                        page.permissions[0].canDelete = false;
                        page.permissions[0].canWrite = false;
                    }

                    page.permissions[0][action] = setaccess
                }
                return page
            })
        });
    };

    const { error, success, submitForm } = useCommonPostData<onlyPermissionsType[]>({
        url: getEndpointUrl(ENDPOINTS.saveGroupPermissions(Number(paramsdata.id))),
    });
    const savePermissions = () => {

        const newData = JSON.parse(JSON.stringify(groupPermissionsList));
        setOriginalGroupPermissionList(newData);
        setIsEditable(false);

        //
        const onlyPermissions: onlyPermissionsType[] = groupPermissionsList.map((page) => page.permissions[0])
        submitForm(onlyPermissions).then(() => {
            props.setDataChangePopup(false);
            toast.success("Permissions Modified 👍")
        }).catch((error) => {
            console.log(error);
            toast.success("something went wrong, please try again later")
        });
    }
    


    const handleCancel = () => {
        setIsEditable(false);
        const newData = JSON.parse(JSON.stringify(originalGroupPermissionsList));
        setGroupPermissionList(newData)
    }
    return (
        <div className="py-6 relative">
            <div className="text-end pb-6">
                {((!groupsPermissions.isCompanyUser) || (groupsPermissions.isCompanyUser && groupsPermissions.canWrite)) ?
                
                !isEditable ? <button className="addtotour text-sm font-medium inline-flex items-center justify-center gap-1.5 rounded-sm border-0 border-gray-200 px-3 py-1 link_color transition hover:bg-gray-0 hover:text-blue-400 focus:outline-none" type="button" onClick={() => setIsEditable(true)}><span>Edit Permissions</span></button>
                    :
                    <>
                        <button className="link_color mr-4 text-sm font-medium " onClick={handleCancel}>Cancel</button>
                        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 w-[7rem] disabled:bg-gray-150/20 shadow-none disabled:text-[#A2ABBA] disabled:opacity-100" onClick={savePermissions}> Save</button>
                    </>
                    :
                    ""
                }
            </div>
            <div className="permissions_detatable">
                <DataTable
                    columns={columns}
                    data={groupPermissionsList}
                    highlightOnHover={true}
                    paginationPerPage={10}
                    progressPending = {isLoading}
                    progressComponent = {<Spinner></Spinner>}
                />
            </div>
        </div>
    )
}

export default GroupPermissions;