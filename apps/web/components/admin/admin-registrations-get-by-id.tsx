"use client";

import Breadcrumbs, { CrumbItem } from "@/components/breadcrumb";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { PATH } from "@/constants/path";
import { useUserContext } from "@/context/store";
import { authFetcher } from "@/hooks/fetcher";
import { formatDate } from "@/services/common-methods";
import { Users } from "@/types/user.type";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Spinner from "@/components/spinner";

const AdminRegistrationsGetById = ( {registrationId} : {registrationId: number} ) => {
  const { user } = useUserContext();
  const [selectedUser, setSelectedUser] = useState<Users>();
  const [canRender, setCanRender] = useState(false);
  const router = useRouter();
  if (!user) {
    router.push(PATH.HOME.path);
  }
  const [breadcrumbItems, setBreadcrumbItems] = useState<CrumbItem[]>([]);

  useEffect(() => {
    if (registrationId) {
      const id = registrationId;
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
                label: PATH.REGISTRATIONS.name,
                path: PATH.REGISTRATIONS.path,
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
  }, [registrationId, user]);

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
        <div>
          <div className="py-6 breadcrumbs_s">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:text-left">
              <h1 className="font-bold text-gray-900 header-font">
                {" " + selectedUser?.firstName + " " + selectedUser?.lastName}
              </h1>
            </div>
          </div>
          <div>
            <ol className="space-y-6  pt-6 max-w-xl text-sm text-gray-500 list list-inside">
              <li>
                <span className="font-semibold text-gray-900 dark:text-white">
                  Email:
                </span>
                <span className=" text-gray-900 dark:text-white">
                  <Link
                  prefetch={false}
                    className="text-blue-300"
                    href={`mailto:${selectedUser?.email}`}
                  >
                    {" "}
                    {" " + selectedUser?.email}{" "}
                  </Link>
                </span>
              </li>
              <li>
                <span className="font-semibold text-gray-900 dark:text-white">
                  Company Name:
                </span>
                <span className=" text-gray-900 dark:text-white">
                  {" " + selectedUser?.companies[0].name}
                </span>
              </li>
              <li>
                <span className="font-semibold text-gray-900 dark:text-white">
                  Company Website:
                </span>
                <span className=" text-gray-900 dark:text-white">
                  <Link
                  prefetch={false}
                    href={`${selectedUser?.companies[0].website}`}
                    target="_blank"
                    className="text-blue-300"
                  >
                    {" " + selectedUser?.companies[0].website}
                  </Link>
                </span>
              </li>
              <li>
                <span className="font-semibold text-gray-900 dark:text-white">
                  Type:
                </span>
                <span className=" text-gray-900 dark:text-white">
                  {" " + getRoleString(selectedUser?.userRoles[0].roleCode)}
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

export default AdminRegistrationsGetById;