import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PricingPage() {
  const tiers = [
    {
      name: "Free",
      price: "$0",
      description: "Essential book tracking for casual readers.",
      features: [
        "Track up to 5 books",
        "Basic analytics",
        "Manual reading logs",
        "AI Chat Assistant (Limited)",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Pro",
      price: "$9",
      description: "Advanced insights for avid bookworms.",
      features: [
        "Unlimited books",
        "Advanced analytics & trends",
        "Priority AI Support",
        "Reading goals & streaks",
        "Export data",
      ],
      cta: "Upgrade to Pro",
      popular: true,
    },
    {
      name: "Team",
      price: "$29",
      description: "For book clubs and reading groups.",
      features: [
        "Everything in Pro",
        "Group challenges",
        "Shared libraries",
        "Admin dashboard",
        "Priority support",
      ],
      cta: "Contact Sales",
      popular: false,
    },
  ];

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-muted-foreground">
          Choose the plan that fits your reading habits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {tiers.map((tier) => (
          <Card
            key={tier.name}
            className={`flex flex-col ${
              tier.popular ? "border-primary shadow-lg scale-105" : ""
            }`}
          >
            <CardHeader>
              <CardTitle className="text-2xl">{tier.name}</CardTitle>
              <CardDescription>{tier.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-6">
                <span className="text-4xl font-bold">{tier.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={tier.popular ? "default" : "outline"}
              >
                {tier.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
