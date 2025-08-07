import { PATH } from "@/constants/path";
import { useEffect, useRef, useState } from "react";
import { authFetcher } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import Chart, { ChartConfiguration } from 'chart.js/auto';
import Breadcrumbs from "./breadcrumb";
import 'chartjs-plugin-datalabels';
import { Bold } from "lucide-react";
import { Select } from "flowbite-react";
import Spinner from "./spinner";

interface lineChartuserTypes {
  label: string,
  data:number[]
};

const UserGeneralAccountStat = () => {

  const chartRef = useRef<HTMLCanvasElement>(null);
  const linechartRef = useRef<HTMLCanvasElement>(null);
  const [usersCount, setUsersCount] = useState<[freeUsers: number, monthlyTrial: number, yearlyTrial : number, monthlyUsers : number, oneYearUsers : number, paidusers : number]>([0,0,0,0,0,0]);
  
  const [lineChartUsers, setLineChartUsers] = useState<lineChartuserTypes[]>([]);
  const chartInstance = useRef<Chart<'pie', number[], string> | null>(null);
  const lineChartInstance = useRef<Chart<'line', number[], string> | null>(null);
  const [lebels, setLebels] = useState<string[]>([]);
  const [timeLine, setTimeline] = useState<string>('thisweek');
  const [pieChartLoader, setPieChartLoader] = useState<boolean>(false);
  const [lineChartLoader, setLineChartLoader] = useState<boolean>(false);

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
      label: "User General Account Stats",
      path: "",
    },
  ];

  useEffect(() => {
    const getUsercount = () => {
      setPieChartLoader(true);
      authFetcher(`${getEndpointUrl(ENDPOINTS.getUsersCountByType)}`)
      .then((result) => {
        if (result.data) {
          setUsersCount([result.data.result[0].freeUsers, result.data.result[0].monthlyUsers, result.data.result[0].oneYearUsers,result.data.result[0].paidmonthlyusers, result.data.result[0].paidyearlyusers, result.data.result[0].paidusers]);
          setPieChartLoader(false);
        }
      })
      .catch((err) => {
        setPieChartLoader(false);
        console.log(err);
      });
    }
    getUsercount();
  },[]);

  useEffect(() =>{
    const getLineChartCount = () => {
      setLineChartLoader(true);
      authFetcher(`${getEndpointUrl(ENDPOINTS.getLineChartUsersByType(timeLine))}`)
      .then((result) => {
        if (result.data.result[0]) {
          console.log(result.data.result[0]);
          setLebels(result.data.result[0].days);
          const linChartDataArray = result.data.result[0];
          if (linChartDataArray) {
            console.log(linChartDataArray.freeUsers);
            const dynamicDatasets = [
              {
                  label: 'Foundational Users',
                  data: linChartDataArray.freeUsers,
              },
              {
                  label: '30d Trail Users',
                  data: linChartDataArray.monthlyUsers,
              },
              {
                  label: '1y Membership Users',
                  data: linChartDataArray.oneYearUsers,
              },
              {
                  label: '30d Paid Premium Users',
                  data: linChartDataArray.paidmonthlyusers,
              },
              {
                  label: '1y Paid Premium Users',
                  data: linChartDataArray.paidyearlyusers,
              },
              {
                  label: 'Total Paid Premium Users',
                  data: linChartDataArray.paidusers,
              },
              {
                  label: 'Cancelled Users',
                  data: linChartDataArray.subscriptionCanceledUsers,
              },
          ];
          setLineChartUsers(dynamicDatasets);
          setLineChartLoader(false);
          }
          
        }
      })
      .catch((err) => {
        setLineChartLoader(false);
        console.log(err);
      });
    }
    getLineChartCount();
  },[timeLine]);

  useEffect(() => {
    if (chartRef.current && !pieChartLoader) {
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current?.destroy(); 
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }
        if (chartInstance) {
          chartInstance.current = new Chart(ctx, {
            type: 'pie',
            data: {
              labels: ['Foundational Users', '30d Trail Users', '1y Membership Users', '30d Paid Premium Users', '1y Paid Premium Users', 'Total Paid Premium Users'],
              datasets: [{
                label: 'Users Account statistics',
                data: usersCount,
                hoverOffset: 5
              }]
            },
            options: {
              plugins: {
                legend: {
                  position: 'right',
                  labels:{
                    boxWidth:80,
                    padding:20,
                  },
                  title:{font:{weight:'bold'}},
                  align: 'start',
                },
              
              }
            }
          });
        }
      }
    }

    if (linechartRef.current && !lineChartLoader) {
      const ctx = linechartRef.current.getContext('2d');
      if (ctx) {
        if (lineChartInstance.current) {
          lineChartInstance.current.destroy();
        }
        lineChartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: lebels,
            datasets: lineChartUsers && lineChartUsers?.length > 0 ? lineChartUsers.map((dataset) => ({
              label: dataset.label,
              data: dataset.data,
            })): [],
          },
          options: {
            plugins: {
              legend: {
                position: 'right',
                align: 'start',
                labels:{
                  boxWidth:100,
                  padding:20,
                },
                maxWidth: 1200,
                maxHeight:600,
              },
            },
            scales: {
              y: {
                beginAtZero: true,
              },
            },
          },
        });
      }
    }
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      if (lineChartInstance.current) {
        lineChartInstance.current.destroy();
      }
    };
  }, [usersCount, lineChartUsers, lebels]);

  return (
    <> 
      <div className="lg:col-span-4 border-l ps-8 most_active">
          <div className="pb-6 pt-6 breadcrumbs_s">
              <Breadcrumbs items={breadcrumbItems} />
          </div>
          <div className="sm:flex sm:items-center sm:justify-between pb-2">
              <div className="sm:text-left">
                <h1 className="font-bold default_text_color header-font">
                General Account Statistics
                </h1>
              </div>
          </div>
          <hr/>
          {/* <div className="sm:flex sm:items-center sm:justify-between pb-2"> */}
          <div className="pt-2">
            <b>Pie Chart</b>
            <div className="lg:w-[500px] lg:h-[500px] w-[300px] h-[300px] " style={{ position: 'relative' }}>
                { !pieChartLoader ?
                    <canvas ref={chartRef} ></canvas>
                    :
                    <div className="flex justify-center items-center absolute inset-0">
                      <Spinner />
                    </div>
                  }
            </div>
          </div>
          <hr/>
          <div className="pt-2 pb-14"><b>Line Chart</b>
            
            <div className=" sm:flex sm:items-center sm:justify-between ">
              <div className="sm:text-left">
              </div>
              <div className="text-sm mr-6">
              Timeline :
              <Select
                  id="Timeline"
                  onChange={(e) => setTimeline(e.target.value)}
                  className="pl-4 font-medium inline-flex items-center justify-center"
              >
                  <option value= "thisweek">This Week</option>
                  <option value= "thismonth">This Month</option>
                  <option value= "lastthreemonths">Past 3 Months</option>
                  <option value= "allusers">All Time</option>
              </Select>
              </div>
            </div>
              <div className="lg:w-[784px] lg:h-[392px] w-[300px] h-[300px]" style={{ position: 'relative' }}>
              { !lineChartLoader ? 
                  <canvas ref={linechartRef}></canvas>
                  :
                  <div className="flex justify-center items-center absolute inset-0">
                    <Spinner />
                  </div>
                }
            </div>
            </div>
      </div>
    </>
    
  );
};

export default UserGeneralAccountStat;
