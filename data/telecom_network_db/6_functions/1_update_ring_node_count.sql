-- update_ring_node_count function with secure search_path
create or replace function update_ring_node_count() RETURNS TRIGGER SECURITY DEFINER
set search_path = public, pg_catalog
LANGUAGE plpgsql as $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE rings
    SET total_nodes = (
      SELECT COUNT(*)
      FROM nodes
      WHERE ring_id = NEW.ring_id
        AND status = true
    )
    WHERE id = NEW.ring_id;
  END IF;
  
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.ring_id IS DISTINCT FROM NEW.ring_id) THEN
    UPDATE rings
    SET total_nodes = (
      SELECT COUNT(*)
      FROM nodes
      WHERE ring_id = OLD.ring_id
        AND status = true
    )
    WHERE id = OLD.ring_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;