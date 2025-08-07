"use client";
import Link from "next/link";
import { useState } from "react";

export interface ReportsSidebarProps {
  setReprotType: (val: string) => void;
  reportType: string;
  flaggedUsersCount: number
}

const ReportsSidebar = (props: ReportsSidebarProps) => {
  // useEffect(() => {
  // }, [props.reportType])
  const [showServiceCategoryStats, setShowServiceCategoryStats] = useState(false);

  const onClickAdvertisingPerformance = (val: string) => {
    if(val == "advertisingPerformance"){ 
      setShowServiceCategoryStats(!showServiceCategoryStats);
    }
  }

  return (
    <div className="pt-6">
      <h2 className="font-bold default_text_color left_header_font">Reports</h2>
      <div className="default_text_color bg-white border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white sidebar_list_gap">
        <Link
          href=""
          className={`relative inline-flex items-center w-full focus:z-10 focus:ring-0 ${props.reportType == "dashboard" ? "anchor_active" : "link_color"
            }`}
          onClick={() => { setShowServiceCategoryStats(false); props.setReprotType("dashboard"); }}
        >
          Dashboard
        </Link>
        <Link
          href=""
          className={`relative inline-flex items-center w-full focus:z-10 focus:ring-0 ${props.reportType == "topViewedProfiles" ? "anchor_active" : "link_color"
            }`}
          onClick={() => { setShowServiceCategoryStats(false); props.setReprotType("topViewedProfiles"); }}
        >
          Top Viewed Profiles
        </Link>
        <Link
          href=""
          className={`relative inline-flex items-center w-full focus:z-10 focus:ring-0 ${props.reportType == "topViewedFoundingSponcers"
              ? "anchor_active"
              : "link_color"
            }`}
          onClick={() => { setShowServiceCategoryStats(false); props.setReprotType("topViewedFoundingSponcers"); }}
        >
          Top Viewed Founding Sponsors
        </Link>
        <Link
          href=""
          className={`relative inline-flex items-center w-full focus:z-10 focus:ring-0 ${props.reportType == "mostActiveBuyers" ? "anchor_active" : "link_color"
            }`}
          onClick={() => { setShowServiceCategoryStats(false); props.setReprotType("mostActiveBuyers"); }}
        >
          Most Active Buyers
        </Link>
        <Link
          href=""
          className={`relative inline-flex items-center w-full focus:z-10 focus:ring-0 ${props.reportType == "generalaccountstats" ? "anchor_active" : "link_color"
            }`}
          onClick={() => { setShowServiceCategoryStats(false); props.setReprotType("generalaccountstats"); }}
        >
          General Account Stats
        </Link>
        <Link
          href=""
          className={`relative inline-flex items-center w-full focus:z-10 focus:ring-0 ${props.reportType == "filterAndSearchStats" ? "anchor_active" : "link_color"
            }`}
          onClick={() => { setShowServiceCategoryStats(false); props.setReprotType("filterAndSearchStats"); }}
        >
          Filter & Search Stats
        </Link>
        <Link
          href=""
          className={`relative inline-flex items-center w-full focus:z-10 focus:ring-0 ${props.reportType == "companyProfilecompletion" ? "anchor_active" : "link_color"
            }`}
          onClick={() => { setShowServiceCategoryStats(false); props.setReprotType("companyProfilecompletion"); }}
        >
          Profile Completion %
        </Link>
        <Link
          href=""
          className={`relative inline-flex items-center w-full focus:z-10 focus:ring-0 ${props.reportType == "subscriptions" ? "anchor_active" : "link_color"
            }`}
          onClick={() => { setShowServiceCategoryStats(false); props.setReprotType("subscriptions"); }}
        >
          Subscriptions
        </Link>
        <Link
          href=""
          className={`relative inline-flex items-center w-full focus:z-10 focus:ring-0 link_color`}
          onClick={() => onClickAdvertisingPerformance("advertisingPerformance")}
        >
          Advertising Performance
          <svg className={`w-[20px] h-[20px] ms-2 text-gray-800 dark:text-white ${ showServiceCategoryStats ? "show_arrow_down" : ""}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7"/>
          </svg>
        </Link>
        
        {
          showServiceCategoryStats &&
          <div>
            <Link
              href=""
              className={`relative inline-flex items-center w-full focus:z-10 focus:ring-0 pl-4 text-xs font-low ${props.reportType == "bannerAdPerformance" ? "anchor_active" : "link_color"
                }`}
              onClick={() => props.setReprotType("bannerAdPerformance")}
            >
              Banner Ads
            </Link>
            <Link
              href=""
              className={`relative inline-flex items-center w-full focus:z-10 focus:ring-0 pl-4 text-xs font-low ${props.reportType == "serviceCategoryStats" ? "anchor_active" : "link_color"
                }`}
              onClick={() => props.setReprotType("serviceCategoryStats")}
            >
              Service Categories
            </Link>
          </div>
        }

        <Link
          href=""
          className={`relative inline-flex items-center w-full focus:z-10 focus:ring-0 ${props.reportType == "companyContactStats" ? "anchor_active" : "link_color"
            }`}
          onClick={() => { setShowServiceCategoryStats(false); props.setReprotType("companyContactStats"); }}
        >
          Engagement Clicks
        </Link>
        <Link
          href=""
          className={`relative inline-flex items-center w-full focus:z-10 focus:ring-0 ${props.reportType == "buyerStats" ? "anchor_active" : "link_color"
            }`}
          onClick={() => { setShowServiceCategoryStats(false); props.setReprotType("buyerStats"); }}
        >
          Buyer Stats
        </Link>
        <Link
          href=""
          className={`relative inline-flex items-center w-full focus:z-10 focus:ring-0 ${props.reportType == "ExportingStats" ? "anchor_active" : "link_color"
            }`}
          onClick={() => { setShowServiceCategoryStats(false); props.setReprotType("ExportingStats"); }}
        >
          Exporting Stats
        </Link>
        <Link
          href=""
          className={`relative inline-flex items-center w-full focus:z-10 focus:ring-0 ${props.reportType == "followDetails" ? "anchor_active" : "link_color"
            }`}
          onClick={() => { setShowServiceCategoryStats(false); props.setReprotType("followDetails"); }}
        >
          Following Stats
        </Link>
        <Link
          href=""
          className={`relative inline-flex items-center w-full focus:z-10 focus:ring-0 ${props.reportType == "mysparkStats" ? "anchor_active" : "link_color"
            }`}
          onClick={() => { setShowServiceCategoryStats(false); props.setReprotType("mysparkStats"); }}
        >
          My Spark Stats
        </Link>
        <Link
          href=""
          className={`relative inline-flex items-center w-full focus:z-10 focus:ring-0 ${props.reportType == "annoncement" ? "anchor_active" : "link_color"
            }`}
          onClick={() => { setShowServiceCategoryStats(false); props.setReprotType("annoncement"); }}
        >
          Announcements Stats
        </Link>
        <Link
          href=""
          className={`relative inline-flex items-center w-full focus:z-10 focus:ring-0 ${props.reportType == "testmonials" ? "anchor_active" : "link_color"
            }`}
          onClick={() => { setShowServiceCategoryStats(false); props.setReprotType("testmonials"); }}
        >
          Testimonial Stats
        </Link>
        <Link
          href=""
          className={`relative inline-flex items-center w-full focus:z-10 focus:ring-0 ${props.reportType == "flaggedUsers" ? "anchor_active" : "link_color"
            }`}
          onClick={() => { setShowServiceCategoryStats(false); props.setReprotType("flaggedUsers"); }}
        >
          Reported Companies {(props.flaggedUsersCount > 0) ? <span style={{ color: "red", marginLeft: "5px" }}>[ {props.flaggedUsersCount} ]</span> : ""}
        </Link>
        <Link
          href=""
          className={`relative inline-flex items-center w-full focus:z-10 focus:ring-0 ${props.reportType == "subUsersCreation" ? "anchor_active" : "link_color"
            }`}
          onClick={() => {setShowServiceCategoryStats(false); props.setReprotType("subUsersCreation"); }}
        >
          Users Created by Customers
        </Link>
        <Link
          href=""
          className={`relative inline-flex items-center w-full focus:z-10 focus:ring-0 ${props.reportType == "opportunities" ? "anchor_active" : "link_color"
            }`}
          onClick={() => { setShowServiceCategoryStats(false); props.setReprotType("opportunities"); }}
        >
          Opportunities
        </Link>
      </div>
    </div>
  );
};

export default ReportsSidebar;
