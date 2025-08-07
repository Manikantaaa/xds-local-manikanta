import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { useUserContext } from "@/context/store";
import useCommonPostData from "@/hooks/commonPostData";
import { authFetcher } from "@/hooks/fetcher";
import { Checkbox, Label, TextInput } from "flowbite-react";
import { useEffect, useState } from "react";

type updatedAddtopropstypes = {
  updatedAddto?: boolean | undefined;
  onVisibilityChange: (isVisible: boolean) => void;
  selectedCompanies: number[] | undefined;
};
const AddtoMyList = (updatedAddtoProps: updatedAddtopropstypes) => {
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
  const [status, setStatus] = useState("1");
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
  const { user } = useUserContext();
  useEffect(() => {
    if (isVisible) {
      async function getfounder() {
        try {
          const responsemylist = await authFetcher(
            getEndpointUrl(ENDPOINTS.getmylist(2)),
          );
          if (responsemylist.success) {
            setMyList(responsemylist.list);
          } else {
            console.log(
              `Api reponded with Status Code ${responsemylist.statusCode}`,
            );
          }
          const responsemyprojects = await authFetcher(
            getEndpointUrl(ENDPOINTS.getmyprojectslist(2)),
          );
          if (responsemyprojects.success) {
            setMyProjects(responsemyprojects.list);
          } else {
            console.log(
              `Api reponded with Status Code ${responsemyprojects.statusCode}`,
            );
          }
        } catch (error) {
          console.error(`Api reponded with Error: ${error}`);
        }
      }
      getfounder();
    }
  }, [isVisible]);

  function onClickStatus1(val: string) {
    setStatus(val);
    setselectedMyList([]);
    setselectedMyProjects([]);
    setisProjectValidationFailed(false);
    setisListValidationFailed(false);
    setAfteFormSubmitMessage(false);
    setisMyListButtonEnabled(true);
    setisMyListButtonEnabled(true);
  }

  useEffect(() => {
    setStatus("1");
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
  const { submitForm: submitMyProjectForm } = useCommonPostData<MylistFormData>(
    {
      url: getEndpointUrl(ENDPOINTS.addcompaniestomyprojet),
    },
  );

  const handleAddto = async () => {
    setAfteFormSubmitMessage(false);
    let loggedUserId = 2;
    if (user && user.id) {
      loggedUserId = user.id;
    }
    if (status == "1") {
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
          setNewmyListinput("");
          if (myListinputElement instanceof HTMLInputElement) {
            myListinputElement.value = "";
          }
        }
      } else {
        setisListValidationFailed(true);
      }
    } else {
      const myProjectinputElement = document.getElementById("new_project_name");
      let newmyprojectnames = "";
      if (myProjectinputElement instanceof HTMLInputElement) {
        newmyprojectnames = myProjectinputElement.value;
      }
      if (selectedmyprojects?.length || newmyprojectnames != "") {
        setisMyProjectButtonEnabled(false);
        const result = await submitMyProjectForm({
          loggedUserId: loggedUserId,
          companies: selectedCompanies,
          mylist: selectedmyprojects,
          newlistname: newmyprojectnames,
        });
        if (result.data.success) {
          setisMyProjectButtonEnabled(true);
          setAfteFormSubmitMessage(true);
          setselectedMyProjects([]);
          setNewmyProjectInput("");
          if (myProjectinputElement instanceof HTMLInputElement) {
            myProjectinputElement.value = "";
          }
        }
      } else {
        setisProjectValidationFailed(true);
      }
    }
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
              Add to...
            </h5>
            <div className="absolute right-3 top-4">
              <button
                type="button"
                className="bg-white hover:bg-gray-100 focus:ring-0 font-medium rounded-sm text-sm px-1.5 py-1"
                onClick={() => closeSideBar(false)}
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
                  <a
                    href="#"
                    onClick={() => {
                      onClickStatus1("1");
                    }}
                    className={`shrink-0 border-b-2 px-1 pb-2 font-bold text-sm  ${
                      status == "1"
                        ? "shrink-0 border-b-2 px-1  text-sky-600  border-sky-500 "
                        : "border-transparent default_text_color hover:border-gray-300 hover:text-gray-700"
                    }`}
                  >
                    My Lists
                  </a>
                  <a
                    href="#"
                    onClick={() => {
                      onClickStatus1("2");
                    }}
                    className={`shrink-0 border-b-2 px-1 pb-2 font-bold text-sm   ${
                      status == "2"
                        ? "shrink-0 border-b-2 px-1  text-sky-600  border-sky-500 "
                        : "border-transparent default_text_color hover:border-gray-300 hover:text-gray-700"
                    }`}
                  >
                    My Projects
                  </a>
                </nav>
              </div>
              {status == "1" ? (
                <>
                  <div className="py-6">
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
                        <p className="font-bold text-sm">Or addto a new list</p>
                        <div className="mb-2 block">
                          <Label
                            htmlFor="name_list"
                            value="Name the new list"
                            className="font-bold"
                          />
                        </div>
                        <TextInput
                        autoComplete="off"
                          name="new_mylist_name"
                          onChange={handleMylistinput}
                          id="new_mylist_name"
                          type="text"
                          required
                          readOnly={selectedmylist?.length ? true : false}
                        />
                      </div>
                    </div>
                    {isListValidationFailed ? (
                      <span className="errorclass text-red-650">
                        Please Select or Add atleast one List
                      </span>
                    ) : null}
                    {AfteFormSubmitMessage ? (
                      <span className="errorclass green_c">
                        Successfully Created
                      </span>
                    ) : null}
                  </div>
                  <div className="footer_bg flex  justify-between">
                    <div>
                      <button
                        type="submit"
                        className="p-0.5 font-medium  focus:outline-none border rounded-sm button_cancel h-[40px] px-6 text-sm"
                        onClick={() => closeSideBar(false)}
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
                        Create
                      </button>{" "}
                    </div>
                  </div>
                </>
              ) : status == "2" ? (
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
                        <p className="font-bold text-sm">Or addto a new list</p>
                        <div className="mb-2 block">
                          <Label
                            htmlFor="name_list"
                            value="Name the new list"
                            className="font-bold"
                          />
                        </div>
                        <TextInput
                        autoComplete="off"
                          onChange={handleMyProjectinput}
                          name="new_project_name"
                          id="new_project_name"
                          type="text"
                          required
                          readOnly={selectedmyprojects?.length ? true : false}
                        />
                      </div>
                    </div>
                    {isProjectValidationFailed ? (
                      <span className="errorclass text-red-650">
                        Please Select or Add atleast one Project
                      </span>
                    ) : null}
                    {AfteFormSubmitMessage ? (
                      <span className="errorclass green_c">
                        Successfully Created
                      </span>
                    ) : null}
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
                        Create
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                ""
              )}
            </div>
          </div>
        </div>
      )}
      {/* AddTo List Sidebar Popup  End*/}
    </>
  );
};

export default AddtoMyList;
