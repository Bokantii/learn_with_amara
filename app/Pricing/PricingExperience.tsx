"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import CurrencySelector from "./CurrencySelector";
import ProgrammeCard from "../../components/ProgrammeCard";
import BenefitsList from "./BenefitsList";
import {
  CURRENCIES,
  PROGRAMME_CATEGORIES,
  GROUP_PROGRAMME_INCLUDES,
  PRIVATE_PROGRAMME_INCLUDES,
  getProgrammesByCategory,
  type Currency,
  type Programme,
} from "../../lib/programmes";

const CURRENCY_STORAGE_KEY = "iclp-pricing-currency";
const DEFAULT_CURRENCY: Currency = "CAD";

export default function PricingExperience() {
  const router = useRouter();
  const [currency, setCurrency] = useState<Currency>(DEFAULT_CURRENCY);
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (stored && (CURRENCIES as string[]).includes(stored)) {
      setCurrency(stored as Currency);
    }
  }, []);

  const handleCurrencyChange = (next: Currency) => {
    setCurrency(next);
    window.localStorage.setItem(CURRENCY_STORAGE_KEY, next);
  };

  const handleSelect = (programme: Programme) => {
    setSelectedProgrammeId(programme.id);
    setIsNavigating(true);
    router.push(`/checkout?planId=${programme.id}&currency=${currency}`);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <CurrencySelector value={currency} onChange={handleCurrencyChange} />
      </div>

      <Tabs defaultValue={PROGRAMME_CATEGORIES[0].id} className="w-full">
        <div className="flex justify-center">
          <TabsList>
            {PROGRAMME_CATEGORIES.map((category) => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {PROGRAMME_CATEGORIES.map((category) => {
          const programmes = getProgrammesByCategory(category.id);
          const includes =
            category.id === "private" ? PRIVATE_PROGRAMME_INCLUDES : GROUP_PROGRAMME_INCLUDES;
          const includesTitle =
            category.id === "private"
              ? "All private packages include"
              : "All group programmes include";

          return (
            <TabsContent key={category.id} value={category.id} className="mt-8">
              <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-8">
                {category.description}
              </p>
              <div
                className={`grid gap-6 lg:gap-8 max-w-6xl mx-auto ${
                  programmes.length >= 3 ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2"
                }`}
              >
                {programmes.map((programme) => (
                  <ProgrammeCard
                    key={programme.id}
                    programme={programme}
                    currency={currency}
                    isSelected={selectedProgrammeId === programme.id}
                    isNavigating={isNavigating && selectedProgrammeId === programme.id}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
              <div className="max-w-6xl mx-auto">
                <BenefitsList title={includesTitle} items={includes} />
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
