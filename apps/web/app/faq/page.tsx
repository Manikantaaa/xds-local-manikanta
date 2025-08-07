"use client";
import Breadcrumbs from "@/components/breadcrumb";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { PATH } from "@/constants/path";
import { useUserContext } from "@/context/store";
import { authFetcher } from "@/hooks/fetcher";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import DOMPurify from 'dompurify';
import Link from "next/link";
import Spinner from "@/components/spinner";

interface faqTypes {
    faqQuestion:string, 
    faqAnswer: string,
}

const Faqs = () => {

  const { user } = useUserContext();
  if(!user){
    redirect('/login');
  }
  const [faqQuestionansAns, setFaqQuestions] = useState<faqTypes[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

    const breadcrumbItems = [
        {
            label: PATH.HOME.name,
            path: PATH.HOME.path,
        },
        {
            label: 'FAQ',
            path: 'FAQ',
        },
    ];

      const createMarkup = (html: string) => {
        const sanitizedHtml = DOMPurify.sanitize(html);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = sanitizedHtml;
        const links = tempDiv.querySelectorAll('a');
        links.forEach(link => {
            link.style.color = 'blue';
            link.style.textDecoration = 'underline';
            link.target = '_blank';
        });
        const updatedHtml = tempDiv.innerHTML;
        
        return { __html: updatedHtml };
    };

    useEffect(() => {
        const getAllFaq = async() => {
            setIsLoading(true);
            const allFaqQuestions = await authFetcher(
                getEndpointUrl(ENDPOINTS.getFaqs),
              );
              if (allFaqQuestions && allFaqQuestions.success == true) {
                let dataArr: faqTypes[] = [];
                allFaqQuestions.data.map((items:faqTypes) => {
                    dataArr.push({faqQuestion: items.faqQuestion, faqAnswer: items.faqAnswer});
                })
                setFaqQuestions(dataArr);
              }
              setIsLoading(false);
        }
        getAllFaq();
    }, []);
    return (
        <div className="w-full lg:container px-5 pos_r">
            <div className="pb-6 pt-6 breadcrumbs_s">
                <Breadcrumbs items={breadcrumbItems} />
            </div>
            <div className="flex justify-between">
                <div className="text-left">
                    <h1 className="default_text_color header-font">Frequently Asked Questions</h1>
                </div>
            </div>
            {isLoading ? 
            <div className="flex justify-center items-center pt-48"><Spinner/></div>
            :
            <div className="space-y-4 my-6">
            {faqQuestionansAns && faqQuestionansAns.length > 0 && (
            <>
                {faqQuestionansAns.map((faq, index) => (
                     <details className="faq_border group [&_summary::-webkit-details-marker]:hidden">
                     <summary
                         className="link_color flex cursor-pointer items-center justify-between gap-1.5 rounded-lg p-4 text-gray-900"
                     >
                         <h2 className="font-medium">{faq.faqQuestion}</h2>
 
                         <svg
                             className="w-6 h-6 size-5 shrink-0 transition duration-300 group-open:-rotate-180"
                             xmlns="http://www.w3.org/2000/svg"
                             fill="none"
                             viewBox="0 0 24 24"
                             stroke="currentColor"
                         >
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                         </svg>
                     </summary>
 
                     <div className="p-4 leading-relaxed text-gray-700" dangerouslySetInnerHTML={createMarkup(faq.faqAnswer)} />
                        </details>
                        ))}
                    </>
                )}
                <p className="pt-4">Didn't find what you were looking for? <Link className="link_color" href="/contact-us"><u>Contact Us</u></Link></p>
            </div>
           }
            
        </div>
    );
};

export default Faqs;