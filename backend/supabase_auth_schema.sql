-- Run this script in Supabase SQL Editor.

-- table for users
CREATE TABLE IF NOT EXISTS public.users (
    id BIGSERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    major TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    role TEXT NOT NULL DEFAULT 'student',
    -- A user is a "club moderator" when club_id is set. UNIQUE enforces at most
    -- one moderator per club. NULL = normal user (no club to manage).
    club_id TEXT UNIQUE REFERENCES public.clubs (id) ON DELETE SET NULL
);

-- Migration for existing databases (safe to re-run):
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS club_id TEXT UNIQUE REFERENCES public.clubs (id) ON DELETE SET NULL;

-- To make a student the moderator of a club, set their club_id, e.g.:
--   UPDATE public.users SET club_id = 'acm' WHERE username = 'roua';
-- To remove a moderator:
--   UPDATE public.users SET club_id = NULL WHERE username = 'roua';

-- these indexes are automatically generated since 'username' and 'email' are UNIQUE
-- there's an automatic index on 'id' too since it's PRIMARY KEY
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users (username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);

