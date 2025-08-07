'use client';
import { Modal, Spinner } from 'flowbite-react';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from 'react-responsive-carousel';
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import { companyPortfolioTypes, portfolioAlbumFilesTypes } from '@/types/serviceProviderDetails.type';
import { useEffect, useState } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

const CustomLightBox = ({
    setIsOpenSilder,
    currentItems,
    openSlider,
    activeSlider,
    setCurrentLightBoxItems
}: {
    setIsOpenSilder: (value: boolean) => void,
    currentItems: portfolioAlbumFilesTypes[] | companyPortfolioTypes["FileUploads"],
    openSlider: boolean,
    activeSlider: number | undefined,
    setCurrentLightBoxItems: (value: companyPortfolioTypes["FileUploads"] | portfolioAlbumFilesTypes[]) => void,
}) => {
    const handle = useFullScreenHandle();
    const [selectedSlide, setSelectedSlide] = useState<number>(activeSlider || 0);
    const [isImageLoading, setIsImageLoading] = useState(false);

    useEffect(() => {
        setSelectedSlide(activeSlider || 0);
    }, [currentItems, activeSlider]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (openSlider) {
                if (event.key === 'ArrowRight') {
                    nextSlide();
                } else if (event.key === 'ArrowLeft') {
                    prevSlide();
                } else if (event.key === ' ') {
                    toggleVideo();
                    event.preventDefault();
                }
                if (event.key === "Escape") {
                    if (!document.fullscreenElement) {
                        setIsOpenSilder(false);
                    } else {
                        handleExit();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [selectedSlide, openSlider]);

    const handleExit = () => {
        handle.exit();
    };

    const handleFullScreen = () => {
        handle.enter();
    };

    const handleOnChange = (index: number) => {
        setSelectedSlide(index);
        stopVideo();
    };


    const stopVideo = () => {
        const command = {
            event: "command",
            func: "stopVideo"
        };
        const videos = document.getElementsByClassName('video');
        if (videos && videos.length > 0) {
            Array.from(videos).forEach((video) => {
                const iframe = video as HTMLIFrameElement;
                if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.postMessage(JSON.stringify(command), "*");
                    iframe.contentWindow.postMessage('{"method":"pause"}', '*');
                }
            });
        }
    };

    const toggleVideo = () => {
        const videos = document.getElementsByClassName('video');
        if (videos && videos[selectedSlide]) {
            const iframe = videos[selectedSlide] as HTMLIFrameElement;
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage('{"method":"play"}', '*');
                iframe.contentWindow.postMessage('{"method":"pause"}', '*');
            }
        }
    };

    const nextSlide = () => {
        if (selectedSlide < currentItems.length - 1) {
            setSelectedSlide(selectedSlide + 1);
        }
    };

    const prevSlide = () => {
        if (selectedSlide > 0) {
            setSelectedSlide(selectedSlide - 1);
        }
    };

    return (
        <Modal className='flowbite_rect_transparent_popup' show={openSlider} onClose={() => setIsOpenSilder(false)} popup size="6xl">
            <FullScreen handle={handle}>
                <Modal.Header className='p-0' />
                <Modal.Body className='p-0'>
                    <div className="">
                        {!document.fullscreenElement && (
                            <button onClick={handleFullScreen} className='expand_icon'>
                                <svg fill="#fff" width="20px" height="20px" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M4.5 11H3v4h4v-1.5H4.5V11zM3 7h1.5V4.5H7V3H3v4zm10.5 6.5H11V15h4v-4h-1.5v2.5zM11 3v1.5h2.5V7H15V3h-4z"></path>
                                </svg>
                            </button>
                        )}

                        {document.fullscreenElement && (
                            <button onClick={handleExit} className='expand_icon unexpand'>
                                <svg fill="#fff" width="24px" height="24px" viewBox="0 0 950 1024" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M682 342h128v84h-212v-212h84v128zM598 810v-212h212v84h-128v128h-84zM342 342v-128h84v212h-212v-84h128zM214 682v-84h212v212h-84v-128h-128z"></path>
                                </svg>
                            </button>
                        )}

                        <Carousel selectedItem={selectedSlide} showThumbs={false} showIndicators={false} onChange={handleOnChange}>
                            {currentItems && currentItems.map((source, index) => (
                              <>
                                
                                <div key={`Carousel_${index}`}>
                                    <span className="absolute z-[10]  flex">
                                      {
                                        isImageLoading &&
                                        <Spinner color="warning" size="xl" />
                                      }
                                    </span>
                                    {source.type === 'image' ? (
                                        <LazyLoadImage
                                          src={source.fileUrl}
                                          effect='blur'
                                          beforeLoad={() => { setIsImageLoading(true); }}
                                          onLoad={() => { setIsImageLoading(false); }}
                                        />
                                    ) : (
                                        <iframe
                                            className="video"
                                            src={
                                                source.fileUrl.includes('youtube.com') || source.fileUrl.includes('youtu.be')
                                                    ? `${source.fileUrl}${source.fileUrl.includes('?') ? '&' : '?'}enablejsapi=1`
                                                    : source.fileUrl
                                            }
                                        />
                                    )}
                                </div>
                              </>
                            ))}
                        </Carousel>
                    </div>
                </Modal.Body>
            </FullScreen>
        </Modal>
    );
};

export default CustomLightBox;
