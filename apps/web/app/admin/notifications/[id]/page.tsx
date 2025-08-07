"use client";
import Breadcrumbs from "@/components/breadcrumb";
import { PATH } from "@/constants/path";
import Link from "next/link";
import { Button, Checkbox, Label, TextInput } from "flowbite-react";
import { useEffect, useState } from "react";
import { authFetcher, authPutWithData } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { useRouter } from "next/navigation";
import ReactQuill from "react-quill";
import 'react-quill/dist/quill.snow.css';
import Spinner from "@/components/spinner";
import { sanitizeData } from "@/services/sanitizedata";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "quill-emoji/dist/quill-emoji.css";
import Emoji from "quill-emoji";
import ButtonSpinner from "@/components/ui/buttonspinner";

ReactQuill.Quill.register("modules/emoji", Emoji);

interface UserByIdParams {
  params: { id: number };
}

const CreateOrUpdateNotification = (params: UserByIdParams) => {
  const [notificationId, setNotificationId] = useState<number>(0);
  const [patName, setPathName] = useState<string>('Add');
  const [faqAnswer, setFaqAnswer] = useState<string>('');
  const [anserrmsg, setAnserrmsg] = useState<string>('');
  const [notifiDescLenth, setNotifiDescLenth] = useState<number>(0);
  const [display, setDisplay] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<Date|null>();
  const [stringStartDate, setStringStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<Date | null>();
  const [stringEndDate, setStringEndDate] = useState<string>('');
  const [validating, setvalidating] = useState<string>('');
  const [loader, setLoader] = useState<boolean>(false);
  const router = useRouter();
  useEffect(() => {
    if(params.params.id && params.params.id != 0) {
        setNotificationId(params.params.id);
      setPathName('Edit');
    }
    const getFaqDataById = async() => {
      setIsLoading(true);
      const allFaqQuestions = await authFetcher(
        getEndpointUrl(ENDPOINTS.getNotificationById(+params.params.id)),
      );
      if (allFaqQuestions) {
          setFaqAnswer(allFaqQuestions.notificationDescription);
          setDisplay(allFaqQuestions.isDisplay);
          if(allFaqQuestions.startDate != null && allFaqQuestions.endDate != null) {
            setStartDate(allFaqQuestions.startDate);
            setEndDate(allFaqQuestions.endDate);
            const startDateString = new Date(allFaqQuestions.startDate).toLocaleDateString('en-US');
            setStringStartDate(startDateString);
            const endDateString = new Date(allFaqQuestions.endDate).toLocaleDateString('en-US');
            setStringEndDate(endDateString);
          }
        }
      setIsLoading(false);
    };
    getFaqDataById();

  },[]);

  useEffect(() => {
    if (faqAnswer != '') {
      const charCount = faqAnswer.replace(/<\/?[^>]+(>|$)/g, "");
      setNotifiDescLenth(charCount.length)
      // if ( charCount.length > 600 ) {
      //   setAnserrmsg('Characters must be below 600.');
      // }
    }
  }, [faqAnswer]);

  const addFaqContent = async() =>{
    setvalidating('');
    if (faqAnswer == '') {
      setAnserrmsg('This fields is required.');
      return;
    }
    if (validating && validating != '') {
        return;
      }
    if((stringStartDate == "" && stringEndDate != "") || (stringStartDate != "" && stringEndDate == "")) {
      setStringStartDate("");
      setStringEndDate("")
      setvalidating('Give proper dates.');
      return
    }
    setLoader(true);
    if( anserrmsg == '' ){
      let notificationData = {
          id: notificationId,
          notificationDescription: faqAnswer,
          isDisplay: display,
          startDate: stringStartDate,
          endDate: stringEndDate,
      }
      notificationData = sanitizeData(notificationData);
      await authPutWithData(`${getEndpointUrl(ENDPOINTS.saveNotificationDate(notificationId))}`, notificationData)
      .then((result) => {
         if(result && result.success === true) {
          setLoader(false);
          router.push("/admin/notifications");
         }
      }).catch((err) => {
        console.log(err);
        setLoader(false);
      });
    }
  }

  const breadcrumbItems = [
    {
      label: PATH.HOME.name,
      path: PATH.HOME.path,
    },
    {
      label: PATH.CONTENT.name,
      path: PATH.CONTENT.path,
    },
    {
      label: PATH.NOTIFICATIONS.name,
      path: PATH.NOTIFICATIONS.path,
    },
    {
      label: patName,
      path: patName,
    },
  ];

  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'link', 'emoji'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{'indent': '-1'}, {'indent': '+1'}],                                  
    ],
    "emoji-toolbar": true,
    "emoji-textarea": false,
    "emoji-shortname": true,
  };

  const formats = [
    'bold', 'italic', 'underline', 'link', 'list', 'bullet', 'indent', 'emoji'
  ];

  const handleDateChange = (date: Date, inputfrom: string) => {
    if (inputfrom == 'start') {
      console.log(endDate);
      if(date === null){
        setStartDate(null);
        setStringStartDate('');
        return;
      }
      if (endDate && (new Date(endDate) < new Date(date))) {
        setvalidating('Start date must be less than end date');
      } else {
        const dateString = date.toLocaleDateString('en-US');
        setStringStartDate(dateString);
        setStartDate(date);
        setvalidating('');
      }

    } else if (inputfrom == 'approxEndDate') {
      if(date === null){
        setEndDate(null);
        setStringEndDate('');
        return;
      }
      if (startDate && (new Date(startDate) > new Date(date))) {
        setvalidating('End date must be grater than start date');
      } else {
        const dateString = date.toLocaleDateString('en-US');
        setStringEndDate(dateString);
        setEndDate(date);
        setvalidating('');
      }

    }
  };

  return (
      <div className="w-full px-5 pos_r">
        <div className="pb-6 pt-6 breadcrumbs_s">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 lg:gap-8">
          <div className="faq_list">
            <h1 className="font-bold text-gray-900 header-font text_font_size"> Content </h1>
            <ul className="sidebar_list_gap mt-4">
              <li><Link href="/admin/notifications" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 anchor_active">Notifications</Link></li>
            </ul>
          </div>
          <div className="faq_content col-span-4">
            <div className="sm:flex sm:items-center sm:justify-between">
              <div className="sm:text-left">
                <h1 className="font-bold text-gray-900 header-font"> {patName} Notification </h1>
              </div>
            </div>
            {!isLoading ? 
            <>
              <div className="form mt-6">
                <form className="flex flex-col gap-4">
                  <div>
                    <div className="mb-2 block">
                    </div>
                    {/* <Textarea id= "editor"  rows={8} onChange={ (e) => {setFaqAnswer(e.target.value); setAnserrmsg('');} } name="noteTitle" value={faqAnswer} required/> */}
                    <ReactQuill
                      value={faqAnswer}
                      onChange={(content) => { 
                        setFaqAnswer(content); 
                        setAnserrmsg(''); 
                      }} 
                      modules={modules}
                      formats={formats}
                      theme="snow"
                      // style={{ height: '60px' }}
                    />
                    {/* <div className="flex"> */}
                    <p className={`font-medium text-sm text-gray-400 pt-2 ${notifiDescLenth > 600 && 'text-red-500'}`}>
                      {notifiDescLenth}/600 characters
                     
                    </p>
                    {/* <span className="line_after"></span> */}
                    {/* </div> */}
                    {anserrmsg && anserrmsg != '' &&
                      <p className="font-medium text-sm text-red-500 pt-2">{anserrmsg}</p>
                    }
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="remember" checked={display} onChange={()=>setDisplay(!display)}/>
                    <Label htmlFor="remember">Display on XDS Spark</Label>
                  </div>
                  <div className="pt-2"><span className="text-md"><b>Pin to the top of the notifications panel for the following dates</b></span>
                  <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-3 w-full pt-2">
                    <div>
                          {/* <div className="mb-2 inline-flex items-center">
                            <Label htmlFor="startDate" value="Start Date" className="font-bold text-xs" />
                          </div> */}
                          <DatePicker
                            autoComplete="off"
                            className="block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 border-gray-300 text-gray-900 focus:border-cyan-500 focus:ring-cyan-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-500 p-2.5 text-sm rounded-lg"
                            selected={startDate}
                            placeholderText="Start Date"
                            onChange={(date: Date) => {
                              handleDateChange(date, 'start');
                            }}
                          /></div>
                    <div>
                          {/* <div className="mb-2 inline-flex items-center">
                            <Label htmlFor="endDate" value="End Date" className="font-bold text-xs" />
                          </div> */}
                          <DatePicker
                            autoComplete="off"
                            className="block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 border-gray-300 text-gray-900 focus:border-cyan-500 focus:ring-cyan-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-500 p-2.5 text-sm rounded-lg"
                            selected={endDate && new Date(new Date(endDate).toUTCString())}
                            placeholderText="End Date"
                            onChange={(date: Date) => {
                              handleDateChange(date, 'approxEndDate');
                            }}
                          /></div>
                    </div>
              </div>
                </form>
                </div>
                <div className="text-end my-6">
                  <span className="text-sm text-red-600 lg:mr-6 pr-6">{validating}</span>
                  {/* <button type="button" className="py-2.5 px-5 me-2 text-sm font-medium  focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-blue-300 hover:text-white focus:z-10 focus:ring-4 focus:ring-gray-100 button_bg_2"><Link href="/admin/notifications">Cancel</Link></button> */}
                  <div className="left_btn inline-flex">
                  <Button
                      type="button"
                      className="button_cancel hover:border-gray-100 h-[40px] px-4 mr-2"
                    >
                      <Link href="/admin/notifications">
                      Cancel
                      </Link>
                  </Button>
                  <Button type="submit" 
                  // className="py-2.5 px-5 me-2 text-sm font-medium disabled:h-[50px] focus:outline-none bg-blue-300 rounded-lg hover:bg-blue-300 hover:text-white focus:z-10 focus:ring-4 focus:ring-gray-100 faq_btns disabled:bg-gray-150/20 disabled:border-white shadow-none disabled:text-[#A2ABBA] disabled:opacity-100" 
                  className="bg-white button_blue hover:bg-white h-[40px] px-4 disabled:bg-gray-150/20 disabled:border-white shadow-none disabled:text-[#A2ABBA] disabled:opacity-100"
                  disabled= {notifiDescLenth > 600 || loader}
                  onClick={addFaqContent}>{loader ? <ButtonSpinner></ButtonSpinner> : 'Save'}</Button>
                  </div>
                </div>
              </>
             : 
                <div className="flex justify-center items-center"><Spinner/></div>
            }
          </div>

        </div>
      </div>
  );
};

export default CreateOrUpdateNotification;
