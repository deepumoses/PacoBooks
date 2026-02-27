import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getBooksByUserId, createBook } from "@/lib/db/queries";
import { readingLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Initialize database connection
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const books = await getBooksByUserId(session.user.id);

  // For each book, calculate progress.
  // Using Promise.all to fetch logs for each book.
  const booksWithProgress = await Promise.all(
    books.map(async (book) => {
      const logs = await db.select({ pagesRead: readingLog.pagesRead }).from(readingLog).where(eq(readingLog.bookId, book.id));
      const totalRead = logs.reduce((sum, log) => sum + log.pagesRead, 0);

      let daysRemaining = null;
      if (book.targetPagesPerDay && book.targetPagesPerDay > 0) {
        const remaining = book.totalPages - totalRead;
        daysRemaining = remaining > 0 ? Math.ceil(remaining / book.targetPagesPerDay) : 0;
      }

      return {
        ...book,
        pagesRead: totalRead,
        progress: (totalRead / book.totalPages) * 100,
        daysRemaining
      };
    })
  );

  return NextResponse.json(booksWithProgress);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, author, totalPages, targetPagesPerDay } = body;

  if (!title || !author || !totalPages) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [book] = await createBook({
    userId: session.user.id,
    title,
    author,
    totalPages,
    targetPagesPerDay: targetPagesPerDay ?? 0,
  });

  return NextResponse.json(book);
}
