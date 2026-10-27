"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Clock, BookOpen, CheckCircle, TrendingUp } from "lucide-react";
import { TestSection } from "@/types";

export interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: number;
  section?: TestSection;
}

export function StatsCard({ title, value, subtitle, icon, trend, section }: StatsCardProps) {
  // Get color based on section
  const getSectionColor = () => {
    if (!section) return "bg-brand/10 text-brand";
    
    switch (section) {
      case "reading":
        return "bg-blue-100 text-blue-600";
      case "listening":
        return "bg-green-100 text-green-600";
      case "writing":
        return "bg-purple-100 text-purple-600";
      case "speaking":
        return "bg-orange-100 text-orange-600";
      default:
        return "bg-brand/10 text-brand";
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={`p-2 rounded-lg ${getSectionColor()}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-2 text-sm">
            <span className={trend >= 0 ? "text-success" : "text-danger"}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}
            </span>
            <span className="text-muted-foreground">vs last week</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
