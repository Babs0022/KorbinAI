
<<<<<<< HEAD
// This page has been removed as the chat functionality has been moved to a dynamic route /chat/[chatId]
export default function ObsoletePage() {
  return null;
=======
// This page's content has been moved to the main dashboard (app/page.tsx).
// This file is kept to prevent broken links but can be removed in the future.
import { redirect } from 'next/navigation';

export default function ChatPage() {
  redirect('/');
>>>>>>> 40454ef15872741c4d8cc53664f80761b018c73a
}
