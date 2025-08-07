"use client";
import React, { useEffect } from "react";
import "../../public/css/staticpage.css";
import HeaderStatic from "@/components/header-static";
import { usePathname } from "next/navigation";
const SignupOptions = () => {

     const currentUrl = usePathname();
      useEffect(() => {
        if (currentUrl.includes('/signup-options')) {
          document.title = "XDS Spark - Signup Options";
          return;
        }
      }, [currentUrl]);
    return (
        <>
            <HeaderStatic />
            <div className=" text-white items-center" style={{
                background: 'linear-gradient(0deg, #391281 -4.77%, #4E249D 1.3%, #4F22A6 7.36%, #541EC2 13.77%, #571BD4 48.15%, #BF2584 89.39%)'
            }}>
                <div className="container mx-auto px-4 py-20 lg:py-28">

                    {/* Header Section */}
                    <div className="text-center mb-12 lg:mb-16">
                        <h1 className="text-3xl lg:text-[42px]  font-extrabold lg:leading-[60px] tracking-wide">
                           Ready to grow your business?   <br/> You’re in the right place.<br />
                        </h1>

                        <p className="text-lg lg:text-xl font-normal tracking-wide mt-8 mb-4">
                            Choose your role below and start building your presence on Spark.
                        </p>

                        <div className="max-w-2xl mx-auto">
                            <p className="text-[16px] leading-relaxed font-[300]">
                                <span className="font-bold">Tip:</span>  If you’re both a buyer and a service provider, choose Service Provider — it lets <br/> you promote your company and also explore other partners.
                            </p>
                        </div>
                    </div>

                    {/* Pricing Cards Grid - 4 cards in a row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8 mb-16 lg:mb-20 max-w-7xl mx-auto">

                        {/* Buyer Foundational */}
                        <div className="bg-white rounded-lg  shadow-xl  transition-all duration-200 hover:shadow-[0_4px_20px_rgba(28,17,83,0.67)] hover:-translate-y-2">
                            {/* Header */}
                            <div className="bg-[#218dab] px-6 py-6 text-center  rounded-tl-lg rounded-tr-lg border border-[#218dab] mt-[-2px]">
                                <h3 className="text-white text-2xl font-extrabold">Buyer</h3>
                            </div>

                            {/* Recommended Badge */}
                            <div className="bg-[#e5cbf3] px-6 py-1 text-center">
                                <span className="text-[#9b53d2] text-xs font-bold tracking-[0.242px]">MOST POPULAR</span>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <div className="mb-6">
                                    <h4 className="text-[#000000] text-[21px] font-bold mb-2">Foundational</h4>
                                    <p className="text-[#000000] text-[13px] font-bold ">All features at NO COST!</p>
                                </div>

                                <div className="mb-8">
                                    <div className="text-black">
                                        <span className="text-2xl font-extrabold">$0 USD</span><br />
                                        <span className="text-sm tracking-wide">/year for one user</span><br />
                                        <span className="text-xs italic text-[#939598]">&nbsp;</span>
                                    </div>
                                </div>
                                <div className="flex flex-col lg:flex-col-reverse">
                                    <div className="lg:mt-8 lg:mb-0 mb-6">
                                        <p className="text-black text-sm leading-relaxed">
                                            Save time. Work with confidence. This plan gives you all-access to vetted service providers, tools to help shortlist teams, and more.
                                        </p>
                                    </div>

                                    <a href="registration?userType=foundational"

                                        className="text-center w-full bg-[#3f9fba] hover:bg-[#368a9f] text-white px-4 py-3.5 rounded-full font-bold text-sm transition-colors duration-200 h-[50px] flex items-center justify-center"
                                    >
                                        Find partners at no cost
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Buyer Premium */}
                        <div className="bg-white rounded-lg shadow-xl  transition-all duration-200 hover:shadow-[0_4px_20px_rgba(28,17,83,0.67)] hover:-translate-y-2">
                            {/* Header */}
                            <div className="bg-[#218dab] px-6 py-6 text-center  rounded-tl-lg rounded-tr-lg border border-[#218dab] mt-[-2px]">
                                <h3 className="text-white text-2xl font-extrabold">Buyer</h3>
                            </div>

                            {/* Empty space for alignment */}
                            <div className="h-8"></div>

                            {/* Content */}
                            <div className="p-6">
                                <div className="mb-6">
                                    <h4 className="text-[#000000] text-[21px] font-bold mb-2">Premium</h4>
                                    <p className="text-[#000000] text-[13px] font-bold ">Bring your team!</p>
                                </div>

                                <div className="mb-8">
                                    <div className="text-black">
                                        <span className="text-2xl font-extrabold">$88 USD</span><br />
                                        <span className="text-sm">/billed annually, includes 5 users</span><br />
                                        <span className="text-sm italic text-[#939598]">Or $99/month if billed monthly</span>
                                    </div>
                                </div>
                                <div className="flex flex-col lg:flex-col-reverse">
                                    <div className="lg:mt-8 lg:mb-0 mb-6">
                                        <p className="text-black text-sm leading-relaxed">
                                            Built for studios and enterprises who want to collaborate internally while managing external partnerships.
                                        </p>
                                    </div>

                                    <a href="registration"
                                        type="button"
                                        className="text-center w-full bg-[#3f9fba] hover:bg-[#368a9f] text-white px-4 py-3.5 rounded-full font-bold text-sm transition-colors duration-200 h-[50px] flex items-center justify-center"
                                    >
                                        Get started
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Service Provider Premium */}
                        <div className="bg-white rounded-lg shadow-xl  transition-all duration-200 hover:shadow-[0_4px_20px_rgba(28,17,83,0.67)] hover:-translate-y-2">
                            {/* Header */}
                            <div className="bg-[#bf5af3] px-6 py-6 text-center rounded-tl-lg rounded-tr-lg border border-[#bf5af3] mt-[-2px]">
                                <h3 className="text-white text-2xl font-extrabold">Service Provider</h3>
                            </div>

                            {/* Recommended Badge */}
                            <div className="bg-[#e5cbf3] px-6 py-1 text-center">
                                <span className="text-[#9b53d2] text-xs font-bold tracking-[0.242px]">RECOMMENDED</span>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <div className="mb-6">
                                    <h4 className="text-[#000000] text-[21px] font-bold mb-2">Premium</h4>
                                    <p className="text-[#000000] text-[13px] font-bold ">Looking for top exposure?</p>
                                </div>

                                <div className="mb-8">
                                    <div className="text-black">
                                        <span className="text-2xl font-extrabold">$88 USD</span><br />
                                        <span className="text-sm">/billed annually, includes 5 users</span><br />
                                        <span className="text-sm italic text-[#939598]">Or $99/month if billed monthly</span>
                                    </div>
                                </div>
                                <div className="flex flex-col lg:flex-col-reverse">
                                    <div className="lg:mt-8 lg:mb-0 mb-6">
                                        <p className="text-black text-sm leading-relaxed">
                                            Premium for rich functionality, advanced profile options, visibility boosts.
                                        </p>
                                    </div>

                                    <a href="registration"
                                        className="text-center w-full bg-[#bf5af3] hover:bg-[#a94de6] text-white px-4 py-3.5 rounded-full font-bold text-sm transition-colors duration-200 h-[50px] flex items-center justify-center"
                                    >
                                        Get started
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Service Provider Foundational */}
                        <div className="bg-white rounded-lg shadow-xl transition-all duration-200 hover:shadow-[0_4px_20px_rgba(28,17,83,0.67)] hover:-translate-y-2">
                            {/* Header */}
                            <div className="bg-[#bf5af3] px-6 py-6 text-center rounded-tl-lg rounded-tr-lg border border-[#bf5af3] mt-[-2px]">
                                <h3 className="text-white text-2xl font-extrabold">Service Provider</h3>
                            </div>

                            {/* Empty space for alignment */}
                            <div className="h-8"></div>

                            {/* Content */}
                            <div className="p-6">
                                <div className="mb-8">
                                    <h4 className="text-[#000000] text-[21px] font-bold mb-2">Foundational</h4>
                                    <p className="text-[#000000] text-[13px] font-bold ">Start building visibility at NO COST!</p>
                                </div>

                                <div className="mb-6">
                                    <div className="text-black">
                                        <span className="text-2xl font-extrabold">$0 USD</span><br />
                                        <span className="text-sm tracking-wide">/year for one user</span><br />
                                        <span className="text-sm italic text-[#939598]">&nbsp;</span>
                                    </div>
                                </div>
                                <div className="flex flex-col lg:flex-col-reverse">
                                    <div className="lg:mt-8 lg:mb-0 mb-6">
                                        <p className="text-black text-sm leading-relaxed">
                                            Be discoverable by global buyers looking for vetted external partners.
                                        </p>
                                    </div>

                                    <a href="registration?userType=foundational"
                                        className="text-center w-full bg-[#bf5af3] hover:bg-[#a94de6] text-white px-4 py-3.5 rounded-full font-bold text-sm transition-colors duration-200 h-[50px] flex items-center justify-center"
                                    >
                                        Be visible at no cost
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom CTA Section */}
                    <div className="text-center">
                        <h2 className="text-2xl lg:text-3xl font-extrabold mb-4 tracking-wide">
                            Still exploring?
                        </h2>

                        <p className="text-lg mb-8 tracking-wide">
                            Learn more about how Spark supports external development.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <a href="/"

                                className="bg-white hover:bg-gray-100 text-[#4c2594] px-8 py-3.5 rounded-full font-bold text-sm tracking-wide transition-colors duration-200 h-[64px] flex items-center justify-center"
                            >
                                See how Spark helps your team
                            </a>

                            <a href="mailto:info@xds-spark.com?subject=Enterprise solutions enquiry"
                                className="border border-white hover:bg-white/10 text-white px-8 py-3.5 rounded-full font-bold text-sm tracking-wide transition-colors duration-200 h-[64px] flex items-center justify-center"
                            >
                                Talk to us about Enterprise Solutions →
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
export default SignupOptions;
