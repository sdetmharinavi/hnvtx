-- SQL Script to populate ports for a specific System Type
WITH port_templates (port, port_type_id, port_capacity) AS (
    VALUES
        -- 1st STM
        ('1-1-1', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('1-1-2', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('1-1-3', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('1-2-1', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('1-2-2', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('1-2-3', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('1-3-1', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('1-3-2', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('1-3-3', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('1-4-1', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('1-4-2', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('1-4-3', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('1-5-1', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('1-5-2', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('1-5-3', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('1-6-1', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('1-6-2', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('1-6-3', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('1-7-1', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('1-7-2', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('1-7-3', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('2-1-1', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('2-1-2', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('2-1-3', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('2-2-1', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('2-2-2', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('2-2-3', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('2-3-1', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('2-3-2', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('2-3-3', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('2-4-1', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('2-4-2', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('2-4-3', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('2-5-1', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('2-5-2', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('2-5-3', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('2-6-1', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('2-6-2', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('2-6-3', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('2-7-1', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('2-7-2', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
        ('2-7-3', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),

        -- STM1

        --STM4

        --STM16

        -- NMS
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
WHERE s.system_capacity_id = '8e4dde01-4900-4fa5-a9e5-9b89bfe2663a' -- Filter by System Type
ON CONFLICT (system_id, port) DO NOTHING; -- Prevent duplicates if run multiple times