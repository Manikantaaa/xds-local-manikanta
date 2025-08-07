"use client";
import Breadcrumbs from "@/components/breadcrumb";
import UserForm from "@/components/companyAdmin/users/user-form";
import MobileSideMenus from "@/components/mobileSideMenus";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { PATH } from "@/constants/path";
import { useUserContext } from "@/context/store";
import { authFetcher } from "@/hooks/fetcher";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
const CompanyAdminUsers = () => {

    const [userLimit, setUserLimit] = useState<boolean>(false);
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
            label: 'Create User',
            path: 'Create User',
        },
    ];
    const { user } = useUserContext();
    if(!user?.isPaidUser) {
        redirect(PATH.HOME.path);
    }
    useEffect(() => {
        authFetcher(`${getEndpointUrl(ENDPOINTS.findCompanyUsers)}`)
            .then((res) => {
                if(res.userLimit && res.userCount) {
                    if(res.userCount == res.userLimit.companyUsersLimit || res.userCount > res.userLimit.companyUsersLimit){
                        setUserLimit(true);
                    } else {
                        setUserLimit(false);
                    }
                }
            });
    }, [])

    if((user.isCompanyUser && !user.pagePermissions[4].canWrite) || userLimit) {
        redirect(PATH.NOT_FOUND.path);
    }
    
    return (
        <div>
            <div className="pb-6 pt-6 breadcrumbs_s">
                <Breadcrumbs items={breadcrumbItems} />
            </div>
            <div className="sm:flex sm:items-center sm:justify-between">
                <div className="sm:text-left flex align-middle items-cente">
                    <MobileSideMenus></MobileSideMenus>
                    <h1 className="font-bold  header-font">Create User</h1>
                </div>
            </div>
            <UserForm></UserForm>

        </div>
    )
}

export default CompanyAdminUsers;