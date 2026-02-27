import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { updateBook, deleteBook, getBookById } from "@/lib/db/queries";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { title, author, totalPages, status, targetPagesPerDay } = body;

  const book = await getBookById(id);
  if (!book || book.userId !== session.user.id) {
    return NextResponse.json({ error: "Book not found or unauthorized" }, { status: 404 });
  }

  const [updatedBook] = await updateBook({
    id,
    userId: session.user.id,
    title,
    author,
    totalPages,
    status,
    targetPagesPerDay,
  });

  return NextResponse.json(updatedBook);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const book = await getBookById(id);
  if (!book || book.userId !== session.user.id) {
    return NextResponse.json({ error: "Book not found or unauthorized" }, { status: 404 });
  }

  await deleteBook({ id, userId: session.user.id });
  return NextResponse.json({ success: true });
}
