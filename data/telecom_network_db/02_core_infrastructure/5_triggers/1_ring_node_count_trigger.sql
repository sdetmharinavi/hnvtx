-- Trigger to automatically update ring node counts
create trigger trigger_update_ring_node_count
after insert or update or delete on nodes 
for each row execute function update_ring_node_count();