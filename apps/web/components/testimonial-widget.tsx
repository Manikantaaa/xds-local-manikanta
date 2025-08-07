"use client";

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Mousewheel } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface TestimonialCardProps {
  name: string;
  title: string;
  company: string;
  testimonial: string;
  profileImage: string;
  companyLogo: string;
}

const testimonials: TestimonialCardProps[] = [
  // Your testimonial objects here (same as before)
  {
    name: "Zoey Hoang",
    title: "CEO and Co-Founder",
    company: "Thunder Cloud Studio",
    testimonial:
      "XDS Spark has been a powerful platform for connecting with high-quality leads in the game development industry. The visibility and networking opportunities are unmatched.",
    profileImage: "member_1.png",
    companyLogo: "thunder_cloud.png",
  },
  {
    name: "Vas Baev",
    title: "Senior Process Specialist",
    company: "King",
    testimonial:
      "Spark has been invaluable in helping me shortlist suppliers who tick our boxes for outsourcing in mobile game production and development. I found the portal very intuitive and perfectly informative for a buyer like King!",
    profileImage: "member_2.png",
    companyLogo: "king.png",
  },
  {
    name: "Marcus Dublin",
    title: "Co-Founder & Co-CEO",
    company: "Art Bully Productions",
    testimonial:
      "XDS Spark has been instrumental in saving us time by providing direct access and visibility to a broad network of potential clients. It streamlines the discovery process and makes initiating new collaborations more efficient",
    profileImage: "member_3.png",
    companyLogo: "artvullt.png",
  },
  {
    name: "Karolina Kopek",
    title: "Procurement Director",
    company: "CD PROJEKT RED",
    testimonial:
      "XDS Spark saves us time and resources by providing access to a wide pool of potential partners. We highly recommend this to anyone looking for professional outsourcing providers.",
    profileImage: "member_4.png",
    companyLogo: "Scopely_logo.png",
  },
  {
    name: "Mika Schulman",
    title: "Director, Art Production & Outsourcing",
    company: "Scopely",
    testimonial:
      "Spark delivers value in finding new partners to cover concrete need, and the platform has been improving at a fast pace.",
    profileImage: "member_5.png",
    companyLogo: "Scopely.png",
  },
  {
    name: "Sri Ram Chandra",
    title: "Founder & CEO",
    company: "Little Red Zombies",
    testimonial:
      "XDS Spark is the most effective online platform for showcasing our studio's work to AAA game developers. It offers real visibility and opportunities for studios and external partners alike.",
    profileImage: "member_6.png",
    companyLogo: "liitlered.png",
  },
  {
    name: "Carla Toledo",
    title: "Procurement Lead",
    company: "Sharkmob",
    testimonial:
      "XDS Spark is a great tool for finding potential outsourcing studios. It has a very friendly user experience and aligns well with our studio needs.",
    profileImage: "member_7.png",
    companyLogo: "shar-mob.png",
  },
   {
    name: "Richard Ludlow",
    title: "Audio Director",
    company: "Hexany Audio",
    testimonial:
      "I’ve delivered hundreds of pitches to developers and felt confident heading into my review session. But Carla’s sharp insight caught me off guard with an improvement I hadn’t considered—one I’ll be incorporating into my future pitches!",
    profileImage: "member_8.png",
    companyLogo: "hexany.png",
  },
  {
    name: "Natalia Titarenko",
    title: "Business Manager",
    company: "Loopsin",
    testimonial:
      "The role-playing exercise was extremely valuable. It gave me a realistic sense of the situation and, honestly, was probably the best way to prepare… I genuinely felt supported and welcomed throughout the session.",
    profileImage: "member_9.png",
    companyLogo: "loopsin.png",
  },
  {
    name: "Lauren Freeman",
    title: "Head of Developer Feedback",
    company: "Roblox",
    testimonial:
      "Carla up-leveled co-dev at EA with a rare knack for data-backed decisions grounded in strong intuition. Her production experience across genres brings the breadth to tackle any challenge with game teams and their partners.",
    profileImage: "member_10.png",
    companyLogo: "rroblox.png",
  },
];

function TestimonialCard({
  name,
  title,
  company,
  testimonial,
  profileImage,
  companyLogo,
}: TestimonialCardProps) {
  return (
    // <div className="relative flex-shrink-0 2xl:w-[400px] w-[350px] h-[512px] mx-auto">
    //   <div className="absolute bg-white h-[512px] left-0 rounded-bl-[3px] rounded-br-[3px] rounded-tl-[5px] rounded-tr-[5px] top-0 2xl:w-[400px] w-[350px]" />
    //   <div className="absolute bg-black h-[178px] left-0 rounded-tl-[5px] rounded-tr-[5px] top-0 2xl:w-[400px] w-[350px]" />
    //   <div className="absolute left-[127.5px] w-[125px] h-[125px] top-[-47px]">
    //     <img
    //       className="block max-w-none size-full rounded-full"
    //       height="125"
    //       src={profileImage}
    //       width="125"
    //       alt={name}
    //     />
    //   </div>
    //   <div className="absolute font-bold h-[23px] leading-[20px] left-[190px] text-[#53b6d2] text-[20px] text-center top-[89px] translate-x-[-50%] w-[194px]">
    //     {name}
    //   </div>
    //   <div className="absolute font-normal h-14 leading-[22px] left-[189.5px] text-white text-center top-[114px] translate-x-[-50%] w-[323px]">
    //     <span className="font-semibold text-[15px]">
    //       {title}
    //       <br />
    //     </span>
    //     <span className="text-[14px]">{company}</span>
    //   </div>
    //   <div className="absolute h-[41px] left-[25px] top-[170px] w-[46px]">
    //     <svg
    //       xmlns="http://www.w3.org/2000/svg"
    //       width="46"
    //       height="41"
    //       viewBox="0 0 46 41"
    //       fill="none"
    //     >
    //       <g clipPath="url(#clip0_343_375)">
    //         <path
    //           d="M19.9436 0.167114V6.69503C19.2364 7.4971 18.0632 7.43026 17.1764 7.84243C11.1702 10.6218 8.81833 15.3228 9.01479 21.834H19.242C19.3374 21.834 19.6686 22.2016 19.9436 22.1125V40.5878L19.5227 41.0056H0.752191C0.353655 40.7605 0.364881 40.4542 0.319976 40.0476C-0.331153 34.5835 0.0280905 21.277 1.24615 15.9411C3.37354 6.63376 10.6594 1.30337 19.9436 0.167114Z"
    //           fill="#53B6D2"
    //         />
    //         <path
    //           d="M46.0002 7.11276C40.2186 8.26572 36.2276 12.276 35.3801 18.1133C35.2341 19.1326 35.5541 20.2076 35.1219 21.2102L35.4867 21.8396H45.5736L45.9946 22.2573V41.0056H26.8031C26.4046 40.7605 26.4158 40.4541 26.3709 40.0475C25.6636 34.0822 26.1801 21.2436 27.5834 15.3841C29.75 6.35525 36.7104 1.94946 45.422 0L46.0002 0.306344V7.11276Z"
    //           fill="#53B6D2"
    //         />
    //       </g>
    //       <defs>
    //         <clipPath id="clip0_343_375">
    //           <rect width="46" height="41" fill="white" />
    //         </clipPath>
    //       </defs>
    //     </svg>
    //   </div>
    //   <div className="absolute font-normal leading-[22px] left-8 text-black text-[17px] text-left top-[245px] lg:w-[323px] w-[290px]">
    //     {testimonial}
    //   </div>
    //   <div
    //     className="absolute bg-center bg-contain bg-no-repeat h-[67px] left-[140px] top-[414px] w-[100px]"
    //     style={{ backgroundImage: `url('${companyLogo}')` }}
    //   />
    // </div>
    <div className="w-full  min-h-[500px] mx-auto bg-white rounded-md shadow-md flex flex-col relative">
      {/* Top Section with Image and Name */}
      <div className="bg-black pt-16 pb-6 text-center relative rounded-tl-md rounded-tr-md">
        <div className="w-24 h-24 mx-auto rounded-full overflow-hidden  !-mt-[100px]">
          <img
            className="w-full h-full object-cover"
            height="125"
            src={profileImage}
            width="125"
            alt={name}
          />
        </div>
        <h2 className="!text-[20px] font-bold text-[#53b6d2] !mt-4 leading-[22px]"> {name}</h2>
        <h3 className="text-white font-semibold !text-[16px] !my-1 leading-[22px]">  {title}</h3>
        <p className="text-white !text-[14px] leading-[22px]">{company}</p>
      </div>

      {/* Quote Section */}
      <div className="px-6 py-6 relative ">
        <div className="absolute left-[1.5rem] top-[-10px]" >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="46"
            height="41"
            viewBox="0 0 46 41"
            fill="none"
          >
            <g clipPath="url(#clip0_343_375)">
              <path
                d="M19.9436 0.167114V6.69503C19.2364 7.4971 18.0632 7.43026 17.1764 7.84243C11.1702 10.6218 8.81833 15.3228 9.01479 21.834H19.242C19.3374 21.834 19.6686 22.2016 19.9436 22.1125V40.5878L19.5227 41.0056H0.752191C0.353655 40.7605 0.364881 40.4542 0.319976 40.0476C-0.331153 34.5835 0.0280905 21.277 1.24615 15.9411C3.37354 6.63376 10.6594 1.30337 19.9436 0.167114Z"
                fill="#53B6D2"
              />
              <path
                d="M46.0002 7.11276C40.2186 8.26572 36.2276 12.276 35.3801 18.1133C35.2341 19.1326 35.5541 20.2076 35.1219 21.2102L35.4867 21.8396H45.5736L45.9946 22.2573V41.0056H26.8031C26.4046 40.7605 26.4158 40.4541 26.3709 40.0475C25.6636 34.0822 26.1801 21.2436 27.5834 15.3841C29.75 6.35525 36.7104 1.94946 45.422 0L46.0002 0.306344V7.11276Z"
                fill="#53B6D2"
              />
            </g>
            <defs>
              <clipPath id="clip0_343_375">
                <rect width="46" height="41" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </div>
        <p className="text-[15px] text-gray-800 leading-[25px] mt-[30px]">
          {testimonial}
        </p>
      </div>

      {/* Logo Section */}
      <div className="absolute bottom-[30px] left-0 right-0">
        <div className="text-center">
          <img
            src={companyLogo} // Replace with actual path
            alt="Thunder Cloud Logo"
            className="h-[67px] mx-auto object-contain"
          />
        </div>
      </div>
    </div>
  );
}

export default function TestimonialsSection(props: {page:string}) {
  return (
    <>
      <div className="lg:text-center gap_each_element mb-10 container business_sulition_page_hide">
        <h2 className="text-white font-bold text-3xl lg:text-4xl leading-9">
          What our members are saying
        </h2>
      </div>
      <section
        className=" flex items-center justify-center">
        <div className="container mx-auto lg:px-8 px-0 ">
          <div
            className="flex gap-0 overflow-x-hidden scroll-smooth"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitScrollbar: 'none',
              columnGap: '0px'
            } as React.CSSProperties}
          >
            <Swiper
              modules={[Navigation, Pagination, Mousewheel]}
              slidesPerView={3}
              spaceBetween={51}
              navigation
              className={props.page === 'business-page' ? '' : 'custom-swiper'}
              pagination={{ clickable: true }}
              mousewheel={{
                forceToAxis: false,        // ⬅️ allows vertical scroll to affect horizontal scroll
                invert: false,             // ⬅️ keep natural scroll direction
                releaseOnEdges: true       // ⬅️ allow page scroll when at the start or end
              }}
              grabCursor={true}
              slideToClickedSlide={true}
              breakpoints={{
                0: { slidesPerView: 1 },
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
            >
              {testimonials.map((t, idx) => (
                <>
                  { props.page == 'business-page' ? (idx > 6  && 
                    <SwiperSlide key={idx} className="w-full pt-12">
                      <TestimonialCard {...t} />
                    </SwiperSlide> ) :
                   (idx < 7  && <SwiperSlide key={idx} className="w-full pt-12">
                      <TestimonialCard {...t} />
                    </SwiperSlide>)
                  }
                 </>
               
              ))}
            </Swiper>
          </div>
        </div>
      </section>
    </>
  );
}
