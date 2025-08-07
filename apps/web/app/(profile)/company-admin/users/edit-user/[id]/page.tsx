"use client"
import UserForm from "@/components/companyAdmin/users/user-form"
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { authFetcher } from "@/hooks/fetcher";
import { createGroupUser } from "@/types/user.type";
import { redirect, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Breadcrumbs from "@/components/breadcrumb";
import { PATH } from "@/constants/path";
import { useUserContext } from "@/context/store";
import MobileSideMenus from "@/components/mobileSideMenus";

const EditUser = () => {
    const ParamsData = useParams()
    const [formData, setFormData] = useState<createGroupUser>();
    useEffect(() => {
        async function getGroupsList() {
            await authFetcher(`${getEndpointUrl(ENDPOINTS.getCompanyUserById(Number(ParamsData.id)))}`)
                .then((res) => {
                    setFormData(res);
                });
        }
        getGroupsList();
    }, [ParamsData.id])
    const { user } = useUserContext();
    
    if(!user?.isPaidUser) {
        redirect(PATH.HOME.path);
    }

    if(user.isCompanyUser && !user.pagePermissions[4].canWrite) {
        redirect(PATH.NOT_FOUND.path);
    }
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
            label: 'Edit User',
            path: 'Edit User',
        },
    ];
    return (
        <div>
            <div className="pb-6 pt-6 breadcrumbs_s">
                    <Breadcrumbs items={breadcrumbItems} />
            </div>
            <div className="sm:flex sm:items-center sm:justify-between">
                <div className="sm:text-left flex align-middle items-cente">
                    <MobileSideMenus></MobileSideMenus>
                    <h1 className="font-bold  header-font">Edit User</h1>
                </div>
            </div>
            <UserForm isdelete = {true} formData = {formData}></UserForm>
        </div>
    )
}
export default EditUser;