"use client";
import Breadcrumbs from "@/components/breadcrumb";
import { PATH } from "@/constants/path";
import AdvertisementsContent from "@/components/advertisements";
import { ContentSideBar } from "@/components/admin/content-sidebar";
import Link from "next/link";
import { useEffect, useState } from "react";
const Ads = () => {
    const [hideAndShow, setHideAndShow] = useState(true);
    useEffect (()=>{
        const handleResize = () => {
          setHideAndShow(window.innerWidth > 768);
        };
      
        handleResize();
        window.addEventListener("resize", handleResize);
      
        return () => {
          window.removeEventListener("resize", handleResize);
        };
      },[]);
    const breadcrumbItems = [
        {
            label: PATH.HOME.name,
            path: PATH.HOME.path,
        },
        {
            label: PATH.CONTENT.name,
            path: PATH.CONTENT.path,
        },
        {
            label: 'Advertisements',
            path: 'Advertisements',
        },
    ];


    return (
        <div className="w-full px-5 pos_r">
            <div className="pb-6 pt-6 breadcrumbs_s">
                <Breadcrumbs items={breadcrumbItems} />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 lg:gap-8">
            <div className="faq_list">
                    <h1 className="font-bold text-gray-900 header-font text_font_size"> <button onClick={()=>setHideAndShow(!hideAndShow)} type="button" id="radix-:r1m:" aria-haspopup="menu" aria-expanded="false" data-state="closed" className="md:hidden inline-block focus-visible:outline-none  button_blue px-1 rounded-sm text-white me-2"><svg className="w-[26px] h-[26px] text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M9 8h10M9 12h10M9 16h10M5 8h0m0 4h0m0 4h0"></path></svg></button>Content </h1>
                    { hideAndShow ? <ul className="mt-4 sidebar_list_gap mobile_hide_menu">
                        <li><Link href="/admin/faq" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 link_color">FAQs</Link></li>
                        <li><Link href="/admin/advertisements" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0  anchor_active">Advertisements</Link></li>
                        <li><Link href="/admin/events" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 link_color">Events</Link></li>
                        <li><Link href="/admin/services" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 link_color">Service Categories</Link></li>
                        <li><Link href="/admin/articles" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 link_color">Articles</Link></li>
                        <li><Link href="/admin/notifications" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 link_color">Notifications</Link></li>
                        <li><Link href="/admin/platinum-partners" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 link_color">Platinum Partners</Link></li>
                    </ul>
                    : '' }
                </div>
                <div className="faq_content col-span-4">
                    <AdvertisementsContent />
                </div>

            </div>
        </div>
    );
};

export default Ads;
