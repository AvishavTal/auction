-- data.sql
INSERT INTO categories (name) VALUES ('Electronics') ON CONFLICT (name) DO NOTHING;
INSERT INTO categories (name) VALUES ('Collectibles') ON CONFLICT (name) DO NOTHING;
INSERT INTO categories (name) VALUES ('Fashion') ON CONFLICT (name) DO NOTHING;
INSERT INTO categories (name) VALUES ('Home & Garden') ON CONFLICT (name) DO NOTHING;
INSERT INTO categories (name) VALUES ('Toys & Hobbies') ON CONFLICT (name) DO NOTHING;
INSERT INTO categories (name) VALUES ('Art') ON CONFLICT (name) DO NOTHING;