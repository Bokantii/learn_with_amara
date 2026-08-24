import { Check } from "lucide-react";
import { Card, CardContent, CardHeader } from "../../components/ui/card";

export default function BenefitsList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <Card className="border-2 bg-slate-50/60 mt-8">
      <CardHeader className="p-6 pb-2">
        <h3 className="text-lg">{title}</h3>
      </CardHeader>
      <CardContent className="p-6 pt-2">
        <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
