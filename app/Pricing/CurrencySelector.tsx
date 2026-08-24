"use client";

import { ToggleGroup, ToggleGroupItem } from "../../components/ui/toggle-group";
import { CURRENCIES, type Currency } from "../../lib/programmes";

export default function CurrencySelector({
  value,
  onChange,
}: {
  value: Currency;
  onChange: (currency: Currency) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next as Currency);
      }}
      role="radiogroup"
      aria-label="Display currency"
      className="bg-white"
    >
      {CURRENCIES.map((currency) => (
        <ToggleGroupItem
          key={currency}
          value={currency}
          className="px-5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          {currency}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
