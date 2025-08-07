"use client";
import AdminRegistrationsGetById from "@/components/admin/admin-registrations-get-by-id";

interface UserByIdParams {
  params: { id: number | undefined };
}
const RegisteredUserById = (params: UserByIdParams) => {
  return (
    <div className="w-full px-5 pos_r">
      {
        (params.params.id) ? <AdminRegistrationsGetById registrationId={+params.params.id}></AdminRegistrationsGetById> : ""
      }
    </div>
  );
};
export default RegisteredUserById;
