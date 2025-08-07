"use client";
//import "../public/css/style.css";
//import "../public/css/staticpage.css";
import "../public/css/home.css";
import React, { useEffect } from 'react';
import Image from "next/image";
import Link from "next/link";
import { Carousel, Tooltip } from 'flowbite-react';
import { useState, useRef } from 'react';
import { authFetcher, authPut } from "@/hooks/fetcher";
import { getEndpointUrl, ENDPOINTS } from "@/constants/endpoints";
import { AdminGroupsType } from "@/types/companies.type";
import { decodedString, encryptString, setCrousalAgain } from "@/services/common-methods";
import ReactSimplyCarousel from 'react-simply-carousel';
import Spinner from "./spinner";
import MarketPageFadeSlider from "./ui/marketpage-ad-slider";
import HeaderStatic from "./header-static";
import TestimonialWidget from "./testimonial-widget";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { sanitizeData } from "@/services/sanitizedata";
import useCommonPostData from "@/hooks/commonPostData";
import { toast } from "react-toastify";

type ContactFormDto = {
    firstName: string;
    lastName: string;
    company: string;
    email: string;
    nature?: string;
    message: string;
    userId: number;
}
const XdsMainHome = () => {
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [bannerAdImages, setBannerAdImages] = useState<{ id: number, adImagePath: string, mobileAdImagePath: string, adURL: string, adPage: string }[]>([]);

    const [isMobile, setIsMobile] = useState(false);
    const [thnksPopup, setThanksPopup] = useState(false);
    const [loader, setLoader] = useState<boolean>(false);
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        handleResize();

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    const [compnayGroupsList, setCompnayGroupsList] = useState<{ bannerAdImage: { id: number, adImagePath: string, mobileAdImagePath: string, adURL: string, adPage: string }[], justJoined: any[], freshAndUpdated: any[], platinumPartners: { companyWebsiteUrl: string, fileUrl: string }[] }>();
    // const handleAudioControl = () => {
    //     if (videoRef.current) {
    //         videoRef.current.muted = !isMuted;
    //         setIsMuted(!isMuted);
    //     }
    // }
    //const [isPlaying, setIsPlaying] = useState(true);
    //const videoRef = useRef<HTMLVideoElement>(null);

    // const handlePlayPause = () => {
    //     if (videoRef.current) {
    //         if (isPlaying) {
    //             videoRef.current.pause();
    //         } else {
    //             videoRef.current.play();
    //         }
    //         setIsPlaying((prev) => !prev);
    //     }
    // };

    useEffect(() => {
        async function getMarkePagetDetails() {

            const currentDate = encryptString(new Date().toLocaleDateString('en-US'), process.env.NEXT_PUBLIC_XDS_EMAIL_SECRET_KEY);
            await authFetcher(`${getEndpointUrl(ENDPOINTS.getMarkePagetDetails(currentDate))}`)
                .then((res) => {
                    const Data = JSON.parse(decodedString(res, process.env.NEXT_PUBLIC_XDS_EMAIL_SECRET_KEY));
                    if (Data.bannerAdImage && Data.bannerAdImage.length > 0) {
                        Data.bannerAdImage.forEach((item: any) => {
                            if (item.adURLStaticPage != "" && item.adURLStaticPage != null) {
                                item.adURL = item.adURLStaticPage;
                            }
                        });
                        const bannerAds = setCrousalAgain(Data.bannerAdImage, "marketpageCrousal");
                        setBannerAdImages(bannerAds);
                    }
                    setCompnayGroupsList(Data);
                    setIsLoading(false);
                });
        }
        getMarkePagetDetails();
    }, []);

    const externalClicksUpdate = async (bannerId: number) => {
        await authPut(`${getEndpointUrl(ENDPOINTS.externalClicks(+bannerId))}`).catch((err) => {
            console.log(err);
        });
    }

    const [count1, setCount1] = useState(500);
    const [count2, setCount2] = useState(500);
    const [done1, setDone1] = useState(false);
    const [done2, setDone2] = useState(false);
    const speed = 0;
    // Timer for first count (200 → 620 with 1 reset at 600)
    useEffect(() => {
        let hasReset1 = false;
        const timer1 = setInterval(() => {
            setCount1((prev) => {
                if (prev >= 600 && !hasReset1) {
                    hasReset1 = true;
                    return 500;
                }
                if (prev >= 620) {
                    clearInterval(timer1);
                    setDone1(true);
                    return prev;
                }
                return prev + 1;
            });
        }, speed);
        return () => clearInterval(timer1);
    }, []);

    // Timer for second count (500 → 550 only)
    useEffect(() => {
        const timer2 = setInterval(() => {
            setCount2((prev) => {
                if (prev >= 600) {
                    clearInterval(timer2);
                    setDone2(true);
                    return prev;
                }
                return prev + 1;
            });
        }, speed);
        return () => clearInterval(timer2);
    }, []);
    // Function to handle smooth scroll to Carla's section
    const scrollToCarla = (e: React.MouseEvent) => {
        e.preventDefault();
        const carlaSection = document.getElementById('iamabuyer');
        if (carlaSection) {
            const yOffset = -120; // negative offset to prevent header overlap
            const y = carlaSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };
    const scrollToiamasp = (e: React.MouseEvent) => {
        e.preventDefault();
        const carlaSection = document.getElementById('iamasp');
        if (carlaSection) {
            const yOffset = -120; // negative offset to prevent header overlap
            const y = carlaSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    const {
        register: registerPrimary,
        reset: resetPrimary,
        handleSubmit: handleSubmitPrimary,
        formState: { errors: errorsPrimary },
    } = useForm<ContactFormDto>({
        defaultValues: {
            firstName: '',
            lastName: '',
            company: '',
            email: '',
            nature: '',
            message: '',
            userId: 0,
        },
    });

    const { submitForm } = useCommonPostData<ContactFormDto>({
        url: getEndpointUrl(ENDPOINTS.consultationMail),
    });

    const onSubmit = (async (data: ContactFormDto) => {
        setLoader(true);
        data.userId = 1;
        const sanitizedData: ContactFormDto = sanitizeData(data) as ContactFormDto;

        submitForm(sanitizedData).then((response) => {
            setLoader(false);
            if (response.data && response.data.success !== true) {
                toast.error('An Error occurred, Try Again Later');
            } else {
                setThanksPopup(true);
                resetPrimary();
                // toast.success('Message Successfully sent 👍');
            }
        }).catch((err) => {
            setLoader(false);
            console.log(err);
            toast.error('An Error occurred, Try Again Later');
        });
    }) as SubmitHandler<FieldValues>;

    return (
        <>
            <HeaderStatic />
            {/* <div className="relative">
                <video ref={videoRef} id="myVideo" playsInline autoPlay muted loop style={{ width: '100%', height: '100vh', zIndex: 1 }} className="myxdspark_video">
                    <source src="/XDS-SPARK-VIDEO-2024.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
                <div className="absolute bottom-10 right-20 z-10 sm_play_button_placement">
                    <button
                        id="play-pause-button"
                        onClick={handlePlayPause}
                        className={isPlaying ? 'playing' : ''}
                    >
                        {!isPlaying ? <svg className="w-6 h-6 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                            <path fill-rule="evenodd" d="M8.6 5.2A1 1 0 0 0 7 6v12a1 1 0 0 0 1.6.8l8-6a1 1 0 0 0 0-1.6l-8-6Z" clip-rule="evenodd" />
                        </svg>
                            :
                            <svg className="w-6 h-6 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                <path fill-rule="evenodd" d="M8 5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H8Zm7 0a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1Z" clip-rule="evenodd" />
                            </svg>
                        }
                    </button>
                    <button id="audio-control" onClick={handleAudioControl}>
                        {isMuted ? <svg className="w-6 h-6 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M5.707 4.293a1 1 0 0 0-1.414 1.414l14 14a1 1 0 0 0 1.414-1.414l-.004-.005C21.57 16.498 22 13.938 22 12a9.972 9.972 0 0 0-2.929-7.071 1 1 0 1 0-1.414 1.414A7.972 7.972 0 0 1 20 12c0 1.752-.403 3.636-1.712 4.873l-1.433-1.433C17.616 14.37 18 13.107 18 12c0-1.678-.69-3.197-1.8-4.285a1 1 0 1 0-1.4 1.428A3.985 3.985 0 0 1 16 12c0 .606-.195 1.335-.59 1.996L13 11.586V6.135c0-1.696-1.978-2.622-3.28-1.536L7.698 6.284l-1.99-1.991ZM4 8h.586L13 16.414v1.451c0 1.696-1.978 2.622-3.28 1.536L5.638 16H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2Z" />
                        </svg> : <svg className="w-6 h-6 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M13 6.037c0-1.724-1.978-2.665-3.28-1.562L5.638 7.933H4c-1.105 0-2 .91-2 2.034v4.066c0 1.123.895 2.034 2 2.034h1.638l4.082 3.458c1.302 1.104 3.28.162 3.28-1.562V6.037Z" />
                            <path fill-rule="evenodd" d="M14.786 7.658a.988.988 0 0 1 1.414-.014A6.135 6.135 0 0 1 18 12c0 1.662-.655 3.17-1.715 4.27a.989.989 0 0 1-1.414.014 1.029 1.029 0 0 1-.014-1.437A4.085 4.085 0 0 0 16 12a4.085 4.085 0 0 0-1.2-2.904 1.029 1.029 0 0 1-.014-1.438Z" clip-rule="evenodd" />
                            <path fill-rule="evenodd" d="M17.657 4.811a.988.988 0 0 1 1.414 0A10.224 10.224 0 0 1 22 12c0 2.807-1.12 5.35-2.929 7.189a.988.988 0 0 1-1.414 0 1.029 1.029 0 0 1 0-1.438A8.173 8.173 0 0 0 20 12a8.173 8.173 0 0 0-2.343-5.751 1.029 1.029 0 0 1 0-1.438Z" clip-rule="evenodd" />
                        </svg>}
                    </button>
                </div>
            </div> */}
            <div id="firstsection"
                className="min-h-screen overflow-hidden pad_top_64p"
                style={{
                    background: 'linear-gradient(70deg, #391281  -9.79%, #4E249D 15.31%, #4F22A6 27.43%, #571BD4 48.41%, #8720AF 68.49%, #BF2584 85.97%)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            >
                <div className="external_partners container mx-auto">
                    <div className="lg:min-h-screen  grid lg:gap-xl  items-center">
                        <div className="col-12 col-6@md">
                            <div className=" order-1 lg:order-1">
                                {/* Main Headline */}
                                <div className="space-y-10 lg:space-y-6 lg:mt-0 mt-10">
                                    <div className="text-[#deb4ff] text-sm font-bold tracking-[0.56px] leading-6 uppercase">
                                        DISCOVER. CONNECT. CREATE.
                                    </div>
                                    <h1 className="text-white font-bold leading-tight tracking-[0.48px] text_48">
                                        The smartest way to find trusted external partners
                                    </h1>

                                    <p className="text-white text_16 font-normal leading-relaxed tracking-[0.18px] max-w-2xl">
                                        Whether you’re scaling your team or showcasing your services, Spark connects you with the people who move projects forward.
                                    </p>
                                </div>

                                {/* Call to Action Section */}
                                <div className="space-y-10 mt_64">
                                    <div className="space-y-2">
                                        <h2 className="text-white font-bold text_22 leading-7">
                                            How will you use Spark?
                                        </h2>
                                        <p className="text-white text-sm font-normal leading-6">
                                            Get started at no cost today.
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-4 action_section">
                                        {/* First Row Buttons */}
                                        <div className="flex flex-col sm:flex-row gap-4 space-x-4 lg:space-y-0 space-y-10">
                                            <a href="#iamabuyer"

                                                className="bg-white text-[#2b1a84] px-6 lg:px-8 py-3 rounded-full text-[15px] font-bold tracking-[0.14px] w-full sm:w-auto sm:min-w-[232px] lg:h-[64px] h-[64px] hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all duration-200 flex items-center justify-center transition-all duration-200 hover:shadow-[0_4px_20px_rgba(28,17,83,0.67)] hover:-translate-y-1"
                                            >
                                                I am a Buyer of Services
                                            </a>
                                            <a href="#iamasp"

                                                className="border-[1.5px] border-white text-white px-6 lg:px-8 py-3 rounded-full text-[15px] font-bold tracking-[0.14px] w-full sm:w-auto sm:min-w-[232px] lg:h-[64px] h-[64px] hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all duration-200 flex items-center justify-center transition-all duration-200 hover:shadow-[0_4px_20px_rgba(28,17,83,0.67)] hover:-translate-y-1" style={{ border: '1px solid' }}
                                            >
                                                I am a Service Provider
                                            </a>
                                        </div>

                                        {/* Second Row Buttons with reduced opacity */}
                                        {/* <div className="flex flex-col sm:flex-row gap-4 space-x-4">
                                            <button
                                                type="button"
                                                className="bg-white/75 text-[#2b1a84] px-6 lg:px-8 py-3 rounded-full text-sm font-bold tracking-[0.14px] w-full sm:w-auto sm:min-w-[232px] h-[50px] hover:bg-white/60 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all duration-200"
                                            >
                                                I am a Buyer of Services
                                            </button>
                                            <button
                                                type="button"
                                                className="bg-[rgba(195,164,250,0.22)] border-[1.5px] border-white text-white px-6 lg:px-8 py-3 rounded-full text-sm font-bold tracking-[0.14px] w-full sm:w-auto sm:min-w-[232px] h-[50px] hover:bg-[rgba(195,164,250,0.35)] focus:outline-none focus:ring-4 focus:ring-white/30 transition-all duration-200"
                                            >
                                                I am a Service Provider
                                            </button>
                                        </div> */}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-12 col-6@md ">
                            <div className="flex flex-col justify-center items-start lg:items-end space-y-8 lg:space-y-12 xl:space-y-20 order-2 lg:order-2 py-12 lg:py-0 lg:ps-[160px]">
                                {/* First Statistic */}
                                <div className="text-start border_left_2">
                                    <div className="text-white font-extrabold text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-tight tracking-[-1.46px] mb-3 lg:mb-4">
                                        {count1}
                                        {done1 && <span className="position-relative top-[-4px]">+</span>}
                                    </div>
                                    <div className="text-white space-y-1">
                                        <div className="font-bold text-[20px] leading-6">Service Providers</div>
                                        <div className="text-sm font-normal leading-6">Verified by Spark</div>
                                    </div>
                                </div>


                                {/* Second Statistic */}
                                <div className="text-start border_left_2 border_mlbottom_last">
                                    <div className="text-white font-extrabold text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-tight tracking-[-1.46px] mb-3 lg:mb-4">
                                        {count2}
                                        {done2 && <span className="position-relative top-[-4px]">+</span>}
                                    </div>
                                    <div className="text-white space-y-1">
                                        <div className="font-bold text-[20px] leading-6">Game Developers</div>
                                        <div className="text-sm font-normal leading-6">Trusted by Studios Worldwide</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* <div className="introNav position-absolute z-index-1 pt-0">
                <div className="padding-x-sm@md mobile_pad">
                    <div className="innerContainer padding-bottom-sm@md padding-bottom-xs">
                        <svg id="xdsLogo" className="xdsLogo" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 270.6 38">
                            <defs>
                                <style>
                                    {`.cls-1 {
                        fill: #f9ea6f;
                    }
                    .cls-2 {
                        fill: #fff;
                    }`}
                                </style>
                            </defs>
                            <path className="cls-1" d="m226.6,20.7c-1-.2-2.4.2-2.4.2l9.9,16.9h2.7l-10.2-17.1Z" />
                            <path className="cls-1"
                                d="m140.4,11.6c-.2-6.1-4.7-9.1-11-9.1-3.9,0-9.4,1.7-9.4,7.6,0,5.7,5.9,6.7,11.7,7.9,5.9,1.2,11.7,2.8,11.7,9.9,0,7.4-6.8,10-12.1,10-8,0-14.6-3.4-14.5-12.6h2.1c-.4,7.8,5.6,10.7,12.4,10.7,4.1,0,10-1.9,10-8.1,0-6-5.9-7.1-11.7-8.3s-11.7-2.7-11.7-9.5,6.1-9.5,11.5-9.5c7.2,0,12.8,3.2,13.1,11,0,0-2.1,0-2.1,0Z" />
                            <path className="cls-1"
                                d="m151.1,1.9h14.6c3.9,0,10,1.4,10,10,0,6.2-3.9,9.8-10.8,9.8h-11.7v15.9h-2.1V1.9Zm2.1,17.9h12.1c6.2,0,8.3-4.2,8.3-7.9,0-2.6-1.2-8-8-8h-12.4v15.9h0Z" />
                            <path className="cls-1"
                                d="m191.2,1.9l13.6,35.7h-2.3l-4.3-11.4h-16.4l-4.4,11.4h-2.3L188.9,1.9s2.3,0,2.3,0Zm6.3,22.4l-7.4-20.2h-.1l-7.6,20.2h15.1Z" />
                            <path className="cls-1"
                                d="m226.2,21.4c.9,0-1.7.6,2.6-.4s6.5-5,6.5-9.8c0-6.9-4.9-9.2-10.9-9.2h-14.3v35.7h2.1v-16.2h12.2c.3-.1,1-.1,1.8-.1Zm-14-17.6h12.2c4.6,0,8.8,2,8.8,7.4,0,5.7-3.8,8.2-8.8,8.2h-12.2V3.8Z" />
                            <path className="cls-1"
                                d="m243.3,1.9h2.1v20.5l21.6-20.5h2.7l-15.7,14.8,16.6,20.8h-2.6l-15.5-19.2-7.1,6.7v12.6h-2.1V1.9h0Z" />
                            <path className="cls-2"
                                d="m41.5.6h18.7c12.3,0,16.7,9.1,16.7,18.4,0,11.3-6,18.5-18.9,18.5h-16.5V.6Zm11.4,27.5h4.5c7.1,0,8.1-5.8,8.1-9.2,0-2.3-.7-8.8-9-8.8h-3.6v18Z" />
                            <path className="cls-2"
                                d="m89.4,25c0,.9.2,1.7.4,2.4.8,2.2,3.3,2.6,5.4,2.6,1.9,0,4.7-.6,4.7-3.3,0-1.9-1.6-2.4-7.9-4.2-5.8-1.6-12.5-3.2-12.5-10.5,0-8.4,7.3-12,14.8-12,8,0,15,3,15.4,11.8h-10.7c.2-1.4-.4-2.3-1.3-2.9-.9-.7-2.2-.9-3.3-.9-1.5,0-4.1.4-4.1,2.4.2,2.6,5.5,3.2,10.7,4.6s10.4,3.8,10.4,10.5c0,9.5-8.8,12.5-17,12.5-4.2,0-16.1-1.5-16.2-13.1l11.2.1h0Z" />
                            <polygon className="cls-2"
                                points="26.4 .6 0 37.6 13 37.6 19.6 26.8 25.8 37.6 39.5 37.6 26.3 18 38.2 .6 26.4 .6" />
                            <polygon className="cls-1" points="13.2 .6 18.8 8.5 12.6 17 1.4 .6 13.2 .6" />
                        </svg>
                        <div className="flex lg:space-x-16 space-x-2 items-center">
                            
                            
                            <a href="/about" className="introText">Consulting</a>
                            <a href="mailto:info@xds-spark.com?subject=XDS Spark - General Enquiry"
                                className="introText">Contact</a>
                                <a href="https://xds-spark.us10.list-manage.com/subscribe?u=0827e18cb56fdfc5f6e1347af&id=eec362cf4a"
                                className="introText" target="_blank">Newsletter</a>
                                <a href="javascript:void(0)" className="introText">|</a>
                            <a href="/register" className="introText">SIGN UP</a>

                            <a href="/login" className="introText login_btn_w">Login</a>
                        </div>
                    </div>
                </div>
            </div> */}

            <section className="padding-y-md platinum_logos">
                <div className="container max-width-sm pad_0 pt-2">
                    <p className="text-center color-quinary">Proudly supported by our Platinum Partners</p>
                </div>
                <div className=" scale_zoom lg:space-x-0 space-x-4">
                    <div className="lg:block hidden"></div>
                    {!isLoading ?
                        <div className="top_slider mt-4">
                            <div className="h-18">
                                <ReactSimplyCarousel
                                    activeSlideIndex={activeSlideIndex}
                                    onRequestChange={setActiveSlideIndex}
                                    responsiveProps={[
                                        {
                                            itemsToShow: 6,
                                            itemsToScroll: 1,
                                        },
                                    ]}
                                    autoplay={isMobile || (!isMobile && compnayGroupsList?.platinumPartners && (compnayGroupsList?.platinumPartners.length > 6))}
                                    autoplayDirection='forward'
                                    autoplayDelay={1250}
                                    swipeRatio={1}
                                    speed={1000}
                                >
                                    {compnayGroupsList?.platinumPartners && compnayGroupsList?.platinumPartners.map((partners) => {
                                        return (
                                            // <div className={`carousel-item w-[100px]`}>
                                            //     <img
                                            //         src={partners.fileUrl}
                                            //         alt=""
                                            //         width={180}
                                            //         height={320}
                                            //         className="inline-block m-auto"
                                            //         touch-action="none"
                                            //     />
                                            // </div>
                                            <a href={partners.companyWebsiteUrl} target="_blank">
                                                <div className={`carousel-item lg:w-[250px] w-[150px] lg:mx-2 mx-0 py-8`}>

                                                    <img src={partners.fileUrl} className="inline-block m-auto rounded" touch-action="none" />

                                                </div>
                                            </a>
                                        )
                                    })}
                                </ReactSimplyCarousel>
                            </div>
                        </div>
                        :
                        <div className="flex justify-center"><Spinner /></div>
                    }
                    <div className="lg:block hidden"></div>
                </div>
            </section>
            <section className="padding-x-lg@md padding-y-lg@md lg:mt-20 lg:mb-16 my-8 mar_top_plus_64" style={{
                background: 'radial-gradient(136.3% 233.3% at 7.34% 149.25%, #391281 0%, #4E249D 5.98%, #4F22A6 11.95%, #541EC2 18.27%, #571BD4 24.07%, #BF2584 92.79%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}>
                {/* Hero Video Section */}
                <div className="flex justify-center mb-12">
                    <div className="w-full max-w-4xl mar_top_minus_64 lg:px-0 px-4">
                        <div className="relative w-full pt-[56.25%]"> {/* 16:9 ratio */}
                            <iframe
                                className="absolute top-0 left-0 w-full h-full"
                                src="https://www.youtube-nocookie.com/embed/jvwI0NyQD_Y?si=dGjNMyW0mlU-x6K8&rel=0"
                                title="YouTube video player"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                referrerPolicy="strict-origin-when-cross-origin"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                </div>
                {/* Features Section */}
                <div className="container gap_each_element">
                    <div className="lg:text-center">
                        <h2 className="text-white font-bold text-3xl lg:text-4xl leading-7">
                            Why Spark works
                        </h2>
                    </div>
                    <div className="grid gap-xl  justify-center mobile_pad gap_each_element ">
                        {/* Global Reach */}
                        <div className="md:text-left col-12 col-3@md">
                            <div className="border_left_2 border_mlbottom">
                                <h3 className="text-white font-bold text-2xl leading-7 mb-4">
                                    Global Reach
                                </h3>
                                <p className="text-white text-base leading-6">
                                    Over 60 countries represented — work with partners across every major region
                                </p>
                            </div>
                        </div>

                        {/* Built on Trust */}
                        <div className="md:text-left col-12 col-3@md">
                            <div className="border_left_2 border_mlbottom">
                                <h3 className="text-white font-bold text-2xl leading-7 mb-4">
                                    Built on Trust
                                </h3>
                                <p className="text-white text-base leading-6">
                                    Created by the team behind <a href="https://xdsummit.com/" target="_blank "><span className="font-bold text-[#53b6d2]">XDS Conference</span></a> and trusted by the world's top studios.
                                </p>
                            </div>
                        </div>

                        {/* Purpose-Built for Growth */}
                        <div className="md:text-left col-12 col-3@md">
                            <div className="border_left_2 border_mlbottom border_mlbottom_last">
                                <h3 className="text-white font-bold text-2xl leading-7 mb-4">
                                    Purpose-Built<br />for Growth
                                </h3>
                                <p className="text-white text-base leading-6">
                                    From first connection to long-term collaboration — Spark helps drive results.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="!container">
                    <TestimonialWidget page={'static-page'}/>
                    </div>


                <div className="text-center gap_each_element pb-20">
                    <a href="/signup-options"
                        className="inline-flex items-center justify-center border border-white text-white px-12 py-4 rounded-full font-bold text-[15px] tracking-[0.28px] min-w-[273px] lg:h-[64px] hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all duration-200"
                    >Join 1500+ Members
                    </a>
                    {/* <-- go to sign up options--> */}
                </div>
            </section>
            {/* <div className="relative  bg-quaternary lg:py-20 py-10">
                <div className="lg:container padding-x-lg@md padding-x-sm z-index-0 left-0 right-0">                  
                    <div className="mt-0 drop-in-2 be_visible_title">
                        <p className="be_visible">Be visible on Spark today! </p>
                    </div>
                    <div className="drop-in">                      
                        <h2 className="lg:text-[32px] text-[22px] text-white font-extrabold lg:leading-[60px] tracking-[0.64px] text-center lg:mb-0 mb-5">Join the Creative Industries' Global Marketplace</h2>
                    </div>
                    <div className="grid  lg:mt-16 justify-center mobile_pad lg:space-x-14 lg:space-y-0 space-y-6">
                        <div className="col-12 col-4@md">
                            <div className="block button_bg -mr-1">
                                <div className="text-center drop-in-2">
                                    <a href="#iamabuyer"
                                        className="sign_up_spark regiration_top_1"> I'M A BUYER OF SERVICES</a>
                                </div>
                                <p className="font_size_20 mt-4  mb-1">I want to discover diverse <br /> and reliable new partners.</p>
                            </div>
                        </div>
                        <div className="col-12 col-4@md">
                            <div className="block button_bg -ml-1">
                                <div className="text-center drop-in-2">
                                    <a href="#iamasp"
                                        className="sign_up_spark" style={{ color: '#9B53D2' }}> I'M A SERVICE PROVIDER </a>
                                </div>
                                <p className="font_size_20 mt-4 mb-1">I want to promote my services <br /> and attract new clients.</p>
                            </div>
                        </div>
                    </div>
                    <p className="get_membership lg:mt-16 mt-5">Get started with a <b>complimentary</b> Foundational membership! </p>
                </div>
            </div> */}
            <section id="firstBlock" className="padding-x-lg@md   lg:mt-20 lg:mb-16  my-8">
                <div className="grid  mobile_pad">
                    <div className="col-12@md col-12@sm flex flex-column gap-lg@md gap-sm text-center infoPanel">
                        <div >
                            <h3 className="mb-3 ttext_48"><span>It is all in the details  </span></h3>
                            <p className="subText">Profiles designed to give you the full picture—fast.</p>
                        </div>

                        {/* <p className="lg:w-[950px] m-auto"><b>XDS Spark</b> is a premium solution for the game development and creative adjacent industries, providing a one-stop-shop to meet production goals, and grow your business. </p>
                        <p className="lg:w-[950px] m-auto">
                            With an always-on, global database of over <b> 500 Service Providers,</b> and <b>400+ Buyers,</b> you will be able to meet business and production goals in between XDS events! Not familiar with the <b>External Development Summit (XDS)?</b>  <a href="https://xdsummit.com" target="_blank">Learn more</a>
                        </p> */}
                    </div>
                    <div className="col-10@md col-10@sm m-auto lg:mt-24">
                        <div className="lg:container">
                            <div className="grid gap-xl@md gap-lg">
                                <div className="col-6@sm text-center spark_slider relative">
                                    <div className="slider_height_fix">
                                        <Carousel>
                                            {/* <img src="/profile_company-1.png" className="w-full" /> 
                                             <img src="/profile_company-2.png" className="w-full" /> */}
                                            <img src="/profile_company-3.png?1" className="w-full" />
                                             {/* <img src="/profile_company-4.png" className="w-full" />  */}
                                            <img src="/profile_company-5.png?1" className="w-full" />
                                            <img src="/profile_company-6.png" className="w-full" />
                                            <img src="/profile_company-7.png" className="w-full" />
                                            <img src="/profile_company-8.png" className="w-full" />
                                            <img src="/profile_company-9.png" className="w-full" />
                                        </Carousel>
                                    </div>
                                </div>
                                <div className="col-6@sm">
                                    <h2 className="text-[19px] voilet_color">Detailed Company Information</h2>
                                    <p className="text-[19px]">Quickly evaluate potential partners with rich, reliable company profiles</p>
                                    <h2 className="text-[19px] mt-10 voilet_color">Robust Portfolios</h2>
                                    <p className="text-[19px]">Explore Service Provider portfolios representing their best work</p>
                                    <h2 className="text-[19px] mt-10 voilet_color">Project Highlights</h2>
                                    <p className="text-[19px]">Discover a showcase of recent project engagements and testimonials</p>

                                    <h2 className="text-[19px] mt-10 voilet_color">Announcements & Client Testimonials </h2>
                                    <p className="text-[19px]">Showcase of client feedback, key milestones, events, and company updates</p>

                                    <h2 className="text-[19px] mt-10 voilet_color">Due Diligence </h2>
                                    <p className="text-[19px]">Easily review company history, locations, platform and game engine experience, tools & tech, and more</p>
                                    {compnayGroupsList && (!compnayGroupsList.justJoined || !compnayGroupsList.justJoined[0]) && compnayGroupsList.freshAndUpdated && compnayGroupsList.freshAndUpdated.length > 0 && compnayGroupsList.freshAndUpdated.map((fresh: any) => (
                                        <div className="mt-14">
                                            <h2 className="text-[19px] mb-5 voilet_color">RECENT ACTIVITY IN SPARK</h2>
                                            <div className="flex space-x-4">
                                                <div>
                                                    <img src={`${fresh.userCategory}`} width={100} />
                                                </div>
                                                <div>
                                                    <p className="text-[14px] font-bold">{fresh.name}  updated their {(fresh.categories.length > 1 ? <>Profile</> : (fresh.categories[0] == 2 ? 'Portfolio' : (fresh.categories[0] == 3 ? 'Projects' : (fresh.categories[0] == 4 ? 'Due Diligence' : ''))))}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                    }

                                    {compnayGroupsList && compnayGroupsList.justJoined && compnayGroupsList.justJoined.length > 0 && compnayGroupsList.justJoined.map((joined: any) => (
                                        <>

                                            <div className="mt-14">
                                                <h2 className="text-[19px] mb-5 voilet_color">RECENT ACTIVITY IN SPARK</h2>
                                                <div className="flex space-x-4">
                                                    <div>
                                                        <img src={`${joined.userCategory}`} width={100} />
                                                    </div>
                                                    <div>

                                                        <p className="text-[14px] font-bold">
                                                            {joined.Companies?.name + ' joined Spark'}
                                                        </p>

                                                    </div>
                                                </div>
                                            </div>

                                        </>
                                    ))
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section className="text-center">
                {/* {compnayGroupsList && compnayGroupsList?.bannerAdImage[0] &&
                    <div className="ad_banner_home">
                        <Link target="_blank" href={compnayGroupsList?.bannerAdImage[0].adURL ? (compnayGroupsList?.bannerAdImage[0].adURL.startsWith('http://') || compnayGroupsList?.bannerAdImage[0].adURL.startsWith('https://') ? compnayGroupsList?.bannerAdImage[0].adURL : `https://${compnayGroupsList?.bannerAdImage[0].adURL}`) : '#'} onClick={() => externalClicksUpdate(compnayGroupsList?.bannerAdImage[0].id)}>
                            {compnayGroupsList?.bannerAdImage[0].adImagePath &&
                                <img src={compnayGroupsList?.bannerAdImage[0].adImagePath} className="inline-block m-auto" />
                            }
                        </Link>
                    </div>
                }
                {compnayGroupsList && compnayGroupsList?.bannerAdImage[0] &&
                    <div className="ad_banner_home_mobile">
                        <Link target="_blank" href={compnayGroupsList?.bannerAdImage[0].adURL ? (compnayGroupsList?.bannerAdImage[0].adURL.startsWith('http://') || compnayGroupsList?.bannerAdImage[0].adURL.startsWith('https://') ? compnayGroupsList?.bannerAdImage[0].adURL : `https://${compnayGroupsList?.bannerAdImage[0].adURL}`) : '#'} onClick={() => externalClicksUpdate(compnayGroupsList?.bannerAdImage[0].id)}>
                            {compnayGroupsList?.bannerAdImage[0].mobileAdImagePath &&
                                <img src={compnayGroupsList?.bannerAdImage[0].mobileAdImagePath} className="inline-block m-auto" />
                            }
                        </Link>
                    </div>
                } */}
                {
                    bannerAdImages && bannerAdImages.length > 0 && !isLoading &&
                    <div className="bg-[#f1f1f1;]">
                        <MarketPageFadeSlider images={bannerAdImages} webUrl={"12345"} onClickBannerAdClicks={(val: number) => externalClicksUpdate(val)} />
                    </div>
                }
            </section>
            <section className="bg-quaternary lg:py-20 pt-8" id="iamabuyer">
                {/* <div className="padding-x-lg@md container text-center  max-width-md advisoryPanel">
                    <h4 className="buyer_title">I AM A <abbr className="color_yellow_p font-bold">BUYER</abbr> OF SERVICES </h4>
                    <p className="padding-top-md lg:w-[800px] m-auto"><span className="font-bold">Finding diverse, reliable Service Providers can be challenging.</span> That's why we offer a credible and trustworthy source to discover great new partners.</p>
                </div> */}
                <div className="grid gap-xl lg:mt-[50px]  lg:mb-[150px] justify-center mobile_pad mb-8">
                    <div className="col-12 col-5@md">
                        {/* <p className="benifites_text mb-5">PREMIUM BENEFITS FOR</p> */}
                        <div className="">
                            <h3 className="font_size_43">Buyers of <br />creative services</h3>
                            <p className="text-[22px] text_growth mt-14">Get your business ready for growth! </p>
                            <p className="text-white mt-6 font-normal text_font">Finding diverse, reliable partners can be challenging. That's why we offer a <strong>credible</strong> and <strong>trustworthy</strong> source to discover great new partners</p>
                        </div>
                    </div>
                    <div className="col-12 col-5@md">
                        <div className="block space-y-6">
                            <p className="text_font_19 text-white"><b className="text-[#DAB7F4]">Collaborate Better:</b> More seats means team members can engage with the platform and collaborate on partner discovery.</p>
                            <hr className="border_bottom_line" />
                            <p className="text_font_19 text-white"><b className="text-[#DAB7F4]">Partner Management:</b> Team members can contribute in <span className="italic">My Spark</span> by adding rates, performance reviews and partner notes.</p>
                            <hr className="border_bottom_line" />
                            <p className="text_font_19 text-white"><b className="text-[#DAB7F4]">Scale Your Growth:</b> As your business grows, so should your access. Ensure teams can stay connected and aligned on Spark.</p>
                        </div>
                    </div>
                </div>
                <div className="lg:container container  lg:px-0 px-0">
                    <div className="grid items-start gap-0 lg:pb-28 pb-8 items-stretch !h-full">
                        <div className="col-12 col-4@md">
                            <div className=" fondation_shadow fondation_shadow_2  text-center !containerh-full">
                                <div className="w-full p-4 sm:p-8">
                                    <div className="height_fix">
                                        <h5 className="mb-4 price_list_title">Premium</h5>
                                        <div className="">
                                            <span className="font_22px mt-3">$88 for 5 users/month, <br />billed annually</span>
                                            {/* <span className="text-5xl font-extrabold tracking-tight">0</span> */}
                                            {/* <span className="ms-1 text-xl font-normal text-gray-500 dark:text-gray-400">/month</span> */}
                                        </div>
                                        <p className=" font-semibold opacity-70 my-5 italic">$99 for 5 users/billed monthly</p>
                                        <p className="font_19px text-base text-start italic text-center">
                                            Full and unfettered access that <br /><b>includes five (5) user accounts!</b>
                                        </p>
                                    </div>
                                    <div className="my-5"><Link href="/registration" target="_blank"><button className="sign_up_button">Sign up</button></Link></div>
                                    <div className="lg:pt-5"></div>
                                    <p className="text-left foundation_plus ">Everything in FOUNDATIONAL, plus...</p>
                                    <ul role="list" className="space-y-5 mt-5">
                                        <li className="text-start">
                                            <h2 className="block text-base font-bold color_pink_light mb-4 font_17px">ACCOUNT MANAGEMENT</h2>
                                            <div className="flex items-strat">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                    <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                </svg>
                                                <span className="text-base font-normal  ms-3 text_dark">Five (5) user accounts available for team collaboration</span>
                                            </div>
                                            <div className="flex items-strat mt-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                    <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                </svg>
                                                <span className="text-base font-normal  ms-3 text_dark">Share or restrict <span className="italic">My Spark </span> data by user</span>
                                            </div>
                                        </li>
                                        <li className="text-start">
                                            <h2 className="block text-base font-bold color_pink_light mb-4">CONSULTATION</h2>
                                            <div className="flex items-strat">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                    <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                </svg>
                                                <span className="text-base font-normal  ms-3 text_dark">Receive a complimentary consultation session to learn about how to get the most value from Spark for your team or studio</span>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="col-12 col-4@md transform_scale6">
                            <div className="fondation_shadow fondation_shadow_2 shadow_center !h-full" style={{ background: '#F8F0FF' }}>
                                <div className="w-full p-4 sm:p-8">
                                    {/* <h5 className="mb-4 price_list_title">Premium</h5>
                                    <div className="flex items-baseline color_pink">
                                        <span className="text-3xl ">$88 </span>
                                        <span className="text-sm ms-1 font-medium">per user/month, billed annually</span>
                                    </div>
                                    <span className="text-sm font-bold color_pink_light mt-3 block">BEST VALUE</span>
                                    <p className="color_pink text-base text-start mb-7 mt-5 italic ">
                                        $99 per user/billed monthly
                                    </p>
                                    <div className="mb-7"><Link href="/registration" target="_blank"><button className="sign_up_button">Sign up</button></Link></div> */}
                                    <div className="height_fix_center">
                                        <h5 className="mb-4 price_list_title">Foundational</h5>
                                        <div className="text-center">
                                            <span className="font_22px mt-3">Complimentary ($0)</span>
                                        </div>
                                        <p className=" font-bold text-center my-5 text-[22px] text-[#9B53D2]">Full access to all features and functionality</p>
                                        <p className="font_19px text-base text-start italic text-center">
                                            Start your search for Service Providers with one (1) user account
                                        </p>
                                    </div>
                                    <div className="my-5 text-center"><Link href="/registration?userType=foundational" target="_blank"><button className="sign_up_button m-[-1px]">Sign up</button></Link></div>
                                    <div className="lg:pt-5"></div>
                                    <ul role="list" className="space-y-5">
                                        <li className="text-start">
                                            <h2 className="block text-base font-bold color_pink_light mb-4">DISCOVER SERVICE PROVIDERS</h2>
                                            <div className="flex items-strat">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                    <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                </svg>
                                                <span className="text-base font-normal  ms-3 text_dark">View over 500 rich Service Provider profiles including portfolios, project highlights, platforms, engines, certifications, security, company history & more</span>
                                            </div>
                                            {/* <div className="flex items-strat mt-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                    <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                </svg>
                                                <span className="text-base font-normal  ms-3 text_dark">Post Opportunities autonomously that Service Providers can respond to</span>
                                            </div> */}
                                            <div className="flex items-strat mt-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                    <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                </svg>
                                                <span className="text-base font-normal  ms-3 text_dark">Access Service Provider contact information</span>
                                            </div>
                                            <div className="flex items-strat mt-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                    <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                </svg>
                                                <span className="text-base font-normal  ms-3 text_dark">Perform side-by-side comparisons of Service Providers</span>
                                            </div>
                                            <div className="flex items-strat mt-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                    <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                </svg>
                                                <span className="text-base font-normal  ms-3 text_dark">View events Service Providers are attending</span>
                                            </div>
                                        </li>
                                        <li className="text-start">
                                            <h2 className="block text-base font-bold color_pink_light mb-4">MANAGE OPPORTUNITIES</h2>
                                            <div className="flex items-strat">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                    <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                </svg>
                                                <span className="text-base font-normal  ms-3 text_dark">Anonymously post project opportunities that Service Providers can respond to</span>
                                            </div>
                                        </li>
                                        <li className="text-start">
                                            <h2 className="block text-base font-bold color_pink_light mb-4">PARTNER MANAGEMENT</h2>
                                            <div className="flex items-strat">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                    <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                </svg>
                                                <span className="text-base font-normal  ms-3 text_dark">In <span className="italic"> My Spark,</span> manage partner relationship data including legal, security, rates, performance, capacity & notes</span>
                                            </div>
                                            <div className="flex items-strat mt-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                    <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                </svg>
                                                <span className="text-base font-normal  ms-3 text_dark ">Create and share projects, and short-list Service Providers to present partner options to stakeholders</span>
                                            </div>
                                        </li>
                                        <li className="text-start">
                                            <h2 className="block text-base font-bold color_pink_light mb-4">ACCOUNT MANAGEMENT</h2>
                                            <div className="flex items-strat">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                    <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                </svg>
                                                <span className="text-base font-normal  ms-3 text_dark">Receive one (1) user account to manage your profile</span>
                                            </div>
                                        </li>
                                        <li className="text-start">
                                            <h2 className="block text-base font-bold color_pink_light mb-4">SECURITY</h2>
                                            <div className="flex items-strat">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                    <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                </svg>
                                                <span className="text-base font-normal  ms-3 text_dark">Secure server hosting</span>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="col-12 col-4@md">
                            <div className="fondation_shadow fondation_shadow_2 !h-full">
                                <div className="w-full p-4 sm:p-8 sm:ms-3">
                                    {/* <h5 className="mb-4 price_list_title">Enterprise</h5>
                                    <div className="flex items-baseline color_pink">
                                        <span className="text-3xl ">Let's Talk </span>
                                    </div>
                                    <p className="color_pink text-base text-start my-7 italic">
                                        Let Spark become a bespoke solution for your internal teams!
                                    </p>
                                    <div className="mb-7"><Link prefetch={false} href={`mailto:info@xds-spark.com?subject=XDS Spark - Enterprise Enquiry`}><button className="sign_up_button" style={{ padding: "12px 22px" }}>Contact Us</button></Link></div> */}
                                    <div className="height_fix">
                                        <h5 className="mb-4 price_list_title">Enterprise</h5>
                                        <div className="text-center">
                                            <span className="font_22px mt-3">Let's Talk</span>
                                        </div>
                                        <p className=" font-normal text-center lg:my-12 my-6 text-[19px] w-[250px] m-auto">Let Spark become a <b>bespoke solution</b> for your internal teams! </p>
                                    </div>
                                    <div className="my-5 text-center"><Link prefetch={false} href={`mailto:info@xds-spark.com?subject=XDS Spark - Enterprise Enquiry`}><button className="sign_up_button" style={{ padding: "12px 22px" }}>Contact Us</button></Link></div>
                                    <div className="lg:pt-5"></div>
                                    <p className="voilet_color foundation_plus">Everything in FOUNDATIONAL, plus...</p>
                                    <ul role="list" className="space-y-5 mt-5">
                                        <li className="text-start">
                                            <h2 className="block text-base font-bold color_pink_light mb-4">ACCOUNT MANAGEMENT</h2>
                                            <div className="flex items-strat">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                    <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                </svg>
                                                <span className="text-base font-normal  ms-3 text_dark">Unlimited user accounts to provide to team members</span>
                                            </div>
                                            <div className="flex items-strat mt-4">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                    <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                </svg>
                                                <span className="text-base font-normal  ms-3 text_dark">Add Service Providers that are private to your company</span>
                                            </div>
                                        </li>
                                        <li className="text-start">
                                            <h2 className="block text-base font-bold color_pink_light mb-4">CUSTOMIZATION</h2>
                                            <div className="flex items-strat">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                    <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                </svg>
                                                <span className="text-base font-normal  ms-3 text_dark">White-labeled database ready for your branding, with support to integrate your existing database</span>
                                            </div>
                                            <div className="flex items-strat mt-4">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                    <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                </svg>
                                                <span className="text-base font-normal  ms-3 text_dark">Bespoke feature development including API integration into your procurement systems</span>
                                            </div>
                                            <div className="flex items-strat mt-4 ">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                    <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                </svg>
                                                <span className="text-base font-normal  ms-3 text_dark">Build an internal external dev Hub with community features</span>
                                            </div>
                                        </li>
                                        <li className="text-start">
                                            <h2 className="block text-base font-bold color_pink_light mb-4">ROADMAP INPUT</h2>
                                            <div className="flex items-strat">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                    <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                </svg>
                                                <span className="text-base font-normal  ms-3 text_dark">Tailored development of features to support your unique processes & systems</span>
                                            </div>

                                        </li>
                                        <li className="text-start">
                                            <h2 className="block text-base font-bold color_pink_light mb-4">SECURITY</h2>
                                            <div className="flex items-strat">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                    <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                </svg>
                                                <span className="text-base font-normal  ms-3 text_dark">Choose your preferred, secured platform hosting provide</span>
                                            </div>

                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* <div className="grid items-center gap-0 justify-center lg:pb-0 pb-10">
                        <div className="col-12 col-3@md">
                            <img src="/ProfileHugo.png" className="m-auto" />
                        </div>
                        <div className="col-12 col-5@md">
                            <p className="font_size_24">“Spark delivers value in finding new partners  to cover concrete needs, and the platform  has been improving at a fast pace.”</p>
                            <p className="font_size_17px lg:mt-9 mt-4 text-center">Mika Schulman, Director, Art Production and Outsourcing, Scopely</p>
                        </div>
                        <div className="col-12 col-3@md text-center"><img src="/PprofileHugo.png" className="m-auto" />
                        </div>
                    </div> */}
                    {/* <div className="testimonials_xds h-56 sm:h-64 xl:h-80 2xl:h-86 md:-mt-10 ">
                        <Carousel pauseOnHover>
                            <div className="flex h-full items-center justify-center">
                                <div className="grid items-center gap-0 justify-center lg:pb-0 pb-10">
                                    <div className="col-12 col-3@md">
                                        <img src="/ProfileHugo.png" className="m-auto" />
                                    </div>
                                    <div className="col-12 col-5@md">
                                        <p className="font_size_24">“Spark delivers value in finding new partners  to cover concrete needs, and the platform  has been improving at a fast pace.”</p>
                                        <p className="font_size_17px lg:mt-9 mt-4 text-center">Mika Schulman, Director, Art Production and Outsourcing, Scopely</p>
                                    </div>
                                    <div className="col-12 col-3@md text-center"><img src="/PprofileHugo.png" className="m-auto" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex h-full items-center justify-center">
                                <div className="grid items-center gap-0 justify-center lg:pb-0 pb-10">
                                    <div className="col-12 col-3@md">
                                        <img src="/ProfileHugo22.png" className="m-auto" />
                                    </div>
                                    <div className="col-12 col-5@md">
                                        <p className="font_size_24">“Spark has optimized how I identify and engage with partners, making the process fast, reliable, and comprehensive. It's been a <b>game-changer</b> for my development pipeline.”</p>
                                        <p className="font_size_17px lg:mt-9 mt-4 text-center">Paul Goad, Head of Art, Offworld Industries</p>
                                    </div>
                                    <div className="col-12 col-3@md text-center"><img src="/company2.png" className="m-auto" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex h-full items-center justify-center">
                                <div className="grid items-center gap-0 justify-center lg:pb-0 pb-10">
                                    <div className="col-12 col-3@md">
                                        <img src="/ProfileHugo4.png" className="m-auto" />
                                    </div>
                                    <div className="col-12 col-5@md">
                                        <p className="font_size_24">“XDS Spark <b>saves us time</b> and resources by providing access to a wide pool of potential partners. We <b>highly recommend</b> this to anyone looking for professional outsourcing providers.”</p>
                                        <p className="font_size_17px lg:mt-9 mt-4 text-center">Karolina Kopek, Procurement Director, CD PROJEKT RED</p>
                                    </div>
                                    <div className="col-12 col-3@md text-center"><img src="/company3.png" className="m-auto" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex h-full items-center justify-center">
                                <div className="grid items-center gap-0 justify-center lg:pb-0 pb-10">
                                    <div className="col-12 col-3@md">
                                        <img src="/ProfileHugo3.png" className="m-auto" />
                                    </div>
                                    <div className="col-12 col-5@md">
                                        <p className="font_size_24">“XDS Spark is a valuable tool that is <b>integral</b> to our External Development group. It helps us to <b>discover</b> new partners for our internal teams.”</p>
                                        <p className="font_size_17px lg:mt-9 mt-4 text-center">Senior Outsourcing Producer, 2K Games</p>
                                    </div>
                                    <div className="col-12 col-3@md text-center"><img src="/company4.png" className="m-auto" />
                                    </div>
                                </div>
                            </div>
                        </Carousel>
                    </div> */}
                </div>
            </section>
            {/* <div className="padding-x-lg@md container text-center max-width-md advisoryPanel  lg:mt-36 relative mt-8" id="iamasp">
                <h4 className="service_provider_color buyer_title">I AM A <abbr className="font-extrabold">SERVICE PROVIDER </abbr></h4>
                <p className="padding-top-md lg:w-[800px] m-auto dark_text">XDS Spark will serve as a hub for promoting services and attracting new clients, providing a professional platform for you to be visible to creative industries!</p>
                <div className="srviceprovider_logo">
                    <Image src="/XDS_Spark_character_02Happy_shadow testpsd 2.png" width={266} height={337} alt="" />
                </div>
            </div> */}
            <div className="bg-[#F5F5F4] lg:pt-20 lg:pb-5" id="iamasp" >
                <div className="grid gap-xl justify-center mobile_pad my-8">
                    <div className="col-12 col-5@md mb-16">
                        {/* <p className="benifites_text mb-4"><span className="text-[#9B53D2]">PREMIUM BENEFITS FOR</span></p> */}
                        <h3 className="font_size_41"><span className="text-[#462C87]">Service Providers in <br />creative industries</span></h3>
                        <p className="text-[22px] mt-7 font-bold text-[#462C87] leading-8">Show your work. Get discovered by top partners.</p>
                        <p className="text-[19px]  mt-7 leading-7"><span className="font-semibold">Buyers across the global games industry use Spark</span> to find trusted external partners. As the industry shifts, more Buyers are turning to service providers for support and collaboration. Spark helps you stand out with a <span className="font-semibold">credible</span> platform built to <span className="font-semibold">strengthen discovery and connection.</span></p>
                        {/* <p className="text-[19px]  mt-3">We understand what instills confidence in buyers when selecting a partner. With <b>XDS SPARK,</b> your profile will capture the attention of <b>over 400 buyers</b> by showcasing your offerings in the best possible light.</p> */}
                    </div>
                    <div className="col-12 col-5@md">
                        <div className="block">
                            <h2 className="text-[19px] voilet_color">Stay visible to active Buyers</h2>
                            <p className="text-[19px]">Expand your reach and grow your client base.</p>
                            <hr className="border_bottom_line_2" />
                        </div>
                        <div className="block">
                            <h2 className="text-[19px] voilet_color">Fully completed profiles get noticed – we are here to support you.  </h2>
                            <p className="text-[19px]"> Need help optimizing yours?<a href={`mailto:info@xds-spark.com`} target="_blank" className="text-[#9B53D2] no-underline"> We’re here to support you.</a></p>
                            <hr className="border_bottom_line_2" />
                        </div>
                        <div className="block">
                            <h2 className="text-[19px] voilet_color">Discover features and updates built for growth.</h2>
                            <p className="text-[19px]"> Stay ahead with continuous platform enhancements designed to elevate your Premium experience. </p>
                        </div>
                    </div>
                </div>
                <section className="pt-8">
                    {/* service_provider_bg lg:py-20 */}
                    {/* <h6 className=" lg:pb-2.5 pb-1 text-center color_pink_light_2 text-base font-bold mobile_font_size"><span className="text-[#FFF3A0]">GET YOUR BUSINESS READY TO STANDOUT!</span> </h6>
                <h5 className="lg:pb-24 pb-5 text-center text-[28px] font-extrabold"><span className="text-[#ffffff]">SERVICE PROVIDER MEMBERSHIP BENEFITS</span></h5> */}
                    <div className="lg:container container  lg:px-0 px-0">
                        <div className="grid gap-0 lg:pb-28 pb-8  items-stretch h-full">
                            <div className="col-12 col-4@md">
                                <div className=" fondation_shadow text-center h-full">
                                    <div className="w-full p-4 sm:p-8">
                                        <div className="height_fix">
                                            <h5 className="mb-4 price_list_title">Foundational</h5>
                                            <div className="color_pink">
                                                <span className="font_22px mt-3">Complimentary ($0)</span>
                                                {/* <span className="text-5xl font-extrabold tracking-tight">0</span> */}
                                                {/* <span className="ms-1 text-xl font-normal text-gray-500 dark:text-gray-400">/month</span> */}
                                            </div>
                                            {/* <p className=" font-semibold opacity-70 my-5 italic">$99 for 5 users/billed monthly</p> */}
                                            <p className="font_19px text-base italic text-center lg:my-14 my-4 ">
                                                Maintain a basic account allowing <br className="lg:block hidden" />Buyers to <b>discover you! </b>
                                            </p>
                                        </div>
                                        <div className="my-5"><Link href="/registration?userType=foundational" target="_blank"><button className="sign_up_button">Sign up</button></Link></div>

                                        {/* <p className="text-left foundation_plus">Everything in FOUNDATIONAL, plus...</p> */}
                                        <div className="lg:pt-5"></div>
                                        <ul role="list" className="space-y-5">
                                            <li className="text-start">
                                                <h2 className="block text-base font-bold color_pink_light mb-4 font_17px">COMPANY PROFILE</h2>
                                                <div className="flex items-strat">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                    </svg>
                                                    <span className="text-base font-normal  ms-3 text_dark">Maintain a foundational company profile for visibility to Buyers in Spark:</span>
                                                </div>
                                                <div className="flex items-strat mt-3">

                                                    <span className="text-base font-normal  ms-5 text_dark">• Company logo <br />• Banner image<br />• Company description <br /> • Website <br />• Company size<br />• Key services</span>
                                                </div>
                                            </li>
                                            <li className="text-start">
                                                <h2 className="block text-base font-bold color_pink_light mb-4">SEARCH & FILTER</h2>
                                                <div className="flex items-strat">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                    </svg>
                                                    <span className="text-base font-normal  ms-3 text_dark">View other Service Provider profiles</span>
                                                </div>
                                            </li>
                                            <li className="text-start">
                                                <h2 className="block text-base font-bold color_pink_light mb-4">ACCOUNT MANAGEMENT</h2>
                                                <div className="flex items-strat">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                    </svg>
                                                    <span className="text-base font-normal  ms-3 text_dark">Receive one (1) user account to manage your company profile</span>
                                                </div>
                                            </li>
                                            <li className="text-start">
                                                <h2 className="block text-base font-bold color_pink_light mb-4">SECURITY</h2>
                                                <div className="flex items-strat">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                    </svg>
                                                    <span className="text-base font-normal  ms-3 text_dark">Secure server hosting</span>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 col-4@md transform_scale6">
                                <div className="fondation_shadow shadow_center h-full" style={{ background: '#F8F0FF' }}>
                                    <div className="w-full p-4 sm:p-8">
                                        {/* <h5 className="mb-4 price_list_title">Premium</h5>
                                    <div className="flex items-baseline color_pink">
                                        <span className="text-3xl ">$88 </span>
                                        <span className="text-sm ms-1 font-medium">per user/month, billed annually</span>
                                    </div>
                                    <span className="text-sm font-bold color_pink_light mt-3 block">BEST VALUE</span>
                                    <p className="color_pink text-base text-start mb-7 mt-5 italic ">
                                        $99 per user/billed monthly
                                    </p>
                                    <div className="mb-7"><Link href="/registration" target="_blank"><button className="sign_up_button">Sign up</button></Link></div> */}
                                        <div className="height_fix_center">
                                            <h5 className="mb-4 price_list_title">Premium</h5>
                                            <div className="text-center">
                                                <span className="font_22px mt-3">$88 for 5 users/month,<br />billed annually</span>
                                            </div>
                                            <p className=" font-semibold opacity-70 my-4 italic text-center">$99 for 5 users/billed monthly</p>

                                            <p className="font_19px text-base italic text-center lg:py-0">
                                                <b>Full access</b> to maintain a rich company profile, and access other key features!
                                            </p>
                                        </div>
                                        <div className="my-5 text-center"><Link href="/registration" target="_blank"><button className="sign_up_button mt-[3px]">Sign up</button></Link></div>
                                        <div className="lg:pt-5"></div>
                                        <p className="text-left foundation_plus pb-5">Everything in FOUNDATIONAL, plus..</p>
                                        <ul role="list" className="space-y-5">
                                            <li className="text-start">
                                                <h2 className="block text-base font-bold color_pink_light mb-4">RICH COMPANY PROFILE</h2>
                                                <div className="flex items-strat">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                    </svg>
                                                    <span className="text-base font-normal  ms-3 text_dark">Maintain a rich company profile with:<br />
                                                        • Portfolio samples <br /> •  Project highlights <br /> •  Supported platforms & engines <br /> •  Certifications & security details <br />•  Company history & team contacts
                                                    </span>
                                                </div>
                                                <div className="flex items-strat mt-3">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                    </svg>
                                                    <span className="text-base font-normal  ms-3 text_dark">Share your latest:
                                                        <br />
                                                        • Company announcements <br /> • Client testimonials</span>
                                                </div>
                                                <div className="flex items-strat mt-3">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                    </svg>
                                                    <span className="text-base font-normal  ms-3 text_dark">Promote where you’ll be next:
                                                        <br />
                                                        • Highlight XDS-related event attendance <br />
                                                        • Show up in pre-event searches</span>
                                                </div>
                                            </li>

                                            <li className="text-start">
                                                <h2 className="block text-base font-bold color_pink_light mb-4">PARTNER MANAGEMENT</h2>
                                                <div className="flex items-strat">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                    </svg>
                                                    <span className="text-base font-normal  ms-3 text_dark">View rich company profiles of other Service Providers, and discover companies to increase your capacity and offerings</span>
                                                </div>
                                                <div className="flex items-strat mt-3">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                    </svg>
                                                    <span className="text-base font-normal  ms-3 text_dark ">In <span className="italic">My Spark,</span> manage partner relationship data including legal, security, rates, performance, capacity & notes</span>
                                                </div>
                                                <div className="flex items-strat mt-3">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                    </svg>
                                                    <span className="text-base font-normal  ms-3 text_dark ">Create and share projects and lists to cultivate Service Provider candidate partnerships</span>
                                                </div>
                                            </li>
                                            <li className="text-start">
                                                <h2 className="block text-base font-bold color_pink_light mb-4">RESPOND TO OPPORTUNITIES</h2>
                                                <div className="flex items-strat">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                    </svg>
                                                    <span className="text-base font-normal  ms-3 text_dark">Review and respond to project opportunities posted by Buyers</span>
                                                </div>
                                            </li>
                                            <li className="text-start">
                                                <h2 className="block text-base font-bold color_pink_light mb-4">ACCOUNT MANAGEMENT</h2>
                                                <div className="flex items-strat">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                    </svg>
                                                    <span className="text-base font-normal  ms-3 text_dark">Five (5) user accounts available for team collaboration</span>
                                                </div>
                                            </li>
                                            <li className="text-start">
                                                {/* <h2 className="block text-base font-bold color_pink_light mb-4">ACCOUNT MANAGEMENT</h2> */}
                                                <div className="flex items-strat">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                    </svg>
                                                    <span className="text-base font-normal  ms-3 text_dark">Share or restrict <span className="italic"> My Spark</span> data by user</span>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 col-4@md">
                                <div className="fondation_shadow h-full">
                                    <div className="w-full p-4 sm:p-8 sm:ms-3">
                                        {/* <h5 className="mb-4 price_list_title">Enterprise</h5>
                                    <div className="flex items-baseline color_pink">
                                        <span className="text-3xl ">Let's Talk </span>
                                    </div>
                                    <p className="color_pink text-base text-start my-7 italic">
                                        Let Spark become a bespoke solution for your internal teams!
                                    </p>
                                    <div className="mb-7"><Link prefetch={false} href={`mailto:info@xds-spark.com?subject=XDS Spark - Enterprise Enquiry`}><button className="sign_up_button" style={{ padding: "12px 22px" }}>Contact Us</button></Link></div> */}
                                        <div className="height_fix">
                                            <h5 className="mb-4 price_list_title">Enterprise</h5>
                                            <div className="color_pink text-center">
                                                <span className="font_22px mt-3">Let's Talk</span>
                                            </div>
                                            <p className=" font-normal text-center lg:my-14 my-6  text-[19px] lg:w-[300px] m-auto">Let Spark become a <b>bespoke solution</b> for your internal teams! </p>
                                        </div>
                                        <div className="my-5 text-center"><Link prefetch={false} href={`mailto:info@xds-spark.com?subject=XDS Spark - Enterprise Enquiry`}><button className="sign_up_button" style={{ padding: "12px 22px" }}>Contact Us</button></Link></div>
                                        <div className="lg:pt-5"></div>
                                        <p className="voilet_color foundation_plus">Everything in PREMIUM, plus...</p>
                                        <ul role="list" className="space-y-5 mt-5">
                                            <li className="text-start">
                                                <h2 className="block text-base font-bold color_pink_light mb-4">ACCOUNT MANAGEMENT</h2>
                                                <div className="flex items-strat">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                    </svg>
                                                    <span className="text-base font-normal  ms-3 text_dark">Unlimited user accounts to provide to team members</span>
                                                </div>
                                                <div className="flex items-strat mt-4">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                    </svg>
                                                    <span className="text-base font-normal  ms-3 text_dark">Add Service Providers that are private to your company</span>
                                                </div>
                                            </li>
                                            <li className="text-start">
                                                <h2 className="block text-base font-bold color_pink_light mb-4">CUSTOMIZATION</h2>
                                                <div className="flex items-strat">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                    </svg>
                                                    <span className="text-base font-normal  ms-3 text_dark">White-labeled database ready for your branding, with support to integrate your existing database</span>
                                                </div>
                                                <div className="flex items-strat mt-4">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                    </svg>
                                                    <span className="text-base font-normal  ms-3 text_dark">Bespoke feature development including API integration into your procurement systems</span>
                                                </div>
                                                <div className="flex items-strat mt-4 ">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                    </svg>
                                                    <span className="text-base font-normal  ms-3 text_dark">Build an internal external dev Hub with community features</span>
                                                </div>
                                            </li>
                                            <li className="text-start">
                                                <h2 className="block text-base font-bold color_pink_light mb-4">ROADMAP INPUT</h2>
                                                <div className="flex items-strat">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                    </svg>
                                                    <span className="text-base font-normal  ms-3 text_dark">Tailored development of features to support your unique processes & systems</span>
                                                </div>

                                            </li>
                                            <li className="text-start">
                                                <h2 className="block text-base font-bold color_pink_light mb-4">SECURITY</h2>
                                                <div className="flex items-strat">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                                                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                                                    </svg>
                                                    <span className="text-base font-normal  ms-3 text_dark">Choose your preferred, secured platform hosting provider</span>
                                                </div>

                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* <div className="grid items-center gap-0 justify-center lg:pb-0 pb-10">
                        <div className="col-12 col-3@md">
                            <img src="/ProfileHugo2.png" className="m-auto" />
                        </div>
                        <div className="col-12 col-5@md">
                            <p className="font_size_24">“We were excited to be discovered by a AAA developer in XDS Spark, and are now discussing new project opportunities!”</p>
                            <p className="font_size_17px lg:mt-9 mt-4 text-center">Hugo Gutiérrez Mares, Founder & Director, Boson VFX</p>
                        </div>
                        <div className="col-12 col-3@md text-center"><img src="/PprofileHugo2.png" className="m-auto" />
                        </div>
                        <div className="lg:container container  lg:px-0 px-0 pt-20">
                            <div className="lg:pb-24 pb-5 text-center ">
                                <h5 className="text-[48px] text-[#fff]">
                                    <span className=" font-light">XDS SPARK</span> <span className="font-extrabold">BUSINESS SOLUTIONS</span>
                                </h5>
                                <p className="font-bold text-[#fff] text-[21px]">Elevate Your External Development Strategies with XDS Spark Business Solutions</p>
                            </div>
                            <div className="grid items-start gap-0 ">
                                <div className="col-12 col-4@md">
                                    <div className=" fondation_shadow text-start ex_strategi_height lg:px-4">
                                        <div className="w-full p-4 sm:p-8">
                                            <p className="text-[22px] text-[#462C87] leading-8"><b>XDS Spark Business Solutions</b> delivers <b>high-value support</b> and expertise to Developers and Service Providers requiring guidance and insights in external development.</p>
                                            <p className="mt-8 text-[18px] leading-8">Our mission is to leverage our 50 years of combined expertise to educate and support the industry on innovative strategies and processes to <b>increase the sustainability and stability</b> of the video games Industry with respect to external development.</p>
                                            <p className=" font-bold text-[22px] text-[#462C87] mt-16 text-center">Contact us now to request <br /> a FREE consultation! </p>
                                            <div className="my-5 text-center"><a href="https://forms.gle/ez9WE4Pbokc3EP4H7" target="_blank"><button className="sign_up_button lg:w-[279px]">Contact Us</button></a></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-12 col-4@md transform_scale6">
                                    <div className="fondation_shadow shadow_center ex_strategi_height" style={{ background: '#F8F0FF' }}>
                                        <div className="w-full p-4 sm:p-8 text-center">
                                            <p className="text-[29px] text-[#462C87] font-bold">How We Can Help</p>
                                            <p className="italic text-[18px]  text-[#462C87] mt-4">We specialize in a range of <br />services tailored to your needs:</p>
                                            <div className="space-y-6 font-bold mt-8  text-[#462C87] text-[18px]">

                                                <p>Problem Solving </p>
                                                <p>Sharing Industry Insights</p>
                                                <p>Service Provider Shortlisting</p>
                                                <p>Service Provider Analysis</p>
                                                <p>Conflict Resolution & Mediation</p>
                                                <p>Documentation</p>
                                                <p>Coaching & Training</p>

                                            </div>
                                            <p className="text-[29px] text-[#462C87] font-bold mt-12">and more - </p>

                                            <p className="italic text-[18px]  text-[#462C87]">supporting all aspects <br />of external development</p>

                                        </div>
                                    </div>
                                </div>
                                <div className="col-12 col-4@md">
                                    <div className="fondation_shadow ex_strategi_height lg:ps-7">
                                        <div className="w-full p-4 sm:p-8">
                                            <div className="mb-8">
                                                <img src="../carlarylance.png" />
                                            </div>
                                            <p className="text-[18px]  text-[#462C87] font-bold">CARLA RYLANCE</p>
                                            <p className="text-[15px]  text-[#462C87] font-semibold">Head of Business Solutions, XDS Spark</p>
                                            <div className="mt-8 space-y-4 text-[18px] leading-7">
                                                <p>Carla is a seasoned video games professional with over 20 years of experience.</p>
                                                <p>Since 2009, Carla has been deeply involved in external development through management and leadership roles at <b>Xbox, Electronic Arts,</b> and <b>Behaviour Interactive.</b>
                                                </p>
                                                <p>
                                                    Passionate about fostering exceptional relationships and optimizing processes, Carla is excited to bring fresh value and insights to the external development community.
                                                </p>
                                            </div>


                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2"> </div>
                            <p className="font-bold text-[21px] text-[#fff] lg:pt-24 pt-8 text-center">
                                Let’s work together to advance your strategies and build sustainable solutions in external development.</p>
                        </div>
                    </div> */}
                    </div>
                </section>
            </div>
            {/* <section>
                <div className="benifit_footer relative">
                    <div className="lg:h-80 h-[550px] w-full">
                        <Carousel>
                            <div className="flex h-full items-center justify-center">
                                <div className="lg:flex items-center gap-2.5">
                                    <img className="lg:w-[190px] lg:h-[190px] w-[110px] h-[110px] rounded-full m-auto img_boxshadow" src="/Rectangle.jpg" alt="Jese image" />
                                    <div className="flex flex-col  lg:w-[640px] w-[300px] leading-1.5 lg:ms-8 mt-4 lg:mt-0">
                                        <p className="benifit_testimonials_text_2"> “ XDS has been a true extension to my professional work family.
                                            Where else can you receive feedback and validation from your peers, all while building your network with potential
                                            new business partnerships? ”</p>
                                        <p className="benifit_testimonials_text_bold  mt-4">Matt Regnier, Senior R&D Technical Artist, Apple</p>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="29" height="34" viewBox="0 0 29 34" fill="none" className="mt-6">
                                            <path d="M27.745 11.4405C27.7021 11.3812 27.6691 11.3318 27.636 11.2824C26.8271 10.192 25.8003 9.37179 24.5522 8.82826C23.74 8.47249 22.8881 8.26167 22.0132 8.1332C21.1151 8.00143 20.2269 8.0179 19.3355 8.19908C18.5595 8.36049 17.8133 8.61084 17.0705 8.87108C16.387 9.11155 15.6969 9.32567 15.0102 9.55296C14.7295 9.6452 14.4456 9.65508 14.1649 9.57273C13.7126 9.44096 13.2635 9.31249 12.8178 9.16426C12.1211 8.93367 11.4311 8.68002 10.7311 8.45602C10.2259 8.29461 9.70756 8.1892 9.17597 8.14637C8.58496 8.09696 7.99725 8.15296 7.41614 8.25508C6.08884 8.48567 4.89031 9.02261 3.81063 9.82308C2.57578 10.7388 1.6777 11.9247 1.02726 13.305C0.380117 14.6819 0.0895636 16.1478 0.0235286 17.6598C-0.0259976 18.7666 0.0466409 19.8702 0.221634 20.9671C0.396626 22.0772 0.677274 23.161 1.02396 24.2316C1.95835 27.1041 3.47386 29.6372 5.48132 31.8838C5.98318 32.4471 6.53788 32.9511 7.18172 33.3497C8.03027 33.8768 8.94155 34.0646 9.93208 33.8669C10.5825 33.7384 11.2066 33.5342 11.8207 33.2904C12.4942 33.0203 13.181 32.7963 13.8975 32.6744C14.5842 32.5591 15.2743 32.5427 15.9644 32.6448C16.6742 32.7502 17.3544 32.9544 18.0181 33.2245C18.6289 33.4716 19.2529 33.6824 19.9034 33.8109C20.9632 34.0217 21.957 33.8603 22.8881 33.3168C23.4593 32.9841 23.9546 32.5591 24.3937 32.0716C24.7734 31.65 25.1333 31.2118 25.4833 30.7671C26.837 29.041 27.8936 27.1502 28.6035 25.0716C28.6233 25.0123 28.6431 24.9497 28.6596 24.9003C28.6464 24.8805 28.6431 24.8772 28.6398 24.8739C28.6167 24.8608 28.5936 24.8476 28.5704 24.8344C27.6757 24.449 26.8932 23.8989 26.1965 23.2236C25.3479 22.4001 24.7074 21.4448 24.3409 20.3182C23.9381 19.0829 23.8655 17.8245 24.0669 16.5464C24.2419 15.4429 24.6678 14.4447 25.3413 13.5553C25.9588 12.7384 26.7281 12.0927 27.5898 11.5492C27.6327 11.5163 27.6856 11.48 27.745 11.4405ZM21.4618 0C21.2571 0.0230589 21.0689 0.0296469 20.884 0.0625882C19.0185 0.421648 17.4237 1.26824 16.1856 2.72424C15.129 3.96942 14.4621 5.39248 14.3432 7.03955C14.3201 7.36237 14.3333 7.68519 14.3762 8.01131C14.7031 8.06402 15.0201 8.04096 15.337 8.00802C16.146 7.91578 16.8922 7.64567 17.5822 7.21743C18.9359 6.37743 19.9727 5.23766 20.7189 3.83766C21.2868 2.77036 21.541 1.63059 21.4981 0.421648C21.4882 0.286589 21.475 0.154824 21.4618 0Z" fill="white" fill-opacity="0.5" />
                                            <path d="M27.745 11.4404C27.6856 11.4799 27.6328 11.5128 27.5799 11.5491C26.7182 12.0926 25.9489 12.7415 25.3314 13.5552C24.6546 14.4446 24.232 15.4427 24.057 16.5463C23.8556 17.8244 23.9282 19.086 24.331 20.318C24.6975 21.4446 25.338 22.3999 26.1866 23.2235C26.8833 23.8988 27.6658 24.4489 28.5605 24.8343C28.5837 24.8442 28.6068 24.8606 28.6299 24.8738C28.6332 24.8771 28.6365 24.8804 28.6497 24.9002C28.6332 24.9496 28.6134 25.0122 28.5936 25.0715C27.887 27.1501 26.8304 29.0409 25.4734 30.767C25.1234 31.2117 24.7635 31.6498 24.3838 32.0715C23.9447 32.559 23.4461 32.9807 22.8782 33.3167C21.9471 33.8635 20.9533 34.0216 19.8935 33.8108C19.243 33.6823 18.6223 33.4715 18.0082 33.2244C17.3445 32.9543 16.6643 32.7501 15.9545 32.6447C15.2644 32.5425 14.5743 32.559 13.8876 32.6743C13.1711 32.7962 12.4843 33.0202 11.8108 33.2903C11.2 33.5341 10.5726 33.7383 9.92218 33.8668C8.93165 34.0644 8.02367 33.8767 7.17182 33.3496C6.52798 32.951 5.97329 32.447 5.47142 31.8837C3.46396 29.6338 1.94846 27.1006 1.01406 24.2315C0.667378 23.1642 0.386729 22.0771 0.211736 20.967C0.0400454 19.87 -0.032593 18.7665 0.0136314 17.6597C0.0796664 16.1477 0.370221 14.6851 1.01736 13.3048C1.66781 11.9246 2.56588 10.7387 3.80074 9.82295C4.88041 9.01919 6.07894 8.48554 7.40625 8.25495C7.98735 8.15283 8.57506 8.09683 9.16608 8.14624C9.69436 8.19236 10.216 8.29448 10.7212 8.45589C11.4212 8.67989 12.1079 8.93354 12.8079 9.16413C13.2536 9.31236 13.706 9.44083 14.155 9.5726C14.439 9.65495 14.7196 9.64507 15.0003 9.55283C15.687 9.32554 16.3771 9.11142 17.0606 8.87095C17.8068 8.61071 18.5529 8.36036 19.3256 8.19895C20.2137 8.01448 21.1052 7.99801 22.0033 8.13307C22.8782 8.26154 23.7301 8.47236 24.5423 8.82813C25.7904 9.37166 26.8172 10.1919 27.6262 11.2822C27.6691 11.3317 27.7021 11.3811 27.745 11.4404Z" fill="white" fill-opacity="0.5" />
                                            <path d="M21.4617 0C21.4749 0.154824 21.4882 0.286589 21.4948 0.421648C21.5377 1.6273 21.2801 2.77036 20.7155 3.83766C19.9726 5.23766 18.9326 6.37743 17.5789 7.21743C16.8921 7.64567 16.1426 7.91578 15.3337 8.00802C15.0167 8.04426 14.6998 8.06731 14.3729 8.01131C14.33 7.68519 14.3168 7.36566 14.3399 7.03955C14.4587 5.38919 15.1257 3.96942 16.1822 2.72424C17.4204 1.26824 19.0151 0.421648 20.8806 0.0625882C21.0688 0.0263528 21.257 0.0197648 21.4617 0Z" fill="white" fill-opacity="0.5" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="flex h-full items-center justify-center">
                                <div className="lg:flex items-center gap-2.5">
                                    <img className="lg:w-[190px] lg:h-[190px] w-[110px] h-[110px] rounded-full m-auto img_boxshadow" src="/summer-obrien-circle.png" alt="Jese image" />
                                    <div className="flex flex-col  lg:w-[640px] w-[300px] leading-1.5 lg:ms-8 mt-4 lg:mt-0">
                                        <p className="benifit_testimonials_text_2"> “ XDS is where community is made and the industry progresses.”</p>
                                        <p className="benifit_testimonials_text_bold  mt-4">Summer O'Brien, Director of Product Management, Riot Games</p>

                                        <svg xmlns="http://www.w3.org/2000/svg" className="riot mt-6" width="120.154" height="33" viewBox="0 0 121 33" fill="none">
                                            <g clip-path="url(#clip0_644_3863)">
                                                <path d="M20.1854 0.066L0 9.214L5.02949 27.946L8.85729 27.486L7.8048 15.708L9.06166 15.16L11.232 27.2L17.7739 26.414L16.611 13.414L17.8556 12.872L20.2426 26.118L26.86 25.322L25.5868 11.072L26.8457 10.524L29.4555 25.01L35.9973 24.224V3.942L20.1854 0.066Z" fill="white" fill-opacity="0.5"></path>
                                                <path d="M20.6602 28.476L20.9933 30.32L35.9979 32.768V26.632L20.6683 28.476H20.6602Z" fill="white" fill-opacity="0.5"></path>
                                                <path d="M50.1916 24.632V27.158H53.3736C53.3613 27.714 53.2305 28.202 52.9812 28.62C52.7175 29.06 52.3374 29.4 51.8367 29.64C51.3381 29.88 50.7311 30 50.0199 30C49.2269 30 48.5464 29.814 47.9762 29.44C47.406 29.068 46.9666 28.524 46.6601 27.812C46.3515 27.1 46.1962 26.238 46.1962 25.226C46.1962 24.214 46.3535 23.364 46.6703 22.662C46.9871 21.96 47.4285 21.422 47.9987 21.052C48.5689 20.682 49.2372 20.496 50.0056 20.496C50.4021 20.496 50.7679 20.544 51.101 20.64C51.4341 20.736 51.7304 20.874 51.9859 21.056C52.2414 21.238 52.458 21.458 52.6378 21.716C52.8156 21.974 52.9546 22.27 53.0547 22.604H56.5842C56.484 21.858 56.247 21.172 55.8771 20.548C55.5051 19.924 55.0248 19.384 54.4363 18.928C53.8477 18.472 53.1712 18.12 52.411 17.87C51.6507 17.622 50.8292 17.498 49.9463 17.498C48.9224 17.498 47.9701 17.672 47.0852 18.018C46.2023 18.364 45.4277 18.872 44.7636 19.54C44.0973 20.208 43.5803 21.022 43.2083 21.982C42.8364 22.942 42.6504 24.038 42.6504 25.272C42.6504 26.864 42.959 28.236 43.5762 29.39C44.1934 30.544 45.0538 31.434 46.1573 32.06C47.2609 32.686 48.5403 33 49.9974 33C51.3074 33 52.4682 32.744 53.4819 32.23C54.4955 31.716 55.2905 30.982 55.8689 30.024C56.4452 29.066 56.7334 27.92 56.7334 26.584V24.632H50.1916Z" fill="white" fill-opacity="0.5"></path>
                                                <path d="M94.1328 32.794V17.706H104.695V20.498H97.6193V23.85H103.34V26.642H97.6193V30.002H104.711V32.794H94.1328Z" fill="white" fill-opacity="0.5"></path>
                                                <path d="M114.946 22.134C114.891 21.564 114.649 21.122 114.222 20.804C113.795 20.488 113.204 20.328 112.446 20.328C111.939 20.328 111.512 20.396 111.167 20.534C110.822 20.672 110.56 20.856 110.384 21.09C110.208 21.324 110.119 21.59 110.112 21.89C110.108 22.14 110.161 22.36 110.274 22.55C110.386 22.74 110.55 22.902 110.762 23.04C110.975 23.178 111.228 23.296 111.518 23.398C111.809 23.498 112.125 23.586 112.467 23.66L113.822 23.97C114.535 24.122 115.179 24.328 115.753 24.586C116.327 24.844 116.818 25.156 117.224 25.522C117.631 25.888 117.944 26.314 118.162 26.8C118.381 27.286 118.489 27.838 118.489 28.458C118.489 29.396 118.248 30.204 117.766 30.882C117.284 31.56 116.593 32.082 115.692 32.452C114.79 32.82 113.705 33.004 112.436 33.004C111.167 33.004 110.069 32.816 109.131 32.44C108.193 32.064 107.462 31.5 106.941 30.746C106.419 29.992 106.146 29.05 106.121 27.92H109.479C109.51 28.416 109.651 28.83 109.9 29.162C110.151 29.494 110.49 29.742 110.92 29.91C111.349 30.078 111.841 30.16 112.399 30.16C112.927 30.16 113.38 30.088 113.762 29.942C114.143 29.798 114.439 29.596 114.647 29.338C114.856 29.08 114.962 28.782 114.966 28.442C114.96 28.132 114.864 27.868 114.676 27.65C114.488 27.432 114.206 27.244 113.83 27.086C113.454 26.928 112.984 26.786 112.422 26.658L110.773 26.268C109.458 25.964 108.42 25.48 107.66 24.816C106.9 24.152 106.522 23.256 106.528 22.128C106.524 21.204 106.777 20.398 107.288 19.704C107.799 19.012 108.504 18.472 109.399 18.084C110.294 17.696 111.318 17.502 112.467 17.502C113.615 17.502 114.647 17.696 115.516 18.084C116.384 18.472 117.059 19.014 117.541 19.712C118.023 20.41 118.269 21.218 118.279 22.136H114.944L114.946 22.134Z" fill="white" fill-opacity="0.5"></path>
                                                <path d="M91.6493 32.794H88.2016V21.324L87.8481 21.32L84.3657 32.794H80.92L77.5316 21.32L77.0922 21.324V32.794H73.6445V17.706H79.5037L82.463 27.816H82.8227L85.7799 17.706H91.6493V32.794Z" fill="white" fill-opacity="0.5"></path>
                                                <path d="M68.2162 32.794H71.95L66.7733 17.706H62.0402L56.8574 32.794H60.5994L61.6069 29.486H67.2107L68.2182 32.794H68.2162ZM62.406 26.856L64.09 21.324H64.7235L66.4075 26.856H62.406Z" fill="white" fill-opacity="0.5"></path>
                                                <path d="M119.339 19.3C119.226 19.3 119.12 19.28 119.022 19.238C118.924 19.196 118.836 19.14 118.763 19.066C118.687 18.992 118.63 18.908 118.587 18.812C118.544 18.716 118.523 18.612 118.523 18.502C118.523 18.392 118.544 18.288 118.587 18.192C118.63 18.096 118.687 18.012 118.763 17.938C118.838 17.864 118.924 17.808 119.022 17.766C119.12 17.724 119.226 17.704 119.339 17.704C119.451 17.704 119.558 17.724 119.656 17.766C119.754 17.808 119.84 17.864 119.915 17.938C119.991 18.012 120.048 18.096 120.091 18.192C120.134 18.288 120.154 18.392 120.154 18.502C120.154 18.612 120.134 18.716 120.091 18.812C120.048 18.908 119.991 18.992 119.915 19.066C119.84 19.14 119.754 19.196 119.656 19.238C119.558 19.28 119.451 19.3 119.339 19.3ZM119.339 19.084C119.449 19.084 119.549 19.058 119.637 19.006C119.725 18.954 119.799 18.884 119.852 18.796C119.905 18.708 119.932 18.612 119.932 18.504C119.932 18.396 119.905 18.3 119.852 18.212C119.799 18.124 119.727 18.054 119.637 18.002C119.547 17.95 119.447 17.924 119.339 17.924C119.231 17.924 119.13 17.95 119.04 18.002C118.951 18.054 118.879 18.124 118.826 18.212C118.773 18.3 118.746 18.396 118.746 18.504C118.746 18.612 118.773 18.708 118.826 18.796C118.879 18.884 118.951 18.954 119.04 19.006C119.13 19.058 119.229 19.084 119.339 19.084ZM119.04 18.862V18.126H119.404C119.457 18.126 119.504 18.136 119.545 18.156C119.586 18.176 119.619 18.204 119.641 18.24C119.664 18.276 119.676 18.32 119.676 18.372C119.676 18.424 119.664 18.468 119.641 18.504C119.617 18.54 119.584 18.568 119.543 18.586C119.502 18.604 119.453 18.614 119.4 18.614H119.155V18.47H119.361C119.392 18.47 119.417 18.462 119.435 18.446C119.453 18.43 119.464 18.404 119.464 18.372C119.464 18.34 119.453 18.314 119.435 18.298C119.417 18.282 119.392 18.274 119.361 18.274H119.249V18.86H119.043L119.04 18.862ZM119.531 18.526L119.697 18.862H119.472L119.318 18.526H119.531Z" fill="white" fill-opacity="0.5"></path>
                                                <path d="M61.1993 0.206001H57.7148V15.294H61.1993V0.206001Z" fill="white" fill-opacity="0.5"></path>
                                                <path d="M77.7472 7.75C77.7472 9.406 77.4263 10.808 76.7846 11.96C76.1429 13.112 75.2723 13.99 74.1728 14.594C73.0733 15.198 71.8369 15.5 70.4615 15.5C69.0861 15.5 67.8497 15.196 66.7502 14.59C65.6507 13.984 64.7801 13.104 64.1384 11.95C63.4966 10.796 63.1758 9.396 63.1758 7.752C63.1758 6.108 63.4966 4.694 64.1384 3.542C64.7801 2.39 65.6507 1.512 66.7502 0.908001C67.8497 0.304001 69.0861 0.00200081 70.4615 0.00200081C71.8369 0.00200081 73.0733 0.304001 74.1728 0.908001C75.2723 1.512 76.1429 2.39 76.7846 3.542C77.4263 4.694 77.7472 6.098 77.7472 7.752M74.2014 7.75C74.2014 6.724 74.0502 5.858 73.7457 5.154C73.4412 4.45 73.01 3.914 72.45 3.548C71.89 3.182 71.2258 2.998 70.4594 2.998C69.6931 2.998 69.035 3.182 68.475 3.548C67.9151 3.914 67.4818 4.45 67.1773 5.154C66.8707 5.858 66.7175 6.724 66.7175 7.75C66.7175 8.776 66.8707 9.642 67.1773 10.346C67.4838 11.052 67.9171 11.586 68.475 11.952C69.035 12.318 69.6951 12.502 70.4594 12.502C71.2238 12.502 71.89 12.318 72.45 11.952C73.01 11.586 73.4412 11.052 73.7457 10.346C74.0502 9.642 74.2014 8.776 74.2014 7.75Z" fill="white" fill-opacity="0.5"></path>
                                                <path d="M50.3931 10.034L52.1834 15.294H56.0071L54.0166 9.628H51.3128L51.1513 9.14C51.6684 9.042 52.5471 8.89 53.3278 8.37C54.3333 7.7 55.116 6.506 55.116 5.092C55.116 4.08 54.8933 3.288 54.4498 2.542C54.0063 1.796 53.3687 1.22 52.5369 0.814001C51.7072 0.408001 50.7099 0.206001 49.545 0.206001H43.3281V15.294H46.8126V10.034H50.3931ZM50.3277 6.912C49.9312 7.07 49.4367 7.148 48.844 7.148H46.8126V2.976H48.8379C49.4305 2.976 49.9251 3.058 50.3216 3.222C50.7181 3.386 51.0185 3.634 51.2208 3.962C51.4231 4.292 51.5253 4.608 51.5253 5.09C51.5253 5.572 51.4252 5.884 51.2249 6.2C51.0246 6.516 50.7262 6.754 50.3298 6.912" fill="white" fill-opacity="0.5"></path>
                                                <path d="M78.0762 0.206001V2.998H82.094H84.0641L84.2256 3.486C83.7188 3.582 82.8625 3.732 82.094 4.226V15.288H85.5335V2.998H89.5453V0.206001H78.0762Z" fill="white" fill-opacity="0.5"></path>
                                            </g>
                                            <defs>
                                                <clipPath id="clip0_644_3863">
                                                    <rect width="120.154" height="33" fill="white"></rect>
                                                </clipPath>
                                            </defs>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="flex h-full items-center justify-center">
                                <div className="lg:flex items-center gap-2.5">
                                    <img className="lg:w-[190px] lg:h-[190px] w-[110px] h-[110px] rounded-full m-auto img_boxshadow" src="/Phil-Knowles-circle.png" alt="Jese image" />
                                    <div className="flex flex-col  lg:w-[640px] w-[300px] leading-1.5 lg:ms-8 mt-4 lg:mt-0">
                                        <p className="benifit_testimonials_text_2"> “ XDS is an invaluable resource for any Developer/Publisher that works with
                                            external partners to build their products.”</p>
                                        <p className="benifit_testimonials_text_bold  mt-4">Philip Knowles, Senior Outsourcing Program Manager, Amazon Games</p>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="89" height={37.829} className="amazon mt-6" viewBox="0 0 90 38" fill="none">
                                            <path fill-rule="evenodd" clip-rule="evenodd" d="M14.4003 15.9842C14.7333 14.9484 14.7058 13.6453 14.7058 12.3028V2.69419C14.7058 2.23261 14.8281 0.915436 14.6295 0.642431C14.4308 0.369426 13.6669 0.431345 13.1322 0.431345C11.6044 0.431345 10.9261 0.237146 10.7885 1.57965L10.7305 1.61624C9.53269 0.771897 8.39295 -0.0302299 6.19596 0.00635836L5.46567 0.0598335C5.04094 0.118938 4.62537 0.211816 4.21898 0.341282C2.72478 0.906992 1.54226 2.00183 0.934191 3.38092C0.643907 4.04795 0.430014 4.74313 0.298623 5.45238C0.139731 6.14756 0.100008 6.86525 0.18251 7.5745C0.298623 8.23872 0.228344 8.8185 0.375013 9.39828C0.90669 11.4782 1.96699 13.0993 3.91036 13.8733C4.97983 14.2955 6.15929 14.4334 7.31126 14.2645C8.08433 14.1407 8.82684 13.8846 9.50214 13.5131L10.3272 12.9502H10.3455C10.4372 13.5806 10.428 14.2223 10.3119 14.8499C9.96965 16.6484 9.39519 17.2535 7.44876 17.5744C6.90181 17.6644 6.34569 17.6757 5.79567 17.6109L4.18231 17.4167L1.81726 16.8904C1.64004 16.9214 1.49642 17.0368 1.43226 17.1916C1.38031 17.9233 1.40476 18.6579 1.50865 19.3869C1.7806 19.8034 2.6545 19.9695 3.20146 20.1299C5.03483 20.6675 7.99572 20.9264 9.98187 20.2903C12.2552 19.5698 13.6944 18.1598 14.4003 15.9842ZM10.3638 5.59592V10.5325C9.96048 10.7971 9.51436 10.9997 9.04074 11.1348C5.80484 12.0692 4.5826 9.97525 4.5826 7.2255C4.53676 6.38116 4.65287 5.53681 4.92788 4.72906C5.21205 4.05358 5.65206 3.46254 6.37013 3.18954C6.6268 3.09384 6.93542 3.11636 7.21348 3.01222C8.02322 2.98689 8.83296 3.09947 9.59686 3.34996L10.3119 3.66237C10.486 3.94382 10.3638 5.15686 10.3638 5.59592ZM23.3716 15.0104C24.273 14.8499 25.1377 14.5432 25.9261 14.1069L26.9436 13.4174C27.2064 13.7298 27.1025 14.2054 27.4417 14.4446C27.7808 14.6839 30.3995 14.7711 30.65 14.4446C30.9006 14.1182 30.7845 13.4117 30.7845 12.922V6.60632C30.7845 5.37639 30.8853 4.00011 30.5737 3.03193C29.8434 0.75501 27.7533 -0.0274154 24.5235 0.000729398L22.7941 0.104865C21.804 0.228702 20.8293 0.425716 19.8729 0.690277C19.4573 0.822558 18.8218 0.921065 18.6506 1.27288C18.4795 1.62469 18.5131 3.47943 18.7454 3.62578C19.0876 3.8425 20.7315 3.34433 21.1899 3.25427C22.516 2.98971 25.5411 2.71952 26.2805 3.59201C26.8122 4.22245 26.7236 5.45238 26.7114 6.5838C26.4058 6.65135 25.8802 6.46559 25.5594 6.40649L24.0988 6.26577C23.561 6.20948 23.0171 6.22918 22.4854 6.31924C19.9798 6.71608 18.2076 7.5942 17.627 9.73321C16.7287 13.0233 19.824 15.6971 23.3716 15.0075V15.0104ZM22.6413 8.90575C23.0049 8.70874 23.4571 8.76221 23.9094 8.6046C24.933 8.6046 25.7977 8.74814 26.6594 8.78191C26.8153 9.09713 26.7022 10.7042 26.6961 11.1883C25.9658 12.0805 23.0293 12.9699 22.0302 11.7005C21.3121 10.7633 21.7918 9.36451 22.6413 8.90575ZM34.4146 13.4089C34.4146 13.9015 34.3504 14.3884 34.6835 14.5769C34.8729 14.6811 35.3221 14.6304 35.6001 14.6304C36.2388 14.6304 38.4358 14.7542 38.6741 14.47C38.9797 14.1182 38.8085 12.2691 38.8085 11.6217V3.89879C39.3861 3.58919 40.0155 3.37529 40.6725 3.2599C41.7053 3.03755 43.0742 3.03474 43.5906 3.668C44.0459 4.2309 43.9756 5.23285 43.9756 6.2151V11.5626C43.9756 12.2888 43.7984 14.318 44.2445 14.5713C44.5195 14.7233 45.7723 14.6248 46.2031 14.6248C46.634 14.6248 47.8959 14.7205 48.1648 14.5347C48.5254 14.2842 48.3757 12.4858 48.3757 11.8441C48.3757 9.19283 48.3818 6.53877 48.394 3.8819C48.5407 3.65956 49.1426 3.56949 49.4329 3.47661C50.6979 3.0657 52.678 2.79551 53.2922 3.93537C53.5977 4.52642 53.503 5.60155 53.503 6.46841V11.7709C53.503 12.4013 53.3502 14.1154 53.6374 14.4615C53.8055 14.6614 54.1966 14.622 54.5786 14.622C55.153 14.622 57.4295 14.7148 57.6922 14.5319C58.0711 14.2673 57.9214 13.1978 57.9214 12.604V7.10167C57.9214 4.78253 58.117 2.66886 57.0047 1.34887C55.0125 -1.04344 49.7599 0.237146 47.8379 1.75697H47.7615C47.0251 0.617101 45.757 -0.0246009 43.7525 0.000729398L42.9458 0.0542045C42.3989 0.121752 41.858 0.234331 41.3325 0.389128C40.6602 0.617101 40.0125 0.901364 39.3922 1.23347L38.451 1.76541C38.1088 1.38545 38.3166 0.769083 37.8399 0.510151C37.6535 0.406015 35.1907 0.37787 34.8454 0.456675C34.7171 0.487635 34.601 0.555182 34.5185 0.650875C34.3168 0.932323 34.4207 2.78707 34.4207 3.32182L34.4146 13.4061V13.4089ZM63.8463 14.0084C65.7316 15.0976 69.1355 15.334 71.8184 14.7177C72.4936 14.5629 73.8106 14.3433 74.0459 13.8339C74.1192 13.1275 74.1315 12.4182 74.0826 11.709C74.0367 11.5964 73.9481 11.5035 73.8351 11.4444C73.5937 11.3487 73.2239 11.512 72.9886 11.5682L71.0086 11.9032C70.2875 12.0298 69.5511 12.0552 68.8208 11.9763C68.3074 11.9398 67.7972 11.875 67.293 11.7793C65.7896 11.36 64.7904 10.3271 64.7752 8.55957C65.1327 8.4104 66.303 8.52579 66.7919 8.52579H71.6808C72.3836 8.52579 73.5142 8.65807 73.9451 8.36537C74.5226 7.96853 74.4798 5.31166 74.2934 4.45605C73.6609 1.55714 71.7633 -0.0471168 67.953 0.0148018L67.4916 0.0316887L66.1074 0.209001C64.6224 0.552368 63.3421 1.18281 62.5171 2.13692C62.0557 2.64916 61.6737 3.21768 61.3834 3.82561C60.6317 5.46927 60.424 8.44699 61.0595 10.4171C61.5729 11.9904 62.4743 13.2119 63.8463 14V14.0084ZM64.9768 4.84445C65.3221 3.92975 65.8935 3.26271 66.8988 2.97001L67.7574 2.81803C70.0369 2.79832 70.6664 3.88471 70.6389 5.98713C70.3333 6.1166 69.3402 6.02091 68.9094 6.02091H64.766C64.6407 5.72538 64.8791 5.09776 64.9768 4.83601V4.84445ZM88.7037 8.55957C87.787 7.09604 85.7947 6.5247 84.0164 5.85204C83.173 5.534 81.7919 5.26662 81.5933 4.36599C81.1746 2.44088 85.4708 2.99815 86.742 3.28804C87.0964 3.36685 87.9184 3.66237 88.1445 3.39218C88.3706 3.12199 88.2606 2.46622 88.2606 2.04967C88.2606 1.70349 88.3095 1.26162 88.1628 1.03927C87.9428 0.698721 87.3653 0.603028 86.9161 0.476377C85.7611 0.141453 84.5542 -0.018972 83.3411 0.00354388L82.2441 0.0739059C81.5597 0.166784 80.8905 0.330024 80.2488 0.56644C79.1549 0.977355 78.2779 1.76259 77.8043 2.75892C77.1229 4.31252 77.7615 6.37272 78.7852 7.12981C80.0074 8.03889 81.6666 8.55675 83.2402 9.14779C84.0347 9.44613 84.9361 9.61781 85.1042 10.4931C85.5594 12.8714 80.6705 12.0101 79.2068 11.6611C78.9013 11.5851 77.9357 11.284 77.679 11.4135C77.3307 11.5964 77.4682 12.497 77.4682 12.9867C77.4682 13.2682 77.4223 13.6679 77.5446 13.8536C77.9112 14.4165 79.9371 14.7711 80.8294 14.9344C84.3739 15.5817 87.5273 14.4784 88.667 12.421C89.2384 11.4275 89.3423 9.57278 88.7037 8.55112V8.55957ZM76.2551 22.5194L75.5829 22.556C74.932 22.5701 74.2812 22.6348 73.6426 22.7502C72.1973 22.981 70.8008 23.4313 69.5114 24.0786C69.2058 24.2503 67.9836 24.8048 68.2066 25.317C68.3808 25.7279 70.15 25.3874 70.7214 25.3508C71.852 25.2804 72.405 25.1903 73.4714 25.1932H75.4301C76.0168 25.1847 76.6004 25.2185 77.181 25.2973C77.566 25.3761 77.9265 25.5337 78.2351 25.7589C78.6813 26.1107 78.5988 27.304 78.446 27.8641C77.9937 29.671 77.404 31.4441 76.6798 33.1722C76.5546 33.4537 75.5676 35.2268 76.6615 35.0129C77.1565 34.9144 78.1588 33.8871 78.4674 33.5437C79.9952 31.7453 80.9577 29.6738 81.6758 27.0704C81.8408 26.4653 82.2197 24.0871 81.8469 23.5326C81.2358 22.6151 77.9999 22.4884 76.2551 22.5194ZM73.8687 27.5855L72.1209 28.2919L69.2211 29.2995C66.6421 30.2198 63.7699 30.8221 60.9006 31.4779L57.5395 32.0605L53.5824 32.539L52.3144 32.6262C51.8071 32.7247 51.2113 32.6684 50.6429 32.75C49.3871 32.8851 48.1221 32.933 46.8601 32.8936L43.997 32.9105L41.9405 32.8401L40.6175 32.7697C40.3119 32.7134 39.9513 32.7528 39.6183 32.6966L35.6032 32.2913C34.4146 32.0858 33.1373 32.0098 32.0098 31.7284L31.0687 31.5848L27.5761 30.8643C25.0827 30.1466 22.6046 29.5866 20.2762 28.7591C17.6912 27.8388 14.9931 26.834 12.7075 25.59L10.4433 24.3882C10.0308 24.1602 9.69769 23.8253 9.04074 23.8253C8.55184 24.0477 8.40211 24.3404 8.73518 24.8695C8.98268 25.1763 9.27908 25.4465 9.61825 25.666L10.6572 26.5497C12.1544 27.6474 13.6578 28.776 15.2864 29.7526C16.692 30.597 18.1893 31.3147 19.6651 32.1055L21.8743 33.0793C23.1363 33.5916 24.4472 34.1207 25.7733 34.5992L29.1742 35.6433C31.0076 36.2062 33.0029 36.4877 34.9799 36.9352L39.1477 37.4981L40.4922 37.5881L42.7594 37.7457H43.5845C44.3881 37.8499 45.2009 37.8555 46.0045 37.7654L46.8693 37.7457L47.9265 37.7289L51.5382 37.4643C53.1577 37.1322 54.8627 37.1828 56.3967 36.755L59.932 35.9614C62.0404 35.3985 64.1121 34.7314 66.138 33.9603C68.6588 32.9893 71.0758 31.8044 73.3584 30.4225C74.1406 29.9384 75.2467 29.5781 75.4545 28.5649C75.6256 27.7065 74.6723 27.38 73.8687 27.5855Z" fill="white" fill-opacity="0.5"></path>
                                        </svg>
                                    </div>
                                </div>
                            </div>


                        </Carousel>
                    </div>
                </div>
            </section> */}
            <section className="min-h-screen text-white" style={{
                background: 'linear-gradient(119deg, #4C2594 19.14%, #541EC2 39.48%, #5B18EA 60.97%, #8C38EE 79.17%, #BF5AF3 96.42%)'
            }}>
                <div className="container mx-auto px-0 lg:px-4 py-8 lg:py-16">
                    <div className="grid gap-md items-center mobile_pad">
                        <div className="col-6@md col-12 flex flex-column gap-md@md gap-sm">
                            <div className="space-y-16 white_border_right">
                                {/* Logo */}
                                <div className="w-48 h-12">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="234" height="59" viewBox="0 0 234 59" fill="none">
                                        <path d="M191.549 17.4734C190.667 17.3226 189.485 17.6542 189.485 17.6542L197.839 31.9125H200.073L191.539 17.4734H191.549Z" fill="white" />
                                        <path d="M118.938 9.75678C118.738 4.61215 115.011 2.02978 109.662 2.02978C106.377 2.02978 101.719 3.46666 101.719 8.45053C101.719 13.4344 106.657 14.1076 111.566 15.1627C116.504 16.2177 121.452 17.524 121.452 23.5227C121.452 29.5214 115.702 32.0033 111.285 32.0033C104.524 32.0033 99.0047 29.0894 99.0948 21.3222H100.878C100.517 27.9037 105.576 30.3956 111.285 30.3956C114.771 30.3956 119.669 28.7477 119.669 23.5127C119.669 18.2776 114.731 17.524 109.783 16.4689C104.884 15.4139 99.9362 14.188 99.9362 8.45053C99.9362 2.71305 105.075 0.432129 109.652 0.432129C115.692 0.432129 120.43 3.13507 120.711 9.75678H118.928H118.938Z" fill="white" />
                                        <path d="M129.736 16.7198H139.903C145.132 16.7198 146.915 13.1326 146.915 10.0076C146.915 7.76692 145.943 3.21512 140.153 3.21512H129.746V16.7198H129.736ZM127.953 1.60742H140.274C143.549 1.60742 148.698 2.83329 148.698 10.0478C148.698 15.3231 145.382 18.3174 139.623 18.3174H129.736V31.7417H127.953V1.60742Z" fill="white" />
                                        <path d="M166.207 20.4783L160.007 3.42662H159.927L153.486 20.4783H166.207ZM160.899 1.60791L172.327 31.7422H170.424L166.778 22.0759H152.925L149.239 31.7422H147.336L158.965 1.60791H160.909H160.899Z" fill="white" />
                                        <path d="M179.449 3.20556H189.736C193.622 3.20556 197.108 4.93384 197.108 9.49568C197.108 14.3489 193.943 16.4188 189.736 16.4188H179.449V3.20556ZM191.208 18.0265C191.939 18.0064 189.746 18.5792 193.382 17.6749C197.018 16.7806 198.901 13.4245 198.901 9.3751C198.901 3.5472 194.804 1.60791 189.746 1.60791H177.676V31.7422H179.459V18.0265H189.746C189.916 18.0265 190.547 18.0466 191.218 18.0265" fill="white" />
                                        <path d="M206.312 1.60791H208.095V18.951L226.286 1.60791H228.59L215.388 14.1379L229.401 31.7422H227.177L214.085 15.414L208.095 21.1113V31.7422H206.312V1.60791Z" fill="white" />
                                        <path d="M45.2156 23.6835H48.9718C54.9518 23.6835 55.8232 18.8202 55.8232 15.8861C55.8232 13.9167 55.2122 8.44048 48.2707 8.44048H45.2156V23.6734V23.6835ZM35.6096 0.432129H51.3658C61.7531 0.432129 65.4192 8.13903 65.4192 16.0168C65.4192 25.6027 60.3508 31.6918 49.4827 31.6918H35.5996V0.432129H35.6096Z" fill="white" />
                                        <path d="M75.946 21.101C75.946 21.8748 76.0762 22.558 76.2966 23.1207C76.9877 24.9696 79.0712 25.3514 80.8542 25.3514C82.4168 25.3514 84.8007 24.8389 84.8007 22.558C84.8007 20.9704 83.4585 20.5384 78.1196 19.0311C73.2115 17.6545 67.6222 16.3282 67.6222 10.1385C67.6222 3.04458 73.7423 0 80.1129 0C86.8341 0 92.784 2.53213 93.0444 10.0079H84.0194C84.1897 8.84234 83.6689 8.06864 82.8876 7.55618C82.1063 6.99349 81.0245 6.78248 80.0629 6.78248C78.7607 6.78248 76.6372 7.12411 76.6372 8.84234C76.8074 11.0328 81.2348 11.5051 85.6221 12.7109C90.0094 13.9166 94.3466 15.9363 94.3466 21.5633C94.3466 29.5515 86.9243 32.1339 80.0328 32.1339C76.517 32.1339 66.4903 30.8879 66.4102 21.091H75.956L75.946 21.101Z" fill="white" />
                                        <path d="M22.9181 0.432129L0.701172 31.7019H11.5793L17.1585 22.5882L22.4073 31.7019H33.9665L22.838 15.1526L32.8346 0.432129H22.9181Z" fill="white" />
                                        <path d="M11.7495 0.432129L16.5174 7.11413L11.2587 14.2885L1.83301 0.432129H11.7495Z" fill="#BF5AF3" />
                                        <path d="M0 57.897V45.9297H4.16693C4.99831 45.9297 5.67944 46.0704 6.22034 46.3618C6.76124 46.6431 7.16191 47.035 7.42234 47.5072C7.68278 47.9795 7.82301 48.5221 7.82301 49.1049C7.82301 49.6173 7.73286 50.0394 7.55256 50.381C7.37226 50.7126 7.13186 50.9839 6.84138 51.1748C6.55089 51.3657 6.23036 51.5164 5.88979 51.6069V51.7275C6.25039 51.7475 6.62101 51.8782 6.99163 52.1093C7.36224 52.3404 7.67276 52.682 7.91316 53.1141C8.15356 53.5462 8.28378 54.0787 8.28378 54.7117C8.28378 55.3448 8.14354 55.8472 7.87309 56.3295C7.60264 56.8118 7.17193 57.1836 6.59096 57.4649C6.00999 57.7463 5.23871 57.8869 4.30716 57.8869H0V57.897ZM1.4424 51.1949H4.11685C4.54756 51.1949 4.94823 51.1145 5.29881 50.9336C5.64939 50.7628 5.92986 50.5217 6.14021 50.2102C6.35056 49.8987 6.45073 49.537 6.45073 49.1149C6.45073 48.5924 6.27043 48.1403 5.89981 47.7785C5.53921 47.4068 4.95825 47.2259 4.16693 47.2259H1.4424V51.1949ZM1.4424 56.6108H4.30716C5.24873 56.6108 5.91984 56.43 6.32051 56.0582C6.72118 55.6864 6.92151 55.2443 6.92151 54.7218C6.92151 54.3199 6.82134 53.938 6.61099 53.5964C6.40064 53.2548 6.11016 52.9734 5.72953 52.7624C5.34889 52.5514 4.89815 52.4509 4.37728 52.4509H1.4424V56.6108Z" fill="white" />
                                        <path d="M21.7759 45.9395H23.2183V53.8574C23.2183 54.6713 23.028 55.4048 22.6473 56.0479C22.2667 56.6909 21.7258 57.1933 21.0347 57.5651C20.3435 57.9369 19.5221 58.1178 18.5906 58.1178C17.659 58.1178 16.8377 57.9369 16.1465 57.5651C15.4554 57.1933 14.9145 56.6909 14.5338 56.0479C14.1532 55.4048 13.9629 54.6813 13.9629 53.8574V45.9395H15.4053V53.7468C15.4053 54.3296 15.5355 54.8521 15.7859 55.3043C16.0363 55.7565 16.407 56.1182 16.8878 56.3694C17.3585 56.6307 17.9295 56.7613 18.6006 56.7613C19.2717 56.7613 19.8327 56.6307 20.3135 56.3694C20.7943 56.1081 21.1549 55.7565 21.4153 55.3043C21.6657 54.8521 21.7959 54.3296 21.7959 53.7468V45.9395H21.7759Z" fill="white" />
                                        <path d="M35.9091 48.9239C35.839 48.3311 35.5585 47.8689 35.0577 47.5474C34.5569 47.2158 33.9559 47.055 33.2247 47.055C32.6938 47.055 32.233 47.1454 31.8424 47.3163C31.4517 47.4871 31.1412 47.7182 30.9208 48.0196C30.7005 48.3211 30.5903 48.6627 30.5903 49.0445C30.5903 49.3661 30.6704 49.6374 30.8207 49.8685C30.9709 50.0996 31.1712 50.2905 31.4116 50.4312C31.652 50.5819 31.9025 50.7025 32.1729 50.8029C32.4333 50.8934 32.6838 50.9738 32.9041 51.0341L34.1161 51.3656C34.4267 51.446 34.7772 51.5566 35.1579 51.7073C35.5385 51.848 35.9091 52.0489 36.2597 52.2901C36.6103 52.5413 36.9008 52.8528 37.1312 53.2346C37.3615 53.6164 37.4717 54.0887 37.4717 54.6514C37.4717 55.2945 37.3014 55.8772 36.9709 56.3997C36.6303 56.9222 36.1495 57.3342 35.5085 57.6457C34.8674 57.9572 34.0861 58.1079 33.1746 58.1079C32.3232 58.1079 31.5819 57.9673 30.9609 57.696C30.3399 57.4146 29.849 57.0328 29.4985 56.5404C29.1479 56.0481 28.9375 55.4753 28.8975 54.8222H30.3899C30.43 55.2744 30.5803 55.6461 30.8507 55.9375C31.1212 56.2289 31.4517 56.45 31.8624 56.5907C32.2731 56.7313 32.7138 56.8017 33.1846 56.8017C33.7355 56.8017 34.2263 56.7112 34.6671 56.5304C35.1078 56.3495 35.4484 56.0983 35.7088 55.7667C35.9692 55.4452 36.0894 55.0633 36.0894 54.6212C36.0894 54.2193 35.9792 53.8978 35.7589 53.6466C35.5385 53.3954 35.248 53.1944 34.8874 53.0437C34.5268 52.893 34.1362 52.7523 33.7155 52.6317L32.253 52.2097C31.3215 51.9384 30.5803 51.5566 30.0394 51.0642C29.4985 50.5618 29.228 49.9087 29.228 49.1048C29.228 48.4316 29.4083 47.8488 29.7689 47.3464C30.1295 46.844 30.6203 46.4521 31.2313 46.1808C31.8424 45.8995 32.5335 45.7588 33.2948 45.7588C34.056 45.7588 34.7472 45.8995 35.3482 46.1708C35.9492 46.4421 36.42 46.8239 36.7706 47.2962C37.1211 47.7684 37.3115 48.311 37.3315 48.9139H35.9292L35.9091 48.9239Z" fill="white" />
                                        <path d="M44.5635 45.9395V57.9068H43.1211V45.9395H44.5635Z" fill="white" />
                                        <path d="M60.1901 45.9395V57.9068H58.7978L52.297 48.5118H52.1768V57.9068H50.7344V45.9395H52.1267L58.6475 55.3545H58.7677V45.9395H60.1901Z" fill="white" />
                                        <path d="M66.3604 57.897V45.9297H73.5523V47.2158H67.8028V51.2552H73.1817V52.5413H67.8028V56.6108H73.6525V57.897H66.3604Z" fill="white" />
                                        <path d="M85.9628 48.9239C85.8927 48.3311 85.6123 47.8689 85.1114 47.5474C84.6106 47.2158 84.0096 47.055 83.2784 47.055C82.7475 47.055 82.2867 47.1454 81.8961 47.3163C81.5054 47.4871 81.1949 47.7182 80.9745 48.0196C80.7542 48.3211 80.644 48.6627 80.644 49.0445C80.644 49.3661 80.7241 49.6374 80.8744 49.8685C81.0246 50.0996 81.225 50.2905 81.4654 50.4312C81.7058 50.5819 81.9562 50.7025 82.2266 50.8029C82.487 50.8934 82.7375 50.9738 82.9578 51.0341L84.1698 51.3656C84.4804 51.446 84.831 51.5566 85.2116 51.7073C85.5922 51.848 85.9628 52.0489 86.3134 52.2901C86.664 52.5413 86.9545 52.8528 87.1849 53.2346C87.4152 53.6164 87.5254 54.0887 87.5254 54.6514C87.5254 55.2945 87.3551 55.8772 87.0246 56.3997C86.684 56.9222 86.2032 57.3342 85.5622 57.6457C84.9211 57.9572 84.1398 58.1079 83.2283 58.1079C82.3769 58.1079 81.6356 57.9673 81.0146 57.696C80.3936 57.4146 79.9028 57.0328 79.5522 56.5404C79.2016 56.0481 78.9912 55.4753 78.9512 54.8222H80.4437C80.4837 55.2744 80.634 55.6461 80.9044 55.9375C81.1749 56.2289 81.5054 56.45 81.9161 56.5907C82.3268 56.7313 82.7675 56.8017 83.2383 56.8017C83.7892 56.8017 84.28 56.7112 84.7208 56.5304C85.1615 56.3495 85.5021 56.0983 85.7625 55.7667C86.0229 55.4452 86.1431 55.0633 86.1431 54.6212C86.1431 54.2193 86.0329 53.8978 85.8126 53.6466C85.5922 53.3954 85.3017 53.1944 84.9411 53.0437C84.5805 52.893 84.1899 52.7523 83.7692 52.6317L82.3068 52.2097C81.3752 51.9384 80.634 51.5566 80.0931 51.0642C79.5522 50.5618 79.2817 49.9087 79.2817 49.1048C79.2817 48.4316 79.462 47.8488 79.8226 47.3464C80.1832 46.844 80.674 46.4521 81.2851 46.1808C81.8961 45.8995 82.5872 45.7588 83.3485 45.7588C84.1098 45.7588 84.8009 45.8995 85.4019 46.1708C86.0029 46.4421 86.4737 46.8239 86.8243 47.2962C87.1748 47.7684 87.3652 48.311 87.3852 48.9139H85.9829L85.9628 48.9239Z" fill="white" />
                                        <path d="M99.6953 48.9239C99.6251 48.3311 99.3447 47.8689 98.8438 47.5474C98.343 47.2158 97.742 47.055 97.0108 47.055C96.4799 47.055 96.0191 47.1454 95.6285 47.3163C95.2378 47.4871 94.9273 47.7182 94.707 48.0196C94.4866 48.3211 94.3764 48.6627 94.3764 49.0445C94.3764 49.3661 94.4565 49.6374 94.6068 49.8685C94.757 50.0996 94.9574 50.2905 95.1978 50.4312C95.4382 50.5819 95.6886 50.7025 95.959 50.8029C96.2195 50.8934 96.4699 50.9738 96.6903 51.0341L97.9023 51.3656C98.2128 51.446 98.5634 51.5566 98.944 51.7073C99.3246 51.848 99.6953 52.0489 100.046 52.2901C100.396 52.5413 100.687 52.8528 100.917 53.2346C101.148 53.6164 101.258 54.0887 101.258 54.6514C101.258 55.2945 101.088 55.8772 100.757 56.3997C100.416 56.9222 99.9357 57.3342 99.2946 57.6457C98.6535 57.9572 97.8722 58.1079 96.9607 58.1079C96.1093 58.1079 95.3681 57.9673 94.747 57.696C94.126 57.4146 93.6352 57.0328 93.2846 56.5404C92.934 56.0481 92.7237 55.4753 92.6836 54.8222H94.1761C94.2161 55.2744 94.3664 55.6461 94.6368 55.9375C94.9073 56.2289 95.2378 56.45 95.6485 56.5907C96.0592 56.7313 96.4999 56.8017 96.9707 56.8017C97.5216 56.8017 98.0125 56.7112 98.4532 56.5304C98.8939 56.3495 99.2345 56.0983 99.4949 55.7667C99.7554 55.4452 99.8756 55.0633 99.8756 54.6212C99.8756 54.2193 99.7654 53.8978 99.545 53.6466C99.3246 53.3954 99.0342 53.1944 98.6736 53.0437C98.313 52.893 97.9223 52.7523 97.5016 52.6317L96.0392 52.2097C95.1076 51.9384 94.3664 51.5566 93.8255 51.0642C93.2846 50.5618 93.0141 49.9087 93.0141 49.1048C93.0141 48.4316 93.1944 47.8488 93.555 47.3464C93.9156 46.844 94.4065 46.4521 95.0175 46.1808C95.6285 45.8995 96.3196 45.7588 97.0809 45.7588C97.8422 45.7588 98.5333 45.8995 99.1343 46.1708C99.7353 46.4421 100.206 46.8239 100.557 47.2962C100.907 47.7684 101.098 48.311 101.118 48.9139H99.7153L99.6953 48.9239Z" fill="white" />
                                        <path d="M121.331 48.9239C121.261 48.3311 120.981 47.8689 120.48 47.5474C119.979 47.2158 119.378 47.055 118.647 47.055C118.116 47.055 117.655 47.1454 117.264 47.3163C116.874 47.4871 116.563 47.7182 116.343 48.0196C116.123 48.3211 116.012 48.6627 116.012 49.0445C116.012 49.3661 116.093 49.6374 116.243 49.8685C116.393 50.0996 116.593 50.2905 116.834 50.4312C117.074 50.5819 117.325 50.7025 117.595 50.8029C117.855 50.8934 118.106 50.9738 118.326 51.0341L119.538 51.3656C119.849 51.446 120.199 51.5566 120.58 51.7073C120.961 51.848 121.331 52.0489 121.682 52.2901C122.032 52.5413 122.323 52.8528 122.553 53.2346C122.784 53.6164 122.894 54.0887 122.894 54.6514C122.894 55.2945 122.724 55.8772 122.393 56.3997C122.052 56.9222 121.572 57.3342 120.921 57.6457C120.279 57.9572 119.498 58.1079 118.587 58.1079C117.735 58.1079 116.994 57.9673 116.373 57.696C115.752 57.4247 115.261 57.0328 114.911 56.5404C114.55 56.0481 114.35 55.4753 114.31 54.8222H115.802C115.842 55.2744 115.992 55.6461 116.263 55.9375C116.533 56.2289 116.864 56.45 117.274 56.5907C117.685 56.7313 118.126 56.8017 118.597 56.8017C119.148 56.8017 119.638 56.7112 120.079 56.5304C120.52 56.3495 120.86 56.0983 121.121 55.7667C121.381 55.4452 121.502 55.0633 121.502 54.6212C121.502 54.2193 121.391 53.8978 121.171 53.6466C120.951 53.3954 120.66 53.1944 120.3 53.0437C119.939 52.893 119.548 52.7523 119.128 52.6317L117.655 52.2097C116.724 51.9384 115.982 51.5566 115.441 51.0642C114.901 50.5618 114.63 49.9087 114.63 49.1048C114.63 48.4316 114.81 47.8488 115.171 47.3464C115.532 46.844 116.022 46.4521 116.643 46.1808C117.254 45.8995 117.946 45.7588 118.707 45.7588C119.468 45.7588 120.159 45.8995 120.76 46.1708C121.361 46.4421 121.832 46.8239 122.183 47.2962C122.533 47.7684 122.724 48.311 122.744 48.9139H121.341L121.331 48.9239Z" fill="white" />
                                        <path d="M138.601 51.9185C138.601 53.1846 138.371 54.2697 137.92 55.1942C137.469 56.1186 136.838 56.822 136.047 57.3244C135.255 57.8268 134.354 58.0679 133.332 58.0679C132.311 58.0679 131.409 57.8167 130.618 57.3244C129.826 56.822 129.205 56.1186 128.745 55.1942C128.294 54.2798 128.063 53.1846 128.063 51.9185C128.063 50.6524 128.294 49.5672 128.745 48.6428C129.195 47.7284 129.826 47.015 130.618 46.5126C131.409 46.0102 132.311 45.769 133.332 45.769C134.354 45.769 135.255 46.0202 136.047 46.5126C136.838 47.015 137.459 47.7184 137.92 48.6428C138.371 49.5572 138.601 50.6524 138.601 51.9185ZM137.209 51.9185C137.209 50.8835 137.038 50.0093 136.698 49.2959C136.357 48.5825 135.886 48.0399 135.306 47.6782C134.725 47.3165 134.063 47.1255 133.342 47.1255C132.621 47.1255 131.97 47.3064 131.379 47.6782C130.798 48.0399 130.327 48.5825 129.987 49.2959C129.646 50.0093 129.476 50.8835 129.476 51.9185C129.476 52.9534 129.646 53.8276 129.987 54.541C130.327 55.2545 130.798 55.7971 131.379 56.1588C131.96 56.5205 132.621 56.7114 133.342 56.7114C134.063 56.7114 134.715 56.5306 135.306 56.1588C135.886 55.7971 136.357 55.2545 136.698 54.541C137.038 53.8276 137.209 52.9534 137.209 51.9185Z" fill="white" />
                                        <path d="M144.31 57.897V45.9297H145.752V56.6108H151.291V57.897H144.3H144.31Z" fill="white" />
                                        <path d="M164.634 45.9395H166.077V53.8574C166.077 54.6713 165.886 55.4048 165.506 56.0479C165.125 56.6909 164.584 57.1933 163.893 57.5651C163.202 57.9369 162.381 58.1178 161.449 58.1178C160.517 58.1178 159.696 57.9369 159.005 57.5651C158.314 57.1933 157.773 56.6909 157.392 56.0479C157.012 55.4048 156.821 54.6813 156.821 53.8574V45.9395H158.264V53.7468C158.264 54.3296 158.394 54.8521 158.644 55.3043C158.905 55.7565 159.265 56.1182 159.746 56.3694C160.217 56.6307 160.788 56.7613 161.459 56.7613C162.13 56.7613 162.691 56.6307 163.172 56.3694C163.653 56.1081 164.013 55.7565 164.274 55.3043C164.534 54.8521 164.654 54.3296 164.654 53.7468V45.9395H164.634Z" fill="white" />
                                        <path d="M171.595 47.2256V45.9395H180.54V47.2256H176.793V57.9068H175.351V47.2256H171.605H171.595Z" fill="white" />
                                        <path d="M187.502 45.9395V57.9068H186.06V45.9395H187.502Z" fill="white" />
                                        <path d="M203.729 51.9185C203.729 53.1846 203.499 54.2697 203.048 55.1942C202.597 56.1186 201.966 56.822 201.175 57.3244C200.383 57.8268 199.482 58.0679 198.46 58.0679C197.438 58.0679 196.537 57.8167 195.746 57.3244C194.954 56.822 194.333 56.1186 193.873 55.1942C193.422 54.2798 193.191 53.1846 193.191 51.9185C193.191 50.6524 193.422 49.5672 193.873 48.6428C194.323 47.7284 194.954 47.015 195.746 46.5126C196.537 46.0102 197.438 45.769 198.46 45.769C199.482 45.769 200.383 46.0202 201.175 46.5126C201.966 47.015 202.587 47.7184 203.048 48.6428C203.499 49.5572 203.729 50.6524 203.729 51.9185ZM202.327 51.9185C202.327 50.8835 202.156 50.0093 201.816 49.2959C201.475 48.5825 201.004 48.0399 200.423 47.6782C199.842 47.3165 199.181 47.1255 198.46 47.1255C197.739 47.1255 197.088 47.3064 196.497 47.6782C195.916 48.0399 195.445 48.5825 195.105 49.2959C194.764 50.0093 194.594 50.8835 194.594 51.9185C194.594 52.9534 194.764 53.8276 195.105 54.541C195.445 55.2545 195.916 55.7971 196.497 56.1588C197.078 56.5205 197.739 56.7114 198.46 56.7114C199.181 56.7114 199.832 56.5306 200.423 56.1588C201.004 55.7971 201.475 55.2545 201.816 54.541C202.156 53.8276 202.327 52.9534 202.327 51.9185Z" fill="white" />
                                        <path d="M218.884 45.9395V57.9068H217.481L210.981 48.5118H210.86V57.9068H209.418V45.9395H210.82L217.341 55.3545H217.461V45.9395H218.884Z" fill="white" />
                                        <path d="M231.574 48.9239C231.504 48.3311 231.224 47.8689 230.723 47.5474C230.222 47.2158 229.621 47.055 228.89 47.055C228.359 47.055 227.898 47.1454 227.508 47.3163C227.117 47.4871 226.806 47.7182 226.586 48.0196C226.366 48.3211 226.256 48.6627 226.256 49.0445C226.256 49.3661 226.336 49.6374 226.486 49.8685C226.636 50.0996 226.837 50.2905 227.077 50.4312C227.317 50.5819 227.568 50.7025 227.838 50.8029C228.099 50.8934 228.349 50.9738 228.569 51.0341L229.781 51.3656C230.092 51.446 230.443 51.5566 230.823 51.7073C231.204 51.848 231.574 52.0489 231.925 52.2901C232.276 52.5413 232.566 52.8528 232.796 53.2346C233.027 53.6164 233.137 54.0887 233.137 54.6514C233.137 55.2945 232.967 55.8772 232.636 56.3997C232.296 56.9222 231.815 57.3342 231.164 57.6457C230.523 57.9572 229.741 58.1079 228.83 58.1079C227.978 58.1079 227.237 57.9673 226.616 57.696C225.995 57.4247 225.504 57.0328 225.154 56.5404C224.793 56.0481 224.593 55.4753 224.553 54.8222H226.045C226.085 55.2744 226.236 55.6461 226.506 55.9375C226.776 56.2289 227.107 56.45 227.518 56.5907C227.928 56.7313 228.369 56.8017 228.84 56.8017C229.391 56.8017 229.882 56.7112 230.322 56.5304C230.763 56.3495 231.104 56.0983 231.364 55.7667C231.624 55.4452 231.745 55.0633 231.745 54.6212C231.745 54.2193 231.635 53.8978 231.414 53.6466C231.194 53.3954 230.903 53.1944 230.543 53.0437C230.182 52.893 229.791 52.7523 229.371 52.6317L227.898 52.2097C226.967 51.9384 226.226 51.5566 225.685 51.0642C225.144 50.5618 224.873 49.9087 224.873 49.1048C224.873 48.4316 225.054 47.8488 225.414 47.3464C225.775 46.844 226.266 46.4521 226.887 46.1808C227.498 45.8995 228.189 45.7588 228.95 45.7588C229.711 45.7588 230.402 45.8995 231.003 46.1708C231.604 46.4421 232.075 46.8239 232.426 47.2962C232.776 47.7684 232.967 48.311 232.987 48.9139H231.584L231.574 48.9239Z" fill="white" />
                                    </svg>
                                </div>

                                {/* Main Heading */}
                                <div className="space-y-6">
                                    <h1 className="text-[27px] lg:text-[43px] font-bold leading-tight text-white">
                                        Strategic Support for<br />
                                        External Development
                                    </h1>

                                    <p className="text-white fontweight-normal text_leading pe-10">
                                        Coaching, pitch reviews, and hands-on guidance for developers and
                                        service providers ready to scale, solve challenges, or sharpen their strategy.
                                    </p>
                                </div>

                                {/* See How We Help Button */}
                                <div className="lg:pt-4 text_center_in_mobile">
                                    <a href="/business-solutions"
                                        type="button"
                                        className="border border-white text-white lg:px-12 lg:py-3 px-16 py-4 rounded-full font-bold text-[15px] tracking-wide hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all duration-200 h-[64px] inline-flex items-center justify-center"
                                    >
                                        See how we help
                                    </a>

                                </div>

                                {/* Bottom Section */}
                                <div className="lg:pt-10 space-y-6">
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-white">Let's talk through your goals.</h3>
                                        <p className="text-base text-white/90 leading-relaxed max-w-md">
                                            Confidential and no pressure—just focused, expert advice tailored to
                                            your goals. Let's talk about what's next.
                                        </p>
                                    </div>

                                    <div className="pt-4">
                                        <p className="text-sm font-extrabold tracking-widest uppercase text-[#C453FF]">
                                            Strategize. Elevate. Succeed.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-6@md col-12 flex flex-column gap-md@md gap-sm">
                            <div className="lg:ps-6">
                                {/* Form Header */}
                                <div className="mb-8">
                                    <h2 className="text-xl font-bold mb-2 text-white">Book Your Free Consultation</h2>
                                    <p className="text-sm text-white/80">
                                        We'll follow up with expert insight to help you move forward with clarity.
                                    </p>
                                </div>

                                {/* Form */}
                                <form
                                    onSubmit={handleSubmitPrimary(onSubmit)}
                                    className="space-y-6">
                                    {/* Name Fields */}
                                    <div className="grid  gap-xs items-start">
                                        <div className="col-6@md col-12">
                                            <label className="block text-sm font-bold mb-2">First Name *</label>
                                            <input
                                                type="text"
                                                {...registerPrimary("firstName", {
                                                    required: {
                                                        value: true,
                                                        message: "First Name required",
                                                    },
                                                })}
                                                className="w-full h-12 px-4 bg-white rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                            <p className="text-[#37DEDB] text-xs pt-1">
                                                {typeof errorsPrimary?.firstName?.message === "string" &&
                                                    errorsPrimary?.firstName?.message}
                                            </p>
                                        </div>
                                        <div className="col-6@md col-12">
                                            <label className="block text-sm font-bold mb-2">Last Name *</label>
                                            <input
                                                type="text"
                                                {...registerPrimary("lastName", {
                                                    required: 'Last Name required'
                                                })}
                                                autoComplete="off"

                                                className="w-full h-12 px-4 bg-white rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                            <p className="text-[#37DEDB] text-xs pt-1">
                                                {typeof errorsPrimary?.lastName?.message === "string" &&
                                                    errorsPrimary?.lastName?.message}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm font-bold mb-2">Email Address *</label>
                                        <input
                                            type="email"
                                            autoComplete="off"
                                            id="Email"
                                            {...registerPrimary("email", {
                                                required: 'Email required'
                                            })}
                                            className="w-full h-12 px-4 bg-white rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                        <p className="text-[#37DEDB] text-xs pt-1">
                                            {typeof errorsPrimary?.email?.message === "string" &&
                                                errorsPrimary?.email?.message}
                                        </p>
                                    </div>

                                    {/* Company */}
                                    <div>
                                        <label className="block text-sm font-bold mb-2">Company *</label>
                                        <input
                                            type="text"
                                            autoComplete="off"
                                            id="Company"
                                            {...registerPrimary("company", {
                                                required: 'Company required'
                                            })}
                                            className="w-full h-12 px-4 bg-white rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                        <p className="text-[#37DEDB] text-xs pt-1">
                                            {typeof errorsPrimary?.company?.message === "string" &&
                                                errorsPrimary?.company?.message}
                                        </p>
                                    </div>

                                    {/* Challenge */}
                                    <div>
                                        <label className="block text-sm font-bold mb-2">Tell us about your challenge *</label>
                                        <textarea
                                            rows={4}
                                            {...registerPrimary("message", {
                                                required: 'Message required'
                                            })}
                                            autoComplete="off"
                                            placeholder="What specific business challenge would you like help with?"
                                            className="w-full px-4 py-3 bg-white rounded-lg border border-gray-300 text-gray-900 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                        <p className="text-[#37DEDB] text-xs pt-1">
                                            {typeof errorsPrimary?.message?.message === "string" &&
                                                errorsPrimary?.message?.message}
                                        </p>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            className="w-full sm:w-auto bg-[#C453FF] text-white px-8 py-3 rounded-full font-bold text-sm tracking-wide  focus:outline-none focus:ring-0 transition-all duration-200 hover:shadow-[0_4px_20px_rgba(28,17,83,0.67)] h-[64px]  md:w-[302px] "
                                            aria-label="Book free consultation"
                                        >
                                            <span className="text-[15px] font-inter font-extrabold leading-[17px] text-center  text-[#f7f7f7] ">
                                                {loader ? <div role="status">
                                                    <svg aria-hidden="true" className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-white" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                                                    </svg>
                                                    <span className="sr-only">Loading...</span>
                                                </div> : 'Book a free consultation'}
                                            </span>
                                        </button>
                                        {/* <button
                                            type="submit"
                                            aria-label="Book free consultation"
                                            className="w-full sm:w-auto bg-[#C453FF] text-white px-8 py-3 rounded-full font-bold text-sm tracking-wide transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-purple-300"
                                        >
                                            Book a free consultation
                                        </button> */}
                                    </div>

                                    {/* Footer Text */}
                                    <div className="pt-4 text-sm text-white/70">
                                        <p>
                                            <span className="text-white">✓</span>{" "}
                                            100% confidential • No obligation • Fast response
                                        </p>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section>
                <div className="padding-x-lg@md  infoPanel padding-y-xl">
                    <div className="grid gap-md items-center mobile_pad">
                        <div className="col-7@md col-12 flex flex-column gap-md@md gap-sm">
                            <h3>Meet Our<br /> <span>Founders</span></h3>
                            <p className="subHeading">Sam Carlisle &amp; Chris Wren</p>
                            <p className="subText2 padding-right-xl@md">We are incredibly fortunate to have founders with over 40 years
                                combined experience with
                                big names behind them - Xbox Games Studios and Electronic Arts. </p>
                            <p className="padding-right-xl@md">Together, Chris and Sam have been leaders in the <a
                                href="https://xdsummit.com/advisory-committee/" target="_blank">XDS Advisory Committee</a> for over a
                                decade. Their efforts have been invaluable in
                                advocating for and advancing the practice of external development, and helping to professionalize the
                                practice. Their contributions to the XDS event and speaking engagements at global industry events has been
                                instrumental in spreading awareness and knowledge.</p>

                        </div>

                        <div
                            className="col-5@md col-12 padding-top-lg padding-top-xl@lg flex gap-lg gap-xl@xl flex-column@md flex-row@lg items-center justify-center">

                            <div className="">
                                <img className="circleImage2" src="/sam-carlisle-circle.png" alt="Sam Carlisle" />
                            </div>
                            <div>
                                <img className="circleImage2" src="/chris-wren-circle.png" alt="Chris Wren" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            <section className="advisoryPanel padding-y-xl bg-[#9B53D2]">
                <div className="padding-x-lg@md container text-center  max-width-md">
                    <h4>XDS Spark <span>Advisory Board</span></h4>
                    <p className="padding-top-md">XDS Spark's esteemed Advisory Board is composed of highly experienced industry
                        leaders who share our passion for driving external development through collaboration. Their unwavering
                        dedication and expertise has enabled us to assemble an exceptional team.</p>

                </div>
                <div className="carousel__wrapper order-2 overflow-hidden container mt-16">
                    <ol className="carousel__list">
                        <li className="carousel__item">
                            <div className="flex flex-column gap-sm justify-center items-center">

                                <img className="circleImage3" src="/andreea-enache_BW_1.png" alt="Andrea Enache" />
                                <a href="https://www.linkedin.com/in/andreeaenache/" target="_blank">
                                    <div className="padding-top-sm">
                                        <p className="name">ANDREA ENACHE</p>
                                        <p className="title padding-top-xxs">Chief Revenue Officer at Amber</p>
                                        {/* <p className="name">SAM CARLISLE</p>
                                        <p className="title padding-top-xxs">Chair, XDS Spark Advisory <br />Board & Co-Founder,</p>
                                        <p className="title">XDS Spark</p> */}
                                    </div>
                                </a>
                            </div>
                        </li>
                        <li className="carousel__item">
                            <div className="flex flex-column gap-sm justify-center items-center">

                                <img className="circleImage3" src="/philip-wolf-adivosory-circle.png" alt="Philip Wolf" />
                                <a href="https://www.linkedin.com/in/philcwm/" target="_blank">
                                    <div className="padding-top-sm">
                                        <p className="name">PHILLIP WOLF</p>
                                        <p className="title padding-top-xxs">Chief Executive Officer </p>
                                        <p className="title">& Co-Founder, swyvl global</p>
                                    </div>
                                </a>
                            </div>
                        </li>

                        <li className="carousel__item">
                            <div className="flex flex-column gap-sm justify-center items-center">

                                <img className="circleImage3" src="/paul-lipson-advisory-circle.png" alt="Paul Lipson" />
                                <a href="https://www.linkedin.com/in/plipson/" target="_blank">
                                    <div className="padding-top-sm">
                                        <p className="name">Paul Lipson</p>
                                        <p className="title padding-top-xxs">SVP, Interactive Worldwide,</p>
                                        <p className="title">Formosa Group</p>
                                    </div>
                                </a>
                            </div>
                        </li>

                        <li className="carousel__item">
                            <div className="flex flex-column gap-sm justify-center items-center">

                                <img className="circleImage3" src="/chris-edwards-advisory-circle.png" alt="Chris Edwards" />
                                <a href="https://www.linkedin.com/in/chris-edwards-0444671/" target="_blank">
                                    <div className="padding-top-sm">
                                        <p className="name">Chris Edwards</p>
                                        <p className="title padding-top-xxs">CEO & Co-Founder,</p>
                                        <p className="title">The Third Floor</p>
                                    </div>
                                </a>
                            </div>
                        </li>

                        <li className="carousel__item">
                            <div className="flex flex-column gap-sm justify-center items-center">

                                <img className="circleImage3" src="/lauren-freeman-circle.png" alt="Chris Edwards" />
                                <a href="https://www.linkedin.com/in/lauren-f-b480716/" target="_blank">
                                    <div className="padding-top-sm">
                                        <p className="name">Lauren Freeman</p>
                                        <p className="title padding-top-xxs">Head of Developer Advocacy,</p>
                                        <p className="title">Roblox</p>
                                    </div>
                                </a>
                            </div>
                        </li>
                        <li className="carousel__item">
                            <div className="flex flex-column gap-sm justify-center items-center">

                                <img className="circleImage3" src="/Eric_williams_circle 1.png" alt="Andrea Enache" />
                                <a href="https://www.linkedin.com/in/ericw1/" target="_blank">
                                    <div className="padding-top-sm">
                                        <p className="name">ERIC WILLIAMS</p>
                                        <p className="title padding-top-xxs">VP of Business Development,</p>
                                        <p className="title">Technicolor Games</p>
                                    </div>
                                </a>
                            </div>
                        </li>
                    </ol>
                </div>
            </section>
            <section className="lg:container lg:px-0 px-3">
                <div className="padding-x-lg@md lg:py-20 py-8">
                    <div className="grid gap-xl@md gap-lg items-start">
                        <div className="col-6@md col-12 flex flex-column gap-md@md gap-sm">
                            <div>
                                <h5 className="now_available_text mb-2">NOW AVAILABLE! </h5>
                                <h4 className="gameindustry">2025 Insights on External Development  for the Video Game Industry</h4>
                            </div>
                            <div className="infoPanel ">
                                <p className="padding-right-xl@md">This invaluable, freely available resource showcases trends from across the globe, and this year we examine the impact <span>Artificial Intelligence</span> has on external development, now and into the future.
                                </p>
                                <div className="padding-top-md">
                                    <a href="https://mailchi.mp/xds-spark.com/insightsreport25"
                                        target="_blank" className="btn btn--subtle">DOWNLOAD 2025 REPORT</a>
                                </div>
                            </div>
                        </div>

                        <div className="col-6@md col-12 padding-top-lg padding-top-0@md">
                            <div className="infoPanel ">
                                <Image src="/xds24_summit.png?1" width={383} height={90} alt="" />
                                <p className="mb-7 mt-6 font-semibold">September  2-5, 2025 |  Vancouver, Canada</p>
                                <p className="">Since 2013, XDS is the only annual, international games industry event with the primary focus on advancing external development. XDS 2025 will once again welcome hundreds of professionals from around the world for an unforgettable experience packed full of valuable networking, knowledge sharing, and surprise social events! <Link href="https://xdsummit.com" target="_blank" className="color_pink_light_2">Learn more</Link>  </p>

                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <footer className="bg-black footerPanel">
                <section className="padding-x-lg@md  footerPanel padding-top-xl padding-bottom-lg mobile_pad">
                    <div>
                        <svg className="xdsLogo width-20%@md width-50% " xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 241.17 33.78">
                            <defs>
                                <style>
                                    {`.cls-a {
                    fill: var(--color-white);
                    stroke-width: 0px;
                }`}
                                </style>
                            </defs>
                            <g id="Layer_1-2">
                                <path className="cls-a" d="m201.25,18.35c-.93-.16-2.17.19-2.17.19l8.81,14.99h2.36l-9-15.17Z" />
                                <path className="cls-a"
                                    d="m124.68,10.25c-.21-5.41-4.14-8.12-9.78-8.12-3.46,0-8.37,1.51-8.37,6.74s5.21,5.95,10.38,7.05c5.21,1.11,10.42,2.48,10.42,8.79s-6.07,8.92-10.72,8.92c-7.13,0-12.94-3.06-12.86-11.23h1.88c-.39,6.92,4.96,9.54,10.98,9.54,3.67,0,8.84-1.73,8.84-7.23s-5.21-6.3-10.42-7.41c-5.17-1.11-10.38-2.4-10.38-8.43S110.07.45,114.89.45c6.37,0,11.36,2.84,11.66,9.81h-1.88Z" />
                                <path className="cls-a"
                                    d="m134.18,1.68h12.99c3.46,0,8.89,1.29,8.89,8.87,0,5.55-3.5,8.7-9.57,8.7h-10.42v14.11h-1.88V1.68Zm1.88,15.89h10.72c5.51,0,7.39-3.77,7.39-7.05,0-2.35-1.03-7.14-7.13-7.14h-10.98v14.2Z" />
                                <path className="cls-a"
                                    d="m168.93,1.68l12.05,31.68h-2.01l-3.85-10.16h-14.61l-3.89,10.16h-2.01l12.26-31.68h2.05Zm5.6,19.83l-6.54-17.93h-.08l-6.79,17.93h13.41Z" />
                                <path className="cls-a"
                                    d="m200.89,18.94c.78-.02-1.55.58,2.29-.37s5.81-4.47,5.81-8.73c0-6.12-4.31-8.16-9.65-8.16h-12.73v31.68h1.88v-14.42h10.85c.18,0,.85.02,1.55,0Zm-12.4-15.57h10.85c4.1,0,7.78,1.82,7.78,6.61,0,5.1-3.33,7.28-7.78,7.28h-10.85V3.37Z" />
                                <path className="cls-a"
                                    d="m216.82,1.68h1.88v18.24L237.88,1.68h2.44l-13.93,13.18,14.78,18.5h-2.35l-13.8-17.17-6.32,5.99v11.18h-1.88V1.68Z" />
                                <path className="cls-a"
                                    d="m36.81.45h16.61c10.95,0,14.82,8.1,14.82,16.38,0,10.08-5.34,16.48-16.8,16.48h-14.64V.45Zm10.13,24.44h3.96c6.31,0,7.23-5.11,7.23-8.19,0-2.07-.64-7.82-7.96-7.82h-3.22v16.02Z" />
                                <path className="cls-a"
                                    d="m79.35,22.18c0,.81.14,1.54.37,2.12.73,1.94,2.93,2.35,4.8,2.35,1.65,0,4.16-.54,4.16-2.94,0-1.67-1.42-2.12-7.05-3.7-5.17-1.45-11.07-2.85-11.07-9.35,0-7.45,6.45-10.66,13.18-10.66,7.09,0,13.36,2.66,13.64,10.52h-9.52c.18-1.22-.37-2.03-1.19-2.57-.82-.59-1.97-.81-2.97-.81-1.37,0-3.62.36-3.62,2.17.18,2.3,4.85,2.8,9.47,4.07,4.62,1.26,9.2,3.39,9.2,9.3,0,8.4-7.82,11.11-15.1,11.11-3.71,0-14.28-1.31-14.37-11.61h10.07Z" />
                                <polygon className="cls-a"
                                    points="23.43 .45 0 33.31 11.47 33.31 17.36 23.73 22.89 33.31 35.08 33.31 23.35 15.91 33.89 .45 23.43 .45" />
                                <polygon className="cls-a" points="11.65 .45 16.68 7.47 11.14 15.01 1.2 .45 11.65 .45" />
                            </g>
                        </svg>
                    </div>
                    <div className="grid items-start gap-xl padding-y-lg">
                        <div className="col-12 col-6@md">
                            <div className="flex flex-column gap-sm">
                                <h3>Be A Part of Spark</h3>
                                <p className="padding-right-xl">We will continually offer exciting opportunities for you to reach new audiences and increase brand visibility.</p>
                                <p className="padding-right-xl">Are you interested in future <span>sponsorship opportunities</span> with XDS Spark?</p>
                                <a href="mailto:info@xds-spark.com?subject=XDS Spark - Sponsorship Enquiry" target="_blank">Contact us!</a>
                            </div>
                        </div>
                        <div className="col-12 col-3@md">
                            <div className="flex flex-column gap-lg">
                                <div className="flex flex-column gap-xs">
                                    <h3>Questions?</h3>
                                    <a href="mailto:info@xds-spark.com?subject=XDS Spark - General Enquiry"
                                        target="_blank">Email us!</a>
                                </div>
                                <div className="flex flex-column gap-xs">
                                    <h3>Newsletter</h3>
                                    <p>Receive updates right to your inbox</p>
                                    <a href="https://xds-spark.us10.list-manage.com/subscribe?u=0827e18cb56fdfc5f6e1347af&id=eec362cf4a"
                                        target="_blank">Subscribe</a>
                                </div>
                                <div className="flex flex-column gap-xs">
                                    <h3>Connect With Us</h3>
                                    <a href="https://www.linkedin.com/company/xds-spark" target="_blank">Linkedin</a>
                                </div>
                            </div>
                        </div>
                        <div className="col-12 col-3@md">
                            <div className="flex flex-column gap-md">
                                <div className="flex flex-column gap-xs">
                                    <h3>External Development Summit (XDS)</h3>
                                    <a href="https://xdsummit.com" target="_blank">Website</a>
                                </div>
                                <div className="flex flex-column gap-xs">
                                    <h3>XDS Industry Insights Report</h3>
                                    <a href="https://mailchi.mp/xds-spark.com/insightsreport25"
                                        target="_blank">Download</a>
                                </div>

                            </div>
                        </div>
                    </div>
                    <div className="disclaimer flex gap-sm justify-center items-center margin-top-md">
                        <p>&copy; XDS Spark {new Date().getFullYear()} </p>
                        <a href="/XDS Spark Privacy Policy.pdf" target="_blank">Privacy
                            Policy</a>
                        <a href="/XDS Spark Terms and Conditions of Use.pdf" target="_blank">Website Terms of Use</a>

                    </div>
                </section>

            </footer>
            {thnksPopup &&
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} >
                    <div className="relative w-[90%] max-w-md rounded-xl bg-white p-10 text-center shadow-lg">
                        <button
                            className="absolute right-3 top-3 text-gray-400 hover:text-black text-xl"
                            onClick={() => setThanksPopup(false)}
                        >
                            ×
                        </button>
                        <h2 className="text-2xl font-bold text-purple-800 mb-6">Thanks for your interest!</h2>
                        <p className="text-gray-700 mb-6">
                            We’ll review your submission and get back to you within one business day.
                        </p>
                        <p className="mt-6 text-sm">
                            Questions? <br />
                            Reach out to:{" "}
                            <a href="mailto:carla@xds-spark.com" className="text-purple-600 font-semibold">
                                carla@xds-spark.com
                            </a>
                        </p>
                    </div>
                </div>
            }
        </>
    )
}
export default XdsMainHome;