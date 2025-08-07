import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import "/public/css/detatable.css";
import { Label, Select, Button, Modal, TextInput, Textarea, Tooltip } from "flowbite-react"
import { authFetcher, authPostdata, authPutWithData, deleteItem } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import Multiselect from "multiselect-react-dropdown";
import { useUserContext } from "@/context/store";
import { formatDate } from "@/services/common-methods";
import { isValidJSON, serviceColoring } from "@/constants/serviceColors";
import { stringify } from "querystring";
import { sanitizeData } from "@/services/sanitizedata";
import usePagePermissions from "@/hooks/usePagePermissions";
import { userPermissionsType } from "@/types/user.type";

const ProjectPerformanceReviews = (props: { companyId: number, setrating: (setrating: number) => void, setLastUpdatedDate: (setLastUpdatedDate: string) => void, userPermissions: userPermissionsType }) => {

  const { user } = useUserContext();

  const [allProjectReviews, setAllProjectReviews] = useState<ProjectReview[]>([])
  const [services, setService] = useState<{ id: number, serviceName: string }[]>([]);
  const [selectedServices, setSelectedServices] = useState<{ serviceId: number }[]>([]);
  const [theSelectedServices, setTheSelectedServices] = useState<{ id: number, serviceName: string }[]>([]);
  const [qualityRating, setQualityRating] = useState(0);
  const [onTimeDeliveryRating, setOnTimeDeliveryRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [reviewId, setReviewId] = useState(0);
  const [isUpdateReview, setIsUpdateReview] = useState(false);

  const [projectReviewName, setProjectReviewName] = useState("");
  const [projectReviewComment, setProjectReviewComment] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [openDeleteProjectReviewModal, setOpenDeleteProjectReviewModal] = useState(false);
  const [openReviewCommentModal, setOpenReviewCommentModal] = useState(false);
  const columns = [
    {
      name: "Project",
      cell: (row: ProjectReview) => row.projectname,
      sortable: true,
    },
    {
      name: "Services",
      cell: (row: ProjectReview) => (
        <div className="text-blue-300 space-y-1">
          {
            row.spProjectservices.map((item, index) => (
              <span className="inline-block" key={index}>
                <button type="button" className={`text-gray-900 bg_${serviceColoring[item.service.groupId]} focus:outline-none font-medium rounded-sm text-sm px-2 py-1 me-2 cursor-default`}>{item.service.serviceName}</button>
              </span>
            ))
          }
        </div>
      ),
      sortable: true,
    },
    {
      name: "Quality",
      cell: (row: ProjectReview) => (
        <div className="flex items-center space-x-2">
          {
            Array.from({ length: row.quality }, (_, index) => (
              <span className={`rate_card w-[18px] h-[18px] ${getColorClass(row.quality)}`} key={index}></span>
            ))
          }
          {
            Array.from({ length: 5 - row.quality }, (_, index) => (
              <span className="rate_card w-[18px] h-[18px]" key={index}></span>
            ))
          }
        </div>
      ),
      sortable: true,
    },
    {
      name: "On-time Delivery",
      cell: (row: ProjectReview) => (
        <div className="flex items-center space-x-2">
          {
            Array.from({ length: row.onTimeDelivery }, (_, index) => (
              <span className={`rate_card w-[18px] h-[18px] ${getColorClass(row.onTimeDelivery)}`} key={index}></span>
            ))
          }
          {
            Array.from({ length: 5 - row.onTimeDelivery }, (_, index) => (
              <span className="rate_card w-[18px] h-[18px]" key={index}></span>
            ))
          }
        </div>
      ),
      sortable: true,
    },
    {
      name: "Communication",
      cell: (row: ProjectReview) => (
        <div className="flex items-center space-x-2">
          {
            Array.from({ length: row.communication }, (_, index) => (
              <span className={`rate_card w-[18px] h-[18px] ${getColorClass(row.communication)}`} key={index}></span>
            ))
          }
          {
            Array.from({ length: 5 - row.communication }, (_, index) => (
              <span className="rate_card w-[18px] h-[18px]" key={index}></span>
            ))
          }
        </div>
      ),
      sortable: true,
    },
    {
      name: "Overall Rating",
      cell: (row: ProjectReview) => (
        <div className="flex items-center space-x-2">
          {
            Array.from({ length: row.overallRating }, (_, index) => (
              <span className={`rate_card w-[18px] h-[18px] ${getColorClass(row.overallRating)}`} key={index}></span>
            ))
          }
          {
            Array.from({ length: 5 - row.overallRating }, (_, index) => (
              <span className="rate_card w-[18px] h-[18px]" key={index}></span>
            ))
          }
        </div>
      ),
      sortable: false,
    },
    {
      name: "Comments",
      cell: (row: ProjectReview) => (
        <div className="leading-5" onClick={() => { setProjectReviewComment(isValidJSON(row.comment) ? JSON.parse(row.comment) : row.comment); setOpenReviewCommentModal(true); }}>
          <div className="view_note_btn">
            <svg className="w-[20px] h-[20px] text-gray-800 me-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" stroke-width="2" d="M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6c0-1.2 4.03-6 9-6s9 4.8 9 6Z" />
              <path stroke="currentColor" stroke-width="2" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            View</div>
        </div>
      ),
      sortable: true,
    },
    {
      name: "Actions",
      omit: ((props.userPermissions.isCompanyUser && (!props.userPermissions.canWrite && !props.userPermissions.canDelete))),
      cell: (row: ProjectReview) => (
        <div className="space-x-4">
          {((!props.userPermissions.isCompanyUser) || (props.userPermissions.isCompanyUser && props.userPermissions.canWrite)) && 
            <button className="text-blue-300" onClick={(e) => { e.preventDefault(); setReviewId(row.id); openEditReviewModal(row); }}>
              <svg className="w-3.5 h-3.5 me-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path d="m13.835 7.578-.005.007-7.137 7.137 2.139 2.138 7.143-7.142-2.14-2.14Zm-10.696 3.59 2.139 2.14 7.138-7.137.007-.005-2.141-2.141-7.143 7.143Zm1.433 4.261L2 12.852.051 18.684a1 1 0 0 0 1.265 1.264L7.147 18l-2.575-2.571Zm14.249-14.25a4.03 4.03 0 0 0-5.693 0L11.7 2.611 17.389 8.3l1.432-1.432a4.029 4.029 0 0 0 0-5.689Z"></path></svg> Edit
            </button>
          }

          {((!props.userPermissions.isCompanyUser) || (props.userPermissions.isCompanyUser && props.userPermissions.canDelete)) && 
            <button className="text-blue-300" onClick={(e) => { e.preventDefault(); setReviewId(row.id); setProjectReviewName(row.projectname); setOpenDeleteProjectReviewModal(true) }}>
              <svg
                className="me-0.5 w-4 h-4 blue_c  dark:text-white"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 18 20"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M1 5h16M7 8v8m4-8v8M7 1h4a1 1 0 0 1 1 1v3H6V2a1 1 0 0 1 1-1ZM3 5h12v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5Z"
                />
              </svg> Delete
            </button>
          }
        </div>
      ),
      // <button className='btn btn-success' onClick={() => handleButtonClick(row)}>Click Me</button>,
    },
  ];

  const tableHeaderstyle = {
    headCells: {
      style: {
        fontWeight: "bold",
        fontSize: "14px",
        backgroundColor: "#F1F4FA",
      },
    },
  };

  useEffect(() => {
    getProjectPerformanceReviewDetails(true);
  }, []);

  async function getProjectPerformanceReviewDetails(isInitial = false) {
    if (user?.companyId != props.companyId) {
      const details = await authFetcher(`${getEndpointUrl(ENDPOINTS.getAllProjectPerformanceReviews(props.companyId))}`).catch((error) => {
        console.log(error);
      });
      if (details) {
        if (details.performanceReviews) {
          setAllProjectReviews(details.performanceReviews);
        }
        if (details.allServices) {
          setService(details.allServices);
        }
        if (details.performanceReviews) {
          const reviewDetails = details.performanceReviews;
          let count = 0;
          let overAllRatinglenth = 0;
          await reviewDetails.map((item: { overallRating: number }) => {
            if (item.overallRating > 0) {
              count = count + item.overallRating;
              overAllRatinglenth++;
            }
          })
          let ratingValue = count / overAllRatinglenth;
          if (ratingValue > 0 && ratingValue < 1) {
            props.setrating(1);
            ratingValue = 1;
          } else {
            props.setrating(Math.round(ratingValue));
            ratingValue = Math.round(ratingValue);
          }
          if(!isInitial) {
            const postData = {
              companyId: props.companyId,
              avgRating: (ratingValue && !isNaN(ratingValue)) ? ratingValue : 0
            }
            await authPostdata<{companyId: number, avgRating: number}>(`${getEndpointUrl(ENDPOINTS.updateAvgPerformanceReview)}`, postData).then((result) => {
              console.log(result);
            });
          }
        }
      }
    }
  }

  function onAddOrRemoveService(theSelectedService: { id: number; name: string }[]) {
    const theServices: { serviceId: number }[] = [];
    for (const item of theSelectedService) {
      theServices.push({ serviceId: item.id });
    }
    setSelectedServices(theServices);
  }

  function setTheQualityCount(val: number) {
    if (qualityRating == val) {
      setQualityRating(0);
    } else {
      setQualityRating(val);
    }
  }

  function setOnTimeDeliveryCount(val: number) {
    if (onTimeDeliveryRating == val) {
      setOnTimeDeliveryRating(0);
    } else {
      setOnTimeDeliveryRating(val);
    }
  }

  function setCommunicationCount(val: number) {
    if (communicationRating == val) {
      setCommunicationRating(0);
    } else {
      setCommunicationRating(val);
    }
  }

  function openAddNewReviewModal() {
    setIsUpdateReview(false);
    setSelectedServices([]);
    setTheSelectedServices([]);
    setQualityRating(0);
    setOnTimeDeliveryRating(0);
    setCommunicationRating(0);
    setProjectReviewName("");
    setProjectReviewComment("");
    setOpenModal(true);
  }

  async function saveTheProjectReview() {
    if (projectReviewName == "" && qualityRating == 0 && onTimeDeliveryRating == 0 && communicationRating == 0 && projectReviewComment == "") {
      setOpenModal(false);
      return false;
    }
    let postData = {
      buyerId: (user && user.companyId) ? user.companyId : 0,
      companyId: props.companyId,
      projectname: projectReviewName,
      services: selectedServices,
      quality: qualityRating,
      onTimeDelivery: onTimeDeliveryRating,
      communication: communicationRating,
      overallRating: Math.round((qualityRating + onTimeDeliveryRating + communicationRating) / 3),
      comment: projectReviewComment != '' ? JSON.stringify(projectReviewComment) : projectReviewComment,
    };
    postData = sanitizeData(postData);
    const saveTheReview = await authPostdata<ProjectReviewDto>(`${getEndpointUrl(ENDPOINTS.addNewProjectPerformanceReview)}`, postData).catch((err) => {
      console.log(err);
    })
    getProjectPerformanceReviewDetails()
    setOpenModal(false);
    props.setLastUpdatedDate(formatDate(new Date()));
  }

  async function deleteTheReview() {
    if (reviewId && reviewId != 0) {
      const isDelete = await deleteItem(`${getEndpointUrl(ENDPOINTS.deleteProjectPerformanceReview(reviewId))}`).catch((err) => {
        console.log(err);
      });
    }
    getProjectPerformanceReviewDetails();
    setOpenDeleteProjectReviewModal(false);
    props.setLastUpdatedDate(formatDate(new Date()));

  }

  function openEditReviewModal(review: ProjectReview) {
    setIsUpdateReview(true);
    setReviewId(review.id);
    setProjectReviewName(review.projectname);
    setProjectReviewComment(isValidJSON(review.comment) ? JSON.parse(review.comment) : review.comment);
    setQualityRating(review.quality);
    setOnTimeDeliveryRating(review.onTimeDelivery);
    setCommunicationRating(review.communication);
    const theServices: { id: number, serviceName: string }[] = [];
    const theServiceIds: { serviceId: number }[] = [];
    review.spProjectservices.forEach((item: { service: { id: number, serviceName: string } }) => {
      theServices.push(item.service);
      const theObj = {
        serviceId: item.service.id
      }
      theServiceIds.push(theObj);
    });
    setTheSelectedServices(theServices);
    setSelectedServices(theServiceIds);
    setOpenModal(true)
  }

  async function updateProjectReview() {
    if (projectReviewName == "" && qualityRating == 0 && onTimeDeliveryRating == 0 && communicationRating == 0 && projectReviewComment == "") {
      setOpenModal(false);
      return false;
    }
    if (reviewId && reviewId != 0) {
      let overAllCalc: number = 3;
      if ((qualityRating != 0 && onTimeDeliveryRating == 0 && communicationRating == 0) || (qualityRating == 0 && onTimeDeliveryRating != 0 && communicationRating == 0) || (qualityRating == 0 && onTimeDeliveryRating == 0 && communicationRating != 0)) {
        overAllCalc = 1;
      } else if ((qualityRating != 0 && onTimeDeliveryRating != 0 && communicationRating == 0) || (qualityRating != 0 && onTimeDeliveryRating != 0 && communicationRating == 0) || (qualityRating == 0 && onTimeDeliveryRating != 0 && communicationRating != 0)) {
        overAllCalc = 2;
      } else {
        overAllCalc = 3;
      }
      let postData = {
        buyerId: (user && user.companyId) ? user.companyId : 0,
        companyId: props.companyId,
        projectname: projectReviewName,
        services: selectedServices,
        quality: qualityRating,
        onTimeDelivery: onTimeDeliveryRating,
        communication: communicationRating,
        overallRating: Math.round((qualityRating + onTimeDeliveryRating + communicationRating) / overAllCalc),
        comment: projectReviewComment != '' ? JSON.stringify(projectReviewComment) : projectReviewComment,
      };
      postData = sanitizeData(postData);
      const update = await authPutWithData<ProjectReviewDto>(`${getEndpointUrl(ENDPOINTS.updateProjectReview(reviewId))}`, postData).catch((err) => {
        console.log(err)
      });
    }
    getProjectPerformanceReviewDetails();
    setOpenModal(false);
  }

  function getColorClass(val: number) {
    if (val <= 2) {
      return "star_red";
    } else if (val <= 4) {
      return "star_orange"
    } else if (val == 5) {
      return "star_green"
    }
  }

  return (
    <>

      <div className="contactus">
        <div className="flex items-center justify-between py-6">
          <div className="text-left">
            <h1 className="font-bold default_text_color header-font lg:w-[400px] w-[230px] truncate">
              Project Performance Reviews
            </h1>
          </div>
          {((!props.userPermissions.isCompanyUser) || (props.userPermissions.isCompanyUser && props.userPermissions.canWrite)) &&
            <div className="link_color text-sm cursor-pointer" onClick={() => { openAddNewReviewModal() }}>
              <svg className="w-3.5 h-3.5 me-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.546.5a9.5 9.5 0 1 0 9.5 9.5 9.51 9.51 0 0 0-9.5-9.5ZM13.788 11h-3.242v3.242a1 1 0 1 1-2 0V11H5.304a1 1 0 0 1 0-2h3.242V5.758a1 1 0 0 1 2 0V9h3.242a1 1 0 1 1 0 2Z">
                </path>
              </svg>
              Add New
            </div>
          }
        </div>
        <div className="py-0 project_performance">
          {allProjectReviews && allProjectReviews.length > 0 ?
            <DataTable
              customStyles={tableHeaderstyle}
              columns={columns}
              data={allProjectReviews}
              highlightOnHover={true}
              pagination={true}
              paginationPerPage={5}
              paginationRowsPerPageOptions={[5, 10]}
              noDataComponent="You have not yet added any project performance reviews."
              paginationComponentOptions={{
                rowsPerPageText: "Records per page:",
                rangeSeparatorText: "out of",
              }}

            />
            :
            <p className="text-sm font-normal  italic">
              You have not yet added any project performance reviews.
            </p>
          }

        </div>
      </div>

      <Modal show={openModal} onClose={() => setOpenModal(false)} size="lg" className="text_box_readuce">
        <Modal.Header className="modal_header">Project Performance Reviews</Modal.Header>
        <Modal.Body>
          <form className="flex flex-col gap-2">
            <div>
              <div className="mb-2 inline-flex items-center">
                <Label htmlFor="project" value="Project" className="font-bold text-xs" />
                <Tooltip className="tier_tooltip_2 inline-flex" content="Indicates a project the Service Provider has worked on, or is currently engaged in." trigger="hover">
                  <svg className="w-[16px] h-[16px] text-gray-700 ms-2 -mt-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                    <path fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm9.408-5.5a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2h-.01ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4a1 1 0 0 0-1-1h-2Z" clip-rule="evenodd" />
                  </svg>
                </Tooltip>
              </div>
              <TextInput id="project" name="pprName" value={projectReviewName} onChange={(e) => setProjectReviewName(e.target.value)} type="text" placeholder="" required shadow sizing="sm" />
            </div>
            <div>
              <div className="mb-2 inline-flex items-center">
                <Label htmlFor="services" value="Services" className="font-bold text-xs" />
                <Tooltip className="tier_tooltip_2 inline-flex" content="Select one or multiple services you would like to rate." trigger="hover">
                  <svg className="w-[16px] h-[16px] text-gray-700 ms-2 -mt-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                    <path fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm9.408-5.5a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2h-.01ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4a1 1 0 0 0-1-1h-2Z" clip-rule="evenodd" />
                  </svg>
                </Tooltip>
              </div>
              <Multiselect
                emptyRecordMsg="-"
                options={services}
                displayValue="serviceName"
                onSelect={(e) => onAddOrRemoveService(e)}
                onRemove={(e) => onAddOrRemoveService(e)}
                selectedValues={theSelectedServices}
              />
            </div>
            <div className="pt-3">
              <div className="mb-3 inline-flex items-center">
                <Label htmlFor="quality" value="Quality" className="font-bold text-xs" />
                <Tooltip className="tier_tooltip_2 inline-flex" content="The creative and/or technical quality of the final deliverables. If no score selected, the category will not be counted towards an overall performance score." trigger="hover">
                  <svg className="w-[16px] h-[16px] text-gray-700 ms-2 -mt-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                    <path fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm9.408-5.5a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2h-.01ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4a1 1 0 0 0-1-1h-2Z" clip-rule="evenodd" />
                  </svg>
                </Tooltip>
              </div>
              <div className="flex items-center space-x-7">
                {
                  Array.from({ length: qualityRating }, (_, index) => (
                    <span className={`rate_card w-[28px] h-[28px] cursor-pointer ${getColorClass(qualityRating)}`} key={index} onClick={(e) => { setTheQualityCount(index + 1) }}></span>
                  ))
                }
                {
                  Array.from({ length: 5 - qualityRating }, (_, index) => (
                    <span className="rate_card w-[28px] h-[28px] cursor-pointer" key={index + qualityRating} onClick={(e) => { setTheQualityCount(index + 1 + qualityRating) }}></span>
                  ))
                }
              </div>
            </div>
            <div className="pt-3">
              <div className="mb-3 inline-flex items-center">
                <Label htmlFor="ontimedelivery" value="On-time Delivery" className="font-bold text-xs" />
                <Tooltip className="tier_tooltip_2 inline-flex" content="The ability of the Service Provider to meet milestone deliveries to schedule. If no score selected, the category will not be counted towards an overall performance score." trigger="hover">
                  <svg className="w-[16px] h-[16px] text-gray-700 ms-2 -mt-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                    <path fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm9.408-5.5a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2h-.01ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4a1 1 0 0 0-1-1h-2Z" clip-rule="evenodd" />
                  </svg>
                </Tooltip>
              </div>
              <div className="flex items-center space-x-7">
                {
                  Array.from({ length: onTimeDeliveryRating }, (_, index) => (
                    <span className={`rate_card w-[28px] h-[28px] cursor-pointer ${getColorClass(onTimeDeliveryRating)}`} key={index} onClick={(e) => { setOnTimeDeliveryCount(index + 1) }}></span>
                  ))
                }
                {
                  Array.from({ length: 5 - onTimeDeliveryRating }, (_, index) => (
                    <span className="rate_card w-[28px] h-[28px] cursor-pointer" key={index + onTimeDeliveryRating} onClick={(e) => { setOnTimeDeliveryCount(index + 1 + onTimeDeliveryRating) }}></span>
                  ))
                }
              </div>
            </div>
            <div className="pt-3">
              <div className="mb-3 inline-flex items-center">
                <Label htmlFor="communication" value="Communication " className="font-bold text-xs" />
                <Tooltip className="tier_tooltip_2 inline-flex" content="The quality and effectiveness of the Service Provider's communication. If no score selected, the category will not be counted towards an overall performance score." trigger="hover">
                  <svg className="w-[16px] h-[16px] text-gray-700 ms-2 -mt-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                    <path fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm9.408-5.5a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2h-.01ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4a1 1 0 0 0-1-1h-2Z" clip-rule="evenodd" />
                  </svg>
                </Tooltip>
              </div>
              <div className="flex items-center space-x-7">
                {
                  Array.from({ length: communicationRating }, (_, index) => (
                    <span className={`rate_card w-[28px] h-[28px] cursor-pointer ${getColorClass(communicationRating)}`} key={index} onClick={(e) => { setCommunicationCount(index + 1) }}></span>
                  ))
                }
                {
                  Array.from({ length: 5 - communicationRating }, (_, index) => (
                    <span className="rate_card w-[28px] h-[28px] cursor-pointer" key={index + communicationRating} onClick={(e) => { setCommunicationCount(index + 1 + communicationRating) }}></span>
                  ))
                }
              </div>
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="note" value="Comments" className="font-bold text-xs" />
              </div>
              <Textarea id="note" name="projectReviewComment" value={projectReviewComment} onChange={(e) => setProjectReviewComment(e.target.value)} placeholder="" required rows={4} />
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer className="modal_footer">
          <Button color="gray" onClick={() => setOpenModal(false)}> Cancel</Button>
          <Button onClick={() => { isUpdateReview ? updateProjectReview() : saveTheProjectReview() }}>Save</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={openDeleteProjectReviewModal} onClose={() => setOpenDeleteProjectReviewModal(false)} size="lg" className="text_box_readuce">
        <Modal.Header className="modal_header"><b>Are You Sure ?</b></Modal.Header>
        <Modal.Body>
          <div>
            <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              You are about to delete {projectReviewName} ?
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer className="modal_footer">
          <Button color="gray" onClick={() => setOpenDeleteProjectReviewModal(false)}> Cancel</Button>
          <Button onClick={(e) => { e.preventDefault(); deleteTheReview(); }}>Ok</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={openReviewCommentModal} onClose={() => setOpenReviewCommentModal(false)}>
        <Modal.Header className="modal_header">
          <b>Comment</b>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            <div className={`${projectReviewComment != '' ? 'text-sm whitespace-break-spaces' : 'text-sm italic'} `}>{projectReviewComment && projectReviewComment != '' ? projectReviewComment : 'No Comments Available'}</div>
          </div>
        </Modal.Body>
        <Modal.Footer className="modal_footer">
          <Button
            className="h-[40px] button_blue"
            onClick={() => {
              setOpenReviewCommentModal(false);
            }}
          >
            Ok
          </Button>
        </Modal.Footer>
      </Modal>

    </>
  );
}

export default ProjectPerformanceReviews;

export interface ProjectReview {
  id: number;
  projectname: string;
  spProjectservices: { service: { id: number, serviceName: string, groupId: number } }[];
  quality: number;
  onTimeDelivery: number;
  communication: number;
  overallRating: number;
  comment: string;
}

export interface ProjectReviewDto {
  buyerId: number;
  companyId: number;
  projectname: string;
  services: { serviceId: number }[];
  quality: number;
  onTimeDelivery: number;
  communication: number;
  overallRating: number;
  comment: string;
}