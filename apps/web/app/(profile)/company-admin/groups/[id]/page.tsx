"use client";
import Breadcrumbs from "@/components/breadcrumb";
import { PATH } from "@/constants/path";
import { useEffect, useState } from "react";
import "../../../../../public/css/detatable.css";
import { redirect, useRouter } from "next/navigation";
import GroupUsers from "@/components/companyAdmin/groupusers";
import GroupPermissions from "@/components/companyAdmin/grouppermission";
import { useUserContext } from "@/context/store";
import { authFetcher } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import MobileSideMenus from "@/components/mobileSideMenus";


const CompanyAdminUsers = (params: { params: { id: number } }) => {

    const { user } = useUserContext();
    if (!user?.isPaidUser) {
        redirect(PATH.HOME.path);
    }
    if(user.isCompanyUser && !user.pagePermissions[5].canRead) {
        redirect(PATH.NOT_FOUND.path);
    }
    const [TabNumber, setTabNumber] = useState<number>(0);
    const [groupName, setGroupName] = useState<string>("Groups");
    const [dataChangePopup, setDataChangePopup] = useState<boolean>(false);
    const breadcrumbItems = [
        {
            label: PATH.HOME.name,
            path: PATH.HOME.path,
        },
        {
            label: PATH.COMPANY_USERS.name,
            path: PATH.COMPANY_USERS.path,
        },
        {
            label: PATH.COMPANY_GROUPS.name,
            path: PATH.COMPANY_GROUPS.path,
        },
        {
            label: groupName,
            path: groupName,
        },
    ];
    useEffect(() => {
        async function getGroupsList() {
            await authFetcher(`${getEndpointUrl(ENDPOINTS.getGroupNameById(Number(params.params.id)))}`)
                .then((res :{name: string}) => {
                    if(res.name) {
                        setGroupName(res.name);
                        setTabNumber(40);
                    }
                });
        }
        getGroupsList();
    }, []);

    const checkPermissionUpdate = () => {
        if(dataChangePopup) {
            const isConfirmed = confirm("Your changes will not be saved. Select Cancel, then select Save before progressing.");
            if(isConfirmed){
                setDataChangePopup(false);
                setTabNumber(40);
              }
        } else {
            setTabNumber(40); 
        }
    }
    return (
        <div>
            <div className="pb-6 pt-6 breadcrumbs_s breadcrumbs_group">
                <Breadcrumbs items={breadcrumbItems} />
            </div>
            <div className="sm:flex sm:items-center sm:justify-between">
                <div className="sm:text-left flex align-middle items-cente">
                    <MobileSideMenus></MobileSideMenus>
                    <h1 className="font-bold  header-font">{groupName}</h1>
                </div>
            </div>
            <div className="relative border-b border-gray-200">
                <nav className="-mb-px flex gap-6 pt-6" aria-label="Tabs">
                    <button
                        onClick={checkPermissionUpdate}
                        className={`shrink-0 border-b-2 px-1 pb-2 font-bold text-sm  ${TabNumber == 40
                            ? "shrink-0 border-b-2 px-1  text-sky-600  border-sky-500 "
                            : "border-transparent default_text_color hover:border-gray-300 hover:text-gray-700"
                            }`}
                    >
                        Users
                    </button>
                    <button
                        onClick={() => {
                            setTabNumber(42);
                        }}
                        className={`shrink-0 border-b-2 px-1 pb-2 font-bold text-sm   ${TabNumber == 42
                            ? "shrink-0 border-b-2 px-1  text-sky-600  border-sky-500 "
                            : "border-transparent default_text_color hover:border-gray-300 hover:text-gray-700"
                            }`}
                    >
                        Permissions
                    </button>
                </nav>
            </div>
            <div className="our_work_tab_content">
                {TabNumber == 40 ? (
                    <GroupUsers groupName = {groupName}></GroupUsers>
                ) : TabNumber == 42 ? (
                    <GroupPermissions setDataChangePopup = { (val: boolean) => setDataChangePopup(val)}></GroupPermissions>
                ) : (
                    ""
                )}
            </div>

        </div>
    )
}

export default CompanyAdminUsers;