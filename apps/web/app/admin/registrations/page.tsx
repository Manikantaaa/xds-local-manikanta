import AdminRegistrationsMain from "@/components/admin/admin-registrations-main";
import Breadcrumbs from "@/components/breadcrumb";
import { PATH } from "@/constants/path";

const Registrationlistview = () => {
  const breadcrumbItems = [
    {
      label: PATH.HOME.name,
      path: PATH.HOME.path,
    },
    {
      label: PATH.REGISTRATIONS.name,
      path: PATH.REGISTRATIONS.path,
    },
  ];

  return (
    <div className="w-full px-5 pos_r pb-6">
      <div className="pb-6 pt-6 breadcrumbs_s">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      <AdminRegistrationsMain></AdminRegistrationsMain>
    </div>
  );
};

export default Registrationlistview;
