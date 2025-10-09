-- Path: migrations/01_user_management/01_tables_user_profiles.sql
-- Description: Defines the user_profiles table, which extends auth.users.

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  first_name TEXT NOT NULL CHECK (first_name <> ''),
  last_name TEXT NOT NULL CHECK (last_name <> ''),
  avatar_url TEXT,
  phone_number TEXT CHECK (
    phone_number IS NULL
    OR phone_number ~ '^\+?[1-9]\d{1,14}$'
  ),
  date_of_birth DATE CHECK (
    date_of_birth IS NULL
    OR (
      date_of_birth > '1900-01-01'
      AND date_of_birth < CURRENT_DATE
    )
  ),
  role TEXT DEFAULT 'viewer' CHECK (
    role IN (
      'admin',
      'viewer',
      'cpan_admin',
      'maan_admin',
      'sdh_admin',
      'asset_admin',
      'mng_admin'
    )
  ),
  designation TEXT,
  address JSONB DEFAULT '{}'::jsonb,
  preferences JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);