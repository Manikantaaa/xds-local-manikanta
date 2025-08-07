import { Input, InputProps } from "./ui/input";
import { Label } from "./ui/label";

type LabelInputProps = InputProps & {
  label: string;
  id?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register?: any;
  errorMessage?: string;
};
const LabelInput = ({
  label,
  required,
  id,
  placeholder,
  register,
  errorMessage,
  ...props
}: LabelInputProps) => {
  return (
    <div className="">
      <Label htmlFor={id} className="font-bold text-xs">
        {label}
        {required && <span style={{ color: 'red' }}> *</span>}
      </Label>
      <Input
        type="text"
        id={id}
        placeholder={placeholder}
        {...props}
        {...register}
      />
      {errorMessage && (
        <p className="font-medium text-red-500 text-xs mt-1">
          {errorMessage as string}
        </p>
      )}
    </div>
  );
};

export default LabelInput;
