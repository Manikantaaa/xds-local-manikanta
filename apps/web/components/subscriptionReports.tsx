import { PATH } from "@/constants/path";
import { useState } from "react";
import Spinner from "@/components/spinner";
import Breadcrumbs from "./breadcrumb";
import CancelledSubscriptions from "./subscriptions/cancelledSubscriptions";
import ActiveSubscriptions from "./subscriptions/activeSubscriptions";
import NewSubscriptions from "./subscriptions/newSubscriptions";
import UpcomingRenewals from "./subscriptions/upcomingRenewals";
import FailedSubscriptions from "./subscriptions/failed-subscriptions";
import ReSubscriptions from "./subscriptions/resubscribers";

const SubscriptionReports = () => {
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
      label: "Subscriptions",
      path: "Subscriptions",
    },
  ];

  const [isLoading, setIsLoading] = useState(false);
  
  return(
    <>
      {
        isLoading ? 
        <div className="lg:col-span-4 border-l ps-8 most_active">
          <div className="min-h-[90vh] flex justify-center items-center">
            <Spinner />
          </div>
        </div>
        :
        <div className="lg:col-span-4 border-l ps-8 most_active">
          <div className="pb-6 pt-6 breadcrumbs_s">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
          <ActiveSubscriptions></ActiveSubscriptions>
          <UpcomingRenewals></UpcomingRenewals>
          <NewSubscriptions></NewSubscriptions>
          <CancelledSubscriptions></CancelledSubscriptions>
          {/* <ReSubscriptions></ReSubscriptions> */}
          <FailedSubscriptions></FailedSubscriptions>
        </div>
      }
    </>
  )
}

export default SubscriptionReports;