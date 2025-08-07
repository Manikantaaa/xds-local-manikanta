import { PATH } from "@/constants/path";
import Breadcrumbs from "./breadcrumb";
import { Button, Select } from "flowbite-react";
import { useEffect, useState } from "react";
import { authPostdata } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import DataTable from "react-data-table-component";
import Spinner from "@/components/spinner";

export type SearchFilterStats = {
  searches: {
    searchText: string,
    count: number
  },
  services: {
    searchText: string,
    count: number
  },
  capabilities: {
    searchText: string,
    count: number
  },
}

const FiltersAndSearchStats = () => {

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
      label: "Filter & Search Stats",
      path: "Filter & Search Stats",
    },
  ];
  const [timeLineVal, setTimeLineVal] = useState("all"); 
  const [industryType, setIndustryType] = useState("");
  const [fromPlace, setFromPlace] = useState("browse_sp");
  const [searchFilterStats, setSearchFilterStats] = useState<SearchFilterStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const columns = [
    {
      name: "Search Words/Phrases",
      cell: (row: SearchFilterStats) => (
        <div>
          {
            row.searches?.searchText && 
            <div>
              <span>{row.searches?.searchText}</span>
              <span style={{color: "red"}}> ({row.searches?.count})</span>
            </div>
          }
        </div>
      ),
      sortable: true,
      sortFunction: (a: SearchFilterStats, b: SearchFilterStats) => {
        return Number(a.searches?.count) - Number(b.searches?.count)
      } 
    },
    {
      name: "Core Services Filter",
      cell: (row: SearchFilterStats) => (
        <div> 
          {
            row.services?.searchText && 
            <div>
              <span>{row.services?.searchText}</span>
              <span style={{color: "red"}}> ({row.services?.count})</span>
            </div>
          }
        </div>
      ),
      sortable: true,
      sortFunction: (a: SearchFilterStats, b: SearchFilterStats) => {
        return Number(a.services?.count) - Number(b.services?.count)
      } 
    },
    {
      name: "Sub-Services Filter",
      cell: (row: SearchFilterStats) => (
        <div>
          {
            row.capabilities?.searchText &&
            <div>
              <span>{row.capabilities?.searchText}</span>
              <span style={{color: "red"}}> ({row.capabilities?.count})</span>
            </div>
          }
        </div>
      ),
      sortable: true,
      sortFunction: (a: SearchFilterStats, b: SearchFilterStats) => {
        return Number(a.capabilities?.count) - Number(b.capabilities?.count)
      } 
      // sortFunction: (a: SearchFilterStats, b: SearchFilterStats) => getCorrectString(a.capabilities?.searchText).localeCompare(getCorrectString(b.capabilities?.searchText)),
    },
  ];

  const onChangeTimeLineValue = (val: string) => {
    if(val && val != "") {
      setTimeLineVal(val);
    }
  }

  const onChangeIndustryType = (val: string) => {
    setIndustryType(val);
    if(val && val == "buyer") {
      onChangeFromPlace("browse_sp");
    }
  }

  const onChangeFromPlace = (val: string) => {
    if(val && val != "") {
      setFromPlace(val);
    }
  }

  const onClickGet = () => {
    setIsLoading(true);
    let currentDate = new Date();
    let formattedEndDate = "";
    if(timeLineVal == "all") {
      formattedEndDate = "";
    } else if(timeLineVal == "week") {
      const diff = currentDate.getDay() - 1;
      const monday = new Date(currentDate);
      monday.setDate(currentDate.getDate() - diff);
      formattedEndDate = monday.toISOString().split('T')[0];

      // endDate.setDate(endDate.getDate() - 7);
      // formattedEndDate = endDate.toISOString().split('T')[0];
    } else if(timeLineVal == "month") {
      formattedEndDate = getDateAfterMonths(currentDate, 1);
    } else if(timeLineVal == "threeMonths") {
      formattedEndDate = getDateAfterMonths(currentDate, 2);
    }
    const formattedCurrentDate = currentDate.toISOString().split('T')[0];
    const postData = {
      type: industryType,
      startDate: formattedCurrentDate,
      endDate: formattedEndDate,
      fromPlace: fromPlace
    }
    authPostdata(`${getEndpointUrl(ENDPOINTS.getFiltersAndServiceStats)}`, postData).then((result) => {
      if(result.success && result.data) {
        setSearchFilterStats(result.data);
        setIsLoading(false);
      }
    }).catch((err) => {
      console.log(err);
    });
  }

  function getDateAfterMonths(currentDate: Date, months: number): string {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    let oneMonthLaterMonth = currentMonth - months;
    let oneMonthLaterYear = currentYear;
    if (oneMonthLaterMonth > 11) {
      oneMonthLaterMonth = 0; // January
      oneMonthLaterYear++;
    }
    const oneMonthLater = new Date(oneMonthLaterYear, oneMonthLaterMonth, 1);
    oneMonthLater.setDate(oneMonthLater.getDate() + 1);
    const formattedDate = oneMonthLater.toISOString().split('T')[0];
    return formattedDate
  }

  // function getCorrectString(val="") {
  //   if(val && val != "") {
  //     return val;
  //   }
  //   return "";
  // }

  useEffect(() => {
    onClickGet();
  }, [timeLineVal, fromPlace, industryType])

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
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="sm:text-left">
            <h1 className="font-bold default_text_color header-font">
              Filter & Search Stats
            </h1>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 md:grid-cols-2 sm:grid-cols-2 pt-3" >
          <div> 
            <Select id="timeLine" value={ timeLineVal } onChange={(e) => onChangeTimeLineValue(e.target.value)}>
              <option value="all">All Time</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="threeMonths">Past 3 Months</option>
            </Select>
          </div>
          
          <div>
            <Select id="industryType" value={ industryType } onChange={(e) => onChangeIndustryType(e.target.value)}>
              <option value="">All Users</option>
              <option value="service_provider">Service Provider</option>
              <option value="buyer">Buyer</option>
            </Select>
          </div>

          {
            (industryType == "service_provider") ?
            <div>
              <Select id="fromPlace" value={ fromPlace } onChange={(e) => onChangeFromPlace(e.target.value)}>
                <option value="browse_sp">Browse Service Providers</option>
                <option value="broswe_opp">Browse Opportunities</option>
              </Select>
            </div>
            :
            ""
          }
        </div>
        <div className="py-6 datatable_style">
          <DataTable
            columns={columns}
            data={searchFilterStats}
            highlightOnHover={true}
            pagination={true}
            paginationPerPage={10}
            paginationTotalRows={searchFilterStats.length}
            paginationRowsPerPageOptions={[10, 20, 50, 100, searchFilterStats.length]}
            paginationComponentOptions={{
              rowsPerPageText: "Records per page:",
              rangeSeparatorText: "out of",
            }}
          />
        </div>
      </div>
    }
    </>
  );

}

export default FiltersAndSearchStats;