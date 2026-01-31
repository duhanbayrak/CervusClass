-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Organizations Table
create table organizations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null unique,
  logo_url text,
  subscription_status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Profiles Table (Extends auth.users)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  organization_id uuid references organizations(id) not null,
  role text check (role in ('super_admin', 'admin', 'teacher', 'student')) not null,
  full_name text,
  avatar_url text,
  class_id uuid, -- FK added later after classes table creation
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Classes Table
create table classes (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references organizations(id) not null,
  name text not null,
  grade_level int not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add class_id FK to profiles
alter table profiles add constraint fk_profiles_class foreign key (class_id) references classes(id);

-- Schedule Table
create table schedule (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references organizations(id) not null,
  class_id uuid references classes(id),
  teacher_id uuid references profiles(id),
  course_name text not null,
  day_of_week int not null check (day_of_week between 1 and 7),
  start_time time not null,
  end_time time not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Study Sessions Table
create table study_sessions (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references organizations(id) not null,
  teacher_id uuid references profiles(id) not null,
  student_id uuid references profiles(id) not null,
  scheduled_at timestamp with time zone not null,
  status text check (status in ('pending', 'approved', 'rejected', 'completed', 'no_show')) default 'pending',
  topic text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Exam Results Table
create table exam_results (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references organizations(id) not null,
  student_id uuid references profiles(id) not null,
  exam_name text not null,
  exam_date date,
  scores jsonb default '{}'::jsonb,
  total_net numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Attendance Table
create table attendance (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references organizations(id) not null,
  student_id uuid references profiles(id) not null,
  schedule_id uuid references schedule(id),
  status text check (status in ('present', 'absent', 'late')) not null,
  date date not null,
  late_minutes int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Homework Table
create table homework (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references organizations(id) not null,
  teacher_id uuid references profiles(id) not null,
  class_id uuid references classes(id) not null,
  description text not null,
  due_date timestamp with time zone,
  completion_status jsonb default '{}'::jsonb, -- e.g. {student_id: boolean}
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes
create index idx_profiles_org on profiles(organization_id);
create index idx_classes_org on classes(organization_id);
create index idx_exam_results_net on exam_results(total_net);

-- RLS Helper Function
create or replace function get_org_id()
returns uuid as $$
  select organization_id from profiles where id = auth.uid();
$$ language sql security definer;

-- Enable RLS
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table classes enable row level security;
alter table schedule enable row level security;
alter table study_sessions enable row level security;
alter table exam_results enable row level security;
alter table attendance enable row level security;
alter table homework enable row level security;

-- Policies (Basic Multi-tenancy)
-- Organizations: only super_admin can insert/update. Users can view their own org.
create policy "Users can view own organization" on organizations
  for select using (id = get_org_id());

-- Profiles: 
create policy "Users can view profiles in their org" on profiles
  for select using (organization_id = get_org_id());

-- Classes, Schedule, etc.: Viewable by org members
create policy "View org classes" on classes for select using (organization_id = get_org_id());
create policy "View org schedule" on schedule for select using (organization_id = get_org_id());
create policy "View org study_sessions" on study_sessions for select using (organization_id = get_org_id());
create policy "View org exam_results" on exam_results for select using (organization_id = get_org_id());
create policy "View org attendance" on attendance for select using (organization_id = get_org_id());
create policy "View org homework" on homework for select using (organization_id = get_org_id());

-- TODO: Add specific INSERT/UPDATE policies based on Role (e.g. Students can't create classes)
