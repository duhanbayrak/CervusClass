create table if not exists teacher_notes (
  id uuid default gen_random_uuid() primary key,
  teacher_id uuid references auth.users(id) not null,
  student_id uuid references profiles(id) not null,
  note text not null,
  created_at timestamptz default now() not null
);

alter table teacher_notes enable row level security;

create policy "Teachers can view their own notes"
  on teacher_notes for select
  using (auth.uid() = teacher_id);

create policy "Teachers can insert their own notes"
  on teacher_notes for insert
  with check (auth.uid() = teacher_id);

create policy "Teachers can update their own notes"
  on teacher_notes for update
  using (auth.uid() = teacher_id);

create policy "Teachers can delete their own notes"
  on teacher_notes for delete
  using (auth.uid() = teacher_id);
