import { popupMessages, BodyMessageType } from "@/constants/popupBody";
import { Button, Modal } from "flowbite-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type FreeTierAlertsProps = {
    isOpen: boolean;
    bodymessage: BodyMessageType;
    setOpenPopup: (isOpen: boolean) => void;
}
const FreeTierAlerts = ({ isOpen, bodymessage, setOpenPopup }: FreeTierAlertsProps) => {
    const router = useRouter();
    const [popupbodymessage, setPopupBodyMessage] = useState<string>('')
    useEffect(() => {
        if (!bodymessage) {
            setPopupBodyMessage(popupMessages['DEFAULT']);
        } else {
            setPopupBodyMessage(popupMessages[bodymessage]);
        }
    }, [bodymessage])

    const buttonText = "Subscribe Now";
    const handlesubscribe = () => {
        setOpenPopup(false);
        router.push('/billing-payment')
    }
    return (
        <Modal
             show={isOpen}
            size="lg"
            onClose={() => setOpenPopup(false)}
            popup
            className="freetieralert"
        >
            <Modal.Header />
            <Modal.Body className="px-16">
                <div className="text-center">
                    {/* <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400"/> */}
                    <div className="absolute -top-20 w-full left-0">
                        <Image priority src="/spark_mascot.png" alt="mascot" width={210} height={210} className="m-auto" />
                    </div>
                    <h3 className="mb-5 text-lg font-normal text-gray-900 mt-20">
                        {/* {popupbodymessage} */}
                        <div style={{ marginTop: "6rem" }}>{popupbodymessage}</div>
                    </h3>
                    <div className="justify-center gap-4 ">

                        <Button
                            onClick={handlesubscribe}
                            className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors  subscribe_now_to_p text-primary-foreground hover:bg-primary/90 h-12 p-5"
                            type="button"
                        >
                            {/* {buttonText} */}
                            Subscribe Now to Premium
                        </Button>

                        <button
                            className="w-full mt-6 block pink_color text-center"
                            onClick={() => setOpenPopup(false)}                       >
                            <u>No thanks, I’ll continue with a basic membership.</u>
                        </button>
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default FreeTierAlerts;
