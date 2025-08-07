import { PATH } from "@/constants/path";
import { useEffect, useState } from "react";
import Breadcrumbs from "./breadcrumb";
import DataTable from "react-data-table-component";
import Link from "next/link";
import { authFetcher, authFileFetcher } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { getRoleString, getUserType, getUserTypeString } from "@/services/common-methods";
import Spinner from "@/components/spinner";
import { formatDate } from "@/services/common-methods";
import { Tooltip } from "flowbite-react";


interface companyTypes{
    rolecode: string;
    user: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      userType: string,
      trialDuration: string,
      isPaidUser:boolean,
      companies: [
        {
        id: number,
        name: string,
        slug: string,
        website: string,
        generalInfoProfilePerc: number,
        ourWorkAlbumsProfilePerc: number,
        ourWorkProjectProfilePerc: number,
        aboutProfilePerc: number,
        certificationsProfilePerc: number,
        servicesProfilePerc: number,
        contactsProfilePerc: number,
        createdAt: Date,
        CompanyContacts:[
          {
            name: string,
          }
        ]
      }
    ];
    };
}
const CompanyProfileStatus = () => {
  const [topViewedReports, setTopViewedReports] = useState<companyTypes[]>([]);
  const columns = [
    {
      id: "created",
      name: "Date Created",
      cell: (row: companyTypes) => (
        <div>
          {formatDate(row.user.companies[0].createdAt)}
        </div>
      ),
      sortable: true,
      sortFunction: (a: companyTypes, b: companyTypes) =>
        new Date(a.user.companies[0].createdAt).getTime() -
        new Date(b.user.companies[0].createdAt).getTime(),
    },
    {
      id: "userFirstName",
      name: "User Name",
      cell: (row: companyTypes) => (
        <div className="text-blue-300">
          <Link prefetch={false} href={`/admin/users/${row.user?.id}`}>
            {row.user.firstName} {row.user.lastName}
          </Link>
        </div>
      ),
      sortable: true,
      sortFunction: (a: companyTypes, b: companyTypes) =>
        a.user.firstName.localeCompare(b.user.firstName),
    },
    {
      id: "companyName",
      name: "Company Name",
      cell: (row: companyTypes) => (
        <div className="text-blue-300">
          <Link prefetch={false} href={`/admin/company/${row.user?.companies[0].id}`}>
            {row.user?.companies[0].name}
          </Link>
        </div>
      ),
      sortable: true,
      sortFunction: (a: companyTypes, b: companyTypes) =>
        a.user?.companies[0].name.localeCompare(b.user?.companies[0].name),
    },
    {
      id: "companyEmail",
      name: "Company Email",
      cell: (row: companyTypes) => (
        <div className="text-blue-300">
          <Link prefetch={false} href={`mailto:${row.user.email}`}>
            {row.user.email}
          </Link>
        </div>
      ),
      sortable: true,
      sortFunction: (a: companyTypes, b: companyTypes) =>
        a.user.email.localeCompare(b.user.email),
    },
    {
      id: "companyProfile",
      name: "Company Profile",
      cell: (row: companyTypes) => (
        <div className="text-blue-300">
          <Link prefetch={false} href={`/serviceproviders-details/${row.user?.companies[0].slug}`}>
            {`https://xds-spark.com/serviceproviders-details/${row.user?.companies[0].slug}`}
          </Link>
        </div>
      ),
      sortable: true,
      sortFunction: (a: companyTypes, b: companyTypes) =>
        a.user?.companies[0].id.toString().localeCompare(b.user?.companies[0].id.toString()),
    },
    {
      id: "type",
      name: "Type",
      cell: (row: companyTypes) => getUserType(row.user),
      sortFunction: (a: companyTypes, b: companyTypes) =>
        getUserType(a.user).localeCompare(getUserType(b.user)),
      sortable: true,
    },
    {
      id: "completion",
      name: "Profile Completion %",
      cell: (row: companyTypes) => {
        const company = row.user.companies[0];
        let completion = 0;
        let tooltipContent = null;

        if (row.user.isPaidUser) {
          completion =
            company.aboutProfilePerc +
            company.certificationsProfilePerc +
            company.contactsProfilePerc +
            company.generalInfoProfilePerc +
            company.ourWorkAlbumsProfilePerc +
            company.ourWorkProjectProfilePerc +
            company.servicesProfilePerc;

          tooltipContent = (
            <div>
              <p>General Info - {company.generalInfoProfilePerc}%</p>
              <p>Our Work - {company.ourWorkAlbumsProfilePerc + company.ourWorkProjectProfilePerc}%</p>
              <p>Services - {company.servicesProfilePerc}%</p>
              <p>Diligence - {company.certificationsProfilePerc}%</p>
              <p>About - {company.aboutProfilePerc}%</p>
              <p>Contacts - {company.contactsProfilePerc}%</p>
            </div>
          );
        } else {
          completion =
            (company.aboutProfilePerc != 0 ? 30 : company.aboutProfilePerc) +
            (company.generalInfoProfilePerc != 0 ? 40 : company.generalInfoProfilePerc) +
            (company.servicesProfilePerc != 0 ? 30 : company.servicesProfilePerc);

          tooltipContent = (
            <div>
              <p>General Info - {company.generalInfoProfilePerc != 0 ? 40 : company.generalInfoProfilePerc}%</p>
              <p>Services - {company.servicesProfilePerc != 0 ? 30 : company.servicesProfilePerc}%</p>
              <p>About - {company.aboutProfilePerc != 0 ? 30 : company.aboutProfilePerc}%</p>
            </div>
          );
        }

        return (
          <Tooltip content={tooltipContent} className="tier_tooltip">
            {completion}%
          </Tooltip>
        );
      },
      sortable: true,
      sortFunction: (a: companyTypes, b: companyTypes) => {
        const companyA = a.user.companies[0];
        const companyB = b.user.companies[0];

        const getCompletion = (user: companyTypes["user"], company: typeof companyA) => {
          if (user.isPaidUser) {
            return (
              company.aboutProfilePerc +
              company.certificationsProfilePerc +
              company.contactsProfilePerc +
              company.generalInfoProfilePerc +
              company.ourWorkAlbumsProfilePerc +
              company.ourWorkProjectProfilePerc +
              company.servicesProfilePerc
            );
          } else {
            return (
              (company.aboutProfilePerc !== 0 ? 30 : company.aboutProfilePerc) +
              (company.generalInfoProfilePerc !== 0 ? 40 : company.generalInfoProfilePerc) +
              (company.servicesProfilePerc !== 0 ? 30 : company.servicesProfilePerc)
            );
          }
        };

        const completionA = getCompletion(a.user, companyA);
        const completionB = getCompletion(b.user, companyB);

        return completionA - completionB;
      },
    },
  ];
  const breadcrumbItems = [
    {
      label: PATH.HOME.name,
      path: PATH.HOME.path,
    },
    {
      label: PATH.REPORTS.name,
      path: PATH.REPORTS.path,
    },
    {
      label: "Profile Completion %",
      path: "Profile Completion %",
    },
  ];
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    authFetcher(`${getEndpointUrl(ENDPOINTS.getspProfilestats)}`)
      .then((result) => {
        if (result.success) {
          const topViewedReports: companyTypes[] = result.data.result;
          console.log(topViewedReports);
          setTopViewedReports(topViewedReports);
        }
        setCanRender(true);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  async function downloadCsv(
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) {
    e.preventDefault();
    authFileFetcher(
      `${getEndpointUrl(ENDPOINTS.downloadprofileperc)}`,
    )
      .then((result) => {
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(result);
        link.download = "XDS-Spark_Company_Export.csv";
        link.click();
      })
      .catch((error) => {
        console.log(error);
      });
  }

  return (
    <>
      {
        canRender ? 
        <div className="lg:col-span-4 border-l ps-8 most_active">
          <div className="pb-6 pt-6 breadcrumbs_s">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:text-left">
              <h1 className="font-bold default_text_color header-font">
              Profile Completion %
              </h1>
            </div>
            <button
                className="text-sm font-medium inline-flex items-center justify-center gap-1.5 border-gray-200 px-5 py-2 text-blue-300 transition hover:bg-gray-50 hover:text-blue-400 focus:outline-none"
                type="button"
                onClick={(e) => downloadCsv(e)}
              >
                {" "}
                <svg
                  className="w-3.5 h-3.5 text-blue-300"
                  version="1.1"
                  fill="#0071C2"
                  id="fi_25407"
                  xmlns="http://www.w3.org/2000/svg"
                  x="0px"
                  y="0px"
                  viewBox="0 0 475.078 475.077"
                >
                  <g>
                    <g>
                      <path
                        d="M467.083,318.627c-5.324-5.328-11.8-7.994-19.41-7.994H315.195l-38.828,38.827c-11.04,10.657-23.982,15.988-38.828,15.988
                        c-14.843,0-27.789-5.324-38.828-15.988l-38.543-38.827H27.408c-7.612,0-14.083,2.669-19.414,7.994
                        C2.664,323.955,0,330.427,0,338.044v91.358c0,7.614,2.664,14.085,7.994,19.414c5.33,5.328,11.801,7.99,19.414,7.99h420.266
                        c7.61,0,14.086-2.662,19.41-7.99c5.332-5.329,7.994-11.8,7.994-19.414v-91.358C475.078,330.427,472.416,323.955,467.083,318.627z
                        M360.025,414.841c-3.621,3.617-7.905,5.424-12.854,5.424s-9.227-1.807-12.847-5.424c-3.614-3.617-5.421-7.898-5.421-12.844
                        c0-4.948,1.807-9.236,5.421-12.847c3.62-3.62,7.898-5.431,12.847-5.431s9.232,1.811,12.854,5.431
                        c3.613,3.61,5.421,7.898,5.421,12.847C365.446,406.942,363.638,411.224,360.025,414.841z M433.109,414.841
                        c-3.614,3.617-7.898,5.424-12.848,5.424c-4.948,0-9.229-1.807-12.847-5.424c-3.613-3.617-5.42-7.898-5.42-12.844
                        c0-4.948,1.807-9.236,5.42-12.847c3.617-3.62,7.898-5.431,12.847-5.431c4.949,0,9.233,1.811,12.848,5.431
                        c3.617,3.61,5.427,7.898,5.427,12.847C438.536,406.942,436.729,411.224,433.109,414.841z"
                      ></path>
                      <path
                        d="M224.692,323.479c3.428,3.613,7.71,5.421,12.847,5.421c5.141,0,9.418-1.808,12.847-5.421l127.907-127.908
                        c5.899-5.519,7.234-12.182,3.997-19.986c-3.23-7.421-8.847-11.132-16.844-11.136h-73.091V36.543c0-4.948-1.811-9.231-5.421-12.847
                        c-3.62-3.617-7.901-5.426-12.847-5.426h-73.096c-4.946,0-9.229,1.809-12.847,5.426c-3.615,3.616-5.424,7.898-5.424,12.847V164.45
                        h-73.089c-7.998,0-13.61,3.715-16.846,11.136c-3.234,7.801-1.903,14.467,3.999,19.986L224.692,323.479z"
                      ></path>
                    </g>
                  </g>
                </svg>
                <span className=""> Download CSV </span>
              </button>
          </div>
          
          <div className="py-6 datatable_style">
            <DataTable
              columns={columns}
              data={topViewedReports}
              highlightOnHover={true}
              pagination={true}
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 25, 50, 100, topViewedReports.length]}
              defaultSortFieldId="completion"
              defaultSortAsc={false}
              paginationComponentOptions={{
                rowsPerPageText: "Records per page:",
                rangeSeparatorText: "out of",
              }}
            />
          </div>
        </div>
        :
        <div className="lg:col-span-4 border-l ps-8 most_active">
          <div className="min-h-[90vh] flex justify-center items-center">
            <Spinner />
          </div>
        </div>
      }
    </>
  );
};

export default CompanyProfileStatus;
