"use client";
import { PATH } from "@/constants/path";
import Breadcrumbs from "@/components/breadcrumb";
import { useUserContext } from "@/context/store";
import { redirect } from "next/navigation";
import AlbumComponent from "@/components/albumComponent";
const CreateAlbum = () => {
  const { user } = useUserContext();

  if (!user || user.userRoles[0].roleCode == 'buyer') {
    redirect(PATH.HOME.path);
  }

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
      label: PATH.ALBUMS.name,
      path: PATH.ALBUMS.path,
    },
    {
      label: "Create Album",
      path: "Create Album",
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
export default CreateAlbum;