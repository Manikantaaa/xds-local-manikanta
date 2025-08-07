import { Button } from "@/components/ui/button";

export default function ButtonDemo() {
  return (
    <div className="space-y-5">
      <p className="font-semibold text-3xl">Buttons</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        <Button>Default</Button>
        <Button disabled>Disabled</Button>
        <Button variant={"outline"}>Outline</Button>
        <Button variant={"destructive"}>Destructive</Button>
        <Button variant={"ghost"}>Ghost</Button>
        <Button variant={"link"}>Link</Button>
        <Button variant={"secondary"}>Secondary</Button>
      </div>
      <div>
        <Button className="w-full">Full width</Button>
      </div>
    </div>
  );
}
