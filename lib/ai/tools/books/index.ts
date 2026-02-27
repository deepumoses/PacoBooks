import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import {
  addReadingLog,
  createBook,
  deleteBook,
  getBookAnalytics,
  getBookById,
  getBooksByUserId,
  updateBook,
} from "@/lib/db/queries";

const createBookSchema = z.object({
  title: z.string().describe("The title of the book"),
  author: z.string().describe("The author of the book"),
  totalPages: z.number().describe("The total number of pages in the book"),
  targetPagesPerDay: z
    .number()
    .optional()
    .describe("Target pages to read per day (optional)"),
});

export const createBookTool = (session: Session) =>
  tool({
    description: "Add a new book to the user's tracking list.",
    parameters: createBookSchema,
    // @ts-ignore
    execute: async ({ title, author, totalPages, targetPagesPerDay }) => {
      if (!session?.user?.id) {
        throw new Error("User not authenticated");
      }
      const [book] = await createBook({
        userId: session.user.id,
        title,
        author,
        totalPages,
        targetPagesPerDay,
      });
      return { success: true, book: JSON.stringify(book) };
    },
  });

export const getBooksTool = (session: Session) =>
  tool({
    description: "Get the list of books the user is currently tracking.",
    parameters: z.object({}),
    execute: async () => {
      if (!session?.user?.id) {
        throw new Error("User not authenticated");
      }
      const books = await getBooksByUserId(session.user.id);
      return { books: JSON.stringify(books) };
    },
  });

const updateBookSchema = z.object({
  id: z.string().describe("The ID of the book to update"),
  title: z.string().optional(),
  author: z.string().optional(),
  totalPages: z.number().optional(),
  status: z.enum(["want-to-read", "reading", "completed"]).optional(),
  targetPagesPerDay: z.number().optional(),
});

export const updateBookTool = (session: Session) =>
  tool({
    description:
      "Update details of a book, such as title, author, status, or progress.",
    parameters: updateBookSchema,
    // @ts-ignore
    execute: async ({ id, ...updates }) => {
      if (!session?.user?.id) {
        throw new Error("User not authenticated");
      }
      // Verify ownership
      const existingBook = await getBookById(id);
      if (!existingBook || existingBook.userId !== session.user.id) {
        throw new Error("Book not found or unauthorized");
      }

      const [book] = await updateBook({
        id,
        userId: session.user.id,
        ...updates,
      });
      return { success: true, book: JSON.stringify(book) };
    },
  });

const deleteBookSchema = z.object({
  id: z.string().describe("The ID of the book to delete"),
});

export const deleteBookTool = (session: Session) =>
  tool({
    description: "Delete a book from the tracking list.",
    parameters: deleteBookSchema,
    // @ts-ignore
    execute: async ({ id }) => {
      if (!session?.user?.id) {
        throw new Error("User not authenticated");
      }
      const result = await deleteBook({ id, userId: session.user.id });
      if (result.length === 0) {
        throw new Error("Book not found or unauthorized");
      }
      return { success: true, deletedBookId: id };
    },
  });

const logReadingSchema = z.object({
  bookId: z.string().describe("The ID of the book"),
  pagesRead: z
    .number()
    .describe("The number of pages read in this session"),
});

export const logReadingTool = (session: Session) =>
  tool({
    description: "Log pages read for a specific book.",
    parameters: logReadingSchema,
    // @ts-ignore
    execute: async ({ bookId, pagesRead }) => {
      if (!session?.user?.id) {
        throw new Error("User not authenticated");
      }
      const existingBook = await getBookById(bookId);
      if (!existingBook || existingBook.userId !== session.user.id) {
        throw new Error("Book not found or unauthorized");
      }

      const [log] = await addReadingLog({ bookId, pagesRead });
      return { success: true, log: JSON.stringify(log) };
    },
  });

export const getAnalyticsTool = (session: Session) =>
  tool({
    description: "Get reading analytics for the user.",
    parameters: z.object({}),
    execute: async () => {
      if (!session?.user?.id) {
        throw new Error("User not authenticated");
      }
      const analytics = await getBookAnalytics(session.user.id);
      return { analytics: JSON.stringify(analytics) };
    },
  });
