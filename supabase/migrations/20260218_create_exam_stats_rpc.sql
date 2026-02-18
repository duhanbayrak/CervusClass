-- Create a function to calculate exam statistics efficiently in the database
-- This avoids fetching all exam results to the application server

CREATE OR REPLACE FUNCTION public.get_exam_stats(
    p_organization_id uuid,
    p_student_id uuid,
    p_class_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_student_exams json;
    v_class_averages json;
    v_school_averages json;
    v_class_subject_overview json;
    v_school_subject_overview json;
BEGIN
    -- 1. Get Student's Exams
    SELECT json_agg(t) INTO v_student_exams
    FROM (
        SELECT *
        FROM exam_results
        WHERE student_id = p_student_id
        ORDER BY exam_date DESC, created_at DESC
    ) t;

    -- 2. Class Averages (if class_id provided)
    IF p_class_id IS NOT NULL THEN
        -- Overall Class Average per Exam
        SELECT json_agg(t) INTO v_class_averages
        FROM (
            SELECT 
                exam_name,
                exam_date,
                ROUND(AVG(total_net)::numeric, 2) as avg_net
            FROM exam_results
            WHERE organization_id = p_organization_id
              AND student_id IN (
                  SELECT id FROM profiles WHERE class_id = p_class_id
              )
            GROUP BY exam_name, exam_date
            ORDER BY exam_date ASC
        ) t;

        -- Subject-based Class Average per Exam
        -- This logic mimics the detailed JS logic but simplified for SQL aggregation
        -- It assumes 'scores' is a JSONB column where keys are subjects and values have 'net' or are numbers
        -- Note: Complete subject extraction in complex JSON structures might be tricky in pure SQL without knowing exact schema
        -- For robust implementation matching JS exactly, we might need to rely on the application to parse detailed breakdown
        -- OR use advanced JSONB queries. 
        
        -- Simplified Approach: We return the aggregated scores JSON if possible, or leave detailed subject breakdown 
        -- to a separate specific query if needed. 
        -- However, user wants to replace the WHOLE logic.
        -- Let's try to aggregate subject scores using jsonb_each.
        
        SELECT json_agg(t) INTO v_class_subject_overview
        FROM (
            SELECT 
                exam_name,
                exam_date,
                jsonb_object_agg(
                    subject,
                    ROUND(avg_score::numeric, 2)
                ) as subjects
            FROM (
                SELECT 
                    er.exam_name,
                    er.exam_date,
                    key as subject,
                    AVG(
                        CASE 
                            WHEN jsonb_typeof(value) = 'number' THEN value::numeric
                            WHEN jsonb_typeof(value) = 'object' THEN (value->>'net')::numeric
                            ELSE 0 
                        END
                    ) as avg_score
                FROM exam_results er
                CROSS JOIN LATERAL jsonb_each(er.scores)
                WHERE er.organization_id = p_organization_id
                  AND er.student_id IN (SELECT id FROM profiles WHERE class_id = p_class_id)
                GROUP BY er.exam_name, er.exam_date, key
            ) sub
            GROUP BY exam_name, exam_date
            ORDER BY exam_date ASC
        ) t;
        
    ELSE
        v_class_averages := '[]'::json;
        v_class_subject_overview := '[]'::json;
    END IF;

    -- 3. School Averages
    -- Overall School Average per Exam
    SELECT json_agg(t) INTO v_school_averages
    FROM (
        SELECT 
            exam_name,
            exam_date,
            ROUND(AVG(total_net)::numeric, 2) as avg_net
        FROM exam_results
        WHERE organization_id = p_organization_id
        GROUP BY exam_name, exam_date
        ORDER BY exam_date ASC
    ) t;

    -- Subject-based School Average per Exam
    SELECT json_agg(t) INTO v_school_subject_overview
    FROM (
        SELECT 
            exam_name,
            exam_date,
            jsonb_object_agg(
                subject,
                ROUND(avg_score::numeric, 2)
            ) as subjects
        FROM (
            SELECT 
                er.exam_name,
                er.exam_date,
                key as subject,
                AVG(
                    CASE 
                        WHEN jsonb_typeof(value) = 'number' THEN value::numeric
                        WHEN jsonb_typeof(value) = 'object' THEN (value->>'net')::numeric
                        ELSE 0 
                    END
                ) as avg_score
            FROM exam_results er
            CROSS JOIN LATERAL jsonb_each(er.scores)
            WHERE er.organization_id = p_organization_id
            GROUP BY er.exam_name, er.exam_date, key
        ) sub
        GROUP BY exam_name, exam_date
        ORDER BY exam_date ASC
    ) t;

    RETURN json_build_object(
        'studentExams', COALESCE(v_student_exams, '[]'::json),
        'classAverages', COALESCE(v_class_averages, '[]'::json),
        'schoolAverages', COALESCE(v_school_averages, '[]'::json),
        'classSubjectOverview', COALESCE(v_class_subject_overview, '[]'::json),
        'schoolSubjectOverview', COALESCE(v_school_subject_overview, '[]'::json)
    );
END;
$$;
