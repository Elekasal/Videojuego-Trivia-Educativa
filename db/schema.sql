-- 0) Extensiones y schema
create extension if not exists "pgcrypto";
create schema if not exists app;

-- 1) Tablas mínimas para el piloto
create table if not exists app.patients (
  id uuid primary key default gen_random_uuid(),
  patient_name text not null check (char_length(patient_name) between 1 and 80),
  created_at timestamptz not null default now(),
  created_by uuid null
);

create table if not exists app.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid null references app.patients(id) on delete set null,
  patient_name text not null,
  cycle text not null check (cycle in ('Primer Ciclo','Segundo Ciclo')),
  score_lengua int  not null default 0 check (score_lengua between 0 and 5),
  score_matematica int not null default 0 check (score_matematica between 0 and 5),
  score_ciencias int not null default 0 check (score_ciencias between 0 and 5),
  total int not null default 0 check (total between 0 and 15),
  created_at timestamptz not null default now(),
  created_by uuid null
);

create table if not exists app.attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references app.quiz_attempts(id) on delete cascade,
  question_id int null,
  selected_answer_id int null,
  is_correct boolean not null,
  created_at timestamptz not null default now()
);

-- 2) RLS habilitado
alter table app.patients       enable row level security;
alter table app.quiz_attempts  enable row level security;
alter table app.attempt_answers enable row level security;

-- 3) Policies (docente dueño)
drop policy if exists pt_all_own on app.patients;
create policy pt_all_own
on app.patients for all
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists qa_select_own on app.quiz_attempts;
create policy qa_select_own
on app.quiz_attempts for select
using (created_by = auth.uid());

drop policy if exists qa_insert_auth on app.quiz_attempts;
create policy qa_insert_auth
on app.quiz_attempts for insert
with check (auth.uid() is not null);

drop policy if exists qa_update_own on app.quiz_attempts;
create policy qa_update_own
on app.quiz_attempts for update
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists qa_delete_own on app.quiz_attempts;
create policy qa_delete_own
on app.quiz_attempts for delete
using (created_by = auth.uid());

drop policy if exists aa_rw_owner on app.attempt_answers;
create policy aa_rw_owner
on app.attempt_answers for all
using (
  exists (select 1 from app.quiz_attempts qa
          where qa.id = attempt_id and qa.created_by = auth.uid())
)
with check (
  exists (select 1 from app.quiz_attempts qa
          where qa.id = attempt_id and qa.created_by = auth.uid())
);

-- 4) Dedupe previo por (created_by, patient_name, cycle) manteniendo el último created_at
--    (Si no hay auth aún, created_by puede ser NULL; en ese caso no se de-duplica)
with ranked as (
  select id,
         row_number() over (
           partition by created_by, patient_name, cycle
           order by created_at desc, id desc
         ) as rn
  from app.quiz_attempts
  where created_by is not null
)
delete from app.quiz_attempts qa
using ranked r
where qa.id = r.id and r.rn > 1;

-- 5) Índice único para permitir UPSERT en esas columnas
--    (si ya existe, no falla)
create unique index if not exists uq_attempts_owner_patient_cycle
  on app.quiz_attempts (created_by, patient_name, cycle);

-- 6) Recargar cache del API
notify pgrst, 'reload schema';
