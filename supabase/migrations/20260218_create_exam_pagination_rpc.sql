-- Create RPC functions for efficient exam pagination
-- Needed because there is no separate 'exams' table and we need to paginate over DISTINCT(exam_name, exam_date)

-- 1. Get unique exams with pagination
CREATE OR REPLACE FUNCTION get_unique_exams(
  page_offset integer,
  page_limit integer
)
RETURNS TABLE (
  exam_name text,
  exam_date date
)
LANGUAGE sql
STABLE
AS $$
  SELECT DISTINCT exam_name, exam_date
  FROM exam_results
  ORDER BY exam_date DESC
  LIMIT page_limit OFFSET page_offset;
$$;

-- 2. Get total count of unique exams
CREATE OR REPLACE FUNCTION get_unique_exams_count()
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(DISTINCT (exam_name, exam_date))::integer
  FROM exam_results;
$$;
