"use client";
import Image from "next/image";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { authFetcher } from "@/hooks/fetcher";
import { useEffect, useState } from "react";
import { serviceColoring } from "@/constants/serviceColors";
import React from "react";
const FoundingserviceProvider = () => {
  type ApiResponse = {
    currentpage: number;
    list: {
      id: number;
      userId: number;
      name: string;
      website: string;
      shortDescription: string;
      companySize: number;
      about: string;
      logoAssetId: number;
      bannerAssetId: number;
      isFoundingSponcer: boolean;
      isArchieve: boolean;
      isDelete: boolean;
      status: number;
      user?: {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
        linkedInUrl: string;
        approvalStatus: string;
        stripeCustomerId: string;
        accessExpirationDate: string;
        isArchieve: boolean;
        isDelete: boolean;
        status: string;
        createdAt: string;
        updatedAt: string;

        // assets?:[{
        //     url:string,
        // }],
        userRoles?: [
          {
            roleCode: string;
          },
        ];
      };
      logoAsset?: {
        url: string | "/16by9 image.png";
      };
      bannerAsset?: {
        url: string | "/16by9 image.png";
      };
      ServicesOpt?: [
        {
          service: {
            serviceName: string;
            groupId: number;
          };
        },
      ];
      companySizes?: {
        size: string;
      };
      CompanyAddress: [
        {
          location_name: string;
          Country: {
            name: string;
          };
        },
      ];
      success: boolean;
      statusCode: number;
    };
    statusCode: number;
    success: boolean;
    totalpages: number;
  };

  const [list, setList] = useState([]);
  useEffect(() => {
    async function getfounder() {
      try {
        const response = await authFetcher(
          getEndpointUrl(ENDPOINTS.getfoundingsponsers),
        );
        if (response.success) {
          setList(response.list);
        } else {
          console.log(`Api reponded with Status Code ${response.statusCode}`);
        }
      } catch (error) {
        console.error(`Api reponded with Error: ${error}`);
      }
    }
    getfounder();
  }, []);

  return (
    <>
      <hr />
      <div className="foundingsponsers">
        <div className="sm:text-left py-6">
          <h1 className="font-bold default_text_color heading-sub-font">
            Founding Partners
          </h1>
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {list.map((item: ApiResponse["list"]) => (
            <div key={item.id} className="rounded-l">
              <a
                href={item.website}
                className="relative block overflow-hidden rounded border border-gray-200 p-2.5 card_shadow"
              >
                <div className="sm:flex sm:gap-4">
                  <div className="hidden sm:block sm:shrink-0">
                    <Image
                      alt="Paul Clapton"
                      src={item.logoAsset?.url || "/16by9 image.png"}
                      className="h-12.2 w-12 rounded-lg object-cover shadow-sm"
                      width={50}
                      height={50}
                    />
                  </div>

                  <div>
                    <h3 className="card_h3_fotnt_size font-bold link_color">
                      {item.name}
                    </h3>
                  </div>
                </div>
                <div className="py-2.5">
                  <div className="pb-2.5 space-y-1">
                    {item.ServicesOpt?.map((services, index) =>
                      index < 3 &&
                      services.service &&
                      services.service.serviceName ? (
                        <button
                          key={index + services.service.serviceName}
                          type="button"
                          className={`default_text_color bg_${
                            serviceColoring[services.service.groupId]
                          } focus:outline-none font-medium rounded-sm text_xs_13 px-2 py-1 me-2`}
                        >
                          {services.service.serviceName}
                        </button>
                      ) : null,
                    )}
                  </div>
                  <p className=" card_p_text font-inter">
                    {item.shortDescription}
                  </p>
                </div>
                <div className="flex justify-between card_p_text">
                  <span>
                    {item.CompanyAddress.slice(0, 3).map(
                      (countries, index, array) => (
                        <span key={index}>
                          {countries.Country.name}
                          {index < array.length - 1 && ", "}
                        </span>
                      ),
                    )}
                    {item.CompanyAddress.length > 3 && (
                      <span key="ellipsis">...</span>
                    )}
                  </span>
                  <p className="companysize">
                    {item.companySizes?.size}{" "}
                    {item.companySizes?.size ? "Employees" : ""}
                  </p>
                </div>

                <div className="pt-2.5">
                  <Image
                    src={item.bannerAsset?.url || "/16by9 image.png"}
                    className="w-[128px]"
                    alt=""
                    width={128}
                    height={128}
                  />
                </div>
                {/* ))} */}
              </a>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default FoundingserviceProvider;
