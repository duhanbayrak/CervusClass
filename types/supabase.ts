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
                    created_at: string
                    id: string
                    name: string
                    organization_id: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    name: string
                    organization_id: string
                }
                Update: {
                    created_at?: string
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
                    code: string | null
                    created_at: string
                    id: string
                    name: string
                    organization_id: string
                    branch_id: string | null
                }
                Insert: {
                    code?: string | null
                    created_at?: string
                    id?: string
                    name: string
                    organization_id: string
                    branch_id?: string | null
                }
                Update: {
                    code?: string | null
                    created_at?: string
                    id?: string
                    name?: string
                    organization_id?: string
                    branch_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "courses_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "courses_branch_id_fkey"
                        columns: ["branch_id"]
                        isOneToOne: false
                        referencedRelation: "branches"
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
                    assigned_student_ids: string[] | null
                    class_id: string
                    completion_status: Json | null
                    created_at: string
                    description: string
                    due_date: string | null
                    id: string
                    organization_id: string
                    teacher_id: string
                }
                Insert: {
                    assigned_student_ids?: string[] | null
                    class_id: string
                    completion_status?: Json | null
                    created_at?: string
                    description: string
                    due_date?: string | null
                    id?: string
                    organization_id: string
                    teacher_id: string
                }
                Update: {
                    assigned_student_ids?: string[] | null
                    class_id?: string
                    completion_status?: Json | null
                    created_at?: string
                    description?: string
                    due_date?: string | null
                    id?: string
                    organization_id?: string
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
                    branch: string | null
                    branch_id: string | null
                    class_id: string | null
                    created_at: string
                    email: string | null
                    full_name: string | null
                    id: string
                    organization_id: string
                    role_id: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    branch?: string | null
                    branch_id?: string | null
                    class_id?: string | null
                    created_at?: string
                    email?: string | null
                    full_name?: string | null
                    id: string
                    organization_id: string
                    role_id?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    branch?: string | null
                    branch_id?: string | null
                    class_id?: string | null
                    created_at?: string
                    email?: string | null
                    full_name?: string | null
                    id?: string
                    organization_id?: string
                    role_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_branch_id_fkey"
                        columns: ["branch_id"]
                        isOneToOne: false
                        referencedRelation: "branches"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "fk_profiles_class"
                        columns: ["class_id"]
                        isOneToOne: false
                        referencedRelation: "classes"
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
                    student_id: string
                    teacher_id: string
                    topic: string | null
                }
                Insert: {
                    created_at?: string
                    id?: string
                    organization_id: string
                    scheduled_at: string
                    status?: string | null
                    student_id: string
                    teacher_id: string
                    topic?: string | null
                }
                Update: {
                    created_at?: string
                    id?: string
                    organization_id?: string
                    scheduled_at?: string
                    status?: string | null
                    student_id?: string
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
            get_org_id: {
                Args: Record<PropertyKey, never>
                Returns: string
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: Exclude<keyof Database, "__InternalSupabase"> },
    TableName extends PublicTableNameOrOptions extends { schema: Exclude<keyof Database, "__InternalSupabase"> }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: Exclude<keyof Database, "__InternalSupabase"> }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: Exclude<keyof Database, "__InternalSupabase"> },
    TableName extends PublicTableNameOrOptions extends { schema: Exclude<keyof Database, "__InternalSupabase"> }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: Exclude<keyof Database, "__InternalSupabase"> }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: Exclude<keyof Database, "__InternalSupabase"> },
    TableName extends PublicTableNameOrOptions extends { schema: Exclude<keyof Database, "__InternalSupabase"> }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: Exclude<keyof Database, "__InternalSupabase"> }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: Exclude<keyof Database, "__InternalSupabase"> },
    EnumName extends PublicEnumNameOrOptions extends { schema: Exclude<keyof Database, "__InternalSupabase"> }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: Exclude<keyof Database, "__InternalSupabase"> }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: Exclude<keyof Database, "__InternalSupabase"> },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: Exclude<keyof Database, "__InternalSupabase">
    }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: Exclude<keyof Database, "__InternalSupabase"> }
    ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
