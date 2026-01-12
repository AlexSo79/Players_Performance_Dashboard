-- Helper function to promote a user to Admin by email
-- Usage: select promote_to_admin('newadmin@example.com');

create or replace function public.promote_to_admin(target_email text)
returns text as $$
declare
  updated_count int;
begin
  update public.profiles
  set role = 'admin'
  where email = target_email;
  
  get diagnostics updated_count = row_count;
  
  if updated_count > 0 then
    return 'Success: ' || target_email || ' is now an Admin.';
  else
    return 'Error: User ' || target_email || ' not found.';
  end if;
end;
$$ language plpgsql security definer;
