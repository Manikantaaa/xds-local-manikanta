"use client";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { PATH } from "@/constants/path";
import useCommonPostData from "@/hooks/commonPostData";
import { authFetcher, deleteItem, fetcher } from "@/hooks/fetcher";
import { AdminGroupsType } from "@/types/companies.type";
import { createGroupUser } from "@/types/user.type";
import { Button, Label, Modal, Radio, TextInput, Tooltip } from "flowbite-react"
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useUserContext } from "@/context/store";
import usePreventBackNavigation from "@/hooks/usePreventBackNavigation";
import Spinner from "@/components/spinner";
import usePagePermissions from "@/hooks/usePagePermissions";
import useFormUpdate from "@/hooks/useFormUpdate";
import { sanitizeData } from "@/services/sanitizedata";
import { decodeMailcheckResponse } from "@/services/common-methods";

const UserForm = (props: { isdelete?: boolean, formData?: createGroupUser }) => {

    const [openModal, setOpenModal] = useState(false);
    const [deleteopenModal, deletesetOpenModal] = useState(false);
    const [groupsList, setGroupsList] = useState<AdminGroupsType[]>([]);
    const [enableLoader, setEnableLoader] = useState<boolean>(false);
    const router = useRouter();
    const [mailError, setMailError] = useState<string>("");
    const { user } = useUserContext();
    const [isDataFetched, setIsDataFetched] = useState<boolean>(false)
    const UserPermissions = usePagePermissions(16)
    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
        reset,
        watch,
        getValues,
    } = useForm<createGroupUser>({
        defaultValues: {
            firstName: "",
            LastName: "",
            teamandstudio: "",
            email: "",
            groupId: undefined,
        },
    });
    usePreventBackNavigation(isDirty);
    const { submitForm } = !props.isdelete ? useCommonPostData<createGroupUser>({
        url: getEndpointUrl(ENDPOINTS.createCompanyUser),
    }) : useFormUpdate<createGroupUser>({
        url: getEndpointUrl(ENDPOINTS.updateCompanyUserById(props.formData?.id || 0)),
    });

    const handlePostData = async (postdata: createGroupUser) => {
        if (mailError != "") {
            return;
        }
        setEnableLoader(true);
        postdata = sanitizeData(postdata);
        await submitForm(postdata).then((res) => {
            if (res && (res.status === 201 || res.status === 200)) {
                if (props.isdelete) {
                    toast.success("successfully updated");
                    router.push(PATH.COMPANY_USERS.path);
                } else {
                    setOpenModal(true);
                }

            } else {
                toast.error("something went wrong try again later");
            }
        }).catch(() => {
            toast.error("something went wrong try again later");
        }).finally(() => {
            setEnableLoader(false);
        })
    }

    const checkUserMail = async () => {
        setMailError("");
        const email = watch("email");
        const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
        const mailFormatCheck = pattern.test(email);
        if (mailFormatCheck) {
            const res = await fetcher(getEndpointUrl(ENDPOINTS.checkUserMail(email)));
            if (res) {
                const mailCheck =  decodeMailcheckResponse(res);
                if(mailCheck){
                    setMailError("The email address cannot be used at this time. Please check the address and try again.");
                }
            }
        }
    }

    useEffect(() => {
        async function getGroupsList() {
            setIsDataFetched(true);
            await authFetcher(`${getEndpointUrl(ENDPOINTS.getGroupsList)}`)
                .then((res) => {
                    setGroupsList(res);
                }).finally(() => {
                    setIsDataFetched(false);
                });

        }
        getGroupsList();
    }, [])

    useEffect(() => {
        if (props.formData) {
            setIsDataFetched(true);
            reset({
                firstName: props.formData.firstName || "",
                LastName: props.formData.LastName || "",
                teamandstudio: props.formData.teamandstudio || "",
                email: props.formData.email || "",
                groupId: (props.formData.groupId && props.formData.groupId.toString()) ?? undefined,
            });
            setIsDataFetched(false);
        } else {
            if (groupsList.length > 0) {
                reset({
                    groupId: user?.isPaidUser && groupsList[1].id ? groupsList[1].id.toString() : undefined,
                })
            }
        }

    }, [props.formData, reset, groupsList]);

    const hanldeDeletUser = () => {
        setEnableLoader(true);
        deleteItem(getEndpointUrl(ENDPOINTS.deleteCompanyUserById(Number(props.formData?.id)))).then(() => {
            toast.success("successfully deleted");
            router.push(PATH.COMPANY_USERS.path);
        }).catch(() => {
            toast.error("something went wrong, try again")
        }).finally(() => {
            setEnableLoader(false);
            deletesetOpenModal(false)
        })
    }
    return (
        <>
            {/* Form deta */}
            {!isDataFetched ?
                <section className="mb-6  pt-6">
                    <div className="space-y-6 mt-0 lg:w-[25rem]">
                        <form onSubmit={handleSubmit(handlePostData)}>
                            <div>
                                <div className="mb-2 block">
                                    <Label htmlFor="small" value="First Name" className="text-gray-900 dark:text-white font-bold text-xs" /><span style={{ color: 'red' }}> *</span>
                                </div>
                                <TextInput id="small" type="text" sizing="" disabled={props.isdelete}  {...register("firstName", {
                                    required: {
                                        value: true,
                                        message: "This field is required"
                                    }
                                })} />
                                <p className="text-red-600 text-xs pt-1">
                                    {typeof errors?.firstName?.message === "string" &&
                                        errors?.firstName?.message}
                                </p>
                            </div>
                            <div>
                                <div className="mb-2 block">
                                    <Label htmlFor="small" value="Last Name" className="text-gray-900 dark:text-white font-bold text-xs" /><span style={{ color: 'red' }}> *</span>
                                </div>
                                <TextInput id="small" type="text" sizing="" disabled={props.isdelete} {...register("LastName", {
                                    required: {
                                        value: true,
                                        message: "This field is required"
                                    }
                                })} />
                                <p className="text-red-600 text-xs pt-1">
                                    {typeof errors?.LastName?.message === "string" &&
                                        errors?.LastName?.message}
                                </p>
                            </div>
                            <div>
                                <div className="mb-2 block flex items-end">
                                    <Label htmlFor="small" value="Company Email" className="text-gray-900 dark:text-white font-bold text-xs" /><span style={{ color: 'red' }} className="mx-1 "> *</span>
                                    <div className="">
                                        <Tooltip
                                         content={
                                            <span>
                                              Note that a new user cannot already have an account in Spark. If you encounter this problem, please <a className="underline underline-offset-1" href="mailto:info@xds-spark.com?subject=XDS Spark - Support Request" target="_blank">Contact Us</a>.
                                            </span>
                                          }
                                           // content={`Note that a new user cannot already have an account in Spark. If you encounter this problem, please <a>Contact Us</a>.`}
                                            className="tier_tooltip_company_admin "
                                        >
                                            <svg
                                                className="w-[15px] h-[15px] text-gray-600 dark:text-white top-[2px]"
                                                aria-hidden="true"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M2 12a10 10 0 1 1 20 0 10 10 0 0 1-20 0Zm9.4-5.5a1 1 0 1 0 0 2 1 1 0 1 0 0-2ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4c0-.6-.4-1-1-1h-2Z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            {" "}
                                        </Tooltip>
                                    </div>
                                </div>
                                <TextInput id="small" type="text" sizing="" onKeyUp={() => checkUserMail()} disabled={props.isdelete} {...register("email", {
                                    required: {
                                        value: true,
                                        message: "This field is required"
                                    },
                                    pattern: {
                                        value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                                        message: "Invalid email address",
                                      },
                                })} />
                                <p className="text-red-600 text-xs pt-1">
                                    {typeof errors?.email?.message === "string" &&
                                        errors?.email?.message}
                                </p>
                                {mailError != "" &&
                                    <p className="text-red-600 text-xs pt-1"> {mailError} </p>
                                }

                            </div>
                            <div>
                                <div className="mb-2 block">
                                    <Label htmlFor="small" value="Team/Studio" className="text-gray-900 dark:text-white font-bold text-xs" />
                                </div>
                                <TextInput id="small" type="text" sizing="" disabled={user?.isCompanyUser && !UserPermissions.canWrite} {...register("teamandstudio", {
                                    required: false,
                                })} />
                            </div>
                            <div>
                                <fieldset className="flex max-w-md flex-col gap-3 mt-2 ">
                                    <legend className="text-gray-900 dark:text-white font-bold text-xs mb-4">Groups</legend>
                                    {groupsList.map((group) => (
                                        <div className="flex items-center gap-2">
                                            <Radio id={`group_` + group.id} disabled={user?.isCompanyUser && !UserPermissions.canWrite} value={group.id} {...register("groupId", {
                                                required: {
                                                    value: true,
                                                    message: "This field is required"
                                                }
                                            })} />
                                            <Label htmlFor={`group_` + group.id}>{group.name} {group.name === "Admin" && `(user will be able to make global account changes)`}</Label>
                                        </div>
                                    ))}
                                    <p className="text-red-600 text-xs pt-1">
                                        {typeof errors?.groupId?.message === "string" &&
                                            errors?.groupId?.message}
                                    </p>
                                </fieldset>
                            </div>
                            <div className="flex items-center justify-end pt-6">
                                {(props.isdelete && ((UserPermissions.isCompanyUser && UserPermissions.canDelete) || !UserPermissions.isCompanyUser)) && <button type="button" className="mr-4 text-sm font-medium text-[#B4251D]" onClick={() => { deletesetOpenModal(true) }}>Delete User</button>}
                                <button onClick={() => !enableLoader && router.push(PATH.COMPANY_USERS.path)} type="button" className="link_color mr-4 text-sm font-medium">Cancel</button>
                                {((UserPermissions.isCompanyUser && UserPermissions.canWrite) || !UserPermissions.isCompanyUser) &&
                                    <Button isProcessing={enableLoader} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 w-[7rem] disabled:bg-gray-150/20 shadow-none disabled:text-[#A2ABBA] disabled:opacity-100" type="submit">{props.isdelete ? 'Save' : 'Submit'} </Button>
                                }

                            </div>
                        </form>
                    </div>
                </section>
                : <>
                    <div className="pt-6 flex justify-center items-center">
                        <Spinner />
                    </div>
                </>
            }

            {/* User Creared Model */}
            <Modal show={openModal} size="md" onClose={() => setOpenModal(false)} popup className="user_create_success">
                {/* <Modal.Header /> */}
                <Modal.Body >
                    <div className="text-left">
                        <h3 className="mb-3 mt-6 text-base font-bold text-gray-900">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 align-middle" width="18" height="18" viewBox="0 0 16 16" fill="none">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M5.96924 12.0308L5.97016 12.0317C6.11641 12.1765 6.30823 12.25 6.50002 12.25C6.69181 12.25 6.88363 12.1765 7.02989 12.0317L14.0313 5.03034C14.3233 4.73682 14.3233 4.26322 14.0313 3.96969L14.0303 3.96879C13.7368 3.67676 13.2628 3.67723 12.9692 3.96925L6.50003 10.4394L3.03035 6.96879C2.73682 6.67676 2.26322 6.67676 1.9697 6.96879L1.9688 6.96969C1.67677 7.26322 1.67722 7.73727 1.96925 8.03079L5.96924 12.0308Z" fill="#343741" />
                            </svg> User Created
                        </h3>
                        <p className="mb-3 text-sm">An email invite has been sent to {getValues("email")}.</p>
                        <div className="flex justify-end gap-4">
                            <Button color="failure" onClick={() => { setOpenModal(false), router.push(PATH.COMPANY_USERS.path) }}>
                                {"OK"}
                            </Button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
            {/* Delete Model */}
            <Modal show={deleteopenModal} size="md" onClose={() => deletesetOpenModal(false)} popup className="">
                <Modal.Header className="modal_header">
                    <b className="pl-4">Are you sure?</b>
                </Modal.Header>
                <Modal.Body >
                    <div className="text-left">
                        <p className="mt-6 text-sm">You are about to delete this user. Doing so will remove their account entirely. This action cannot be undone.</p>

                    </div>
                </Modal.Body>
                <Modal.Footer className="modal_footer">
                    <Button color="gray" className="h-[40px]" onClick={() => deletesetOpenModal(false)}>   Cancel </Button>
                    <Button isProcessing={enableLoader} className="h-[40px] button_blue" onClick={hanldeDeletUser} > Delete </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

export default UserForm;