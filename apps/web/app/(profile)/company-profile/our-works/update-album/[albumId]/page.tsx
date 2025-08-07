"use client";

import AlbumComponent from "@/components/albumComponent";
import Breadcrumbs from "@/components/breadcrumb";
import { PATH } from "@/constants/path";



const UpdateAlbumComponent = () => {

  const breadcrumbItems = [
    {
      label: PATH.HOME.name,
      path: PATH.HOME.path,
    },
    {
      label: PATH.COMPANY_PROFILE.name,
      path: PATH.COMPANY_PROFILE.path,
    },
    {
      label: PATH.OUR_WORK.name,
      path: PATH.OUR_WORK.path,
    },
    {
      label: "Update Album",
      path: "Update Album",
    },
  ];
  return (
    <>
      <div className="pb-6 pt-6 breadcrumbs_s">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      <AlbumComponent></AlbumComponent>
    </>
  );
};
export default UpdateAlbumComponent;