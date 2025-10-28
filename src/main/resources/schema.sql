CREATE SEQUENCE IF NOT EXISTS id_seq
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 999999999
    CYCLE;

-- Update work_scope column length
      ALTER TABLE IF EXISTS work_request ALTER COLUMN work_scope VARCHAR(5000);
      ALTER TABLE IF EXISTS work_request_aud ALTER COLUMN work_scope VARCHAR(5000);

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