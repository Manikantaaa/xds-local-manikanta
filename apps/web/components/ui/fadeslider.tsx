// FadeSlider.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const images = [
  "/BSP_Banner_2.png",
  "/BSP_Banner.png",
  "/BSP_Banner_3.png",
  "/BSP_Banner_1.png",
];

export default function FadeSlider({
  images,
  webUrl,
  onClickBannerAdClicks,
  isMobile
}: {
  images: {
    id: number;
    adImagePath: string;
    mobileAdImagePath: string;
    adURL: string;
    adPage: string;
  }[];
  webUrl: string;
  onClickBannerAdClicks: (id: number) => void;
  isMobile?: boolean;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!images || images.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <>
      { 
        isMobile ?
        <div className="relative w-full aspect-[16/1.25] overflow-hidden">
          {
            images.map((image, index) => (
              <div className="ad_banner_home_mobile">
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                    }`}
                >
                  <Link target={`${image.adURL.startsWith(webUrl) ? '_self' : '_blank'}`} href={image.adURL ? (image.adURL.startsWith('http://') || image.adURL.startsWith('https://') ? image.adURL : `https://${image.adURL}`) : '#'} onClick={() => onClickBannerAdClicks(image.id)}>
                    <Image
                      src={image.mobileAdImagePath}
                      alt={`Ad ${index + 1}`}
                      fill
                      className="object-cover"
                      priority={index === 0}
                    />
                  </Link>
                </div>
              </div>
            ))
          }
        </div>
        :
        <div className="relative h-[120px] w-[320px] overflow-hidden rounded-lg shadow-lg">
          {images.map((image, index) => (
            <div className="ad_banner_home">
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                  }`}
              >
                <Link target={`${image.adURL.startsWith(webUrl) ? '_self' : '_blank'}`} href={image.adURL ? (image.adURL.startsWith('http://') || image.adURL.startsWith('https://') ? image.adURL : `https://${image.adURL}`) : '#'} onClick={() => onClickBannerAdClicks(image.id)}>
                  <Image
                    src={image.adImagePath}
                    alt={`Ad ${index + 1}`}
                    fill
                    className="object-cover"
                    priority={index === 0}
                  />
                </Link>
              </div>
            </div>
          ))}
        </div>
      }
      <div className="flex flex-row-reverse text-xs pr-1"><a target="_blank" className="advertise_banner" href="mailto:info@xds-spark.com?subject=XDS Spark - Banner Ad Enquiry">Advertise on Spark</a></div>

    </>
  );
}
