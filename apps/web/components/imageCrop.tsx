import { ENDPOINTS, getEndpointUrl } from '@/constants/endpoints';
import useCommonPostData from '@/hooks/commonPostData';
import React, { useEffect, useState } from 'react';
import Cropper from 'react-easy-crop';
import Spinner from './spinner';
import { Button, Modal } from "flowbite-react";

interface Props {
  openImageModal: boolean;
  uploadedImage: File | null;
  onDataReceived: (data: any) => void;
}

const ImageCrop: React.FC<Props> = ({ openImageModal, uploadedImage, onDataReceived }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [imageset, setImage] = useState<string>('');
  const [cropImageAreaPixels, setCropImageAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [loader, setloader] = useState(false);
  //const [errors, seterrors] = useState('');
  //const [processingStatus, setprocessingStatus] = useState(1);
  useEffect(() => {
    uploadedImage != null ? setImage(URL.createObjectURL(uploadedImage)) : '';
  }, [uploadedImage]);

  const { error, success, submitForm: saveCroppedImage } = useCommonPostData<FormData>({
    url: getEndpointUrl(ENDPOINTS.uploadimageCommonMethod),
  });


  const onCropComplete = (_croppedArea: any, croppedAreaPixels: { x: number; y: number; width: number; height: number }) => {
    setCropImageAreaPixels(croppedAreaPixels);
  };

  const SubmitImage = async () => {
    //setprocessingStatus(1)
    //seterrors('');
    setloader(true);
    if (!cropImageAreaPixels) return;

    const image = imageset;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error("Canvas context is null");
      setloader(false);
      return;
    }
    const img = new Image();
    img.src = image;
    await img.decode();
    canvas.width = cropImageAreaPixels.width;
    canvas.height = cropImageAreaPixels.height;

    const radius = Math.min(cropImageAreaPixels.width, cropImageAreaPixels.height) / 2;
    const centerX = cropImageAreaPixels.width / 2;
    const centerY = cropImageAreaPixels.height / 2;

    // Create the circular clipping path
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(
      img,
      cropImageAreaPixels.x,
      cropImageAreaPixels.y,
      cropImageAreaPixels.width,
      cropImageAreaPixels.height,
      0,
      0,
      cropImageAreaPixels.width,
      cropImageAreaPixels.height
    );

    const base64Data = canvas.toDataURL('image/png').replace(/^data:image\/(png|jpeg);base64,/, '');
    const byteString = atob(base64Data);
    const mimeString = 'image/jpeg';
    const buffer = new ArrayBuffer(byteString.length);
    const intArray = new Uint8Array(buffer);
    for (let i = 0; i < byteString.length; i++) {
      intArray[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([buffer], { type: mimeString });
    const file = new File([blob], 'uploadimage.jpeg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('sourceImage', file);
    formData.append('destImagepath', 'contactprofileimages');
    const videothumbnail = await saveCroppedImage(formData);
    onDataReceived(videothumbnail)
  };


  const SendEmptyData = () => {
    onDataReceived("");
  }
  const setZoomValue = (valueType: string) => {
    setZoom((prevZoom) => {
      if (valueType == "add") {
        if (prevZoom < 3) {
          return prevZoom + 0.1
        }
        else {
          return prevZoom
        }
      } else {
        if (prevZoom > 1) {
          return prevZoom - 0.1
        }
        else {
          return prevZoom
        }
      }

    })
  }
  return (
    <>
      <Modal show={openImageModal} onClose={() => SendEmptyData()} className='crop_modal_ui' size="lg">
        <Modal.Header className='modal_header'> Crop Photo
        </Modal.Header>
        <Modal.Body className='p-0'>
          <div className="relative w-full m-auto">
            <div className="h-[50vh] w-[]">
              <div className="imagecrop">
                <div className="crop-container">
                 
                  {!loader ?
                    <Cropper
                      image={imageset}
                      crop={crop}
                      zoom={zoom}
                      cropShape="round"
                      aspect={1}
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                      showGrid={false}
                    />
                    :
                    <div className='text-center mt-36 z-10 relative'>
                    <div role="status">
                      <svg aria-hidden="true" className="inline w-8 h-8 text-gray-200 animate-spin  fill-yellow-400" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                      </svg>
                      <p className='text-sm mt-1'>Cropping...</p>
                    </div>
                  </div>
                  }
                </div>

              </div>
            </div>


          </div>
        </Modal.Body>
        <Modal.Footer className="modal_footer">
          {!loader &&
            <div className="opertions">
              <svg className="w-6 h-6 text-gray-800 ml-2 mt-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" onClick={() => setZoomValue("reduce")}>
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14" />
              </svg>
              <input disabled={loader}
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e: any) => {
                  if (e.target.value <= 3) {
                    setZoom(Number(e.target.value))
                  }

                }}
                className="zoom-range"
              />

              <svg className="w-6 h-6 text-gray-800  mr-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" onClick={() => setZoomValue("add")}>
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-7 7V5" />
              </svg>



            </div>
          }
          <Button disabled={loader} onClick={SubmitImage}>Crop</Button>

        </Modal.Footer>
      </Modal>

      {/* <div id="default-modal" className={`overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full ${openImageModal1  ? 'visible' : 'hidden'}`}>

      </div> */}

    </>
  );
};



export default ImageCrop;
