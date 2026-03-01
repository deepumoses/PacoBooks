import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { addReadingLog, getBookById } from "@/lib/db/queries";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { pagesRead } = body;

  const book = await getBookById(id);
  if (!book || book.userId !== session.user.id) {
    return NextResponse.json({ error: "Book not found or unauthorized" }, { status: 404 });
  }

  const [log] = await addReadingLog({ bookId: id, pagesRead });
  return NextResponse.json(log);
}
