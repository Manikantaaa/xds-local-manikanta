"use client";
import Breadcrumbs from "@/components/breadcrumb";
import { PATH } from "@/constants/path";
import { Button, Label, Select, TextInput, Textarea } from "flowbite-react";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { useState, useEffect } from "react";
import { redirect, useRouter } from "next/navigation";
import Link from "next/link";
import { useUserContext } from "@/context/store";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import useCommonPostData from "@/hooks/commonPostData";
import { fetcher } from "@/hooks/fetcher";
import Multiselect from "multiselect-react-dropdown";
import { toast } from "react-toastify";
import { sanitizeData } from "@/services/sanitizedata";
import { useAuthentication } from "@/services/authUtils";
import ButtonSpinner from "@/components/ui/buttonspinner";
interface CreateProjectData {
  name: string;
  description: string;
  userId?: number;
  companies: [],
}
const CreateMyproject = () => {
  const { user } = useUserContext();
  const [isloading, setIsloading] = useState<boolean>(true);
  const [buttonLoader, setButtonLoader] = useState<boolean>(false);
  const [isListexist, setIsListexist] = useState<boolean>(false);
  useAuthentication({ user, isBuyerRestricted: false, isPaidUserPage: true });
  
  const [companyOptions, setCompanyOptions] = useState<string[]>([]);

  useEffect (() => {

    const getMylist = async () =>{
      try {
            const response = await fetcher(
              getEndpointUrl(ENDPOINTS.searchMylists('0')),
          );
          if (response.success) {
            setCompanyOptions(response.data);
            console.log((response.data));
            if(response.data.length > 0) {
            setIsListexist(true);
            }
          }
          setIsloading(false);
        } catch (error) {
          console.error("Error fetching companies:", error);
          setIsloading(false);
        }
    }
    getMylist();

  },[]);

  const router = useRouter();
  const [userId, setUserId] = useState<number>();
  const [errUser, setUserError] = useState<string>("");
  const breadcrumbItems = [
    {
      label: PATH.HOME.name,
      path: PATH.HOME.path,
    },
    {
      label: PATH.MYPROJECTS.name,
      path: PATH.MYPROJECTS.path,
    },
    {
      label: PATH.NEWPROJECT.name,
      path: PATH.NEWPROJECT.path,
    },
  ];
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
  useEffect(() => {
    setUserId(user?.id);
  }, [user?.id]);

  const { error, success, submitForm } = useCommonPostData<CreateProjectData>({
    url: getEndpointUrl(ENDPOINTS.createproject),
  });

  const onSubmit = ((data: CreateProjectData) => {
    setButtonLoader(true);
    if (!userId) {
      setUserError("User not Logged In");
      return;
    }
    data.userId = user?.id ? user?.id : 1;
    const sanitizedData: CreateProjectData = sanitizeData(data) as CreateProjectData;
    sanitizedData.description = sanitizedData.description;
    sanitizedData.name = sanitizedData.name;
    submitForm(sanitizedData).then((response) => {
      setButtonLoader(false);
      if (response.data && response.data.success !== true) {
        toast.error('An Error occurred, Try Again Later');
      } else {
        toast.success('Project successfully created 👍');
        router.push(`/my-projects/${response.data.data}`);
      }
    }).catch((err) => {
      console.log(err);
      setButtonLoader(false);
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
    {!isloading &&
      <div className="w-full lg:container px-5 pos_r">
        <div className="pb-6 pt-6 breadcrumbs_s">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
        <div className="flex justify-between">
          <div className="text-left">
            <h1 className="header-font">New Project</h1>
          </div>
        </div>
        <div className="pt-6">
          <hr />
        </div>
        {error && (
          <span className="font-medium text-red-500 text-xs mt-5">{error}</span>
        )}
        {errUser && (
          <span className="font-medium text-red-500 text-xs mt-5">{errUser}</span>
        )}
        <form className="space-y-6 lg:w-[25rem]" onSubmit={handleSubmit(onSubmit)}>
          <div className="pt-6">
            <div className="flex max-w-md flex-col gap-6">
              <div className="projectname">
                <div className="mb-2 block">
                  <Label
                    htmlFor="base"
                    value="Project Name "
                    className="font-bold text-xs"
                  />
                  <span className="text-red-600 font-bold text-xs">*</span>
                </div>

                <TextInput
                  autoComplete="off"
                  id="name"
                  placeholder="Enter Project Name"
                  className="focus:border-blue-300"
                  {...register("name", {
                    required: {
                      value: true,
                      message: "Project name is required",
                    },
                  })}
                  type="text"
                  sizing="md"
                />
                <p className="text-red-600 text-xs">
                  {typeof errors?.name?.message === "string" &&
                    errors?.name?.message}
                </p>
              </div>

              <div className="projectcompanies">
                <div className="mb-2 block">
                  <Label
                    htmlFor="base"
                    value="Add Lists"
                    className="font-bold text-xs"
                  />

                </div>
                    {companyOptions && companyOptions.length > 0 ?
                      <>
                        <Multiselect
                          emptyRecordMsg="-"
                          className="block w-full"
                          options={companyOptions}
                          displayValue="name"
                          onSelect={(e) => onAddOrRemovePlatforms(e)}
                          onRemove={(e) => onAddOrRemovePlatforms(e)}
                          placeholder="Search by List Name"
                        // onSearch={handleSearch}
                          {...register("companies")}
                        />
                        <p className="text-red-600 text-xs">
                          {typeof errors?.name?.message === "string" &&
                            errors?.name?.message}
                        </p>
                      </>
                      :
                      <>
                      {!isListexist && 
                        <div className="flex items-start p-4 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
                          <svg className="flex-shrink-0 inline w-4 h-4 me-3 top-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
                          </svg>
                          <div className="italic font-medium"> You have not yet created lists of Service Providers in the My Lists section. If you choose to continue to create a new project, you can add lists later.           
                          </div>
                        </div>
                      }
                      </>
                    }
                
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
                  placeholder="Briefly describe the Project here."
                  // value={description}
                  {...register("description")}
                  rows={6}
                />
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="submit"
                  className="button_cancel h-[40px] px-4 border-gray-50-100"
                  disabled={buttonLoader}
                >
                  <Link prefetch={false} href="/my-projects">Cancel</Link>
                </Button>
                <Button type="submit" className="button_blue h-[40px] px-4" disabled={buttonLoader}>
                  { buttonLoader ? <ButtonSpinner></ButtonSpinner> : 'Create'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    }
    </>
  );
};
export default CreateMyproject;

