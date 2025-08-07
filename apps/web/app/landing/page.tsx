import BadgeDemo from "./badges";
import ButtonDemo from "./buttons";
import CheckboxFilter from "./checkboxFilter";
import InputDemo from "./inputs";

export default function ButtonGroupDemo() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 m-10">
      <div className="space-y-10">
        <ButtonDemo />
        <div className="w-[200px]">
          <CheckboxFilter />
        </div>
      </div>
      <div>
        <BadgeDemo />
        <InputDemo />
      </div>
    </div>
  );
}
