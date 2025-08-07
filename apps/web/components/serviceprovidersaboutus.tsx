"use client";

import Link from "next/link";
import { useUserContext } from "@/context/store";
import { isValidJSON } from "@/constants/serviceColors";
type aboutdescType = {
  aboutdesc: string | undefined;
  companyId: number;
  profilePdf: string | undefined;
  isPaidProfile: boolean;
};

const ServiceproviderAboutUs = (aboutdescContent: aboutdescType, ) => {
  const { user } = useUserContext();

  return (
    <>
      <div className="aboutus pb-12">
        <div className="sm:flex sm:items-center sm:justify-between py-6">
          <div className="sm:text-left">
            <h1 className="font-bold default_text_color header-font">About</h1>
          </div>
        </div>
        {aboutdescContent.aboutdesc ? (
          <div>
            <p className="text-sm whitespace-break-spaces">{isValidJSON(aboutdescContent.aboutdesc) ? JSON.parse(aboutdescContent.aboutdesc) : aboutdescContent.aboutdesc}</p>
            {aboutdescContent.isPaidProfile && aboutdescContent.profilePdf ? <div className="pt-0"><Link prefetch={false} target="__blank" href={aboutdescContent.profilePdf} className="font-bold">
              <div className="company_profile_pdf_2 my-6 text-base font-medium">
                <abbr> <svg id="svg5" height="50" viewBox="0 0 8.4666662 8.4666662" width="50" xmlns="http://www.w3.org/2000/svg" ><linearGradient id="linearGradient2739"><stop id="stop2737" offset="0" stop-color="#0ecc24" /></linearGradient><linearGradient id="linearGradient2667"><stop id="stop2665" offset="0" /></linearGradient><g id="layer1"><path id="path7475-3" d="m7.0042201 2.7572899.0000021 4.2424495a.96438989.93754153 0 0 1 -.9643902.9375426h-3.6132311a.96439044.93754206 0 0 1 -.9643901-.9375426v-5.5330345a.96438716.93753887 0 0 1 .9643901-.93753836l2.297092.00000726z" fill="#f00" paint-order="normal" /><path id="path6360-9" d="m4.8239089.62708677c-.1849285.47603273-.6129065 1.20584653-.1813568 1.81929103.112127.1701454.7950977.4331655 1.223737.5849395.273591.096879.4986515.4022643.4986515.6930783l.035883 2.831766c0 .5177899-.4314791.9373166-.9640968.9373166h-3.6132202c-.080357 0-.1583555-.00985-.2329895-.02785.1716193.2915406.490562.4715459.8360859.4718713h3.6132197c.5328374.0001307.9648089-.4198489.9646327-.9378513v-4.2425604z" fill="#d40000" paint-order="normal" /><path id="path6696-7" d="m1.9608657 1.1051841a.13711579.13711579 0 0 1 .1376559.1356314v.3846264a.13711579.13711579 0 0 1 -.1376559.1376558.13711579.13711579 0 0 1 -.1356314-.1376558v-.3846264a.13711579.13711579 0 0 1 .1356314-.1356314z" fill="#fff" stroke-linecap="round" stroke-linejoin="round" /><path id="path6702-2" d="m1.9608657 1.8541935a.13711527.13711527 0 0 1 .1376559.1376558v.056681a.13711527.13711527 0 0 1 -.1376559.1356322.13711527.13711527 0 0 1 -.1356314-.1356314v-.0566818a.13711527.13711527 0 0 1 .1356314-.1376558z" fill="#fff" stroke-linecap="round" stroke-linejoin="round" /><path id="path7319-7" d="m4.7238093.52928308-.2996833 1.17118412a.5954101.58172648 0 0 0 .4797478.7149008l2.1004635.3420318z" fill="#ff8080" /><path id="path395410" d="m4.2389522 3.4770532c-.1596197.0022802-.2706822.1038085-.3245789.1644319-.1249868.1405849-.1307061.3332855-.0889113.5200764.041794.1867911.1312974.3856206.2404886.5870277.012255.022607.025827.037874.038564.060523-.2195704.399596-.5216019.8346101-.785203 1.181554-.3422389.081358-.6698027.1212697-.8666157.3427899-.1647918.1857217-.1762467.4678692 0 .632019.0766693.0673117.1839297.1013949.2774484.1028407.0878251-.0010147.1627792-.0260163.2228135-.0626658.2300868-.1404682.3799181-.438773.5457859-.7835963l1.3449145-.3133313c.2017715.2501195.4117498.495277.6620128.5725662.1160352.0358349.2385601.0315905.3481462-.0080326.1095863-.0396272.2120056-.1180247.2586993-.2388817.0814939-.2195685-.0083738-.462814-.2185322-.5726238-.1631532-.0880252-.3664745-.1030172-.5929198-.0931958-.1157128.0050184-.2379606.0174-.3620718.0353501-.1466937-.2235349-.344119-.5189603-.516327-.8066274.1010179-.2004997.1887551-.3978521.2265627-.5789937.0422106-.2022382.0337777-.4014367-.0808773-.554891-.0822492-.1299817-.2077411-.1854922-.3293989-.1863395zm.1103288.3465383c.049899.06438.066838.1742784.032672.3379695-.018978.0909616-.0832566.2130543-.1296106.3240439-.066501-.1370123-.1361836-.2774693-.160147-.3845675-.0321603-.1437321-.0100622-.2234184.0267815-.2774456.025882-.042274.060968-.068184.1112749-.071085.052989-.00296.08813.031222.1190292.071085zm-.0830179 1.2388649c.1288908.2053467.2660841.4189679.3781449.5923836l-.8998235.2185272c.1814972-.2753264.3719312-.5562629.5216786-.8109108zm1.4964968.8398354c.098941.053381.1286841.1379554.09266.2329899-.033878.087573-.1969596.1111282-.2688755.08516-.09765-.030156-.25505-.2111728-.3990289-.360463.039821-.00987.088239-.01658.125868-.018212.1447831-.00637.3142848-.00296.4493764.060525zm-2.688758.4675866c-.0952233.1548031-.2024723.365063-.2651266.4033137-.0619506.0426085-.1334721.0267289-.1697889-.010176-.0501981-.0483999-.0588454-.1576579.0203531-.2469157.0807112-.0776475.1960246-.1101204.4145624-.146222z" fill="#fff" stroke-linecap="round" stroke-linejoin="round" /></g></svg></abbr>
                View Company Profile <img src="/exit-right.svg" className="w-4 h-4 inline-block ml-1"/>
              </div>
            </Link>
            </div>
              : ''
            }

          </div>
        ) : (
          <p className="text-sm">Coming Soon</p>
        )}
        {!user?.isPaidUser && aboutdescContent.companyId == user?.companyId && (
          <div className="text-sm pt-10">
            <Link href="mailto:info@xds-spark.com?subject=XDS Spark - Company Profile Removal Request" className="text-sky-600">
              Request XDS Spark admins to remove this company profile.
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default ServiceproviderAboutUs;
