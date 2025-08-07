"use client";
import Breadcrumbs from "@/components/breadcrumb";
import { PATH } from "@/constants/path";
import DataTable from "react-data-table-component";
import { useEffect, useState } from "react";
import "../../../../public/css/detatable.css";
import { useRouter } from "next/navigation";
import { authFetcher } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { createGroupUser } from "@/types/user.type";
import Spinner from "@/components/spinner";
import { Input } from "@/components/ui/input";
import { useUserContext } from "@/context/store";
import { redirect } from "next/navigation";
import { Button, Modal, Tooltip } from "flowbite-react";
import usePagePermissions from "@/hooks/usePagePermissions";
import Link from "next/link";
import MobileSideMenus from "@/components/mobileSideMenus";
const CompanyAdminUsers = () => {
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
            label: "Users",
            path: "Users",
        },
    ];
    const { user } = useUserContext();
    if (!user?.isPaidUser) {
        redirect(PATH.HOME.path);
    }
    const [enableLoader, setEnableLoader] = useState<boolean>(false);
    const usersPermissions = usePagePermissions(16);
    const groupPermissions = usePagePermissions(17);
    const router = useRouter()
    const [comanypUserList, setComanypUserList] = useState<createGroupUser[]>([]);
    const [currentfilterList, setCurrentFilterList] = useState<createGroupUser[]>([]);
    const [newUserDisable, setNewUserDisable] = useState<boolean>(false);
    // const [permissionsPopup, setPermissionsPopup] = useState<boolean>(false);

    if(user.isCompanyUser && !user.pagePermissions[4].canRead) {
        redirect(PATH.NOT_FOUND.path);
    }
    
    const columns = [
        {
            name: "Users",
            selector: (row: createGroupUser) => row.firstName,
            cell: (row: createGroupUser) => (
                <div className={`${row.groupId == "0" ? '' : user?.isCompanyUser && !usersPermissions.canWrite ? '' : 'text-blue-300 cursor-pointer'}`} onClick={() => { row.groupId == "0" ? '' : user?.isCompanyUser && !usersPermissions.canWrite ? '' : router.push(PATH.EDIT_USER.path + '/' + row.id) }}>

                    {`${row.firstName} ${row.LastName}`}

                </div>
            ),
            sortable: true,
           // sortFunction: (a: createGroupUser, b: createGroupUser) => a.firstName.localeCompare(b.firstName),
        },
        {
            name: "Email",
            selector: (row: createGroupUser) => row.email,
            cell: (row: createGroupUser) => (
                <div className="text-blue-300">
 
                    <Link
                  prefetch={false}
                    href={`mailto:${row.email}`}
                    className="text-blue-300"
                    target="_blank"
                  > {`${" " + row.email}`}
                  </Link>

                </div>
            ),
            sortable: true,
           // sortFunction: (a: createGroupUser, b: createGroupUser) => a.email.localeCompare(b.email),
        },
        {
            name: "Team/Studio",
            selector: (row: createGroupUser) => row.teamandstudio,
            cell: (row: createGroupUser) => (
                <div>

                    {row.teamandstudio != "" ? row.teamandstudio : "-"}

                </div>
            ),
            sortable: true,
          //  sortFunction: (a: createGroupUser, b: createGroupUser) => a.teamandstudio.localeCompare(b.teamandstudio),
        },
        {
            name: "Groups",
            selector: (row: createGroupUser) => row.groups?.name || "",
            cell: (row: createGroupUser) => (
                <div className={`${row.groupId != "0" && ((!groupPermissions.isCompanyUser) || (groupPermissions.isCompanyUser && groupPermissions.canRead)) && 'text-blue-300 cursor-pointer'}`} onClick={() => {row.groupId != "0" && ((!groupPermissions.isCompanyUser) || (groupPermissions.isCompanyUser && groupPermissions.canRead)) && router.push(PATH.COMPANY_GROUPS.path + '/' + row.groupId) }}>
                    {row.groups && row.id === user.CompanyAdminId ? row.groups?.name+" (You)" : row.groups?.name}
                </div>
            ),
            sortable: true,
           // sortFunction: () => "A".localeCompare("Z"),

        },
    ];
    useEffect(() => {
        async function getCompanyUserList() {
            await authFetcher(`${getEndpointUrl(ENDPOINTS.findCompanyUsers)}`)
                .then((res) => {
                    setEnableLoader(true)
                    if (res) {
                        const newUser = {
                            firstName: user?.firstName,
                            LastName: user?.lastName,
                            email: user?.email,
                            id: 0,
                            teamandstudio: "",
                            groupId: 0,
                            groups: {
                              name: "Company Admin",
                            },
                          };
                        const updatedRes = [newUser, ...res.data];
                        setComanypUserList(updatedRes);
                        setCurrentFilterList(updatedRes);
                        if (res.data.length && res.data.length > res.data[0].companies.user.companyUsersLimit-1) {
                            setNewUserDisable(true);
                        } else {
                            setNewUserDisable(false);
                        }
                    }
                });
        }
        getCompanyUserList();
    }, [])

    const filterData = (searchString: string) => {
        if (searchString) {
            const filteredList = comanypUserList.filter(
                (user) =>
                    user.firstName.toLowerCase().includes(searchString.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchString.toLowerCase()) ||
                    user.LastName.toLowerCase().includes(searchString.toLowerCase())
            );
            setCurrentFilterList(filteredList);
        } else {
            setCurrentFilterList(comanypUserList);
        }
    };

    // const checkPermissions = async() => {
    //     const permissions = await authFetcher(`${getEndpointUrl(ENDPOINTS.checkPermissions(user.companyId))}`);
    //     if (permissions) {
    //         setPermissionsPopup(true);
    //     } else {
    //         router.push(PATH.CREATE_USER.path)
    //     }
    // }
    return (
        <div>
            <div className="pb-6 pt-6 breadcrumbs_s">
                <Breadcrumbs items={breadcrumbItems} />
            </div>
            <div className="sm:flex sm:items-center sm:justify-between">
                <div className="sm:text-left flex align-middle items-cente">
                    <MobileSideMenus></MobileSideMenus>
                    <h1 className="font-bold  header-font">Users</h1>
                </div>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-1 lg:gap-8 pt-6">
                <form className="flex items-start serviceprovidersearch">
                    <label htmlFor="voice-search" className="sr-only">Search</label><div className="relative lg:w-full w-[240px]">
                        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                            <svg className="w-4 h-4 top-[3px]" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g id="â&nbsp;ï¸ Icon / Color"><path id="Union" d="M8.45324 8.98349L11.3571 11.8881C11.4306 11.9608 11.5266 11.9976 11.6226 11.9976C11.7186 11.9976 11.8146 11.9608 11.8881 11.8881C12.0343 11.7411 12.0343 11.5041 11.8881 11.3571L9.21461 8.6843C11.0001 6.6243 10.9145 3.49228 8.95782 1.53506C6.91083 -0.511688 3.58017 -0.511688 1.53468 1.53506C-0.511559 3.58181 -0.511559 6.91331 1.53468 8.96006C2.52668 9.95156 3.84485 10.4976 5.24625 10.4976C5.4532 10.4976 5.62116 10.3296 5.62116 10.1226C5.62116 9.91556 5.4532 9.74756 5.24625 9.74756C4.0443 9.74756 2.91508 9.27956 2.0648 8.42981C0.310985 6.67481 0.310985 3.82031 2.0648 2.06531C3.81786 0.310313 6.67164 0.311063 8.4277 2.06531C10.1815 3.82031 10.1815 6.67481 8.4277 8.42981C8.28149 8.57606 8.28149 8.81381 8.4277 8.96006C8.43594 8.96834 8.44446 8.97615 8.45324 8.98349Z" fill="#343741"></path></g></svg></div>
                        <Input autoComplete="off" onChange={(e) => filterData(e.target.value)} id="input-search" className="bg-gray-50 border border-gray-300 default_text_color text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 ps-10" placeholder="Search..." type="search" /></div>
                </form>
            </div>
            <div className="py-6 relative">
                <div className="text-end pb-6">
                    {((!usersPermissions.isCompanyUser) || (usersPermissions.isCompanyUser && usersPermissions.canWrite)) &&
                        <button className={`addtotour text-sm font-medium ${newUserDisable ? 'text-gray-400 hover:text-gray-400' : 'link_color'} inline-flex items-center justify-center gap-1.5 rounded-sm border-0 border-gray-200 px-3 py-1 transition hover:bg-gray-0  focus:outline-none`}>
                            {newUserDisable ?
                                < Tooltip className="tier_tooltip" content={<div className="space-y-2"><p>You have reached the maximum number of licenses for your account. If you require more licenses, contact <Link className="underline" href={"mailto:info@xds-spark.com?subject=XDS Spark - Account Administration"} target="_blank">info@xds-spark.com.</Link></p></div>}>
                                    <span className="relative"><Link href={"mailto:info@xds-spark.com?subject=XDS Spark - Account Administration"} target="_blank"> + New User <img src="/mark.png" width={16} height={16} className="absolute inline py-1 pl-1"/> </Link></span>
                                </Tooltip>
                                :
                                <span onClick={() => !newUserDisable && router.push(PATH.CREATE_USER.path)}>+ New User</span>
                            }
                        </button>
                    }
                </div>
                <div className="datatable_style">
                    <DataTable
                        columns={columns}
                        data={currentfilterList}
                        highlightOnHover={true}
                        progressPending={!enableLoader}
                        progressComponent={<Spinner></Spinner>}
                        // pagination={true}
                        // paginationTotalRows={comanypUserList.length}
                        // paginationPerPage={10}

                    />
                </div>
            </div>
            {/* <Modal show={permissionsPopup} size="md" onClose={() => setPermissionsPopup(false)} popup className="">
                <Modal.Header className="modal_header">
                    <b className="pl-4">Set Permissions</b>
                </Modal.Header>
                <Modal.Body >
                    <div className="text-left">
                        <p className="mt-6 text-sm">Prior adding a new user please set permissions to all the available groups</p>

                    </div>
                </Modal.Body>
                <Modal.Footer className="modal_footer">
                    <Button className="h-[40px] button_blue" onClick={() => router.push(PATH.COMPANY_GROUPS.path)} > Set Permissions </Button>
                </Modal.Footer>
            </Modal> */}
        </div >
        
    )
}

export default CompanyAdminUsers;