-- Complete Node Information View (SECURITY INVOKER)
create view v_lookup_types_with_count with (security_invoker = true) as
select lt.*,
  count(*) OVER() AS total_count,
  sum(CASE WHEN lt.status = true THEN 1 ELSE 0 END) OVER() AS active_count,
  sum(CASE WHEN lt.status = false THEN 1 ELSE 0 END) OVER() AS inactive_count
from lookup_types lt;