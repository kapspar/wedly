export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type WeddingType = 'hindu' | 'christian_catholic' | 'interfaith'
export type EventType =
  | 'engagement'
  | 'temple_ceremony'
  | 'church_ceremony'
  | 'reception'
  | 'home_ceremony'
  | 'sangeet'
  | 'mehndi'
  | 'other'
export type UserRole = 'couple' | 'vendor' | 'admin'
export type InquiryStatus = 'pending' | 'read' | 'replied' | 'closed'
export type VendorPriority = 'high' | 'medium' | 'low'
export type WeddingStatus = 'planning' | 'completed' | 'cancelled'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: UserRole
          full_name: string | null
          email: string
          avatar_url: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: UserRole
          full_name?: string | null
          email: string
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: UserRole
          full_name?: string | null
          email?: string
          avatar_url?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      weddings: {
        Row: {
          id: string
          couple_id: string
          partner1_name: string
          partner2_name: string
          wedding_type: WeddingType
          wedding_date: string | null
          seeking_auspicious_date: boolean
          city: string | null
          slug: string
          status: WeddingStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          couple_id: string
          partner1_name: string
          partner2_name: string
          wedding_type: WeddingType
          wedding_date?: string | null
          seeking_auspicious_date?: boolean
          city?: string | null
          slug: string
          status?: WeddingStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          partner1_name?: string
          partner2_name?: string
          wedding_type?: WeddingType
          wedding_date?: string | null
          seeking_auspicious_date?: boolean
          city?: string | null
          slug?: string
          status?: WeddingStatus
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "weddings_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_events: {
        Row: {
          id: string
          wedding_id: string
          event_type: EventType
          custom_label: string | null
          event_date: string | null
          event_time: string | null
          venue_name: string | null
          notes: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          wedding_id: string
          event_type: EventType
          custom_label?: string | null
          event_date?: string | null
          event_time?: string | null
          venue_name?: string | null
          notes?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          event_type?: EventType
          custom_label?: string | null
          event_date?: string | null
          event_time?: string | null
          venue_name?: string | null
          notes?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "wedding_events_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_categories: {
        Row: {
          id: string
          wedding_id: string
          category: string
          budgeted: number
          spent: number
          is_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wedding_id: string
          category: string
          budgeted?: number
          spent?: number
          is_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          category?: string
          budgeted?: number
          spent?: number
          is_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_categories_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_categories: {
        Row: {
          id: string
          name: string
          slug: string
          display_order: number
          icon: string | null
          description: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          display_order?: number
          icon?: string | null
          description?: string | null
        }
        Update: {
          name?: string
          slug?: string
          display_order?: number
          icon?: string | null
          description?: string | null
        }
        Relationships: []
      }
      vendors: {
        Row: {
          id: string
          claimed_by: string | null
          category_id: string
          name: string
          slug: string
          description: string | null
          city: string
          area: string | null
          pricing_range: string | null
          website_url: string | null
          phone: string | null
          email: string | null
          instagram_url: string | null
          is_claimed: boolean
          is_featured: boolean
          is_published: boolean
          priority: VendorPriority
          source_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          claimed_by?: string | null
          category_id: string
          name: string
          slug: string
          description?: string | null
          city: string
          area?: string | null
          pricing_range?: string | null
          website_url?: string | null
          phone?: string | null
          email?: string | null
          instagram_url?: string | null
          is_claimed?: boolean
          is_featured?: boolean
          is_published?: boolean
          priority?: VendorPriority
          source_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          claimed_by?: string | null
          category_id?: string
          name?: string
          slug?: string
          description?: string | null
          city?: string
          area?: string | null
          pricing_range?: string | null
          website_url?: string | null
          phone?: string | null
          email?: string | null
          instagram_url?: string | null
          is_claimed?: boolean
          is_featured?: boolean
          is_published?: boolean
          priority?: VendorPriority
          source_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendors_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "vendor_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_photos: {
        Row: {
          id: string
          vendor_id: string
          storage_path: string
          alt_text: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          storage_path: string
          alt_text?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          storage_path?: string
          alt_text?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendor_photos_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          id: string
          vendor_id: string
          couple_id: string
          wedding_id: string | null
          message: string
          event_date: string | null
          guest_count: number | null
          status: InquiryStatus
          created_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          couple_id: string
          wedding_id?: string | null
          message: string
          event_date?: string | null
          guest_count?: number | null
          status?: InquiryStatus
          created_at?: string
        }
        Update: {
          status?: InquiryStatus
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_vendors: {
        Row: {
          couple_id: string
          vendor_id: string
          created_at: string
        }
        Insert: {
          couple_id: string
          vendor_id: string
          created_at?: string
        }
        Update: {
          couple_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_vendors_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_vendors_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          id: string
          vendor_id: string
          couple_id: string
          rating: number
          body: string | null
          is_approved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          couple_id: string
          rating: number
          body?: string | null
          is_approved?: boolean
          created_at?: string
        }
        Update: {
          rating?: number
          body?: string | null
          is_approved?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "reviews_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          id: string
          wedding_id: string
          title: string
          is_completed: boolean
          due_date: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          wedding_id: string
          title: string
          is_completed?: boolean
          due_date?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          title?: string
          is_completed?: boolean
          due_date?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "tasks_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_list: {
        Row: {
          id: string
          wedding_id: string
          name: string
          email: string | null
          phone: string | null
          party_size: number
          side: string
          rsvp_status: string
          dietary_notes: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wedding_id: string
          name: string
          email?: string | null
          phone?: string | null
          party_size?: number
          side?: string
          rsvp_status?: string
          dietary_notes?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          email?: string | null
          phone?: string | null
          party_size?: number
          side?: string
          rsvp_status?: string
          dietary_notes?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_list_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      wedding_type: WeddingType
      event_type: EventType
      user_role: UserRole
      inquiry_status: InquiryStatus
      vendor_priority: VendorPriority
      wedding_status: WeddingStatus
    }
    CompositeTypes: Record<string, never>
  }
}
