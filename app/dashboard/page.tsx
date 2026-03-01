"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetcher } from "@/lib/utils";
import useSWR from "swr";
import { BookOpen, CheckCircle, BarChart } from "lucide-react";

interface Analytics {
  totalBooks: number;
  completedBooks: number;
  totalPagesRead: number;
}

export default function DashboardPage() {
  const { data: analytics, error, isLoading } = useSWR<Analytics>("/api/analytics", fetcher);

  if (isLoading) return <div className="p-8">Loading analytics...</div>;
  if (error) return <div className="p-8">Error loading analytics.</div>;

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="flex items-center space-x-4 p-4">
          <BookOpen className="h-12 w-12 text-primary" />
          <div className="flex-1">
            <CardHeader className="p-0">
              <CardTitle className="text-sm font-medium">Total Books Tracked</CardTitle>
            </CardHeader>
            <CardContent className="p-0 mt-2">
              <span className="text-2xl font-bold">{analytics?.totalBooks}</span>
            </CardContent>
          </div>
        </Card>

        <Card className="flex items-center space-x-4 p-4">
          <CheckCircle className="h-12 w-12 text-green-500" />
          <div className="flex-1">
            <CardHeader className="p-0">
              <CardTitle className="text-sm font-medium">Books Completed</CardTitle>
            </CardHeader>
            <CardContent className="p-0 mt-2">
              <span className="text-2xl font-bold">{analytics?.completedBooks}</span>
            </CardContent>
          </div>
        </Card>

        <Card className="flex items-center space-x-4 p-4">
          <BarChart className="h-12 w-12 text-blue-500" />
          <div className="flex-1">
            <CardHeader className="p-0">
              <CardTitle className="text-sm font-medium">Total Pages Read</CardTitle>
            </CardHeader>
            <CardContent className="p-0 mt-2">
              <span className="text-2xl font-bold">{analytics?.totalPagesRead}</span>
            </CardContent>
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Reading Overview</h2>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p>More detailed analytics and charts coming soon!</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
