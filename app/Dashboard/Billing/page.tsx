"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Download,
  CheckCircle2,
  Calendar,
} from "lucide-react";

type Subscription = {
  id: number;
  plan: string;
  status: "active" | "inactive";
  price: string;
  billingCycle: string;
  nextBilling: string;
  features: string[];
};

type Invoice = {
  id: number;
  date: string;
  description: string;
  amount: string;
  status: "paid" | "pending";
};

type PaymentMethod = {
  id: number;
  type: string;
  last4: string;
  expiry: string;
  isDefault: boolean;
};

const subscriptions: Subscription[] = [
  {
    id: 1,
    plan: "TCF Premium Package",
    status: "active",
    price: "$199",
    billingCycle: "Monthly",
    nextBilling: "Apr 13, 2026",
    features: [
      "Unlimited lessons",
      "Live classes",
      "Mock tests",
      "Personal tutor support",
    ],
  },
  {
    id: 2,
    plan: "TEF Standard Package",
    status: "active",
    price: "$149",
    billingCycle: "Monthly",
    nextBilling: "Apr 13, 2026",
    features: ["50 lessons/month", "Live classes", "Mock tests"],
  },
];

const invoices: Invoice[] = [
  {
    id: 1,
    date: "Mar 13, 2026",
    description: "TCF Premium Package - Monthly",
    amount: "$199.00",
    status: "paid",
  },
  {
    id: 2,
    date: "Mar 13, 2026",
    description: "TEF Standard Package - Monthly",
    amount: "$149.00",
    status: "paid",
  },
  {
    id: 3,
    date: "Feb 13, 2026",
    description: "TCF Premium Package - Monthly",
    amount: "$199.00",
    status: "paid",
  },
  {
    id: 4,
    date: "Feb 13, 2026",
    description: "TEF Standard Package - Monthly",
    amount: "$149.00",
    status: "paid",
  },
  {
    id: 5,
    date: "Jan 13, 2026",
    description: "TCF Premium Package - Monthly",
    amount: "$199.00",
    status: "paid",
  },
];

const paymentMethods: PaymentMethod[] = [
  {
    id: 1,
    type: "Visa",
    last4: "4242",
    expiry: "12/2027",
    isDefault: true,
  },
  {
    id: 2,
    type: "Mastercard",
    last4: "8888",
    expiry: "06/2026",
    isDefault: false,
  },
];

export default function Billing() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Billing</h1>
        <p className="mt-2 text-slate-600">
          Manage your subscriptions and payment methods
        </p>
      </div>

      {/* Active Subscriptions */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-slate-900">
          Active Subscriptions
        </h2>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {subscriptions.map((subscription) => (
            <Card key={subscription.id} className="border-sky-200 p-6">
              <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {subscription.plan}
                  </h3>

                  <Badge className="mt-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    Active
                  </Badge>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-bold text-sky-600">
                    {subscription.price}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {subscription.billingCycle}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <p className="mb-2 text-sm text-slate-600">Features:</p>

                <ul className="space-y-2">
                  {subscription.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 text-sm text-slate-700"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-4 text-sm text-slate-600">
                <Calendar className="h-4 w-4 text-sky-500" />
                <span>Next billing: {subscription.nextBilling}</span>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-slate-300"
                >
                  Manage Plan
                </Button>

                <Button
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  Cancel
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      <div>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            Payment Methods
          </h2>

          <Button className="bg-gradient-to-r from-sky-500 to-cyan-500 text-white hover:from-sky-600 hover:to-cyan-600">
            Add Payment Method
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {paymentMethods.map((method) => (
            <Card key={method.id} className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-cyan-500">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900">
                      {method.type} •••• {method.last4}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Expires {method.expiry}
                    </p>
                  </div>
                </div>

                {method.isDefault && (
                  <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100">
                    Default
                  </Badge>
                )}
              </div>

              <div className="flex gap-3">
                {!method.isDefault && (
                  <Button
                    variant="outline"
                    className="flex-1 border-slate-300"
                  >
                    Set as Default
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  Remove
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Billing History */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-slate-900">
          Billing History
        </h2>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">
                    Invoice
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {invoice.date}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-900">
                      {invoice.description}
                    </td>

                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {invoice.amount}
                    </td>

                    <td className="px-6 py-4">
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        {invoice.status}
                      </Badge>
                    </td>

                    <td className="px-6 py-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-sky-600 hover:bg-sky-50 hover:text-sky-700"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}