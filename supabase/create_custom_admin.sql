-- ============================================================
-- SCRIPT TO CREATE A CUSTOM ADMIN USER VIA SQL
-- ============================================================
-- Use this script if you want to create an admin user directly
-- in the Supabase SQL Editor without using the Signup page.
-- ============================================================

-- 1. Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. INSERT INTO auth.users
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'myadmin@gmail.com',               -- 🔴 REPLACE WITH YOUR EMAIL
    crypt('mypassword123', gen_salt('bf')), -- 🔴 REPLACE WITH YOUR PASSWORD
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"My Admin Name"}',   -- 🔴 REPLACE WITH YOUR NAME
    now(),
    now(),
    '',
    '',
    '',
    ''
);

-- 3. INSERT INTO public.users (Linked to auth.users)
INSERT INTO public.users (
    id,
    email,
    username,
    role,
    full_name,
    created_at,
    updated_at
)
SELECT
    id,
    email,
    'myadmin_username',                -- 🔴 REPLACE WITH YOUR USERNAME
    'admin',                           -- Role is set to admin
    raw_user_meta_data->>'full_name',
    created_at,
    updated_at
FROM auth.users
WHERE email = 'myadmin@gmail.com';     -- 🔴 MUST MATCH EMAIL ABOVE

-- 4. INSERT INTO auth.identities (Required for login)
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,           -- <--- Added this to fix error
    last_sign_in_at,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    id,
    format('{"sub":"%s","email":"%s"}', id, email)::jsonb,
    'email',
    id::text,              -- <--- Added this (provider_id = user_id)
    now(),
    now(),
    now()
FROM auth.users
WHERE email = 'myadmin@gmail.com';     -- 🔴 MUST MATCH EMAIL ABOVE
