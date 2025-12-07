-- Test Users Setup Script
-- This script creates three test users for automated testing
-- Two users with verified email and one without verified email
-- Insert test users
INSERT INTO
  "user" (
    id,
    name,
    username,
    email,
    email_verified,
    image,
    role,
    banned,
    is_public,
    created_at,
    updated_at
  )
VALUES
  -- Test User 1: Verified email, public profile
  (
    'a0000000-0000-4000-8000-000000000001',
    'Test User One',
    'testuser1',
    'testuser1@example.com',
    true,
    NULL,
    NULL,
    false,
    true,
    NOW (),
    NOW ()
  ),
  -- Test User 2: Verified email, public profile
  (
    'a0000000-0000-4000-8000-000000000002',
    'Test User Two',
    'testuser2',
    'testuser2@example.com',
    true,
    NULL,
    NULL,
    false,
    true,
    NOW (),
    NOW ()
  ),
  -- Test User 3: Unverified email, public profile
  (
    'a0000000-0000-4000-8000-000000000003',
    'Test User Three',
    'testuser3',
    'testuser3@example.com',
    false,
    NULL,
    NULL,
    false,
    true,
    NOW (),
    NOW ()
  ) ON CONFLICT (id) DO NOTHING;

-- Insert account entries with passwords for email authentication
INSERT INTO
  "account" (
    id,
    account_id,
    provider_id,
    user_id,
    password,
    created_at,
    updated_at
  )
VALUES
  -- Account for Test User 1
  (
    'b0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'credential',
    'a0000000-0000-4000-8000-000000000001',
    'd776937bd3cdd0bd77a8f82188d6ad45:9418b5a5309d6add05422adf44fed9903941d394196d8e65e7a9f0d47ebfe7901eb56d7aa307b1f21f81a82960aaab0c7943576f3605e0dc5faa70d8cd1f0348',
    NOW (),
    NOW ()
  ),
  -- Account for Test User 2
  (
    'b0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000002',
    'credential',
    'a0000000-0000-4000-8000-000000000002',
    'd776937bd3cdd0bd77a8f82188d6ad45:9418b5a5309d6add05422adf44fed9903941d394196d8e65e7a9f0d47ebfe7901eb56d7aa307b1f21f81a82960aaab0c7943576f3605e0dc5faa70d8cd1f0348',
    NOW (),
    NOW ()
  ),
  -- Account for Test User 3
  (
    'b0000000-0000-4000-8000-000000000003',
    'a0000000-0000-4000-8000-000000000003',
    'credential',
    'a0000000-0000-4000-8000-000000000003',
    'd776937bd3cdd0bd77a8f82188d6ad45:9418b5a5309d6add05422adf44fed9903941d394196d8e65e7a9f0d47ebfe7901eb56d7aa307b1f21f81a82960aaab0c7943576f3605e0dc5faa70d8cd1f0348',
    NOW (),
    NOW ()
  ) ON CONFLICT (id) DO NOTHING;

-- Insert test buckets
INSERT INTO
  "buckets" (
    id,
    owner,
    name,
    size,
    max_size,
    type,
    public,
    created_at
  )
VALUES
  -- Test Bucket 1 owned by Test User 1
  (
    'c0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'Test Bucket One',
    0,
    10737418240, -- 10 GB
    'small',
    true,
    NOW ()
  ) ON CONFLICT (id) DO NOTHING;

-- Insert test courses
INSERT INTO
  "courses" (
    id,
    name,
    description,
    bucket_id,
    created_at,
    private
  )
VALUES
  -- Test Course 1 in Bucket 1
  (
    'd0000000-0000-4000-8000-000000000001',
    'Test Course One',
    'Test course for automated testing',
    'c0000000-0000-4000-8000-000000000001',
    NOW (),
    false
  ) ON CONFLICT (id) DO NOTHING;