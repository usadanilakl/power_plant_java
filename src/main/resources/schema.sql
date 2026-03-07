-- Clean orphan FK references before Hibernate adds constraints (ignored on fresh DB via continue-on-error)
UPDATE loto_point SET zero_energy_id = NULL WHERE zero_energy_id IS NOT NULL AND zero_energy_id NOT IN (SELECT id FROM zero_energy);

CREATE SEQUENCE IF NOT EXISTS id_seq
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 999999999
    CYCLE;

-- Widen work_scope to TEXT (unlimited length)
      ALTER TABLE IF EXISTS work_request ALTER COLUMN work_scope TEXT;
      ALTER TABLE IF EXISTS work_request_aud ALTER COLUMN work_scope TEXT;

-- Update alias column to TEXT to support longer values (e.g., JSON data)
      ALTER TABLE IF EXISTS val_table ALTER COLUMN alias TEXT;
      ALTER TABLE IF EXISTS val_table_aud ALTER COLUMN alias TEXT;

-- Migrate ZeroEnergy from single templateLotoPoint to multiple templateLotoPointIds
-- Note: Hibernate ddl-auto=update will handle column changes automatically
-- This migration is only needed if you have existing data with the old schema
-- If the table doesn't exist or columns don't exist, this will be safely ignored by Hibernate

-- Add missing columns to loto_boxes table for LED control
ALTER TABLE IF EXISTS loto_boxes ADD COLUMN IF NOT EXISTS r INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS loto_boxes ADD COLUMN IF NOT EXISTS g INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS loto_boxes ADD COLUMN IF NOT EXISTS b INTEGER DEFAULT 32;
ALTER TABLE IF EXISTS loto_boxes ADD COLUMN IF NOT EXISTS brightness INTEGER DEFAULT 255;
ALTER TABLE IF EXISTS loto_boxes ADD COLUMN IF NOT EXISTS range_start INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS loto_boxes ADD COLUMN IF NOT EXISTS range_end INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS loto_boxes ADD COLUMN IF NOT EXISTS description VARCHAR(255);
ALTER TABLE IF EXISTS loto_boxes ADD COLUMN IF NOT EXISTS led_strip_id BIGINT;

-- Add PWA submitter fields to work_request
ALTER TABLE IF EXISTS work_request ADD COLUMN IF NOT EXISTS local_uuid VARCHAR(255);
ALTER TABLE IF EXISTS work_request ADD COLUMN IF NOT EXISTS time_submitted VARCHAR(255);
ALTER TABLE IF EXISTS work_request ADD COLUMN IF NOT EXISTS submitter_name VARCHAR(255);
ALTER TABLE IF EXISTS work_request ADD COLUMN IF NOT EXISTS submitter_email VARCHAR(255);
ALTER TABLE IF EXISTS work_request ADD COLUMN IF NOT EXISTS submitter_phone VARCHAR(255);
ALTER TABLE IF EXISTS work_request ADD COLUMN IF NOT EXISTS submitter_company VARCHAR(255);

-- Same for audit table
ALTER TABLE IF EXISTS work_request_aud ADD COLUMN IF NOT EXISTS local_uuid VARCHAR(255);
ALTER TABLE IF EXISTS work_request_aud ADD COLUMN IF NOT EXISTS time_submitted VARCHAR(255);
ALTER TABLE IF EXISTS work_request_aud ADD COLUMN IF NOT EXISTS submitter_name VARCHAR(255);
ALTER TABLE IF EXISTS work_request_aud ADD COLUMN IF NOT EXISTS submitter_email VARCHAR(255);
ALTER TABLE IF EXISTS work_request_aud ADD COLUMN IF NOT EXISTS submitter_phone VARCHAR(255);
ALTER TABLE IF EXISTS work_request_aud ADD COLUMN IF NOT EXISTS submitter_company VARCHAR(255);

--CREATE TABLE IF NOT EXISTS reference_object (
--    id BIGINT AUTO_INCREMENT PRIMARY KEY,
--    description VARCHAR(255),
--    type VARCHAR(20),
--    group_name VARCHAR(20),
--    tag_numbers CLOB,
--    file_numbers CLOB,
--    characteristics CLOB,
--    references CLOB
--);