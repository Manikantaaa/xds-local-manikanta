"use client";
import Breadcrumbs from "@/components/breadcrumb";
import { PATH } from "@/constants/path";
import Link from "next/link";
import DataTable from "react-data-table-component";
import { useEffect, useState } from "react";
import "../../../../public/css/detatable.css";
import { Label, TextInput, Checkbox } from "flowbite-react";

const CompanyAdminUsers = () => {
    const [mylists, setTopViewedReports] = useState<any[]>([
        { user: "Allan Jones" },
        { user: "Brian Clare" },
        { user: "Charles Lee" },
        { user: "Derek Hemmes" },
        { user: "Evan Chung" },
        { user: "Hal Tully" },
        { user: "Imogen Healy" },
        { user: "Jennifer Jones" },
    ]);
    const tableHeaderstyle = {
        headCells: {
            style: {
                fontWeight: "bold",
                fontSize: "14px",
                backgroundColor: "#F1F4FA",
            },
        },
    };
    const [totalCount, setTotalCount] = useState(0);
    const columns = [
        {
            name: "User",
            cell: (row: any) => (
                <div className="text-blue-300">
                    <Link prefetch={false} href="#">
                        {row.user}
                    </Link>
                </div>
            ),
            sortable: true,
        },
        
        {
            name: "Actions",
            cell: (row: any) => (
                <div className="text-blue-300 space-x-6">
                    <Link prefetch={false} href="#" target="_blank">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M11.4 0C11.6349 0 11.8603 0.098875 12.0223 0.273L14.7651 3.2725C14.916 3.43525 15 3.65138 15 3.87538V13.125C15 13.608 14.616 14 14.1429 14H3.85714C3.384 14 3 13.608 3 13.125V0.875C3 0.392 3.384 0 3.85714 0H11.4ZM14 4H11.4C11.1792 4 11 3.8208 11 3.6V1H4V13H14V4Z" fill="#0071C2" />
                            <path d="M3 1H2C1.44772 1 1 1.44772 1 2V15C1 15.5523 1.44772 16 2 16H12C12.5523 16 13 15.5523 13 15V14H12V15H2V2H3V1Z" fill="#0071C2" />
                        </svg>
                    </Link>
                    <Link prefetch={false} href="#" target="_blank">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M11 3H16V4H0V3H5V1C5 0.448 5.448 0 6 0H10C10.552 0 11 0.448 11 1V3ZM3.944 11H7V12H4.1L4.492 14.519C4.534 14.788 4.746 14.977 4.985 14.977H11.015C11.254 14.977 11.466 14.788 11.508 14.519L13.006 4.943H14L12.496 14.673C12.38 15.42 11.756 15.977 11.015 15.977H4.985C4.244 15.977 3.62 15.42 3.504 14.673L1.993 4.943H9V5.95H3.157L3.476 8H8V9H3.632L3.944 11ZM6 3H10V1H6V3Z" fill="#BD271E" />
                        </svg>
                    </Link>
                    <Link prefetch={false} href="#" target="_blank">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M0 6H4V10H0V6ZM1 7V9H3V7H1ZM6 6H10V10H6V6ZM7 7V9H9V7H7ZM12 6H16V10H12V6ZM13 9H15V7H13V9Z" fill="#69707D" />
                        </svg>
                    </Link>
                </div>
            ),
            //sortable: true,

        },
    ];
    const breadcrumbItems = [
        {
            label: PATH.HOME.name,
            path: PATH.HOME.path,
        },
        {
            label: PATH.MY_PROFILE.name,
            path: PATH.MY_PROFILE.path,
        },
        // {
        //     label: PATH.COMPANY_ADMIN.USERS.name,
        //     path: PATH.COMPANY_ADMIN.USERS.path,
        // },
    ];

    return (
        <div>
            <div className="pb-6 pt-6 breadcrumbs_s">
                <Breadcrumbs items={breadcrumbItems} />
            </div>
            <div className="sm:flex sm:items-center sm:justify-between">
                <div className="sm:text-left flex align-middle items-cente">
                    {/* <MobileSideMenus></MobileSideMenus> */}
                    <h1 className="font-bold  header-font">Procurement</h1>
                </div>
            </div>
            <div className="py-6 relative">
                <div className="text-end">
                    <button className="addtotour text-sm font-medium inline-flex items-center justify-center gap-1.5 rounded-sm border-0 border-gray-200 px-3 py-1 link_color transition hover:bg-gray-0 hover:text-blue-400 focus:outline-none" type="button" ><span>+ Add User</span></button></div>
                <div className="groups_detatable">
                    <DataTable
                        customStyles={tableHeaderstyle}
                        columns={columns}
                        data={mylists}
                        highlightOnHover={true}
                        pagination={true}
                        paginationPerPage={10} 
                        paginationComponentOptions={{
                            rowsPerPageText: "Records per page:",
                            rangeSeparatorText: "out of",
                        }}
                    />
                </div>
            </div>

        </div>
    )
}

export default CompanyAdminUsers;