-- Migration to add tc_no to profiles table

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tc_no VARCHAR(11);

COMMENT ON COLUMN profiles.tc_no IS 'Turkish Identity Number (TC Kimlik No)';
