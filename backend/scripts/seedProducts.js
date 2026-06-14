require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

const Category = require(path.join(__dirname, '..', 'models', 'Category'));
const Product  = require(path.join(__dirname, '..', 'models', 'Product'));

const CATEGORIES = [
  { name: 'Beverages', color: '#A16207' },
  { name: 'Snacks', color: '#B45309' },
  { name: 'Meals', color: '#92400E' },
  { name: 'Desserts', color: '#7C2D12' },
  { name: 'Bakery', color: '#78350F' },
  { name: 'Breakfast', color: '#B45309' },
];

const PRODUCTS = [
  { name: 'Coffee', category: 'Beverages', price: 120, unit: 'per piece', tax: 5, description: 'Freshly brewed espresso coffee.', image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=400&q=80' },
  { name: 'Latte', category: 'Beverages', price: 150, unit: 'per piece', tax: 5, description: 'Creamy latte with steamed milk.', image: 'https://images.unsplash.com/photo-1572441710570-6166419c4f7e?auto=format&fit=crop&w=400&q=80' },
  { name: 'Cappuccino', category: 'Beverages', price: 150, unit: 'per piece', tax: 5, description: 'Rich cappuccino with frothy foam.', image: 'https://images.unsplash.com/photo-1572441710570-6166419c4f7e?auto=format&fit=crop&w=400&q=80' },
  { name: 'Espresso', category: 'Beverages', price: 100, unit: 'per piece', tax: 5, description: 'Bold espresso shot.', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80' },
  { name: 'Mocha', category: 'Beverages', price: 155, unit: 'per piece', tax: 5, description: 'Chocolate flavored coffee drink.', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80' },
  { name: 'Tea', category: 'Beverages', price: 80, unit: 'per piece', tax: 5, description: 'Hot brewed tea.', image: 'https://images.unsplash.com/photo-1544785349-c4a5301826fd?auto=format&fit=crop&w=400&q=80' },
  { name: 'Chai', category: 'Beverages', price: 90, unit: 'per piece', tax: 5, description: 'Masala chai with spices.', image: 'https://images.unsplash.com/photo-1544785349-c4a5301826fd?auto=format&fit=crop&w=400&q=80' },
  { name: 'Green Tea', category: 'Beverages', price: 95, unit: 'per piece', tax: 5, description: 'Healthy green tea.', image: 'https://images.unsplash.com/photo-1544785349-c4a5301826fd?auto=format&fit=crop&w=400&q=80' },
  { name: 'Lemonade', category: 'Beverages', price: 90, unit: 'per piece', tax: 5, description: 'Refreshing lemonade.', image: 'https://images.unsplash.com/photo-1547954067-64f7cdd1a706?auto=format&fit=crop&w=400&q=80' },
  { name: 'Orange Juice', category: 'Beverages', price: 100, unit: 'per piece', tax: 5, description: 'Fresh orange juice.', image: 'https://images.unsplash.com/photo-1548095115-45697e2b0f24?auto=format&fit=crop&w=400&q=80' },
  { name: 'Fries', category: 'Snacks', price: 110, unit: 'per plate', tax: 5, description: 'Crispy french fries.', image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=400&q=80' },
  { name: 'Samosa', category: 'Snacks', price: 60, unit: 'per piece', tax: 5, description: 'Spiced potato samosa.', image: 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&w=400&q=80' },
  { name: 'Nachos', category: 'Snacks', price: 140, unit: 'per plate', tax: 5, description: 'Loaded nachos with cheese.', image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=400&q=80' },
  { name: 'Sandwich', category: 'Snacks', price: 120, unit: 'per piece', tax: 5, description: 'Grilled sandwich.', image: 'https://images.unsplash.com/photo-1528735622570-1c67f6f7bc2b?auto=format&fit=crop&w=400&q=80' },
  { name: 'Burger', category: 'Snacks', price: 180, unit: 'per piece', tax: 5, description: 'Juicy beef burger.', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80' },
  { name: 'Hot Dog', category: 'Snacks', price: 130, unit: 'per piece', tax: 5, description: 'Classic hot dog.', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=400&q=80' },
  { name: 'Nuggets', category: 'Snacks', price: 160, unit: 'per plate', tax: 5, description: 'Crispy chicken nuggets.', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=400&q=80' },
  { name: 'Pizza Slice', category: 'Snacks', price: 190, unit: 'per piece', tax: 5, description: 'Cheesy pizza slice.', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80' },
  { name: 'Onion Rings', category: 'Snacks', price: 120, unit: 'per plate', tax: 5, description: 'Crispy onion rings.', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=400&q=80' },
  { name: 'Spring Roll', category: 'Snacks', price: 110, unit: 'per plate', tax: 5, description: 'Vegetable spring rolls.', image: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?auto=format&fit=crop&w=400&q=80' },
  { name: 'Chicken Biryani', category: 'Meals', price: 250, unit: 'per plate', tax: 5, description: 'Spiced chicken biryani.', image: 'https://images.unsplash.com/photo-1645177628172-4f4cff02c72f?auto=format&fit=crop&w=400&q=80' },
  { name: 'Veg Biryani', category: 'Meals', price: 220, unit: 'per plate', tax: 5, description: 'Aromatic vegetable biryani.', image: 'https://images.unsplash.com/photo-1645177628172-4f4cff02c72f?auto=format&fit=crop&w=400&q=80' },
  { name: 'Butter Chicken', category: 'Meals', price: 260, unit: 'per plate', tax: 5, description: 'Creamy butter chicken.', image: 'https://images.unsplash.com/photo-1603894584373-5ac82a9e398?auto=format&fit=crop&w=400&q=80' },
  { name: 'Dal Makhani', category: 'Meals', price: 210, unit: 'per plate', tax: 5, description: 'Slow-cooked dal makhani.', image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=400&q=80' },
  { name: 'Paneer Tikka', category: 'Meals', price: 230, unit: 'per plate', tax: 5, description: 'Grilled paneer tikka.', image: 'https://images.unsplash.com/photo-1603894584373-5ac82a9e398?auto=format&fit=crop&w=400&q=80' },
  { name: 'Masala Dosa', category: 'Meals', price: 200, unit: 'per plate', tax: 5, description: 'Crispy masala dosa.', image: 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?auto=format&fit=crop&w=400&q=80' },
  { name: 'Naan Curry', category: 'Meals', price: 240, unit: 'per plate', tax: 5, description: 'Naan served with curry.', image: 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&w=400&q=80' },
  { name: 'Fish Curry', category: 'Meals', price: 270, unit: 'per plate', tax: 5, description: 'Spicy fish curry.', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&q=80' },
  { name: 'Prawn Masala', category: 'Meals', price: 280, unit: 'per plate', tax: 5, description: 'Prawns cooked in rich masala.', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&q=80' },
  { name: 'Chicken Tikka', category: 'Meals', price: 260, unit: 'per plate', tax: 5, description: 'Tender chicken tikka.', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=400&q=80' },
  { name: 'Chocolate Cake', category: 'Desserts', price: 180, unit: 'per piece', tax: 5, description: 'Decadent chocolate cake.', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80' },
  { name: 'Vanilla Cupcake', category: 'Desserts', price: 140, unit: 'per piece', tax: 5, description: 'Soft vanilla cupcake.', image: 'https://images.unsplash.com/photo-1560867725-0a966db73933?auto=format&fit=crop&w=400&q=80' },
  { name: 'Blueberry Muffin', category: 'Desserts', price: 150, unit: 'per piece', tax: 5, description: 'Fresh blueberry muffin.', image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=400&q=80' },
  { name: 'Croissant', category: 'Bakery', price: 120, unit: 'per piece', tax: 5, description: 'Flaky butter croissant.', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80' },
  { name: 'Donut', category: 'Bakery', price: 110, unit: 'per piece', tax: 5, description: 'Glazed donut.', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=400&q=80' },
  { name: 'Pancakes', category: 'Breakfast', price: 170, unit: 'per plate', tax: 5, description: 'Fluffy pancakes with syrup.', image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=400&q=80' },
  { name: 'Waffle', category: 'Breakfast', price: 180, unit: 'per plate', tax: 5, description: 'Crispy waffle.', image: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=400&q=80' },
  { name: 'Ice Cream Sundae', category: 'Desserts', price: 190, unit: 'per piece', tax: 5, description: 'Ice cream sundae with toppings.', image: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=400&q=80' },
  { name: 'Fruit Salad', category: 'Breakfast', price: 140, unit: 'per plate', tax: 5, description: 'Fresh seasonal fruit salad.', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80' },
  { name: 'Brownie', category: 'Desserts', price: 130, unit: 'per piece', tax: 5, description: 'Chocolate brownie.', image: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?auto=format&fit=crop&w=400&q=80' },
  { name: 'Caesar Salad', category: 'Meals', price: 190, unit: 'per plate', tax: 5, description: 'Classic caesar salad.', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=400&q=80' },
  { name: 'Tomato Soup', category: 'Meals', price: 140, unit: 'per plate', tax: 5, description: 'Warm tomato soup.', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=400&q=80' },
  { name: 'Grilled Sandwich', category: 'Snacks', price: 150, unit: 'per piece', tax: 5, description: 'Grilled vegetable sandwich.', image: 'https://images.unsplash.com/photo-1528735622570-1c67f6f7bc2b?auto=format&fit=crop&w=400&q=80' },
  { name: 'Club Sandwich', category: 'Snacks', price: 170, unit: 'per piece', tax: 5, description: 'Triple decker club sandwich.', image: 'https://images.unsplash.com/photo-1528735622570-1c67f6f7bc2b?auto=format&fit=crop&w=400&q=80' },
  { name: 'Veg Wrap', category: 'Snacks', price: 160, unit: 'per piece', tax: 5, description: 'Vegetable wrap.', image: 'https://images.unsplash.com/photo-1528735622570-1c67f6f7bc2b?auto=format&fit=crop&w=400&q=80' },
  { name: 'Pasta Alfredo', category: 'Meals', price: 210, unit: 'per plate', tax: 5, description: 'Creamy pasta alfredo.', image: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?auto=format&fit=crop&w=400&q=80' },
  { name: 'Spaghetti Bolognese', category: 'Meals', price: 220, unit: 'per plate', tax: 5, description: 'Spaghetti with meat sauce.', image: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?auto=format&fit=crop&w=400&q=80' },
  { name: 'Ramen Noodles', category: 'Meals', price: 230, unit: 'per plate', tax: 5, description: 'Savory ramen noodles.', image: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?auto=format&fit=crop&w=400&q=80' },
  { name: 'Sushi Roll', category: 'Meals', price: 260, unit: 'per plate', tax: 5, description: 'Sushi roll assortment.', image: 'https://images.unsplash.com/photo-1553621042-f6f4d4ab689f?auto=format&fit=crop&w=400&q=80' },
  { name: 'Tandoori Roti', category: 'Bakery', price: 50, unit: 'per piece', tax: 5, description: 'Tandoori roti.', image: 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&w=400&q=80' },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const categoryDocs = {};
  for (const category of CATEGORIES) {
    const found = await Category.findOneAndUpdate(
      { name: category.name },
      { $set: category },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    categoryDocs[category.name] = found._id;
  }

  let createdCount = 0;
  for (const product of PRODUCTS) {
    const exists = await Product.findOne({ name: product.name });
    if (exists) continue;

    const categoryId = categoryDocs[product.category];
    if (!categoryId) {
      console.warn(`Skipping product without category: ${product.name}`);
      continue;
    }

    await Product.create({
      name: product.name,
      category: categoryId,
      price: product.price,
      unit: product.unit,
      tax: product.tax,
      description: product.description,
      image: product.image,
    });
    createdCount += 1;
  }

  console.log(`Seed complete. Created ${createdCount} new product(s).`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  mongoose.disconnect().finally(() => process.exit(1));
});
