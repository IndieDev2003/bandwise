"use client";

import * as React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart3, Clock, Eye, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { formatDate, getBandDescriptor } from "@/lib/utils";
import { TestHistory as TestHistoryType, AttemptStatus, TestSection } from "@/types";

export interface TestHistoryProps {
  history: TestHistoryType[];
  onViewDetails?: (attemptId: string) => void;
}

export function TestHistory({ history, onViewDetails }: TestHistoryProps) {
  const [selectedSection, setSelectedSection] = useState<TestSection | "all">("all");
  const [sortBy, setSortBy] = useState<"date" | "score" | "time">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filter and sort data
  const processedHistory = React.useMemo(() => {
    let filtered = [...history];

    // Filter by section
    if (selectedSection !== "all") {
      filtered = filtered.filter((h) => h.section === selectedSection);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "date":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "score":
          comparison = (a.band_score || 0) - (b.band_score || 0);
          break;
        case "time":
          comparison = (a.time_taken || 0) - (b.time_taken || 0);
          break;
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

    return filtered;
  }, [history, selectedSection, sortBy, sortOrder]);

  // Get section color
  const getSectionColor = (section: TestSection) => {
    switch (section) {
      case "reading":
        return "bg-blue-100 text-blue-800";
      case "listening":
        return "bg-green-100 text-green-800";
      case "writing":
        return "bg-purple-100 text-purple-800";
      case "speaking":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Get status color
  const getStatusColor = (status: AttemptStatus) => {
    switch (status) {
      case "submitted":
        return "bg-success/10 text-success";
      case "completed":
        return "bg-brand/10 text-brand";
      case "in_progress":
        return "bg-warning/10 text-warning";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Calculate trend
  const getTrend = (currentScore: number, previousScore: number) => {
    if (previousScore === null) return null;
    const difference = currentScore - previousScore;
    return difference > 0 ? "up" : difference < 0 ? "down" : "neutral";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Test History</span>
          <div className="flex items-center gap-2">
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value as TestSection | "all")}
              className="px-3 py-1 rounded-md border bg-background text-sm"
            >
              <option value="all">All Sections</option>
              <option value="reading">Reading</option>
              <option value="listening">Listening</option>
              <option value="writing">Writing</option>
              <option value="speaking">Speaking</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "date" | "score" | "time")}
              className="px-3 py-1 rounded-md border bg-background text-sm"
            >
              <option value="date">Date</option>
              <option value="score">Score</option>
              <option value="time">Time Taken</option>
            </select>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            >
              {sortOrder === "desc" ? "↓" : "↑"}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {processedHistory.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No test history available</p>
            <p className="text-sm mt-2">Start practicing to see your results here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Test</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Time Taken</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedHistory.map((test, index) => {
                  // Find previous score for trend
                  const previousScore = index > 0 && processedHistory[index - 1].section === test.section
                    ? processedHistory[index - 1].band_score
                    : null;
                  const trend = getTrend(test.band_score || 0, previousScore || 0);

                  return (
                    <TableRow key={test.attempt_id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(test.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getSectionColor(test.section)}>
                          {test.section.charAt(0).toUpperCase() + test.section.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-40 truncate">{test.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{test.band_score?.toFixed(1) || "N/A"}</span>
                          {trend && (
                            <span className={trend === "up" ? "text-success" : trend === "down" ? "text-danger" : "text-muted-foreground"}>
                              {trend === "up" && <TrendingUp className="h-4 w-4" />}
                              {trend === "down" && <TrendingDown className="h-4 w-4" />}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {test.time_taken ? `${Math.floor(test.time_taken / 60)}:${(test.time_taken % 60).toString().padStart(2, '0')}` : "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(test.status)}>
                          {test.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => onViewDetails?.(test.attempt_id)}>
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{test.title}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-4 gap-4">
                                <div className="text-center p-3 bg-muted/50 rounded-lg">
                                  <p className="text-sm text-muted-foreground">Section</p>
                                  <Badge variant="outline" className={getSectionColor(test.section)}>
                                    {test.section}
                                  </Badge>
                                </div>
                                <div className="text-center p-3 bg-muted/50 rounded-lg">
                                  <p className="text-sm text-muted-foreground">Score</p>
                                  <p className="text-xl font-bold text-brand">{test.band_score?.toFixed(1) || "N/A"}</p>
                                </div>
                                <div className="text-center p-3 bg-muted/50 rounded-lg">
                                  <p className="text-sm text-muted-foreground">Date</p>
                                  <p className="font-medium">{formatDate(test.created_at)}</p>
                                </div>
                                <div className="text-center p-3 bg-muted/50 rounded-lg">
                                  <p className="text-sm text-muted-foreground">Time</p>
                                  <p className="font-medium">
                                    {test.time_taken ? `${Math.floor(test.time_taken / 60)}:${(test.time_taken % 60).toString().padStart(2, '0')}` : "N/A"}
                                  </p>
                                </div>
                              </div>
                              
                              {test.band_score && (
                                <div className="p-4 bg-brand/5 border brand/10 rounded-lg">
                                  <p className="text-sm text-muted-foreground mb-1">Band Descriptor</p>
                                  <p className="text-sm">{getBandDescriptor(test.band_score)}</p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
