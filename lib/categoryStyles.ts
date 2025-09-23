import { Mail, Server, CreditCard, Globe } from 'lucide-react'

export const categoryStyles: Record<string, { icon: any; color: string }> = {
  Outlook: { icon: Mail, color: 'text-blue-600' },
  'Instally.ai': { icon: CreditCard, color: 'text-pink-600' },
  Hostinger: { icon: Server, color: 'text-purple-600' },
  SiteGround: { icon: Globe, color: 'text-green-600' }
}

export const categories = Object.keys(categoryStyles)
