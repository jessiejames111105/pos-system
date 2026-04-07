ALTER TABLE accounts ADD COLUMN IF NOT EXISTS account_id VARCHAR(20);

UPDATE accounts
SET account_id = COALESCE(
  account_id,
  CASE
    WHEN role = 'admin' THEN 'ADM' || LPAD(CAST((ROW_NUMBER() OVER (ORDER BY created_at)) AS TEXT), 6, '0')
    ELSE 'CSH' || LPAD(CAST((ROW_NUMBER() OVER (ORDER BY created_at)) AS TEXT), 6, '0')
  END
)
WHERE account_id IS NULL;

ALTER TABLE accounts ALTER COLUMN account_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'accounts_account_id_unique'
  ) THEN
    ALTER TABLE accounts ADD CONSTRAINT accounts_account_id_unique UNIQUE (account_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'accounts_account_id_prefix_chk'
  ) THEN
    ALTER TABLE accounts
    ADD CONSTRAINT accounts_account_id_prefix_chk
    CHECK (account_id LIKE 'ADM%' OR account_id LIKE 'CSH%');
  END IF;
END $$;
