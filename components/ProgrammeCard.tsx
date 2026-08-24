import { Calendar, Clock, Repeat, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { formatPrice, type Programme, type Currency } from "../lib/programmes";

export default function ProgrammeCard({
  programme,
  currency,
  isSelected,
  isNavigating,
  onSelect,
  ctaLabel = "Select Programme",
  highlightLabel,
}: {
  programme: Programme;
  currency: Currency;
  isSelected: boolean;
  isNavigating: boolean;
  onSelect: (programme: Programme) => void;
  ctaLabel?: string;
  highlightLabel?: string;
}) {
  const currencyNote = programme.currencyNotes?.[currency];
  const durationLabel = programme.isMinimumDuration
    ? `Minimum ${programme.duration}`
    : programme.duration;

  return (
    <Card
      className={`relative border-2 transition-all duration-300 flex flex-col ${
        isSelected
          ? "border-primary shadow-xl"
          : "border-border hover:border-primary/50 hover:shadow-lg"
      }`}
    >
      {highlightLabel && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-white px-4 py-1 rounded-full text-sm">
          {highlightLabel}
        </div>
      )}
      <CardHeader className="p-6 space-y-3">
        <h3 className="text-xl leading-snug">{programme.name}</h3>

        <div className="pt-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-3xl lg:text-4xl text-primary">
              {formatPrice(currency, programme.prices[currency])}
            </span>
            {programme.billingPeriod === "month" && (
              <span className="text-muted-foreground text-sm">/ month</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {programme.billingPeriod === "once" ? "Full programme, paid once" : durationLabel}
          </p>
          {currencyNote && (
            <Badge variant="secondary" className="mt-2 bg-sky-50 text-sky-700 hover:bg-sky-50">
              {currencyNote}
            </Badge>
          )}
          {programme.alternativePayment && programme.alternativePayment.currency === currency && (
            <p className="text-xs text-muted-foreground mt-2">
              or {formatPrice(programme.alternativePayment.currency, programme.alternativePayment.amount)}{" "}
              {programme.alternativePayment.label.toLowerCase()}
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0 space-y-4 flex flex-col flex-1">
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Repeat className="w-4 h-4 text-primary shrink-0" />
            <span>{programme.frequency}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary shrink-0" />
            <span>{durationLabel}</span>
          </div>
          {programme.sessionLength && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary shrink-0" />
              <span>{programme.sessionLength} per session</span>
            </div>
          )}
        </div>

        {programme.category === "private" && (
          <div className="flex items-center gap-1" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <span
                key={index}
                className={`h-1.5 flex-1 rounded-full ${
                  index < programme.frequencyCount ? "bg-primary" : "bg-slate-200"
                }`}
              />
            ))}
          </div>
        )}

        <div className="flex-1" />

        <Button
          className={`w-full ${
            isSelected ? "bg-accent hover:bg-accent/90" : "bg-primary hover:bg-primary/90"
          }`}
          size="lg"
          onClick={() => onSelect(programme)}
          disabled={isNavigating}
        >
          {isSelected ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {isNavigating ? "Redirecting..." : "Selected"}
            </>
          ) : (
            ctaLabel
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
