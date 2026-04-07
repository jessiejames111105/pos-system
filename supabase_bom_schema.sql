CREATE TABLE IF NOT EXISTS ingredients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) UNIQUE NOT NULL,
  unit VARCHAR(20) NOT NULL DEFAULT 'pcs',
  quantity DECIMAL(12,3) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_stock DECIMAL(12,3) NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ingredient_logs (
  id SERIAL PRIMARY KEY,
  ingredient_id INT REFERENCES ingredients(id) ON DELETE CASCADE,
  change DECIMAL(12,3) NOT NULL,
  reason VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_ingredients (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id INT REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(12,3) NOT NULL CHECK (quantity > 0),
  UNIQUE (product_id, ingredient_id)
);

CREATE TABLE IF NOT EXISTS addons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) UNIQUE NOT NULL,
  price_per_unit DECIMAL(10,2) NOT NULL CHECK (price_per_unit >= 0),
  variable_quantity BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS addon_ingredients (
  id SERIAL PRIMARY KEY,
  addon_id INT REFERENCES addons(id) ON DELETE CASCADE,
  ingredient_id INT REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(12,3) NOT NULL CHECK (quantity > 0),
  UNIQUE (addon_id, ingredient_id)
);

CREATE TABLE IF NOT EXISTS product_addons (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  addon_id INT REFERENCES addons(id) ON DELETE CASCADE,
  UNIQUE (product_id, addon_id)
);

CREATE TABLE IF NOT EXISTS transaction_addons (
  id SERIAL PRIMARY KEY,
  transaction_id INT REFERENCES transactions(id) ON DELETE CASCADE,
  addon_id INT REFERENCES addons(id) ON DELETE SET NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0)
);

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE addon_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_addons ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ingredients') THEN
    CREATE POLICY "Allow all ingredients" ON ingredients FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ingredient_logs') THEN
    CREATE POLICY "Allow all ingredient logs" ON ingredient_logs FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_ingredients') THEN
    CREATE POLICY "Allow all product ingredients" ON product_ingredients FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'addons') THEN
    CREATE POLICY "Allow all addons" ON addons FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'addon_ingredients') THEN
    CREATE POLICY "Allow all addon ingredients" ON addon_ingredients FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_addons') THEN
    CREATE POLICY "Allow all product addons" ON product_addons FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transaction_addons') THEN
    CREATE POLICY "Allow all transaction addons" ON transaction_addons FOR ALL USING (true);
  END IF;
END $$;

