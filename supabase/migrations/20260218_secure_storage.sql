-- NOSONAR
-- nosonar: plsql:S1192 - repeated literals are unavoidable in SQL migration files
-- Secure 'exam-files' bucket and add strict RLS policies

-- 1. Make the bucket PRIVATE
UPDATE storage.buckets
SET public = false -- NOSONAR
WHERE id = 'exam-files';

-- 2. Enable RLS on objects table (if not already enabled, usually is)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Authenticated users can upload if folder structure matches their organization_id
-- We expect path to be: "organization_id/filename"
DROP POLICY IF EXISTS "Org-scoped upload for exam-files" ON storage.objects;
CREATE POLICY "Org-scoped upload for exam-files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exam-files' AND
  (storage.foldername(name))[1]::uuid IN (
      SELECT organization_id 
      FROM public.profiles 
      WHERE id = auth.uid()
  )
);

-- 4. Policy: Authenticated users can view/download if folder structure matches their organization_id
DROP POLICY IF EXISTS "Org-scoped view for exam-files" ON storage.objects;
CREATE POLICY "Org-scoped view for exam-files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'exam-files' AND
  (storage.foldername(name))[1]::uuid IN (
      SELECT organization_id 
      FROM public.profiles 
      WHERE id = auth.uid()
  )
);

-- 5. Policy: Admins can delete
DROP POLICY IF EXISTS "Org-scoped delete for exam-files" ON storage.objects;
CREATE POLICY "Org-scoped delete for exam-files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'exam-files' AND
  (storage.foldername(name))[1]::uuid IN (
      SELECT organization_id 
      FROM public.profiles 
      WHERE id = auth.uid() AND role_id IN (SELECT id FROM public.roles WHERE name IN ('admin', 'super_admin'))
  )
);
