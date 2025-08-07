"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function HomeFadeSlider({
  images,
  webUrl,
  onClickBannerAdClicks,
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
      <div className="relative w-full aspect-[16/1.25] overflow-hidden">
        {images.map((image, index) => (
          <div className="ad_banner_home">
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              <Link
                target={
                  image.adURL.startsWith(webUrl) ? "_self" : "_blank"
                }
                href={
                  image.adURL
                    ? image.adURL.startsWith("http://") ||
                      image.adURL.startsWith("https://")
                      ? image.adURL
                      : `https://${image.adURL}`
                    : "#"
                }
                onClick={() => {
                  onClickBannerAdClicks(image.id);
                }}
              >
                <Image
                  src={image.adImagePath}
                  alt={`Ad ${index + 1}`}
                  fill
                  className="w-full object-cover"
                  priority={index === 0}
                />
              </Link>
            </div>
          </div>
        ))}
        {images.map((image, index) => (
          <div className="ad_banner_home_mobile">
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              <Link
                target={
                  image.adURL.startsWith(webUrl) ? "_self" : "_blank"
                }
                href={
                  image.adURL
                    ? image.adURL.startsWith("http://") ||
                      image.adURL.startsWith("https://")
                      ? image.adURL
                      : `https://${image.adURL}`
                    : "#"
                }
                onClick={() => {
                  onClickBannerAdClicks(image.id);
                }}
              >
                <Image
                  src={image.mobileAdImagePath}
                  alt={`Ad ${index + 1}`}
                  fill
                  className="w-full object-cover"
                  priority={index === 0}
                />
              </Link>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-row-reverse text-xs">
        <a
          target="_blank"
          className="advertise_banner"
          href="mailto:info@xds-spark.com?subject=XDS Spark - Banner Ad Enquiry"
        >
          Advertise on Spark
        </a>
      </div>
    </>
  );
}
