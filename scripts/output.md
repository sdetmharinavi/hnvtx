<!-- path: data/bulkdatacreation/a3ports.sql -->
```sql
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
WHERE s.system_capacity_id = 'b63e879c-6b09-402f-8958-a45a023e4339' -- Filter by System Type
ON CONFLICT (system_id, port) DO NOTHING; -- Prevent duplicates if run multiple times
```

<!-- path: data/bulkdatacreation/bbuportsy.sql -->
```sql
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
```

<!-- path: data/bulkdatacreation/b3ports.sql -->
```sql
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
```

<!-- path: data/bulkdatacreation/b2ports.sql -->
```sql
-- SQL Script to populate ports for a specific System Type
WITH port_templates (port, port_type_id, port_capacity) AS (
  VALUES
        -- Slot 1
    ('1.1', '7be2cd28-a794-4f98-b2aa-31ea6c1c6edc'::uuid, 'STM1'),
    ('1.2', '7be2cd28-a794-4f98-b2aa-31ea6c1c6edc'::uuid, 'STM1'),
    ('1.3', '7be2cd28-a794-4f98-b2aa-31ea6c1c6edc'::uuid, 'STM1'),
    ('1.4', '7be2cd28-a794-4f98-b2aa-31ea6c1c6edc'::uuid, 'STM1'),
    ('1.5', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('1.6', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('1.7', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('1.8', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('1.9', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('1.10', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('1.11', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('1.12', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('1.13', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('1.14', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('1.15', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('1.16', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('1.17', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('1.18', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('1.19', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('1.20', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),

    -- Slot 2
    ('2.1', '7be2cd28-a794-4f98-b2aa-31ea6c1c6edc'::uuid, 'STM1'),
    ('2.2', '7be2cd28-a794-4f98-b2aa-31ea6c1c6edc'::uuid, 'STM1'),
    ('2.3', '7be2cd28-a794-4f98-b2aa-31ea6c1c6edc'::uuid, 'STM1'),
    ('2.4', '7be2cd28-a794-4f98-b2aa-31ea6c1c6edc'::uuid, 'STM1'),
    ('2.5', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('2.6', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('2.7', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('2.8', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('2.9', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('2.10', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('2.11', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('2.12', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('2.13', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('2.14', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('2.15', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('2.16', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('2.17', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('2.18', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('2.19', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('2.20', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    
    -- Slot 3
    ('3.1', '6c9460cb-22dd-4457-82e3-0ccebe0f3afc'::uuid, '10GE'), 
    ('3.2', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'), 
    ('3.3', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),    
    ('3.4', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),    
    ('3.5', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('3.6', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('3.7', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    ('3.8', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    ('3.9', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    ('3.10', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    ('3.11', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    ('3.12', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    
    -- Slot 4
    ('4.1', '6c9460cb-22dd-4457-82e3-0ccebe0f3afc'::uuid, '10GE'),
    ('4.2', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('4.3', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('4.4', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('4.5', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('4.6', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('4.7', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    ('4.8', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    ('4.9', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    ('4.10', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    ('4.11', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    ('4.12', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    -- Slot 5
    ('5.1', '6c9460cb-22dd-4457-82e3-0ccebe0f3afc'::uuid, '10GE'),
    ('5.2', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('5.3', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('5.4', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('5.5', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('5.6', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('5.7', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    ('5.8', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    ('5.9', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    ('5.10', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    ('5.11', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    ('5.12', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    -- Slot 6
    ('6.1', '6c9460cb-22dd-4457-82e3-0ccebe0f3afc'::uuid, '10GE'),
    ('6.2', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('6.3', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('6.4', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('6.5', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('6.6', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('6.7', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    ('6.8', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    ('6.9', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    ('6.10', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    ('6.11', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    ('6.12', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
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
WHERE s.system_capacity_id = '8e4dde01-4900-4fa5-a9e5-9b89bfe2663a' -- Filter by System Type
ON CONFLICT (system_id, port) DO NOTHING; -- Prevent duplicates if run multiple times
```

<!-- path: data/bulkdatacreation/b1ports.sql -->
```sql
-- SQL Script to populate ports for a specific System Type
WITH port_templates (port, port_type_id, port_capacity) AS (
  VALUES
        -- Slot 1
    ('1.1', '7be2cd28-a794-4f98-b2aa-31ea6c1c6edc'::uuid, 'STM1'),
    ('1.2', '7be2cd28-a794-4f98-b2aa-31ea6c1c6edc'::uuid, 'STM1'),
    ('1.3', '7be2cd28-a794-4f98-b2aa-31ea6c1c6edc'::uuid, 'STM1'),
    ('1.4', '7be2cd28-a794-4f98-b2aa-31ea6c1c6edc'::uuid, 'STM1'),
    ('1.5', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('1.6', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('1.7', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('1.8', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('1.9', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('1.10', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('1.11', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('1.12', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('1.13', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('1.14', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('1.15', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('1.16', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('1.17', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('1.18', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('1.19', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('1.20', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),

    -- Slot 2
    ('2.1', '7be2cd28-a794-4f98-b2aa-31ea6c1c6edc'::uuid, 'STM1'),
    ('2.2', '7be2cd28-a794-4f98-b2aa-31ea6c1c6edc'::uuid, 'STM1'),
    ('2.3', '7be2cd28-a794-4f98-b2aa-31ea6c1c6edc'::uuid, 'STM1'),
    ('2.4', '7be2cd28-a794-4f98-b2aa-31ea6c1c6edc'::uuid, 'STM1'),
    ('2.5', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('2.6', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('2.7', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('2.8', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('2.9', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('2.10', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('2.11', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('2.12', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('2.13', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('2.14', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('2.15', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('2.16', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('2.17', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('2.18', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('2.19', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('2.20', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    -- Slot 3
    ('3.1', '6c9460cb-22dd-4457-82e3-0ccebe0f3afc'::uuid, '10GE'),
    ('3.2', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('3.3', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('3.4', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('3.5', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('3.6', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('3.7', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    ('3.8', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    ('3.9', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    ('3.10', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    ('3.11', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    ('3.12', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    
    -- Slot 4
    ('4.1', '6c9460cb-22dd-4457-82e3-0ccebe0f3afc'::uuid, '10GE'),
    ('4.2', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('4.3', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('4.4', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('4.5', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('4.6', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('4.7', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    ('4.8', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    ('4.9', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    ('4.10', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    ('4.11', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    ('4.12', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
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
WHERE s.system_capacity_id = '3beb3ea2-55a4-48da-a7fa-f7c9ccf7de79' -- Filter by System Type
ON CONFLICT (system_id, port) DO NOTHING; -- Prevent duplicates if run multiple times
```

<!-- path: data/bulkdatacreation/a1ports.sql -->
```sql
-- SQL Script to populate ports for a specific System Type
WITH port_templates (port, port_type_id, port_capacity) AS (
  VALUES
    -- Slot 1
    ('1.1', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('1.2', '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1'::uuid, '2mbps'),
    ('1.3', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    ('1.4', 'bf63f1aa-0976-401a-8309-1ede374d0c54'::uuid, 'GE(E)'),
    ('1.5', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    ('1.6', '4b86eede-d502-4368-85c1-8e68d9b50282'::uuid, 'GE(O)'),
    
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
```

