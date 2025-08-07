"use client";

import AdminUsersGetById from "@/components/admin/admin-users-get-by-id";

interface UserByIdParams {
  params: { id: number | undefined };
}

const UserById = (params: UserByIdParams) => {
  return (
    <div className="w-full px-5 pos_r">
      { 
        (params.params.id)  ? <AdminUsersGetById userId={+params.params.id}></AdminUsersGetById> : "" 
      } 
    </div>
  );
};
export default UserById;
