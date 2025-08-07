import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { ALLOWED_IMAGE_TYPES, BANNER_FILE_SIZE_LIMIT_MB } from "@/constants/imageType";
import { useUserContext } from "@/context/store";
import FreeTierAlerts from "./ui/freeTierAlerts";
import { BodyMessageType } from "@/constants/popupBody";
export interface ImageUploadPreviewProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  buttonLabel: string;
  removeLabel: string;
  previewShape: "square" | "rectangle";
  defaultValue?: string;
  isLoading?: boolean;
  setvalidateBannerDimension: (setvalidateBannerDimension: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: any;
}

const BannerUploadPreview = React.forwardRef<
  HTMLInputElement,
  ImageUploadPreviewProps
>(
  (
    {
      buttonLabel,
      removeLabel,
      previewShape,
      defaultValue,
      isLoading,
      register,
      setValue,
      setvalidateBannerDimension,
      ...props
    },
    ref,
  ) => {
    const [popupMessage, setPopupMessage] = useState<BodyMessageType>('DEFAULT');
    const [file, setFile] = useState<File[] >([]);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    useEffect(() => {
      if (defaultValue) setPreviewUrl(defaultValue.toString());
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading]);
    const [openPopup, setOpenPopup] = useState<boolean>(false);
    const {user} = useUserContext();
    const handleFile = async(e: React.FormEvent<HTMLInputElement>) => {
      const target = e.target as HTMLInputElement;
      const fileList = target.files;
      setvalidateBannerDimension("");
      if (!fileList) return;
      const validImageTypes = ALLOWED_IMAGE_TYPES;
      if (fileList) {
        Array.from(fileList).filter((file) =>{
          const fileNameParts = file.name.split(".");
          if (fileNameParts.length > 2) {
            setvalidateBannerDimension("Images with multiple extensions (or periods) in the file name are not allowed");
              return;
          }
          if (file.size > BANNER_FILE_SIZE_LIMIT_MB * 1024 * 1024) {
            setvalidateBannerDimension(`File size should not exceed ${BANNER_FILE_SIZE_LIMIT_MB}MB`);
            return;
          }
          if (!validImageTypes.includes(file.type)) {
            setvalidateBannerDimension("Only supports PNG, JPEG and JPG");
          }
          const img = new window.Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
              URL.revokeObjectURL(img.src);
              const width = img.width;
              const aspectRatio = width / img.height;
              const isSixteenNine = Math.abs(aspectRatio - (16 / 9)) < 0.01;
              const isWidthValid = width == 800;
              if (!isSixteenNine || !isWidthValid) {
                setvalidateBannerDimension('Please use an image that is 16:9 ratio - 800px wide by 450px tall');
                return;
              } else {
                setFile(Array.from(fileList));
              }
            }
        });
      }
      else {
        return;
      }
      const filteredFiles = Array.from(fileList).filter((file) =>{
        if (file.size > BANNER_FILE_SIZE_LIMIT_MB * 1024 * 1024) {
          setvalidateBannerDimension(`File size should not exceed ${BANNER_FILE_SIZE_LIMIT_MB}MB`);
          return;
        }
        const img = new window.Image();
          img.src = URL.createObjectURL(file);
          img.onload = () => {
            URL.revokeObjectURL(img.src);
            const width = img.width;
            const aspectRatio = width / img.height;
            const isSixteenNine = Math.abs(aspectRatio - (16 / 9)) < 0.01;
            const isWidthValid = width >= 800;
            if (!isSixteenNine || !isWidthValid) {
              setvalidateBannerDimension('Please use an image that is 16:9 ratio - 800px wide by 450px tall');
              return;
            }
          }
        return (
          ALLOWED_IMAGE_TYPES.includes(file.type) ||
          setvalidateBannerDimension("Only supports PNG, JPEG and JPG")
        );
      });
    };

    const removeImage = () => {
      setFile([]);
      setPreviewUrl("");
      setValue("bannerFile", "", { shouldDirty: true });
    };
    const handleFreeuser = (e: React.MouseEvent<HTMLInputElement, MouseEvent>) => {
      // if(!user?.isPaidUser){
      //   e.preventDefault();
      //   setOpenPopup(true);
      // }else{
        return true;
     // }

    }
    return (
      <div>
        <div className="w-full">
          <div
            className={`h-[20px] relative items-center group ${
              !file[0] && !previewUrl ? "" : "opacity-0"
            }`}
          >
            <label className="w-full h-full absolute z-1">
              <p
                aria-disabled
                className={`text-sm text-blue-350 group-hover:underline ${
                  !file[0] && !previewUrl ? "group-hover:cursor-pointer" : ""
                } `}
              >
                {buttonLabel}
              </p>
              <input
                
                {...props}
                type="file"
                onChangeCapture={handleFile}
                accept=".jpg,.jpeg,.png"
                className="w-full h-full opacity-0 z-10 absolute curs"
                multiple={false}
                ref={ref}
                onClick={(e) => handleFreeuser(e)}
                {...register("bannerFile", {
                  validate: {
                    acceptedFormats: (files: File[] | string) => {
                      if (!files || !files[0] || typeof files === "string") {
                        return true;
                      }
                      return (
                        ALLOWED_IMAGE_TYPES.includes(files[0]?.type) ||
                        "Only PNG, JPEG and JPG"
                      );
                    },
                    lessThan5MB: (files: File[]) => {
                      if (
                        files &&
                        files[0]?.size > BANNER_FILE_SIZE_LIMIT_MB * 1024 * 1024
                      )
                        return `File size should not exceed ${BANNER_FILE_SIZE_LIMIT_MB}MB`;
                      return true;
                    },
                    dimensionValidation: (files: File[] | string) => {
                      if (typeof files === 'string' || !files || !files[0]) {
                        return true; // or your preferred default validation result
                      }
                    
                      const file = files[0];
                      if (!(file instanceof File)) {
                        return true;
                      }
                    
                      return new Promise((resolve) => {
                        const img = new window.Image();
                        img.src = URL.createObjectURL(file);
                        img.onload = () => {
                          URL.revokeObjectURL(img.src);
                          const width = img.width;
                          const aspectRatio = width / img.height;
                          const isSixteenNine = Math.abs(aspectRatio - (16 / 9)) < 0.01;
                          const isWidthValid = width >= 800;
                          if (!isSixteenNine || !isWidthValid) {
                            resolve('Please use an image that is 16:9 ratio - 800px wide by 450px tall');
                          } else {
                            resolve(true);
                          }
                        };
                        img.onerror = () => {
                          resolve("Error loading image.");
                        };
                      });
                    }
                  },
                })}
              />
            </label>
          </div>

          {(file[0] || previewUrl) && (
            <div>
              <div
                className={`relative w-[8rem] ${
                  previewShape === "square" ? "h-[8rem]" : "h-[4.5rem]"
                }`}
              >
                <Image
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  style={{ objectFit: "cover" }}
                  src={
                    file[0]
                      ? URL.createObjectURL(file[0])
                      : previewUrl
                        ? previewUrl
                        : ""
                  }
                  alt={`preview`}
                />
              </div>
              <Button
                type="button"
                className="p-0 hover:bg-transparent border-0 text-sm font-normal hover:underline text-blue-350 mt-6"
                variant={"outline"}
                onClick={removeImage}
              >
                {removeLabel}
              </Button>
            </div>
          )}
        </div>
        <FreeTierAlerts isOpen={openPopup} setOpenPopup={setOpenPopup} bodymessage={popupMessage} />
      </div>
    );
  },
);

BannerUploadPreview.displayName = "BannerUploadPreview";

export default BannerUploadPreview;

