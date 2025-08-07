import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { PATH } from "@/constants/path";
import { useUserContext } from "@/context/store";
import useCommonPostData from "@/hooks/commonPostData";
import { authFetcher } from "@/hooks/fetcher";
import { Checkbox, Label, TextInput, Tooltip } from "flowbite-react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

type updatedAddtopropstypes = {
  updatedAddto?: boolean | undefined;
  onVisibilityChange: (isVisible: boolean) => void;
  setIsAddtoCompleted?: (isVisible: boolean) => void;
  selectedCompanies: number[] | undefined;
};
const AddtoMyList = (updatedAddtoProps: updatedAddtopropstypes) => {
  const { user } = useUserContext();
  if (!user) {
    redirect(PATH.HOME.path);
  }
  type MyTypes = {
    id: number;
    name: string;
  };
  type MylistFormData = {
    companies?: number[] | undefined;
    mylist?: number[] | undefined;
    newlistname?: string | undefined;
    loggedUserId?: number;
  };

  const [isVisible, setIsVisible] = useState<boolean>(false);
  // const [status, setStatus] = useState("1");
  const [mylist, setMyList] = useState([]);
  const [myprojects, setMyProjects] = useState([]);
  const [selectedmylist, setselectedMyList] = useState<number[] | undefined>();
  const [selectedmyprojects, setselectedMyProjects] = useState<
    number[] | undefined
  >();
  const [selectedCompanies, setsselectedCompanies] = useState<
    number[] | undefined
  >();

  const [newmylistinput, setNewmyListinput] = useState<string>();
  const [newmyprojectinput, setNewmyProjectInput] = useState<string>();
  // validation
  const [isListValidationFailed, setisListValidationFailed] =
    useState<boolean>();
  const [isProjectValidationFailed, setisProjectValidationFailed] =
    useState<boolean>();

  const [isMyListButtonEnabled, setisMyListButtonEnabled] =
    useState<boolean>(true);
  const [isMyProjectButtonEnabled, setisMyProjectButtonEnabled] =
    useState<boolean>(true);
  const [AfteFormSubmitMessage, setAfteFormSubmitMessage] =
    useState<boolean>(false);

  async function getfounder() {
    try {
      if (user) {
        const responsemylist = await authFetcher(
          getEndpointUrl(ENDPOINTS.getmylist(user.id || 1)),
        );
        if (responsemylist.success) {
          setMyList(responsemylist.list);
        } else {
          console.log(
            `Api reponded with Status Code ${responsemylist.statusCode}`,
          );
        }
      }
      // if (user) {
      //   const responsemyprojects = await authFetcher(
      //     getEndpointUrl(ENDPOINTS.getmyprojectslist(user.id)),
      //   );
      //   if (responsemyprojects.success) {
      //     setMyProjects(responsemyprojects.list);
      //   } else {
      //     console.log(
      //       `Api reponded with Status Code ${responsemyprojects.statusCode}`,
      //     );
      //   }
      // }
    } catch (error) {
      console.error(`Api reponded with Error: ${error}`);
    }
  }

  useEffect(() => {
    if (isVisible) {
      getfounder();
    }
  }, [isVisible]);

  // function onClickStatus1(val: string) {
  //   setStatus(val);
  //   setselectedMyList([]);
  //   setselectedMyProjects([]);
  //   setisProjectValidationFailed(false);
  //   setisListValidationFailed(false);
  //   setAfteFormSubmitMessage(false);
  //   setisMyListButtonEnabled(true);
  //   setisMyListButtonEnabled(true);
  // }

  useEffect(() => {
    // setStatus("1");
    setIsVisible(updatedAddtoProps.updatedAddto ?? false);
  }, [updatedAddtoProps]);
  useEffect(() => {
    setsselectedCompanies(updatedAddtoProps.selectedCompanies);
  }, [updatedAddtoProps.selectedCompanies]);

  const closeSideBar = (isclosed: boolean) => {
    updatedAddtoProps.onVisibilityChange(isclosed);
  };
  const handleMyList = (listId: number) => {
    setisListValidationFailed(false);
    let updatedMylist: number[] = [];
    if (selectedmylist) {
      updatedMylist = [...selectedmylist];
      const isSelected = updatedMylist.includes(listId);
      if (isSelected) {
        updatedMylist = selectedmylist.filter((list) => list != listId);
      } else {
        updatedMylist.push(listId);
      }
    } else {
      updatedMylist.push(listId);
    }
    setselectedMyList(updatedMylist);
  };
  const handleMyProjects = (listId: number) => {
    setisProjectValidationFailed(false);
    let updatedMyProjects: number[] = [];
    if (selectedmyprojects) {
      updatedMyProjects = [...selectedmyprojects];
      const isSelected = updatedMyProjects.includes(listId);
      if (isSelected) {
        updatedMyProjects = selectedmyprojects.filter((list) => list != listId);
      } else {
        updatedMyProjects.push(listId);
      }
    } else {
      updatedMyProjects.push(listId);
    }
    setselectedMyProjects(updatedMyProjects);
  };

  const { submitForm: submitMylListForm } = useCommonPostData<MylistFormData>({
    url: getEndpointUrl(ENDPOINTS.addcompaniestomylist),
  });
  // const { submitForm: submitMyProjectForm } = useCommonPostData<MylistFormData>(
  //   {
  //     url: getEndpointUrl(ENDPOINTS.addcompaniestomyprojet),
  //   },
  // );

  const handleAddto = async () => {
    setAfteFormSubmitMessage(false);
    let loggedUserId = undefined;
    if (user && user.id) {
      loggedUserId = user.id;
    }
    // if (status == "1") {
      const myListinputElement = document.getElementById("new_mylist_name");
      let newmylistname = "";
      if (myListinputElement instanceof HTMLInputElement) {
        newmylistname = myListinputElement.value;
      }
      if (selectedmylist?.length || newmylistname != "") {
        setisMyListButtonEnabled(false);
        const result = await submitMylListForm({
          loggedUserId: loggedUserId,
          companies: selectedCompanies,
          mylist: selectedmylist,
          newlistname: newmylistname,
        });
        if (result.data.success) {
          setisMyListButtonEnabled(true);
          setAfteFormSubmitMessage(true);
          setselectedMyList([]);
          updatedAddtoProps.setIsAddtoCompleted && updatedAddtoProps.setIsAddtoCompleted(true);
          setNewmyListinput("");
          if (myListinputElement instanceof HTMLInputElement) {
            myListinputElement.value = "";
          }
          setTimeout(() => {
            setAfteFormSubmitMessage(false);
            closeSideBar(false);
          }, 1000);
        }
      } else {
        setisListValidationFailed(true);
      }
    // } else {
    //   const myProjectinputElement = document.getElementById("new_project_name");
    //   let newmyprojectnames = "";
    //   if (myProjectinputElement instanceof HTMLInputElement) {
    //     newmyprojectnames = myProjectinputElement.value;
    //   }
    //   if (selectedmyprojects?.length || newmyprojectnames != "") {
    //     setisMyProjectButtonEnabled(false);
    //     const result = await submitMyProjectForm({
    //       loggedUserId: loggedUserId,
    //       companies: selectedCompanies,
    //       mylist: selectedmyprojects,
    //       newlistname: newmyprojectnames,
    //     });
    //     if (result.data.success) {
    //       setisMyProjectButtonEnabled(true);
    //       setAfteFormSubmitMessage(true);
    //       setselectedMyProjects([]);
    //       setNewmyProjectInput("");
    //       if (myProjectinputElement instanceof HTMLInputElement) {
    //         myProjectinputElement.value = "";
    //       }
    //       setTimeout(() => {
    //         setAfteFormSubmitMessage(false);
    //         closeSideBar(false);
    //       }, 1000);
    //     }
    //   } else {
    //     setisProjectValidationFailed(true);
    //   }
    // }
    
  };

  const handleMylistinput = () => {
    setisListValidationFailed(false);
    const myListinputElement = document.getElementById("new_mylist_name");
    if (myListinputElement instanceof HTMLInputElement) {
      setNewmyListinput(myListinputElement.value);
    }
  };
  const handleMyProjectinput = () => {
    setisProjectValidationFailed(false);
    const myListinputElement = document.getElementById("new_project_name");
    if (myListinputElement instanceof HTMLInputElement) {
      setNewmyProjectInput(myListinputElement.value);
    }
  };
  return (
    <>
      {/* AddTo List Sidebar Popup */}
      {isVisible && (
        <div className="addto_sidebar_list">
          <div className="block p-6 bg-white border border-gray-200 shadow-lg width_400">
            <h5 className="font-bold default_text_color header-font">
              Add to... ({selectedCompanies?.length})
            </h5>
            <div className="absolute right-3 top-4">
              <button
                type="button"
                className="bg-white hover:bg-gray-100 focus:ring-0 font-medium rounded-sm text-sm px-1.5 py-1"
                onClick={() => {closeSideBar(false); setisListValidationFailed(false)}}
                aria-label="Close Sidebar"
              >
                <svg
                  className="w-[18px] h-[18px]"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18 18 6m0 12L6 6"
                  />
                </svg>
              </button>
            </div>
            <div className="sm:block pt-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex gap-6" aria-label="Tabs">
                  <span
                    onClick={() => {
                      // onClickStatus1("1");
                    }}
                    // className={`cursor-pointer flex shrink-0 border-b-2 px-1 pb-2 font-bold text-sm  ${
                    //   status == "1"
                    //     ? "shrink-0 border-b-2 px-1  text-sky-600  border-sky-500 "
                    //     : "border-transparent default_text_color hover:border-gray-300 hover:text-gray-700"
                    // }`}
                    className={`cursor-pointer flex shrink-0 border-b-2 px-1 pb-2 font-bold text-sm shrink-0 border-b-2 px-1  text-sky-600  border-sky-500 `}
                  >
                    My Lists{" "}
                    <Tooltip
                      content="Create and manage lists of Service Providers, share with others"
                      className="tier_tooltip"
                    >
                      <svg
                        className="ms-2 w-[18px] h-[18px] text-gray-600 dark:text-white"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M2 12a10 10 0 1 1 20 0 10 10 0 0 1-20 0Zm9-3a1.5 1.5 0 0 1 2.5 1.1 1.4 1.4 0 0 1-1.5 1.5 1 1 0 0 0-1 1V14a1 1 0 1 0 2 0v-.5a3.4 3.4 0 0 0 2.5-3.3 3.5 3.5 0 0 0-7-.3 1 1 0 0 0 2 .1c0-.4.2-.7.5-1Zm1 7a1 1 0 1 0 0 2 1 1 0 1 0 0-2Z"
                          clip-rule="evenodd"
                        />
                      </svg>{" "}
                    </Tooltip>
                  </span>
                  {/* <span
                    onClick={() => {
                      onClickStatus1("2");
                    }}
                    className={`cursor-pointer flex shrink-0 border-b-2 px-1 pb-2 font-bold text-sm   ${
                      status == "2"
                        ? "shrink-0 border-b-2 px-1  text-sky-600  border-sky-500 "
                        : "border-transparent default_text_color hover:border-gray-300 hover:text-gray-700"
                    }`}
                  >
                    My Projects{" "}
                    <Tooltip
                      content="Create projects, add Service Providers and share with others"
                      className="tier_tooltip"
                    >
                      <svg
                        className="ms-2 w-[18px] h-[18px] text-gray-600 dark:text-white"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M2 12a10 10 0 1 1 20 0 10 10 0 0 1-20 0Zm9-3a1.5 1.5 0 0 1 2.5 1.1 1.4 1.4 0 0 1-1.5 1.5 1 1 0 0 0-1 1V14a1 1 0 1 0 2 0v-.5a3.4 3.4 0 0 0 2.5-3.3 3.5 3.5 0 0 0-7-.3 1 1 0 0 0 2 .1c0-.4.2-.7.5-1Zm1 7a1 1 0 1 0 0 2 1 1 0 1 0 0-2Z"
                          clip-rule="evenodd"
                        />
                      </svg>{" "}
                    </Tooltip>
                  </span> */}
                </nav>
              </div>
              {/* {status == "1" ? (
                <> */}
                  <div className="pt-6 add_to_list">
                    <div className="flex max-w-md flex-col gap-4">
                      {/* <div className="flex items-center gap-2">
                            <Checkbox id="accept" defaultChecked />
                            <Label htmlFor="accept" className="flex">AD Studios</Label>
                          </div> */}
                      {mylist.map((list: MyTypes) => (
                        <div
                          key={`key_list_${list.id}`}
                          className="flex items-center gap-2"
                        >
                          <Checkbox
                            id={`list_${list.id}`}
                            checked={selectedmylist?.includes(list.id)}
                            onChange={() => handleMyList(list.id)}
                            disabled={newmylistinput ? true : false}
                          />
                          <Label htmlFor={`list_${list.id}`}>{list.name}</Label>
                        </div>
                      ))}
                      <div className="pb-6">
                        <p className="font-bold text-sm">
                          Or add to a new list
                        </p>
                        <div className="mb-2 block">
                          <Label
                            htmlFor="name_list"
                            className="font-bold"
                          />
                        </div>
                        <TextInput
                        autoComplete="off"
                          name="new_mylist_name"
                          onChange={handleMylistinput}
                          id="new_mylist_name"
                          type="text"
                          placeholder="Name the new list"
                          required
                          readOnly={selectedmylist?.length ? true : false}
                        />
                        {isListValidationFailed ? (
                          <span className="errorclass text-red-650">
                            Please Select or Add atleast one List
                          </span>
                        ) : null}
                        {AfteFormSubmitMessage ? (
                          <span className="errorclass green_c text-sm">
                            Successfully Added
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="footer_bg flex  justify-between">
                    <div>
                      <button
                        type="submit"
                        className="p-0.5 font-medium  focus:outline-none border rounded-sm button_cancel h-[40px] px-6 text-sm"
                        onClick={() => {closeSideBar(false); setisListValidationFailed(false)}}
                      >
                        Cancel
                      </button>{" "}
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={handleAddto}
                        disabled={!isMyListButtonEnabled}
                        className="p-0.5 font-medium  focus:outline-none text-white text-sm border-transparent  rounded-sm focus:ring-0 button_blue h-[40px] px-6"
                      >
                        Save
                      </button>{" "}
                    </div>
                  </div>
                {/* </> */}
              {/* ) : status == "2" ? (
                <>
                  <div className="py-6">
                    <div className="flex max-w-md flex-col gap-4">
                      {myprojects.map((projects: MyTypes) => (
                        <div
                          key={`key_projet_${projects.id}`}
                          className="flex items-center gap-2"
                        >
                          <Checkbox
                            id={`project_${projects.id}`}
                            checked={selectedmyprojects?.includes(projects.id)}
                            onChange={() => handleMyProjects(projects.id)}
                            disabled={newmyprojectinput ? true : false}
                          />
                          <Label htmlFor={`project_${projects.id}`}>
                            {projects.name}
                          </Label>
                        </div>
                      ))}
                      <div className="pb-6">
                        <p className="font-bold text-sm">
                          Or add to a new project
                        </p>
                        <div className="mb-2 block">
                          <Label
                            htmlFor="name_list"
                            className="font-bold"
                          />
                        </div>
                        <TextInput
                        autoComplete="off"
                          onChange={handleMyProjectinput}
                          name="new_project_name"
                          id="new_project_name"
                          type="text"
                          placeholder="Name the new list"
                          required
                          readOnly={selectedmyprojects?.length ? true : false}
                        />
                        {isProjectValidationFailed ? (
                          <span className="errorclass text-red-650">
                            Please Select or Add atleast one Project
                          </span>
                        ) : null}
                        {AfteFormSubmitMessage ? (
                          <span className="errorclass green_c text-sm">
                            Successfully Added
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="footer_bg flex  justify-between">
                    <div>
                      <button
                        type="submit"
                        disabled={!isMyProjectButtonEnabled}
                        className="p-0.5 font-medium  focus:outline-none border rounded-sm button_cancel h-[40px] px-6 text-sm"
                        onClick={() => setIsVisible(false)}
                      >
                        Cancel
                      </button>{" "}
                    </div>
                    <div>
                      <button
                        type="button"
                        className="p-0.5 font-medium  focus:outline-none text-white text-sm border-transparent  rounded-sm focus:ring-0 button_blue h-[40px] px-6"
                        onClick={handleAddto}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                ""
              )} */}
            </div>
          </div>
        </div>
      )}
      {/* AddTo List Sidebar Popup  End*/}
    </>
  );
};

export default AddtoMyList;
