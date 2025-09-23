import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!


export const supabase = createClient(supabaseUrl, supabaseKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          created_at: string
          wallet_balance: number
        }
        Insert: {
          id?: string
          email: string
          name: string
          created_at?: string
          wallet_balance?: number
        }
        Update: {
          id?: string
          email?: string
          name?: string
          created_at?: string
          wallet_balance?: number
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          date: string
          category: string
          subcategory: string
          amount: number
          type: 'income' | 'expense'
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          category: string
          subcategory: string
          amount: number
          type: 'income' | 'expense'
          description?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          category?: string
          subcategory?: string
          amount?: number
          type?: 'income' | 'expense'
          description?: string
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          service_name: string
          subscription_id: string
          amount: number
          billing_cycle: 'monthly' | 'yearly' | 'weekly'
          start_date: string
          next_billing_date: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          service_name: string
          subscription_id: string
          amount: number
          billing_cycle: 'monthly' | 'yearly' | 'weekly'
          start_date: string
          next_billing_date: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          service_name?: string
          subscription_id?: string
          amount?: number
          billing_cycle?: 'monthly' | 'yearly' | 'weekly'
          start_date?: string
          next_billing_date?: string
          is_active?: boolean
          created_at?: string
        }
      }
    }
  }
}