import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { auth } from "@/app/(auth)/auth";
import { Chat } from "@/components/chat";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { getChatById, getMessagesByChatId } from "@/lib/db/queries";
import { convertToUIMessages } from "@/lib/utils";
import { DataStreamHandler } from "@/components/data-stream-handler";
import type { VisibilityType } from "@/components/visibility-selector";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

  const session = await auth();

  if (chat.visibility === "private") {
    if (!session || !session.user) {
      return notFound();
    }

    if (session.user.id !== chat.userId) {
      return notFound();
    }
  }

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get("chat-model");

  const uiMessages = convertToUIMessages(messagesFromDb);

  if (!chatModelFromCookie) {
    return (
      <>
        <Chat
          id={chat.id}
          initialMessages={uiMessages}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialVisibilityType={chat.visibility as VisibilityType}
          isReadonly={session?.user?.id !== chat.userId}
          autoResume={true}
        />
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      <Chat
        id={chat.id}
        initialChatModel={chatModelFromCookie.value}
        initialMessages={uiMessages}
        initialVisibilityType={chat.visibility as VisibilityType}
        isReadonly={session?.user?.id !== chat.userId}
        autoResume={true}
      />
      <DataStreamHandler />
    </>
  );
}
