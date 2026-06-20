-- path: data/migrations/10_power_readings/01_setup.sql
-- Description: Sets up the Port Power Readings tracking module and cleans up legacy E-Files database objects.

-- =================================================================
-- Section 1: Legacy Cleanup
-- =================================================================
DROP VIEW IF EXISTS public.v_file_movements_extended CASCADE;
DROP VIEW IF EXISTS public.v_e_files_extended CASCADE;
DROP TABLE IF EXISTS public.file_movements CASCADE;
DROP TABLE IF EXISTS public.e_files CASCADE;

-- =================================================================
-- Section 2: Port Power Readings Table & View
-- =================================================================

CREATE TABLE IF NOT EXISTS public.port_power_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ring_id UUID REFERENCES public.rings(id) ON DELETE CASCADE,
    system_id UUID REFERENCES public.systems(id) ON DELETE CASCADE,
    port TEXT NOT NULL,
    tx_power DECIMAL(10, 3), -- Tx power in dBm
    rx_power DECIMAL(10, 3), -- Rx power in dBm
    reading_date TIMESTAMPTZ DEFAULT NOW(),
    recorded_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    remark TEXT
);

-- Indexing for high-performance retrieval
CREATE INDEX IF NOT EXISTS idx_port_power_readings_ring_id ON public.port_power_readings(ring_id);
CREATE INDEX IF NOT EXISTS idx_port_power_readings_system_port ON public.port_power_readings(system_id, port);
CREATE INDEX IF NOT EXISTS idx_port_power_readings_date ON public.port_power_readings(reading_date DESC);

-- Enable RLS & Apply Policies
ALTER TABLE public.port_power_readings ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.port_power_readings TO authenticated;
GRANT ALL ON TABLE public.port_power_readings TO admin, admin_pro;

CREATE POLICY "Allow full access to authenticated users on port_power_readings"
ON public.port_power_readings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Attach standard audit logging trigger
DROP TRIGGER IF EXISTS port_power_readings_log_trigger ON public.port_power_readings;
CREATE TRIGGER port_power_readings_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.port_power_readings
FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();

-- Reusable complete View for power logs
CREATE OR REPLACE VIEW public.v_port_power_readings WITH (security_invoker = true) AS
SELECT
    r.id,
    r.ring_id,
    r.system_id,
    s.system_name,
    r.port,
    r.tx_power,
    r.rx_power,
    r.reading_date,
    r.recorded_by_user_id,
    p.full_name as recorded_by_name,
    r.remark
FROM public.port_power_readings r
LEFT JOIN public.systems s ON r.system_id = s.id
LEFT JOIN public.v_user_profiles_extended p ON r.recorded_by_user_id = p.id;

GRANT SELECT ON public.v_port_power_readings TO authenticated;

-- =================================================================
-- Section 3: RPC Utilities
-- =================================================================

-- RPC 1: Logs multiple port readings atomically
CREATE OR REPLACE FUNCTION public.log_multiple_port_power_readings(
    p_ring_id UUID,
    p_readings JSONB -- Array of {system_id, port, tx_power, rx_power, remark}
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_item JSONB;
BEGIN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_readings) LOOP
        INSERT INTO public.port_power_readings (
            ring_id,
            system_id,
            port,
            tx_power,
            rx_power,
            recorded_by_user_id,
            remark
        ) VALUES (
            p_ring_id,
            (v_item->>'system_id')::UUID,
            v_item->>'port',
            (v_item->>'tx_power')::DECIMAL,
            (v_item->>'rx_power')::DECIMAL,
            auth.uid(),
            v_item->>'remark'
        );
    END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_multiple_port_power_readings(UUID, JSONB) TO authenticated;

-- RPC 2: Fetches the latest power Readings for both ends of a system connection
CREATE OR REPLACE FUNCTION public.get_latest_connection_power_readings(
    p_system_connection_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_system_id UUID;
    v_en_id UUID;
    v_working_port TEXT;
    v_en_working_port TEXT;
    v_tx_a DECIMAL;
    v_rx_a DECIMAL;
    v_tx_b DECIMAL;
    v_rx_b DECIMAL;
BEGIN
    -- Get systems and ports of the connection
    SELECT 
        system_id, en_id, system_working_interface, en_interface
    INTO 
        v_system_id, v_en_id, v_working_port, v_en_working_port
    FROM public.system_connections
    WHERE id = p_system_connection_id;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Latest readings for Side A (Working port)
    SELECT tx_power, rx_power INTO v_tx_a, v_rx_a
    FROM public.port_power_readings
    WHERE system_id = v_system_id AND port = v_working_port
    ORDER BY reading_date DESC
    LIMIT 1;

    -- Latest readings for Side B (Working port)
    SELECT tx_power, rx_power INTO v_tx_b, v_rx_b
    FROM public.port_power_readings
    WHERE system_id = v_en_id AND port = v_en_working_port
    ORDER BY reading_date DESC
    LIMIT 1;

    RETURN jsonb_build_object(
        'side_a', jsonb_build_object(
            'system_id', v_system_id,
            'port', v_working_port,
            'tx_power', v_tx_a,
            'rx_power', v_rx_a
        ),
        'side_b', jsonb_build_object(
            'system_id', v_en_id,
            'port', v_en_working_port,
            'tx_power', v_tx_b,
            'rx_power', v_rx_b
        )
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_latest_connection_power_readings(UUID) TO authenticated;