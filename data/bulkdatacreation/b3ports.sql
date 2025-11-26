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
    ('ETH-1-1-7', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('ETH-1-1-8', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('ETH-1-1-9', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('ETH-1-1-10', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('ETH-1-1-11', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('ETH-1-1-12', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('ETH-1-1-13', '6c9460cb-22dd-4457-82e3-0ccebe0f3afc'::uuid, '10GE'),
    ('ETH-1-1-14', '6c9460cb-22dd-4457-82e3-0ccebe0f3afc'::uuid, '10GE'),
    ('ETH-1-1-15', '6c9460cb-22dd-4457-82e3-0ccebe0f3afc'::uuid, '10GE'),
    ('ETH-1-1-16', '6c9460cb-22dd-4457-82e3-0ccebe0f3afc'::uuid, '10GE'),
    ('ETH-1-1-17', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(E)'),
    ('ETH-1-1-18', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(E)'),
    ('ETH-1-1-19', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(E)'),
    ('ETH-1-1-20', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(E)'),
    
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
WHERE s.system_capacity_id = 'ce06f9b7-02e7-4741-8911-46cf1f47ffdd' -- Filter by System Type
ON CONFLICT (system_id, port) DO NOTHING; -- Prevent duplicates if run multiple times