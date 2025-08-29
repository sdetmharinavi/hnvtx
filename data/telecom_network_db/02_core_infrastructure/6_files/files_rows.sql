create table public.folders (
  id UUID primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  created_at timestamp with time zone null default now(),
  constraint folders_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;

create index IF not exists idx_folders_user_id on public.folders using btree (user_id) TABLESPACE pg_default;


create table public.files (
  id UUID primary key default gen_random_uuid(),
  user_id uuid not null,
  folder_id uuid null,
  file_name text not null,
  file_type text not null,
  file_size text not null,
  file_route text not null,
  file_url text not null,
  uploaded_at timestamp with time zone null default now(),
  constraint files_folder_id_fkey foreign KEY (folder_id) references folders (id),
  constraint files_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;

create index IF not exists idx_files_user_id on public.files using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_files_folder_id on public.files using btree (folder_id) TABLESPACE pg_default;

