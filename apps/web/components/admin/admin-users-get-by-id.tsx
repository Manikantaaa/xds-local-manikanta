"use client";

import Breadcrumbs, { CrumbItem } from "@/components/breadcrumb";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { PATH } from "@/constants/path";
import { useUserContext } from "@/context/store";
import { authFetcher, authPutWithData, fetcher } from "@/hooks/fetcher";
import { decodeMailcheckResponse, formatDate } from "@/services/common-methods";
import { Users } from "@/types/user.type";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Spinner from "@/components/spinner";
import LabelInput from "../labelInput";
import { Button, Label, TextInput } from "flowbite-react";
import { toast } from "react-toastify";
import ButtonSpinner from "../ui/buttonspinner";

const AdminUsersGetById = ({ userId }: { userId: number }) => {

  const { user } = useUserContext();
  const [selectedUser, setSelectedUser] = useState<Users>();
  const router = useRouter();
  if (!user) {
    router.push(PATH.HOME.path);
  }
  const [breadcrumbItems, setBreadcrumbItems] = useState<CrumbItem[]>([]);
  const [canRender, setCanRender] = useState(false);
  const [editEnable, setEditEnable] = useState<boolean>(false);
  const [loader, setLoader] = useState<boolean>(false);
  const [userfName, setUserfName] = useState<string>("");
  const [userlName, setUserlName] = useState<string>("");
  const [useremail, setUseremail] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [mailError, setMailError] = useState<string>("");

  useEffect(() => {
    if (userId) {
      const id = userId;
      authFetcher(`${getEndpointUrl(ENDPOINTS.getUserById(id))}`)
        .then((result) => {
          if (result) {
            const theUser: Users = result;
            setBreadcrumbItems([
              {
                label: PATH.HOME.name,
                path: PATH.HOME.path,
              },
              {
                label: PATH.USERS.name,
                path: PATH.USERS.path,
              },
              {
                label: theUser.firstName + " " + theUser.lastName,
                path: theUser.firstName + " " + theUser.lastName,
              },
            ]);
            setSelectedUser(theUser);
          }
          setCanRender(true);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }, [userId, user, !editEnable]);

  function updateArchiveStatus(
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    id: number | undefined,
    type: number,
  ) {
    e.preventDefault();

    if (id) {
      let url: string = "";
      if (type == 1) {
        if (confirm("Are you sure want to archieve this user")) {
          url = `${getEndpointUrl(ENDPOINTS.archiveUser(+id))}`;
        } else {
          return;
        }
      } else {
        if (confirm("Are you sure want to un-archieve this user")) {
          url = `${getEndpointUrl(ENDPOINTS.unArchiveUser(+id))}`;
        } else {
          return;
        }
      }
      authFetcher(url)
        .then((data: Users) => {
          if (data && data.id) {
            if (type == 1) {
              alert("User has been archieved");
            } else {
              alert("User has been un-archieved");
            }
            router.push(PATH.ADMIN.path);
          }
        })
        .catch((err) => console.log(err));
    }
  }

  function resetPassword(
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    id: number | undefined,
  ) {
    e.preventDefault();
    const isResetPassword: boolean = confirm("Do you want to reset password");
    if (isResetPassword) {
      if (id) {
        authFetcher(`${getEndpointUrl(ENDPOINTS.resetPassword(+id, "resetPasswordMail"))}`).then(
          (result) => {
            if (result.success) {
              alert("password has been reset");
              router.push(PATH.ADMIN.path);
            }
          },
        );
      }
    }
  }

  function getRoleString(role: string | undefined) {
    if (role == "admin") {
      return "Admin";
    } else if (role == "service_provider") {
      return "Service Provider";
    } else if (role == "buyer") {
      return "Buyer";
    } else {
      return "";
    }
  }

  const updatingUserDetails = async() => {
    if(userfName == "" || userlName == "" || useremail == "" || mailError != "") {
      setErrorMsg("Fill all feilds.")
      return;
    }
    setLoader(true);
    const postData = {
      firstName: userfName,
      lastName: userlName,
      email: useremail.toLowerCase(),
    }
    await authPutWithData(`${getEndpointUrl(ENDPOINTS.updatingUserDetails(userId))}`, postData)
      .then((result) => {
          if (result.success) {
            if(selectedUser?.email != useremail) {
              authFetcher(`${getEndpointUrl(ENDPOINTS.resetPassword(+userId, "userEditMail"))}`).then(
                (result) => {
                  if (result.success) {
                    setLoader(false);
                    setEditEnable(false);
                  }
                },
              );
            }else {
              setLoader(false);
              setEditEnable(false);
            }
            toast.success("Successfully Updated")
          } else {
            setLoader(false);
            toast.success("Failed to updated, try again later")
          }
      }).catch((err) => {
          setLoader(false);
          console.error(err);
      });
  }

  const checkmail = async(value: string) => {
      setMailError('');
      const email = value;
      setUseremail(email);
      if(selectedUser?.email == value) {
        return;
      }
      const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
      const mailFormatCheck = pattern.test(email);
      if (mailFormatCheck) {
        const data = await fetcher(getEndpointUrl(ENDPOINTS.checkExistedMails(email.toLowerCase())));
        const isMailExisted =  decodeMailcheckResponse(data);
        if (isMailExisted) {
          setMailError("The email address cannot be used at this time. Please check the address and try again.");
        }else {
          setMailError('');
        }
        console.log(data);
      }
  }

  const editUser = () => {
    if(selectedUser) {
      setErrorMsg("");
      setMailError("");
      setUserfName(selectedUser?.firstName);
      setUserlName(selectedUser?.lastName);
      setUseremail(selectedUser?.email);
      setEditEnable(true);
    }

  }

  return (
    <>
      {
        canRender ? 
        <div>
          <div className="py-6 breadcrumbs_s">
                <Breadcrumbs items={breadcrumbItems} />
              </div>
          {!editEnable ? 
          <>
              <div className="sm:flex sm:items-center sm:justify-between">
                <div className="sm:text-left">
                  <h1 className="font-bold text-gray-900 header-font">
                    {selectedUser?.firstName + " " + selectedUser?.lastName}
                  </h1>
                </div>
              </div>
              <div>
                <ol className="space-y-6  pt-6 max-w-xl text-sm text-gray-500 list list-inside">
                  <li>
                    <button
                      type="button"
                      className="text-blue-900 reset_btn focus:outline-none  font-medium text-sm px-4 py-2 me-2 h-[40px]"
                      onClick={(e) => resetPassword(e, selectedUser?.id)}
                    >
                      Reset Password
                    </button>
                  </li>
                  <li>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Email :
                    </span>
                    <span className=" text-gray-900 dark:text-white">
                      <Link
                      prefetch={false}
                        href={`mailto:${selectedUser?.email}`}
                        className="text-blue-300"
                        target="_blank"
                      >
                        {`${selectedUser?.email}`}
                      </Link>
                    </span>
                  </li>
                  <li>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Company Name :
                    </span>
                    <span className=" text-gray-900 dark:text-white">
                      {selectedUser?.companies[0].name}
                    </span>
                  </li>
                  <li>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Company Website :
                    </span>
                    <span className=" text-gray-900 dark:text-white">
                      <Link
                      prefetch={false}
                        href={(selectedUser?.companies[0].website) ? selectedUser?.companies[0].website : "#"}
                        target="_blank"
                        className="text-blue-300"
                      >
                        {selectedUser?.companies[0].website}
                      </Link>
                    </span>
                  </li>
                  <li>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Type :
                    </span>
                    <span className=" text-gray-900 dark:text-white">
                      {getRoleString(selectedUser?.userRoles[0].roleCode)}
                    </span>
                  </li>
                  <li>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Date Created :
                    </span>
                    <span className=" text-gray-900 dark:text-white">
                      {" " + formatDate(selectedUser?.createdAt)}
                    </span>
                  </li>
                  <li>
                    <hr className="h-px my-8 bg-gray-200 border-0 dark:bg-gray-700" />
                  </li>
                  <li>
                    <button
                      type="button"
                      className="text-blue-900 arch_btn focus:outline-none  font-medium text-sm px-4 py-2 me-2 h-[40px]"
                      onClick={(e) => {
                        selectedUser?.isArchieve
                          ? updateArchiveStatus(e, selectedUser?.id, 2)
                          : updateArchiveStatus(e, selectedUser?.id, 1);
                      }}
                    >
                      {selectedUser?.isArchieve ? "Un-Archive User" : "Archive User"}
                    </button>
                    <button
                      type="button"
                      className="text-white-900 edit_btn focus:outline-none font-medium text-sm px-4 py-2 me-2 h-[40px]"
                      onClick={() => editUser()}
                    >
                      Edit User Details
                    </button>
                  </li>
                </ol>
              </div>
          </>
          :
          <>  
              <div className="sm:flex pb-4 sm:items-center sm:justify-between">
                <div className="sm:text-left">
                  <h1 className="font-bold text-gray-900 header-font">
                    Edit User Details
                  </h1>
                </div>
              </div>
              <hr/>
              <div className="space-y-4 pt-6 mt-0 lg:w-[20rem]">
              <LabelInput
                  label="First Name"
                  required={true}
                  value={userfName}
                  onChange={(e)=>{setUserfName(e.target.value); setErrorMsg("")}}
                />
                <LabelInput
                  required={true}
                  label="Last Name"
                  value={userlName}
                  onChange={(e)=>{setUserlName(e.target.value); setErrorMsg("")}}
                />
                <div>
                  <Label
                    htmlFor="Email"
                    className="font-bold text-xs"
                  >
                    Email  <span style={{ color: 'red' }}> *</span>
                  </Label>
                  <TextInput
                    // onKeyUp={() => { setMailcheck && setMailcheck("") }}
                    autoComplete="off"
                    id="email"
                    className="focus:border-blue-300"
                    type="email"
                    sizing="md"
                    value={useremail}
                    onChange={(e)=>{setErrorMsg(""); checkmail(e.target.value)}}
                  />
                  {mailError && mailError != '' && 
                    <p className="font-medium text-red-500 text-xs mt-1">
                      {mailError as string}
                    </p>
                    }
                  <p className="font-medium text-gray-500 text-xs mt-2">
                    Note: Changing email resets the user password.
                  </p>

                </div>
                <div className="text-right relative">
                  {errorMsg != "" && <div className="absolute text-red-500 text-sm flex justify-center items-center">
                    {errorMsg}
                  </div> }
                  <div className="flex flex-wrap justify-end pb-6 pt-6">
                    <div className="inline-flex">
                      <button
                          type="button"
                          className="text-white-900 font-medium text-sm px-4 py-2 me-2 h-[40px]"
                          onClick={() => setEditEnable(false)}
                        >
                          Cancel
                      </button>
                      <Button
                        type="button"
                        className="text-white-900 edit_btn focus:outline-none font-medium text-sm px-4 py-2 h-[40px]"
                        onClick={() => updatingUserDetails()}
                        disabled={loader}
                      >{loader ? <ButtonSpinner></ButtonSpinner> :
                          'Save'
                        }
                      </Button>
                      </div>
                    </div>
                  </div>
              </div>
          </>
          }
          
        </div>
        :
        <div className="min-h-screen flex justify-center items-center">
          <Spinner />
        </div> 
      }
    </>
  );

}

export default AdminUsersGetById;