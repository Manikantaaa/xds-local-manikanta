import { Badge } from "@/components/ui/badge";

export default function BadgeDemo() {
  return (
    <div>
      <p className="font-semibold text-3xl">Badges</p>
      <div className="flex-wrap space-x-3 my-5">
        <Badge>Default</Badge>
        <Badge variant={"outline"}>Outline</Badge>
        <Badge variant={"destructive"}>Destructive</Badge>
        <Badge variant={"secondary"}>Secondary</Badge>
        <Badge variant={"blue"}>Blue</Badge>
        <Badge variant={"orange"}>Orange</Badge>
        <Badge variant={"purple"}>Purple</Badge>
      </div>
    </div>
  );
}
