CREATE TABLE IF NOT EXISTS product_sizes (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (product_id, name)
);

CREATE TABLE IF NOT EXISTS product_size_ingredients (
  id SERIAL PRIMARY KEY,
  product_size_id INT REFERENCES product_sizes(id) ON DELETE CASCADE,
  ingredient_id INT REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(12,3) NOT NULL CHECK (quantity > 0),
  UNIQUE (product_size_id, ingredient_id)
);

ALTER TABLE product_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_size_ingredients ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_sizes') THEN
    CREATE POLICY "Allow all product sizes" ON product_sizes FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_size_ingredients') THEN
    CREATE POLICY "Allow all product size ingredients" ON product_size_ingredients FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

