"use client";

import * as React from "react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Clock, Users, Zap } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { SubscriptionPlan } from "@/types";

export interface PricingCardProps {
  plan: {
    id: string;
    name: string;
    description: string;
    price: number; // in paise
    period: "month" | "year";
    features: string[];
    isPopular?: boolean;
    isPro?: boolean;
  };
  onSelect: (planId: string, planType: SubscriptionPlan) => void;
  isLoading?: boolean;
  userSubscription?: 'free' | 'pro';
}

export function PricingCard({ plan, onSelect, isLoading, userSubscription }: PricingCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const isCurrentPlan = userSubscription === 'pro' && plan.isPro;

  const handleSelect = () => {
    if (!isCurrentPlan) {
      onSelect(plan.id, plan.period === "month" ? "monthly" : "yearly");
    }
  };

  return (
    <Card
      className={`relative flex flex-col ${plan.isPopular ? 'border-brand shadow-brand/25' : 'hover:shadow-lg transition-shadow'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {plan.isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <Badge variant="brand" className="px-4 py-1 text-sm font-medium">
            Most Popular
          </Badge>
        </div>
      )}

      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>{plan.name}</span>
          {plan.isPro && <Star className="h-5 w-5 text-yellow-500" />}
        </CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="space-y-6">
          {/* Price */}
          <div className="text-center">
            <span className="text-4xl font-bold text-brand">
              {formatCurrency(plan.price)}
            </span>
            <span className="text-muted-foreground">
              /{plan.period === "month" ? "month" : "year"}
            </span>
          </div>

          {/* Features */}
          <ul className="space-y-3">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3">
                <Check className="h-5 w-5 text-success shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>

          {/* Benefits */}
          {plan.isPro && (
            <div className="p-4 bg-brand/5 border brand/10 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-brand" />
                <span className="text-sm font-medium text-brand">AI-Powered Feedback</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-brand" />
                <span className="text-sm font-medium text-brand">Unlimited Practice Tests</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-brand" />
                <span className="text-sm font-medium text-brand">Detailed Analytics</span>
              </div>
            </div>
          )}

          {/* CTA Button */}
          <Button
            onClick={handleSelect}
            className="w-full"
            variant={plan.isPopular ? "brand" : "outline"}
            disabled={isLoading || isCurrentPlan}
            size="lg"
          >
            {isCurrentPlan ? (
              "Current Plan"
            ) : isLoading ? (
              "Processing..."
            ) : (
              `Get Started with ${plan.name}`
            )}
          </Button>

          {isCurrentPlan && (
            <p className="text-center text-sm text-success">
              You are currently on this plan
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
