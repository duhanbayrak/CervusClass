-- Add search_vector column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('turkish', coalesce(full_name, '')), 'A') ||
  setweight(to_tsvector('turkish', coalesce(email, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(student_number, '')), 'A')
) STORED;

-- Create GIN index for search_vector
CREATE INDEX IF NOT EXISTS profiles_search_vector_idx ON profiles USING GIN (search_vector);

-- Create index for class_id if not exists (mentioned in report)
CREATE INDEX IF NOT EXISTS idx_profiles_class_id ON profiles(class_id);
