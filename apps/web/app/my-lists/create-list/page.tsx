"use client";
import Breadcrumbs from "@/components/breadcrumb";
import { PATH } from "@/constants/path";
import { Button, Label, TextInput, Textarea, Tooltip } from "flowbite-react";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { useEffect, useState } from "react";
import { redirect, useRouter } from "next/navigation";
import Link from "next/link";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { useUserContext } from "@/context/store";
import useCommonPostData from "@/hooks/commonPostData";
import Multiselect from "multiselect-react-dropdown";
import { useSearchCompanies } from "@/hooks/useSearchcompanies";
import { toast } from "react-toastify";
import { sanitizeData } from "@/services/sanitizedata";
import { useAuthentication } from "@/services/authUtils";
import ButtonSpinner from "@/components/ui/buttonspinner";
interface CreateListData {
  name: string;
  description: string;
  userId?: number;
}
const Createnewlist = () => {
  const { handleSearch, companyOptions } = useSearchCompanies();
  const router = useRouter();
  const [userId, setUserId] = useState<number>();
  const { user } = useUserContext();
  const [errUser, seterrUser] = useState<string>("");
  const [buttonLoader, setButtonLoader] = useState<boolean>(false);
  // if (!user) {
  //   redirect(PATH.HOME.path);
  // }
  useAuthentication({ user, isBuyerRestricted: false, isPaidUserPage: true });
  const {
    register,
    setValue,
    formState: { errors },
    handleSubmit,
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      companies: [],
    },
  });
  const breadcrumbItems = [
    {
      label: PATH.HOME.name,
      path: PATH.HOME.path,
    },
    {
      label: PATH.MYLISTS.name,
      path: PATH.MYLISTS.path,
    },
    {
      label: PATH.NEWLIST.name,
      path: PATH.NEWLIST.path,
    },
  ];



  useEffect(() => {
    setUserId(user?.id);
  }, [user?.id]);


  const { error, success, submitForm } = useCommonPostData<CreateListData>({
    url: getEndpointUrl(ENDPOINTS.createlist),
  });

  const onSubmit = (async (data: CreateListData) => {
    setButtonLoader(true);
    seterrUser("");
    if (!userId) {
      seterrUser("User not logged in");
      return;
    }
    data.userId = user?.id ? user?.id : 1;
    const sanitizedData: CreateListData = sanitizeData(data) as CreateListData;
    sanitizedData.description = sanitizedData.description;
    sanitizedData.name = sanitizedData.name;
    submitForm(sanitizedData).then((response) => {
      setButtonLoader(false);
      if (response.data && response.data.success !== true) {
        toast.error('An Error occurred, Try Again Later');
      } else {
        toast.success('List successfully created 👍');
        router.push(`/my-lists/${response.data.data.id}`);
      }
    }).catch((err) => {
      setButtonLoader(false);
      console.log(err);
      toast.error('An Error occurred, Try Again Later')
    });
  }) as SubmitHandler<FieldValues>;
  function onAddOrRemovePlatforms(
    theSelectedPlatforms: { id: number; name: string }[],
  ) {
    const companies: number[] = [];
    for (const item of theSelectedPlatforms) {
      companies.push(item.id);
    }
    setValue(`companies`, companies as never[]);
  }
  return (
    <>
      <div className="w-full lg:container px-5 pos_r">
        <div className="pb-6 pt-6 breadcrumbs_s">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
        <div className="flex justify-between">
          <div className="text-left">
            <h1 className="default_text_color header-font">New List</h1>
          </div>
        </div>
        <div className="pt-6">
          <hr />
        </div>
        {error && (
          <span className="font-medium text-red-500 text-xs mt-5">{error}</span>
        )}
        {errUser && (
          <span className="font-medium text-red-500 text-xs mt-5">
            {errUser}
          </span>
        )}
        <form
          className="space-y-6 lg:w-[25rem]"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="pt-6">
            <div className="flex max-w-md flex-col gap-6">
              <div className="projectname">
                <TextInput
                  autoComplete="off"
                  id="userId"
                  className="focus:border-blue-300"
                  type="hidden"
                  sizing="md"
                  value={userId ? userId.toString() : ""}
                />
                <div className="mb-2 block">
                  <Label
                    htmlFor="base"
                    value="List Name "
                    className="font-bold text-xs"
                  />
                  <span className="text-red-600 font-bold text-xs">*</span>
                </div>
                <TextInput
                  autoComplete="off"
                  id="name"
                  placeholder="Enter List Name"
                  className="focus:border-blue-300"
                  type="text"
                  sizing="md"
                  {...register("name", {
                    required: {
                      value: true,
                      message: "List name is required",
                    },
                  })}
                />
                <p className="text-red-600 text-xs">
                  {typeof errors?.name?.message === "string" &&
                    errors?.name?.message}
                </p>
              </div>
              <div className="projectcompanies relative">
                <div className="mb-2 block">
                  <Label
                    htmlFor="base"
                    value="Add Service Providers"
                    className="font-bold text-xs"
                  />

                </div>
                <div className=" pl-2 absolute left-32 top-0.5">
                  <Tooltip
                    content="Search by Service Provider name, or go to Browse Service Providers above and use the Add To feature to select and add companies to lists."
                    className="tier_tooltip"
                  >
                    <svg
                      className="w-[16px] h-[16px] text-gray-600 dark:text-white"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2 12a10 10 0 1 1 20 0 10 10 0 0 1-20 0Zm9.4-5.5a1 1 0 1 0 0 2 1 1 0 1 0 0-2ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4c0-.6-.4-1-1-1h-2Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Tooltip>
                </div>
                <Multiselect
                  emptyRecordMsg="-"
                  className="block w-full appearance-none outline-none"
                  options={companyOptions}
                  displayValue="name"
                  onSelect={(e) => onAddOrRemovePlatforms(e)}
                  onRemove={(e) => onAddOrRemovePlatforms(e)}
                  placeholder="Search by Service Provider Name"
                  onSearch={handleSearch}
                  {...register("companies")}
                />
                {/* <p className="text-red-600 text-xs">
                  {typeof errors?.name?.message === "string" &&
                    errors?.name?.message}
                </p> */}
              </div>
              <div className="desc">
                <div className="mb-2 block">
                  <Label
                    htmlFor="base"
                    value="Description"
                    className="font-bold text-xs"
                  />
                </div>
                <Textarea
                  id="description"
                  placeholder="Briefly describe the List here."
                  rows={6}
                  {...register("description")}
                />
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  className="button_cancel h-[40px] px-4 border-gray-50-100"
                >
                  <Link prefetch={false} href="/my-lists" className="link_color">
                    {" "}
                    Cancel{" "}
                  </Link>
                </Button>
                <Button type="submit" className="button_blue h-[40px] px-4" disabled={buttonLoader}>
                  { buttonLoader ? <ButtonSpinner></ButtonSpinner> : 'Create'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};
export default Createnewlist;
