"use client";
import Breadcrumbs from "@/components/breadcrumb";
import { PATH } from "@/constants/path";
import Link from "next/link";
import { Checkbox, Label, TextInput } from "flowbite-react";
import { useEffect, useState } from "react";
import { authFetcher, authPutWithData } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { useRouter } from "next/navigation";
import ReactQuill from "react-quill";
import 'react-quill/dist/quill.snow.css';
import Spinner from "@/components/spinner";
import { sanitizeData } from "@/services/sanitizedata";

interface UserByIdParams {
  params: { id: number };
}

interface postdataType {
    type: string,
    qsnData :{
      id: number,
      question: string,
      answer: string,
      isArchieve: boolean,
    }
}

const FaqsEdit = (params: UserByIdParams) => {
  const [faqId, setFaqId] = useState<number>(0);
  const [patName, setPathName] = useState<string>('Add');
  const [faqQuestion, setFaqQuestion] = useState<string>('');
  const [faqAnswer, setFaqAnswer] = useState<string>('');
  const [qsnerrmsg, setQsnerrmsg] = useState<string>('');
  const [anserrmsg, setAnserrmsg] = useState<string>('');
  const [display, setDisplay] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  useEffect(() => {
    if(params.params.id && params.params.id != 0) {
      setFaqId(params.params.id);
      setPathName('Edit');
    }
    const getFaqDataById = async() => {
      setIsLoading(true);
      const allFaqQuestions = await authFetcher(
        getEndpointUrl(ENDPOINTS.getFaqQuestionById(+params.params.id)),
      );
      if (allFaqQuestions && allFaqQuestions.success == true) {
        if (allFaqQuestions.data) {
          setFaqQuestion(allFaqQuestions.data.faqQuestion);
          setFaqAnswer(allFaqQuestions.data.faqAnswer);
          setDisplay(allFaqQuestions.data.isArchieve);
        }
        
      }
      setIsLoading(false);
    };
    getFaqDataById();

  },[]);

  const addFaqContent = async() =>{
    const postData = [];
    if (faqQuestion == '' ) {
      setQsnerrmsg('This fields is required.');
    }

    if (faqAnswer == '' ) {
      setAnserrmsg('This fields is required.');
    }

    if(qsnerrmsg == '' || anserrmsg == '' ){
      const faqData: postdataType = {
        type: 'update',
        qsnData :{
          id: faqId,
          question: faqQuestion,
          answer: faqAnswer,
          isArchieve: display,
        }
      }
      faqData.qsnData = sanitizeData(faqData.qsnData);
      postData.push(faqData);
      await authPutWithData<postdataType[]>(`${getEndpointUrl(ENDPOINTS.saveFaqData(faqId))}`, postData)
      .then((result) => {
         if(result && result.success === true) {
          router.push("/admin/faq");
         }
      }).catch((err) => {
        console.log(err);
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
      label: 'FAQ',
      path: PATH.CONTENT.path,
    },
    {
      label: patName,
      path: patName,
    },
  ];

  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'link'],
      [{'indent': '-1'}, {'indent': '+1'}]                                      
    ],
  };

  const formats = [
    'bold', 'italic', 'underline', 'link', 'indent'
  ];

  
  return (
      <div className="w-full px-5 pos_r">
        <div className="pb-6 pt-6 breadcrumbs_s">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 lg:gap-8">
          <div className="faq_list">
            <h1 className="font-bold text-gray-900 header-font text_font_size"> Content </h1>
            <ul className="sidebar_list_gap mt-4">
              <li><Link href="/admin/faq" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 anchor_active">FAQs</Link></li>
            </ul>
          </div>
          <div className="faq_content col-span-4">
            <div className="sm:flex sm:items-center sm:justify-between">
              <div className="sm:text-left">
                <h1 className="font-bold text-gray-900 header-font"> Add/Edit FAQ </h1>
              </div>
            </div>
            {!isLoading ? 
            <>
              <div className="form mt-6">
                <form className="flex flex-col gap-4">
                  <div>
                    <div className="mb-2 block text-sm">
                      <Label htmlFor="email1" value="Question" className="font-bold"/>
                    </div>
                    <TextInput id="title" onChange={ (e) => {setFaqQuestion(e.target.value);setQsnerrmsg('');} } name="noteTitle" value={faqQuestion} type="text" placeholder="" required/>
                    {qsnerrmsg && qsnerrmsg != '' &&
                      <p className="font-medium text-sm text-red-500 pt-2">{qsnerrmsg}</p>
                    }
                    
                  </div>
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
                    />
                    {anserrmsg && anserrmsg != '' &&
                      <p className="font-medium text-sm text-red-500 pt-2">{anserrmsg}</p>
                    }
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="remember" checked={display} onChange={()=>setDisplay(!display)}/>
                    <Label htmlFor="remember">Display this FAQ on XDS Spark</Label>
                  </div>
                </form>
                </div>
                <div className="text-end my-6">
                  <button type="button" className="py-2.5 px-5 me-2 text-sm font-medium  focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-blue-300 hover:text-white focus:z-10 focus:ring-4 focus:ring-gray-100 button_bg_2"><Link href="/admin/faq">Cancel</Link></button>
                  <button type="button" className="py-2.5 px-5 me-2 text-sm font-medium  focus:outline-none bg-blue-300 rounded-lg border border-gray-200 hover:bg-blue-300 hover:text-white focus:z-10 focus:ring-4 focus:ring-gray-100 faq_btns" onClick={addFaqContent}>Save</button>
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

export default FaqsEdit;
