import { useEffect, useState } from "react";
import { Button, Select } from "flowbite-react";
import DataTable from "react-data-table-component";
import Link from "next/link";
import { checkSubscriptionChange, formatDate, getMemberTypeString, getMonthsAndDaysBetweenTwoDates, getRoleString } from "@/services/common-methods";
import { authFileFetcherByPost, authPostdata } from "@/hooks/fetcher";
import { getEndpointUrl } from "@/constants/endpoints";
import { ENDPOINTS } from './../../constants/endpoints';
import Spinner from "../spinner";

export interface Subscription {
  id: number,
  subscriptionType: string,
  stripeExpireDate: Date,
  isSubscriptionCancelled: boolean,
  cancellationDate: Date,
  isActive: boolean,
  createdAt: Date,
  veryStartingDate: Date,
  firstPaymentFailDate: Date,
  paymentAttemptCount: number,
  failureReason: string,
  billingCountry: string | null
  isPreviouslyCancelled?: boolean,
  isSubscriptionChanged?: boolean,
  user: {
    id: number,
    firstName: string,
    lastName: string,
    email: string,
    companies: [
      { 
        id: number, 
        name: string,
        CompanyAddress: [
          {
            id: true,
            Country: {
              id: true,
              name: true
            }
          }
        ]
      }
    ],
    userRoles: [{ roleCode: string }]
  }
}

const ActiveSubscriptions = () => {
  const [theSubscriptions, setTheSubscriptions] = useState<Subscription[]>([]);
  const [timeLineVal, setTimeLineVal] = useState("all"); 
  const [industryType, setIndustryType] = useState("all");
  // const [theTimeLine, setTheTimeLine] = useState("thisWeek");
  const [isLoading, setIsLoading] = useState(false);

  const columns = [
    {
      id: "subscrRenewedDate",
      name: "Start Date",
      cell: (row: Subscription) => formatDate(row.createdAt).toString(),
      sortable: true,
      sortFunction: (a: Subscription, b: Subscription) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      name: "Next Renewal Date",
      cell: (row: Subscription) => {
        const renewalDate = getRenewalDate(row.stripeExpireDate);
        return(
          <span>
            {formatDate(renewalDate).toString()}
          </span>
        )
      },
      sortable: true,
      sortFunction: (a: Subscription, b: Subscription) => new Date(a.stripeExpireDate).getTime() - new Date(b.stripeExpireDate).getTime(),
    },
    {
      id: "userName",
      name: "User Name",
      cell: (row: Subscription) => (
        <div className="text-blue-300">
          <Link prefetch={false} href={`/admin/users/${row.user.id}`}>
            {row.user.firstName + " " + row.user.lastName}
          </Link>
        </div>
      ),
      sortable: true,
      sortFunction: (a: Subscription, b: Subscription) => a.user?.firstName.localeCompare(b.user?.firstName),
    },
    {
      id: "companyName",
      name: "Company Name",
      cell: (row: Subscription) =>(
        <div className="text-blue-300">
          <Link prefetch={false} href={`/admin/company/${row.user?.companies[0]?.id}`} passHref>
            {" "}
            {row.user?.companies[0]?.name}{" "}
          </Link>
        </div>
      ) ,
      sortable: true,
      sortFunction: (a: Subscription, b: Subscription) =>  a.user?.companies[0]?.name.localeCompare(b.user?.companies[0]?.name)
    },
    {
      id: "email",
      name: "Email",
      cell: (row: Subscription) =>(
        <div className="text-blue-300">
          <Link href={"mailto:" + row.user.email}> {row.user.email} </Link>
        </div>
      ),
    },
    {
      id: "role",
      name: "Role",
      cell: (row: Subscription) => getRoleString(row.user.userRoles[0].roleCode),
      sortFunction: (a: Subscription, b: Subscription) =>
        getRoleString(a.user.userRoles[0].roleCode).localeCompare(
          getRoleString(b.user.userRoles[0].roleCode),
        ),
      sortable: true,
    },
    {
      id: "memberType",
      name: "Member Type",
      cell: (row: Subscription) => getMemberTypeString(row.subscriptionType),
      sortFunction: (a: Subscription, b: Subscription) =>
        getMemberTypeString(a.subscriptionType).localeCompare(
          getMemberTypeString(b.subscriptionType),
        ),
      sortable: true,
    },
    {
      id: "subscriptionChanged",
      name: "Sub Change",
      cell: (row: Subscription) =>checkSubscriptionChange(row.isPreviouslyCancelled, row.isSubscriptionChanged, row.subscriptionType),
      // sortable: true,
      // sortFunction: (a: Subscription, b: Subscription) =>  a.user?.companies[0]?.name.localeCompare(b.user?.companies[0]?.name)
    },
    // {
    //   id: "country",
    //   name: "Country",
    //   cell: (row: Subscription) => {
    //     if(row.user.companies && row.user.companies[0]) {
    //       if(row.user.companies[0].CompanyAddress && row.user.companies[0].CompanyAddress.length > 0) {
    //         return (
    //           <span>{row.user.companies[0].CompanyAddress[0].Country.name}</span>
    //         );
    //       }
    //       return "";
    //     }
    //     return "";
    //   },
    // },
    {
      id: "country",
      name: "Country",
      cell: (row: Subscription) => row.billingCountry ? row.billingCountry : ""
    },
    {
      id: "activeDuration",
      name: "Active Duration",
      cell: (row: Subscription) => getMonthsAndDaysBetweenTwoDates(row.veryStartingDate, new Date()),
    },
  ];

  const getSubscriptions = (type = 0) => {
    setIsLoading(true);
    const postData = {
      type: industryType,
      duration: timeLineVal,
      timeLineVal: "",
      from: "active"
    }
    if(type == 1) {
      authFileFetcherByPost(`${getEndpointUrl(ENDPOINTS.downloadSubscriptionCsv)}`, postData).then((result) => {
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(result);
        link.download = "XDS_Active_Subscriptions.csv";
        link.click();
      }).catch((err) => {
        console.log(err);
      }).finally(() => {
        setIsLoading(false);
      });
    } else {
      authPostdata(`${getEndpointUrl(ENDPOINTS.getActiveSubscriptions)}`, postData).then((result) => {
        if(result && result.data) {
          setTheSubscriptions(result.data);
        }
      }).catch((err) => {
        console.log(err);
      }).finally(() => {
        setIsLoading(false);
      });
    }
  }

  function getTimeLineString(val: string): string {
    console.log(val);
    if(val == "month") {
      return "Monthly";
    } else if(val == "year") {
      return "Yearly";
    } 
    return "All";
  }

  useEffect(() => {
    getSubscriptions();
  }, [industryType, timeLineVal]);
  const getRenewalDate = (date: Date): Date => {
    const renewalDate = new Date(date);
    renewalDate.setDate(renewalDate.getDate() - 1);
    return renewalDate
  }
  return (
    <>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:text-left">
          <h1 className="font-bold default_text_color header-font">
            Active Subscriptions
          </h1>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 md:grid-cols-2 sm:grid-cols-2 pt-3" >
          <div>
            <Select id="industryType" value={ industryType } onChange={(e) => setIndustryType(e.target.value)}>
              <option value="all">All</option>
              <option value="service_provider">Service Provider</option>
              <option value="buyer">Buyer</option>
            </Select>
          </div>

          <div> 
            <Select id="timeLine" value={ timeLineVal } onChange={(e) => setTimeLineVal(e.target.value)}>
              <option value="all">All</option>
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </Select>
          </div>
          
            {/* <div>
              <Select id="theTimeLine" value={ theTimeLine }  onChange={(e) => setTheTimeLine(e.target.value)}>
                <option value="thisWeek">This Week</option>
                <option value="thisMonth">This Month</option>
                <option value="thisYear">This Year</option>
              </Select>
            </div> */}
          <div>
          <button
                className="text-sm font-medium inline-flex items-center justify-center gap-1.5 border-gray-200 px-5 py-2 text-blue-300 transition hover:bg-gray-50 hover:text-blue-400 focus:outline-none"
                type="button"
                onClick={(e) => { e.preventDefault(); getSubscriptions(1); }}
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
        </div>
      </div>
      {
        theSubscriptions.length > 0 &&
        <div>
          {getTimeLineString(timeLineVal)}: <span style={{color: "red"}}>[{ theSubscriptions.length >= 10 ? theSubscriptions.length : "0"+theSubscriptions.length }]</span>
        </div>
      }
      <div className="py-6 datatable_style">
        <DataTable
          columns={columns}
          data={theSubscriptions}
          highlightOnHover={true}
          pagination={true}
          defaultSortFieldId="subscrRenewedDate" // Specify the default sorted column (e.g., 'name')
          defaultSortAsc={false}
          paginationPerPage={10}
          paginationTotalRows={theSubscriptions.length}
          paginationRowsPerPageOptions={[10, 20, 50, 100, theSubscriptions.length]}
          paginationComponentOptions={{
            rowsPerPageText: "Records per page:",
            rangeSeparatorText: "out of",
          }}
          progressPending={isLoading}
          progressComponent={<Spinner />}
        />
      </div>
    </>
  )

}

export default ActiveSubscriptions;
