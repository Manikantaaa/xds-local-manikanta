import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { authFetcher, authPut, authPutWithData } from "@/hooks/fetcher";
import { createGroupUser } from "@/types/user.type";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DataTable from "react-data-table-component";
import { formatDate } from "@/services/common-methods";
import Spinner from "@/components/spinner";
import Link from "next/link";
import { Label, TextInput } from "flowbite-react";
const CompanyAdminUsers = () => {

    const paramsdata = useParams()
    const [compnayUserList, setCompnayUserList] = useState<createGroupUser[]>([]);
    const [loaderEnabled, isLoaderEnabled] = useState<boolean>(true);
    const [enableUserLimit, setEnableUserLimit] = useState<boolean>(false);
    const [userLimit, setUserLimit] = useState<string>("");
    const [userId, setUserId] = useState<number>(0);
    const [validateLimit, setValidateLimit] = useState<boolean>(false);
    useEffect(() => {
        if (paramsdata.companyId) {
            async function getGroupsList() {
                await authFetcher(`${getEndpointUrl(ENDPOINTS.findCompanyAdminUsers(Number(paramsdata.companyId)))}`)
                    .then((res: { data: createGroupUser[], userLimit : {id: number, firstName: string, lastName: string, email: string, createdAt: Date, companyUsersLimit:number, } }) => {
                        isLoaderEnabled(false);
                        const newUser = {
                            firstName: res.userLimit.firstName,
                            id: 0,
                            LastName: res.userLimit.lastName,
                            teamandstudio: "",
                            email: res.userLimit.email,
                            groupId: "0",
                            groups: {
                                name: "Company Admin",
                            },
                            createdAt: res.userLimit.createdAt,
                            
                          };
                        const updatedRes = [newUser, ...res.data];
                        setCompnayUserList(updatedRes);
                        if(res.userLimit) {
                            setUserLimit(res.userLimit.companyUsersLimit.toString());
                            setUserId(res.userLimit.id);
                        }
                    });
            }
            getGroupsList();
        }
    }, [paramsdata])

    const columns = [
        {
            name: "Date Created",
            selector: (row: createGroupUser) => row.createdAt?.toString() || "",
            cell: (row: createGroupUser) => (
                (row.createdAt) ? formatDate(row.createdAt) : ""
            ),
            sortable: true,
        },
        {
            name: "Name",
            selector: (row: createGroupUser) => row.firstName + row.LastName,
            cell: (row: createGroupUser) => (
                row.id == 0 ? <span>{row.firstName + row.LastName} </span> 
                :
                <Link href={`/admin/invitees/${row.id}`} className="text-blue-300 cursor-pointer">
                    {row.firstName + row.LastName}
                </Link>
            ),
            sortable: true,
        },
        {
            name: "Email",
            selector: (row: createGroupUser) => row.email,
            cell: (row: createGroupUser) => (
                row.email
            ),
            sortable: true,
        },
        {
            name: "Group",
            selector: (row: createGroupUser) => row.groups ? row.groups?.name : "",
            cell: (row: createGroupUser) => (
                row.groups?.name
            ),
            sortable: true,
        },
        {
            name: "Created By",
            selector: (row: createGroupUser) => row.companies?.user.firstName + " " + row.companies?.user.lastName,
            cell: (row: createGroupUser) => (
                (row.id == 0 ? '-' : (row.companies?.user.userRoles[0].roleCode === "admin") ? row.companies?.user.firstName + " " + row.companies?.user.lastName : <Link href={`/admin/users/${row.companies?.user.id}`} className="text-blue-300 cursor-pointer">
                    {row.companies?.user.firstName && row.companies?.user.firstName + " " + row.companies?.user.lastName}
                </Link>)
            ),
            sortable: true,
        },

    ];

    const updatingUserLimit = async() => {
        setValidateLimit(false);
        if(Number(userLimit) > 200) {
            setValidateLimit(true);
            return;
        }else {
            setValidateLimit(false);
        }
        const postData = {
            userLimit: Number(userLimit),
        }
        await authPutWithData(`${getEndpointUrl(ENDPOINTS.updateUsersLimit(userId))}`, postData).then(()=>{ setEnableUserLimit(false);}).catch((err) => {
            setValidateLimit(true);
            console.log(err);
          });
    }
    return (
        <div className="companies_table companyadminuser pt-6">
            {!enableUserLimit ? 
                <div className="text-sm"><b>User Limit: {userLimit}
                </b>
                <button className="text-blue-300 ml-1" onClick={() =>{setEnableUserLimit(!enableUserLimit); setValidateLimit(false);}}>
                {" "}
                <svg className="w-3.5 h-3.5 me-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path d="m13.835 7.578-.005.007-7.137 7.137 2.139 2.138 7.143-7.142-2.14-2.14Zm-10.696 3.59 2.139 2.14 7.138-7.137.007-.005-2.141-2.141-7.143 7.143Zm1.433 4.261L2 12.852.051 18.684a1 1 0 0 0 1.265 1.264L7.147 18l-2.575-2.571Zm14.249-14.25a4.03 4.03 0 0 0-5.693 0L11.7 2.611 17.389 8.3l1.432-1.432a4.029 4.029 0 0 0 0-5.689Z"></path></svg>
            </button></div>
            :
                <div className="user_limt p-4">
                    <div>
                        <div className="mb-2 block">
                            <Label
                                htmlFor="founder-name"
                                value="User Limit"
                                className="font-bold text-sm"
                            />
                        </div>
                        <TextInput
                            autoComplete="off"
                            id="duration"
                            className="focus:border-blue-300 w-[240px]"
                            type="number"
                            value={userLimit}
                            min="1"
                            max={200}
                            onChange={(e) => setUserLimit(e.target.value)}
                        />
                        {validateLimit &&
                            <div className="text-red-500 text-xs pt-1">Maximum limit 200</div>
                        }
                        <div className="text-end pt-4">
                        <button className="link_color mr-4 text-sm font-medium" onClick={() =>setEnableUserLimit(!enableUserLimit)}>Cancel</button>
                            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 w-[7rem] disabled:bg-gray-150/20 shadow-none disabled:text-[#A2ABBA] disabled:opacity-100" onClick={() => updatingUserLimit()}> Save</button>
                            </div>
                    </div>
                </div>
            }
            <div className="pt-4">
            <DataTable
                columns={columns}
                data={compnayUserList}
                highlightOnHover={true}
                //pagination={true}
                // paginationPerPage={10}
                progressPending={loaderEnabled}
                progressComponent={<Spinner></Spinner>}
            />
            </div>
            
        </div>
    )
}

export default CompanyAdminUsers;