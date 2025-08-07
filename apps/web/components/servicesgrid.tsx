import Link from "next/link"
import { sponsoredServices } from "@/types/serviceprovidersidebar.type";
import { useRouter } from "next/navigation";
import { authPut } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";

type ServicesGridProps = {
    sponseredServices: sponsoredServices;
    onClick: () => void;
};
const ServicesGrid: React.FC<ServicesGridProps> = ({ sponseredServices, onClick }) => {

  const router = useRouter();

  const onClickViewProfile = async (item: sponsoredServices) => {
    const url = getEndpointUrl(ENDPOINTS.addServiceCategoryClickCount(item.id));
    await authPut(url);
    router.push(`/serviceproviders-details/${item.Companies.slug}`);
  }

    return (


        <div className="grid_categories cursor-pointer overflow-hidden rounded-lg card_shadow_2">
            <article className="">
                <div className="bg-white mobile_grid_style card_hoverlay_view mbottom_height"> {/*  p-2.5 pb-4  */}
                
                <div className="p-2.5 relative" >
                    {sponseredServices.serviceTitle && (
                        <div
                        onClick={() => onClickViewProfile(sponseredServices) }
                        >
                            <div className="view_this_profile uppercase">
                                <span className=" mt-10 m_hide">View This Profile</span>
                            </div>
                        </div>
                    )}
                    <span className="link_color text-base mb-2.5 block font-semibold m_hide relative z-[20]" onClick={onClick}>{sponseredServices.Services.serviceName}</span>
                    <img
                        alt=""
                        src={sponseredServices.defafultImg}
                        className="h-46 w-full object-cover rounded-[6px] mobile_image_view"
                        onClick={onClick} 
                    />
                    </div>

                    {sponseredServices.serviceTitle ? 
                        <div 
                        className="bg-black text-white py-1 px-2 shadow-lg flex items-center h-[44px] mobile_display_view "
                        onClick={() => onClickViewProfile(sponseredServices) }
                        >
                            <span className="text-sm font-semibold text-nowrap">Sponsored&nbsp;by:</span>
                            <div className=" ml-2 flex-shrink-0 flex items-center justify-center"> 
                               {sponseredServices.sponseredLogoImg ? <img
                                alt=""
                                src={sponseredServices.sponseredLogoImg}
                                className="w-[30px] h-[30px] "
                            /> : "LOGO"}
                            </div>
                            <div className="ml-2">
                                <p className="text-white font-semibold text-sm text-wrap uppercase" style={{lineHeight:'15px'}}>{sponseredServices.serviceTitle}</p>
                                {/* <p className="text-white text-xs">A SUMO GROUP STUDIO</p> */}
                            </div>
                        </div>
                     : 
                     <>
                     <Link target="_blank" href="mailto:info@xds-spark.com?subject=XDS Spark - Service Line Sponsorship&body=Please provide me with more information about sponsoring a Service Line on XDS Spark!"  className="h-[44px] bg-[#f2aa1d] underline flex items-center justify-center font-semibold text-sm text-white mobile_display_view">
                            Sponsorship Available
                    </Link>
                     </>
                    }
                    <div className="p-2.5 lg:p-0 md:p-0 relative" onClick={onClick} >
                        <span className="link_color text-base mb-1 block font-semibold m_show">{sponseredServices.Services.serviceName}</span>
                    </div>
                </div>
            </article>
        </div>

    )
}

export default ServicesGrid;