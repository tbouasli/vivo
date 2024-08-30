CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL NOT NULL
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  status TEXT NOT NULL
);