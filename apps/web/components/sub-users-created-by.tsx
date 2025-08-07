"use client";

import { PATH } from "@/constants/path";
import Breadcrumbs from "./breadcrumb";
import { useEffect, useState } from "react";
import { authFetcher } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { Card } from "flowbite-react";

const SubUsersCreatedBy = () => {

  const [usersBySp, setUseresBySp] = useState(0);
  const [usersByBuyer, setUseresByBuyer] = useState(0);

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
      label: "Users Created by Customers",
      path: "Users Created by Customers",
    },
  ];

  useEffect(() => {
    fetchSubUsersCounts();
  }, []);

  const fetchSubUsersCounts = async() => {
    const theUsersCounts = await authFetcher(`${getEndpointUrl(ENDPOINTS.getSubUsersCount)}`);
    console.log(theUsersCounts);
    if(theUsersCounts && theUsersCounts.data) {
      setUseresByBuyer(theUsersCounts.data.subUsersCreatedByBuyer);
      setUseresBySp(theUsersCounts.data.subUsersCreatedBySp);
    }
  }

  return(
    <div className="lg:col-span-4 border-l ps-8 most_active">
      <div className="pb-6 pt-6 breadcrumbs_s">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:text-left">
          <h1 className="font-bold default_text_color header-font">
            Users Created by Customers
          </h1>
        </div>
      </div>
      <div className="py-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card href="#" className="max-w-sm text-center">
          <h5 className="font-bold tracking-tight text-gray-900 dark:text-white">
            { usersByBuyer }
          </h5>
          <p className="font-normal text-gray-700 dark:text-gray-400">
            Users created by Buyers
          </p>
        </Card>
        <Card href="#" className="max-w-sm text-center">
          <h5 className="font-bold tracking-tight text-gray-900 dark:text-white">
          { usersBySp }
          </h5>
          <p className="font-normal text-gray-700 dark:text-gray-400">
            Users created by Service Providers
          </p>
        </Card>
      </div>
    </div>
  );

}

export default SubUsersCreatedBy;