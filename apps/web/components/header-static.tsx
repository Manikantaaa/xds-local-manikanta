"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useEffect, useState } from 'react';
const HeaderStatic = () => {
    const [isSticky, setIsSticky] = useState(false);
    const [isFallback, setIsFallback] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const router = useRouter();
    useEffect(() => {
        const hero = document.getElementById('firstsection');

        if (!hero) {
            // If not landing page (no #firstsection), show black header always
            setIsFallback(true);
            return;
        }

        const handleScroll = () => {
            const heroBottom = hero.getBoundingClientRect().bottom;
            setIsSticky(heroBottom <= 0);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };
    return (
        <>
            <div className="" >
                {/* Header Navigation */}
                <header
                    className={`w-full z-50 transition-all duration-300 ease-in-out ${isFallback
                        ? 'fixed top-0 bg-black shadow-md' // Always show for non-landing pages
                        : isSticky
                            ? 'fixed top-0 bg-black shadow-md'
                            : 'absolute top-[-10px] bg-transparent mobile_bg'
                        }`}
                >
                    <div className= {`container mx-auto home_container ${isFallback ? ''    : isSticky ? '' : 'mt-[10px]' }`}>
                        <div className="flex items-center justify-between h-20 lg:h-20">
                            {/* Logo */}
                            <div className="flex-shrink-0">
                                <Link href="/">
                                <div className="w-40 lg:w-48 h-6 lg:h-7">
                                    <svg xmlns="http://www.w3.org/2000/svg"  className="2xl:h-[36px] 2xl:w-[220px] h-[24px] w-[159px]" viewBox="0 0 159 24" fill="none">
                                        <g clipPath="url(#clip0_42_1441)">
                                            <path d="M132.59 13.1036C132.829 13.0512 133.178 12.9698 133.69 12.8534C136.268 12.254 137.647 9.85661 137.647 6.97622C137.647 2.83893 134.708 1.45984 131.112 1.45984H122.535V22.8678H123.792V13.092H131.066L136.867 22.99H138.427L132.59 13.1094V13.1036ZM123.734 11.9514V2.59454H131.048C133.807 2.59454 136.326 3.85144 136.326 7.03441C136.326 10.4501 134.045 11.9514 131.048 11.9514H123.734Z" fill="white" />
                                            <path d="M81.9307 7.68032C81.8143 4.13075 79.1958 2.38506 75.5298 2.38506C73.2604 2.38506 70.06 3.37429 70.06 6.80748C70.06 10.2407 73.4932 10.7062 76.8682 11.4045C80.3014 12.1027 83.6764 13.0338 83.6764 17.1652C83.6764 21.2967 79.7195 22.9842 76.6354 22.9842C71.9802 22.9842 68.1397 20.9476 68.1979 15.6523H69.4199C69.1871 20.1911 72.6785 21.9368 76.6354 21.9368C79.0212 21.9368 82.4544 20.773 82.4544 17.2234C82.4544 13.6739 79.0212 13.092 75.6462 12.3937C72.2712 11.6954 68.838 10.8226 68.838 6.86567C68.838 2.90877 72.3876 1.33765 75.5298 1.33765C79.7195 1.33765 82.9781 3.19972 83.1527 7.73851H81.9307V7.68032Z" fill="white" />
                                            <path d="M87.0918 1.4541H95.8493C98.1886 1.4541 101.849 2.35604 101.849 7.45346C101.849 11.1718 99.5095 13.3306 95.3722 13.3306H88.3545V22.8679H87.0976V1.4541H87.0918ZM88.3487 12.1901H95.6049C99.3233 12.1901 100.58 9.67049 100.58 7.45346C100.58 5.89397 99.8586 2.65281 95.7795 2.65281H88.3429V12.1901H88.3487Z" fill="white" />
                                            <path d="M111.142 1.4541L119.3 22.8621H117.921L115.343 16.0248H105.509L102.873 22.8621H101.494L109.763 1.4541H111.142ZM114.918 14.8261L110.479 2.711H110.42L105.864 14.8261H114.918Z" fill="white" />
                                            <path d="M142.384 1.4541H143.641V13.7496L156.6 1.4541H158.217L148.802 10.328L158.758 22.8039H157.199L147.906 11.23L143.647 15.2509V22.8097H142.39V1.4541H142.384Z" fill="white" />
                                            <path d="M24.3232 1.27942H35.2047C42.362 1.27942 44.9224 6.57468 44.9224 12.0445C44.9224 18.6781 41.431 22.8096 33.9245 22.8096H24.3232V1.27942ZM30.9569 17.2816H33.5754C37.7069 17.2816 38.2888 13.9066 38.2888 11.9281C38.2888 10.5898 37.8814 6.80744 33.0517 6.80744H30.9569V17.2816Z" fill="white" />
                                            <path d="M52.1956 15.5359C52.1956 16.0597 52.3119 16.5252 52.4283 16.9325C52.8938 18.2127 54.3486 18.4454 55.5706 18.4454C56.618 18.4454 58.3055 18.0963 58.3055 16.5252C58.3055 15.4196 57.3744 15.1286 53.7085 14.0812C50.3335 13.1502 46.4348 12.2191 46.4348 7.97129C46.4348 3.08335 50.6826 0.988525 55.0468 0.988525C59.702 0.988525 63.7753 2.73422 63.9499 7.9131H57.7818C57.8981 7.09844 57.549 6.57474 57.0253 6.2256C56.5016 5.81827 55.7451 5.6437 55.0468 5.6437C54.1158 5.6437 52.6611 5.87646 52.6611 7.04025C52.7774 8.55319 55.8615 8.84413 58.8874 9.71698C61.9132 10.5316 64.8809 11.9282 64.8809 15.8269C64.8809 21.3549 59.7602 23.1006 54.9887 23.1006C52.6029 23.1006 45.6783 22.286 45.6201 15.5359H52.1956Z" fill="white" />
                                            <path d="M15.5945 1.27942L0.232422 22.8096H7.73889L11.5794 16.5251L15.2454 22.8096H23.2174L15.5363 11.4044L22.4609 1.27942H15.5945Z" fill="white" />
                                            <path d="M7.85507 1.27942L11.1719 5.8764L7.50593 10.8225L1.04688 1.27942H7.85507Z" fill="#DE268E" />
                                        </g>
                                        <defs>
                                            <clipPath id="clip0_42_1441">
                                                <rect width="158.526" height="22.1121" fill="white" transform="translate(0.232422 0.988525)" />
                                            </clipPath>
                                        </defs>
                                    </svg>
                                </div>
                                </Link>
                            </div>

                            {/* Desktop Navigation */}
                            <nav className={`${menuOpen ? 'flex static_menu_responsive' : 'hidden'
                                } flex-col lg:flex lg:flex-row items-center lg:items-center lg:space-x-8  lg:bg-transparent w-full lg:w-auto mt-4 lg:mt-0`}
                            >
                                <a href="/business-solutions" className="home_menu_screen_big text-white text-sm 2xl:text-base font-medium tracking-wider hover:text-gray-300 transition-colors">
                                    Consulting
                                </a>
                                <a href="mailto:info@xds-spark.com?subject=XDS Spark - General Enquiry" className="home_menu_screen_big text-white text-sm 2xl:text-base  font-medium tracking-wider hover:text-gray-300 transition-colors">
                                    Contact
                                </a>
                                <a href="https://xds-spark.us10.list-manage.com/subscribe?u=0827e18cb56fdfc5f6e1347af&id=eec362cf4a" className="home_menu_screen_big text-white text-sm 2xl:text-base  font-medium tracking-wider hover:text-gray-300 transition-colors" target="_blank">
                                    Newsletter
                                </a>

                                {/* Divider */}
                                <div className="w-px h-6 bg-white opacity-30 lg:block hidden"></div>
                                <div className="lg:hidden block home_hidden"><svg xmlns="http://www.w3.org/2000/svg" width="222" height="1" viewBox="0 0 222 1" fill="none">
                                    <path d="M222 0.491731L0.500091 0.491693" stroke="#5D5D5D" />
                                </svg></div>

                                <a href="/signup-options" className="home_menu_screen_big text-white text-sm 2xl:text-base  font-medium tracking-wider hover:text-gray-300 transition-colors">
                                    SIGN UP
                                </a>
                                <div className="login_btn_mobile">
                                    <a href="/login"

                                        className={`home_menu_screen_big text-white text-sm 2xl:text-base  px-6 py-3 rounded-full font-semibold tracking-wider uppercase transition-colors duration-200 ${isSticky
                                            ? 'bg-[#de268e] hover:bg-[#c41e7a]'
                                            : isFallback ? 'bg-[#de268e] hover:bg-[#c41e7a]'
                                                : 'border border-white'
                                            }`}
                                    >
                                        LOGIN
                                    </a>
                                    {/*  */}
                                </div>
                            </nav>

                            {/* Desktop Login Button */}


                            {/* Mobile Menu Button */}
                            {/* <button
                                type="button"
                                onClick={toggleMenu}
                                className="lg:hidden flex items-center justify-center w-10 h-10 text-white hover:text-gray-300 transition-colors home_btn_menu"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button> */}
                            <div className={`home_hidden ${menuOpen ? "mchange" : ""}`}  onClick={toggleMenu}>
                                <div className="mbar1"></div>
                                <div className="mbar2"></div>
                                <div className="mbar3"></div>
                            </div>
                        </div>

                        {/* Mobile Navigation Menu */}

                    </div >
                </header >
            </div >
        </>
    );
}
export default HeaderStatic;