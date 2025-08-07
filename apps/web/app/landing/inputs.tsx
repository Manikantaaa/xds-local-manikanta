import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/passwordInput";

export default function InputDemo() {
  return (
    <div>
      <p className="font-semibold text-3xl">Inputs</p>
      <div className="my-5 space-y-7">
        <Input type="email" placeholder="Email" />
        {/* ----- */}
        <div className="grid max-w-sm items-center gap-1.5">
          <Label htmlFor="email" className="font-semibold">
            Email
          </Label>
          <Input type="email" id="email" placeholder="Email" />
        </div>
        {/* ----- */}
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input type="email" placeholder="Email" />
          <Button
            variant={"outline"}
            className="bg-blue-100 border-none"
            type="submit"
          >
            Apply
          </Button>
        </div>
        {/* ----- */}
        <PasswordInput />
      </div>
    </div>
  );
}
