CREATE SEQUENCE IF NOT EXISTS id_seq
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 999999999
    CYCLE;

-- Update work_scope column length
      ALTER TABLE IF EXISTS work_request ALTER COLUMN work_scope VARCHAR(5000);
      ALTER TABLE IF EXISTS work_request_aud ALTER COLUMN work_scope VARCHAR(5000);

-- Migrate ZeroEnergy from single templateLotoPoint to multiple templateLotoPointIds
-- Note: Hibernate ddl-auto=update will handle column changes automatically
-- This migration is only needed if you have existing data with the old schema
-- If the table doesn't exist or columns don't exist, this will be safely ignored by Hibernate

-- Add missing columns to loto_boxes table for LED control
ALTER TABLE loto_boxes ADD COLUMN IF NOT EXISTS r INTEGER DEFAULT 0;
ALTER TABLE loto_boxes ADD COLUMN IF NOT EXISTS g INTEGER DEFAULT 0;
ALTER TABLE loto_boxes ADD COLUMN IF NOT EXISTS b INTEGER DEFAULT 32;
ALTER TABLE loto_boxes ADD COLUMN IF NOT EXISTS brightness INTEGER DEFAULT 255;
ALTER TABLE loto_boxes ADD COLUMN IF NOT EXISTS range_start INTEGER DEFAULT 0;
ALTER TABLE loto_boxes ADD COLUMN IF NOT EXISTS range_end INTEGER DEFAULT 0;
ALTER TABLE loto_boxes ADD COLUMN IF NOT EXISTS description VARCHAR(255);
ALTER TABLE loto_boxes ADD COLUMN IF NOT EXISTS led_strip_id BIGINT;

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