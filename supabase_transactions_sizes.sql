ALTER TABLE transactions ADD COLUMN IF NOT EXISTS product_size_id INT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS size_name VARCHAR(50);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'transactions_product_size_fk'
  ) THEN
    ALTER TABLE transactions
    ADD CONSTRAINT transactions_product_size_fk
    FOREIGN KEY (product_size_id) REFERENCES product_sizes(id) ON DELETE SET NULL;
  END IF;
END $$;

