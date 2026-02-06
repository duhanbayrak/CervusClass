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
                    grade_level: number
                    id: string
                    name: string
                    organization_id: string
                }
                Insert: {
                    created_at?: string
                    grade_level: number
                    id?: string
                    name: string
                    organization_id: string
                }
                Update: {
                    created_at?: string
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
                    exam_date: string | null
                    exam_name: string
                    id: string
                    organization_id: string
                    scores: Json | null
                    student_id: string
                    total_net: number | null
                }
                Insert: {
                    created_at?: string
                    exam_date?: string | null
                    exam_name: string
                    id?: string
                    organization_id: string
                    scores?: Json | null
                    student_id: string
                    total_net?: number | null
                }
                Update: {
                    created_at?: string
                    exam_date?: string | null
                    exam_name?: string
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
            homework: {
                Row: {
                    assigned_student_ids: Json | null
                    class_id: string
                    completion_status: Json | null
                    created_at: string
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
                    email: string | null
                    full_name: string | null
                    id: string
                    organization_id: string
                    parent_name: string | null
                    parent_phone: string | null
                    phone: string | null
                    role_id: string
                    start_date: string | null
                    student_number: string | null
                    title: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    bio?: string | null
                    birth_date?: string | null
                    branch_id?: string | null
                    class_id?: string | null
                    created_at?: string
                    email?: string | null
                    full_name?: string | null
                    id: string
                    organization_id: string
                    parent_name?: string | null
                    parent_phone?: string | null
                    phone?: string | null
                    role_id: string
                    start_date?: string | null
                    student_number?: string | null
                    title?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    bio?: string | null
                    birth_date?: string | null
                    branch_id?: string | null
                    class_id?: string | null
                    created_at?: string
                    email?: string | null
                    full_name?: string | null
                    id?: string
                    organization_id?: string
                    parent_name?: string | null
                    parent_phone?: string | null
                    phone?: string | null
                    role_id: string
                    start_date?: string | null
                    student_number?: string | null
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
            study_sessions: {
                Row: {
                    created_at: string
                    id: string
                    organization_id: string
                    scheduled_at: string
                    status: string | null
                    student_id: string | null
                    teacher_id: string
                    topic: string | null
                }
                Insert: {
                    created_at?: string
                    id?: string
                    organization_id: string
                    scheduled_at: string
                    status?: string | null
                    student_id?: string | null
                    teacher_id: string
                    topic?: string | null
                }
                Update: {
                    created_at?: string
                    id?: string
                    organization_id?: string
                    scheduled_at?: string
                    status?: string | null
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
            get_auth_org_id: { Args: never; Returns: string }
            get_my_role_name: { Args: never; Returns: string }
            get_org_id: { Args: never; Returns: string }
        }
        Enums: {
            [_ in never]: never
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
    | keyof DefaultSchema["CompositeTypes"]
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
        Enums: {},
    },
} as const
