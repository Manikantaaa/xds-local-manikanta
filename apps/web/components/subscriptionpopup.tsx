import { Modal, Button } from "flowbite-react";
import { HiOutlineExclamationCircle } from "react-icons/hi";
import Link from "next/link";

interface SubscriptionPopupProps {
    isOpened: boolean;
    setOpenAddModal: (value: boolean) => void;
    issubscribed:boolean;
    isDataEmpty?:boolean;
    setopenAddtoWarningModal: (value: boolean) => void;
}

const SubscriptionPopup  = (SubscriptionPopup:SubscriptionPopupProps) => {
    return (
        <>
            <Modal
            show={SubscriptionPopup.isOpened}
            size="md"
            onClose={() => SubscriptionPopup.setOpenAddModal(false)}
            popup
        >
            <Modal.Header />
            <Modal.Body>
            <div className="text-center">
                <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
                <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                  { !SubscriptionPopup.isDataEmpty ? 
                  <p>Please <Link prefetch={false} href="/serviceproviders" className="link_color">search for a service provider</Link> to add to your list.</p> 
                  : 
                  <p>Please select at least one service provider to add to another list or project. Or <Link prefetch={false} href="/serviceproviders" className="link_color">search for a service provider</Link> to add to your list.</p>
                  
                  }
                
                </h3>
                <div className="flex justify-center gap-4">
                <Button
                    className="button_blue"
                    onClick={() => SubscriptionPopup.setOpenAddModal(false)}
                >
                    {"Okay"}
                </Button>
                </div>
            </div>
            </Modal.Body>
        </Modal>
        <Modal
        show={SubscriptionPopup.issubscribed}
        size="md"
        onClose={() => SubscriptionPopup.setopenAddtoWarningModal(false)}
        popup
      >
        <Modal.Header />
        <Modal.Body>
          <div className="text-center">
            <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
              Subscribe to enable this feature
            </h3>
            <div className="flex justify-center gap-4">
              <Link prefetch={false} href="/billing-payment">
                <button
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors  button_blue text-primary-foreground hover:bg-primary/90 h-10 p-5"
                  type="button"
                >
                  Subscribe Now
                </button>
              </Link>
              <Button
                color="gray"
                onClick={() => SubscriptionPopup.setopenAddtoWarningModal(false)}
              >
                No, cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </>
      
    );
};
        
export default SubscriptionPopup;