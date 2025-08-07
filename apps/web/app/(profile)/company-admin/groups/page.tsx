"use client";
import Breadcrumbs from "@/components/breadcrumb";
import { PATH } from "@/constants/path";
import Link from "next/link";
import DataTable from "react-data-table-component";
import { useEffect, useState } from "react";
import "../../../../public/css/detatable.css";
import { authFetcher } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { AdminGroupsType } from "@/types/companies.type";
import Spinner from "@/components/spinner";
import { useUserContext } from "@/context/store";
import { redirect } from "next/navigation";
import MobileSideMenus from "@/components/mobileSideMenus";

const CompanyAdminUsers = () => {

    const { user } = useUserContext();
    if(!user?.isPaidUser) {
        redirect(PATH.HOME.path);
    }

    if(user.isCompanyUser && !user.pagePermissions[5].canRead) {
        redirect(PATH.NOT_FOUND.path);
    }

    const [groupsList, setGroupsList] = useState<AdminGroupsType[]>([]);
    const [isDataFetched, setIsDataFetched] = useState<boolean>(false)
    useEffect(() => {
        async function getGroupsList() {
            await authFetcher(`${getEndpointUrl(ENDPOINTS.getGroupsList)}`)
            .then((res) => {
                setIsDataFetched(true)
                setGroupsList(res);
            });
        }
        getGroupsList();
    },[])
    const tableHeaderstyle = {
        headCells: {
            style: {
                fontWeight: "bold",
                fontSize: "14px",
                backgroundColor: "#F1F4FA",
            },
        },
    };
 
    const columns = [
        {
            name: "Groups",
            cell: (row: AdminGroupsType) => (
                <div className="text-blue-300">
                    <Link prefetch={false} href= {`/company-admin/groups/${row.id}`}>
                        {row.name}
                    </Link>
                </div>
            ),
            sortable: true,
            sortFunction: (a: AdminGroupsType, b: AdminGroupsType) => a.name.localeCompare(b.name),
        },
        {
            name: "Users",
            cell: (row: AdminGroupsType) => (
                <div className="">
                    {/* {JSON.stringify(row._count.companyadminuser)} */}
                        {row.name == "Admin" ? row._count.companyadminuser+1 : row._count.companyadminuser}
                        
                </div>
            ),
            // sortable: true,
        },       
    ];
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
            label: 'Groups',
            path: 'Groups',
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
                    <h1 className="font-bold  header-font">Groups</h1>
                </div>
            </div>
            <div className="py-6 relative">
                {/* <div className="text-end">
                    <button className="addtotour text-sm font-medium inline-flex items-center justify-center gap-1.5 rounded-sm border-0 border-gray-200 px-3 py-1 link_color transition hover:bg-gray-0 hover:text-blue-400 focus:outline-none" type="button" ><span>+ New Group</span></button></div> */}
                <div className="groups_detatable">
                    <DataTable
                        customStyles={tableHeaderstyle}
                        columns={columns}
                        data={groupsList}
                        highlightOnHover={true}
                        progressComponent = {<Spinner></Spinner>}
                        progressPending = {!isDataFetched}
                        //pagination={true}
                        paginationPerPage={10} 
                    />
                </div>
            </div>           
           
        </div>
    )
}

export default CompanyAdminUsers;