"use client";
import Breadcrumbs, { CrumbItem } from "@/components/breadcrumb";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { PATH } from "@/constants/path";
import { ROLE_CODE } from "@/constants/roleCode";
import { authFetcher } from "@/hooks/fetcher";
import { formatDate, getRoleString } from "@/services/common-methods";
import { Company } from "@/types/user.type";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Spinner from "@/components/spinner";
import CompanyAdminUsers from "@/components/companyAdmin/components/adminuserslist";
import CompanyAdminGroups from "@/components/companyAdmin/components/admingroupslist";
import CompanyAdminPermissions from "@/components/companyAdmin/components/admingroupspermissions";
import EventMeetToMatch from "@/components/admin/event-meettomatch";

const CompanyDetails = (params: { params: { companyId: string } }) => {
  const [breadcrumbItems, setBreadcrumbItems] = useState<CrumbItem[]>([]);
  const [company, setCompany] = useState<Company>();
  const [userType, setUserType] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [canRender, setCanRender] = useState(false);
  const [isFoundingSponcer, setIsFoundingSponcer] = useState<
    boolean | undefined
  >(false);
  const [isSponcerLimitExceed, setIsSponcerLimitExceed] = useState<
    boolean | undefined
  >(false);
  const router = useRouter();
  useEffect(() => {
    if (params.params.companyId) {
      authFetcher(
        `${getEndpointUrl(ENDPOINTS.getCompanyById(+params.params.companyId))}`,
      )
        .then((data: Company) => {
          setBreadcrumbItems([
            {
              label: PATH.HOME.name,
              path: PATH.HOME.path,
            },
            {
              label: PATH.COMPANY.name,
              path: PATH.COMPANY.path,
            },
            {
              label: data.name,
              path: data.name,
            },
          ]);
          setCompany(data);
          setUserType(getRoleString(data?.user.userRoles[0].roleCode));
          setUserRole(data.user.userRoles[0].roleCode);
          setIsFoundingSponcer(data.isFoundingSponcer);
          setUserEmail(data.user.email);
          setCanRender(true);
          // const users: Users[] = [];
          // users.push(data.user);
          // setUsers(users);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [params]);

  const [status, setStatus] = useState("1");

  function onClickStatus1(val: string) {
    setStatus(val);
  }

  function updateArchiveStatus(
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    type: number,
  ) {
    e.preventDefault();
    let url: string = "";
    if (type == 1) {
      if (confirm("Are you sure want to archive this company")) {
        url = `${getEndpointUrl(
          ENDPOINTS.archiveCompany(+params.params.companyId),
        )}`;
      } else {
        return;
      }
    } else {
      if (confirm("Are you sure want to un-archive this company")) {
        url = `${getEndpointUrl(
          ENDPOINTS.deArchiveCompany(+params.params.companyId),
        )}`;
      } else {
        return;
      }
    }
    authFetcher(url)
      .then(() => {
        if (type == 1) {
          alert("Company has been archieved");
        } else {
          alert("Company has been un-archieved");
        }
        router.push("/admin/company");
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function setFoundingSponcer(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.checked) {
      setIsFoundingSponcer(true);
    } else {
      setIsFoundingSponcer(false);
    }
  }

  function onChangeFounderSponcersStatus(
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) {
    e.preventDefault();
    if (isFoundingSponcer) {
      if (
        confirm("Are you sure want to make this company as Founding Sponsor")
      ) {
        authFetcher(
          `${getEndpointUrl(ENDPOINTS.setFoundingSponcer(company?.id, 1))}`,
        )
          .then((result) => {
            if (!result.success && result.data == "limit_exceeded") {
              setIsSponcerLimitExceed(true);
              setIsFoundingSponcer(false);
            } else {
              alert("Successfully set the company as founding sponsor");
            }
          })
          .catch((err) => {
            console.log(err);
          });
      }
    } else {
      if (
        confirm(
          "Are you sure want to remove this company from Founding Sponsor",
        )
      ) {
        authFetcher(
          `${getEndpointUrl(ENDPOINTS.setFoundingSponcer(company?.id, 0))}`,
        )
          .then((result) => {
            if (result.success) {
              setIsSponcerLimitExceed(false);
              alert("Successfully removed the company from founding sponsors");
            }
          })
          .catch((err) => {
            console.log(err);
          });
      }
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
                <h1 className="font-bold default_text_color header-font">
                  {company?.name}
                </h1>
              </div>
            </div>
            <div>
              <div className="sm:block pt-6">
                <div className="border-b border-gray-200 relative">
                  <nav className="-mb-px flex gap-6 overflow-auto" aria-label="Tabs">
                    <Link
                      href=""
                      onClick={() => {
                        onClickStatus1("1");
                      }}
                      className={`shrink-0 border-b-2 px-1 pb-4 font-bold text-sm ${status == "1"
                        ? "shrink-0 border-b-2 px-1 pb-4  text-sky-600  border-sky-500 "
                        : "border-transparent default_text_color hover:border-gray-300 hover:text-gray-700"
                        }`}
                    >
                      Company Details
                    </Link>
                    <Link
                      href=""
                      onClick={() => {
                        onClickStatus1("2");
                      }}
                      className={`shrink-0 border-b-2 px-1 pb-4 font-bold text-sm ${status == "2"
                        ? "shrink-0 border-b-2 px-1 pb-4  text-sky-600  border-sky-500 "
                        : "border-transparent default_text_color hover:border-gray-300 hover:text-gray-700"
                        }`}
                    >
                      Users
                    </Link>
                    <Link
                      href=""
                      onClick={() => {
                        onClickStatus1("3");
                      }}
                      className={`shrink-0 border-b-2 px-1 pb-4 font-bold text-sm ${status == "3"
                        ? "shrink-0 border-b-2 px-1 pb-4  text-sky-600  border-sky-500 "
                        : "border-transparent default_text_color hover:border-gray-300 hover:text-gray-700"
                        }`}
                    >
                      Groups
                    </Link>
                    <Link
                      href=""
                      onClick={() => {
                        onClickStatus1("4");
                      }}
                      className={`shrink-0 border-b-2 px-1 pb-4 font-bold text-sm ${status == "4"
                        ? "shrink-0 border-b-2 px-1 pb-4  text-sky-600  border-sky-500 "
                        : "border-transparent default_text_color hover:border-gray-300 hover:text-gray-700"
                        }`}
                    >
                      Permissions
                    </Link>
                    {company?.user.userRoles[0].roleCode == "service_provider" &&
                      <Link href="" onClick={() => { onClickStatus1("5"); }}
                      className={`shrink-0 border-b-2 px-1 pb-4 font-bold text-sm ${status == "5"
                        ? "shrink-0 border-b-2 px-1 pb-4  text-sky-600  border-sky-500 "
                        : "border-transparent default_text_color hover:border-gray-300 hover:text-gray-700"
                        }`}
                    >
                      Events
                    </Link>
                    }

                  </nav>
                </div>
              </div>
              {status == "1" ? (
                <ol className="space-y-6  pt-6 max-w-xl  default_text_color list list-inside text-sm">
                  <li>
                    <span className="font-semibold default_text_color dark:text-white">
                      Company Website:
                    </span>
                    <span className=" default_text_color dark:text-white">
                      <Link
                        href={`${company?.website}`}
                        target="_blank"
                        className="text-blue-300"
                      >
                        {" " + company?.website}
                      </Link>
                    </span>
                  </li>
                  <li>
                    <span className="font-semibold default_text_color dark:text-white">
                      Type:
                    </span>
                    <span className=" default_text_color dark:text-white">
                      {" " + userType}
                    </span>
                  </li>
                  <li>
                    <span className="font-semibold default_text_color dark:text-white">
                      Date Created:
                    </span>
                    <span className=" default_text_color dark:text-white">
                      {" " + formatDate(company?.createdAt)}
                    </span>
                  </li>
                  {userRole == ROLE_CODE.service_provider ? (
                    <>
                      <li>
                        <div className="flex items-center">
                          <input
                            id="checked-checkbox"
                            type="checkbox"
                            checked={isFoundingSponcer}
                            onChange={(e) => setFoundingSponcer(e)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <label
                            htmlFor="checked-checkbox"
                            className="ms-2 text-sm font-medium default_text_color dark:text-gray-300"
                          >
                            This company is a Founding Sponsor
                          </label>
                        </div>
                      </li>
                      <li>
                        <button
                          type="button"
                          className="h-[40px] default_text_color bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-8 py-2 me-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
                          onClick={(e) => onChangeFounderSponcersStatus(e)}
                        >
                          Save
                        </button>
                      </li>
                      {isSponcerLimitExceed ? (
                        <li>
                          <div className="flex items-center gap-2 text-red-600">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="h-5 w-5"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <p className="text-sm">
                              Sorry, the max number of Founding Sponsors has already
                              been identified
                            </p>
                          </div>
                        </li>
                      ) : (
                        ""
                      )}
                    </>
                  ) : (
                    ""
                  )}

                  <li>
                    <hr className="h-px my-8 bg-gray-200 border-0 dark:bg-gray-700" />
                  </li>

                  <li>
                    <button
                      onClick={(e) => {
                        company?.isArchieve
                          ? updateArchiveStatus(e, 2)
                          : updateArchiveStatus(e, 1);
                      }}
                      type="button"
                      className="text-red-900 bg-red-100 border border-red-200 focus:outline-none hover:bg-red-100 focus:ring-4 focus:ring-red-200 font-medium rounded-lg text-sm px-8 py-2.5 me-2 mb-2 dark:bg-red-800 dark:text-red dark:border-red-600 dark:hover:bg-red-700 dark:hover:border-red-600 dark:focus:ring-red-700"
                    >
                      {company?.isArchieve ? "Un-Archive Company" : "Archive Company"}
                    </button>
                  </li>
                </ol>
              ) : status == "2" ? (
                <CompanyAdminUsers></CompanyAdminUsers>
              ) : status == "3" ? (
                <CompanyAdminGroups></CompanyAdminGroups>
              ) : status == "4" ? (
                <CompanyAdminPermissions></CompanyAdminPermissions>
              ) :
              <EventMeetToMatch companyId = {+params.params.companyId}></EventMeetToMatch>
              }
            </div>
          </div>
          :
          <div className="min-h-screen flex justify-center items-center">
            <Spinner />
          </div>
      }
    </>

  );
};

export default CompanyDetails;
