"use client";

import { CompleteSetupTokenUser } from "@/types/user.type";
import { PasswordInput } from "./ui/passwordInput";
import { Button } from "./ui/button";
import { SubmitHandler, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import useCreateAccountWithPassword from "@/hooks/useCreateAccountWithPassword";
import { KeyedMutator } from "swr";
import { authFetcher, withoutAuthPostData } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { useState } from "react";

type PasswordFormProps = {
  token: string;
  user: CompleteSetupTokenUser | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mutate: KeyedMutator<any>;
};

type PasswordFormData = {
  password?: string;
  confirmPassword?: string;
};

const PASSWORD_RULES_MESSAGE =
  "Please ensure the password meets the requirements - min 6 characters with at least one number, one letter, one special character";

const schema = yup.object().shape({
  password: yup
    .string()
    .min(6, PASSWORD_RULES_MESSAGE)
    .matches(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{6,}$/,
      PASSWORD_RULES_MESSAGE,
    ),
  confirmPassword: yup
    .string()
    .oneOf(
      [yup.ref("password"), ""],
      "The passwords do not match, please try again",
    ),
});

const PasswordForm = ({ token, user, mutate }: PasswordFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<PasswordFormData>({
    resolver: yupResolver(schema),
  });

  const [recreatePassword, setRecreatePassword] = useState(true);
  const { isLoading, error, success, setupPassword } =
    useCreateAccountWithPassword();

  const onSubmit: SubmitHandler<PasswordFormData> = (data) => {
    setupPassword({
      token,
      password: data.password as string,
    });
  };

  if (success) {
    mutate();
  }

  const updateIllegealExistingEmail = async() => {
    // update the existing user email in Firebase with appended "delete-"
    await withoutAuthPostData(`${getEndpointUrl(ENDPOINTS.updateEmailAndCreateNewUser)}`, {
      token,
      password: watch('password') as string,
    }).then((result) => {
      mutate();
    }).catch((err) => {
      console.log(err);
    });
  }

  if(error && error.status == 403 && recreatePassword) {
    setRecreatePassword(false);
    // update the user email in firebase and again create a new request to Add the user
    updateIllegealExistingEmail();
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <p className="font-bold text-center my-6">Create a Password</p>
        <p className="text-gray-800"><b>First Name</b>: {user?.firstName}</p>
        <p className="text-gray-800"><b>Last Name</b>: {user?.lastName}</p>
        <p className="text-gray-800"><b>Email</b>: {user?.email}</p>
        <p className="text-gray-800"><b>Company</b>: {user?.companies[0]?.name}</p>
      </div>
      {error && error.message && error.status != 403 && (
        <p className="font-medium text-red-500 text-xs mt-1">Error: {error.message}</p>
      )}
      <div>
        <PasswordInput
          register={register("password")}
          label="Password"
          placeholder="••••••••"
          errorMessage={errors.password?.message}
          defaultMessage="Min 6 characters with at least one number, one letter, one special character"
        />
      </div>
      <div>
        <PasswordInput
          register={register("confirmPassword", {
            validate: {
              comparePassword: (value) => value == watch('password') || "Password not matched"
            }
          })}
          label="Re-enter Password"
          placeholder="••••••••"
          errorMessage={errors.confirmPassword?.message}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Loading..." : "Next, pick your billing cycle"}
      </Button>
    </form>
  );
};

export default PasswordForm;
