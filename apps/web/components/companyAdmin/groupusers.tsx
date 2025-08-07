import { Button, Modal } from "flowbite-react";
import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { useParams, useRouter } from "next/navigation";
import { authFetcher } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { createGroupUser, GroupUsersType } from "@/types/user.type";
import Multiselect from "multiselect-react-dropdown";
import { toast } from "react-toastify";
import useCommonPostData from "@/hooks/commonPostData";
import Spinner from "../spinner";
import usePagePermissions from "@/hooks/usePagePermissions";
import { PATH } from "@/constants/path";
import { useUserContext } from "@/context/store";
const GroupUsers = (props: {groupName: string}) => {
    const paramsdata = useParams();

    //
    const [addUseropenModal, setAddUserOpenModal] = useState(false);
    const [deleteopenModal, setDeleteOpenModal] = useState(false);
    const [groupUserList, setGroupUserList] = useState<GroupUsersType[]>([]);
    const [deletingId, setDeletingId] = useState<number>(0);
    const [loaderEnabled, isLoaderEnabled] = useState<boolean>(true);
    const [comanypUserList, setComanypUserList] = useState<{ id: number | undefined, name: string }[]>([]);
    const [selectedComanypUserList, setSelectedComanypUserList] = useState<{ id: number | undefined, name: string }[]>([]);
    const [selectedOldUserList, setSelectedOldUserList] = useState<{ id: number | undefined, name: string }[]>([]);
    const [reloadData, setReloadData] = useState<boolean>(true);
    const groupsPermissions = usePagePermissions(17);
    const usersPermissions = usePagePermissions(16);
    const router = useRouter();
    const [UsersExisted, setUsersExisted] = useState<boolean>(false);
    const { user } = useUserContext();
    const columns = [
        {
            name: "User",
            cell: (row: GroupUsersType) => (
                <div className={`${ row.id == 0 ? '': ((user?.isCompanyUser && usersPermissions.canWrite) || !user?.isCompanyUser) ? 'text-blue-300 cursor-pointer' : 'text-blue-300'}`} onClick={() => {row.id == 0 ? '' : ((user?.isCompanyUser && usersPermissions.canWrite) || !user?.isCompanyUser) && router.push(PATH.EDIT_USER.path + '/' + row.id) }}>
                    {row.firstName} {row.LastName}
                    {row.groups && row.id === user?.CompanyAdminId ?" (You)" : ''}
                </div>
            ),
            sortable: true,
            sortFunction: (a: GroupUsersType, b: GroupUsersType) => a.firstName.localeCompare(b.firstName),
        },
        {
            name: "Action",
            omit: !((!groupsPermissions.isCompanyUser) || (groupsPermissions.isCompanyUser && groupsPermissions.canDelete)),
            cell: (row: GroupUsersType) => (
                props.groupName == "Admin" && row.id == 0 ? "-" :
                <div className="cursor-pointer text-red-500" onClick={() => { setDeleteOpenModal(true), setDeletingId(row.id) }}>
                    {/* <DeleteCrossSvg></DeleteCrossSvg> */}
                    <svg
                        className="w-3.5 h-3.5 me-1"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 18 20"
                    >
                        <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M1 5h16M7 8v8m4-8v8M7 1h4a1 1 0 0 1 1 1v3H6V2a1 1 0 0 1 1-1ZM3 5h12v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5Z"
                        />
                    </svg>
                </div>
            ),
        },
    ];


    useEffect(() => {
        if (paramsdata.id && reloadData) {
            async function getGroupsList() {
                await authFetcher(`${getEndpointUrl(ENDPOINTS.getGroupUsersById(Number(paramsdata.id)))}`)
                    .then((res: GroupUsersType[]) => {
                        isLoaderEnabled(false);
                        setReloadData((prev) => !prev);
                        if(props.groupName == "Admin") {
                            const newUser = {
                                firstName: user?.firstName || '',
                                LastName: user?.lastName || '',
                                id: 0,
                                groups :{
                                    name: "Admin",
                                }
                              };
                            const updatedRes = [newUser, ...res];
                            setGroupUserList(updatedRes);
                        } else {
                            setGroupUserList(res);
                        }
                        
                        const multiselectData = res.map((user) => (
                            {
                                id: user.id,
                                name: user.firstName
                            }
                        ))
                        setSelectedComanypUserList(multiselectData);
                        setSelectedOldUserList(multiselectData);
                    });
            }
            getGroupsList();
            async function getCompanyUserList() {
                await authFetcher(`${getEndpointUrl(ENDPOINTS.findCompanyUsers)}`)
                    .then((res: {data: createGroupUser[], userCount: number}) => {
                        isLoaderEnabled(false);
                        setUsersExisted(res.userCount > 0);
                        const multiselectData = res.data.map((user) => (
                            {
                                id: user.id,
                                name: user.firstName
                            }
                        ))
                        setComanypUserList(multiselectData);
                    });
            }
            getCompanyUserList();
        }
    }, [paramsdata, reloadData])

    function onAddOrRemoveMultiple(
        selectedItems: { id: number; name: string }[],
    ) {
        setSelectedComanypUserList(selectedItems);
    }

    const hanldeRemoveUser = async (deletingId: number) => {
        isLoaderEnabled(true);
        await authFetcher(`${getEndpointUrl(ENDPOINTS.removeUserFromGroup(Number(paramsdata.id), Number(deletingId)))}`)
            .then(() => {
                toast.success("Deleted Successfully");
            }).catch((error) => {
                console.log(error);
                setDeletingId(0);
                toast.error("something went wrong, try again later");
            }).finally(() => {
                isLoaderEnabled(false);
                setDeleteOpenModal(false);
                setReloadData(true)
            })
    }

    const onCloseAddUserPopUp = () => {
        setSelectedComanypUserList(selectedOldUserList);
        setAddUserOpenModal(false)
    }
    const { submitForm } = useCommonPostData<{ userId: number[] }>({
        url: getEndpointUrl(ENDPOINTS.assignUserstoGroup(Number(paramsdata.id))),
    });
    const handleSaveUsers = () => {
        isLoaderEnabled(true);
        const PostData = selectedComanypUserList.map((user) => user.id);
        if (PostData && PostData[0]) {
            const updatedData: number[] = PostData.filter((id): id is number => id !== undefined);
            submitForm({ userId: updatedData }).then((res) => {
                toast.success("successfully added");
            }).catch((err) => {
                console.log(err)
                toast.error("something went wrong, try again later");
            }).finally(() => {
                isLoaderEnabled(false);
                setAddUserOpenModal(false);
                setReloadData(true)
            })
        }
    }
    return (
        <div className="py-6 relative">
            <div className="text-end pb-6">
                {((!groupsPermissions.isCompanyUser) || (groupsPermissions.isCompanyUser && groupsPermissions.canWrite)) &&

                    <button className={`addtotour text-sm font-medium inline-flex items-center justify-center gap-1.5 rounded-sm border-0 border-gray-200 px-3 py-1 ${UsersExisted ? 'link_color hover:text-blue-400' : 'text-gray-400'} transition hover:bg-gray-0  focus:outline-none`} type="button" onClick={() => UsersExisted && setAddUserOpenModal(true)}><span>+ Add User to Group </span></button>
                }
            </div>

            <div className="groups_detatable">
                <DataTable
                    columns={columns}
                    data={groupUserList}
                    highlightOnHover={true}
                    //pagination={true}
                    paginationPerPage={10}
                    progressPending={loaderEnabled}
                    progressComponent={<Spinner></Spinner>}
                />
            </div>
            {/* addUseropenModal */}
            <Modal show={addUseropenModal} size="md" onClose={() => onCloseAddUserPopUp()} popup className="">
                <Modal.Header className="modal_header">
                    <b className="pl-4">Add User</b>
                </Modal.Header>
                <Modal.Body >
                    <div className="text-left">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-1 lg:gap-8 pt-6">
                            <form className="flex items-start serviceprovidersearch">
                                <label htmlFor="voice-search" className="sr-only">Search</label><div className="relative lg:w-full w-[240px]">
                                    {/* <div className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none">
                                        <svg className="w-4 h-4" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <g id="â&nbsp;ï¸ Icon / Color"><path id="Union" d="M8.45324 8.98349L11.3571 11.8881C11.4306 11.9608 11.5266 11.9976 11.6226 11.9976C11.7186 11.9976 11.8146 11.9608 11.8881 11.8881C12.0343 11.7411 12.0343 11.5041 11.8881 11.3571L9.21461 8.6843C11.0001 6.6243 10.9145 3.49228 8.95782 1.53506C6.91083 -0.511688 3.58017 -0.511688 1.53468 1.53506C-0.511559 3.58181 -0.511559 6.91331 1.53468 8.96006C2.52668 9.95156 3.84485 10.4976 5.24625 10.4976C5.4532 10.4976 5.62116 10.3296 5.62116 10.1226C5.62116 9.91556 5.4532 9.74756 5.24625 9.74756C4.0443 9.74756 2.91508 9.27956 2.0648 8.42981C0.310985 6.67481 0.310985 3.82031 2.0648 2.06531C3.81786 0.310313 6.67164 0.311063 8.4277 2.06531C10.1815 3.82031 10.1815 6.67481 8.4277 8.42981C8.28149 8.57606 8.28149 8.81381 8.4277 8.96006C8.43594 8.96834 8.44446 8.97615 8.45324 8.98349Z" fill="#343741"></path></g></svg></div> */}
                                    {/* <input id="input-search" className="bg-gray-50 border border-gray-300 default_text_color text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pe-10 p-2" placeholder="Search..." type="search" autoComplete="off" /> */}

                                    <Multiselect
                                        className="block w-full"
                                        emptyRecordMsg="-"
                                        options={comanypUserList}
                                        displayValue="name"
                                        placeholder="Search..."
                                        selectedValues={selectedComanypUserList}
                                        onSelect={(e) => onAddOrRemoveMultiple(e)}
                                        onRemove={(e) => onAddOrRemoveMultiple(e)}
                                    />
                                </div>

                            </form>
                            <span><small> Note : Adding users from another group will move them to this group.</small></span>
                        </div>

                    </div>
                </Modal.Body>
                <Modal.Footer className="modal_footer">
                    <Button color="gray" className="h-[40px]" onClick={() => onCloseAddUserPopUp()}>   Cancel </Button>
                    <Button isProcessing={loaderEnabled}  disabled = {selectedComanypUserList.length <= 0} className="h-[40px] button_blue" onClick={handleSaveUsers} > Add </Button>
                </Modal.Footer>
            </Modal>

            {/* deleteopenModal */}
            <Modal show={deleteopenModal} size="md" onClose={() => setDeleteOpenModal(false)} popup className="">
                <Modal.Header className="modal_header">
                    <b className="pl-4">Are you sure?</b>
                </Modal.Header>
                <Modal.Body >
                    <div className="text-left">
                        <p className="mt-6 text-sm">You are about to remove the user from this Group.</p>

                    </div>
                </Modal.Body>
                <Modal.Footer className="modal_footer">
                    <Button color="gray" className="h-[40px]" onClick={() => setDeleteOpenModal(false)}>   Cancel </Button>
                    <Button isProcessing={loaderEnabled} className="h-[40px] button_blue" onClick={() => hanldeRemoveUser(deletingId)} > Delete </Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}

export default GroupUsers;