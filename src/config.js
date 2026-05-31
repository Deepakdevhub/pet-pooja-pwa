/**
 * ═══════════════════════════════════════════════════════════
 * PET POOJA FASTFOOD — White-Label Configuration
 * ═══════════════════════════════════════════════════════════
 * Change THIS FILE to rebrand for a new client.
 * Everything shop-specific lives here.
 */

export const CONFIG = {
  /* ── Shop Identity ─────────────────────────────── */
  shop: {
    name: 'Pet Pooja',
    tagline: 'Fastfood',
    fullName: 'Pet Pooja Fastfood',
    description: 'फोन लगाओ.. घर पर मंगाओ..',
    descriptionEn: 'Call us, get it delivered at home!',
    heroTitle: 'Fresh • Fast • Flavourful',
    heroSubtitle: 'Made with love, served with speed. Premium ingredients, wood-fired taste, every single time.',
    currency: '₹',
    currencyCode: 'INR',
  },

  /* ── Contact ───────────────────────────────────── */
  contacts: {
    whatsapp: '918112287006',
    owners: [
      { name: 'Sunil', phone: '6367014872' },
      { name: 'Mukesh', phone: '8290779656' },
    ],
    address: 'Pet Pooja Fastfood, Your City',
    mapUrl: 'https://maps.google.com/?q=Pet+Pooja+Fastfood',
  },

  /* ── API ─────────────────────────────────────────── */
  apiBase: '/api',   // Pages Functions — same domain, no CORS

  /* ── Store Hours ────────────────────────────────── */
  storeHours: {
    open: 10,   // 10 AM
    close: 22,  // 10 PM
    timezone: 'Asia/Kolkata',
  },

  /* ── UPI Payment ────────────────────────────────── */
  upi: {
    id: '8112287006@upi',       // Owner UPI ID
    name: 'Pet Pooja Fastfood',
    enabled: true,
  },

  /* ── Order Modes ───────────────────────────────── */
  orderModes: [
    { id: 'online', label: 'Online', icon: '📱', active: true },
    { id: 'onsite', label: 'Onsite', icon: '🏪', active: true },
    { id: 'deliver', label: 'Deliver', icon: '🛵', active: false, comingSoon: true },
  ],

  /* ── Categories ────────────────────────────────── */
  categories: [
    { id: 'pizza', name: 'Pizza', icon: '🍕', color: '#E53935' },
    { id: 'burger', name: 'Burger', icon: '🍔', color: '#FB8C00' },
    { id: 'grill', name: 'Grill', icon: '🥪', color: '#43A047' },
    { id: 'sandwich', name: 'Sandwich', icon: '🥙', color: '#1E88E5' },
    { id: 'toast', name: 'Toast', icon: '🍞', color: '#8D6E63' },
    { id: 'milkshake', name: 'Milk Shake', icon: '🥤', color: '#AB47BC' },
  ],

  /* ── Default Menu (from actual menu card) ──────── */
  defaultMenu: [
    // ── PIZZA ──
    { id: 'p1', name: 'Vegi. Cheese Pizza', price: 120, category: 'pizza', available: true, desc: 'Loaded with fresh veggies and gooey mozzarella cheese on a crispy base.', tags: ['Bestseller', 'Cheesy'] },
    { id: 'p2', name: 'Tandoori Cheese Pizza', price: 120, category: 'pizza', available: true, desc: 'Smoky tandoori flavour with melted cheese and spiced toppings.', tags: ['Spicy', 'Smoky'] },
    { id: 'p3', name: 'Plain Cheese Pizza', price: 120, category: 'pizza', available: true, desc: 'Simple, classic — just golden crust smothered in rich mozzarella.', tags: ['Classic', 'Cheesy'] },
    { id: 'p4', name: 'Onion Cheese Pizza', price: 120, category: 'pizza', available: true, desc: 'Crunchy caramelized onion rings layered with melted cheese.', tags: ['Crunchy', 'Cheesy'] },
    { id: 'p5', name: 'Chilli Cheese Pizza', price: 120, category: 'pizza', available: true, desc: 'Fiery green chillies with stretchy cheese for the spice lovers.', tags: ['Spicy', 'Hot'] },
    { id: 'p6', name: 'Corniza Pizza', price: 130, category: 'pizza', available: true, desc: 'Sweet golden corn kernels on a bed of creamy cheese sauce.', tags: ['Sweet', 'Cheesy'] },
    { id: 'p7', name: 'Schezwan Cheese Pizza', price: 130, category: 'pizza', available: true, desc: 'Bold schezwan sauce with cheese — Indo-Chinese fusion at its best.', tags: ['Fusion', 'Spicy'] },
    { id: 'p8', name: 'Spinach Corn Pizza', price: 140, category: 'pizza', available: true, desc: 'Healthy spinach and sweet corn with a cheesy twist. Feel-good pizza.', tags: ['Healthy', 'Fresh'] },
    { id: 'p9', name: 'Paneer Cheese Pizza', price: 170, category: 'pizza', available: true, desc: 'Soft paneer cubes with double cheese on a perfectly baked base.', tags: ['Premium', 'Cheesy'] },
    { id: 'p10', name: 'Pet Pooja Special Pizza', price: 180, category: 'pizza', available: true, badge: '⭐ Special', desc: 'Our signature loaded pizza — chef\'s secret recipe with premium toppings.', tags: ['Chef Special', 'Premium'] },

    // ── BURGER ──
    { id: 'b1', name: 'Veg. Burger', price: 40, category: 'burger', available: true, desc: 'Crispy aloo tikki patty in a soft bun with fresh lettuce.', tags: ['Classic', 'Value'] },
    { id: 'b2', name: 'Cheese Burger', price: 40, category: 'burger', available: true, desc: 'Juicy patty topped with a thick slice of melted cheese.', tags: ['Cheesy', 'Popular'] },
    { id: 'b3', name: 'Veg. Cheese Burger', price: 50, category: 'burger', available: true, desc: 'Veggie patty loaded with cheese, lettuce and tangy sauce.', tags: ['Cheesy', 'Loaded'] },
    { id: 'b4', name: 'Mayo Burger', price: 50, category: 'burger', available: true, desc: 'Creamy mayo drizzle on a crispy patty — smooth and satisfying.', tags: ['Creamy', 'Smooth'] },
    { id: 'b5', name: 'Masala Burger', price: 50, category: 'burger', available: true, desc: 'Desi spiced patty with chatpata masala — a flavour explosion.', tags: ['Spicy', 'Desi'] },

    // ── GRILL ──
    { id: 'g1', name: 'Vegi. Grill', price: 80, category: 'grill', available: true, desc: 'Grilled veggies pressed between toasted bread with butter.', tags: ['Light', 'Healthy'] },
    { id: 'g2', name: 'Vegi. Mayo Grill', price: 110, category: 'grill', available: true, desc: 'Garden veggies with creamy mayo, perfectly grilled and toasted.', tags: ['Creamy', 'Fresh'] },
    { id: 'g3', name: 'Vegi. Cheese Grill', price: 110, category: 'grill', available: true, desc: 'Fresh veggies with melted cheese in a hot-pressed grill.', tags: ['Cheesy', 'Bestseller'] },
    { id: 'g4', name: 'Plain Cheese Grill', price: 110, category: 'grill', available: true, desc: 'Pure melted cheese grilled between golden buttery bread.', tags: ['Classic', 'Cheesy'] },
    { id: 'g5', name: 'Tandoori Cheese Grill', price: 110, category: 'grill', available: true, desc: 'Tandoori masala with stretchy cheese — smoky and bold.', tags: ['Smoky', 'Spicy'] },
    { id: 'g6', name: 'Schezwan Cheese Grill', price: 110, category: 'grill', available: true, desc: 'Fiery schezwan sauce meets gooey cheese in a crunchy grill.', tags: ['Fusion', 'Hot'] },
    { id: 'g7', name: 'Masala Cheese Grill', price: 110, category: 'grill', available: true, desc: 'Spiced masala filling with cheese — desi flavour, grill perfection.', tags: ['Desi', 'Spicy'] },
    { id: 'g8', name: 'Club Cheese Grill', price: 110, category: 'grill', available: true, desc: 'Triple-layered club-style grill with cheese in every bite.', tags: ['Loaded', 'Premium'] },
    { id: 'g9', name: 'Corn Cheese Grill', price: 110, category: 'grill', available: true, desc: 'Sweet corn and melted cheese — a crowd favourite combo.', tags: ['Sweet', 'Popular'] },
    { id: 'g10', name: 'Tandoori Cheese Paneer Grill', price: 130, category: 'grill', available: true, desc: 'Tandoori paneer chunks with double cheese, grilled to perfection.', tags: ['Premium', 'Paneer'] },
    { id: 'g11', name: 'Pet Pooja Special Grill', price: 170, category: 'grill', available: true, badge: '⭐ Special', desc: 'Our house special grill — secret sauce, loaded toppings, unforgettable taste.', tags: ['Chef Special', 'Loaded'] },

    // ── SANDWICH ──
    { id: 's1', name: 'Pottetowich', price: 30, category: 'sandwich', available: true, desc: 'Crispy potato slices in fresh bread — simple, quick, delicious.', tags: ['Value', 'Quick'] },
    { id: 's2', name: 'Bread Butter Sandwich', price: 40, category: 'sandwich', available: true, desc: 'Classic buttered bread with a light, satisfying crunch.', tags: ['Classic', 'Light'] },
    { id: 's3', name: 'Veg. Sandwich', price: 40, category: 'sandwich', available: true, desc: 'Fresh veggies layered with chutney in soft bread slices.', tags: ['Fresh', 'Healthy'] },
    { id: 's4', name: 'Veg. Mayo Sandwich', price: 60, category: 'sandwich', available: true, desc: 'Garden veggies with creamy mayo spread — smooth and fresh.', tags: ['Creamy', 'Fresh'] },
    { id: 's5', name: 'Veg. Cheese Sandwich', price: 60, category: 'sandwich', available: true, desc: 'Loaded veggie sandwich with melted cheese on every layer.', tags: ['Cheesy', 'Loaded'] },
    { id: 's6', name: 'Plain Cheese Sandwich', price: 60, category: 'sandwich', available: true, desc: 'Simple cheese-filled sandwich — melty, buttery, classic.', tags: ['Classic', 'Cheesy'] },

    // ── TOAST ──
    { id: 't1', name: 'Butter Toast', price: 40, category: 'toast', available: true, desc: 'Golden crispy toast with a generous layer of fresh butter.', tags: ['Classic', 'Quick'] },
    { id: 't2', name: 'Masala Toast', price: 50, category: 'toast', available: true, desc: 'Spiced masala filling in crunchy toasted bread — chatpata!', tags: ['Spicy', 'Desi'] },
    { id: 't3', name: 'Masala Cheese Toast', price: 60, category: 'toast', available: true, desc: 'Masala spice meets melted cheese in a perfectly toasted bite.', tags: ['Spicy', 'Cheesy'] },
    { id: 't4', name: 'Chilli Cheese Toast', price: 60, category: 'toast', available: true, desc: 'Green chillies and cheese toasted until bubbly and golden.', tags: ['Hot', 'Cheesy'] },
    { id: 't5', name: 'Tandoori Toast', price: 70, category: 'toast', available: true, desc: 'Smoky tandoori flavour baked into crispy toast perfection.', tags: ['Smoky', 'Bold'] },
    { id: 't6', name: 'Spinach Corn Toast', price: 70, category: 'toast', available: true, desc: 'Nutritious spinach and sweet corn on crunchy golden toast.', tags: ['Healthy', 'Fresh'] },
    { id: 't7', name: 'Schezwan Toast', price: 70, category: 'toast', available: true, desc: 'Bold schezwan sauce on crispy toast — spicy and addictive.', tags: ['Fusion', 'Spicy'] },
    { id: 't8', name: 'Veg. Mayo Toast', price: 80, category: 'toast', available: true, desc: 'Fresh veggies with creamy mayo toasted to golden perfection.', tags: ['Creamy', 'Fresh'] },

    // ── MILK SHAKE ──
    { id: 'm1', name: 'Cold Coffee', price: 110, category: 'milkshake', available: true, desc: 'Rich, chilled coffee blended with ice cream — creamy and refreshing.', tags: ['Refreshing', 'Creamy'] },
    { id: 'm2', name: 'Kit Kat Shake', price: 110, category: 'milkshake', available: true, desc: 'Crushed Kit Kat blended with thick milkshake — crunchy indulgence.', tags: ['Crunchy', 'Indulgent'] },
    { id: 'm3', name: 'Dairy Milk Shake', price: 110, category: 'milkshake', available: true, desc: 'Dairy Milk chocolate melted into a thick, creamy shake.', tags: ['Chocolatey', 'Thick'] },
    { id: 'm4', name: 'Pet Pooja Special', price: 140, category: 'milkshake', available: true, badge: '⭐ Special', desc: 'Our secret blend — a premium milkshake you won\'t find anywhere else.', tags: ['Chef Special', 'Premium'] },
  ],

  /* ── Extras (add-ons at verify step) ───────────── */
  extras: [
    { id: 'x1', name: 'Extra Cheese', price: 30, icon: '🧀' },
    { id: 'x2', name: 'Oregano Seasoning', price: 10, icon: '🌿' },
    { id: 'x3', name: 'Red Chilli Flakes', price: 10, icon: '🌶️' },
    { id: 'x4', name: 'Extra Mayo', price: 20, icon: '🫙' },
    { id: 'x5', name: 'Cutlery Set', price: 0, icon: '🍴', isToggle: true },
  ],

  /* ── Suggested Items (shown in cart) ────────────── */
  suggestedIds: ['m1', 'm2', 'p10', 'g11', 's1', 't1'],

  /* ── PWA ────────────────────────────────────────── */
  pwa: {
    themeColor: '#FF6B35',
    bgColor: '#FFF8F0',
  },

  /* ── Category Emoji Map (for food images) ──────── */
  categoryEmojis: {
    pizza: '🍕',
    burger: '🍔',
    grill: '🥪',
    sandwich: '🥙',
    toast: '🍞',
    milkshake: '🥤',
  },
};

// ── Auto-Assign Category Images ──
CONFIG.defaultMenu.forEach(item => {
  if (!item.img) {
    item.img = `/images/${item.category}.png`;
  }
});

/**
 * Get category config by ID
 */
export function getCategory(id) {
  return CONFIG.categories.find(c => c.id === id);
}

/**
 * Get menu items by category
 */
export function getMenuByCategory(categoryId) {
  return CONFIG.defaultMenu.filter(item => item.category === categoryId && item.available);
}

/**
 * Get single menu item by ID
 */
export function getMenuItem(id) {
  return CONFIG.defaultMenu.find(item => item.id === id);
}

/**
 * Format price with currency
 */
export function formatPrice(amount) {
  return `${CONFIG.shop.currency}${amount}`;
}
