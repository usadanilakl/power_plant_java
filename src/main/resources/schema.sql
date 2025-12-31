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