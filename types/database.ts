export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          created_at: string
          date: string
          id: string
          late_minutes: number | null
          organization_id: string
          schedule_id: string | null
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          late_minutes?: number | null
          organization_id: string
          schedule_id?: string | null
          status: string
          student_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          late_minutes?: number | null
          organization_id?: string
          schedule_id?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          created_at: string | null
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          deleted_at: string | null
          grade_level: number
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          grade_level: number
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          grade_level?: number
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          branch_id: string | null
          code: string | null
          created_at: string | null
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          branch_id?: string | null
          code?: string | null
          created_at?: string | null
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          branch_id?: string | null
          code?: string | null
          created_at?: string | null
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_results: {
        Row: {
          created_at: string
          deleted_at: string | null
          details: Json | null
          exam_date: string | null
          exam_name: string
          exam_type: Database["public"]["Enums"]["exam_type_enum"]
          id: string
          organization_id: string
          scores: Json | null
          student_id: string
          total_net: number | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          details?: Json | null
          exam_date?: string | null
          exam_name: string
          exam_type?: Database["public"]["Enums"]["exam_type_enum"]
          id?: string
          organization_id: string
          scores?: Json | null
          student_id: string
          total_net?: number | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          details?: Json | null
          exam_date?: string | null
          exam_name?: string
          exam_type?: Database["public"]["Enums"]["exam_type_enum"]
          id?: string
          organization_id?: string
          scores?: Json | null
          student_id?: string
          total_net?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_installments: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          fee_id: string
          id: string
          installment_number: number
          organization_id: string
          paid_amount: number
          paid_at: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          fee_id: string
          id?: string
          installment_number: number
          organization_id: string
          paid_amount?: number
          paid_at?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          fee_id?: string
          id?: string
          installment_number?: number
          organization_id?: string
          paid_amount?: number
          paid_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_installments_fee_id_fkey"
            columns: ["fee_id"]
            isOneToOne: false
            referencedRelation: "student_fees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_installments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_payments: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          created_by: string
          id: string
          installment_id: string | null
          notes: string | null
          organization_id: string
          payment_date: string
          payment_method: string
          reference_no: string | null
          student_id: string
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          created_by: string
          id?: string
          installment_id?: string | null
          notes?: string | null
          organization_id: string
          payment_date?: string
          payment_method?: string
          reference_no?: string | null
          student_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          created_by?: string
          id?: string
          installment_id?: string | null
          notes?: string | null
          organization_id?: string
          payment_date?: string
          payment_method?: string
          reference_no?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_installment_id_fkey"
            columns: ["installment_id"]
            isOneToOne: false
            referencedRelation: "fee_installments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_accounts: {
        Row: {
          account_type: string
          balance: number
          initial_balance: number
          created_at: string
          currency: string
          id: string
          is_active: boolean
          name: string
          organization_id: string
        }
        Insert: {
          account_type?: string
          balance?: number
          initial_balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
        }
        Update: {
          account_type?: string
          balance?: number
          initial_balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_system: boolean
          name: string
          organization_id: string
          parent_id: string | null
          sort_order: number
          type: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_system?: boolean
          name: string
          organization_id: string
          parent_id?: string | null
          sort_order?: number
          type: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_system?: boolean
          name?: string
          organization_id?: string
          parent_id?: string | null
          sort_order?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_services: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          type: string
          unit_price: number
          updated_at: string
          vat_rate: number
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          type: string
          unit_price?: number
          updated_at?: string
          vat_rate?: number
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          type?: string
          unit_price?: number
          updated_at?: string
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "finance_services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_settings: {
        Row: {
          academic_periods: Json
          created_at: string
          currency: string
          default_installments: number
          id: string
          organization_id: string
          payment_due_day: number
          updated_at: string
        }
        Insert: {
          academic_periods?: Json
          created_at?: string
          currency?: string
          default_installments?: number
          id?: string
          organization_id: string
          payment_due_day?: number
          updated_at?: string
        }
        Update: {
          academic_periods?: Json
          created_at?: string
          currency?: string
          default_installments?: number
          id?: string
          organization_id?: string
          payment_due_day?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_transactions: {
        Row: {
          account_id: string
          amount: number
          category_id: string
          created_at: string
          created_by: string
          deleted_at: string | null
          description: string
          id: string
          is_recurring: boolean
          organization_id: string
          receipt_url: string | null
          recurring_period: string | null
          reference_no: string | null
          related_payment_id: string | null
          service_id: string | null
          subtotal: number | null
          transaction_date: string
          transfer_to_account_id: string | null
          type: string
          vat_amount: number | null
          vat_rate: number | null
        }
        Insert: {
          account_id: string
          amount: number
          category_id: string
          created_at?: string
          created_by: string
          deleted_at?: string | null
          description: string
          id?: string
          is_recurring?: boolean
          organization_id: string
          receipt_url?: string | null
          recurring_period?: string | null
          reference_no?: string | null
          related_payment_id?: string | null
          service_id?: string | null
          subtotal?: number | null
          transaction_date?: string
          transfer_to_account_id?: string | null
          type: string
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Update: {
          account_id?: string
          amount?: number
          category_id?: string
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          description?: string
          id?: string
          is_recurring?: boolean
          organization_id?: string
          receipt_url?: string | null
          recurring_period?: string | null
          reference_no?: string | null
          related_payment_id?: string | null
          service_id?: string | null
          subtotal?: number | null
          transaction_date?: string
          transfer_to_account_id?: string | null
          type?: string
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_related_payment_id_fkey"
            columns: ["related_payment_id"]
            isOneToOne: false
            referencedRelation: "fee_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "finance_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_transfer_to_account_id_fkey"
            columns: ["transfer_to_account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      homework: {
        Row: {
          assigned_student_ids: Json | null
          class_id: string
          completion_status: Json | null
          created_at: string
          deleted_at: string | null
          description: string
          due_date: string | null
          id: string
          organization_id: string
          target_students: Json | null
          teacher_id: string
        }
        Insert: {
          assigned_student_ids?: Json | null
          class_id: string
          completion_status?: Json | null
          created_at?: string
          deleted_at?: string | null
          description: string
          due_date?: string | null
          id?: string
          organization_id: string
          target_students?: Json | null
          teacher_id: string
        }
        Update: {
          assigned_student_ids?: Json | null
          class_id?: string
          completion_status?: Json | null
          created_at?: string
          deleted_at?: string | null
          description?: string
          due_date?: string | null
          id?: string
          organization_id?: string
          target_students?: Json | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_submissions: {
        Row: {
          created_at: string | null
          homework_id: string
          id: string
          organization_id: string
          status: Database["public"]["Enums"]["submission_status"] | null
          student_id: string
          submitted_at: string | null
          teacher_feedback: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          homework_id: string
          id?: string
          organization_id: string
          status?: Database["public"]["Enums"]["submission_status"] | null
          student_id: string
          submitted_at?: string | null
          teacher_feedback?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          homework_id?: string
          id?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["submission_status"] | null
          student_id?: string
          submitted_at?: string | null
          teacher_feedback?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homework_submissions_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "homework"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string
          subscription_status: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          subscription_status?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          subscription_status?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          branch_id: string | null
          class_id: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          full_name: string | null
          id: string
          organization_id: string
          parent_name: string | null
          parent_phone: string | null
          phone: string | null
          role_id: string
          search_vector: unknown
          start_date: string | null
          student_number: string | null
          tc_no: string | null
          title: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          branch_id?: string | null
          class_id?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          organization_id: string
          parent_name?: string | null
          parent_phone?: string | null
          phone?: string | null
          role_id: string
          search_vector?: unknown
          start_date?: string | null
          student_number?: string | null
          tc_no?: string | null
          title?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          branch_id?: string | null
          class_id?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          organization_id?: string
          parent_name?: string | null
          parent_phone?: string | null
          phone?: string | null
          role_id?: string
          search_vector?: unknown
          start_date?: string | null
          student_number?: string | null
          tc_no?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      schedule: {
        Row: {
          class_id: string
          course_id: string
          created_at: string | null
          day_of_week: number
          deleted_at: string | null
          end_time: string
          id: string
          organization_id: string
          room_name: string | null
          start_time: string
          teacher_id: string
        }
        Insert: {
          class_id: string
          course_id: string
          created_at?: string | null
          day_of_week: number
          deleted_at?: string | null
          end_time: string
          id?: string
          organization_id: string
          room_name?: string | null
          start_time: string
          teacher_id: string
        }
        Update: {
          class_id?: string
          course_id?: string
          created_at?: string | null
          day_of_week?: number
          deleted_at?: string | null
          end_time?: string
          id?: string
          organization_id?: string
          room_name?: string | null
          start_time?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_fees: {
        Row: {
          academic_period: string
          class_id: string | null
          created_at: string
          discount_amount: number
          discount_reason: string | null
          discount_type: string | null
          id: string
          installment_count: number
          net_amount: number
          notes: string | null
          organization_id: string
          service_id: string | null
          status: string
          student_id: string
          total_amount: number
          updated_at: string
          vat_amount: number | null
          vat_rate: number | null
        }
        Insert: {
          academic_period: string
          class_id?: string | null
          created_at?: string
          discount_amount?: number
          discount_reason?: string | null
          discount_type?: string | null
          id?: string
          installment_count?: number
          net_amount: number
          notes?: string | null
          organization_id: string
          service_id?: string | null
          status?: string
          student_id: string
          total_amount: number
          updated_at?: string
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Update: {
          academic_period?: string
          class_id?: string | null
          created_at?: string
          discount_amount?: number
          discount_reason?: string | null
          discount_type?: string | null
          id?: string
          installment_count?: number
          net_amount?: number
          notes?: string | null
          organization_id?: string
          service_id?: string | null
          status?: string
          student_id?: string
          total_amount?: number
          updated_at?: string
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_fees_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fees_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "finance_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_notes: {
        Row: {
          id: string
          organization_id: string
          student_id: string
          teacher_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          student_id: string
          teacher_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          student_id?: string
          teacher_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_notes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      study_session_statuses: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          rejection_reason: string | null
          scheduled_at: string
          status_id: string
          status_legacy: string | null
          student_id: string | null
          teacher_id: string
          topic: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          rejection_reason?: string | null
          scheduled_at: string
          status_id: string
          status_legacy?: string | null
          student_id?: string | null
          teacher_id: string
          topic?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          rejection_reason?: string | null
          scheduled_at?: string
          status_id?: string
          status_legacy?: string | null
          student_id?: string | null
          teacher_id?: string
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_sessions_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "study_session_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_sessions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      debug_check_teacher_visibility: {
        Args: { target_email: string }
        Returns: {
          org_id_sample: string
          row_count: number
          table_name: string
        }[]
      }
      get_auth_org_id: { Args: never; Returns: string }
      get_auth_org_id_safe: { Args: never; Returns: string }
      get_auth_role: { Args: never; Returns: string }
      get_exam_stats: {
        Args: {
          p_class_id?: string
          p_organization_id: string
          p_student_id: string
        }
        Returns: Json
      }
      get_exam_subject_stats: {
        Args: {
          p_class_id: string
          p_exam_date: string
          p_exam_name: string
          p_org_id: string
        }
        Returns: {
          class_avg: number
          school_avg: number
          subject: string
        }[]
      }
      get_my_role_name: { Args: never; Returns: string }
      get_org_id: { Args: never; Returns: string }
      get_org_id_simple: { Args: never; Returns: string }
      get_student_exam_comparisons: {
        Args: { p_student_id: string }
        Returns: {
          class_avg_net: number
          exam_date: string
          exam_name: string
          school_avg_net: number
          student_net: number
        }[]
      }
      get_unique_exams: {
        Args: { page_limit: number; page_offset: number }
        Returns: {
          exam_date: string
          exam_name: string
        }[]
      }
      get_unique_exams_count: { Args: never; Returns: number }
      mark_overdue_homeworks: { Args: never; Returns: undefined }
      soft_delete_record: {
        Args: { _id: string; _table_name: string }
        Returns: undefined
      }
      sync_all_users_claims: { Args: never; Returns: undefined }
    }
    Enums: {
      exam_type_enum: "TYT" | "AYT"
      submission_status: "pending" | "submitted" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"] // NOSONAR
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      exam_type_enum: ["TYT", "AYT"],
      submission_status: ["pending", "submitted", "approved", "rejected"],
    },
  },
} as const

// --- Custom helper type aliases ---
export type Profile = Tables<'profiles'>;
export type ProfileRole = 'student' | 'teacher' | 'admin' | 'superadmin' | 'super_admin';
export type Schedule = Tables<'schedule'>;
export type Homework = Tables<'homework'>;
export type HomeworkSubmission = Tables<'homework_submissions'>;
export type ExamResult = Tables<'exam_results'>;
export type StudySession = Tables<'study_sessions'>;
export type Class = Tables<'classes'>;
export interface ClassWithCount extends Class {
  student_count?: number;
  profiles?: { count: number }[];
}
/** Öğrenci notu satır tipi */
export type StudentNote = Tables<'student_notes'>;
