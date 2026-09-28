-- Mess Memory schema. Run in Supabase > SQL Editor.
create table profiles(id uuid primary key references auth.users on delete cascade,name text,role text not null default 'student' check(role in('student','staff')),created_at timestamptz default now());
create table meals(id uuid primary key default gen_random_uuid(),date date not null,meal_type text not null check(meal_type in('breakfast','lunch','dinner')),menu text[] not null default '{}',start_time time,end_time time,is_demo boolean default false,created_at timestamptz default now());
create table student_responses(id uuid primary key default gen_random_uuid(),meal_id uuid not null references meals on delete cascade,student_id uuid not null references profiles on delete cascade,will_eat boolean not null,portion_size text check(portion_size in('small','regular','large')),created_at timestamptz default now(),unique(meal_id,student_id));
create table kitchen_records(id uuid primary key default gen_random_uuid(),meal_id uuid not null references meals on delete cascade,dish_name text not null,prepared_quantity numeric not null check(prepared_quantity>=0),unit text not null check(unit in('kg','litres','portions')),unserved_quantity numeric not null check(unserved_quantity>=0),actual_attendance int not null check(actual_attendance>=0),plate_waste numeric not null default 0 check(plate_waste>=0),notes text,created_at timestamptz default now());
create table feedback(id uuid primary key default gen_random_uuid(),meal_id uuid not null references meals on delete cascade,student_id uuid not null references profiles on delete cascade,left_food boolean not null,reason text,comment text,created_at timestamptz default now());

create function is_staff() returns boolean language sql security definer set search_path=public as $$select exists(select 1 from profiles where id=auth.uid() and role='staff')$$;
create function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$begin insert into profiles(id,name) values(new.id,coalesce(new.raw_user_meta_data->>'name','Student'));return new;end$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();
-- Anonymous aggregate counts (students never see individual answers)
create function meal_stats(p_meal uuid) returns json language sql security definer set search_path=public as $$
select json_build_object('eating',count(*) filter(where will_eat),'skipping',count(*) filter(where not will_eat),
'small',count(*) filter(where will_eat and portion_size='small'),'regular',count(*) filter(where will_eat and portion_size='regular'),
'large',count(*) filter(where will_eat and portion_size='large'),'students',(select count(*) from profiles where role='student')) from student_responses where meal_id=p_meal$$;
create function public_stats() returns json language sql security definer set search_path=public as $$
select json_build_object('meals',(select count(*) from kitchen_records),'students',(select count(*) from profiles where role='student'),
'waste',(select coalesce(sum(unserved_quantity+plate_waste),0) from kitchen_records where unit='kg'))$$;

alter table profiles enable row level security;alter table meals enable row level security;alter table student_responses enable row level security;alter table kitchen_records enable row level security;alter table feedback enable row level security;
create policy "own or staff" on profiles for select using(id=auth.uid() or is_staff());
create policy "read meals" on meals for select to authenticated using(true);
create policy "staff write meals" on meals for all using(is_staff()) with check(is_staff());
create policy "own responses" on student_responses for all using(student_id=auth.uid()) with check(student_id=auth.uid());
create policy "staff read responses" on student_responses for select using(is_staff());
create policy "staff kitchen" on kitchen_records for all using(is_staff()) with check(is_staff());
create policy "own feedback insert" on feedback for insert with check(student_id=auth.uid());
create policy "own or staff feedback" on feedback for select using(student_id=auth.uid() or is_staff());

-- DEMO DATA (remove with: delete from meals where is_demo;)
insert into meals(date,meal_type,menu,start_time,end_time,is_demo) select current_date-g,'lunch',array['Rice','Dal','Aloo Gobi'],'12:30','14:30',true from generate_series(1,6) g;
insert into kitchen_records(meal_id,dish_name,prepared_quantity,unit,unserved_quantity,actual_attendance,plate_waste,notes)
select m.id,d.n,d.p,'kg',round((1+(extract(day from m.date)::int%3)*d.p/12)::numeric,1),110+(extract(day from m.date)::int%4)*5,round((0.5+(extract(day from m.date)::int%3)*0.4)::numeric,1),'DEMO'
from meals m cross join (values('Rice',25),('Dal',15),('Aloo Gobi',12)) d(n,p) where m.is_demo;
