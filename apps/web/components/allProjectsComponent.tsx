import Link from "next/link";
import Image from "next/image";
import squareimage from "@/public/squareimage.png";
import { useEffect, useRef, useState } from "react";
import { getEndpointUrl, ENDPOINTS } from "@/constants/endpoints";
import { authFetcher, authPutWithData, deleteItem } from "@/hooks/fetcher";
import { useUserContext } from "@/context/store";
import { redirect } from "next/navigation";
import { PATH } from "@/constants/path";
import { formatDate } from "@/services/common-methods";
import { Modal, Button } from "flowbite-react";
import { isValidJSON } from "@/constants/serviceColors";
import Spinner from "@/components/spinner";
import { useProfileStatusContext } from "@/context/profilePercentage";
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

interface TheProject {
  id: number;
  name: string;
  projectCDate: Date;
  description: string;
  platforms: { id: number; name: string }[];
  files: {thumbnail: string, id: number; type: string; fileUrl: string; isLoaded?: boolean }[];
  testimonial_feedback:string;
  testimonial_name:string;
  testimonial_title:string;
  testimonial_company:string;
  reOrderingId: number;
}

const AllProjectsComponent = () => {
  const [allProjects, setAllProjects] = useState<TheProject[]>([]);
  const { user } = useUserContext();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [projectId, setProjectId] = useState<number>(0);
  const [projectName, setProjectName] = useState<string>("");
  const [isProjectUpdated, setIsProjectUpdated] = useState<boolean>(false);
  const [updatingOrder, setUpdatingOrder] = useState<{id: number, reOrderingId: number}[]>([]);
  if (!user) {
    redirect(PATH.HOME.path);
  }

  useEffect(() => {
    fetchInformations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProjectUpdated]);

  const { setProfilepercentage } = useProfileStatusContext();
  const { profilepercentage } = useProfileStatusContext();

  async function fetchInformations() {
    if (user) {
      await authFetcher(
        `${getEndpointUrl(ENDPOINTS.getPortfolioProjects(user.companyId))}`,
      )
        .then((result) => {
          const toSetTheProjects: TheProject[] = [];
          if (result.success && result.data.response.length > 0) {
            for (const item of result.data.response) {
              const theSingleProject: TheProject = {
                id: item.id,
                name: item.name,
                projectCDate: item.completionDate,
                description: item.description,
                testimonial_feedback: item.testimonial_feedback,
                testimonial_name: item.testimonial_name,
                testimonial_title: item.testimonial_title,
                testimonial_company: item.testimonial_company,
                platforms: [],
                files: [],
                reOrderingId: item.reOrderingId,
              };
              if (item.PlatformsOpt && item.PlatformsOpt.length > 0) {
                item.PlatformsOpt.forEach((platform: any) => {
                  theSingleProject.platforms.push(platform.platforms);
                });
              }
              if (item.FileUploads && item.FileUploads.length > 0) {
                item.FileUploads.forEach((file: any) => {
                  theSingleProject.files.push({
                    id: file.id,
                    type: file.type,
                    fileUrl: file.fileUrl,
                    thumbnail: file.thumbnail,
                    isLoaded: false
                  });
                });
              }
              toSetTheProjects.push(theSingleProject);
            }
          } else {
            if (profilepercentage) {
              setProfilepercentage({
                generalInfoProfilePerc: profilepercentage ? profilepercentage.generalInfoProfilePerc : 0,
                aboutProfilePerc: profilepercentage ? profilepercentage.aboutProfilePerc : 0,
                ourWorkAlbumsProfilePerc: result.data.data > 0 ?  profilepercentage.ourWorkAlbumsProfilePerc : 0,
                ourWorkProjectProfilePerc: result.data.data > 0 ? profilepercentage.ourWorkAlbumsProfilePerc : 0,
                servicesProfilePerc: profilepercentage ?  profilepercentage.servicesProfilePerc : 0,
                certificationsProfilePerc: profilepercentage ?  profilepercentage.certificationsProfilePerc : 0,
                contactsProfilePerc: profilepercentage ?  profilepercentage.contactsProfilePerc : 0,
                profileCompleted: result.data.data > 0 ? true : false,
                bannerAssetId: profilepercentage.bannerAssetId,
              });
            };
          }
          setAllProjects(toSetTheProjects);
          if(toSetTheProjects && toSetTheProjects.length > 0) {
            setVisibleCounts(initializeVisibleCounts(toSetTheProjects));
          }
          setIsLoading(false);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }
  const deleteOurProject = (projectId: number) => {
    deleteItem(
      `${getEndpointUrl(ENDPOINTS.deletePortfolioProjects(projectId))}`,
    ).then(() => {
      setIsProjectUpdated(!isProjectUpdated);
    });
    setDeleteModal(false);
  };

  const handlePosChange = (currentPos: any, newPos: any) => {
    const updatedIndexValues: TheProject[] = [...allProjects];
        const movedIndexValue = updatedIndexValues.splice(currentPos, 1)[0];
        updatedIndexValues.splice(newPos, 0, movedIndexValue);
        updatedIndexValues.forEach((faq, index) => {
            faq.reOrderingId = index;
        });
        updatedIndexValues.map((faq) => {
        setUpdatingOrder((prevImages) => [
          ...prevImages,
          {
            id: faq.id,
            reOrderingId: faq.reOrderingId,
          },
      ]);
    })
  }

  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const moveItem = (index: number, direction: number) => {
    setUpdatingOrder([]);
    const newItems = [...allProjects];
    const [movedItem] = newItems.splice(index, 1);
    const newIndex = index + direction;
    newItems.splice(newIndex, 0, movedItem);
    newItems.forEach((faq, index) => {
      faq.reOrderingId = index + 1;
    });
    setAllProjects(newItems);
    if(newItems && newItems.length > 0) {
      setVisibleCounts(initializeVisibleCounts(newItems));
    }
    setTimeout(() => {
      const movedElement = itemRefs.current[newIndex];
      if (movedElement) {
        movedElement.focus();
        movedElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }
    }, 0);
    newItems.map((faq) => {
      setUpdatingOrder((prevImages) => [
        ...prevImages,
        {
          id: faq.id,
          reOrderingId: faq.reOrderingId,
        },
    ]);
  })
  };
  
  useEffect(() => {
    const addFaqContent = async() =>{
      const postData:{id: number, reOrderingId: number}[] = updatingOrder;
      await authPutWithData(`${getEndpointUrl(ENDPOINTS.updatePortfolioProjects(user.companyId))}`, postData)
      .then((result) => {
      }).catch((err) => {
        console.log(err);
      });
    }
    addFaqContent();

  },[updatingOrder]);


  const [visibleCounts, setVisibleCounts] = useState<{[key: number]: number;}>({});
  const initializeVisibleCounts = (albums: TheProject[]): {[key: number]: number;} => {
    const initialCounts: {[key: number]: number;} = {};
    albums.forEach(album => {
      initialCounts[album.id] = 5;
    });
    return initialCounts;
  };

  // useEffect(() => {
  //   if (allProjects && allProjects.length > 0) {
  //     setVisibleCounts(initializeVisibleCounts(allProjects));
  //   }
  // }, [allProjects]);

  const handleViewMore = (albumId: number) => {
    setVisibleCounts((prevCounts) => ({
      ...prevCounts,
      [albumId]: (prevCounts[albumId] || 5) + 95,
    }));
  };

  const handleViewLess = (albumId: number) => {
    setVisibleCounts((prevCounts) => ({
      ...prevCounts,
      [albumId]: 5,
    }));
  };


  return (
    <>
      {
        !isLoading ?
        <div className="pb-12">
          {allProjects && allProjects.length > 0 ? (
            ""
          ) : (
            <div className="pt-6 text-center">
              <p className="text-sm font-normal italic">
                It looks like you don't have any Projects yet.
                <br />
                You can use Projects to showcase on your profile.
              </p>
              <p className="pt-6 text-sm font-normal">
                <Link
                prefetch={false}
                  className="link_color underline"
                  href="/company-profile/our-works/create-project"
                >
                  Click here to create a Project
                </Link>
              </p>
            </div>
          )}
          {allProjects.map((item, index) => (
            <div key={item.reOrderingId} >
              <div className="project-highlights relative"  style={{ flexGrow: 1 }}>
                <div className="sm:text-left pb-6 flex justify-between" ref={(el) => {itemRefs.current[index] = el}} tabIndex={-1} >
                <h1 className="font-bold default_text_color heading-sub-font">
                    {item.name}
                    <span className="drag_album">
                    {index !== 0 &&
                      <button
                      onClick={() => moveItem(index, -1)}
                      style={{ marginBottom: 4 }}
                      >
                        <span>↑</span>
                      </button>
                    }
                    {index !== allProjects.length - 1 &&
                      <button onClick={() => moveItem(index, 1)} title="Move to Down">
                          <span>↓</span>                       
                      </button>
                       }
                    </span>
                  </h1>
                  <div>
                    <Link
                    prefetch={false}
                      href={`/company-profile/our-works/update-project/${item.id}`}
                      className="link_color text-sm"
                    >
                      <svg
                        className="w-[20px] h-[20px] me-1"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="m14.3 4.8 2.9 2.9M7 7H4a1 1 0 0 0-1 1v10c0 .6.4 1 1 1h11c.6 0 1-.4 1-1v-4.5m2.4-10a2 2 0 0 1 0 3l-6.8 6.8L8 14l.7-3.6 6.9-6.8a2 2 0 0 1 2.8 0Z"
                        />
                      </svg>
                      Edit
                    </Link>
                    <button
                      className="link_color text-sm ms-4"
                      onClick={() => {
                        setDeleteModal(true);
                        setProjectId(item.id);
                        setProjectName(item.name);
                      }}
                    >
                      <svg
                        className="w-[14px] h-[14px] me-1"
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
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
                
                <p className="text-sm font-medium">
                  {formatDate(item.projectCDate)}
                </p>
                <p className="text-sm font-medium">
                  Platforms:{" "}
                  {item.platforms.map((pItem, pIndex) =>
                    pIndex < item.platforms.length - 1
                      ? pItem.name + ","
                      : pItem.name + "",
                  )}
                </p>
                <p className="py-6 text-sm font-normal whitespace-break-spaces">{(isValidJSON(item.description)) ? JSON.parse(item.description) : item.description}</p>
              <div>
                <div className="grid grid-cols-5 gap-4">
                  {item.files.slice(0, visibleCounts[item.id]).map((fItem, fIndex) => (
                    <div
                      className="relative portfolio_images_portfolio_view"
                      key={fIndex}
                    > 
                      {
                        <div className="absolute inset-0 flex justify-center items-center">
                          {
                            fItem.isLoaded === false &&
                            <Spinner/>
                          }
                        </div>
                      }
                      <LazyLoadImage
                        effect="blur"
                        width={210}
                        // height={210}
                        className="h-auto max-w-full"
                        src={
                            fItem.thumbnail || "/video-thumb.jpg"
                        }
                        alt="image description"
                        beforeLoad={() => {
                          fItem.isLoaded = false;
                          setAllProjects([...allProjects]);
                        }}
                        onLoad={() => {
                          fItem.isLoaded = true;
                          setAllProjects([...allProjects]);
                        }}
                      />
                      {item.files[fIndex].type == "video" &&
                      <div className="absolute inset-0 flex justify-center items-center">
                        <Image
                          src="/play-icon.png"
                          alt="Play icon"
                          width={35}
                          height={35}
                        />
                      </div>
                      }
                    </div>
                  ))}
                </div>
                {item.files.length > 5 && (
                  <div className="mt-4 text-right">
                    {visibleCounts[item.id] < item.files.length ? (
                      <button onClick={() => handleViewMore(item.id)} className="text-sm inline-flex items-center justify-center gap-1.5 rounded-sm border-0 border-gray-200 px-3 text-blue-300 transition hover:bg-gray-0 hover:text-blue-400 focus:outline-none"
                      type="button">
                      {/* <Image
                        width={500}
                        height={300}
                        src="/expand.svg"
                        className="w-2.5 h-2.5 text-blue-300"
                        alt=""
                      /> */}
                       <span>See More</span>
                      </button>
                    ) : (
                      <button onClick={() => handleViewLess(item.id)} className="text-sm inline-flex items-center justify-center gap-1.5 rounded-sm border-0 border-gray-200 px-3 text-blue-300 transition hover:bg-gray-0 hover:text-blue-400 focus:outline-none"
                      type="button">
                        {/* <Image
                          width={500}
                          height={300}
                          src="/expand.svg"
                          className="w-2.5 h-2.5 text-blue-300"
                          alt=""
                        /> */}
                        <span>See Less</span>
                      </button>
                    )}
                  </div>
                  )}
              </div>
                {item.testimonial_feedback && item.testimonial_feedback.length > 0 &&
                <div className="testimonials pt-6">
                  {/* <h3 className="font-bold text-base pb-6">Client Testimonial</h3> */}
                  <figure className="border-s-4 border-gray-300 dashed_bg_color p-4">
                    <blockquote>
                      <p className="text-sm italic font-medium ">"{item.testimonial_feedback}"</p>
                    </blockquote>
                    <figcaption className="flex items-center justify-start mt-3 space-x-3 pb-1 rtl:space-x-reverse">
                      <div className="flex items-center divide-gray-500">
                        <cite className="pe-3 text-sm font-medium ">{item.testimonial_name}, {item.testimonial_title}, {item.testimonial_company}</cite>
                      </div>
                    </figcaption>
                  </figure>
                </div>
              } 
                <div className="py-8">
                  <hr />
                </div>
              </div>
            </div>
          ))}
          <Modal
            size="sm"
            show={deleteModal}
            onClose={() => setDeleteModal(false)}
          >
            <Modal.Header className="modal_header font-bold">
              <b>Are you sure?</b>
            </Modal.Header>
            <Modal.Body>
              <div className="space-y-6 text-sm font-normal">
                You are about to delete {projectName}
              </div>
            </Modal.Body>
            <Modal.Footer className="modal_footer">
              <Button
                color="gray"
                type="submit"
                className="button_cancel h-[40px] px-4 border-gray-50-100"
                onClick={() => setDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  deleteOurProject(+projectId);
                }}
                className="px-4 h-[40px] button_blue"
              >
                Delete
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
        :
        <div className="flex justify-center items-center pt-60">
          <Spinner />
        </div>
      }
    </>
  );
};

export default AllProjectsComponent;
