import { BookOpen, MessageCircle } from 'lucide-react'

export function EmptyStateIconBook() {
  return <BookOpen className="h-6 w-6" strokeWidth={1.5} aria-hidden />
}

export function EmptyStateIconChat() {
  return <MessageCircle className="h-6 w-6" strokeWidth={1.5} aria-hidden />
}
