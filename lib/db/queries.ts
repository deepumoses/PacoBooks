import "server-only";
import { prisma } from "./prisma";
import type { ArtifactKind } from "@/components/artifact";
import type { VisibilityType } from "@/components/visibility-selector";
import { ChatbotError } from "../errors";
import { generateUUID } from "../utils";
import { generateHashedPassword } from "./utils";
import type { Prisma } from "@prisma/client";

export async function getUser(email: string) {
  try {
    return await prisma.user.findMany({
      where: { email },
    });
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get user by email"
    );
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    return await prisma.user.create({
      data: { email, password: hashedPassword },
    });
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to create user");
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    const user = await prisma.user.create({
      data: { email, password },
      select: { id: true, email: true },
    });
    return [user];
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to create guest user"
    );
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  try {
    return await prisma.chat.create({
      data: {
        id,
        userId,
        title,
        visibility,
      },
    });
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to save chat");
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    return await prisma.chat.delete({
      where: { id },
    });
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to delete chat by id"
    );
  }
}

export async function deleteAllChatsByUserId({ userId }: { userId: string }) {
  try {
    const deleted = await prisma.chat.deleteMany({
      where: { userId },
    });
    return { deletedCount: deleted.count };
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to delete all chats by user id"
    );
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;
    let where: Prisma.ChatWhereInput = { userId: id };

    if (startingAfter) {
      const selectedChat = await prisma.chat.findUnique({
        where: { id: startingAfter },
        select: { createdAt: true },
      });

      if (!selectedChat) {
        throw new ChatbotError(
          "not_found:database",
          `Chat with id ${startingAfter} not found`
        );
      }
      where = { ...where, createdAt: { lt: selectedChat.createdAt } };
    } else if (endingBefore) {
      const selectedChat = await prisma.chat.findUnique({
        where: { id: endingBefore },
        select: { createdAt: true },
      });
      if (!selectedChat) {
        throw new ChatbotError(
          "not_found:database",
          `Chat with id ${endingBefore} not found`
        );
      }
      where = { ...where, createdAt: { gt: selectedChat.createdAt } };
    }

    const chats = await prisma.chat.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: extendedLimit,
    });

    const hasMore = chats.length > limit;
    const resultChats = hasMore ? chats.slice(0, limit) : chats;

    return {
      chats: resultChats,
      hasMore,
    };
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get chats by user id"
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    return await prisma.chat.findUnique({
      where: { id },
    });
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to get chat by id");
  }
}

export async function saveMessages({ messages }: { messages: any[] }) {
  try {
    return await prisma.message.createMany({
      data: messages.map((m) => ({
        id: m.id,
        chatId: m.chatId,
        role: m.role,
        parts: m.parts,
        attachments: m.attachments,
        createdAt: m.createdAt,
      })),
    });
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to save messages");
  }
}

export async function updateMessage({
  id,
  parts,
}: {
  id: string;
  parts: any;
}) {
  try {
    return await prisma.message.update({
      where: { id },
      data: { parts },
    });
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to update message");
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await prisma.message.findMany({
      where: { chatId: id },
      orderBy: { createdAt: "asc" },
    });
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get messages by chat id"
    );
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: "up" | "down";
}) {
  try {
    const isUpvoted = type === "up";
    return await prisma.vote.upsert({
      where: {
        chatId_messageId: {
          chatId,
          messageId,
        },
      },
      update: { isUpvoted },
      create: {
        chatId,
        messageId,
        isUpvoted,
      },
    });
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to vote message");
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await prisma.vote.findMany({
      where: { chatId: id },
    });
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get votes by chat id"
    );
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    const now = new Date();
    return await prisma.document.create({
      data: {
        id,
        title,
        kind,
        content,
        userId,
        createdAt: now,
      },
    });
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to save document");
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    return await prisma.document.findMany({
      where: { id },
      orderBy: { createdAt: "asc" },
    });
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get documents by id"
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    return await prisma.document.findFirst({
      where: { id },
      orderBy: { createdAt: "desc" },
    });
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get document by id"
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    const documentsToDelete = await prisma.document.findMany({
      where: {
        id,
        createdAt: { gt: timestamp },
      },
    });

    await prisma.document.deleteMany({
      where: {
        id,
        createdAt: { gt: timestamp },
      },
    });

    return documentsToDelete;
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to delete documents by id after timestamp"
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: any[]; // Prisma type
}) {
  try {
    return await prisma.suggestion.createMany({
      data: suggestions,
    });
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to save suggestions"
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await prisma.suggestion.findMany({
      where: { documentId },
    });
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get suggestions by document id"
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    const message = await prisma.message.findUnique({
      where: { id },
    });
    return message ? [message] : [];
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get message by id"
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    await prisma.message.deleteMany({
      where: {
        chatId,
        createdAt: { gte: timestamp },
      },
    });
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to delete messages by chat id after timestamp"
    );
  }
}

export async function updateChatVisibilityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: "private" | "public";
}) {
  try {
    return await prisma.chat.update({
      where: { id: chatId },
      data: { visibility },
    });
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to update chat visibility by id"
    );
  }
}

export async function updateChatTitleById({
  chatId,
  title,
}: {
  chatId: string;
  title: string;
}) {
  try {
    return await prisma.chat.update({
      where: { id: chatId },
      data: { title },
    });
  } catch (error) {
    console.warn("Failed to update title for chat", chatId, error);
    return;
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}) {
  try {
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000
    );

    const count = await prisma.message.count({
      where: {
        role: "user",
        createdAt: { gte: twentyFourHoursAgo },
        chat: {
          userId: id,
        },
      },
    });

    return count;
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get message count by user id"
    );
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await prisma.stream.create({
      data: {
        id: streamId,
        chatId,
        createdAt: new Date(),
      },
    });
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to create stream id"
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streams = await prisma.stream.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    return streams.map((s) => s.id);
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get stream ids by chat id"
    );
  }
}

// Book Tracker Queries

export async function getBooksByUserId(userId: string) {
  try {
    return await prisma.book.findMany({
      where: { userId },
    });
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to get books");
  }
}

export async function getBookById(id: string) {
  try {
    return await prisma.book.findUnique({
      where: { id },
    });
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to get book by id");
  }
}

export async function createBook({
  userId,
  title,
  author,
  totalPages,
  targetPagesPerDay,
}: {
  userId: string;
  title: string;
  author: string;
  totalPages: number;
  targetPagesPerDay?: number;
}) {
  try {
    const book = await prisma.book.create({
      data: {
        userId,
        title,
        author,
        totalPages,
        targetPagesPerDay: targetPagesPerDay ?? 0,
      },
    });
    return [book];
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to create book");
  }
}

export async function updateBook({
  id,
  userId,
  ...updates
}: {
  id: string;
  userId: string;
  title?: string;
  author?: string;
  totalPages?: number;
  status?: "want-to-read" | "reading" | "completed";
  targetPagesPerDay?: number;
}) {
  try {
    const book = await prisma.book.findFirst({
        where: { id, userId }
    });
    if (!book) throw new Error("Not found");

    const updated = await prisma.book.update({
      where: { id },
      data: { ...updates },
    });
    return [updated];
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to update book");
  }
}

export async function deleteBook({ id, userId }: { id: string; userId: string }) {
  try {
    const book = await prisma.book.findFirst({
        where: { id, userId }
    });
    if (!book) return [];

    const deleted = await prisma.book.delete({
      where: { id },
    });
    return [deleted];
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to delete book");
  }
}

export async function addReadingLog({
  bookId,
  pagesRead,
}: {
  bookId: string;
  pagesRead: number;
}) {
  try {
    const log = await prisma.readingLog.create({
      data: {
        bookId,
        pagesRead,
      },
    });
    return [log];
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to add reading log");
  }
}

export async function getReadingLogsByBookId(bookId: string) {
  try {
    return await prisma.readingLog.findMany({
      where: { bookId },
      orderBy: { date: "desc" },
    });
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get reading logs"
    );
  }
}

export async function getBookAnalytics(userId: string) {
  try {
    const books = await prisma.book.findMany({
      where: { userId },
      include: { readingLogs: true },
    });

    const totalBooks = books.length;
    const completedBooks = books.filter((b) => b.status === "completed").length;

    let totalPagesRead = 0;
    for (const book of books) {
        for (const log of book.readingLogs) {
            totalPagesRead += log.pagesRead;
        }
    }

    return {
      totalBooks,
      completedBooks,
      totalPagesRead,
    };
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get book analytics"
    );
  }
}
