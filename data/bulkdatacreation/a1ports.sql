-- SQL Script to populate ports for a specific System Type
WITH port_templates (port, port_type_id, port_capacity) AS (
  VALUES
    -- Slot 1
    ('1.1', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'), -- E1
    ('1.2', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'), -- E1
    ('1.3', '14888b49-2f7d-4dbd-93c2-b19dcafbcd8c'::uuid, '1G'),    -- Fast Ethernet
    ('1.4', '14888b49-2f7d-4dbd-93c2-b19dcafbcd8c'::uuid, '1G'),    -- Fast Ethernet
    ('1.5', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, '1G'),    -- Gigabit Ethernet
    ('1.6', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, '1G'),    -- Gigabit Ethernet
    
    -- Slot 2 (Repeating pattern from image)
    ('2.1', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('2.2', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('2.3', '14888b49-2f7d-4dbd-93c2-b19dcafbcd8c'::uuid, '1G'),
    ('2.4', '14888b49-2f7d-4dbd-93c2-b19dcafbcd8c'::uuid, '1G'),
    ('2.5', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, '1G'),
    ('2.6', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, '1G')
)
INSERT INTO ports_management (id, system_id, port, port_type_id, port_capacity)
SELECT 
  gen_random_uuid(), -- Generate new ID
  s.id,              -- The System ID
  t.port, 
  t.port_type_id, 
  t.port_capacity
FROM systems s
CROSS JOIN port_templates t
WHERE s.system_type_id = '7874595b-5650-477e-8d88-e4cedbe025e2' -- Filter by System Type
ON CONFLICT (system_id, port) DO NOTHING; -- Prevent duplicates if run multiple times