import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { getEndpointUrl, ENDPOINTS } from "@/constants/endpoints";
import { authFetcher, authPutWithData, deleteItem } from "@/hooks/fetcher";
import { useUserContext } from "@/context/store";
import { redirect } from "next/navigation";
import { PATH } from "@/constants/path";
import { Modal, Button } from "flowbite-react";
import { toast } from "react-toastify";
import { useProfileStatusContext } from "@/context/profilePercentage";
import Spinner from "./spinner";
import { LazyLoadImage } from "react-lazy-load-image-component";
import 'react-lazy-load-image-component/src/effects/blur.css';

type albumTypes = {
  albumName: string;
  companyId: number;
  id: number;
  reOrderingId: number;
  portfolioAlbumFiles: {
    fileName: string;
    fileUrl: string;
    thumbnail: string;
    type: string;
    isLoaded?: boolean;
  }[];
}

const AllAlbumsComponent = () => {
  const [allAlbumFiles, setAllAlbumsFiles] = useState<albumTypes[]>([]);
  const [updatingOrder, setUpdatingOrder] = useState<{id: number, reOrderingId: number}[]>([]);
  const { user } = useUserContext();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [deleteAlbumId, setDeleteAlbumId] = useState<number>(0);
  const [projectName, setProjectName] = useState<string>("");
  const [isProjectUpdated, setIsProjectUpdated] = useState<boolean>(true);
  const [visibleCounts, setVisibleCounts] = useState<{[key: number]: number;}>({});

  if (!user) {
    redirect(PATH.HOME.path);
  }

  useEffect(() => {
    if (isProjectUpdated) {
      fetchInformations();
      setIsProjectUpdated(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [isProjectUpdated]);

  const initializeVisibleCounts = (albums: albumTypes[]): {[key: number]: number;} => {
    const initialCounts: {[key: number]: number;} = {};
    albums.forEach(album => {
      initialCounts[album.id] = 5;
    });
    return initialCounts;
  };

  async function fetchInformations() {
    if (user) {
      setIsLoading(true);
      await authFetcher(
        `${getEndpointUrl(ENDPOINTS.getPortfolioAlbums(user.companyId))}`,
      )
        .then((result) => {
          if (result.success && result.data.data.length > 0) {
            const formattedAlbums = result.data.data.map((item: any) => {
              const newFiles = item.portfolioAlbumFiles.map((file: any) => {
                return {
                  ...file,
                  isLoaded: false
                }
              });
              return {
                ...item,
                portfolioAlbumFiles: newFiles,
              }
            });
            setAllAlbumsFiles(formattedAlbums);
            if(formattedAlbums.length > 0) {
              const testData = initializeVisibleCounts(formattedAlbums);
              setVisibleCounts(testData);
            }
          } else {
              if (profilepercentage) {
                setProfilepercentage({
                  generalInfoProfilePerc: profilepercentage ? profilepercentage.generalInfoProfilePerc : 0,
                  aboutProfilePerc: profilepercentage ? profilepercentage.aboutProfilePerc : 0,
                  ourWorkAlbumsProfilePerc: result.data.responseLength > 0 ?  profilepercentage.ourWorkProjectProfilePerc : 0,
                  ourWorkProjectProfilePerc: result.data.responseLength > 0 ?  profilepercentage.ourWorkProjectProfilePerc : 0,
                  servicesProfilePerc: profilepercentage ?  profilepercentage.servicesProfilePerc : 0,
                  certificationsProfilePerc: profilepercentage ?  profilepercentage.certificationsProfilePerc : 0,
                  contactsProfilePerc: profilepercentage ?  profilepercentage.contactsProfilePerc : 0,
                  profileCompleted: result.data.responseLength > 0 ? true : false,
                  bannerAssetId: profilepercentage.bannerAssetId,
                });
              }
            setAllAlbumsFiles([]);
          }
          setIsLoading(false);
        })
        .catch((err) => {
          setIsLoading(false);
          console.log(err);
        });
    }
  }
  
  const { setProfilepercentage } = useProfileStatusContext();
  const { profilepercentage } = useProfileStatusContext();
  const handleAlbumDelete = (albumId: number) => {
    deleteItem(
      `${getEndpointUrl(ENDPOINTS.deleteportfolioalbum(albumId))}`,
    ).then((response) => {
      if (response.success) {
        toast.success("Successfully Deleted  👍");
      } else {
        toast.error('An Error occurred, Try Again Later');
      }
      setTimeout(() => {
        setIsProjectUpdated(true);
      }, 100);

    }).catch(() => {
      toast.error('An Error occurred, Try Again Later');
    });
    setDeleteAlbumId(0);
    setDeleteModal(false);
  };

  const handlePosChange = (currentPos: any, newPos: any) => {
    const updatedIndexValues: albumTypes[] = [...allAlbumFiles];
        const movedIndexValue = updatedIndexValues.splice(currentPos, 1)[0];
        updatedIndexValues.splice(newPos, 0, movedIndexValue);
        updatedIndexValues.forEach((faq, index) => {
            faq.reOrderingId = index + 1;
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
    const newItems = [...allAlbumFiles];
    const [movedItem] = newItems.splice(index, 1);
    const newIndex = index + direction;
    newItems.splice(newIndex, 0, movedItem);
    newItems.forEach((faq, index) => {
      faq.reOrderingId = index + 1;
    });
    setAllAlbumsFiles(newItems);
    if(newItems.length > 0) {
      const testData = initializeVisibleCounts(newItems);
      setVisibleCounts(testData);
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
      await authPutWithData(`${getEndpointUrl(ENDPOINTS.updatePortfolioAbums(user.companyId))}`, postData)
      .then((result) => {
      }).catch((err) => {
        console.log(err);
      });
    }
    addFaqContent();

  },[updatingOrder]);
  
  // useEffect(() => {
  //   if (allAlbumFiles && allAlbumFiles.length > 0) {
  //     setVisibleCounts(initializeVisibleCounts(allAlbumFiles));
  //   }
  // }, [allAlbumFiles]);

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
          {allAlbumFiles && allAlbumFiles.length > 0 &&
            allAlbumFiles.map((album: albumTypes, index) => (

              <div
                //  key={`albumlist_${index}`}
                key={album.reOrderingId}
                >
                <div className="project-highlights relative" style={{ flexGrow: 1 }} >
                  <div className="sm:text-left pb-6 flex justify-between" 
                    ref={(el) => {itemRefs.current[index] = el}}
                    tabIndex={-1}
                  >
                    <h1 className="font-bold default_text_color heading-sub-font">
                      {album.albumName}  <span className="drag_album">
                      {index !== 0 &&
                          <button onClick={() => moveItem(index, -1)} title="Move to Top">                        
                            <span>↑</span>
                          </button>
                          }
                            {index !== allAlbumFiles.length - 1 &&
                          <button onClick={() => moveItem(index, 1)} title="Move to Down">
                              <span>↓</span>                       
                          </button>
                          }
                      </span>
                    </h1>
                    <div>
                  
                      <Link
                        prefetch={false}
                        href={`/company-profile/our-works/update-album/${album.id}`}
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
                          setDeleteAlbumId(album.id);
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
                  <div>
                    <div className="grid lg:grid-cols-5 lg:gap-4 grid-cols-3 gap-1">
                      {album.portfolioAlbumFiles && album.portfolioAlbumFiles.length > 0 &&
                        album.portfolioAlbumFiles.slice(0, visibleCounts[album.id]).map((albumFiles, index) => (
                          <div className="relative portfolio_images_portfolio_view" key={`albumview_${index}`}>
                            {
                              <div className="absolute inset-0 flex justify-center items-center">
                                {
                                  albumFiles.isLoaded === false &&
                                  <Spinner/>
                                }
                              </div>
                            }
                            <LazyLoadImage
                              effect="blur"
                              width={210}
                              // height={210}
                              className="h-auto max-w-full"
                              src={albumFiles.type === 'image' ? albumFiles.thumbnail : (albumFiles.thumbnail || "/video-thumb.jpg")}
                              alt="image description"
                              beforeLoad={() => {
                                albumFiles.isLoaded = false;
                                setAllAlbumsFiles([...allAlbumFiles]);
                              }}
                              onLoad={() => {
                                albumFiles.isLoaded = true;
                                setAllAlbumsFiles([...allAlbumFiles]);
                              }}
                            />
                            {album.portfolioAlbumFiles[index].type == "video" &&
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
                        ))
                      }
                    </div>
                    {album.portfolioAlbumFiles.length > 5 && (
                      <div className="mt-4 text-right">
                        {visibleCounts[album.id] < album.portfolioAlbumFiles.length ? (
                          <button onClick={() => handleViewMore(album.id)} className="text-sm inline-flex items-center justify-center gap-1.5 rounded-sm border-0 border-gray-200 px-3 text-blue-300 transition hover:bg-gray-0 hover:text-blue-400 focus:outline-none"
                          type="button">
                          <span>See More</span>
                          </button>
                        ) : (
                          <button onClick={() => handleViewLess(album.id)} className="text-sm inline-flex items-center justify-center gap-1.5 rounded-sm border-0 border-gray-200 px-3 text-blue-300 transition hover:bg-gray-0 hover:text-blue-400 focus:outline-none"
                          type="button">
                            <span>See Less</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="py-8">
                    <hr />
                  </div>
                </div>
              </div>
            ))
          }
          { !isLoading && allAlbumFiles && allAlbumFiles.length <= 0 && <div className="pt-6 text-center">
            <p className="text-sm font-normal italic">
              It looks like you don't have any Albums in your Portfolio yet. <br />
              You can add Albums to showcase your company’s best work!
            </p>
            <p className="pt-6 text-sm font-normal">
              <Link href="/company-profile/our-works/create-album" className="link_color underline">
                Click here to create an Album
              </Link>
            </p>
          </div>
          }
          <Modal
            size="sm"
            show={deleteModal}
            onClose={() => { setDeleteModal(false); setDeleteAlbumId(0); }}
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
                onClick={() => { setDeleteModal(false); setDeleteAlbumId(0); }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleAlbumDelete(deleteAlbumId)
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

export default AllAlbumsComponent;