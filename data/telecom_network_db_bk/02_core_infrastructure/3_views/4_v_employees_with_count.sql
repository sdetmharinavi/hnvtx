-- Complete Node Information View (SECURITY INVOKER)
create view v_employees_with_count with (security_invoker = true) as
select e.*,
  ed.name as employee_designation_name,
  -- Removed lt_ed columns as they are not sourced from employee_designations,
  -- and there's no direct lookup_type join for designation attributes in this view.
  -- If you need these, you'd join employee_designations.id to lookup_types.id if employee_designations.id
  -- was a foreign key to lookup_types, but it's not based on your schema.
  -- The original employee_designations table itself has 'name', which is already selected.
  count(*) OVER() AS total_count,
  sum(CASE WHEN e.status = true THEN 1 ELSE 0 END) OVER() AS active_count,
  sum(CASE WHEN e.status = false THEN 1 ELSE 0 END) OVER() AS inactive_count
from employees e
  left join employee_designations ed on e.employee_designation_id = ed.id;