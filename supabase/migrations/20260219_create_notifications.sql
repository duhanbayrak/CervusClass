create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) not null,
  title text not null,
  message text not null,
  type text default 'info' check (type in ('info', 'warning', 'success')),
  is_read boolean default false not null,
  created_at timestamptz default now() not null
);

create index idx_notifications_user_read on notifications(user_id, is_read);

alter table notifications enable row level security;

create policy "Users can view their own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on notifications for update
  using (auth.uid() = user_id);

create policy "Service role can insert notifications"
  on notifications for insert
  with check (true);
