import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { authFetcher, authFileFetcherByPost, authPostdata } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { Button, Label, Modal, Select, Textarea, Tooltip } from "flowbite-react";
import { formatDate, getMemberTypeString, getMonthsAndDaysBetweenTwoDates, getRoleString } from "@/services/common-methods";
import Link from "next/link";
import Spinner from "../spinner";

export type IdName = {
  id: number;
  name: string;
}

export interface CancelledSubscription {
  id: number;
  subscriptionType: string,
  cancellationDate: Date;
  cancellationReason: string | null;
  reasonDescription: string | null;
  veryStartingDate: Date;
  billingCountry: string | null;
  paymentAttemptCount: number;
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

const CancelledSubscriptions = () => {
  const [cancelledSubscriptions, setCancelledSubscriptions] = useState<CancelledSubscription[]>([]);
  const [description, setDescription] = useState("");
  const [openDescriptionModal, setOpenDescriptionModal] = useState(false);
  const [timeLineVal, setTimeLineVal] = useState("all"); 
  const [industryType, setIndustryType] = useState("all");
  const [theTimeLine, setTheTimeLine] = useState("allTime");
  const [isLoading, setIsLoading] = useState(false);
  
  const columns = [
    {
      id: "cancellationDate",
      name: "Cancelled Date",
      cell: (row: CancelledSubscription) => formatDate(row.cancellationDate).toString(),
      sortable: true,
      sortFunction: (a: CancelledSubscription, b: CancelledSubscription) => new Date(a.cancellationDate).getTime() - new Date(b.cancellationDate).getTime(),
    },
    {
      id: "userName",
      name: "User Name",
      cell: (row: CancelledSubscription) => row.user?.firstName + " " + row.user?.lastName,
      sortable: true,
      sortFunction: (a: CancelledSubscription, b: CancelledSubscription) => a.user?.firstName.localeCompare(b.user?.firstName),
    },
    {
      id: "companyName",
      name: "Company Name",
      cell: (row: CancelledSubscription) =>(
        <div className="text-blue-300">
          <Link prefetch={false} href={`/admin/company/${row.user?.companies[0]?.id}`} passHref>
            {" "}
            {row.user?.companies[0]?.name}{" "}
          </Link>
        </div>
      ) ,
      sortable: true,
      sortFunction: (a: CancelledSubscription, b: CancelledSubscription) =>  a.user?.companies[0]?.name.localeCompare(b.user?.companies[0]?.name)
    },
    {
      id: "email",
      name: "Email",
      cell: (row: CancelledSubscription) =>(
        <div className="text-blue-300">
          <Link href={"mailto:" + row.user.email}> {row.user.email} </Link>
        </div>
      ),
    },
    {
      id: "role",
      name: "Role",
      cell: (row: CancelledSubscription) => getRoleString(row.user.userRoles[0].roleCode),
      sortFunction: (a: CancelledSubscription, b: CancelledSubscription) =>
        getRoleString(a.user.userRoles[0].roleCode).localeCompare(
          getRoleString(b.user.userRoles[0].roleCode),
        ),
      sortable: true,
    },
    {
      id: "memberType",
      name: "Member Type",
      cell: (row: CancelledSubscription) => getMemberTypeString(row.subscriptionType),
      sortFunction: (a: CancelledSubscription, b: CancelledSubscription) =>
        getMemberTypeString(a.subscriptionType).localeCompare(
          getMemberTypeString(b.subscriptionType),
        ),
      sortable: true,
    },
    {
      id: "country",
      name: "Country",
      cell: (row: CancelledSubscription) => row.billingCountry ? row.billingCountry : ""
    },
    // {
    //   id: "country",
    //   name: "Country",
    //   cell: (row: CancelledSubscription) => {
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
      id: "cancelReason",
      name: "Reason",
      cell: (row: CancelledSubscription) => ( row.cancellationReason ? getActualCancellationReason(row.cancellationReason) : "-" ) ,
      sortFunction: (a: CancelledSubscription, b: CancelledSubscription) => getActualCancellationReason(a.cancellationReason ? a.cancellationReason : "").localeCompare(getActualCancellationReason(b.cancellationReason ? b.cancellationReason : "")),
    },
    {
      id: "paymentFailed",
      name: "Payment Failed",
      cell: (row: CancelledSubscription) =>
        row.paymentAttemptCount > 0 ? "Yes" : "No",
      sortFunction: (rowA: CancelledSubscription, rowB: CancelledSubscription) => {
        const valueA = rowA.paymentAttemptCount > 0 ? "Yes" : "No";
        const valueB = rowB.paymentAttemptCount > 0 ? "Yes" : "No";
        return valueA.localeCompare(valueB);
      },
    },
    {
      id: "reasonComment",
      name: "Comments",
      cell: (row: CancelledSubscription) => (
        <div>
          {
            row.reasonDescription && row.reasonDescription != "" &&
            <div className="link_color">
              <button onClick={(e) => { e.preventDefault(); onClickReasonDescription(row.reasonDescription) }}>View Details</button>
            </div>
          }
        </div>
      )
    },
    {
      id: "activeDuration",
      name: "Active Duration",
      cell: (row: CancelledSubscription) => getMonthsAndDaysBetweenTwoDates(row.veryStartingDate, row.cancellationDate),
    }
  ];

  function onClickReasonDescription(description: string | null) {
    if(description) {
      setOpenDescriptionModal(true);
      setDescription(description);
      // setDescription(description.replace(/\\n/g, '\n'));
    } else {
      setOpenDescriptionModal(true);
      setDescription("");
    }
  }

  function getActualCancellationReason(reason: string){
    let resultString = ""
    switch(reason) {
      case "cost": {
        resultString = "Cost - Subscription fee is too high";
        break;
      }
      case "lack": {
        resultString = "Lack of Value - Does not meet your expectations";
        break;
      }
      case "better": {
        resultString = "Better Alternatives - Switching to competitor";
        break;
      }
      case "support": {
        resultString = "Customer Support - Inadequate customer support";
        break;
      }
      case "performance": {
        resultString = "Performance Issues - Bugs, downtime, or slow performance";
        break;
      }
      case "security": {
        resultString = "Security - Data privacy and security concerns";
        break;
      }
      case "temperory": {
        resultString = "I'm pausing my membership for now";
        break;
      }
      case "better_fit": {
        resultString = "I've chosen a different platform that better fits my needs";
        break;
      }
      case "high_cost": {
        resultString = "The cost doesn’t feel justifiable for my needs";
        break;
      }
      case "not_required": {
        resultString = "I no longer need Spark for my business";
        break;
      }
      case "payment_issue": {
        resultString = "I had billing or payment issues";
        break;
      }
      case "others": {
        resultString = "Others";
        break;
      }
      default: {
        resultString = "";
      }
    }
    return resultString;
  }

  const getCancelledSubscriptionDetails = (type = 0) => {
    setIsLoading(true);
    const postData = {
      type: industryType,
      duration: timeLineVal,
      timeLineVal: theTimeLine,
      from: "active"
    }
    if(type == 1) {
      authFileFetcherByPost(`${getEndpointUrl(ENDPOINTS.downloadCancelledSubscriptionCsv)}`, postData).then((result) => {
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(result);
        link.download = "XDS_Cancelled_Subscriptions.csv";
        link.click();
      }).catch((err) => {
        console.log(err);
      }).finally(() => {
        setIsLoading(false);
      });
    } else {
      authPostdata(`${getEndpointUrl(ENDPOINTS.getCancelledSubscription)}`, postData).then((result) => {
        if(result && result.data) {
          setCancelledSubscriptions(result.data);
        }
      }).catch((err) => {
        console.log(err);
      }).finally(() => {
        setIsLoading(false);
      });
    }
  }

  function getTimeLineString(val: string): string {
    if(val == "month") {
      return "Monthly";
    } else if(val == "year") {
      return "Yearly";
    } 
    return "All";
  }

  useEffect(() => {
    getCancelledSubscriptionDetails();
  }, [industryType, timeLineVal, theTimeLine]);

  return(
    <>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:text-left">
          <h1 className="font-bold default_text_color header-font">
            Cancelled Subscriptions
          </h1>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 md:grid-cols-2 sm:grid-cols-2 pt-3" >
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
          <div>
            <Select id="theTimeLine" value={ theTimeLine }  onChange={(e) => setTheTimeLine(e.target.value)}>
              <option value="allTime">All Time</option>
              <option value="thisWeek">This Week</option>
              <option value="thisMonth">This Month</option>
            </Select>
          </div>
          <div>
          <button
                className="text-sm font-medium inline-flex items-center justify-center gap-1.5 border-gray-200 px-5 py-2 text-blue-300 transition hover:bg-gray-50 hover:text-blue-400 focus:outline-none"
                type="button"
                onClick={(e) => { e.preventDefault(); getCancelledSubscriptionDetails(1); }}
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
        cancelledSubscriptions.length > 0 &&
        <div>
          {getTimeLineString(timeLineVal)}: <span style={{color: "red"}}>[{ cancelledSubscriptions.length >= 10 ? cancelledSubscriptions.length : "0"+cancelledSubscriptions.length }]</span>
        </div>
      }
      <div className="py-6 datatable_style">
        <DataTable
          columns={columns}
          data={cancelledSubscriptions}
          highlightOnHover={true}
          pagination={true}
          defaultSortFieldId="cancellationDate" // Specify the default sorted column (e.g., 'name')
          defaultSortAsc={false}
          paginationPerPage={10}
          paginationTotalRows={cancelledSubscriptions.length}
          paginationRowsPerPageOptions={[10, 20, 50, 100, cancelledSubscriptions.length]}
          paginationComponentOptions={{
            rowsPerPageText: "Records per page:",
            rangeSeparatorText: "out of",
          }}
          progressPending={isLoading}
          progressComponent={<Spinner />}
        />
      </div>
      <Modal show={openDescriptionModal} onClose={() => setOpenDescriptionModal(false)}>
        <Modal.Header className="modal_header">
          <b>Details</b>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            <div className="">
              <div className="mb-2 block">
                <Label
                  htmlFor="comment"
                  className="font-bold text-xs"
                />
              </div>
              <Textarea
                id="comment"
                placeholder=""
                required
                rows={8}
                readOnly
                className="w-full focus:border-blue-500"
                value={description}
              />
              {/* <p className="pt-6 text-sm default_text_color">
                Note: Submissions are not anonymous. Our team will review this
                report and may contact you for further details.
              </p> */}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="modal_footer">
          {/* <Button
            className="h-[40px]"
            color="gray"
            onClick={() => setOpenModal(false)}
          >
            Cancel
          </Button> */}
          <Button
            className="h-[40px] button_blue"
            onClick={(e) => {
              e.preventDefault();
              setOpenDescriptionModal(false);
            }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );

}

export default CancelledSubscriptions;