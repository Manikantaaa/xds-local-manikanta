// "use client"

// import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
// import { fetcher } from "@/hooks/fetcher";
// import { Metadata, ResolvingMetadata } from "next";
// import { useParams } from "next/navigation";
// import { useEffect, useState } from "react";


// export async function generateMetadata(
//   parent: ResolvingMetadata
// ): Promise<Metadata> {
//   // read route params
//   const paramsdata = useParams();
//   const id = paramsdata.id;
//   // fetch data
//  // const product = await fetch(`https://.../${id}`).then((res) => res.json())
 
//   // optionally access and extend (rather than replace) parent metadata
//   const previousImages = (await parent).openGraph?.images || []
 
//   return {
//     title: "product.title",
//     openGraph: {
//       images: ['/some-specific-page-image.jpg', ...previousImages],
//     },
//   }
// }

// const SPMetadata = () => {
//     const paramsdata = useParams();
//     const [compantId, setCompantId] = useState<number | null>(null)
//     const ParamData = paramsdata.id;
//     const [metadata, setMetadata] = useState({
//         title: "Default Title",
//         description: "Default description",
//         ogType: "website",
//         ogImage: "https://xds-spark-dev-6a63a.web.app/xds-logo.svg",
//       });
//     useEffect(() => {
//         if(isNaN(Number(ParamData))){
//             async function getserviceprovidersDetails() {
//                  await fetcher(
//                     getEndpointUrl(ENDPOINTS.getcompanyIdbySlug(typeof ParamData === "string" ? ParamData : "")),
//                   ).then(async (getcompanyIds) => {
//                     const response = await fetcher(
//                         getEndpointUrl(ENDPOINTS.getserviceprovidersdetails(Number(getcompanyIds.id))),
//                       );
//                       if (response.success && response.list) {
//                           setMetadata({
//                               title: response.list.name,
//                               description: `${response.list.name} is on XDS SPARK`,
//                               ogType: "website",
//                               ogImage: response.list.logoAsset?.url
//                           })
//                       }
//                   })

//               }
//               getserviceprovidersDetails();
//         }
//     }, []);

//     return (
//       <></>
//       //   <Head>
//       //   <title>{metadata.title}</title>
//       //   <meta name="description" content={metadata.description} />
//       //   <meta property="og:title" content={metadata.title} />
//       //   <meta property="og:description" content={metadata.description} />
//       //   <meta property="og:type" content={metadata.ogType} />
//       //   <meta property="og:image" content={metadata.ogImage} />
//       // </Head>
//     )
// }

// export default SPMetadata;