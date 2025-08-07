import "./globals.css";
import { Inter } from "next/font/google";
import { UserContextProvider } from "@/context/store";
import MainNavbar from "@/components/mainNavbar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MultiTourContextProvider } from "@/context/multiTourContext";
import MultiRouteWrapper from "@/components/ui/tourWrapper";
import FooterNavbar from "@/components/navbar/footerNavbar";
import { ProfileStatusProvider } from "@/context/profilePercentage";
import { Metadata, ResolvingMetadata } from "next";
import { RandomDataStoreContextProvier } from "@/context/random-data-store";

import { GoogleTagManager } from '@next/third-parties/google';

const inter = Inter({ subsets: ["latin"] });

// export const metadata: Metadata = {
//   title: "XDS Spark",
//   openGraph: {
//     type: "website",
//     title: "layout My Website",
//     description: "layout My Website Description",
//     siteName: "layout My Website",
//     images: [{
//       url: "https://example.com/og.png",
//     }],
//   },
//   description: "Connecting Buyers with Service Providers - XDS Spark. XDS Spark is a B2B platform to connect Buyers with Service Providers, and be the ONE true source for information for external development for creative industries.",
// };

export async function generateMetadata(parent: ResolvingMetadata): Promise<Metadata> {
  return {
    
      title: "XDS Spark",
      openGraph: {
        url: "https://xds-spark.com",
        type: "website",
        title: "Connecting Buyers with Service Providers - XDS Spark",
        description: "Connecting Buyers with Service Providers - XDS Spark. XDS Spark is a B2B platform to connect Buyers with Service Providers, and be the ONE true source for information for external development for creative industries.",
        siteName: "XDS Spark",
        images: [{
          url: "https://xds-spark-dev-6a63a.web.app/website_preview.jpg?v=1",
        }],
      },
      description: "XDS Spark is a B2B platform to connect Buyers with Service Providers, and be the ONE true source for information for external development for creative industries.",
  };
}

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="en">
      <head>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      <meta property="og:image" content="https://xds-spark-dev-6a63a.web.app/website_preview.jpg?v=1" />
      </head>
      {/* <head>
        <title>XDS Spark</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="description" content="testlayoutdesc Connecting Buyers with Service Providers - XDS Spark. XDS Spark is a B2B platform to connect Buyers with Service Providers, and be the ONE true source for information for external development for creative industries." />
        <meta property="og:title" content="testlayouttitle Connecting Buyers with Service Providers - XDS Spark" />
        <meta property="og:description"
          content="testlayout XDS Spark is a B2B platform to connect Buyers with Service Providers, and be the ONE true source for information for external development for creative industries." />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="XDS Spark" />
        <meta property="og:image" content="https://xds-spark.com/website_preview.jpg" />
        <meta property="og:url" content="https://xds-spark.com/" />
      </head> */}

      <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_XDS_GOOGLE_TAG_MANAGER_ID ? process.env.NEXT_PUBLIC_XDS_GOOGLE_TAG_MANAGER_ID : '0'} />
      <body className={inter.className}>
        <UserContextProvider>
          <ProfileStatusProvider>
            <RandomDataStoreContextProvier>
              <div className="min-h-screen flex flex-col">
                {
                  <div className="w-full">
                    <MainNavbar></MainNavbar>
                  </div>
                }

                <MultiTourContextProvider>
                  <MultiRouteWrapper />
                  
                  <div className="">
                  {/* <ProfileContextProvider> */}
                    <div className="">{children}</div>
                    {/* </ProfileContextProvider> */}
                  </div>
                
                </MultiTourContextProvider>
                <ToastContainer position="bottom-right" style={{ width: "350px" }} autoClose={1000} />
              </div>

              <FooterNavbar></FooterNavbar>
            </RandomDataStoreContextProvier>
          </ProfileStatusProvider>
          {/* <FooterNavbar></FooterNavbar> */}
        </UserContextProvider>
        {/* <Script src="../path/to/flowbite/dist/flowbite.min.js" /> */}
      </body>
    </html>
    
  );
}
