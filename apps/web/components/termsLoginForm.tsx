"use client";
import { PasswordInput } from "./ui/passwordInput";
import { Button } from "flowbite-react";
import { SubmitHandler, useForm } from "react-hook-form";
import LabelInput from "./labelInput";
import Link from "next/link";
import useLoginWithTerms from "@/hooks/useLoginWithTerms";

type LoginFormProps = {
  email?: string;
  password?: string;
  agreeCheckbox?: boolean
};

const TermsLoginForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormProps>();

  const { isLoading, error, setError, success, login } = useLoginWithTerms();

  const onSubmit: SubmitHandler<LoginFormProps> = (data) => {
    login({
      email: data.email?.toLowerCase() as string,
      password: data.password as string,
      checkedTerms: data.agreeCheckbox as boolean
    });
  };

  function checkError(val: string){
    console.log(val);
    if(val && val != "") {
      setError("");
    }
  }

  return (
    <div className="lg:w-[440px] space-y-6 my-6 mx-auto lg:px-0 px-6">
      <h4 className="font-bold text-center text-[22px]">Welcome, plese login to get started!</h4>
      <p className="text-sm">Please use the credentials you received in your invite email.</p>
      <hr />
      <form className="w-full space-y-6 my-5" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <LabelInput
            className="w-full"
            id="email"
            register={register("email", {
              required: "This field is required",
            })}
            onChange={(e) => { checkError(e.target.value) }}
            label="Email"
          />
        </div>
        <div>
          <PasswordInput
            register={register("password", {
              required: "This field is required",
            })}
            label="Password"
            onChange={(e) => { checkError(e.target.value) }}
            errorMessage={errors.password?.message}
          />
        </div>
        {error && (
          <p className="font-medium text-red-500 text-xs mt-5">{error}</p>
        )}
        <div className="flex items-center">
          <input
            type="checkbox"
            {...register("agreeCheckbox", { required: true })}
            id="agreeCheckbox"
            className="peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-gray-400 data-[state=checked]:text-primary-foreground"
          />
          <label
            htmlFor={"agreeCheckbox"}
            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 pl-2"
          >
            I agree to the&nbsp;
            <a
              href="/XDS Spark Terms and Conditions of Use.pdf"
              target="_blank"
              className="underline text-blue-300"
            >
              XDS Spark Terms and Conditions
            </a>
          </label>
        </div>
        <Button
          type="submit"
          className="w-full button_blue"
          disabled={isLoading || !isValid}
        >
          {isLoading ? "Loading..." : "Login"}
        </Button>
        <div>
        </div>
      </form>
    </div>
  );
};

export default TermsLoginForm;