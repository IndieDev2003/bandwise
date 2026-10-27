"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { TestSection } from "@/types";

export interface ProgressData {
  date: string;
  section: TestSection;
  band_score: number;
}

export interface ProgressChartProps {
  data: ProgressData[];
  title?: string;
}

export function ProgressChart({ data, title = "Your Progress" }: ProgressChartProps) {
  const [selectedSection, setSelectedSection] = useState<TestSection | "all">("all");
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");

  // Filter data based on selection
  const filteredData = React.useMemo(() => {
    const now = new Date();
    let startDate = new Date(0); // All time by default

    switch (timeRange) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    return data.filter((d) => {
      const date = new Date(d.date);
      const isWithinRange = date >= startDate;
      const isCorrectSection = selectedSection === "all" || d.section === selectedSection;
      return isWithinRange && isCorrectSection;
    });
  }, [data, selectedSection, timeRange]);

  // Calculate statistics
  const statistics = React.useMemo(() => {
    if (filteredData.length === 0) {
      return {
        average: 0,
        highest: 0,
        lowest: 0,
        improvement: 0,
        trend: "neutral",
      };
    }

    const scores = filteredData.map((d) => d.band_score);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    
    // Calculate improvement (difference between last and first)
    const sortedData = [...filteredData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const improvement = sortedData.length > 1 
      ? sortedData[sortedData.length - 1].band_score - sortedData[0].band_score 
      : 0;

    const trend = improvement > 0 ? "up" : improvement < 0 ? "down" : "neutral";

    return {
      average: parseFloat(average.toFixed(1)),
      highest: parseFloat(highest.toFixed(1)),
      lowest: parseFloat(lowest.toFixed(1)),
      improvement: parseFloat(improvement.toFixed(1)),
      trend,
    };
  }, [filteredData]);

  // Create chart data for simple visualization
  const chartData = React.useMemo(() => {
    const groupedByDate: Record<string, number> = {};
    filteredData.forEach((d) => {
      const date = new Date(d.date).toLocaleDateString();
      if (!groupedByDate[date]) {
        groupedByDate[date] = 0;
      }
      groupedByDate[date] += d.band_score;
    });

    return Object.entries(groupedByDate).map(([date, total]) => ({
      date,
      averageScore: parseFloat((total / filteredData.filter((d) => 
        new Date(d.date).toLocaleDateString() === date
      ).length).toFixed(1)),
    }));
  }, [filteredData]);

  // Simple bar chart component
  const SimpleBarChart = ({ data }: { data: { date: string; averageScore: number }[] }) => {
    if (data.length === 0) {
      return (
        <div className="h-40 flex items-center justify-center text-muted-foreground">
          No data available
        </div>
      );
    }

    const maxValue = Math.max(...data.map((d) => d.averageScore), 9);

    return (
      <div className="h-40 flex items-end gap-2 overflow-x-auto pb-4">
        {data.map((d, index) => (
          <div key={index} className="flex-1 min-w-8">
            <div className="h-full flex flex-col justify-end">
              <div
                className="w-full bg-brand transition-all duration-300"
                style={{ height: `${(d.averageScore / maxValue) * 100}%` }}
              />
              <span className="text-xs text-muted-foreground mt-2 text-center truncate">
                {d.date}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{title}</span>
          <div className="flex items-center gap-2">
            <Select value={selectedSection} onValueChange={(value: TestSection | "all") => setSelectedSection(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                <SelectItem value="reading">Reading</SelectItem>
                <SelectItem value="listening">Listening</SelectItem>
                <SelectItem value="writing">Writing</SelectItem>
                <SelectItem value="speaking">Speaking</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timeRange} onValueChange={(value: "week" | "month" | "year") => setTimeRange(value)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Statistics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-brand">{statistics.average}</p>
            <p className="text-xs text-muted-foreground">Average Score</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-success">{statistics.highest}</p>
            <p className="text-xs text-muted-foreground">Highest Score</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-warning">{statistics.lowest}</p>
            <p className="text-xs text-muted-foreground">Lowest Score</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className={`text-2xl font-bold ${statistics.trend === 'up' ? 'text-success' : statistics.trend === 'down' ? 'text-danger' : 'text-muted-foreground'}`}>
              {statistics.trend === 'up' ? '+' : ''}{statistics.improvement}
            </p>
            <p className="text-xs text-muted-foreground">Improvement</p>
          </div>
        </div>

        {/* Chart */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Score History
          </h4>
          <SimpleBarChart data={chartData} />
        </div>

        {/* Trend */}
        {filteredData.length > 1 && (
          <div className="mt-6 p-4 bg-brand/5 border brand/10 rounded-lg flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Overall Trend</p>
              <p className="font-medium">
                {statistics.trend === 'up' && "Your scores are improving!"}
                {statistics.trend === 'down' && "Keep practicing to improve your scores."}
                {statistics.trend === 'neutral' && "Your scores are consistent."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {statistics.trend === 'up' && <TrendingUp className="h-6 w-6 text-success" />}
              {statistics.trend === 'down' && <TrendingDown className="h-6 w-6 text-danger" />}
              {statistics.trend === 'neutral' && <Calendar className="h-6 w-6 text-muted-foreground" />}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
