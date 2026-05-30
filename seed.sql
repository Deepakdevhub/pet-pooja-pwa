-- ═══════════════════════════════════════════════════════════
-- PET POOJA — Seed Data (43 Menu Items)
-- ═══════════════════════════════════════════════════════════

-- PIZZA (10)
INSERT OR IGNORE INTO menu_items (id, name, price, category, available, description, tags, badge, sort_order) VALUES
('p1', 'Vegi. Cheese Pizza', 120, 'pizza', 1, 'Loaded with fresh veggies and gooey mozzarella cheese on a crispy base.', '["Bestseller","Cheesy"]', NULL, 1),
('p2', 'Tandoori Cheese Pizza', 120, 'pizza', 1, 'Smoky tandoori flavour with melted cheese and spiced toppings.', '["Spicy","Smoky"]', NULL, 2),
('p3', 'Plain Cheese Pizza', 120, 'pizza', 1, 'Simple, classic — just golden crust smothered in rich mozzarella.', '["Classic","Cheesy"]', NULL, 3),
('p4', 'Onion Cheese Pizza', 120, 'pizza', 1, 'Crunchy caramelized onion rings layered with melted cheese.', '["Crunchy","Cheesy"]', NULL, 4),
('p5', 'Chilli Cheese Pizza', 120, 'pizza', 1, 'Fiery green chillies with stretchy cheese for the spice lovers.', '["Spicy","Hot"]', NULL, 5),
('p6', 'Corniza Pizza', 130, 'pizza', 1, 'Sweet golden corn kernels on a bed of creamy cheese sauce.', '["Sweet","Cheesy"]', NULL, 6),
('p7', 'Schezwan Cheese Pizza', 130, 'pizza', 1, 'Bold schezwan sauce with cheese — Indo-Chinese fusion at its best.', '["Fusion","Spicy"]', NULL, 7),
('p8', 'Spinach Corn Pizza', 140, 'pizza', 1, 'Healthy spinach and sweet corn with a cheesy twist.', '["Healthy","Fresh"]', NULL, 8),
('p9', 'Paneer Cheese Pizza', 170, 'pizza', 1, 'Soft paneer cubes with double cheese on a perfectly baked base.', '["Premium","Cheesy"]', NULL, 9),
('p10', 'Pet Pooja Special Pizza', 180, 'pizza', 1, 'Our signature loaded pizza — chef''s secret recipe with premium toppings.', '["Chef Special","Premium"]', '⭐ Special', 10);

-- BURGER (5)
INSERT OR IGNORE INTO menu_items (id, name, price, category, available, description, tags, badge, sort_order) VALUES
('b1', 'Veg. Burger', 40, 'burger', 1, 'Crispy aloo tikki patty in a soft bun with fresh lettuce.', '["Classic","Value"]', NULL, 1),
('b2', 'Cheese Burger', 40, 'burger', 1, 'Juicy patty topped with a thick slice of melted cheese.', '["Cheesy","Popular"]', NULL, 2),
('b3', 'Veg. Cheese Burger', 50, 'burger', 1, 'Veggie patty loaded with cheese, lettuce and tangy sauce.', '["Cheesy","Loaded"]', NULL, 3),
('b4', 'Mayo Burger', 50, 'burger', 1, 'Creamy mayo drizzle on a crispy patty — smooth and satisfying.', '["Creamy","Smooth"]', NULL, 4),
('b5', 'Masala Burger', 50, 'burger', 1, 'Desi spiced patty with chatpata masala — a flavour explosion.', '["Spicy","Desi"]', NULL, 5);

-- GRILL (11)
INSERT OR IGNORE INTO menu_items (id, name, price, category, available, description, tags, badge, sort_order) VALUES
('g1', 'Vegi. Grill', 80, 'grill', 1, 'Grilled veggies pressed between toasted bread with butter.', '["Light","Healthy"]', NULL, 1),
('g2', 'Vegi. Mayo Grill', 110, 'grill', 1, 'Garden veggies with creamy mayo, perfectly grilled and toasted.', '["Creamy","Fresh"]', NULL, 2),
('g3', 'Vegi. Cheese Grill', 110, 'grill', 1, 'Fresh veggies with melted cheese in a hot-pressed grill.', '["Cheesy","Bestseller"]', NULL, 3),
('g4', 'Plain Cheese Grill', 110, 'grill', 1, 'Pure melted cheese grilled between golden buttery bread.', '["Classic","Cheesy"]', NULL, 4),
('g5', 'Tandoori Cheese Grill', 110, 'grill', 1, 'Tandoori masala with stretchy cheese — smoky and bold.', '["Smoky","Spicy"]', NULL, 5),
('g6', 'Schezwan Cheese Grill', 110, 'grill', 1, 'Fiery schezwan sauce meets gooey cheese in a crunchy grill.', '["Fusion","Hot"]', NULL, 6),
('g7', 'Masala Cheese Grill', 110, 'grill', 1, 'Spiced masala filling with cheese — desi flavour, grill perfection.', '["Desi","Spicy"]', NULL, 7),
('g8', 'Club Cheese Grill', 110, 'grill', 1, 'Triple-layered club-style grill with cheese in every bite.', '["Loaded","Premium"]', NULL, 8),
('g9', 'Corn Cheese Grill', 110, 'grill', 1, 'Sweet corn and melted cheese — a crowd favourite combo.', '["Sweet","Popular"]', NULL, 9),
('g10', 'Tandoori Cheese Paneer Grill', 130, 'grill', 1, 'Tandoori paneer chunks with double cheese, grilled to perfection.', '["Premium","Paneer"]', NULL, 10),
('g11', 'Pet Pooja Special Grill', 170, 'grill', 1, 'Our house special grill — secret sauce, loaded toppings, unforgettable taste.', '["Chef Special","Loaded"]', '⭐ Special', 11);

-- SANDWICH (6)
INSERT OR IGNORE INTO menu_items (id, name, price, category, available, description, tags, badge, sort_order) VALUES
('s1', 'Pottetowich', 30, 'sandwich', 1, 'Crispy potato slices in fresh bread — simple, quick, delicious.', '["Value","Quick"]', NULL, 1),
('s2', 'Bread Butter Sandwich', 40, 'sandwich', 1, 'Classic buttered bread with a light, satisfying crunch.', '["Classic","Light"]', NULL, 2),
('s3', 'Veg. Sandwich', 40, 'sandwich', 1, 'Fresh veggies layered with chutney in soft bread slices.', '["Fresh","Healthy"]', NULL, 3),
('s4', 'Veg. Mayo Sandwich', 60, 'sandwich', 1, 'Garden veggies with creamy mayo spread — smooth and fresh.', '["Creamy","Fresh"]', NULL, 4),
('s5', 'Veg. Cheese Sandwich', 60, 'sandwich', 1, 'Loaded veggie sandwich with melted cheese on every layer.', '["Cheesy","Loaded"]', NULL, 5),
('s6', 'Plain Cheese Sandwich', 60, 'sandwich', 1, 'Simple cheese-filled sandwich — melty, buttery, classic.', '["Classic","Cheesy"]', NULL, 6);

-- TOAST (8)
INSERT OR IGNORE INTO menu_items (id, name, price, category, available, description, tags, badge, sort_order) VALUES
('t1', 'Butter Toast', 40, 'toast', 1, 'Golden crispy toast with a generous layer of fresh butter.', '["Classic","Quick"]', NULL, 1),
('t2', 'Masala Toast', 50, 'toast', 1, 'Spiced masala filling in crunchy toasted bread — chatpata!', '["Spicy","Desi"]', NULL, 2),
('t3', 'Masala Cheese Toast', 60, 'toast', 1, 'Masala spice meets melted cheese in a perfectly toasted bite.', '["Spicy","Cheesy"]', NULL, 3),
('t4', 'Chilli Cheese Toast', 60, 'toast', 1, 'Green chillies and cheese toasted until bubbly and golden.', '["Hot","Cheesy"]', NULL, 4),
('t5', 'Tandoori Toast', 70, 'toast', 1, 'Smoky tandoori flavour baked into crispy toast perfection.', '["Smoky","Bold"]', NULL, 5),
('t6', 'Spinach Corn Toast', 70, 'toast', 1, 'Nutritious spinach and sweet corn on crunchy golden toast.', '["Healthy","Fresh"]', NULL, 6),
('t7', 'Schezwan Toast', 70, 'toast', 1, 'Bold schezwan sauce on crispy toast — spicy and addictive.', '["Fusion","Spicy"]', NULL, 7),
('t8', 'Veg. Mayo Toast', 80, 'toast', 1, 'Fresh veggies with creamy mayo toasted to golden perfection.', '["Creamy","Fresh"]', NULL, 8);

-- MILKSHAKE (4)
INSERT OR IGNORE INTO menu_items (id, name, price, category, available, description, tags, badge, sort_order) VALUES
('m1', 'Cold Coffee', 110, 'milkshake', 1, 'Rich, chilled coffee blended with ice cream — creamy and refreshing.', '["Refreshing","Creamy"]', NULL, 1),
('m2', 'Kit Kat Shake', 110, 'milkshake', 1, 'Crushed Kit Kat blended with thick milkshake — crunchy indulgence.', '["Crunchy","Indulgent"]', NULL, 2),
('m3', 'Dairy Milk Shake', 110, 'milkshake', 1, 'Dairy Milk chocolate melted into a thick, creamy shake.', '["Chocolatey","Thick"]', NULL, 3),
('m4', 'Pet Pooja Special', 140, 'milkshake', 1, 'Our secret blend — a premium milkshake you won''t find anywhere else.', '["Chef Special","Premium"]', '⭐ Special', 4);
