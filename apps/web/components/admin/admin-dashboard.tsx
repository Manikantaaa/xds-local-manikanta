"use client";
import Breadcrumbs from "@/components/breadcrumb";
import Spinner from "@/components/spinner";
import { getEndpointUrl, ENDPOINTS } from "@/constants/endpoints";
import { PATH } from "@/constants/path";
import { fetcher } from "@/hooks/fetcher";
import { formatNumberIndianWithRegex } from "@/services/common-methods";
import Chart from 'chart.js/auto';
import { useState, useRef, useEffect } from "react";
import { IncreaseSVG } from "../ui/increaseSvg";
import { DecreaseSVG } from "../ui/decreaseSvg";


export interface ReportsSidebarProps {
    setReprotType: (val: string) => void;
}

const Dashboard = (props: ReportsSidebarProps) => {
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
            label: "Dashboard",
            path: "dashboard",
        },
    ];

    const [dashboardData, setDashboardData] = useState<any>(null);
    const [listsdata, setListsdata] = useState<any>(null);
    const [stripeData, setStripedata] = useState<any>(null);
    const [mailchimpData, setMailchimpData] = useState<any>(null);
    const [mailchimpDataMainCount, setMailchimpDataMainCount] = useState<any>(null);
    const [mailchimpDataMainChange, setMailchimpDataMainChange] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<unknown>("");
    const chartInstance = useRef<Chart<'pie', number[], string> | null>(null);
    const subscribersChartRef = useRef<HTMLCanvasElement>(null);
    const locationByChartRef = useRef<HTMLCanvasElement>(null);
    const [pieChartLoader, setPieChartLoader] = useState<boolean>(false);
    const [listdataFetched, setListdataFetched] = useState<boolean>(false);
    const [stripeDataFetched, setStripedataFetched] = useState<boolean>(false);
    const [mailchimpDataFetched, setMailchimpDataFetched] = useState<boolean>(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const dashboardResult = await fetcher(getEndpointUrl(ENDPOINTS.getAdminDashboardReports));
                setDashboardData(dashboardResult);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchChartData = async () => {
            try {
                const chartResult = await fetcher(getEndpointUrl(ENDPOINTS.getAdminChartsReports));
                const chartData = chartResult;

                // Handle chart data here
                setTimeout(() => {
                    if (subscribersChartRef.current && !pieChartLoader && locationByChartRef.current) {
                        const SubscribersCtx = subscribersChartRef.current.getContext('2d');
                        const locationByCtx = locationByChartRef.current.getContext('2d');
                        if (SubscribersCtx && locationByCtx) {
                            if (chartInstance.current) {
                                chartInstance.current.destroy();
                            }
                            if (chartInstance && chartData.OverallSubscribersMonthlyAndYearly && chartData.OverallSubscribersMonthlyAndYearly[0]) {
                                chartInstance.current = new Chart(SubscribersCtx, {
                                    type: 'pie',
                                    data: {
                                        labels: ['Monthly Subscribers', 'Yearly Subscribers'],
                                        datasets: [{
                                            label: 'Subscribers Statistics',
                                            data: [chartData.OverallSubscribersMonthlyAndYearly[0]._count.id, chartData.OverallSubscribersMonthlyAndYearly[1]._count.id],
                                            backgroundColor: ['#ff6384', '#36a2eb'],
                                            hoverOffset: 5
                                        }]
                                    },
                                    options: {
                                        plugins: {
                                            legend: {
                                                position: 'right',
                                                labels: {
                                                    boxWidth: 80,
                                                    padding: 20,
                                                },
                                                title: { font: { weight: 'bold' } },
                                                align: 'start',
                                            },
                                        }
                                    }
                                });
                            }

                            if (chartData.activeBuyersByRegion) {
                                chartData.activeBuyersByRegion.sort((a: { region: string; }, b: { region: string; }) => {
                                    if (a.region === "Other") return -1; // "Other" should come first
                                    if (b.region === "Other") return 1;  // "Other" should come first
                                    return a.region.localeCompare(b.region); // Sort remaining regions alphabetically
                                });
                                if (locationByCtx) {
                                    chartInstance.current = new Chart(locationByCtx, {
                                        type: 'pie',
                                        data: {
                                            labels: chartData.activeBuyersByRegion.map((regions: { region: string; }) => regions.region),
                                            datasets: [{
                                                label: 'User Account Statistics',
                                                data: chartData.activeBuyersByRegion.map((regions: { regionCount: number; }) => regions.regionCount),
                                                backgroundColor: ["#2caffe", "#544fc5", "#00e272", "#6b8abc", "#d568fb", "#2ee0ca", "feb56a"],
                                                hoverOffset: 5
                                            }]
                                        },
                                        options: {
                                            plugins: {
                                                legend: {
                                                    position: 'right',
                                                    labels: {
                                                        boxWidth: 80,
                                                        padding: 20,
                                                    },
                                                    title: { font: { weight: 'bold' } },
                                                    align: 'start',
                                                },
                                            }
                                        }
                                    });
                                }
                            }
                        }
                    }
                }, 500);
            } catch (error) {
                console.error('Error fetching chart data:', error);
            } finally {
                setPieChartLoader(false);
            }
        };

        const fetchListData = async () => {
            try {
                const listResult = await fetcher(getEndpointUrl(ENDPOINTS.getAdminListsDataReports));
                setListsdata(listResult);
            } catch (error) {
                console.error('Error fetching list data:', error);
            } finally {
                setListdataFetched(true);
            }
        };

        const fetchStripeData = async () => {
            try {
                const stripeResult = await fetcher(getEndpointUrl(ENDPOINTS.getAdminStripeReports));
                setStripedata(stripeResult);
            } catch (error) {
                console.error('Error fetching Stripe data:', error);
            } finally {
                setStripedataFetched(true);
            }
        };

        const fetchMailchimpData = async () => {
            try {
                const mailchimpResult = await fetcher(getEndpointUrl(ENDPOINTS.getAdminMailChimpReports("listCount")));
                setMailchimpDataMainCount(mailchimpResult);
            } catch (error) {
                console.error('Error fetching MailChimp data:', error);
            } finally {
                setMailchimpDataFetched(true);
            }
        };
        const fetchMailchimpDataLists = async () => {
            try {
                const mailchimpResult = await fetcher(getEndpointUrl(ENDPOINTS.getAdminMailChimpReports("listPercent")));
                setMailchimpDataMainChange(mailchimpResult);
            } catch (error) {
                console.error('Error fetching MailChimp data:', error);
            } finally {
                setMailchimpDataFetched(true);
            }
        };
        const fetchMailchimpDataMainList = async () => {
            try {
                const mailchimpResult = await fetcher(getEndpointUrl(ENDPOINTS.getAdminMailChimpReports("listsData")));
                setMailchimpData(mailchimpResult);
            } catch (error) {
                console.error('Error fetching MailChimp data:', error);
            } finally {
                setMailchimpDataFetched(true);
            }
        };

        // Fetch all data independently
        fetchStripeData();

        fetchDashboardData();
        fetchChartData();
        fetchListData();

        fetchMailchimpData();
        fetchMailchimpDataLists();
        fetchMailchimpDataMainList();
    }, []);


    return (
        <>
            {!loading ?
                <div className="lg:col-span-4 border-l lg:ps-8 most_active lg:px-5 pos_r pb-6">
                    <div className="pb-6 pt-6 breadcrumbs_s">
                        <Breadcrumbs items={breadcrumbItems} />
                    </div>
                    <div>
                        <div className="pt-0">
                            <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
                                <div className="box_1 ">
                                    <div className="relative block overflow-hidden rounded-lg border border-[#dedede] card_box_shadow">
                                        <p className="text-[16px] bg-[#35b653] p-2.5 font-bold text-[#fff]">
                                            Premium Active Buyers </p>
                                        <div className="sm:flex sm:justify-between sm:gap-4 p-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-[#000] sm:text-xl">

                                                    {dashboardData?.response.response.premiumActiveBuyers.count}
                                                </h3>
                                                {dashboardData?.response.response.premiumActiveBuyers.change >= 0 ?
                                                    <p className="text-xs font-semibold mt-1 text-[#35b653]">
                                                        <IncreaseSVG />
                                                        {dashboardData?.response.response.premiumActiveBuyers.change}% increase vs past month
                                                    </p>
                                                    :
                                                    <p className="text-xs font-semibold mt-1 text-[#dc3545]">
                                                        <DecreaseSVG />
                                                        {Math.abs(dashboardData?.response.response.premiumActiveBuyers.change)}% decrease vs past month</p>
                                                }
                                            </div>

                                            <div className="hidden sm:block sm:shrink-0">
                                                <svg fill="#35b653" width="50" height="50" id="fi_17267393" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" data-name="Layer 1"><path d="m276.171 411.434a5.827 5.827 0 0 1 -.484.625l-25.708 33.252 39.357 2.382a5.983 5.983 0 0 1 4.664 2.707l21.728 32.873 24.9-60.731a137.448 137.448 0 0 1 -12.808-9.272 137.607 137.607 0 0 1 -20.386-3.661 134.523 134.523 0 0 1 -21.2-7.391 5.97 5.97 0 0 1 -1.9-1.337l-8.16 10.555zm55.929-88.967a6 6 0 0 1 8.484-8.484l16.326 16.326 36.843-36.842a6 6 0 0 1 8.484 8.484l-41.085 41.084a6 6 0 0 1 -8.484 0zm35.068-74.767a70.548 70.548 0 1 0 70.549 70.548 70.55 70.55 0 0 0 -70.549-70.548zm0 12a58.548 58.548 0 1 0 58.548 58.548 58.546 58.546 0 0 0 -58.548-58.548zm-16.1 168.882-28.458 69.432a5.987 5.987 0 0 1 -10.633 1.3l-26.338-39.847-47.664-2.886a6.007 6.007 0 0 1 -4.383-9.628l22.282-28.82c-63.116 13.781-139.885 8.047-192.652-18.333-32.877-16.438-53.212-39.59-53.212-65.558 0-72.805 72.835-118.642 137.282-131.76a100.179 100.179 0 1 1 78.069 0 220.916 220.916 0 0 1 71.025 27.773q5.494-1.928 11.042-3.352a137.6 137.6 0 0 1 20.387-3.661 136.952 136.952 0 0 1 16.979-11.842 134.635 134.635 0 0 1 20.241-9.771 5.972 5.972 0 0 1 4.266 0 134.4 134.4 0 0 1 20.226 9.766 137.261 137.261 0 0 1 16.984 11.839 137.583 137.583 0 0 1 20.393 3.66 134.476 134.476 0 0 1 21.206 7.393 5.952 5.952 0 0 1 3.023 3.023 134.421 134.421 0 0 1 7.393 21.207 137.56 137.56 0 0 1 3.66 20.393 137.066 137.066 0 0 1 11.839 16.983 134.4 134.4 0 0 1 9.766 20.226 5.964 5.964 0 0 1 0 4.265 134.41 134.41 0 0 1 -9.766 20.227 137.174 137.174 0 0 1 -11.839 16.983 137.548 137.548 0 0 1 -3.66 20.392q-1.337 5.185-3.107 10.337l45.326 58.625a6.008 6.008 0 0 1 -4.384 9.628l-47.661 2.889-26.34 39.847a5.987 5.987 0 0 1 -10.633-1.3l-28.463-69.43a133.779 133.779 0 0 1 -13.963 6.29 5.964 5.964 0 0 1 -4.265 0 133.785 133.785 0 0 1 -13.964-6.288zm-67.482-192a5.935 5.935 0 0 0 -.387.728 134.444 134.444 0 0 0 -7.391 21.2 137.632 137.632 0 0 0 -3.661 20.388 137.122 137.122 0 0 0 -11.835 16.978 134.466 134.466 0 0 0 -9.77 20.239 5.97 5.97 0 0 0 0 4.265 134.441 134.441 0 0 0 9.764 20.222 137.114 137.114 0 0 0 11.835 16.98 137.508 137.508 0 0 0 3.66 20.387q1.34 5.192 3.113 10.351l-11.23 14.525a278.975 278.975 0 0 1 -38.156 7.75c-55.41 7.384-117.564.212-160.966-21.489-28.762-14.379-46.552-33.806-46.552-54.868 0-34.748 19.153-63.336 46.555-84.232 33.524-25.564 79.191-39.64 117.757-39.64 32.464 0 68.192 9.888 97.268 26.215zm7.583 150.509a123.267 123.267 0 0 1 -7.253-32.406 5.97 5.97 0 0 0 -1.594-3.581 125.478 125.478 0 0 1 -11.705-16.592 122.361 122.361 0 0 1 -8.033-16.261 122.476 122.476 0 0 1 8.04-16.277 125.3 125.3 0 0 1 11.915-16.841 5.961 5.961 0 0 0 1.374-3.329h.009a125.379 125.379 0 0 1 3.464-20.338 122.127 122.127 0 0 1 5.819-17.175 122.263 122.263 0 0 1 17.172-5.819 125.48 125.48 0 0 1 20.336-3.463 5.973 5.973 0 0 0 3.582-1.595 125.111 125.111 0 0 1 16.589-11.7 122.579 122.579 0 0 1 16.28-8.041 122.36 122.36 0 0 1 16.265 8.035 125.587 125.587 0 0 1 16.848 11.919 5.961 5.961 0 0 0 3.333 1.373v.009a125.54 125.54 0 0 1 20.341 3.463 122.3 122.3 0 0 1 17.178 5.82 122.342 122.342 0 0 1 5.82 17.178 125.558 125.558 0 0 1 3.463 20.341 5.978 5.978 0 0 0 1.594 3.582 125.359 125.359 0 0 1 11.708 16.594 122.36 122.36 0 0 1 8.035 16.265 122.36 122.36 0 0 1 -8.035 16.265 125.512 125.512 0 0 1 -11.919 16.847 5.961 5.961 0 0 0 -1.374 3.329h-.009c-.89 10.134-3.447 22.755-7.247 32.4l-2.036 5.123a122.525 122.525 0 0 1 -17.19 5.826 125.4 125.4 0 0 1 -20.339 3.458 5.977 5.977 0 0 0 -3.581 1.593 125.385 125.385 0 0 1 -16.59 11.7 122.421 122.421 0 0 1 -16.261 8.033 122.476 122.476 0 0 1 -16.277-8.04 125.192 125.192 0 0 1 -16.845-11.916 5.971 5.971 0 0 0 -3.329-1.374v-.008a125.471 125.471 0 0 1 -20.335-3.464 122.232 122.232 0 0 1 -17.173-5.819l-2.036-5.12zm158.832 13.789a5.971 5.971 0 0 1 -1.895 1.337 134.542 134.542 0 0 1 -21.219 7.4 137.39 137.39 0 0 1 -20.389 3.662 137.52 137.52 0 0 1 -12.79 9.26l24.9 60.735 21.73-32.874a5.979 5.979 0 0 1 4.662-2.707l39.356-2.382-34.352-44.432zm-263.679-378.872a88.179 88.179 0 1 0 88.178 88.179 88.176 88.176 0 0 0 -88.178-88.179z" fill-rule="evenodd"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="box_2">
                                    <div className="relative block overflow-hidden rounded-lg border border-[#dedede] card_box_shadow">
                                        <p className="text-[16px] bg-[#0d6efd] p-2.5 font-bold text-[#fff]">
                                            Foundational Active Buyers </p>
                                        <div className="sm:flex sm:justify-between sm:gap-4 p-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-[#000] sm:text-xl">
                                                    {dashboardData?.response.response.foundationalActiveBuyers.count}
                                                </h3>
                                                {dashboardData?.response.response.foundationalActiveBuyers.change >= 0 ?
                                                    <p className="text-xs font-semibold mt-1 text-[#35b653]">
                                                        <IncreaseSVG />
                                                        {dashboardData?.response.response.foundationalActiveBuyers.change}% increase vs past month
                                                    </p>
                                                    :
                                                    <p className="text-xs font-semibold mt-1 text-[#dc3545]">
                                                        <DecreaseSVG />
                                                        {Math.abs(dashboardData?.response.response.foundationalActiveBuyers.change)}% decrease vs past month</p>
                                                }

                                            </div>
                                            <div className="hidden sm:block sm:shrink-0">
                                                <svg fill="#0d6efd" width="50" height="50" id="fi_16321395" enable-background="new 0 0 512 512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2_00000058564519713283845120000012092167880326801286_"><g id="Layer_1_copy_13"><g id="_125"><path d="m511.4 292.8c-15.8-66.6-61.2-116.8-116.5-133.1 41.5-21.3 57.9-72.3 36.5-113.9-21.3-41.5-72.3-57.8-113.8-36.5s-57.9 72.3-36.5 113.9c8.1 15.7 20.8 28.5 36.5 36.5-35.1 10.3-66.2 34.3-88.3 67.5-10.9-6.7-22.7-11.9-35-15.5 41.5-21.3 57.9-72.3 36.6-113.8s-72.3-57.9-113.8-36.6-57.9 72.3-36.6 113.8c8.1 15.7 20.9 28.5 36.6 36.6-55.3 16.2-100.7 66.4-116.5 133.1-1.7 6.9-.1 14.2 4.3 19.9 35.9 47 91.7 74.6 150.8 74.4 10.2 0 20.3-.8 30.4-2.4 30.1 65.1 107.2 93.5 172.3 63.4 45.9-21.2 75.4-67.2 75.4-117.8 0-3.8-.2-7.6-.5-11.3 29.1-12.9 54.5-32.9 73.8-58.2 3.2-4.1 4.9-9.2 4.9-14.4 0-2-.2-3.8-.6-5.6zm-224.6-208.3c0-38.4 31.1-69.5 69.5-69.5s69.5 31.1 69.5 69.5-31.1 69.5-69.5 69.5c-38.4 0-69.5-31.1-69.5-69.5zm-200.5 52c0-38.4 31.1-69.5 69.5-69.5s69.5 31.1 69.5 69.5-31.1 69.5-69.5 69.5c-38.4 0-69.5-31.1-69.5-69.5zm69.4 287.5c-54.5.2-105.9-25.2-138.9-68.5-1.6-2.1-2.2-4.7-1.6-7.2 17.8-74.9 75.6-127.1 140.5-127.1 23.4 0 45.8 6.7 65.8 18.9 4.3 2.6 8.5 5.5 12.5 8.6 3.3 2.5 6.6 5.2 9.7 8 2.5 2.3 4.9 4.6 7.3 7-60.6 27.1-91 95.4-70.5 158.6-8.2 1.1-16.5 1.7-24.8 1.7zm263-41.8c0 63.4-51.3 114.8-114.7 114.8-43.5 0-83.2-24.5-102.6-63.4-2.3-4.6-4.3-9.3-5.9-14.1-19.8-57.9 9.2-121.1 66-143.9 5-2 10-3.6 15.2-4.9 61.6-15 123.7 22.7 138.8 84.3.5 2.1 1 4.2 1.4 6.3.9 5.1 1.5 10.2 1.8 15.4zm76.5-78.6c-17 22.1-39 39.9-64.2 51.8-12.4-58.8-64.6-103-127-103-12.8 0-25.5 1.9-37.7 5.6-7.4-8.2-15.6-15.7-24.4-22.3 27.1-40.9 69.1-66.5 114.5-66.5 65 0 122.7 52.3 140.5 127.1.4 2.5-.1 5.2-1.7 7.3z"></path><path d="m361.3 329.3-89.3 89.3-33.1-33.1c-3-3-8-3-11 0s-3 8 0 11l38.6 38.6c3 3 8 3 11 0l94.8-94.8c3-3 3-8 0-11s-8-3.1-11 0z"></path></g></g></g></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="box_3">
                                    <div className="relative block overflow-hidden rounded-lg border border-[#dedede] card_box_shadow">
                                        <p className="text-[16px] bg-[#4650dd] p-2.5 font-bold text-[#fff]">
                                            Premium Active SP's </p>
                                        <div className="sm:flex sm:justify-between sm:gap-4 p-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-[#000] sm:text-xl">
                                                    {dashboardData?.response.response.premiumActiveSPs.count}
                                                </h3>
                                                {dashboardData?.response.response.premiumActiveSPs.change >= 0 ?
                                                    <p className="text-xs font-semibold mt-1 text-[#35b653]">
                                                        <IncreaseSVG />
                                                        {dashboardData?.response.response.premiumActiveSPs.change}% increase vs past month
                                                    </p>
                                                    :
                                                    <p className="text-xs font-semibold mt-1 text-[#dc3545]">
                                                        <DecreaseSVG />
                                                        {Math.abs(dashboardData?.response.response.premiumActiveSPs.change)}% decrease vs past month</p>
                                                }

                                            </div>

                                            <div className="hidden sm:block sm:shrink-0">
                                                <svg fill="#4650dd" width="45" height="45" id="fi_17492568" enable-background="new 0 0 512 512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><g><g><path d="m233.1 275.7c-47.7 0-91.3-24.2-116.6-64.7-13.6-21.8-20.8-46.9-20.8-72.7 0-36.8 14.4-71.4 40.5-97.4 25.9-25.8 60.3-40 96.9-40h.8c36.6.2 71 14.7 96.8 40.9 25.9 26.2 40 60.8 39.8 97.4-.2 25.5-7.4 50.3-20.8 71.8-25.3 40.5-68.9 64.7-116.6 64.7zm0-246.4c-29 0-56.3 11.3-76.9 31.7-20.7 20.6-32.1 48.1-32.1 77.3 0 20.5 5.7 40.4 16.5 57.7 20.1 32.2 54.7 51.3 92.5 51.3 37.9 0 72.4-19.2 92.5-51.3 10.7-17 16.4-36.7 16.5-56.9.2-29-11-56.5-31.6-77.3-20.5-20.8-47.8-32.3-76.8-32.5-.2 0-.4 0-.6 0z"></path></g><g><path d="m464.9 511h-81.5c-26 0-47.1-21.1-47.1-47.1v-94.7c0-9 5.4-16.9 13.8-20.2 9.9-3.9 21.4.3 26.7 9.8l15.1 27.2 12-32.7c1.3-3.7 3.6-6.8 6.4-9.2 8-6.6 19.6-6.6 27.6 0 2.9 2.4 5.1 5.5 6.4 9.2l12.1 32.8 15.2-27.3c5.3-9.5 16.7-13.7 26.7-9.8 8.4 3.3 13.8 11.2 13.8 20.2v94.8c-.1 25.9-21.2 47-47.2 47zm-100.2-115.5v68.5c0 10.3 8.4 18.7 18.7 18.7h81.5c10.3 0 18.7-8.4 18.7-18.7v-68.5l-9.7 17.5c-4.9 8.9-15.4 13.2-25 10.4-5.3-1.6-9.8-5.1-12.6-9.9-.4-.7-.8-1.4-1-2.2l-11.2-30.6-11.2 30.5c-.3.8-.6 1.5-1 2.2-2.8 4.8-7.2 8.3-12.6 9.9-9.6 2.9-20.1-1.5-25-10.4z"></path></g><g><path d="m233.1 480.9c-78.2 0-153-24.1-216.3-69.6-13.6-9.8-19.8-27.4-15.4-43.7 5.8-21.3 14.5-41.7 25.9-60.6 35.3-58.7 106.7-85.3 173.5-64.5 10.4 3.2 21.3 4.9 32.3 4.9s21.9-1.6 32.3-4.9c57.1-17.7 119-.8 157.7 43 3.5 4 4.5 9.7 2.5 14.6-2 5-6.6 8.4-11.9 8.9-59.6 5.3-106.3 56.3-106.3 116.2 0 10.8 1.5 21.5 4.4 31.8 1.1 3.8.5 8-1.6 11.3-2.1 3.4-5.5 5.7-9.5 6.4-22.1 4.1-44.9 6.2-67.6 6.2zm-78.2-217.1c-41.9 0-81.3 21.1-103.4 57.8-10 16.7-17.7 34.7-22.8 53.4-1.4 5 .5 10.4 4.6 13.3 58.4 42 127.5 64.2 199.7 64.2 16.1 0 32.2-1.1 48-3.4-1.3-7.9-2-16-2-24 0-36.5 13.6-71.3 38.3-98.2 17.7-19.3 40-33.2 64.6-40.6-30.6-21.8-70.7-28.5-108.3-16.8-13.1 4.1-26.8 6.1-40.7 6.1s-27.6-2.1-40.7-6.1c-12.2-3.8-24.9-5.7-37.3-5.7z"></path></g></g></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="box_4">
                                    <div className="relative block overflow-hidden rounded-lg border border-[#dedede] card_box_shadow">
                                        <p className="text-[16px] bg-[#dc3545] p-2.5 font-bold text-[#fff]">
                                            Foundational Active SP's</p>
                                        <div className="sm:flex sm:justify-between sm:gap-4 p-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-[#000] sm:text-xl">
                                                    {dashboardData?.response.response.foundationalActiveSPs.count}
                                                </h3>
                                                {dashboardData?.response.response.foundationalActiveSPs.change >= 0 ?
                                                    <p className="text-xs font-semibold mt-1 text-[#35b653]">

                                                        <IncreaseSVG />
                                                        {dashboardData?.response.response.foundationalActiveSPs.change}% increase vs past month
                                                    </p>
                                                    :
                                                    <p className="text-xs font-semibold mt-1 text-[#dc3545]">
                                                        <DecreaseSVG />
                                                        {Math.abs(dashboardData?.response.response.foundationalActiveSPs.change)}% decrease vs past month</p>
                                                }

                                            </div>

                                            <div className="hidden sm:block sm:shrink-0">
                                                <svg fill="#dc3545" width="50" height="50" id="fi_9653688" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="m46.91457 29.22418a13.09645 13.09645 0 0 0 -10.16257 4.83624l-4.01273-1.33787c-.04541-.01521-.09209-.02517-.13756-.04 12.17594-5.71455 8.3697-23.94434-5.26277-24.14555-14.04629.51931-17.09135 18.22671-5.39678 24.18484l-10.60384 3.52451a10.77775 10.77775 0 0 0 -7.3722 10.24139v5.05593a3.80383 3.80383 0 0 0 3.79463 3.8044h37.50725a13.12792 13.12792 0 0 0 1.64658.11489c17.39634-.71696 17.40777-25.51708-.00001-26.23878zm-30.226-8.03365a10.66328 10.66328 0 0 1 10.65056-10.65107c14.12915.58549 14.12555 20.71849-.00006 21.30166a10.66285 10.66285 0 0 1 -10.65052-10.65059zm-8.92782 32.15512a1.79912 1.79912 0 0 1 -1.79221-1.802v-5.05591a8.77752 8.77752 0 0 1 6.00238-8.34163l10.60365-3.52429a15.01092 15.01092 0 0 1 9.52911 0l3.46984 1.15674c-3.59346 5.72329-1.43338 14.18061 4.21891 17.567zm39.15382.11489a11.1298 11.1298 0 0 1 -11.117-11.117c.61091-14.74813 21.62529-14.74385 22.23394.00006a11.12978 11.12978 0 0 1 -11.11694 11.11694z"></path><path d="m52.71945 37.35267-7.97938 7.86792-3.63526-3.53459a1.00138 1.00138 0 0 0 -1.39616 1.43533l4.33819 4.218a1.00108 1.00108 0 0 0 1.40111-.00489l8.67749-8.55625a1.00132 1.00132 0 0 0 -1.40599-1.42552z"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="box_5">
                                    <div className="relative block overflow-hidden rounded-lg border border-[#dedede] card_box_shadow">
                                        <p className="text-[16px] bg-[#6f35dc] p-2.5 font-bold text-[#fff]">
                                            Users Created by Company Admins </p>
                                        <div className="sm:flex sm:justify-between sm:gap-4 p-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-[#000] sm:text-xl">
                                                    {dashboardData?.response.response.inviteeUsersCount.count}
                                                </h3>
                                                {dashboardData?.response.response.inviteeUsersCount.change >= 0 ?
                                                    <p className="text-xs font-semibold mt-1 text-[#35b653]">
                                                        <IncreaseSVG />
                                                        {dashboardData?.response.response.inviteeUsersCount.change}% increase vs past month
                                                    </p>
                                                    :
                                                    <p className="text-xs font-semibold mt-1 text-[#dc3545]">
                                                        <DecreaseSVG />
                                                        {Math.abs(dashboardData?.response.response.inviteeUsersCount.change)}% decrease vs past month</p>
                                                }

                                            </div>

                                            <div className="hidden sm:block sm:shrink-0 cursor-pointer" onClick={() => props.setReprotType("subUsersCreation")}>
                                                <svg fill="#6f35dc" enable-background="new 0 0 64 64" height="50" viewBox="0 0 64 64" width="50" xmlns="http://www.w3.org/2000/svg" id="fi_2717595"><g id="user_setting"><g><path d="m60.896 42.96h-.5259c-.2148-.6699-.4854-1.3223-.8096-1.9512l.3667-.3682c.3999-.3965.6206-.9268.6206-1.4932 0-.5654-.2207-1.0957-.6172-1.4883l-2.6162-2.6162c-.3979-.3984-.9268-.6162-1.4897-.6162-.002 0-.0034 0-.0049 0-.563.001-1.0908.2207-1.4814.6152l-.3735.3711c-.6299-.3242-1.2837-.5947-1.9546-.8096v-.5254c0-1.1621-.9438-2.1084-2.1045-2.1084h-3.7026c-1.1621 0-2.1074.9463-2.1074 2.1084v.5254c-.6704.2148-1.3228.4863-1.9512.8096l-.3696-.3682c-.3965-.3984-.9263-.6191-1.4917-.6191h-.0005c-.4088.0007-.7971.1193-1.1304.3327-1.9451-1.1693-4.1318-2.1863-6.5366-3.0075-.2313-.0801-.4398-.1201-.6313-.1322v-2.7904c4.163-2.5251 6.96-7.0877 6.96-12.303 0-.4717-.0262-.9373-.0709-1.3976-.0011-.0147-.0004-.0286-.0021-.0433-.7255-7.2604-6.8691-12.9496-14.3173-12.9496-7.9365 0-14.3931 6.4561-14.3931 14.3906 0 5.2159 2.7981 9.779 6.9629 12.304v2.7888c-.1903.0121-.3972.0515-.6265.1309-9.559 3.2685-15.4975 9.3613-15.4975 15.9003v2.0098c0 1.8262.8193 3.0029 2.7397 3.9365 5.5835 2.7148 14.7021 3.6787 20.8145 3.6787 3.9052 0 8.0277-.3647 11.7073-1.0115l2.53 2.53c.396.3994.9258.6191 1.4912.6201h.0005c.5654 0 1.0952-.2207 1.4878-.6162l.3735-.3711c.6284.3232 1.2808.5947 1.9512.8096v.5254c0 1.1602.9453 2.1045 2.1074 2.1045h3.7026c1.1606 0 2.1045-.9443 2.1045-2.1045v-.5254c.6709-.2148 1.3247-.4854 1.9546-.8096l.3691.3672c.395.3984.9229.6182 1.4858.6191h.0049c.563 0 1.0918-.2188 1.4902-.6162l2.6152-2.6162c.3994-.3984.6187-.9297.6177-1.4951-.0015-.5635-.2217-1.0908-.6152-1.4805l-.3721-.374c.3247-.6299.5952-1.2842.8101-1.9551h.5254c1.1602 0 2.104-.9443 2.104-2.1045v-3.7021c.0001-1.162-.9437-2.1083-2.1039-2.1083zm-36.3418-38.8252c5.5705 0 10.2916 3.6963 11.8461 8.7642-2.3337-1.5193-6.0533-3.4161-8.6649-2.1831-.9458.4482-1.8062.8828-2.6094 1.2891-4.4871 2.269-6.8452 3.4467-12.4429.9801 1.5281-5.1114 6.2684-8.8503 11.8711-8.8503zm-12.3931 12.3906c0-.5228.0431-1.0346.1063-1.5405 2.3082.9698 4.1834 1.3716 5.8547 1.3716 2.8311 0 5.0854-1.1406 7.9063-2.5664.7891-.3994 1.6338-.8262 2.563-1.2666 1.9383-.9164 5.9724 1.3654 8.3113 3.179.0181.2733.0417.5452.0417.8229 0 6.834-5.5581 12.3936-12.3901 12.3936-6.8336-.0001-12.3932-5.5596-12.3932-12.3936zm12.3931 14.3935c1.9214 0 3.7529-.3855 5.4302-1.0721v2.6435l-5.4302 4.4462-5.4302-4.4474v-2.6419c1.6774.6864 3.5087 1.0717 5.4302 1.0717zm-19.9399 20.878c-1.3648-.6631-1.6143-1.2403-1.6143-2.1377v-2.0098c0-5.6572 5.4199-11.0244 14.2178-14.0381.0503.0137 6.0464 4.8721 6.0464 4.8721.824.6776 1.7614.6736 2.5806 0 0 0 5.9961-4.8584 6.019-4.8691l.1006.0273c2.0793.7109 3.9773 1.5708 5.6826 2.5488l-1.4658 1.4658c-.3994.3955-.6196.9258-.6196 1.4912 0 .5664.2202 1.0967.6152 1.4883l.3721.373c-.3242.6289-.5947 1.2813-.8101 1.9512h-.5254c-1.1621 0-2.1079.9463-2.1079 2.1084v3.7021c0 1.1602.9458 2.1045 2.1079 2.1045h.5249c.2148.6719.4858 1.3252.8105 1.9551l-.3677.3691c-.3166.3135-.5145.7122-.5856 1.1449-3.4879.593-7.3601.9303-11.0413.9303-7.769.0001-15.5957-1.3651-19.9399-3.4774zm56.3857-3.0264c0 .0537-.0508.1045-.104.1045h-1.2788c-.458 0-.8574.3115-.9697.7549-.2529 1.002-.6519 1.9648-1.1851 2.8623-.2334.3916-.1714.8926.1504 1.2158l.9019.9063c.002.002 0 .1494.002.1514l-2.6157 2.6162.707.707-.8584-.708-.9058-.9023c-.3223-.3232-.8232-.3848-1.2163-.1514-.8979.5332-1.8608.9326-2.8628 1.1855-.4434.1123-.7544.5117-.7544.9697v1.2783c0 .0537-.0508.1045-.1045.1045h-3.7026c-.0562 0-.1074-.0498-.1074-.1045v-1.2783c0-.457-.3105-.8564-.7539-.9688-1.001-.2549-1.9634-.6543-2.8594-1.1865-.1592-.0947-.3354-.1406-.5107-.1406-.2583 0-.5137.0996-.7061.292l-.9058.9023c-.0015.001-.1499 0-.1514.001l-2.6162-2.6162.0015-.1504.9023-.9063c.3223-.3242.3843-.8242.1509-1.2168-.5332-.8975-.9321-1.8604-1.186-2.8623-.1123-.4443-.5112-.7549-.9692-.7549h-1.2783c-.0547 0-.1079-.0518-.1079-.1045v-3.7021c0-.0557.0522-.1084.1079-.1084h1.2783c.4575 0 .8564-.3105.9692-.7539.2539-1.001.6533-1.9629 1.186-2.8594.2334-.3926.1714-.8926-.1509-1.2168l-.9023-.9063c-.0015-.001 0-.1484-.0015-.1504l2.6162-2.6162h.0073c.0293 0 .1396.0068.144.001l.9058.9023c.3237.3232.8232.3857 1.2168.1514.896-.5322 1.8584-.9316 2.8594-1.1865.4434-.1123.7539-.5117.7539-.9688v-1.2783c0-.0557.0522-.1084.1074-.1084h3.7026c.0527 0 .1045.0537.1045.1084v1.2783c0 .458.311.8574.7544.9697 1.002.2529 1.9648.6523 2.8628 1.1855.3926.2344.8936.1719 1.2163-.1514l.9058-.9023c.0015-.001.1499 0 .1514-.001l2.6157 2.6162c.001.001-.0029.1494-.002.1514l-.9019.9063c-.3218.3232-.3838.8242-.1504 1.2158.5332.8975.9321 1.8594 1.1855 2.8594.1123.4434.5117.7539.9692.7539h1.2788c.0542 0 .104.0518.104.1084v3.7023z"></path><path d="m48.0527 39.6855c-3.9873 0-7.2314 3.2441-7.2314 7.2324 0 3.9893 3.2441 7.2354 7.2314 7.2354 3.9897 0 7.2354-3.2461 7.2354-7.2354 0-3.9882-3.2456-7.2324-7.2354-7.2324zm0 12.4678c-2.8848 0-5.2314-2.3486-5.2314-5.2354 0-2.8848 2.3467-5.2324 5.2314-5.2324 2.8867 0 5.2354 2.3477 5.2354 5.2324 0 2.8868-2.3486 5.2354-5.2354 5.2354z"></path><path d="m24.6694 42.4795h-.0244c-.5522 0-.9878.4473-.9878 1s.46 1 1.0122 1 1-.4473 1-1-.4477-1-1-1z"></path><path d="m24.645 48.7432h-.0244c-.5522 0-.9878.4473-.9878 1s.46 1 1.0122 1 1-.4473 1-1-.4477-1-1-1z"></path></g></g></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                        <div className="pt-6">
                            <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
                                <div className="box_1">
                                    <div className="relative block overflow-hidden rounded-lg border border-[#dedede] card_box_shadow">
                                        <p className="text-[16px] bg-[#607d8b] p-2.5 font-bold text-[#fff]">
                                            New Subscriptions </p>
                                        <div className="sm:flex sm:justify-between sm:gap-4 p-4">
                                            <div>
                                                <p className="text-sm font-semibold mt-1">MTD : {formatNumberIndianWithRegex(dashboardData.response.newSubscriptionsMTD.newSubscribers.total).slice(0, -3).toString().padStart(2, '0') + ` - Monthly : ` + formatNumberIndianWithRegex(dashboardData.response.newSubscriptionsMTD.newSubscribers.monthly).slice(0, -3).toString().padStart(2, '0') + ' | Yearly : ' + formatNumberIndianWithRegex(dashboardData.response.newSubscriptionsMTD.newSubscribers.yearly).slice(0, -3).toString().padStart(2, '0')}</p>
                                                <p className="text-sm font-semibold mt-1">YTD : {formatNumberIndianWithRegex(dashboardData.response.newSubscriptionsYTD.newSubscribers.total).slice(0, -3).toString().padStart(2, '0') + ` - Monthly : ` + formatNumberIndianWithRegex(dashboardData.response.newSubscriptionsYTD.newSubscribers.monthly).slice(0, -3).toString().padStart(2, '0') + ' | Yearly : ' + formatNumberIndianWithRegex(dashboardData.response.newSubscriptionsYTD.newSubscribers.yearly).slice(0, -3).toString().padStart(2, '0')}</p>
                                            </div>

                                            <div className="hidden sm:block sm:shrink-0 cursor-pointer" onClick={() => props.setReprotType("subscriptions")}>
                                                <svg fill="#607d8b" width="50" height="50" id="fi_11911144" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="m35.82661 57.55353h-18.38027v-4.63863a1.00261 1.00261 0 0 0 -2.00484.00006v4.63857h-6.09869a2.01663 2.01663 0 0 1 -2.01463-2.01462v-5.46338a9.53384 9.53384 0 0 1 6.53236-9.06287l11.426-3.809a16.71523 16.71523 0 0 1 11.14505.27019 1.00273 1.00273 0 0 0 .63428-1.902 18.71822 18.71822 0 0 0 -12.41269-.27067l-11.426 3.80948a11.53638 11.53638 0 0 0 -7.90383 10.96487v5.46338a4.02409 4.02409 0 0 0 4.01946 4.01946h26.4838a1.00261 1.00261 0 0 0 0-2.00484z"></path><path d="m30.45526 32.14263a14.12387 14.12387 0 0 0 14.10825-14.10776c-.77488-18.71587-27.44451-18.71042-28.21651.00006a14.12386 14.12386 0 0 0 14.10826 14.1077zm0-26.21069a12.11643 12.11643 0 0 1 12.10341 12.10293c-.66432 16.05625-23.54495 16.0516-24.20683-.00012a12.11642 12.11642 0 0 1 12.10342-12.10281z"></path><path d="m46.585 35.87869a12.10526 12.10526 0 0 0 -12.09168 12.09167c.66432 16.04187 23.52146 16.03722 24.18333-.00012a12.10523 12.10523 0 0 0 -12.09165-12.09155zm0 22.179a10.09823 10.09823 0 0 1 -10.08685-10.08733c.554-13.38158 19.62174-13.37773 20.17367.00006a10.09822 10.09822 0 0 1 -10.08682 10.08726z"></path><path d="m51.59708 46.96794h-4.00968v-4.00967a1.00261 1.00261 0 0 0 -2.00483.00006v4.00961h-4.00967a1.00242 1.00242 0 1 0 0 2.00484h4.00967v4.00967a1.00242 1.00242 0 1 0 2.00483 0v-4.00967h4.00968a1.00261 1.00261 0 0 0 0-2.00484z"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="box_2">
                                    <div className="relative block overflow-hidden rounded-lg border border-[#dedede] card_box_shadow">
                                        <p className="text-[16px] bg-[#607d8b] p-2.5 font-bold text-[#fff]">
                                            Re Subscribes </p>
                                        <div className="sm:flex sm:justify-between sm:gap-4 p-4">
                                            <div>

                                                <h3 className="text-lg font-bold text-[#000] sm:text-xl">
                                                    {dashboardData.response.returnedSubscriptions}
                                                </h3>
                                            </div>

                                            <div className="hidden sm:block sm:shrink-0 cursor-pointer" onClick={() => props.setReprotType("subscriptions")}>
                                                <svg fill="#607d8b" width="50" height="50" id="fi_11911144" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="m35.82661 57.55353h-18.38027v-4.63863a1.00261 1.00261 0 0 0 -2.00484.00006v4.63857h-6.09869a2.01663 2.01663 0 0 1 -2.01463-2.01462v-5.46338a9.53384 9.53384 0 0 1 6.53236-9.06287l11.426-3.809a16.71523 16.71523 0 0 1 11.14505.27019 1.00273 1.00273 0 0 0 .63428-1.902 18.71822 18.71822 0 0 0 -12.41269-.27067l-11.426 3.80948a11.53638 11.53638 0 0 0 -7.90383 10.96487v5.46338a4.02409 4.02409 0 0 0 4.01946 4.01946h26.4838a1.00261 1.00261 0 0 0 0-2.00484z"></path><path d="m30.45526 32.14263a14.12387 14.12387 0 0 0 14.10825-14.10776c-.77488-18.71587-27.44451-18.71042-28.21651.00006a14.12386 14.12386 0 0 0 14.10826 14.1077zm0-26.21069a12.11643 12.11643 0 0 1 12.10341 12.10293c-.66432 16.05625-23.54495 16.0516-24.20683-.00012a12.11642 12.11642 0 0 1 12.10342-12.10281z"></path><path d="m46.585 35.87869a12.10526 12.10526 0 0 0 -12.09168 12.09167c.66432 16.04187 23.52146 16.03722 24.18333-.00012a12.10523 12.10523 0 0 0 -12.09165-12.09155zm0 22.179a10.09823 10.09823 0 0 1 -10.08685-10.08733c.554-13.38158 19.62174-13.37773 20.17367.00006a10.09822 10.09822 0 0 1 -10.08682 10.08726z"></path><path d="m51.59708 46.96794h-4.00968v-4.00967a1.00261 1.00261 0 0 0 -2.00483.00006v4.00961h-4.00967a1.00242 1.00242 0 1 0 0 2.00484h4.00967v4.00967a1.00242 1.00242 0 1 0 2.00483 0v-4.00967h4.00968a1.00261 1.00261 0 0 0 0-2.00484z"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="box_3">
                                    <div className="relative block overflow-hidden rounded-lg border border-[#dedede] card_box_shadow">
                                        <p className="text-[16px] bg-[#795548] p-2.5 font-bold text-[#fff]">
                                            Cancelled Subscriptions </p>
                                        <div className="sm:flex sm:justify-between sm:gap-4 p-4">
                                            <div>
                                                <p className="text-sm font-semibold mt-1">MTD : {dashboardData.response.cancelledSubscriptionsMTD.toString().padStart(2, '0')}</p>
                                                <p className="text-sm font-semibold mt-1">YTD : {dashboardData.response.cancelledSubscriptionsYTD.toString().padStart(2, '0')}</p>
                                            </div>
                                            <div className="hidden sm:block sm:shrink-0 cursor-pointer" onClick={() => props.setReprotType("subscriptions")}>
                                                <svg fill="#795548" width="50" height="50" id="fi_11931092" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="m53.09156 42.76014h-11.06777a1.00023 1.00023 0 0 0 .00006 2.00007h11.06771a1.00023 1.00023 0 0 0 0-2.00007z"></path><path d="m47.55816 31.31785a12.386 12.386 0 0 0 -7.91316 2.84769l-7.06976-2.354c-.03742-.01239-.07575-.02045-.11323-.0326 12.07981-5.69119 8.28744-23.78228-5.24654-23.98144-13.87841.4475-17.02324 18.14894-5.36115 24.01432l-10.53082 3.51056a10.7026 10.7026 0 0 0 -7.3235 10.16881v5.03045a3.77914 3.77914 0 0 0 3.77943 3.77015h33.184a12.43536 12.43536 0 1 0 6.59477-22.97394zm-30.91416-10.94863a10.58353 10.58353 0 0 1 10.57165-10.57165c14.02478.58058 14.0207 20.56486-.00006 21.14331a10.58352 10.58352 0 0 1 -10.57159-10.57166zm-8.86457 31.9225a1.77648 1.77648 0 0 1 -1.77936-1.77008v-5.03045a8.7048 8.7048 0 0 1 5.95626-8.27128l10.52674-3.5094a15.00467 15.00467 0 0 1 9.46224-.001l6.11142 2.0348c-4.05318 4.43918-3.812 12.35865.46907 16.54733zm39.77873 1.91071a10.45433 10.45433 0 0 1 -10.44275-10.44225c.57357-13.85266 20.31339-13.84961 20.88452.00006a10.45348 10.45348 0 0 1 -10.44177 10.44219z"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="box_4">
                                    <div className="relative block overflow-hidden rounded-lg border border-[#dedede] card_box_shadow">
                                        <p className="text-[16px] bg-[#009688] p-2.5 font-bold text-[#fff]">
                                            Total Subscription Revenue Earned </p>
                                        <div className="sm:flex sm:justify-between sm:gap-4 p-4">
                                            <div>
                                                <p className="text-sm font-semibold mt-1">MTD :  {stripeDataFetched ? new Intl.NumberFormat('en-US', {
                                                    style: 'currency',
                                                    currency: 'USD',
                                                }).format(stripeData.MTDRevenue) : 'loading...'}</p>
                                                <p className="text-sm font-semibold mt-1">YTD : {stripeDataFetched ? new Intl.NumberFormat('en-US', {
                                                    style: 'currency',
                                                    currency: 'USD',
                                                }).format(stripeData.YTDRevenue) : 'loading...'}</p>
                                            </div>

                                            <div className="hidden sm:block sm:shrink-0">
                                                <svg fill="#009688" width="50" height="50" viewBox="0 1 511 511.99938" xmlns="http://www.w3.org/2000/svg" id="fi_1322818"><path d="m216.5 366c5.519531 0 10-4.480469 10-10s-4.480469-10-10-10-10 4.480469-10 10 4.480469 10 10 10zm0 0"></path><path d="m3.429688 389.070312 120 120c3.90625 3.90625 10.234374 3.90625 14.140624 0l66-66c3.90625-3.90625 3.90625-10.234374 0-14.140624l-2.929687-2.929688h144.148437c12.660157 0 24.742188-4.746094 34.058594-13.394531l121.316406-113.699219c11.613282-10.785156 15.460938-27.917969 9.570313-42.628906-4.257813-10.648438-12.953125-18.796875-23.851563-22.355469-10.902343-3.566406-22.726562-2.121094-32.453124 3.957031-.0625.039063-26.933594 17.671875-26.933594 17.671875-.183594-54.207031-32.945313-112.011719-78.042969-138.035156 2.574219-2.957031 4.597656-6.457031 5.886719-10.375 5.160156-15.699219-3.417969-32.691406-19.140625-37.882813-.492188-.164062-.984375-.308593-1.476563-.460937l25.742188-46.242187c1.480468-2.660157 1.671875-5.851563.511718-8.664063-1.15625-2.816406-3.53125-4.953125-6.457031-5.800781-18.457031-5.367188-37.640625-8.089844-57.019531-8.089844-19.375 0-38.5625 2.722656-57.019531 8.085938-2.925781.851562-5.300781 2.984374-6.460938 5.800781-1.15625 2.816406-.96875 6.007812.515625 8.667969l25.742188 46.242187c-.5.15625-1 .304687-1.5.46875-15.699219 5.183594-24.273438 22.171875-19.113282 37.882813 1.289063 3.910156 3.328126 7.398437 5.910157 10.359374-45.769531 26.410157-78.074219 84.808594-78.074219 138.492188 0 1.464844.035156 2.910156.082031 4.34375-17.910156 4.886719-34.5625 13.789062-48.566406 26.050781l-30.390625 26.589844-4.054688-4.054687c-3.90625-3.90625-10.234374-3.90625-14.140624 0l-66 66c-3.90625 3.90625-3.90625 10.234374 0 14.140624zm253.902343-364.886718c12.8125-2.78125 25.9375-4.183594 39.167969-4.183594s26.355469 1.402344 39.171875 4.183594l-22.285156 40.027344c-11.234375-1.566407-22.546875-1.566407-33.769531 0zm6.6875 64.082031c20.519531-6.714844 42.890625-7.222656 64.933594-.007813 5.246094 1.730469 8.109375 7.402344 6.386719 12.636719-1.296875 3.941407-4.8125 6.617188-8.886719 6.855469-19.71875-6.269531-40.199219-6.28125-59.910156-.019531 0 0 0 0-.003907 0-4.109374-.257813-7.597656-2.945313-8.878906-6.832031-1.722656-5.242188 1.140625-10.914063 6.359375-12.632813zm5.53125 39.550781c17.339844-6.246094 35.304688-6.394531 52.6875-.421875 46.460938 15.976563 84.261719 73.667969 84.261719 128.605469 0 4.65625-.292969 9.09375-.871094 13.242188l-48.066406 31.535156c-7.441406-9.21875-18.71875-14.777344-31.0625-14.777344h-20v-11.71875c11.640625-4.128906 20-15.246094 20-28.28125 0-16.542969-13.457031-30-30-30-5.511719 0-10-4.484375-10-10s4.488281-10 10-10c3.542969 0 7.28125 1.808594 10.816406 5.226562 3.96875 3.839844 10.300782 3.734376 14.140625-.230468 3.839844-3.96875 3.734375-10.300782-.234375-14.140625-5.074218-4.914063-10.152344-7.691407-14.722656-9.207031v-11.648438c0-5.523438-4.476562-10-10-10s-10 4.476562-10 10v11.71875c-11.636719 4.128906-20 15.246094-20 28.28125 0 16.542969 13.457031 30 30 30 5.515625 0 10 4.484375 10 10s-4.484375 10-10 10c-4.273438 0-8.882812-2.6875-12.984375-7.566406-3.554687-4.226563-9.863281-4.773438-14.089844-1.21875-4.226562 3.554687-4.773437 9.863281-1.21875 14.089844 5.34375 6.359374 11.632813 10.789062 18.292969 13.023437v11.671875h-3.328125c-4.914063 0-7.121094-3.203125-10.582031-5.441406-21.128906-15.835938-47.300782-24.558594-73.699219-24.558594-4.128906 0-8.265625.214844-12.382813.632812 0-.210937-.007812-.417968-.007812-.632812 0-54.167969 37.257812-111.667969 83.050781-128.183594zm-138.363281 173.625c18.789062-16.453125 42.933594-25.441406 67.703125-25.441406 22.101563 0 44.011719 7.300781 61.691406 20.554688 2.550781 1.492187 9.652344 9.445312 22.585938 9.445312h43.332031c11.382812 0 20 9.253906 20 20 0 11.027344-8.972656 20-20 20h-70c-5.523438 0-10 4.476562-10 10s4.476562 10 10 10h70c22.054688 0 40-17.945312 40-40 0-2.292969-.203125-4.554688-.585938-6.78125l98.199219-64.429688c4.671875-2.886718 10.339844-3.5625 15.558594-1.859374 5.25 1.71875 9.441406 5.644531 11.492187 10.777343 2.886719 7.203125 1.074219 15.269531-4.644531 20.578125l-121.3125 113.695313c-5.570312 5.171875-12.820312 8.019531-20.417969 8.019531h-164.148437l-78.839844-78.84375zm-54.6875 28.699219 105.859375 105.859375-51.859375 51.859375-105.859375-105.859375zm0 0"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="box_5">
                                    <div className="relative block overflow-hidden rounded-lg border border-[#dedede] card_box_shadow">
                                        <p className="text-[16px] bg-[#4caf50] p-2.5 font-bold text-[#fff]">
                                            SP Profile Completion </p>
                                        <div className="sm:flex sm:justify-between sm:gap-4 p-4">
                                            <div>
                                                <p className="text-sm font-semibold mt-1">% of empty profiles : {dashboardData.response.emptyProfilesCount.emptyProfileUsers}</p>
                                                <p className="text-sm font-semibold mt-1">100% complete profiles : {dashboardData.response.emptyProfilesCount.profileCompletedUser}</p>
                                            </div>

                                            <div className="hidden sm:block sm:shrink-0">
                                                <svg fill="#4caf50" width="50" height="50" viewBox="0 0 25 24" xmlns="http://www.w3.org/2000/svg" id="fi_16581386"><g fill-rule="evenodd"><path d="m18.375 13.25c-2.4853 0-4.5 2.0147-4.5 4.5s2.0147 4.5 4.5 4.5 4.5-2.0147 4.5-4.5-2.0147-4.5-4.5-4.5zm-5.5 4.5c0-3.0376 2.4624-5.5 5.5-5.5s5.5 2.4624 5.5 5.5-2.4624 5.5-5.5 5.5-5.5-2.4624-5.5-5.5z"></path><path d="m20.7286 16.3964c.1952.1953.1952.5119 0 .7072l-2.5 2.5c-.1953.1952-.5119.1952-.7072 0l-1.5-1.5c-.1952-.1953-.1952-.5119 0-.7072.1953-.1952.5119-.1952.7072 0l1.1464 1.1465 2.1464-2.1465c.1953-.1952.5119-.1952.7072 0z"></path><path d="m7.625 4.25c-1.39867 0-2.5 1.08716-2.5 2.38889s1.10133 2.38889 2.5 2.38889 2.5-1.08716 2.5-2.38889-1.10133-2.38889-2.5-2.38889zm-3.5 2.38889c0-1.88925 1.58496-3.38889 3.5-3.38889s3.5 1.49964 3.5 3.38889-1.58496 3.38891-3.5 3.38891-3.5-1.49966-3.5-3.38891zm-1.97878 6.61991c-.01901.0109-.02122.0239-.02122.028v2.741c0 .1051.09398.2222.25.2222h10.5c.156 0 .25-.1171.25-.2222v-2.741c0-.0041-.0022-.0171-.0212-.028-3.37326-1.942-7.58434-1.942-10.9576 0zm-.49892-.8667c3.68209-2.1197 8.27331-2.1197 11.9554 0 .3181.1831.5223.5205.5223.8947v2.741c0 .6926-.5776 1.2222-1.25 1.2222h-10.5c-.6724 0-1.25-.5296-1.25-1.2222v-2.741c0-.3742.20419-.7116.5223-.8947z"></path><path d="m13.6251 1.75c-.6536 0-1.2452.23892-1.6888.6275-.1547.13555-.2912.28912-.4059.45684-.1558.22794-.467.28636-.6949.13048-.228-.15588-.2864-.46703-.1305-.69497.1627-.23796.3554-.45441.5724-.64453.6222-.5451 1.4468-.87532 2.3477-.87532 1.915 0 3.5 1.49964 3.5 3.38889s-1.585 3.38889-3.5 3.38889c-.2032 0-.4026-.0168-.5969-.04916-.2724-.04535-.4565-.30294-.4111-.57533.0453-.2724.3029-.45644.5753-.41109.1402.02335.2847.03558.4327.03558 1.3986 0 2.5-1.08716 2.5-2.38889s-1.1014-2.38889-2.5-2.38889zm-.5 7.05232c0-.27614.2238-.5.5-.5 2.0672 0 4.1358.52945 5.9776 1.58979.3182.18309.5224.52049.5224.89469v.4785c0 .2762-.2239.5-.5.5-.2762 0-.5-.2238-.5-.5v-.4785c0-.0041-.0023-.0171-.0213-.028-1.6858-.97052-3.5816-1.45648-5.4787-1.45648-.2762 0-.5-.22386-.5-.5z"></path></g></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="box_4">
                                    <div className="relative block overflow-hidden rounded-lg border border-[#dedede] card_box_shadow">
                                        <p className="text-[16px] bg-[#009688] p-2.5 font-bold text-[#fff]">
                                            MailChimp -  XDS Spark Main Contacts List</p>
                                        <div className="sm:flex sm:justify-between sm:gap-4 p-4">
                                            {mailchimpDataFetched && mailchimpDataMainCount &&
                                                <div>
                                                    <p className="text-sm font-semibold mt-1">Members : {mailchimpDataFetched && mailchimpDataMainCount.MailchimpAPi.MainConatctCount ? formatNumberIndianWithRegex(mailchimpDataMainCount.MailchimpAPi.MainConatctCount).slice(0, -3).toString().padStart(2, '0') : 'loading...'}
                                                        {mailchimpDataMainChange?.MailchimpAPi.listStats >= 0 ?
                                                            <span className="text-xs font-semibold mt-1 text-[#35b653]">
                                                                &nbsp; <IncreaseSVG />&nbsp;
                                                                {mailchimpDataMainChange?.MailchimpAPi.listStats}%  vs past month
                                                            </span>
                                                            :
                                                            <span className="text-xs font-semibold mt-1 text-[#dc3545]">
                                                                &nbsp;<DecreaseSVG />&nbsp;
                                                                {Math.abs(mailchimpDataMainChange?.MailchimpAPi.listStats)}%  vs past month</span>
                                                        }

                                                    </p>
                                                    <p className="text-sm font-semibold mt-1">MTD : {mailchimpDataFetched && mailchimpDataMainChange?.MailchimpAPi.thisMonthStats ? formatNumberIndianWithRegex(mailchimpDataMainChange?.MailchimpAPi.thisMonthStats.currentMonthCount).slice(0, -3).toString().padStart(2, '0') : 'loading...'}
                                                        {mailchimpDataMainChange?.MailchimpAPi.thisMonthStats.listMTDStats >= 0 ?
                                                            <span className="text-xs font-semibold mt-1 text-[#35b653]">
                                                                &nbsp; <IncreaseSVG /> &nbsp;
                                                                {mailchimpDataMainChange?.MailchimpAPi.thisMonthStats.listMTDStats}%  vs past month
                                                            </span>
                                                            :
                                                            <span className="text-xs font-semibold mt-1 text-[#dc3545]">
                                                                &nbsp; <DecreaseSVG />&nbsp;
                                                                {Math.abs(mailchimpDataMainChange?.MailchimpAPi.thisMonthStats.listMTDStats)}%  vs past month</span>
                                                        }

                                                    </p>
                                                    <p className="text-sm font-semibold mt-1">YTD : {mailchimpDataFetched && mailchimpDataMainCount.MailchimpAPi.MainConatctCount ? formatNumberIndianWithRegex(mailchimpDataMainCount.MailchimpAPi.MainConatctCount).slice(0, -3).toString().padStart(2, '0') : 'loading...'}
                                                        {mailchimpDataMainChange?.MailchimpAPi.thisYear.members >= 0 ?
                                                            <span className="text-xs font-semibold mt-1 text-[#35b653]">
                                                                &nbsp; <IncreaseSVG />&nbsp;
                                                                {mailchimpDataMainChange?.MailchimpAPi.thisYear.listYTDStats}%  vs past year
                                                            </span>
                                                            :
                                                            <span className="text-xs font-semibold mt-1 text-[#dc3545]">
                                                                &nbsp;<DecreaseSVG />&nbsp;
                                                                {Math.abs(mailchimpDataMainChange?.MailchimpAPi.listStats)}%  vs past year</span>
                                                        }

                                                    </p>

                                                </div>
                                            }

                                            <div className="hidden sm:block sm:shrink-0">
                                                <svg id="fi_17804903" width="50" height="50" enable-background="new 0 0 514 514" viewBox="0 0 514 514" xmlns="
http://www.w3.org/2000/svg"><g
                                                        fill="#009688"><path d="m424.17 431.2v-245.67c0-4.14-3.36-7.5-7.5-7.5h-44.44c-4.14 0-7.5 3.36-7.5 7.5v245.67h-32.67v-152.92c0-4.14-3.36-7.5-7.5-7.5h-44.44c-4.14 0-7.5 3.36-7.5 7.5v152.92h-32.67v-165.93c0-4.14-3.36-7.5-7.5-7.5h-44.45c-4.14 0-7.5 3.36-7.5 7.5v165.93h-32.67v-92.56c0-4.14-3.36-7.5-7.5-7.5h-44.44c-4.14 0-7.5 3.36-7.5 7.5v92.56h-56.39v15h450v-15zm-44.44-238.17h29.44v238.17h-29.44zm-92.11 92.75h29.44v145.42h-29.44zm-92.12-13.01h29.44v158.43h-29.44zm-92.11 73.37h29.44v85.06h-29.44z"></path><path d="m219.59 182.91 44.51 44.51c2.93 2.93 7.68 2.93 10.61 0l132.55-132.56-3.43 35.71 14.93 1.43 5.37-55.99c.21-2.21-.57-4.4-2.12-5.98-1.56-1.58-3.74-2.4-5.95-2.21l-56.06 4.54 1.21 14.95 35.24-2.85-127.05 127.05-44.51-44.51c-2.93-2.93-7.68-2.93-10.61 0l-123.69 123.7 10.61 10.61z"></path></g></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="box_4 mt-5">
                                <div className="relative block overflow-hidden rounded-lg border border-[#dedede] card_box_shadow">
                                    <p className="text-[16px] bg-[#009688] p-2.5 font-bold text-[#fff]">
                                        MailChimp Campaign Stats</p>
                                    <div className="sm:flex sm:justify-between sm:gap-4 p-4">
                                        <div>
                                            {mailchimpDataFetched && mailchimpData ?
                                                mailchimpData.MailchimpAPi.listData && mailchimpData.MailchimpAPi.listData.length > 0 && mailchimpData.MailchimpAPi.listData.map((list: { campaign_title: string; clicks: string | number; opens: number }) => {
                                                    return (
                                                        <>
                                                            <li className="text-sm  mt-1">

                                                                {list.campaign_title ? list.campaign_title : 'List Name'} -
                                                                <span className="font-semibold">  Opens: </span>{list.opens}, 
                                                                <span className="font-semibold"> Clicks: </span>{list.clicks}
                                                            </li>
                                                        </>
                                                    )
                                                })
                                                :
                                                <p>
                                                    loading...
                                                </p>
                                            }
                                        </div>

                                        <div className="hidden sm:block sm:shrink-0 mt-5">
                                            <svg id="fi_17804903" width="50" height="50" enable-background="new 0 0 514 514" viewBox="0 0 514 514" xmlns="
http://www.w3.org/2000/svg"><g
                                                    fill="#009688"><path d="m424.17 431.2v-245.67c0-4.14-3.36-7.5-7.5-7.5h-44.44c-4.14 0-7.5 3.36-7.5 7.5v245.67h-32.67v-152.92c0-4.14-3.36-7.5-7.5-7.5h-44.44c-4.14 0-7.5 3.36-7.5 7.5v152.92h-32.67v-165.93c0-4.14-3.36-7.5-7.5-7.5h-44.45c-4.14 0-7.5 3.36-7.5 7.5v165.93h-32.67v-92.56c0-4.14-3.36-7.5-7.5-7.5h-44.44c-4.14 0-7.5 3.36-7.5 7.5v92.56h-56.39v15h450v-15zm-44.44-238.17h29.44v238.17h-29.44zm-92.11 92.75h29.44v145.42h-29.44zm-92.12-13.01h29.44v158.43h-29.44zm-92.11 73.37h29.44v85.06h-29.44z"></path><path d="m219.59 182.91 44.51 44.51c2.93 2.93 7.68 2.93 10.61 0l132.55-132.56-3.43 35.71 14.93 1.43 5.37-55.99c.21-2.21-.57-4.4-2.12-5.98-1.56-1.58-3.74-2.4-5.95-2.21l-56.06 4.54 1.21 14.95 35.24-2.85-127.05 127.05-44.51-44.51c-2.93-2.93-7.68-2.93-10.61 0l-123.69 123.7 10.61 10.61z"></path></g></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="sm:flex sm:items-center sm:justify-between pt-6">
                            <div className="sm:text-left">
                                <h1 className="font-bold text-gray-900 header-font">Statistics</h1>
                            </div>
                        </div>
                        <div className="pt-6">
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-4">
                                <div className="statistics_1">
                                    <article className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-lg sm:p-4 card_box_shadow"
                                    >
                                        <h3 className="mt-0.5 text-lg font-bold text-gray-900">
                                            Monthly vs Yearly Subscribers
                                        </h3>
                                        <div className="lg:w-[500px] lg:h-[500px] w-[300px] h-[300px]" style={{ position: 'relative' }}>
                                            {!pieChartLoader ?
                                                <canvas ref={subscribersChartRef} ></canvas>
                                                :
                                                <div className="flex justify-center items-center absolute inset-0">
                                                    <Spinner />
                                                </div>
                                            }
                                        </div>
                                    </article>
                                </div>
                                <div className="statistics_2">
                                    <article className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-lg sm:p-4 card_box_shadow"
                                    >
                                        <h3 className="mt-0.5 text-lg font-bold text-gray-900">
                                            Active Buyers by Location
                                        </h3>
                                        <div className="lg:w-[500px] lg:h-[500px] w-[300px] h-[300px]" style={{ position: 'relative' }}>
                                            {!pieChartLoader ?
                                                <canvas ref={locationByChartRef} ></canvas>
                                                :
                                                <div className="flex justify-center items-center absolute inset-0">
                                                    <Spinner />
                                                </div>
                                            }
                                        </div>
                                    </article>
                                </div>
                            </div>
                        </div>
                        <div className="sm:flex sm:items-center sm:justify-between py-6">
                            <div className="sm:text-left">
                                <h1 className="font-bold text-gray-900 header-font">Top 10 Active Buyers</h1>
                            </div>

                        </div>
                        {listdataFetched ?
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                                <div className="table_1">
                                    <div className="overflow-x-auto rounded-lg border border-gray-200 card_box_shadow">
                                        <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm ">
                                            <thead className="text-left bg-[#cfe2ff]">
                                                <tr>
                                                    <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">Buyer</th>
                                                    <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-900"># Logins (30 Days)</th>
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-gray-200">
                                                {listsdata.TopLogins && listsdata.TopLogins.topTenUsers && listsdata.TopLogins.topTenUsers.map((data: { userFullName: number, loginCount: number }) => {
                                                    return (
                                                        <tr>
                                                            <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">{data.userFullName}</td>
                                                            <td className="whitespace-nowrap px-4 py-2 text-gray-700">{data.loginCount}</td>
                                                        </tr>
                                                    );
                                                })}

                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="table_1">
                                    <div className="overflow-x-auto rounded-lg border border-gray-200 card_box_shadow">
                                        <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
                                            <thead className="text-left bg-[#f8d7da]">
                                                <tr>
                                                    <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">Buyer</th>
                                                    <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-900"># Profiles viewed (30 Days)</th>
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-gray-200">
                                                {listsdata.MostActiveByProfileViewing && listsdata.MostActiveByProfileViewing.map((data: { companies: { name: string }[], views: string | number, id: number }) => {
                                                    return (
                                                        <tr key={data.id + ""}>
                                                            <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">{data.companies[0].name}</td>
                                                            <td className="whitespace-nowrap px-4 py-2 text-gray-700">{data.views}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="table_1">
                                    <div className="overflow-x-auto rounded-lg border border-gray-200 card_box_shadow">
                                        <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
                                            <thead className="text-left bg-[#dadcf8]">
                                                <tr>
                                                    <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">Buyer</th>
                                                    <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-900"># Projects</th>
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-gray-200">
                                                {listsdata.noOfListAndProjectesCreated && listsdata.noOfListAndProjectesCreated.TopProjectsCount.length > 0 && listsdata.noOfListAndProjectesCreated.TopProjectsCount.map((project: { companies: { name: string }[], _count: { myProjects: number } }) => {
                                                    return (<tr>
                                                        <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">{project.companies[0].name}</td>
                                                        <td className="whitespace-nowrap px-4 py-2 text-gray-700">{project._count.myProjects}</td>
                                                    </tr>)
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="table_1">
                                    <div className="overflow-x-auto rounded-lg border border-gray-200 card_box_shadow">
                                        <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
                                            <thead className="text-left bg-[#dadcf8]">
                                                <tr>
                                                    <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">Buyer</th>
                                                    <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-900"># Lists</th>
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-gray-200">
                                                {listsdata.noOfListAndProjectesCreated && listsdata.noOfListAndProjectesCreated.TopListCount && listsdata.noOfListAndProjectesCreated.TopListCount.map((lists: { companies: { name: string }[], _count: { myLists: number } }) => {
                                                    return (<tr>
                                                        <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">{lists.companies[0].name}</td>
                                                        <td className="whitespace-nowrap px-4 py-2 text-gray-700">{lists._count.myLists}</td>
                                                    </tr>)
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="table_1">
                                    <div className="overflow-x-auto rounded-lg border border-gray-200 card_box_shadow">
                                        <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
                                            <thead className="text-left bg-[#d7f0dd]">
                                                <tr>
                                                    <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">Buyer</th>
                                                    <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-900"># Opportunities</th>
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-gray-200">
                                                {listsdata.TopOpportunitiesByCompanies && listsdata.TopOpportunitiesByCompanies.map((opportunities: { name: string, opportunitiesCount: string | number }) => {
                                                    return (<tr>
                                                        <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">{opportunities.name}</td>
                                                        <td className="whitespace-nowrap px-4 py-2 text-gray-700">{opportunities.opportunitiesCount}</td>
                                                    </tr>)
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="table_1">
                                    <div className="overflow-x-auto rounded-lg border border-gray-200 card_box_shadow">
                                        <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
                                            <thead className="text-left bg-[#cdf5f1]">
                                                <tr>
                                                    <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">Buyer</th>
                                                    <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-900"># Suppliers added</th>
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-gray-200">
                                                {listsdata.noOfSuppliersAddedtoList.TopListBySuppliers && listsdata.noOfSuppliersAddedtoList.TopListBySuppliers.map((suppliers: { companyName: any, totalIntrestedInMyLists: string | number }) => {
                                                    return (<tr>
                                                        <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">{suppliers.companyName}</td>
                                                        <td className="whitespace-nowrap px-4 py-2 text-gray-700">{suppliers.totalIntrestedInMyLists}</td>
                                                    </tr>)
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="table_1">
                                    <div className="overflow-x-auto rounded-lg border border-gray-200 card_box_shadow">
                                        <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
                                            <thead className="text-left bg-[#fff3cd]">
                                                <tr>
                                                    <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">Buyer</th>
                                                    <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-900"># Users added</th>
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-gray-200">

                                                {listsdata.MostInviteesByCompany.topInviteesCount && listsdata.MostInviteesByCompany.topInviteesCount.map((user: { companyName: string, userCount: string | number }) => {
                                                    return (<tr>
                                                        <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">{user.companyName}</td>
                                                        <td className="whitespace-nowrap px-4 py-2 text-gray-700">{user.userCount}</td>
                                                    </tr>)
                                                })}

                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            :
                            <div className="lg:col-span-4 border-l ps-8 min-h-screen flex justify-center items-center">
                                <Spinner />
                            </div>
                        }
                    </div>


                </div>
                :
                <div className="lg:col-span-4 border-l ps-8 min-h-screen flex justify-center items-center">
                    <Spinner />
                </div>
            }
        </>
    );
};

export default Dashboard;
