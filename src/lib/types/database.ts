import type { WeddingExperience } from '@/lib/vendors/wedding-experience'

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
      wedding_members: {
        Row: { wedding_id: string; user_id: string; role: string; joined_at: string }
        Insert: { wedding_id: string; user_id: string; role?: string; joined_at?: string }
        Update: { wedding_id?: string; user_id?: string; role?: string; joined_at?: string }
        Relationships: []
      }
      wedding_invitations: {
        Row: { id: string; wedding_id: string; email: string; token: string; expires_at: string; accepted_at: string | null; created_at: string }
        Insert: { id?: string; wedding_id: string; email: string; token?: string; expires_at?: string; accepted_at?: string | null; created_at?: string }
        Update: { email?: string; expires_at?: string; accepted_at?: string | null }
        Relationships: []
      }
      vendor_wedding_experience: {
        Row: WeddingExperience & { vendor_id: string }
        Insert: Partial<WeddingExperience> & { vendor_id: string }
        Update: Partial<WeddingExperience>
        Relationships: []
      }
      vendor_category_memberships: {
        Row: { vendor_id: string; category_id: string }
        Insert: { vendor_id: string; category_id: string }
        Update: { vendor_id?: string; category_id?: string }
        Relationships: []
      }
      vendor_services: {
        Row: { id: string; category_id: string; name: string; slug: string; display_order: number }
        Insert: { id?: string; category_id: string; name: string; slug: string; display_order?: number }
        Update: { id?: string; category_id?: string; name?: string; slug?: string; display_order?: number }
        Relationships: []
      }
      vendor_service_memberships: {
        Row: { vendor_id: string; service_id: string }
        Insert: { vendor_id: string; service_id: string }
        Update: { vendor_id?: string; service_id?: string }
        Relationships: []
      }
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
      budget_commitments: {
        Row: {
          id: string
          wedding_id: string
          category_id: string
          event_id: string | null
          vendor_id: string | null
          description: string
          total_amount: number
          paid_amount: number
          due_date: string | null
          notes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wedding_id: string
          category_id: string
          event_id?: string | null
          vendor_id?: string | null
          description: string
          total_amount: number
          paid_amount?: number
          due_date?: string | null
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          event_id?: string | null
          vendor_id?: string | null
          description?: string
          total_amount?: number
          paid_amount?: number
          due_date?: string | null
          notes?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_commitments_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_commitments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "budget_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_commitments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "wedding_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_commitments_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
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
          service_areas: string[]
          street_address: string | null
          latitude: number | null
          longitude: number | null
          coordinates_expires_at: string | null
          pricing_range: string | null
          website_url: string | null
          phone: string | null
          email: string | null
          instagram_url: string | null
          tiktok_url: string | null
          facebook_url: string | null
          youtube_url: string | null
          pinterest_url: string | null
          snapchat_url: string | null
          linkedin_url: string | null
          whatsapp_url: string | null
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
          service_areas?: string[]
          street_address?: string | null
          latitude?: number | null
          longitude?: number | null
          coordinates_expires_at?: string | null
          pricing_range?: string | null
          website_url?: string | null
          phone?: string | null
          email?: string | null
          instagram_url?: string | null
          tiktok_url?: string | null
          facebook_url?: string | null
          youtube_url?: string | null
          pinterest_url?: string | null
          snapchat_url?: string | null
          linkedin_url?: string | null
          whatsapp_url?: string | null
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
          service_areas?: string[]
          street_address?: string | null
          latitude?: number | null
          longitude?: number | null
          coordinates_expires_at?: string | null
          pricing_range?: string | null
          website_url?: string | null
          phone?: string | null
          email?: string | null
          instagram_url?: string | null
          tiktok_url?: string | null
          facebook_url?: string | null
          youtube_url?: string | null
          pinterest_url?: string | null
          snapchat_url?: string | null
          linkedin_url?: string | null
          whatsapp_url?: string | null
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
      vendor_listing_requests: {
        Row: {
          id: string
          requester_id: string
          category_id: string
          name: string
          city: string
          area: string | null
          description: string | null
          business_email: string
          phone: string | null
          website_url: string | null
          instagram_url: string | null
          tiktok_url: string | null
          facebook_url: string | null
          youtube_url: string | null
          pinterest_url: string | null
          snapchat_url: string | null
          linkedin_url: string | null
          whatsapp_url: string | null
          pricing_range: string | null
          status: 'pending' | 'approved' | 'rejected'
          review_note: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          resulting_vendor_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          category_id: string
          name: string
          city: string
          area?: string | null
          description?: string | null
          business_email: string
          phone?: string | null
          website_url?: string | null
          instagram_url?: string | null
          tiktok_url?: string | null
          facebook_url?: string | null
          youtube_url?: string | null
          pinterest_url?: string | null
          snapchat_url?: string | null
          linkedin_url?: string | null
          whatsapp_url?: string | null
          pricing_range?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          review_note?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          resulting_vendor_id?: string | null
          created_at?: string
        }
        Update: {
          status?: 'pending' | 'approved' | 'rejected'
          review_note?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          resulting_vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'vendor_listing_requests_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'vendor_categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'vendor_listing_requests_resulting_vendor_id_fkey'
            columns: ['resulting_vendor_id']
            isOneToOne: false
            referencedRelation: 'vendors'
            referencedColumns: ['id']
          },
        ]
      }
      vendor_claims: {
        Row: {
          id: string
          vendor_id: string
          requester_id: string
          business_email: string
          evidence_url: string | null
          explanation: string
          status: 'pending' | 'approved' | 'rejected' | 'more_info'
          review_note: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          requester_id: string
          business_email: string
          evidence_url?: string | null
          explanation: string
          status?: 'pending' | 'approved' | 'rejected' | 'more_info'
          review_note?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          business_email?: string
          evidence_url?: string | null
          explanation?: string
          status?: 'pending' | 'approved' | 'rejected' | 'more_info'
          review_note?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_claims_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_photos: {
        Row: {
          id: string
          vendor_id: string
          storage_path: string
          storage_bucket: string
          alt_text: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          storage_path: string
          storage_bucket?: string
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
          event_location: string | null
          guest_count: number | null
          budget_cad: number | null
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
          event_location?: string | null
          guest_count?: number | null
          budget_cad?: number | null
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
      wedding_vendor_shortlist: {
        Row: {
          wedding_id: string
          vendor_id: string
          stage: 'saved' | 'contacted' | 'quoted' | 'booked' | 'declined'
          quote_amount: number | null
          notes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          wedding_id: string
          vendor_id: string
          stage?: 'saved' | 'contacted' | 'quoted' | 'booked' | 'declined'
          quote_amount?: number | null
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          stage?: 'saved' | 'contacted' | 'quoted' | 'booked' | 'declined'
          quote_amount?: number | null
          notes?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wedding_vendor_shortlist_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wedding_vendor_shortlist_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
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
          priority: 'high' | 'normal' | 'low'
          event_id: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          wedding_id: string
          title: string
          is_completed?: boolean
          due_date?: string | null
          priority?: 'high' | 'normal' | 'low'
          event_id?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          title?: string
          is_completed?: boolean
          due_date?: string | null
          priority?: 'high' | 'normal' | 'low'
          event_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "wedding_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_event_invitations: {
        Row: {
          guest_id: string
          event_id: string
          wedding_id: string
          rsvp_status: string
          created_at: string
        }
        Insert: {
          guest_id: string
          event_id: string
          wedding_id: string
          rsvp_status?: string
          created_at?: string
        }
        Update: { rsvp_status?: string }
        Relationships: [
          {
            foreignKeyName: "guest_event_invitations_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guest_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_event_invitations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "wedding_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_event_invitations_wedding_id_fkey"
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
          household_name: string | null
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
          household_name?: string | null
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
          household_name?: string | null
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
    Functions: {
      attach_vendor_photo: { Args: { p_vendor_id: string; p_owner_id: string; p_slot: number; p_path: string }; Returns: string | null }
      reorder_vendor_portfolio: { Args: { p_vendor_id: string; p_owner_id: string; p_current: string[]; p_order: string[] }; Returns: string }
      create_guest_rsvp_link: { Args: { p_guest:string }; Returns:string }
      revoke_guest_rsvp_link: { Args: { p_guest:string }; Returns:undefined }
      get_guest_rsvp: { Args: { p_token:string }; Returns:Json }
      submit_guest_rsvp: { Args: { p_token:string; p_event:string; p_response:string }; Returns:boolean }
      get_wedding_plan_template: { Args: { p_slug?:string|null; p_token?:string|null }; Returns:Json }
      create_wedding_plan_share: { Args: { p_wedding:string }; Returns:string }
      apply_wedding_plan_template: { Args: { p_wedding:string; p_slug?:string|null; p_token?:string|null }; Returns:Json }
      create_partner_invitation: { Args: { p_wedding: string; p_email: string }; Returns: string }
      accept_partner_invitation: { Args: { p_token: string }; Returns: string }
      is_admin: { Args: Record<string, never>; Returns: boolean }
      review_vendor_claim: {
        Args: { p_claim_id: string; p_decision: string; p_note?: string | null }
        Returns: undefined
      }
      register_vendor_account: { Args: Record<string, never>; Returns: boolean }
      review_vendor_listing_request: { Args: { p_request_id: string; p_decision: string; p_note?: string | null }; Returns: undefined }
    }
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
