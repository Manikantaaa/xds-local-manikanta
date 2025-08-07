"use client";
import MostActiveBuyers from "@/components/mostActiveBuyers";
import ReportsSidebar from "@/components/reportsSidebar";
import TopViewedProfiles from "@/components/top-viewed-profiles";
import TopViewedFoundingSponcers from "@/components/topViewedFoundingSponsers";
import UserGeneralAccountStat from "@/components/user-general-account-stats";
import { useEffect, useState } from "react";
import "../../../public/css/detatable.css";
import FiltersAndSearchStats from "@/components/filtersAndSearchStats";
import CompanyProfileStatus from "@/components/company-profile-completion";
import BuyerStats from "@/components/buyerStats";
import SubscriptionReports from "@/components/subscriptionReports";
import CompanyContactStats from "@/components/companyContactStats";
import ExportExceedReport from "@/components/exportexeedreports";
import BannerAdPerformanceReport from "@/components/bannerAdPerformanceReport";
import FlaggedUsers from "@/components/flaggedUsers";
import { authFetcher } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import SubUsersCreatedBy from "@/components/sub-users-created-by";
import CompanyFollowingDetails from "@/components/company-following-details";
import MysparkStatsReport from "@/components/mysparkStatsReport";
import Dashboard from "@/components/admin/admin-dashboard";
import OpportunitiesReport from "@/components/opportiniesReport";
import ServiceCategoryStatComponent from "@/components/service-cateogory-stat-component";
import AnnouncementsStats from "@/components/announcements-stats";
import TestmonialStats from "@/components/testmonial-stats";
// import SharingExceedReport from "@/components/sharingexeedreports";

const Reports = () => {
  const [reportStatus, setReportStatus] = useState("dashboard");
  const [flaggedUsersCount, setFlaggedUsersCount] = useState(0);
  const [flaggedUsers, setFlaggedUsers] = useState<FlaggedUsers[]>([]);
  const [reportsRender, setReportsRender] = useState(false);
  const [hideAndShow, setHideAndShow] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    getFlaggedUsers();
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [reportsRender]);

  const getFlaggedUsers = async () => {
    authFetcher(`${getEndpointUrl(ENDPOINTS.getFlaggedUsers)}`).then((result) => {
      if (result && result.data) {
        setFlaggedUsers(result.data);
        const arrCount = result.data.reduce((count: number, item: FlaggedUsers) => {
          if (!item.isReportResolved) {
            return count + 1;
          }
          return count;
        }, 0);
        console.log(arrCount);
        setFlaggedUsersCount(arrCount);
      }
    }).catch((err) => {
      console.log(err);
    });
  }

  useEffect(() => {
    setHideAndShow(false);
  }, [reportStatus])

  return (
    <div className="w-full max-w-full px-5 pos_r">
      <div className="grid grid-cols-1 gap-0 lg:grid-cols-5 lg:gap-0">
        <div className="block md:hidden mt-4" onClick={() => setHideAndShow(!hideAndShow)}><button type="button" id="radix-:r1m:" aria-haspopup="menu" aria-expanded="false" data-state="closed" className="focus-visible:outline-none  button_blue px-1 rounded-sm text-white me-2"><svg className="w-[26px] h-[26px] text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M9 8h10M9 12h10M9 16h10M5 8h0m0 4h0m0 4h0"></path></svg></button></div>
        {hideAndShow ?
          <div className="dashboard_menu_left">
            <ReportsSidebar
              setReprotType={(val: string) => setReportStatus(val)}
              reportType={reportStatus}
              flaggedUsersCount={flaggedUsersCount}
            ></ReportsSidebar>
          </div>
          :
          !isMobile && <ReportsSidebar
            setReprotType={(val: string) => setReportStatus(val)}
            reportType={reportStatus}
            flaggedUsersCount={flaggedUsersCount}
          ></ReportsSidebar>
        }

        {reportStatus == "dashboard" ? (
          <Dashboard
            setReprotType={(val: string) => setReportStatus(val)}
          ></Dashboard>
        ) : reportStatus == "topViewedProfiles" ? (
          <TopViewedProfiles></TopViewedProfiles>
        ) : reportStatus == "mostActiveBuyers" ? (
          <MostActiveBuyers></MostActiveBuyers>
        ) : reportStatus == "topViewedFoundingSponcers" ? (
          <TopViewedFoundingSponcers></TopViewedFoundingSponcers>
        ) : reportStatus == "generalaccountstats" ? (
          <UserGeneralAccountStat></UserGeneralAccountStat>
        ) : reportStatus == "filterAndSearchStats" ? (
          <FiltersAndSearchStats></FiltersAndSearchStats>
        ) : reportStatus == "companyProfilecompletion" ? (
          <CompanyProfileStatus></CompanyProfileStatus>
        ) : reportStatus == "buyerStats" ? (
          <BuyerStats></BuyerStats>
        ) : reportStatus == "subscriptions" ? (
          <SubscriptionReports></SubscriptionReports>
        ) : reportStatus == "companyContactStats" ? (
          <CompanyContactStats></CompanyContactStats>
        ) : reportStatus == "ExportingStats" ? (
          <ExportExceedReport></ExportExceedReport>
        ) : reportStatus == "bannerAdPerformance" ? (
          <BannerAdPerformanceReport></BannerAdPerformanceReport>
        ) : reportStatus == "serviceCategoryStats" ? (
          <ServiceCategoryStatComponent></ServiceCategoryStatComponent>
        ): reportStatus == "flaggedUsers" ? (
          <FlaggedUsers flaggedUsers={flaggedUsers} reportsRender={reportsRender} setReportsRender={(val) => setReportsRender(val)}></FlaggedUsers>
        ) : reportStatus == "subUsersCreation" ? (
          <SubUsersCreatedBy></SubUsersCreatedBy>
        ) : reportStatus == "followDetails" ? (
          <CompanyFollowingDetails></CompanyFollowingDetails>
        ) : reportStatus == "mysparkStats" ? (
          <MysparkStatsReport></MysparkStatsReport>
        ) : reportStatus == "opportunities" ? (
          <OpportunitiesReport></OpportunitiesReport>
        ) : reportStatus == "annoncement" ? (
          <AnnouncementsStats></AnnouncementsStats>
        ) : reportStatus == "testmonials" ? (
          <TestmonialStats></TestmonialStats>
        ) :
        (
          ""
        )}
      </div>
    </div>
  );
};

export default Reports;
