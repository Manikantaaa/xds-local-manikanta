"use client";

import Breadcrumbs, { CrumbItem } from "@/components/breadcrumb";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { PATH } from "@/constants/path";
import { useUserContext } from "@/context/store";
import { authFetcher } from "@/hooks/fetcher";
import { formatDate } from "@/services/common-methods";
import { Users, userInvitees } from "@/types/user.type";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Spinner from "@/components/spinner";

const CompanyUsersGetById = (params: { params: { id: number } }) => {

  const { user } = useUserContext();
  const [selectedUser, setSelectedUser] = useState<userInvitees>();
  const router = useRouter();
  if (!user) {
    router.push(PATH.HOME.path);
  }
  const [breadcrumbItems, setBreadcrumbItems] = useState<CrumbItem[]>([]);
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
      authFetcher(`${getEndpointUrl(ENDPOINTS.getInviteeById(params.params.id))}`)
        .then((result) => {
          if (result) {
            const theUser: userInvitees = result.data;
            setBreadcrumbItems([
              {
                label: PATH.HOME.name,
                path: PATH.HOME.path,
              },
              {
                label: PATH.INVITEES.name,
                path: PATH.INVITEES.path,
              },
              {
                label: theUser.firstName + " " + theUser.LastName,
                path: theUser.firstName + " " + theUser.LastName,
              },
            ]);
            setSelectedUser(theUser);
          }
          setCanRender(true);
        })
        .catch((error) => {
          console.log(error);
        });
  }, [user]);

  const setArchieveStatus = async(id: number, archive: boolean) => {
    let alertmsg = "";
    if(archive) {
      alertmsg = "Are you sure want to Un-Archive this user";
    } else {
      alertmsg = "Are you sure want to Archive this user";
    }
    if (confirm(alertmsg)) {
        await authFetcher(`${getEndpointUrl(ENDPOINTS.updateArchiveStatusAdminUser(id))}`).then(() => {
            if(archive) {
                alert("User has been un-archieved");
            } else {
                alert("User has been archieved");
            }
            router.push(PATH.INVITEES.path);
        });
      }
  }

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
    // alert(id);
    const isResetPassword: boolean = confirm("Do you want to reset password");
    if (isResetPassword) {
      if (id) {
        authFetcher(`${getEndpointUrl(ENDPOINTS.resetInviteePassword(+id))}`).then(
          (result) => {
            if (result.success) {
              alert("password has been reset");
              router.push(PATH.INVITEES.path);
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

  return (
    <>
      {
        canRender ? 
        <div className="w-full px-5 pos_r">
          <div className="py-6 breadcrumbs_s">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:text-left">
              <h1 className="font-bold text-gray-900 header-font">
                {selectedUser?.firstName + " " + selectedUser?.LastName}
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
                    {`${" " + selectedUser?.email}`}
                  </Link>
                </span>
              </li>
              <li>
                <span className="font-semibold text-gray-900 dark:text-white">
                  Company Name :
                </span>
                <span className=" text-gray-900 dark:text-white">
                  {" " + selectedUser?.companies.name}
                </span>
              </li>
              <li>
                <span className="font-semibold text-gray-900 dark:text-white">
                  Group : 
                </span>
                <span className=" text-gray-900 dark:text-white">
                  {selectedUser?.groups && " " + selectedUser?.groups.name}
                </span>
              </li>
              <li>
                <span className="font-semibold text-gray-900 dark:text-white">
                  Company Website :
                </span>
                <span className=" text-gray-900 dark:text-white">
                  <Link
                  prefetch={false}
                    href={(selectedUser?.companies.website) ? selectedUser?.companies.website : "#"}
                    target="_blank"
                    className="text-blue-300"
                  >
                    {" " + selectedUser?.companies.website}
                  </Link>
                </span>
              </li>
              <li>
                <span className="font-semibold text-gray-900 dark:text-white">
                  Type :
                </span>
                <span className=" text-gray-900 dark:text-white">
                  {" " + getRoleString(selectedUser?.companies.user.userRoles[0].roleCode)}
                </span>
              </li>
              <li>
                <span className="font-semibold text-gray-900 dark:text-white">
                  Created By : 
                </span>
                <span className=" text-gray-900 dark:text-white">
                  {" " + selectedUser?.companies.user.firstName} {selectedUser?.companies.user.lastName}
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
                  onClick={() => { selectedUser &&  setArchieveStatus(params.params.id, selectedUser?.isArchieve); }}
                >
                  {selectedUser?.isArchieve ? "Un-Archive User" : "Archive User"}
                </button>
              </li>
            </ol>
          </div>
        </div>
        :
        <div className="min-h-screen flex justify-center items-center">
          <Spinner />
        </div> 
      }
    </>
  );

}

export default CompanyUsersGetById;