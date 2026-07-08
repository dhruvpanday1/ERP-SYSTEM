// ========================================
// WFX AI Explorer — Mock Data
// ========================================

// Real garment product images
const productImages = [
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1598032895397-b9472444bf93?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1564859228273-274232fdb516?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1622470953794-aa9c70b0fb9d?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1571455786673-9d9d6c194f90?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1539008835657-9e8e9680c44e?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1434389677669-e08b4cda3a5b?w=400&h=500&fit=crop',
];

export const finishedGoods = [
  { id: 1, styleNumber: 'WFX-1001', styleName: 'Classic Oxford Shirt', category: 'Shirts', fabric: '100% Cotton', gsm: 120, supplier: 'Orient Textiles', buyer: 'H&M', sellingPrice: 2099, color: 'White', print: 'Solid', season: 'SS25', image: productImages[0] },
  { id: 2, styleNumber: 'WFX-1002', styleName: 'Slim Fit Polo', category: 'T-Shirts', fabric: 'Cotton Pique', gsm: 180, supplier: 'Pacific Garments', buyer: 'Zara', sellingPrice: 1549, color: 'Navy', print: 'Solid', season: 'SS25', image: productImages[1] },
  { id: 3, styleNumber: 'WFX-1003', styleName: 'Relaxed Crew Tee', category: 'T-Shirts', fabric: 'Organic Cotton', gsm: 160, supplier: 'Green Stitch Ltd', buyer: 'Uniqlo', sellingPrice: 1099, color: 'Black', print: 'Solid', season: 'AW25', image: productImages[2] },
  { id: 4, styleNumber: 'WFX-1004', styleName: 'Heritage Henley', category: 'T-Shirts', fabric: 'Cotton Jersey', gsm: 200, supplier: 'Orient Textiles', buyer: 'Gap', sellingPrice: 1849, color: 'Olive', print: 'Solid', season: 'AW25', image: productImages[3] },
  { id: 5, styleNumber: 'WFX-1005', styleName: 'Vintage Wash Denim', category: 'Pants', fabric: 'Denim Twill', gsm: 340, supplier: 'Blue Ridge Mills', buyer: "Levi's", sellingPrice: 3799, color: 'Indigo', print: 'Solid', season: 'SS25', image: productImages[4] },
  { id: 6, styleNumber: 'WFX-1006', styleName: 'Tropical Print Aloha', category: 'Shirts', fabric: 'Rayon', gsm: 100, supplier: 'Pacific Garments', buyer: 'Tommy Bahama', sellingPrice: 2949, color: 'Multi', print: 'Floral', season: 'SS25', image: productImages[5] },
  { id: 7, styleNumber: 'WFX-1007', styleName: 'Performance Jogger', category: 'Pants', fabric: 'Poly-Spandex', gsm: 240, supplier: 'ActiveWear Co', buyer: 'Nike', sellingPrice: 3249, color: 'Charcoal', print: 'Solid', season: 'AW25', image: productImages[6] },
  { id: 8, styleNumber: 'WFX-1008', styleName: 'Linen Blend Blazer', category: 'Outerwear', fabric: 'Linen Blend', gsm: 180, supplier: 'Euro Fabrics', buyer: 'Massimo Dutti', sellingPrice: 7599, color: 'Beige', print: 'Solid', season: 'SS25', image: productImages[7] },
  { id: 9, styleNumber: 'WFX-1009', styleName: 'Graphic Print Hoodie', category: 'Outerwear', fabric: 'French Terry', gsm: 320, supplier: 'Green Stitch Ltd', buyer: 'H&M', sellingPrice: 2499, color: 'Grey', print: 'Graphic', season: 'AW25', image: productImages[8] },
  { id: 10, styleNumber: 'WFX-1010', styleName: 'Chino Shorts', category: 'Pants', fabric: 'Cotton Twill', gsm: 200, supplier: 'Orient Textiles', buyer: 'Gap', sellingPrice: 2299, color: 'Khaki', print: 'Solid', season: 'SS25', image: productImages[9] },
  { id: 11, styleNumber: 'WFX-1011', styleName: 'Striped Breton Tee', category: 'T-Shirts', fabric: 'Cotton Jersey', gsm: 160, supplier: 'Euro Fabrics', buyer: 'Zara', sellingPrice: 1699, color: 'Navy/White', print: 'Stripes', season: 'SS25', image: productImages[10] },
  { id: 12, styleNumber: 'WFX-1012', styleName: 'Puffer Vest', category: 'Outerwear', fabric: 'Nylon Ripstop', gsm: 80, supplier: 'ActiveWear Co', buyer: 'Uniqlo', sellingPrice: 4999, color: 'Black', print: 'Solid', season: 'AW25', image: productImages[11] },
  { id: 13, styleNumber: 'WFX-1013', styleName: 'Chambray Work Shirt', category: 'Shirts', fabric: 'Chambray', gsm: 140, supplier: 'Blue Ridge Mills', buyer: 'J.Crew', sellingPrice: 2699, color: 'Light Blue', print: 'Solid', season: 'SS25', image: productImages[12] },
  { id: 14, styleNumber: 'WFX-1014', styleName: 'Floral Maxi Dress', category: 'Dresses', fabric: 'Viscose', gsm: 120, supplier: 'Pacific Garments', buyer: 'H&M', sellingPrice: 3599, color: 'Multi', print: 'Floral', season: 'SS25', image: productImages[13] },
  { id: 15, styleNumber: 'WFX-1015', styleName: 'Cargo Utility Pant', category: 'Pants', fabric: 'Cotton Canvas', gsm: 280, supplier: 'Orient Textiles', buyer: 'Gap', sellingPrice: 4199, color: 'Army Green', print: 'Solid', season: 'AW25', image: productImages[14] },
  { id: 16, styleNumber: 'WFX-1016', styleName: 'Knit Beanie', category: 'Accessories', fabric: 'Acrylic Knit', gsm: 200, supplier: 'Green Stitch Ltd', buyer: 'Uniqlo', sellingPrice: 1249, color: 'Burgundy', print: 'Solid', season: 'AW25', image: productImages[15] },
  { id: 17, styleNumber: 'WFX-1017', styleName: 'Athletic Tank Top', category: 'T-Shirts', fabric: 'Mesh Polyester', gsm: 100, supplier: 'ActiveWear Co', buyer: 'Nike', sellingPrice: 1849, color: 'White', print: 'Solid', season: 'SS25', image: productImages[16] },
  { id: 18, styleNumber: 'WFX-1018', styleName: 'Wool Overcoat', category: 'Outerwear', fabric: 'Wool Blend', gsm: 400, supplier: 'Euro Fabrics', buyer: 'Massimo Dutti', sellingPrice: 10999, color: 'Camel', print: 'Solid', season: 'AW25', image: productImages[17] },
  { id: 19, styleNumber: 'WFX-1019', styleName: 'Tie-Dye Sweatshirt', category: 'T-Shirts', fabric: 'Fleece Cotton', gsm: 280, supplier: 'Pacific Garments', buyer: 'Zara', sellingPrice: 2949, color: 'Multi', print: 'Tie-Dye', season: 'SS25', image: productImages[18] },
  { id: 20, styleNumber: 'WFX-1020', styleName: 'Paisley Silk Scarf', category: 'Accessories', fabric: 'Silk Twill', gsm: 60, supplier: 'Euro Fabrics', buyer: 'Massimo Dutti', sellingPrice: 4599, color: 'Burgundy', print: 'Paisley', season: 'AW25', image: productImages[19] },
];

// ========================================
// Dashboard Stats
// ========================================
export const dashboardStats = {
  totalFinishedGoods: 1247,
  totalSuppliers: 86,
  totalBuyers: 34,
  totalOrders: 528,
  totalRevenue: 23847650,
};

// ========================================
// Chart Data — Monthly Order Trends
// ========================================
export const orderTrendsData = [
  { month: 'Jan', orders: 42, revenue: 1890000 },
  { month: 'Feb', orders: 38, revenue: 1710000 },
  { month: 'Mar', orders: 55, revenue: 2475000 },
  { month: 'Apr', orders: 47, revenue: 2115000 },
  { month: 'May', orders: 62, revenue: 2790000 },
  { month: 'Jun', orders: 58, revenue: 2610000 },
  { month: 'Jul', orders: 71, revenue: 3195000 },
  { month: 'Aug', orders: 65, revenue: 2925000 },
  { month: 'Sep', orders: 53, revenue: 2385000 },
  { month: 'Oct', orders: 48, revenue: 2160000 },
  { month: 'Nov', orders: 44, revenue: 1980000 },
  { month: 'Dec', orders: 39, revenue: 1755000 },
];

// ========================================
// Chart Data — Revenue by Category
// ========================================
export const revenueByCategoryData = [
  { category: 'Shirts', revenue: 4850000, fill: '#8b5cf6' },
  { category: 'T-Shirts', revenue: 6200000, fill: '#f43f5e' },
  { category: 'Pants', revenue: 5100000, fill: '#0ea5e9' },
  { category: 'Outerwear', revenue: 7200000, fill: '#f59e0b' },
  { category: 'Dresses', revenue: 3400000, fill: '#10b981' },
  { category: 'Accessories', revenue: 1726500, fill: '#ec4899' },
];

// ========================================
// Recent Orders
// ========================================
export const recentOrders = [
  { id: 'ORD-2401', buyer: 'H&M', items: 12, total: 382000, status: 'In Production', date: '2025-06-28' },
  { id: 'ORD-2402', buyer: 'Zara', items: 8, total: 276000, status: 'Shipped', date: '2025-06-27' },
  { id: 'ORD-2403', buyer: 'Uniqlo', items: 15, total: 495000, status: 'Pending', date: '2025-06-26' },
  { id: 'ORD-2404', buyer: 'Gap', items: 6, total: 182000, status: 'Delivered', date: '2025-06-25' },
  { id: 'ORD-2405', buyer: 'Nike', items: 20, total: 658000, status: 'In Production', date: '2025-06-24' },
  { id: 'ORD-2406', buyer: 'Massimo Dutti', items: 4, total: 567000, status: 'Quality Check', date: '2025-06-23' },
];

// ========================================
// Filter Options
// ========================================
export const filterOptions = {
  categories: ['All', 'Shirts', 'T-Shirts', 'Pants', 'Outerwear', 'Dresses', 'Accessories'],
  fabrics: ['All', '100% Cotton', 'Cotton Pique', 'Organic Cotton', 'Cotton Jersey', 'Denim Twill', 'Rayon', 'Poly-Spandex', 'Linen Blend', 'French Terry', 'Cotton Twill', 'Nylon Ripstop', 'Chambray', 'Viscose', 'Cotton Canvas', 'Acrylic Knit', 'Mesh Polyester', 'Wool Blend', 'Fleece Cotton', 'Silk Twill'],
  gsm: ['All', '60-100', '100-160', '160-200', '200-280', '280-400'],
  suppliers: ['All', 'Orient Textiles', 'Pacific Garments', 'Green Stitch Ltd', 'Blue Ridge Mills', 'ActiveWear Co', 'Euro Fabrics'],
  buyers: ['All', 'H&M', 'Zara', 'Uniqlo', 'Gap', 'Nike', 'Massimo Dutti', 'Tommy Bahama', "Levi's", 'J.Crew'],
  prints: ['All', 'Solid', 'Floral', 'Stripes', 'Graphic', 'Tie-Dye', 'Paisley'],
  colors: ['All', 'White', 'Black', 'Navy', 'Olive', 'Indigo', 'Multi', 'Charcoal', 'Beige', 'Grey', 'Khaki', 'Light Blue', 'Army Green', 'Burgundy', 'Camel'],
  seasons: ['All', 'SS25', 'AW25'],
};

// ========================================
// NL Query — Sample Conversations
// ========================================
export const sampleConversations = [
  {
    id: 1,
    query: "Show me all cotton shirts with GSM above 120 from Orient Textiles",
    sqlQuery: `SELECT style_number, style_name, fabric, gsm, supplier, selling_price
FROM finished_goods
WHERE fabric LIKE '%Cotton%'
  AND category = 'Shirts'
  AND gsm > 120
  AND supplier = 'Orient Textiles'
ORDER BY gsm DESC;`,
    answer: "Found 2 cotton shirts from Orient Textiles with GSM above 120:",
    results: [
      { style_number: 'WFX-1001', style_name: 'Classic Oxford Shirt', fabric: '100% Cotton', gsm: 120, supplier: 'Orient Textiles', selling_price: '₹2,099' },
      { style_number: 'WFX-1013', style_name: 'Chambray Work Shirt', fabric: 'Chambray', gsm: 140, supplier: 'Blue Ridge Mills', selling_price: '₹2,699' },
    ]
  },
  {
    id: 2,
    query: "What is the total revenue from H&M orders in the last quarter?",
    sqlQuery: `SELECT buyer, SUM(total_amount) as total_revenue, COUNT(*) as order_count
FROM orders
WHERE buyer = 'H&M'
  AND order_date >= '2025-04-01'
  AND order_date <= '2025-06-30'
GROUP BY buyer;`,
    answer: "H&M generated ₹44,12,800 in revenue across 18 orders in Q2 2025:",
    results: [
      { buyer: 'H&M', total_revenue: '₹44,12,800', order_count: 18, avg_order_value: '₹2,45,156', top_category: 'T-Shirts' },
    ]
  },
  {
    id: 3,
    query: "Which suppliers have the most orders this year?",
    sqlQuery: `SELECT s.name as supplier, COUNT(o.id) as order_count, SUM(o.total_amount) as total_revenue
FROM suppliers s
JOIN orders o ON s.id = o.supplier_id
WHERE o.order_date >= '2025-01-01'
GROUP BY s.name
ORDER BY order_count DESC
LIMIT 5;`,
    answer: "Here are the top 5 suppliers by order count in 2025:",
    results: [
      { supplier: 'Orient Textiles', order_count: 87, total_revenue: '₹1,04,58,000' },
      { supplier: 'Pacific Garments', order_count: 72, total_revenue: '₹83,26,500' },
      { supplier: 'Euro Fabrics', order_count: 65, total_revenue: '₹94,42,000' },
      { supplier: 'Green Stitch Ltd', order_count: 58, total_revenue: '₹62,57,300' },
      { supplier: 'ActiveWear Co', order_count: 51, total_revenue: '₹75,48,200' },
    ]
  },
];

// ========================================
// Suggested Queries
// ========================================
export const suggestedQueries = [
  "Show top 5 selling styles this quarter",
  "What is the average GSM across all T-Shirts?",
  "List all suppliers from last season",
  "Revenue breakdown by buyer for AW25",
  "Which products have GSM above 300?",
  "Show pending orders with delivery dates",
];

// ========================================
// Activity Feed
// ========================================
export const activityFeed = [
  { id: 1, action: 'New order placed', detail: 'ORD-2407 from Zara — 14 items', time: '2 min ago', type: 'order' },
  { id: 2, action: 'Quality check passed', detail: 'WFX-1008 Linen Blend Blazer', time: '15 min ago', type: 'quality' },
  { id: 3, action: 'Shipment dispatched', detail: 'ORD-2399 to H&M — 22 items', time: '1 hour ago', type: 'shipping' },
  { id: 4, action: 'New product added', detail: 'WFX-1021 Summer Linen Pant', time: '3 hours ago', type: 'product' },
  { id: 5, action: 'Supplier onboarded', detail: 'Skyline Fabrics — Denim specialist', time: '5 hours ago', type: 'supplier' },
  { id: 6, action: 'Price updated', detail: 'WFX-1005 Vintage Wash Denim — ₹3,799 → ₹3,499', time: '6 hours ago', type: 'price' },
];
