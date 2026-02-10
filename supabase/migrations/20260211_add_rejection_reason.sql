-- 20260211_add_rejection_reason.sql

ALTER TABLE study_sessions
ADD COLUMN IF NOT EXISTS rejection_reason text;
