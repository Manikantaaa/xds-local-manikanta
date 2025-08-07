import { APPROVAL_STATUS } from "@/constants/approvalStatus";
import { Check } from "lucide-react";

type CompleteSetupProgressBarProps = {
  step: number;
};

const Step = ({ status, label }: { status: string; label: string }) => {
  if (status === APPROVAL_STATUS.completed) {
    return (
      <div>
        <div className="relative">
          <div className="w-4 h-4 bg-turquoise-600 rounded-full mx-auto"></div>
          <div className="text-xs absolute left-[50%] top-[50%] transform translate-x-[-50%] translate-y-[-50%]">
            <Check className="w-[10px] h-[10px]" />
          </div>
        </div>
        <p className="font-bold">{label}</p>
      </div>
    );
  }
  if (status === APPROVAL_STATUS.inProgress) {
    return (
      <div>
        <div className="w-4 h-4 bg-blue-300 rounded-full mx-auto"></div>
        <p className="font-bold text-gray-500">{label}</p>
      </div>
    );
  }
  return (
    <div>
      <div className="w-4 h-4 border-2 border-gray-300 bg-white rounded-full mx-auto"></div>
      <p className="font-bold text-gray-500">{label}</p>
    </div>
  );
};

const CompleteSetupProgressBar = ({ step }: CompleteSetupProgressBarProps) => {
  const steps = [
    { label: "Password", status: step === 1 ? "in-progress" : "completed" },
    {
      label: "Billing & Payment",
      status:
        step === 1 ? "not-started" : step === 2 ? "in-progress" : "completed",
    },
    { label: "Finish", status: step === 3 ? "completed" : "not-started" },
  ];

  return (
    <div className="grid grid-cols-3 text-center relative lg:w-[40rem] mx-auto">
      {steps.map((step, index) => (
        <Step key={index} {...step} />
      ))}

      <div className="absolute top-2 left-1/2 transform translate-x-[-50%] border border-gray-300 z-[-1] lg:w-[calc(100%-14rem)] w-[calc(100%-8rem)]"></div>
    </div>
  );
};

export default CompleteSetupProgressBar;
