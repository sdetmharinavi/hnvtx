-- Complete Node Information View (SECURITY INVOKER)
create view v_employee_designations_with_count with (security_invoker = true) as
select ed.*,
  -- The following columns were attempting to get designation attributes from lookup_types,
  -- but employee_designations itself holds the 'name' directly and does not
  -- have foreign keys to lookup_types for category, code, etc.
  -- If there's a requirement to categorize designations using lookup_types,
  -- a 'designation_category_id' column would be needed in employee_designations.
  -- For now, we only select what's directly available or meaningfully joined.
  count(*) OVER() AS total_count,
  sum(CASE WHEN ed.status = true THEN 1 ELSE 0 END) OVER() AS active_count,
  sum(CASE WHEN ed.status = false THEN 1 ELSE 0 END) OVER() AS inactive_count
from employee_designations ed;