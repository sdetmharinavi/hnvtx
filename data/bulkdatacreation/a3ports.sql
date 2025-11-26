-- SQL Script to populate ports for a specific System Type
WITH port_templates (port, port_type_id, port_capacity) AS (
  VALUES
    -- Slot 1
    ('ETH-1-1-1', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('ETH-1-1-2', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('ETH-1-1-3', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('ETH-1-1-4', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('ETH-1-1-5', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('ETH-1-1-6', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    
    -- Slot 2 (Repeating pattern from image)
    ('2.1', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('2.2', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('2.3', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    ('2.4', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    ('2.5', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('2.6', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    -- CPAN NMS
    ('NMS', '14888b49-2f7d-4dbd-93c2-b19dcafbcd8c'::uuid, 'FE')
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
WHERE s.system_capacity_id = '42f21547-e070-4a94-a13d-d4f158e51fc1' -- Filter by System Type
ON CONFLICT (system_id, port) DO NOTHING; -- Prevent duplicates if run multiple times