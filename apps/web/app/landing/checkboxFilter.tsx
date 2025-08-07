import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";

const services = ["Animation", "Art", "Audio"];
const companySizes = ["0-20", "20-50", "50-100", "100-200"];

export default function CheckboxFilter() {
  return (
    <div>
      <p className="font-semibold text-3xl">Checkboxes</p>
      <Accordion type="multiple" className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>Services</AccordionTrigger>
          <AccordionContent>
            {services.map((service, idx) => (
              <div key={idx} className="flex mb-4">
                <Checkbox id={service} />
                <label
                  htmlFor={service}
                  className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 pl-2"
                >
                  {service}
                </label>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Company size</AccordionTrigger>
          <AccordionContent>
            {companySizes.map((companySize, idx) => (
              <div key={idx} className="flex mb-4">
                <Checkbox id={companySize} />
                <label
                  htmlFor={companySize}
                  className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 pl-2"
                >
                  {companySize}
                </label>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
