"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";

interface Book {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  pagesRead: number;
  progress: number;
  targetPagesPerDay: number;
  daysRemaining: number | null;
  status: "want-to-read" | "reading" | "completed";
}

export default function TrackerPage() {
  const { data: books, mutate } = useSWR<Book[]>("/api/books", fetcher);
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [pagesToLog, setPagesToLog] = useState("");

  const handleLogPages = async () => {
    if (!selectedBook || !pagesToLog) return;

    const pages = parseInt(pagesToLog);
    if (isNaN(pages) || pages <= 0) {
      toast.error("Please enter a valid number of pages.");
      return;
    }

    try {
      const response = await fetch(`/api/books/${selectedBook.id}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pagesRead: pages }),
      });

      if (!response.ok) throw new Error("Failed to log pages");

      toast.success("Reading logged successfully!");
      setPagesToLog("");
      setIsLogDialogOpen(false);
      mutate();
    } catch (err) {
      toast.error("Failed to log reading.");
    }
  };

  if (!books) return <div className="p-8">Loading books...</div>;

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Book Tracker</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {books?.map((book) => (
          <Card key={book.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="truncate" title={book.title}>
                {book.title}
              </CardTitle>
              <CardDescription>{book.author}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>
                    {book.pagesRead} / {book.totalPages} pages (
                    {Math.round(book.progress)}%)
                  </span>
                </div>
                <Progress value={book.progress} />
              </div>

              <div className="text-sm text-muted-foreground">
                <p>
                  Status:{" "}
                  <span className="capitalize">
                    {book.status.replace(/-/g, " ")}
                  </span>
                </p>
                {book.daysRemaining !== null && book.status !== "completed" && (
                  <p>
                    Estimated completion: {book.daysRemaining}{" "}
                    {book.daysRemaining === 1 ? "day" : "days"}
                    {book.targetPagesPerDay > 0 &&
                      ` (@ ${book.targetPagesPerDay} pages/day)`}
                  </p>
                )}
                {book.status === "completed" && (
                  <p className="text-green-600 font-medium">Completed!</p>
                )}
              </div>

              <div className="mt-auto pt-4">
                <Dialog
                  open={isLogDialogOpen && selectedBook?.id === book.id}
                  onOpenChange={(open) => {
                    setIsLogDialogOpen(open);
                    if (!open) setSelectedBook(null);
                    else setSelectedBook(book);
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={book.status === "completed"}
                    >
                      <PlusIcon className="mr-2 h-4 w-4" /> Log Reading
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Log Reading for {book.title}</DialogTitle>
                      <DialogDescription>
                        How many pages did you read today?
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="pages" className="text-right">
                          Pages
                        </Label>
                        <Input
                          id="pages"
                          type="number"
                          value={pagesToLog}
                          onChange={(e) => setPagesToLog(e.target.value)}
                          className="col-span-3"
                          placeholder="e.g. 25"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleLogPages}>Save log</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}

        {books?.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            You are not tracking any books yet. Ask the AI assistant to add one
            for you!
          </div>
        )}
      </div>
    </div>
  );
}
