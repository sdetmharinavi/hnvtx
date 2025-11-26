-- SQL Script to populate ports for a specific System Type
WITH port_templates (port, port_type_id, port_capacity) AS (
  VALUES
    ('P1', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'), -- Gigabit Ethernet
    ('P2', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),    -- Gigabit Ethernet
    ('P3', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),    -- Gigabit Ethernet
    ('P4', '6c9460cb-22dd-4457-82e3-0ccebe0f3afc'::uuid, '10GE'), -- Gigabit Ethernet
    ('P5', '6c9460cb-22dd-4457-82e3-0ccebe0f3afc'::uuid, '10GE')    -- Gigabit Ethernet
    
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
WHERE s.system_capacity_id = '3830d349-f4ce-4391-9796-111cbf942a6f' -- Filter by System Type
ON CONFLICT (system_id, port) DO NOTHING; -- Prevent duplicates if run multiple times