-- Add unique constraint on user_id in subscribers table
ALTER TABLE subscribers ADD CONSTRAINT subscribers_user_id_key UNIQUE (user_id);