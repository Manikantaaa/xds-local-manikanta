// app/folder/[id]/page.tsx
import ServiceProviderDetails from '@/components/serviceproviderdetails';
import { Metadata, ResolvingMetadata } from 'next';


// Fetch data in the component or use server-side function
async function fetchServiceProviderData(slug: string): Promise<any | null> {
  const nameWithSpaces = slug.replace(/-/g, ' ');
  
  // Capitalize the first letter of each word (title case)
  const capitalizedName = nameWithSpaces
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
  
  return capitalizedName;
}
 
export async function generateMetadata({ params }: { params: { id: string } }, parent: ResolvingMetadata): Promise<Metadata> {
  
  const CompanyName = await fetchServiceProviderData(params.id);
  const previousImages = (await parent).openGraph?.images || [];
  return {
    title: "XDS Spark - " + CompanyName,
    openGraph: {
      type: "website",
      url: "https://xds-spark.com",
      title: CompanyName + " is on XDS Spark",
      images: [
        {
          url: "https://xds-spark-dev-6a63a.web.app/website_preview.jpg?v=1",
        },
      ],
    },
  };
}

const ServiceProviderWrapper = async ({ params }: { params: { id: string } }) => {
   return (
    <>
      <ServiceProviderDetails/>
    </>
  );
};

export default ServiceProviderWrapper;
