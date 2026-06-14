const UNSPLASH_CURATED = [
  { keys: ['sprite','7up','lemon soda','lime soda'], id: 'photo-1625772299848-391b6a87d7b3' },
  { keys: ['cola','pepsi','coke','cold drink'], id: 'photo-1554866585-cd94860890b7' },
  { keys: ['soda','soft drink','fizzy'], id: 'photo-1581006852262-e4307cf6283a' },
  { keys: ['juice','orange juice','mango juice'], id: 'photo-1600271886742-f049cd451bba' },
  { keys: ['lassi','buttermilk'], id: 'photo-1571091718767-18b5b1457add' },
  { keys: ['smoothie','shake','milkshake'], id: 'photo-1553361371-9b22f78e8b1f' },
  { keys: ['water','mineral water'], id: 'photo-1548839144-01a186f31002' },
  { keys: ['coffee','cafe','espresso','latte','cappuccino','mocha'], id: 'photo-1511920170033-f8396924c348' },
  { keys: ['tea','chai'], id: 'photo-1544785349-c4a5301826fd' },
  { keys: ['pizza','pizza slice'], id: 'photo-1513104890138-7c749659a591' },
  { keys: ['burger','hamburger'], id: 'photo-1568901346375-23c9450c58cd' },
  { keys: ['sandwich','wrap'], id: 'photo-1528735622570-1c67f6f7bc2b' },
  { keys: ['fries','chips','onion rings'], id: 'photo-1576107232686-12bd0c7b6dfc' },
  { keys: ['samosa'], id: 'photo-1596560548464-f010549b84d7' },
  { keys: ['biryani','biriyani'], id: 'photo-1645177628172-4f4cff02c72f' },
  { keys: ['butter chicken','murgh','chicken tikka'], id: 'photo-1603894584373-5ac82a9e398' },
  { keys: ['dal makhani','dal'], id: 'photo-1612929633738-8fe44f7ec841' },
  { keys: ['paneer tikka'], id: 'photo-1603894584373-5ac82a9e398' },
  { keys: ['masala dosa','dosa'], id: 'photo-1591814468924-caf88d1232e1' },
  { keys: ['naan','roti','chapati'], id: 'photo-1596560548464-f010549b84d7' },
  { keys: ['rice','fried rice','pulao'], id: 'photo-1516684732162-798a0062be99' },
  { keys: ['pasta','spaghetti','ramen','noodle'], id: 'photo-1555949258-eb67b1ef0ceb' },
  { keys: ['cake','dessert'], id: 'photo-1578985545062-69928b1d9587' },
  { keys: ['cupcake','muffin','donut'], id: 'photo-1499636136210-6f4ee915583e' },
  { keys: ['croissant','bread'], id: 'photo-1509440159596-0249088772ff' },
  { keys: ['waffle','pancake'], id: 'photo-1567620905732-2d1ec7ab7445' },
  { keys: ['ice cream','kulfi','sundae'], id: 'photo-1501443762994-82bd5dace89a' },
  { keys: ['salad'], id: 'photo-1546069901-ba9599a7e63c' },
  { keys: ['soup','broth'], id: 'photo-1547592180-85f173990554' },
  { keys: ['steak','beef'], id: 'photo-1544025162-d766942659857' },
  { keys: ['fish','seafood','prawn'], id: 'photo-1519708227418-c8fd9a32b7a2' },
  { keys: ['egg','omelette'], id: 'photo-1525351484163-7529414344d8' },
  { keys: ['milk','dairy','shake'], id: 'photo-1550583724-b2692b85b150' },
];

const WORD_BLACKLIST = /\b(per|piece|plate|kg|kilogram|g|gram|litre|liter|dozen|cup|glass|bowl|slice|half|full|pcs|pc)\b/gi;

function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(WORD_BLACKLIST, '')
    .replace(/[^a-z0-9 ]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getUnsplashUrl(text) {
  const normalized = normalizeText(text);
  if (!normalized) return null;
  for (const { keys, id } of UNSPLASH_CURATED) {
    if (keys.some((k) => normalized.includes(k))) {
      return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=400&q=80`;
    }
  }
  return null;
}

function getFallbackImage(name, category) {
  const normalizedName = normalizeText(name);
  const normalizedCategory = normalizeText(category);
  const query = [normalizedName, normalizedCategory, 'food']
    .filter(Boolean)
    .join(',');
  return `https://source.unsplash.com/400x400/?${encodeURIComponent(query)}`;
}

export function getProductImage(name, category, image) {
  if (typeof image === 'string' && image.trim()) return image;
  const curated = getUnsplashUrl(name) || getUnsplashUrl(category);
  return curated || getFallbackImage(name, category);
}
