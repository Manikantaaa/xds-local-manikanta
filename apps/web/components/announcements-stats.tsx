import { PATH } from "@/constants/path";
import { useEffect, useState } from "react";
import Spinner from "./spinner";
import Breadcrumbs from "./breadcrumb";
import DataTable from "react-data-table-component";
import { authFetcher, authPut, deleteItem } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { Button, Modal, Tooltip } from "flowbite-react";
import { formatDate } from "@/services/common-methods";
import Link from "next/link";

export interface AnnoucementStat {
  announcementId: number;
  announcement: { company: {id: number, name: string, slug: string }, linkUrl?: string, title: string, createdAt: Date, isArchieve: boolean };
  companies: { name: string, clickCount: number, viewCount: number }[];
  clickCount: number;
  viewCount: number;
}

const AnnouncementsStats = () => {

  const [isLoading, setIsLoading] = useState(false);
  const [announcementStats, setAnnouncementStats] = useState<AnnoucementStat[]>([]);
  const [openCompaniesList, setOpenCompaniesList] = useState(false);
  const [companiesList, setCompaniesList] = useState<{ name: string, count: number }[]>([]);
  const [modalHeading, setModalHeading] = useState("");
  const [announcementId, setAnnouncementId] = useState<number | null>(null);
  const [openDeleteModel, setOpenDeleteModel] = useState(false);
  const [openArchiveStatusModel, setOpenArchiveStatusModel] = useState(false);
  const [announcementStatus, setAnnouncementStatus] = useState(false);
  const [searchString, setSearchString] = useState("");

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
      label: "Announcements Stats",
      path: "Announcements Stats",
    },
  ];

  const columns = [
    {
      id: "date",
      name: "Publish Date",
      cell: (row: AnnoucementStat) => formatDate(row.announcement?.createdAt),
      sortable: true,
      sortFunction: (a: AnnoucementStat, b: AnnoucementStat) =>
        new Date(a.announcement?.createdAt).getTime() -
        new Date(b.announcement?.createdAt).getTime(),
    },
    {
      id: "company",
      name: "Company",
      cell: (row: AnnoucementStat) => (
        <div className="text-blue-300">
          <Link prefetch={false} href={`/admin/company/${row.announcement?.company?.id}`} passHref>
            {" "}
            {row.announcement?.company?.name}{" "}
          </Link>
        </div>
      )
    },
    {
      id: "announcementName",
      name: "Announcement Name",
      cell: (row: AnnoucementStat) => (
        <div>
          {row.announcement?.title}
        </div>
      ),
      // sortable: true,
      // sortFunction: (a: AnnoucementStat, b: AnnoucementStat) => b?.announcement?.title - a?.followingCompanies?.length
    },
    {
      id: "externalLink",
      name: "External Link",
      cell: (row: AnnoucementStat) => (
        <>
          {
            row.announcement.linkUrl ?
            <div className="text-blue-300">
              <Link prefetch={false}
                href={row.announcement?.linkUrl &&
                  (row.announcement?.linkUrl.startsWith('http://') || row.announcement?.linkUrl.startsWith('https://') ?
                    row.announcement?.linkUrl : `https://${row.announcement?.linkUrl}`)}
                // href={row.website} 
                target="_blank">
                {row.announcement?.linkUrl}
              </Link>
            </div>
            :
            " - "
          }
        </>
      )
    },
    {
      id: "views",
      name: "# Views",
      cell: (row: AnnoucementStat) => (
        <div>
          {
            row.viewCount > 0 ?
            <>
              <span className="text-red-600">{`${row.viewCount} `}</span>
              <button className="link_color"
                onClick={(e) => { e.preventDefault(); setAnnouncementViewOrClickCompanies("view", row.companies); }}
              >
                {`[View List]`}
              </button>
            </>
            :
            " - "
          }
        </div>
      ),
      sortable: true,
      sortFunction: (a: AnnoucementStat, b: AnnoucementStat) => b.viewCount - a.viewCount,
    },
    {
      id: "clicks",
      name: "# Clicks",
      cell: (row: AnnoucementStat) => (
        <div>
          {
            row.clickCount > 0 ?
            <>
              <span className="text-red-600">{`${row.clickCount} `}</span>
              <button className="link_color"
                onClick={(e) => { e.preventDefault(); setAnnouncementViewOrClickCompanies("click", row.companies); }}
              >
                {`[View List]`}
              </button>
            </>
            :
            " - "
          }
        </div>
      ),
      sortable: true,
      sortFunction: (a: AnnoucementStat, b: AnnoucementStat) => b.clickCount - a.clickCount,
    },
    {
      id: "action",
      name: "Action",
      cell: (row: AnnoucementStat) => (
        <div>
          <button
            type="button"
            className="py-1.5 px-1.5 me-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg  hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100"
            onClick={() => {
              setAnnouncementId(row.announcementId);
              setAnnouncementStatus(row.announcement.isArchieve);
              setOpenArchiveStatusModel(true);
            }}
          >
            {
              row.announcement.isArchieve ?
                <Tooltip content="Show post" className="tier_tooltip_announcement">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32" fill="none">
                    <path d="M6.73999 4.3275C6.65217 4.22851 6.54558 4.14793 6.42639 4.09044C6.3072 4.03294 6.17778 3.99968 6.04564 3.99257C5.91351 3.98546 5.78127 4.00465 5.6566 4.04902C5.53193 4.0934 5.41731 4.16207 5.31938 4.25107C5.22144 4.34007 5.14215 4.44762 5.08609 4.56749C5.03003 4.68736 4.99832 4.81717 4.9928 4.94938C4.98727 5.0816 5.00804 5.2136 5.05391 5.33772C5.09978 5.46185 5.16982 5.57564 5.25999 5.6725L7.66499 8.31875C3.12499 11.105 1.17249 15.4 1.08624 15.595C1.02938 15.7229 1 15.8613 1 16.0012C1 16.1412 1.02938 16.2796 1.08624 16.4075C1.12999 16.5062 2.18874 18.8538 4.54249 21.2075C7.67874 24.3425 11.64 26 16 26C18.2408 26.0128 20.4589 25.5514 22.5087 24.6462L25.2587 27.6725C25.3466 27.7715 25.4531 27.8521 25.5723 27.9096C25.6915 27.9671 25.8209 28.0003 25.9531 28.0074C26.0852 28.0145 26.2175 27.9953 26.3421 27.951C26.4668 27.9066 26.5814 27.8379 26.6793 27.7489C26.7773 27.6599 26.8566 27.5524 26.9126 27.4325C26.9687 27.3126 27.0004 27.1828 27.0059 27.0506C27.0115 26.9184 26.9907 26.7864 26.9448 26.6623C26.899 26.5381 26.8289 26.4244 26.7387 26.3275L6.73999 4.3275ZM12.6562 13.8075L17.865 19.5387C17.0806 19.9514 16.1814 20.0919 15.3085 19.938C14.4357 19.7842 13.6386 19.3449 13.0425 18.689C12.4464 18.0331 12.085 17.1978 12.0151 16.3143C11.9452 15.4307 12.1707 14.549 12.6562 13.8075ZM16 24C12.1525 24 8.79124 22.6012 6.00874 19.8438C4.86663 18.7087 3.89526 17.414 3.12499 16C3.71124 14.9012 5.58249 11.8263 9.04374 9.8275L11.2937 12.2963C10.4227 13.4119 9.97403 14.7995 10.0272 16.214C10.0803 17.6284 10.6317 18.9785 11.584 20.0256C12.5363 21.0728 13.8282 21.7496 15.2312 21.9363C16.6343 22.1231 18.0582 21.8078 19.2512 21.0462L21.0925 23.0713C19.4675 23.6947 17.7405 24.0097 16 24ZM16.75 12.0712C16.4894 12.0215 16.2593 11.8703 16.1102 11.6509C15.9611 11.4315 15.9053 11.1618 15.955 10.9012C16.0047 10.6407 16.1559 10.4105 16.3753 10.2614C16.5948 10.1123 16.8644 10.0565 17.125 10.1062C18.3995 10.3533 19.56 11.0058 20.4333 11.9664C21.3067 12.9269 21.8462 14.1441 21.9712 15.4362C21.9959 15.7003 21.9147 15.9634 21.7455 16.1675C21.5762 16.3717 21.3328 16.5003 21.0687 16.525C21.0375 16.5268 21.0062 16.5268 20.975 16.525C20.725 16.5261 20.4838 16.4335 20.2987 16.2655C20.1136 16.0976 19.9981 15.8664 19.975 15.6175C19.8908 14.758 19.5315 13.9486 18.9504 13.3097C18.3694 12.6708 17.5977 12.2364 16.75 12.0712ZM30.91 16.4075C30.8575 16.525 29.5912 19.3287 26.74 21.8825C26.6426 21.9725 26.5282 22.0423 26.4036 22.0877C26.2789 22.1331 26.1465 22.1533 26.014 22.147C25.8814 22.1407 25.7515 22.1081 25.6317 22.0511C25.5119 21.9942 25.4047 21.9139 25.3162 21.8151C25.2277 21.7162 25.1598 21.6008 25.1163 21.4754C25.0729 21.3501 25.0549 21.2173 25.0633 21.0849C25.0716 20.9525 25.1063 20.8231 25.1652 20.7042C25.2241 20.5854 25.306 20.4794 25.4062 20.3925C26.8051 19.1358 27.9801 17.6505 28.8812 16C28.1093 14.5847 27.1358 13.2891 25.9912 12.1538C23.2087 9.39875 19.8475 8 16 8C15.1893 7.99901 14.3799 8.06465 13.58 8.19625C13.4499 8.21925 13.3166 8.21626 13.1876 8.18743C13.0587 8.15861 12.9368 8.10452 12.8289 8.0283C12.721 7.95209 12.6293 7.85525 12.559 7.74338C12.4887 7.63151 12.4413 7.50683 12.4196 7.37654C12.3978 7.24625 12.402 7.11293 12.432 6.98428C12.462 6.85564 12.5172 6.73421 12.5945 6.62703C12.6717 6.51984 12.7694 6.42901 12.8819 6.3598C12.9944 6.29058 13.1195 6.24434 13.25 6.22375C14.1589 6.07367 15.0787 5.99883 16 6C20.36 6 24.3212 7.6575 27.4575 10.7937C29.8112 13.1475 30.87 15.4963 30.9137 15.595C30.9706 15.7229 31 15.8613 31 16.0012C31 16.1412 30.9706 16.2796 30.9137 16.4075H30.91Z" fill="#8899A8" />
                  </svg>
                </Tooltip>
                :
                <Tooltip content="Hide post" className="tier_tooltip_announcement">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32" fill="none">
                    <path d="M30.9137 15.595C30.87 15.4963 29.8112 13.1475 27.4575 10.7937C24.3212 7.6575 20.36 6 16 6C11.64 6 7.67874 7.6575 4.54249 10.7937C2.18874 13.1475 1.12499 15.5 1.08624 15.595C1.02938 15.7229 1 15.8613 1 16.0012C1 16.1412 1.02938 16.2796 1.08624 16.4075C1.12999 16.5062 2.18874 18.8538 4.54249 21.2075C7.67874 24.3425 11.64 26 16 26C20.36 26 24.3212 24.3425 27.4575 21.2075C29.8112 18.8538 30.87 16.5062 30.9137 16.4075C30.9706 16.2796 31 16.1412 31 16.0012C31 15.8613 30.9706 15.7229 30.9137 15.595ZM16 24C12.1525 24 8.79124 22.6012 6.00874 19.8438C4.86704 18.7084 3.89572 17.4137 3.12499 16C3.89551 14.5862 4.86686 13.2915 6.00874 12.1562C8.79124 9.39875 12.1525 8 16 8C19.8475 8 23.2087 9.39875 25.9912 12.1562C27.1352 13.2912 28.1086 14.5859 28.8812 16C27.98 17.6825 24.0537 24 16 24ZM16 10C14.8133 10 13.6533 10.3519 12.6666 11.0112C11.6799 11.6705 10.9108 12.6075 10.4567 13.7039C10.0026 14.8003 9.88377 16.0067 10.1153 17.1705C10.3468 18.3344 10.9182 19.4035 11.7573 20.2426C12.5965 21.0818 13.6656 21.6532 14.8294 21.8847C15.9933 22.1162 17.1997 21.9974 18.2961 21.5433C19.3924 21.0892 20.3295 20.3201 20.9888 19.3334C21.6481 18.3467 22 17.1867 22 16C21.9983 14.4092 21.3657 12.884 20.2408 11.7592C19.1159 10.6343 17.5908 10.0017 16 10ZM16 20C15.2089 20 14.4355 19.7654 13.7777 19.3259C13.1199 18.8864 12.6072 18.2616 12.3045 17.5307C12.0017 16.7998 11.9225 15.9956 12.0768 15.2196C12.2312 14.4437 12.6122 13.731 13.1716 13.1716C13.731 12.6122 14.4437 12.2312 15.2196 12.0769C15.9956 11.9225 16.7998 12.0017 17.5307 12.3045C18.2616 12.6072 18.8863 13.1199 19.3259 13.7777C19.7654 14.4355 20 15.2089 20 16C20 17.0609 19.5786 18.0783 18.8284 18.8284C18.0783 19.5786 17.0609 20 16 20Z" fill="#0071C2" />
                  </svg>
                </Tooltip>
            }
          </button>
          <button type="button" className="py-1.5 px-1.5 me-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg  hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100"
            onClick={() => { setAnnouncementId(row.announcementId); setOpenDeleteModel(true); }}
          >
            <Tooltip content="Delete post" className="tier_tooltip_announcement">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32" fill="none">
                <path d="M27 6H22V5C22 4.20435 21.6839 3.44129 21.1213 2.87868C20.5587 2.31607 19.7956 2 19 2H13C12.2044 2 11.4413 2.31607 10.8787 2.87868C10.3161 3.44129 10 4.20435 10 5V6H5C4.73478 6 4.48043 6.10536 4.29289 6.29289C4.10536 6.48043 4 6.73478 4 7C4 7.26522 4.10536 7.51957 4.29289 7.70711C4.48043 7.89464 4.73478 8 5 8H6V26C6 26.5304 6.21071 27.0391 6.58579 27.4142C6.96086 27.7893 7.46957 28 8 28H24C24.5304 28 25.0391 27.7893 25.4142 27.4142C25.7893 27.0391 26 26.5304 26 26V8H27C27.2652 8 27.5196 7.89464 27.7071 7.70711C27.8946 7.51957 28 7.26522 28 7C28 6.73478 27.8946 6.48043 27.7071 6.29289C27.5196 6.10536 27.2652 6 27 6ZM12 5C12 4.73478 12.1054 4.48043 12.2929 4.29289C12.4804 4.10536 12.7348 4 13 4H19C19.2652 4 19.5196 4.10536 19.7071 4.29289C19.8946 4.48043 20 4.73478 20 5V6H12V5ZM24 26H8V8H24V26ZM14 13V21C14 21.2652 13.8946 21.5196 13.7071 21.7071C13.5196 21.8946 13.2652 22 13 22C12.7348 22 12.4804 21.8946 12.2929 21.7071C12.1054 21.5196 12 21.2652 12 21V13C12 12.7348 12.1054 12.4804 12.2929 12.2929C12.4804 12.1054 12.7348 12 13 12C13.2652 12 13.5196 12.1054 13.7071 12.2929C13.8946 12.4804 14 12.7348 14 13ZM20 13V21C20 21.2652 19.8946 21.5196 19.7071 21.7071C19.5196 21.8946 19.2652 22 19 22C18.7348 22 18.4804 21.8946 18.2929 21.7071C18.1054 21.5196 18 21.2652 18 21V13C18 12.7348 18.1054 12.4804 18.2929 12.2929C18.4804 12.1054 18.7348 12 19 12C19.2652 12 19.5196 12.1054 19.7071 12.2929C19.8946 12.4804 20 12.7348 20 13Z" fill="#E10E0E" />
              </svg>
            </Tooltip>
          </button>
        </div>
      )
    }
  ];

  const setAnnouncementViewOrClickCompanies = (from: string, companies: { name: string, clickCount: number, viewCount: number }[]) => {
    if (from == "view") {
      setModalHeading("# Views");
      const formattedCompanies = companies.map(item => {
        const elem = {
          name: item.name,
          count: item.viewCount
        };
        return elem;
      }).filter(item => item.count > 0);
      setCompaniesList(formattedCompanies);
    } else {
      setModalHeading("# Clicks");
      const formattedCompanies = companies.map(item => {
        const elem = {
          name: item.name,
          count: item.clickCount
        };
        return elem;
      }).filter(item => item.count > 0);
      setCompaniesList(formattedCompanies);
    }
    setOpenCompaniesList(true);
  }

  const getAnnouncementDetails = async () => {
    setIsLoading(true);
    const result = await authFetcher(getEndpointUrl(ENDPOINTS.getAnnouncementsStats(searchString)));
    if (result.success) {
      if (result.data && result.data.length > 0) {
        setAnnouncementStats(result.data);
      } else {
        setAnnouncementStats([]);
      }
    }
    setIsLoading(false);
  }

  const updateArchiveStatus = async () => {
    if (announcementId == null) return;
    const response = await authPut(getEndpointUrl(ENDPOINTS.adminToggleAnnouncementArchiveStatus(announcementId)));
    if (response && response.success) {
      const updatedAnnouncements = announcementStats.map(item =>
        item.announcementId === announcementId ? {
          ...item,
          announcement: {
            company: {
              id: item.announcement.company.id,
              name: item.announcement.company.name,
              slug: item.announcement.company.slug
            },
            linkUrl: item.announcement.linkUrl,
            title: item.announcement.title,
            createdAt: item.announcement.createdAt,
            isArchieve: !item.announcement.isArchieve
          }
        } : item
      );
      setAnnouncementStats(updatedAnnouncements);
      setAnnouncementId(null);
      setOpenArchiveStatusModel(false);
      setAnnouncementStatus(false);
    }
  }

  const deleteAnnouncement = async () => {
    if (announcementId == null) return;
    const response = await deleteItem(getEndpointUrl(ENDPOINTS.adminDeleteAnnouncement(announcementId)));
    if (response && response.success) {
      const updatedAnnouncements = announcementStats.filter(item => item.announcementId != announcementId);
      setAnnouncementStats(updatedAnnouncements);
      setAnnouncementId(null);
      setOpenDeleteModel(false);
    }
  }

  // const onClickSearch = () => {
  //   console.log(searchString);
  // }

  useEffect(() => {
    getAnnouncementDetails();
  }, [searchString]);

  return (
    <>
      <div className="lg:col-span-4 border-l ps-8 most_active">
        <div className="pb-6 pt-6 breadcrumbs_s">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="sm:text-left">
            <h1 className="font-bold default_text_color header-font">
              Announcements Stats
            </h1>
          </div>
        </div>
        <div className="pt-6">
          <div className="pb-6">
              <label htmlFor="voice-search" className="sr-only">
                Search
              </label>
              <div className="relative w-full">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g id="&#226;&#152;&#160;&#239;&#184;&#143; Icon / Color">
                      <path
                        id="Union"
                        d="M8.45324 8.98349L11.3571 11.8881C11.4306 11.9608 11.5266 11.9976 11.6226 11.9976C11.7186 11.9976 11.8146 11.9608 11.8881 11.8881C12.0343 11.7411 12.0343 11.5041 11.8881 11.3571L9.21461 8.6843C11.0001 6.6243 10.9145 3.49228 8.95782 1.53506C6.91083 -0.511688 3.58017 -0.511688 1.53468 1.53506C-0.511559 3.58181 -0.511559 6.91331 1.53468 8.96006C2.52668 9.95156 3.84485 10.4976 5.24625 10.4976C5.4532 10.4976 5.62116 10.3296 5.62116 10.1226C5.62116 9.91556 5.4532 9.74756 5.24625 9.74756C4.0443 9.74756 2.91508 9.27956 2.0648 8.42981C0.310985 6.67481 0.310985 3.82031 2.0648 2.06531C3.81786 0.310313 6.67164 0.311063 8.4277 2.06531C10.1815 3.82031 10.1815 6.67481 8.4277 8.42981C8.28149 8.57606 8.28149 8.81381 8.4277 8.96006C8.43594 8.96834 8.44446 8.97615 8.45324 8.98349Z"
                        fill="#343741"
                      />
                    </g>
                  </svg>
                </div>
                <input
                  type="search"
                  id="voice-search"
                  onChange={(e) => setSearchString(e.target.value.trim())}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="Search by Announcement, Company"
                  required
                  value={searchString}
                />
              </div>
              {/* <button
                type="submit"
                className="inline-flex items-center py-2 px-6 ms-2 text-sm font-medium text-gray-600 searc_btn  border border-gray-100 hover:bg-gray-200 focus:ring-4 focus:outline-non"
                onClick={(e) => { e.preventDefault(); onClickSearch(); }}
              >
                Search
              </button> */}
          </div>
          <div className="datatable_style">
            <DataTable
              columns={columns}
              data={announcementStats}
              highlightOnHover={true}
              pagination={true}
              paginationPerPage={10}
              paginationTotalRows={announcementStats.length}
              paginationRowsPerPageOptions={[10, 20, 50, 100, announcementStats.length]}
              paginationComponentOptions={{
                rowsPerPageText: "Records per page:",
                rangeSeparatorText: "out of",
              }}
              defaultSortFieldId="contactedBy"
              defaultSortAsc={false}
              progressPending={isLoading}
              progressComponent = { <Spinner></Spinner> }
            />
          </div>
        </div>
        <Modal show={openCompaniesList} size="md" onClose={() => setOpenCompaniesList(false)}>
          <Modal.Header>{modalHeading}</Modal.Header>
          <Modal.Body>
            <div className="space-y-6 pb-6">
              <ul className="buyer-stat-circle-list space-y-2">
                {
                  companiesList.sort((a, b) => b.count - a.count).map((item: { name: string, count: number }, index: number) => (
                    <li key={index}>
                      <span>{item.name}</span>
                      <span style={{ color: "red" }}>[{item.count}]</span>
                    </li>
                  ))
                }
              </ul>
            </div>
          </Modal.Body>
          <Modal.Footer className="modal_footer">
            <Button onClick={() => setOpenCompaniesList(false)}>Close</Button>
          </Modal.Footer>
        </Modal>

        <Modal
          show={openArchiveStatusModel}
          onClose={() => { setOpenArchiveStatusModel(false); setAnnouncementId(null); }}
          size="sm"
        >
          <Modal.Header className="modal_header">
            <b>Are you sure?</b>
          </Modal.Header>
          <Modal.Body>
            <div className="space-y-6">
              <div className="">
                <p className="text-sm default_text_color font-normal leading-6">
                  {announcementStatus ? 'You are about to show the Announcement' : 'You are about to hide the Announcement'}
                </p>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className="modal_footer">
            <Button
              color="gray"
              className="h-[40px] button_cancel"
              onClick={() => {
                setOpenArchiveStatusModel(false);
                setAnnouncementId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              className="h-[40px] button_blue"
              onClick={updateArchiveStatus}
            >
              Yes
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal
          show={openDeleteModel}
          onClose={() => { setOpenDeleteModel(false); setAnnouncementId(null); }}
          size="sm"
        >
          <Modal.Header className="modal_header">
            <b>Are you sure?</b>
          </Modal.Header>
          <Modal.Body>
            <div className="space-y-6">
              <div className="">
                <p className="text-sm default_text_color font-normal leading-6">
                  You are about to delete the announcement
                </p>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className="modal_footer">
            <Button
              color="gray"
              className="h-[40px] button_cancel"
              onClick={() => {
                setOpenDeleteModel(false);
                setAnnouncementId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              className="h-[40px] button_blue"
              onClick={deleteAnnouncement}
            >
              Delete
            </Button>
          </Modal.Footer>
        </Modal>

      </div>
    </>
  );
}

      export default AnnouncementsStats;