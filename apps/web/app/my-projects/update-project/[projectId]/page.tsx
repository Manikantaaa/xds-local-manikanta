"use client";
import Breadcrumbs from "@/components/breadcrumb";
import { PATH } from "@/constants/path";
import { Button, Label, TextInput, Textarea } from "flowbite-react";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { useState, useEffect } from "react";
import { redirect, useRouter } from "next/navigation";
import Link from "next/link";
import { fetcher } from "@/hooks/fetcher";
import { useUserContext } from "@/context/store";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import commonPatchData from "@/hooks/commonPatchData";
import Multiselect from "multiselect-react-dropdown";
import { useSearchCompanies } from "@/hooks/useSearchcompanies";
import { toast } from "react-toastify";
import { sanitizeData } from "@/services/sanitizedata";
import { useAuthentication } from "@/services/authUtils";
import Spinner from "@/components/spinner";
import ButtonSpinner from "@/components/ui/buttonspinner";

interface UpdateListData {
  name: string;
  description: string;
  userId?: number;
}
const Updateproject = (params: { params: { projectId: number } }) => {
  const { user } = useUserContext();
  useAuthentication({ user, isBuyerRestricted: false , isPaidUserPage: true });
  const router = useRouter();
  const [userId, setUserId] = useState<number>();
  const [errUser, seterrUser] = useState<string>("");
  // const { handleSearch, companyOptions } = useSearchCompanies();
  // const { handleSearch, companyOptions } = useSearchMylists();
  const [selectedOptionCompanies, SetSelectedOptionCompanies] = useState<string[]>([]);
  const [canRender, setCanRender] = useState(false);
  const [companyOptions, setCompanyOptions] = useState<string[]>([]);
  const [isListexist, setIsListexist] = useState<boolean>(false);
  const [buttonLoader, setButtonLoader] = useState<boolean>(false);
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
      label: PATH.MYPROJECTS.name,
      path: PATH.MYPROJECTS.path,
    },
    {
      label: "Update Project",
      path: "Update Project",
    },
  ];

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
          setCanRender(true);
        } catch (error) {
          console.error("Error fetching companies:", error);
          setCanRender(true);
        }
    }
    getMylist();

  },[]);

  useEffect(() => {
    if (params.params.projectId) {
      const companiesList = async () => {
        try {
          const dataa = await fetcher(
            getEndpointUrl(ENDPOINTS.getmyprojectbyid(params.params.projectId)),
          );
          const data = dataa?.list;
          setValue("name", data[0].name);
          setValue("description", data[0].description);
          console.log(dataa.list[0].MyIntrestedProjectsList);
          if (dataa.list[0] && dataa.list[0].MyIntrestedProjectsList.length > 0) {
            
            const setselectedvalues = dataa.list[0].MyIntrestedProjectsList.map((intrstedLists: { list: { id: number, name: string } }) => (
              { id: intrstedLists.list.id, name: intrstedLists.list.name}
            ));
            console.log(setselectedvalues);
            const companyIds = setselectedvalues.map((company: { id: number }) => company.id);
            setValue("companies", companyIds)
            SetSelectedOptionCompanies(setselectedvalues);
          }
          console.log(selectedOptionCompanies);
          setCanRender(true);
        } catch (error) {
          console.error("Error fetching my lists:", error);
        }
      };
      companiesList();
    }
  }, [params]);
  useEffect(() => {
    setUserId(user?.id);
  }, [user?.id]);
  const { error, success, submitForm } = commonPatchData<UpdateListData>({
    url: getEndpointUrl(ENDPOINTS.updatemyproject(params.params.projectId)),
  });

  const onSubmit = ((data: UpdateListData) => {
    setButtonLoader(true);
    seterrUser("");
    if (!userId) {
      seterrUser("User not Logged in");
      return;
    }

    data.userId = user?.id ? user?.id : 1;
    const sanitizedData:UpdateListData = sanitizeData(data) as UpdateListData;
    sanitizedData.description = sanitizedData.description;
    sanitizedData.name = sanitizedData.name;
    submitForm(sanitizedData).then((response) => {
      if (response.data && response.status !== 200) {
        setButtonLoader(false);
        toast.error('An Error occurred, Try Again Later');
      }else{
        setButtonLoader(false);
        toast.success('Project successfully updated 👍');
        const timeoutId = setTimeout(() => {
          router.push(`/my-projects/${params.params.projectId}`);
        }, 500);
        return () => clearTimeout(timeoutId);
      }
    }).catch((err) => {
      console.log(err);
      setButtonLoader(false);
      toast.error('An Error occurred, Try Again Later')
    });
  }) as SubmitHandler<FieldValues>;

  function onAddOrRemovePlatforms(
    theSelectedCompanies: { id: number; name: string }[],
  ) {
    const companies: number[] = [];
    for (const item of theSelectedCompanies) {
      companies.push(item.id);
    }
    setValue(`companies`, companies as never[]);
  }
  return (
    <>
      {
        canRender ? 
        <div className="w-full lg:container px-5 pos_r">
          <div className="pb-6 pt-6 breadcrumbs_s">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
          <div className="flex justify-between">
            <div className="text-left">
              <h1 className="default_text_color header-font">Update Project</h1>
            </div>
          </div>
          <div className="pt-6">
            <hr />
          </div>
          {error && (
            <span className="pt-6 font-medium text-red-500 text-xs mt-5">
              {error}
            </span>
          )}
          {errUser && (
            <span className="pt-6 font-medium text-red-500 text-xs mt-5">
              {errUser}
            </span>
          )}
          <form className="space-y-6 Lg:w-[25rem]" onSubmit={handleSubmit(onSubmit)}>
            <div className="pt-6">
              <div className="flex max-w-md flex-col gap-6">
                <div className="projectname">
                  <TextInput
                    id="userId"
                    autoComplete="off"
                    className="focus:border-blue-300"
                    type="hidden"
                    sizing="md"
                    value={userId ? userId.toString() : ""}
                  />
                  <div className="mb-2 block">
                    <Label
                      htmlFor="base"
                      value="Project Name "
                      className="font-bold text-xs"
                    />
                    <span className="text-red-600 font-bold text-xs">*</span>
                  </div>
                  <TextInput
                    id="name"
                    autoComplete="off"
                    placeholder="Enter Project Name"
                    className="focus:border-blue-300"
                    type="text"
                    sizing="md"
                    {...register("name", {
                      required: {
                        value: true,
                        message: "Project name is required",
                      },
                    })}
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
                      <Multiselect
                        emptyRecordMsg="-"
                        className="block w-full"
                        options={companyOptions}
                        displayValue="name"
                        onSelect={(e) => onAddOrRemovePlatforms(e)}
                        onRemove={(e) => onAddOrRemovePlatforms(e)}
                        placeholder="Search by List Name"
                        // onSearch={handleSearch}
                        selectedValues={selectedOptionCompanies}
                        {...register("companies")}
                      /> 
                      :
                      <>
                        {!isListexist && 
                          <div className="flex items-start p-4 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
                          <svg className="flex-shrink-0 inline w-4 h-4 me-3 top-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
                          </svg>
                          <div className="italic font-medium">  You have not yet created lists of Service Providers in the My Lists section. If you choose to continue to create a new project, you can add lists later.
                          </div>
                        </div>
                        }
                      </>
                    
                    }
                      
                  <p className="text-red-600 text-xs">
                    {typeof errors?.name?.message === "string" &&
                      errors?.name?.message}
                  </p>
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
                    rows={6}
                    {...register("description")}
                  />
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    className="button_cancel h-[40px] px-4 border-gray-50-100"
                    disabled={buttonLoader}
                  >
                    <Link prefetch={false} href="/my-projects"> Cancel </Link>
                  </Button>
                  <Button type="submit" className="button_blue h-[40px] px-4" disabled={buttonLoader}>
                    {buttonLoader ? <ButtonSpinner></ButtonSpinner> : 'Update'}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
        :
        <div className="min-h-screen flex justify-center items-center">
          <Spinner />
        </div> 
      }
      
    </>
  );
};
export default Updateproject;
