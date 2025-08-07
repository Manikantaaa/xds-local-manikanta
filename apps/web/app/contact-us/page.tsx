"use client";
import Breadcrumbs from "@/components/breadcrumb";
import { PATH } from "@/constants/path";
import { useAuthentication } from "@/services/authUtils";
import { useUserContext, User } from '@/context/store';
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { Type } from "lucide-react";
import { sanitizeData } from "@/services/sanitizedata";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import useCommonPostData from "@/hooks/commonPostData";
import { toast } from "react-toastify";
import Link from "next/link";

const breadcrumbItems = [
    {
        label: PATH.HOME.name,
        path: PATH.HOME.path,
    },
    {
        label: "Conatct Us",
        path: PATH.MYLISTS.path,
    },
];

type ContactFormDto = {
    firstName: string;
    lastName: string;
    company: string;
    email: string;
    nature: string;
    message: string;
    userId: number;
}
function ContactPage() {
    const { user } = useUserContext();
    useAuthentication({ user, isBuyerRestricted: false, isPaidUserPage: false });
    const {
        register,
        reset,
        formState: { errors },
        handleSubmit,
    } = useForm({
        defaultValues: {
            firstName: '',
            lastName: '',
            company: '',
            email: '',
            nature: '',
            message: '',
            userId: '',
        },
    });

    const { submitForm } = useCommonPostData<ContactFormDto>({
        url: getEndpointUrl(ENDPOINTS.contactUs),
    });

    const onSubmit = (async (data: ContactFormDto) => {

        data.userId = user?.id ? user?.id : 1;
        const sanitizedData: ContactFormDto = sanitizeData(data) as ContactFormDto;

        submitForm(sanitizedData).then((response) => {
            if (response.data && response.data.success !== true) {
                toast.error('An Error occurred, Try Again Later');
            } else {
                reset();
                toast.success('Message Successfully sent 👍');
            }
        }).catch((err) => {
            console.log(err);
            toast.error('An Error occurred, Try Again Later');
        });
    }) as SubmitHandler<FieldValues>;
    return (
        <>
            <div className="container contact_pad_10">
                <div className="pb-6 pt-6 breadcrumbs_s">
                    <Breadcrumbs items={breadcrumbItems} />
                </div>
                <div className="pt-6"><hr /></div>
                <section className="bg-white mt-20 lg:mt-0">
                    <div className="lg:grid  lg:grid-cols-12">
                        <aside className="relative h-16 lg:order-start lg:col-span-5 lg:h-full items-center flex justify-center">
                            <img
                                alt=""
                                src="/contactus.jpg?1"
                                className="inset-0 z-0 relative"
                            />
                        </aside>

                        <main
                            className="flex items-center justify-center px-2 py-8 sm:px-12 lg:col-span-7 lg:px-16 lg:py-12 z-10 relative mt-16 lg:mt-0"
                        >
                            <div className="max-w-xl lg:max-w-3xl">
                                <h1 className="default_text_color header-font">
                                    Contact Us
                                </h1>

                                <p className="mt-4 leading-relaxed text-gray-500">
                                    Thank you for contacting XDS Support. Before contacting us, please see our <b className="link_color"><Link href="/faq">FAQ</Link></b> for commonly asked questions.
                                </p>
                                <p className="mt-4 leading-relaxed text-gray-500">
                                    If the FAQ does not answer your question, please complete the following. Our team will get back to you as soon as possible.
                                </p>

                                <form onSubmit={handleSubmit(onSubmit)} className="mt-8 grid grid-cols-6 gap-6">
                                    <div className="col-span-6 sm:col-span-3">
                                        <label htmlFor="FirstName" className="block text-sm font-semibold default_text_color">
                                            First Name <span style={{ color: 'red' }}>*</span>
                                        </label>

                                        <input
                                            autoComplete="off"
                                            type="text"
                                            id="FirstName"
                                            {...register("firstName", {
                                                required: {
                                                    value: true,
                                                    message: "FirstName field required",
                                                },
                                            })}
                                            className="mt-1 w-full rounded-md border-gray-200 bg-white text-sm default_text_color shadow-sm"
                                        />
                                        <p className="text-red-600 text-xs pt-1">
                                            {typeof errors?.firstName?.message === "string" &&
                                                errors?.firstName?.message}
                                        </p>
                                    </div>

                                    <div className="col-span-6 sm:col-span-3">
                                        <label htmlFor="LastName" className="block text-sm  default_text_color font-semibold">
                                            Last Name <span style={{ color: 'red' }}>*</span>
                                        </label>

                                        <input
                                            
                                            type="text" 
                                            id="LastName"
                                            {...register("lastName", {
                                                required: 'LastName field required'
                                            })}
                                            autoComplete="off"
                                            className="mt-1 w-full rounded-md border-gray-200 bg-white text-sm default_text_color shadow-sm"
                                        />
                                        <p className="text-red-600 text-xs pt-1">
                                            {typeof errors?.lastName?.message === "string" &&
                                                errors?.lastName?.message}
                                        </p>

                                    </div>
                                    <div className="col-span-6">
                                        <label htmlFor="Company" className="block text-sm font-semibold default_text_color">Company <span style={{ color: 'red' }}>*</span> </label>

                                        <input
                                            type="text"
                                            autoComplete="off"
                                            id="Company"
                                            {...register("company", {
                                                required: 'Company field required'
                                            })}
                                            className="mt-1 w-full rounded-md border-gray-200 bg-white text-sm default_text_color shadow-sm"
                                        />
                                        <p className="text-red-600 text-xs pt-1">
                                            {typeof errors?.company?.message === "string" &&
                                                errors?.company?.message}
                                        </p>
                                    </div>
                                    <div className="col-span-6">
                                        <label htmlFor="Email" className="block text-sm font-semibold default_text_color"> Email Address<span style={{ color: 'red' }}>*</span> </label>

                                        <input
                                            type="email"
                                            autoComplete="off"
                                            id="Email"
                                            {...register("email", {
                                                required: 'Email field required'
                                            })}
                                            className="mt-1 w-full rounded-md border-gray-200 bg-white text-sm default_text_color shadow-sm"
                                        />
                                        <p className="text-red-600 text-xs pt-1">
                                            {typeof errors?.email?.message === "string" &&
                                                errors?.email?.message}
                                        </p>
                                    </div>

                                    <div className="col-span-6">
                                        <label htmlFor="nature" className="block text-sm font-semibold default_text_color"> Select the nature of your enquiry <span style={{ color: 'red' }}>*</span></label>

                                        <select
                                            {...register("nature", {
                                                required: 'Nature field required'
                                            })}
                                            id="nature"
                                            autoComplete="off"
                                            className="mt-1.5 w-full rounded-lg border-gray-300 default_text_color sm:text-sm"
                                        >
                                            <option value="">Select</option>
                                            <option value="Billing">Billing</option>
                                            <option value="Tech Support">Tech Support</option>
                                            <option value="SponsorshipEnquiry">Sponsorship Enquiry</option>
                                        </select>
                                        <p className="text-red-600 text-xs pt-1">
                                            {typeof errors?.nature?.message === "string" &&
                                                errors?.nature?.message}
                                        </p>
                                    </div>

                                    <div className="col-span-6">
                                        <label htmlFor="message" className="block text-sm font-semibold default_text_color">
                                            Message <span style={{ color: 'red' }}>*</span>
                                        </label>

                                        <textarea
                                            id="message"
                                            autoComplete="off"
                                            className="mt-2 w-full rounded-lg border-gray-200 align-top shadow-sm sm:text-sm"
                                            rows={4}
                                            placeholder=""
                                            {...register("message", {
                                                required: 'Message field required'
                                            })}
                                        ></textarea>
                                        <p className="text-red-600 text-xs pt-1">
                                            {typeof errors?.message?.message === "string" &&
                                                errors?.message?.message}
                                        </p>
                                    </div>
                                    <div className="col-span-6 flex items-end gap-4 justify-end">
                                        <button
                                            className="inline-block shrink-0 rounded-md border border-blue-600 bg-blue-400 px-12 py-3 text-sm font-semibold text-white transition hover:bg-transparent hover:text-blue-600 focus:outline-none focus:ring active:text-blue-500"
                                        >
                                            Submit
                                        </button>

                                    </div>
                                </form>
                            </div>
                        </main>
                    </div>
                </section>
            </div>
        </>
    );
}

export default ContactPage;
