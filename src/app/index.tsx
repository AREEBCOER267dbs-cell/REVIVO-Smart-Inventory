
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  G,
  Rect,
  Text as SvgText,
} from 'react-native-svg';

type Product = {
  id: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  expiry: string;
  risk: 'High' | 'Medium' | 'Low';
};

type Order = {
  id: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  total: number;
  date: string;
  timestamp?: number;
  status: 'Pending' | 'Completed';
};

const STORAGE_KEY = 'REVIVO_PRODUCTS';
const initialProducts: Product[] = [
  { id: '1', name: 'Organic Rice', category: 'Grocery', stock: 12, price: 120, expiry: '30/12/2026', risk: 'High' },
  { id: '2', name: 'Cotton T-Shirt', category: 'Fashion', stock: 35, price: 499, expiry: '', risk: 'Low' },
  { id: '3', name: 'Fresh Juice', category: 'Beverages', stock: 8, price: 80, expiry: '15/11/2026', risk: 'High' },
  { id: '4', name: 'Wheat Flour', category: 'Grocery', stock: 24, price: 65, expiry: '20/12/2026', risk: 'Medium' },
];
function calculateProductRisk(product: Product): 'High' | 'Medium' | 'Low' {
  // Check expiry date first
  if (product.expiry.trim()) {
    const parts = product.expiry.split('/');

    if (parts.length === 3) {
      const day = Number(parts[0]);
      const month = Number(parts[1]);
      const year = Number(parts[2]);

      const expiryDate = new Date(year, month - 1, day);
      const today = new Date();

      today.setHours(0, 0, 0, 0);
      expiryDate.setHours(0, 0, 0, 0);

      // Reject invalid calendar dates
      if (
        expiryDate.getFullYear() !== year ||
        expiryDate.getMonth() !== month - 1 ||
        expiryDate.getDate() !== day
      ) {
        return 'High';
      }

      const daysLeft = Math.ceil(
        (expiryDate.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
      );

      if (daysLeft <= 7) return 'High';
      if (daysLeft <= 30) return 'Medium';
    }
  }

  // Check remaining quantity
  if (product.stock <= 10) return 'High';
  if (product.stock <= 25) return 'Medium';

  return 'Low';
}
function getSuggestedDiscount(product: Product): number {
  const risk = calculateProductRisk(product);

  if (risk === 'High') return 20;
  if (risk === 'Medium') return 10;

  return 0;
}

function getDiscountedPrice(product: Product): number {
  const discount = getSuggestedDiscount(product);

  return Math.round(
    product.price * (1 - discount / 100)
  );
}
export default function HomeScreen() {
 const [screen, setScreen] = useState<
  'home' | 'merchant' | 'addProduct' | 'customer'
>('home');

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [cart, setCart] = useState<{ productId: string; quantity: number }[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoaded, setOrdersLoaded] = useState(false);

useEffect(() => {
  async function loadOrders() {
    try {
      const savedOrders = await AsyncStorage.getItem('REVIVO_ORDERS');

      if (savedOrders !== null) {
        setOrders(JSON.parse(savedOrders));
      }
    } catch (error) {
      console.log('Error loading orders:', error);
    } finally {
      setOrdersLoaded(true);
    }
  }

  loadOrders();
}, []);
  const [showCart, setShowCart] = useState(false);
  const [isProductsLoaded, setIsProductsLoaded] = useState(false);

// Load saved products when the app opens
useEffect(() => {
  async function loadProducts() {
    try {
      const savedProducts = await AsyncStorage.getItem(STORAGE_KEY);

      if (savedProducts !== null) {
        setProducts(JSON.parse(savedProducts));
      }
    } catch (error) {
      console.log('Error loading products:', error);
    } finally {
      setIsProductsLoaded(true);
    }
  }

  loadProducts();
}, []);

// Save products whenever inventory changes
useEffect(() => {
  async function saveProducts() {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(products)
      );
    } catch (error) {
      console.log('Error saving products:', error);
    }
  }

  if (isProductsLoaded) {
    saveProducts();
  }
}, [products, isProductsLoaded]);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
const [searchText, setSearchText] = useState('');
const [selectedCategory, setSelectedCategory] = useState('All');
const [selectedRisk, setSelectedRisk] = useState('All');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expiry, setExpiry] = useState('');

  
const totalRevenue = orders.reduce(
  (total, order) => total + order.total,
  0
);

// DAILY AND MONTHLY SALES ANALYTICS

const now = new Date();

const startOfToday = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate()
).getTime();

const startOfTomorrow = startOfToday + 24 * 60 * 60 * 1000;

const startOfMonth = new Date(
  now.getFullYear(),
  now.getMonth(),
  1
).getTime();

function getOrderTimestamp(order: Order): number {
  // Use the exact timestamp for new orders
  if (order.timestamp) {
    return order.timestamp;
  }

  // Support older orders saved before timestamps were added
  const datePart = order.date.split(',')[0];
  const parts = datePart.split('/').map(Number);

  if (parts.length !== 3 || parts.some(part => !Number.isFinite(part))) {
    return 0;
  }

  const [day, month, year] = parts;
  const parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return 0;
  }

  return parsedDate.getTime();
}

const todayOrders = orders.filter(order => {
  const time = getOrderTimestamp(order);
  return time >= startOfToday && time < startOfTomorrow;
});

const monthlyOrders = orders.filter(order => {
  const time = getOrderTimestamp(order);
  return time >= startOfMonth && time < startOfTomorrow;
});

const todayRevenue = todayOrders.reduce(
  (total, order) => total + order.total,
  0
);

const monthlyRevenue = monthlyOrders.reduce(
  (total, order) => total + order.total,
  0
);

const todayOrderCount = todayOrders.length;
const monthlyOrderCount = monthlyOrders.length;


const totalOrders = orders.length;

const completedOrders = orders.filter(
  order => order.status === 'Completed'
).length;
const pendingOrders = orders.filter(
  order => order.status === 'Pending'
).length;

const averageOrderValue =
  totalOrders > 0
    ? Math.round(totalRevenue / totalOrders)
    : 0;

const totalUnitsSold = orders.reduce(
  (total, order) =>
    total +
    order.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    ),
  0
);

const productSales = products.map(product => {
  const soldItems = orders.flatMap(order =>
    order.items.filter(
      item => item.productId === product.id
    )
  );

  const quantitySold = soldItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const revenue = soldItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return {
    id: product.id,
    name: product.name,
    quantitySold,
    revenue,
  };
}).sort((a, b) => b.quantitySold - a.quantitySold);


  const inventoryValue = products.reduce(
    (total, product) => total + product.price * product.stock,
    0
  );
 
 
 const cartProducts = cart
  .map(item => {
    const product = products.find(
      product => product.id === item.productId
    );

    return product
      ? {
          ...product,
          price: getDiscountedPrice(product),
          cartQuantity: item.quantity,
        }
      : null;
  })
  .filter(item => item !== null);

const cartTotal = cartProducts.reduce(
  (total, item) => total + item.price * item.cartQuantity,
  0
);

const cartItemCount = cart.reduce(
  (total, item) => total + item.quantity,
  0
);

 const atRiskProducts = products.filter(
  product => calculateProductRisk(product) === 'High'
).length;
const categories = [
  'All',
  ...Array.from(new Set(products.map(product => product.category))),
];

const filteredProducts = products.filter(product => {
  const matchesSearch = product.name
    .toLowerCase()
    .includes(searchText.toLowerCase());

  const matchesCategory =
    selectedCategory === 'All' ||
    product.category === selectedCategory;

  const matchesRisk =
    selectedRisk === 'All' ||
    product.risk === selectedRisk;

  return matchesSearch && matchesCategory && matchesRisk;
});
function addToCart(product: Product) {
  if (product.stock <= 0) {
    Alert.alert('Out of Stock', 'This product is currently unavailable.');
    return;
  }

  setCart(current => {
    const existingItem = current.find(
      item => item.productId === product.id
    );

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        Alert.alert('Stock Limit', 'No more stock is available.');
        return current;
      }

      return current.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    }

    return [...current, { productId: product.id, quantity: 1 }];
  });

  Alert.alert('Added to Cart', `${product.name} added successfully!`);
}
function increaseCartQuantity(product: Product) {
  setCart(current =>
    current.map(item => {
      if (item.productId !== product.id) return item;

      if (item.quantity >= product.stock) {
        Alert.alert('Stock Limit', 'No more stock is available.');
        return item;
      }

      return { ...item, quantity: item.quantity + 1 };
    })
  );
}

function decreaseCartQuantity(productId: string) {
  setCart(current =>
    current
      .map(item =>
        item.productId === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
      .filter(item => item.quantity > 0)
  );
}

function removeFromCart(productId: string) {
  setCart(current =>
    current.filter(item => item.productId !== productId)
  );
}
  
async function placeOrder() {
  if (cart.length === 0) {
    Alert.alert('Empty Cart', 'Please add products before checkout.');
    return;
  }

  const orderItems: Order['items'] = [];

  for (const item of cart) {
    const product = products.find(
      product => product.id === item.productId
    );

    if (!product || product.stock < item.quantity) {
      Alert.alert(
        'Stock Unavailable',
        `${product?.name ?? 'A product'} does not have enough stock.`
      );
      return;
    }

    orderItems.push({
      productId: product.id,
      name: product.name,
      price: getDiscountedPrice(product),
      quantity: item.quantity,
    });
  }

  const newOrder: Order = {
    id: `REV-${Date.now()}`,
    items: orderItems,
    total: orderItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    ),
    date: new Date().toLocaleString('en-IN'),
    timestamp: Date.now(),
    status: 'Pending',
  };

  const updatedProducts = products.map(product => {
    const orderedItem = orderItems.find(
      item => item.productId === product.id
    );

    return orderedItem
      ? { ...product, stock: product.stock - orderedItem.quantity }
      : product;
  });

  const updatedOrders = [newOrder, ...orders];

  try {
    await AsyncStorage.multiSet([
      [STORAGE_KEY, JSON.stringify(updatedProducts)],
      ['REVIVO_ORDERS', JSON.stringify(updatedOrders)],
    ]);

    setProducts(updatedProducts);
    setOrders(updatedOrders);
    setCart([]);
    setShowCart(false);

    Alert.alert(
      'Order Placed Successfully! 🎉',
      `Order ID: ${newOrder.id}\nTotal: ₹${newOrder.total}`
    );
  } catch (error) {
    Alert.alert('Error', 'Could not save your order. Please try again.');
    console.log('Order saving error:', error);
  }
}
async function updateOrderStatus(orderId: string) {
  const updatedOrders = orders.map(order =>
    order.id === orderId
      ? { ...order, status: 'Completed' as const }
      : order
  );

  try {
    await AsyncStorage.setItem(
      'REVIVO_ORDERS',
      JSON.stringify(updatedOrders)
    );

    setOrders(updatedOrders);

    Alert.alert(
      'Order Updated',
      'Order marked as Completed!'
    );
  } catch (error) {
    Alert.alert('Error', 'Could not update order status.');
  }
}
function resetForm() {
    setName('');
    setCategory('');
    setPrice('');
    setQuantity('');
    setExpiry('');
  }
function openEditForm(product: Product) {
  setEditingProductId(product.id);
  setName(product.name);
  setCategory(product.category);
  setPrice(product.price.toString());
  setQuantity(product.stock.toString());
  setExpiry(product.expiry);
  setScreen('addProduct');
}

function deleteProduct(product: Product) {
  Alert.alert(
    'Delete Product',
    `Are you sure you want to delete ${product.name}?`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setProducts(current =>
            current.filter(item => item.id !== product.id)
          );
          Alert.alert('Deleted', `${product.name} has been removed.`);
        },
      },
    ]
  );
}
  function saveProduct() {
    const cleanName = name.trim();
    const cleanCategory = category.trim();
    const productPrice = Number(price);
    const productQuantity = Number(quantity);

    if (!cleanName || !cleanCategory || !price.trim() || !quantity.trim()) {
      Alert.alert('Missing Information', 'Please fill in product name, category, price and quantity.');
      return;
    }

    if (
      !Number.isFinite(productPrice) ||
      !Number.isInteger(productPrice) ||
      productPrice <= 0
    ) {
      Alert.alert('Invalid Price', 'Please enter a valid positive whole-number price.');
      return;
    }

    if (
      !Number.isFinite(productQuantity) ||
      !Number.isInteger(productQuantity) ||
      productQuantity <= 0
    ) {
      Alert.alert('Invalid Quantity', 'Please enter a valid positive whole-number quantity.');
      return;
    }

    if (expiry.trim() && !/^\d{2}\/\d{2}\/\d{4}$/.test(expiry.trim())) {
      Alert.alert('Invalid Expiry Date', 'Use DD/MM/YYYY format, or leave it blank.');
      return;
    }

   const newProduct: Product = {
  id: editingProductId ?? Date.now().toString(),
  name: cleanName,
  category: cleanCategory,
  price: productPrice,
  stock: productQuantity,
  expiry: expiry.trim(),
  risk: productQuantity <= 10
    ? 'High'
    : productQuantity <= 25
      ? 'Medium'
      : 'Low',
};

if (editingProductId) {
  setProducts(current =>
    current.map(product =>
      product.id === editingProductId ? newProduct : product
    )
  );
} else {
  setProducts(current => [...current, newProduct]);
}

const wasEditing = editingProductId !== null;

resetForm();
setEditingProductId(null);
setScreen('merchant');

Alert.alert(
  'Success!',
  wasEditing
    ? `${cleanName} has been updated.`
    : `${cleanName} has been added to your inventory.`
);
  }

  // ADD PRODUCT SCREEN
  if (screen === 'addProduct') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F8F1" />

        <ScrollView contentContainerStyle={styles.formContainer}>
          <Pressable onPress={() => setScreen('merchant')}>
            <Text style={styles.backText}>← Back to Dashboard</Text>
          </Pressable>

          <Text style={styles.formTitle}>
  {editingProductId ? 'Edit Product ✏️' : 'Add New Product 📦'}
</Text>
          <Text style={styles.formSubtitle}>
            Enter your product details below.
          </Text>

          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Organic Rice"
            placeholderTextColor="#9AA69C"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Category *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Grocery, Fashion, Electronics"
            placeholderTextColor="#9AA69C"
            value={category}
            onChangeText={setCategory}
          />

          <Text style={styles.label}>Price (₹) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter product price"
            placeholderTextColor="#9AA69C"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Quantity *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter available quantity"
            placeholderTextColor="#9AA69C"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Expiry Date (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="DD/MM/YYYY"
            placeholderTextColor="#9AA69C"
            value={expiry}
            onChangeText={setExpiry}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />

          <Text style={styles.helper}>
            * Required fields. Leave expiry blank if not applicable.
          </Text>

          <Pressable style={styles.saveButton} onPress={saveProduct}>
            <Text style={styles.saveButtonText}>
  {editingProductId ? '✓ Update Product' : '＋ Save Product'}
</Text>
          </Pressable>

          <Pressable style={styles.cancelButton} onPress={() => {
            resetForm();
            setScreen('merchant');
          }}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // MERCHANT DASHBOARD
  if (screen === 'merchant') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F8F1" />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.smallLabel}>WELCOME BACK</Text>
              <Text style={styles.dashboardTitle}>Merchant Dashboard</Text>
              <Text style={styles.muted}>Manage your business smarter.</Text>
            </View>
            <Text style={styles.headerIcon}>♻</Text>
          </View>

          <Text style={styles.sectionTitle}>BUSINESS OVERVIEW</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>📦</Text>
              <Text style={styles.statNumber}>{products.length}</Text>
              <Text style={styles.statLabel}>Total Products</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>💰</Text>
              <Text style={styles.statNumber}>
                ₹{inventoryValue.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.statLabel}>Inventory Value</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🛒</Text>
              <Text style={styles.statNumber}>
  ₹{totalRevenue.toLocaleString('en-IN')}
</Text>
<Text style={styles.statLabel}>Total Revenue</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>⚠️</Text>
              <Text style={styles.statNumber}>{atRiskProducts}</Text>
              <Text style={styles.statLabel}>At-Risk Products</Text>
            </View>
                      <View style={styles.statCard}>
              <Text style={styles.statIcon}>📋</Text>
              <Text style={styles.statNumber}>{totalOrders}</Text>
              <Text style={styles.statLabel}>Total Orders</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>✅</Text>
              <Text style={styles.statNumber}>{completedOrders}</Text>
              <Text style={styles.statLabel}>Completed Orders</Text>
            </View>
          </View>
          <View style={styles.alertCard}>
            
  {/* SALES ANALYTICS */}
  <View style={styles.discountCard}>
    <Text style={styles.discountTitle}>
      📊 Sales Analytics
    </Text>

    <Text style={styles.discountDescription}>
      Your business performance based on saved orders.
    </Text>

    <View style={styles.statsGrid}>
      <View style={styles.statCard}>
        <Text style={styles.statIcon}>⏳</Text>
        <Text style={styles.statNumber}>{pendingOrders}</Text>
        <Text style={styles.statLabel}>Pending Orders</Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statIcon}>💵</Text>
        <Text style={styles.statNumber}>
          ₹{averageOrderValue.toLocaleString('en-IN')}
        </Text>
        <Text style={styles.statLabel}>Average Order Value</Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statIcon}>📦</Text>
        <Text style={styles.statNumber}>{totalUnitsSold}</Text>
        <Text style={styles.statLabel}>Units Sold</Text>
      </View>
    </View>
    <View style={styles.statsGrid}>
  <View style={styles.statCard}>
    <Text style={styles.statIcon}>📅</Text>
    <Text style={styles.statNumber}>
      ₹{todayRevenue.toLocaleString('en-IN')}
    </Text>
    <Text style={styles.statLabel}>Today's Revenue</Text>
  </View>

  <View style={styles.statCard}>
    <Text style={styles.statIcon}>📆</Text>
    <Text style={styles.statNumber}>
      ₹{monthlyRevenue.toLocaleString('en-IN')}
    </Text>
    <Text style={styles.statLabel}>Monthly Revenue</Text>
  </View>

  <View style={styles.statCard}>
    <Text style={styles.statIcon}>🛒</Text>
    <Text style={styles.statNumber}>{todayOrderCount}</Text>
    <Text style={styles.statLabel}>Today's Orders</Text>
  </View>

  <View style={styles.statCard}>
    <Text style={styles.statIcon}>📦</Text>
    <Text style={styles.statNumber}>{monthlyOrderCount}</Text>
    <Text style={styles.statLabel}>Monthly Orders</Text>
  </View>
</View>
  <View style={{ marginTop: 20 }}>
    <Text style={styles.discountTitle}>
      🏆 Best-Selling Products
    </Text>

  {/* REVENUE BY PRODUCT CHART */}
  <View style={{ marginTop: 24 }}>
    <Text style={styles.discountTitle}>
      📊 Revenue by Product
    </Text>

    <Text style={styles.discountDescription}>
      Revenue generated by each product.
    </Text>

    <Svg
      width="100%"
      height={230}
      viewBox="0 0 320 230"
    >
      {productSales.slice(0, 5).map((item, index) => {
        const maxRevenue = Math.max(
          ...productSales.map(p => p.revenue),
          1
        );

        const barHeight =
          (item.revenue / maxRevenue) * 135;

        const x = 18 + index * 62;
        const y = 165 - barHeight;

        return (
          <G key={item.id}>
            <Rect
              x={x}
              y={y}
              width={38}
              height={Math.max(barHeight, 2)}
              rx={5}
              fill="#39845B"
            />

            <SvgText
              x={x + 19}
              y={y - 7}
              fontSize="9"
              fill="#174D36"
              textAnchor="middle"
            >
              ₹{item.revenue}
            </SvgText>

            <SvgText
              x={x + 19}
              y={183}
              fontSize="8"
              fill="#526D5A"
              textAnchor="middle"
            >
              {item.name.substring(0, 8)}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  </View>

    {productSales.length === 0 ? (
      <Text style={styles.discountDescription}>
        No product data available.
      </Text>
    ) : (
      productSales.map((item, index) => (
        <View
          key={item.id}
          style={{
            backgroundColor: '#FFFFFF',
            padding: 14,
            borderRadius: 12,
            marginTop: 10,
          }}
        >
          <Text style={styles.productName}>
            {index + 1}. {item.name}
          </Text>

          <Text style={styles.productStock}>
            Quantity Sold: {item.quantitySold} units
          </Text>

          <Text style={styles.productPrice}>
            Revenue: ₹{item.revenue.toLocaleString('en-IN')}
          </Text>

          {item.quantitySold === 0 && (
            <Text style={styles.productCategory}>
              No sales yet
            </Text>
          )}
        </View>
      ))
    )}
  </View>

  </View>

            <Text style={styles.alertTitle}>⚠️ Dead Stock Alert</Text>
            <Text style={styles.alertDescription}>
              {atRiskProducts} products have high stock risk based on our current demo rules.
            </Text>
            <Text style={styles.alertSmall}>
              Detailed sales and expiry analysis will be added later.
            </Text>
          </View>

  {/* MERCHANT ORDERS */}
  <View style={styles.discountCard}>
    <Text style={styles.discountTitle}>
      📦 Customer Orders ({orders.length})
    </Text>

    {!ordersLoaded ? (
      <Text style={styles.discountDescription}>
        Loading orders...
      </Text>
    ) : orders.length === 0 ? (
      <Text style={styles.discountDescription}>
        No customer orders yet.
      </Text>
    ) : (
      orders.map(order => (
        <View
          key={order.id}
          style={{
            backgroundColor: '#FFFFFF',
            padding: 14,
            borderRadius: 12,
            marginTop: 12,
          }}
        >
          <Text style={styles.productName}>
            {order.id}
          </Text>

          <Text style={styles.productCategory}>
            {order.date}
          </Text>

          {order.items.map(item => (
            <Text
              key={item.productId}
              style={styles.productStock}
            >
              {item.name} × {item.quantity} — ₹
              {item.price * item.quantity}
            </Text>
          ))}

          <Text style={styles.productPrice}>
            Total: ₹{order.total.toLocaleString('en-IN')}
          </Text>

          <Text style={styles.productCategory}>
            Status: {order.status}
          </Text>
          {order.status === 'Pending' && (
  <Pressable
    style={styles.addButton}
    onPress={() => updateOrderStatus(order.id)}
  >
    <Text style={styles.addButtonText}>
      ✓ Mark as Completed
    </Text>
  </Pressable>
)}
        </View>
      ))
    )}
  </View>


        
  {/* SMART DISCOUNT RECOMMENDATIONS */}
  <View style={styles.discountCard}>
    <Text style={styles.discountTitle}>
      💡 Smart Discount Recommendations
    </Text>

    <Text style={styles.discountDescription}>
      Suggested discounts based on product stock risk.
    </Text>

    {products.filter(
      product => getSuggestedDiscount(product) > 0 && product.stock > 0
    ).length === 0 ? (
      <Text style={styles.discountDescription}>
        No discount recommendations right now.
      </Text>
    ) : (
      products
        .filter(
          product => getSuggestedDiscount(product) > 0 && product.stock > 0
        )
        .map(product => (
          <View
            key={product.id}
            style={{
              backgroundColor: '#FFFFFF',
              padding: 14,
              borderRadius: 12,
              marginTop: 12,
            }}
          >
            <Text style={styles.productName}>
              {product.name}
            </Text>

            <Text style={styles.productCategory}>
              {calculateProductRisk(product)} Risk
            </Text>

            <Text style={styles.productStock}>
              Original Price: ₹{product.price}
            </Text>

            <Text style={styles.productPrice}>
              Suggested Discount: {getSuggestedDiscount(product)}%
            </Text>

            <Text style={{
              fontSize: 18,
              fontWeight: '900',
              color: '#267044',
              marginTop: 5,
            }}>
              Suggested Price: ₹{getDiscountedPrice(product)}
            </Text>
          </View>
        ))
    )}
  </View>
 
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>INVENTORY ({products.length})</Text>
          </View>
{/* SEARCH PRODUCTS */}
<TextInput
  style={styles.searchInput}
  placeholder="🔍 Search products by name..."
  placeholderTextColor="#87958A"
  value={searchText}
  onChangeText={setSearchText}
/>

{/* CATEGORY FILTER */}
<Text style={styles.filterTitle}>FILTER BY CATEGORY</Text>

<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.filterRow}
>
  {categories.map(item => (
    <Pressable
      key={item}
      style={[
        styles.filterChip,
        selectedCategory === item && styles.activeFilterChip,
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <Text
        style={[
          styles.filterChipText,
          selectedCategory === item && styles.activeFilterText,
        ]}
      >
        {item}
      </Text>
    </Pressable>
  ))}
</ScrollView>

{/* RISK FILTER */}
<Text style={styles.filterTitle}>FILTER BY RISK</Text>

<View style={styles.filterRow}>
  {['All', 'High', 'Medium', 'Low'].map(item => (
    <Pressable
      key={item}
      style={[
        styles.filterChip,
        selectedRisk === item && styles.activeFilterChip,
      ]}
      onPress={() => setSelectedRisk(item)}
    >
      <Text
        style={[
          styles.filterChipText,
          selectedRisk === item && styles.activeFilterText,
        ]}
      >
        {item}
      </Text>
    </Pressable>
  ))}
</View>

<Text style={styles.resultCount}>
  Showing {filteredProducts.length} of {products.length} products
</Text>
          {filteredProducts.length === 0 ? (
  <Text style={styles.emptyMessage}>
    No products found. Try changing your search or filters.
  </Text>
) : null}

{filteredProducts.map(product => (
           <View key={product.id} style={styles.productCard}>
  <View style={styles.productMainRow}>
    <View style={styles.productInfo}>
      <Text style={styles.productName}>{product.name}</Text>
      <Text style={styles.productCategory}>{product.category}</Text>
      <Text style={styles.productStock}>
        Stock: {product.stock} units
      </Text>

      {product.expiry ? (
        <Text style={styles.productExpiry}>
          Expiry: {product.expiry}
        </Text>
      ) : null}
    </View>

    <View style={styles.productRight}>
     <View style={{ alignItems: 'flex-end' }}>
  {getSuggestedDiscount(product) > 0 ? (
    <>
      <Text
        style={{
          color: '#87958A',
          textDecorationLine: 'line-through',
          fontSize: 12,
        }}
      >
        ₹{product.price}
      </Text>

      <Text style={styles.productPrice}>
        ₹{getDiscountedPrice(product)}
      </Text>

      <Text style={{
        color: '#267044',
        fontSize: 11,
        fontWeight: '800',
      }}>
        {getSuggestedDiscount(product)}% OFF
      </Text>
    </>
  ) : (
    <Text style={styles.productPrice}>
      ₹{product.price}
    </Text>
  )}
</View>

      <Text style={[
        styles.riskBadge,
       calculateProductRisk(product) === 'High' ? styles.highRisk :
calculateProductRisk(product) === 'Medium' ? styles.mediumRisk : styles.lowRisk,
        
      ]}>
        {calculateProductRisk(product)} Risk
      </Text>
    </View>
  </View>

  <View style={styles.productActions}>
    <Pressable
      style={styles.editButton}
      onPress={() => openEditForm(product)}
    >
      <Text style={styles.editButtonText}>✏️ Edit</Text>
    </Pressable>

    <Pressable
      style={styles.deleteButton}
      onPress={() => deleteProduct(product)}
    >
      <Text style={styles.deleteButtonText}>🗑 Delete</Text>
    </Pressable>
  </View>
</View>
          ))}

          <View style={styles.discountCard}>
            <Text style={styles.discountTitle}>💡 Smart Discount Suggestion</Text>
            <Text style={styles.discountDescription}>
              Reduce prices on slow-moving products to recover value and prevent waste.
            </Text>
            <Text style={styles.discountLink}>Explore Suggestions →</Text>
          </View>

          <Pressable
            style={styles.addButton}
            onPress={() => setScreen('addProduct')}
          >
            <Text style={styles.addButtonText}>＋ Add New Product</Text>
          </Pressable>

          <Pressable style={styles.backButton} onPress={() => setScreen('home')}>
            <Text style={styles.backText}>← Back to Home</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  
  // SHOPPING CART SCREEN
  if (screen === 'customer' && showCart) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F8F1" />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Pressable onPress={() => setShowCart(false)}>
            <Text style={styles.backText}>← Continue Shopping</Text>
          </Pressable>

          <Text style={styles.dashboardTitle}>My Shopping Cart 🛒</Text>

          <Text style={styles.muted}>
            {cartItemCount} items in your cart
          </Text>

          {cartProducts.length === 0 ? (
            <Text style={styles.emptyMessage}>
              Your cart is empty. Start shopping!
            </Text>
          ) : null}

          {cartProducts.map(item => (
            <View key={item.id} style={styles.productCard}>
              <Text style={styles.productName}>{item.name}</Text>

              <Text style={styles.productCategory}>
                {item.category}
              </Text>

              <Text style={styles.productPrice}>
                ₹{item.price} × {item.cartQuantity} = ₹
                {item.price * item.cartQuantity}
              </Text>

              <View style={styles.productActions}>
                <Pressable
                  style={styles.editButton}
                  onPress={() => decreaseCartQuantity(item.id)}
                >
                  <Text style={styles.editButtonText}>−</Text>
                </Pressable>

                <Text style={styles.productName}>
                  {item.cartQuantity}
                </Text>

                <Pressable
                  style={styles.editButton}
                  onPress={() => increaseCartQuantity(item)}
                >
                  <Text style={styles.editButtonText}>＋</Text>
                </Pressable>

                <Pressable
                  style={styles.deleteButton}
                  onPress={() => removeFromCart(item.id)}
                >
                  <Text style={styles.deleteButtonText}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ))}

          {cartProducts.length > 0 ? (
            <View style={styles.discountCard}>
              <Text style={styles.discountTitle}>Order Summary</Text>

              <Text style={styles.discountDescription}>
                Total Items: {cartItemCount}
              </Text>

              <Text style={styles.dashboardTitle}>
                Total: ₹{cartTotal.toLocaleString('en-IN')}
              </Text>

              <Pressable
                style={styles.addButton}
                onPress={placeOrder}
              >
                <Text style={styles.addButtonText}>
                  Proceed to Checkout →
                </Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // CUSTOMER STOREFRONT
  if (screen === 'customer') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F8F1" />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.smallLabel}>WELCOME TO REVIVO</Text>
              <Text style={styles.dashboardTitle}>Discover Products</Text>
              <Text style={styles.muted}>
                Great products. Better prices. Less waste.
              </Text>
            </View>
            <Text style={styles.headerIcon}>🛍️</Text>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Search products..."
            placeholderTextColor="#87958A"
            value={searchText}
            onChangeText={setSearchText}
          />

          <Pressable
  style={styles.addButton}
  onPress={() => setShowCart(true)}
>
  <Text style={styles.addButtonText}>
    🛒 View Cart ({cartItemCount}) — ₹{cartTotal}
  </Text>
</Pressable>
          <Text style={styles.sectionTitle}>
            AVAILABLE PRODUCTS ({products.length})
          </Text>

          {products.filter(product =>
            product.name.toLowerCase().includes(searchText.toLowerCase()) &&
            product.stock > 0
          ).length === 0 ? (
            <Text style={styles.emptyMessage}>
              No products available right now.
            </Text>
          ) : null}

          {products
            .filter(product =>
              product.name.toLowerCase().includes(searchText.toLowerCase()) &&
              product.stock > 0
            )
            .map(product => (
              <View key={product.id} style={styles.productCard}>
                <View style={styles.productMainRow}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productCategory}>
                      {product.category}
                    </Text>
                    <Text style={styles.productStock}>
                      {product.stock} units available
                    </Text>
                  </View>
</View>
  <View style={styles.productRight}>
    {getSuggestedDiscount(product) > 0 ? (
      <>
        <Text style={{
          fontSize: 12,
          color: '#87958A',
          textDecorationLine: 'line-through',
        }}>
          ₹{product.price}
        </Text>

        <Text style={styles.productPrice}>
          ₹{getDiscountedPrice(product)}
        </Text>

        <Text style={{
          color: '#267044',
          fontSize: 12,
          fontWeight: '800',
        }}>
          {getSuggestedDiscount(product)}% OFF
        </Text>
      </>
    ) : (
      <Text style={styles.productPrice}>
        ₹{product.price}
      </Text>
    )}

    <Text style={styles.lowRisk}>
      Available
    </Text>

    <Pressable
      style={styles.editButton}
      onPress={() => addToCart(product)}
    >
      <Text style={styles.editButtonText}>
        ＋ Add to Cart
      </Text>
    </Pressable>
  </View>

            </View>
          ))}


  {/* CUSTOMER ORDER HISTORY */}
  <View style={styles.discountCard}>
    <Text style={styles.discountTitle}>
      📦 My Orders ({orders.length})
    </Text>

    {!ordersLoaded ? (
      <Text style={styles.discountDescription}>
        Loading your orders...
      </Text>
    ) : orders.length === 0 ? (
      <Text style={styles.discountDescription}>
        You haven't placed any orders yet.
      </Text>
    ) : (
      orders.map(order => (
        <View
          key={order.id}
          style={{
            backgroundColor: '#FFFFFF',
            padding: 14,
            borderRadius: 12,
            marginTop: 12,
          }}
        >
          <Text style={styles.productName}>
            {order.id}
          </Text>

          <Text style={styles.productCategory}>
            {order.date}
          </Text>

          {order.items.map(item => (
            <Text
              key={item.productId}
              style={styles.productStock}
            >
              {item.name} × {item.quantity}
            </Text>
          ))}

          <Text style={styles.productPrice}>
            Total: ₹{order.total.toLocaleString('en-IN')}
          </Text>

          <Text style={styles.productCategory}>
            Status: {order.status}
          </Text>
        </View>
      ))
    )}
  </View>

          <Pressable
            style={styles.backButton}
            onPress={() => setScreen('home')}
          >
            <Text style={styles.backText}>← Back to Home</Text>
          </Pressable>
        </ScrollView>
        
      </SafeAreaView>
    );
  }

  // WELCOME SCREEN
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F8F1" />

      <ScrollView contentContainerStyle={styles.homeContent}>
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>♻</Text>
        </View>

        <Text style={styles.brandName}>REVIVO</Text>
        <Text style={styles.tagline}>Stop dead stock before it dies.</Text>

        <View style={styles.hero}>
          <Text style={styles.heading}>
            Give your stock{' \n'}
            <Text style={styles.greenText}>a second life.</Text>
          </Text>

          <Text style={styles.description}>
            Smart inventory management that helps businesses reduce waste,
            recover value and sell smarter.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>
          HOW WOULD YOU LIKE TO CONTINUE?
        </Text>

        <Pressable
          style={styles.merchantButton}
          onPress={() => setScreen('merchant')}
        >
          <View>
            <Text style={styles.buttonTitle}>Continue as Merchant</Text>
            <Text style={styles.buttonSubtitle}>
              Manage inventory and reduce dead stock
            </Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </Pressable>

        <Pressable
          style={styles.customerButton}
          onPress={() => setScreen('customer')}
        >
          <View>
            <Text style={styles.customerTitle}>Continue as Customer</Text>
            <Text style={styles.customerSubtitle}>
              Discover products at better prices
            </Text>
          </View>
          <Text style={styles.customerArrow}>→</Text>
        </Pressable>

        <Text style={styles.footerText}>
          LESS WASTE. MORE VALUE. A BETTER FUTURE.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F8F1' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  homeContent: { padding: 25, paddingBottom: 40 },
  formContainer: { padding: 24, paddingBottom: 40 },
  logoBox: {
    width: 65, height: 65, borderRadius: 20,
    backgroundColor: '#174D36', alignItems: 'center',
    justifyContent: 'center', alignSelf: 'center',
  },
  logoIcon: { fontSize: 38, color: '#FFFFFF' },
  brandName: {
    fontSize: 30, fontWeight: '900', color: '#174D36',
    textAlign: 'center', letterSpacing: 5, marginTop: 12,
  },
  tagline: { fontSize: 13, color: '#718477', textAlign: 'center', marginTop: 5 },
  hero: { marginTop: 48, marginBottom: 38 },
  heading: { fontSize: 36, lineHeight: 44, fontWeight: '800', color: '#183A2B' },
  greenText: { color: '#39845B' },
  description: { fontSize: 15, lineHeight: 24, color: '#718078', marginTop: 15 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#718477', letterSpacing: 1 },
  merchantButton: {
    backgroundColor: '#174D36', padding: 20, borderRadius: 18,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: 16, marginBottom: 14,
  },
  buttonTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  buttonSubtitle: { fontSize: 12, color: '#D2E6D8', marginTop: 6 },
  arrow: { fontSize: 28, color: '#FFFFFF' },
  customerButton: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE7DC',
    padding: 20, borderRadius: 18, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  customerTitle: { fontSize: 17, fontWeight: '700', color: '#174D36' },
  customerSubtitle: { fontSize: 12, color: '#718078', marginTop: 6 },
  customerArrow: { fontSize: 28, color: '#39845B' },
  footerText: {
    fontSize: 9, fontWeight: '800', color: '#39845B',
    letterSpacing: 1, textAlign: 'center', marginTop: 35,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 25,
  },
  smallLabel: { fontSize: 10, fontWeight: '800', color: '#39845B', letterSpacing: 2 },
  dashboardTitle: { fontSize: 24, fontWeight: '900', color: '#174D36', marginTop: 7 },
  muted: { color: '#718078', fontSize: 13, marginTop: 5 },
  headerIcon: { fontSize: 35, color: '#174D36' },
  sectionHeader: { marginBottom: 14, marginTop: 5 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14, marginBottom: 22 },
  statCard: {
    width: '48%', flexGrow: 1, backgroundColor: '#FFFFFF',
    padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#E5EDE3',
  },
  statIcon: { fontSize: 22 },
  statNumber: { fontSize: 21, fontWeight: '900', color: '#174D36', marginTop: 12 },
  statLabel: { fontSize: 12, color: '#718078', marginTop: 5 },
  alertCard: { backgroundColor: '#FFF2E8', padding: 18, borderRadius: 17, marginBottom: 25 },
  alertTitle: { fontSize: 16, fontWeight: '800', color: '#85451E' },
  alertDescription: { color: '#805C47', fontSize: 13, lineHeight: 20, marginTop: 10 },
  alertSmall: { color: '#9B765F', fontSize: 11, marginTop: 8 },
 productCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 14,
  padding: 15,
  marginBottom: 10,
  borderWidth: 1,
  borderColor: '#E5EDE3',
},
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '800', color: '#183A2B' },
  productCategory: { fontSize: 11, color: '#8A978D', marginTop: 4 },
  productStock: { fontSize: 12, color: '#718078', marginTop: 7 },
  productExpiry: { fontSize: 11, color: '#8A6A43', marginTop: 5 },
  productRight: { alignItems: 'flex-end' },
  productPrice: { fontSize: 15, fontWeight: '800', color: '#174D36' },
  riskBadge: { fontSize: 10, fontWeight: '800', padding: 6, borderRadius: 7, marginTop: 7, overflow: 'hidden' },
  highRisk: { backgroundColor: '#FCE4E0', color: '#B33D2E' },
  mediumRisk: { backgroundColor: '#FFF1D6', color: '#96630A' },
  lowRisk: { backgroundColor: '#E1F2E4', color: '#267044' },
  discountCard: { backgroundColor: '#E5F1E5', padding: 18, borderRadius: 16, marginTop: 18 },
  discountTitle: { fontSize: 15, fontWeight: '800', color: '#174D36' },
  discountDescription: { fontSize: 12, lineHeight: 19, color: '#526D5A', marginTop: 9 },
  discountLink: { fontSize: 12, fontWeight: '800', color: '#267044', marginTop: 13 },
  addButton: {
    backgroundColor: '#174D36', borderRadius: 14,
    padding: 17, alignItems: 'center', marginTop: 20,
  },
  addButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  backButton: { padding: 15, alignItems: 'center', marginTop: 8 },
  backText: { color: '#39845B', fontWeight: '700', fontSize: 13 },
  formTitle: { fontSize: 27, fontWeight: '900', color: '#174D36', marginTop: 28 },
  formSubtitle: { fontSize: 14, color: '#718078', marginTop: 8, marginBottom: 25 },
  label: { fontSize: 14, fontWeight: '700', color: '#244A35', marginBottom: 8, marginTop: 17 },
  input: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE7DC',
    borderRadius: 12, paddingHorizontal: 15, paddingVertical: 14,
    fontSize: 15, color: '#183A2B',
  },
  helper: { fontSize: 11, color: '#87958A', marginTop: 14 },
  saveButton: {
    backgroundColor: '#174D36', borderRadius: 14,
    padding: 17, alignItems: 'center', marginTop: 25,
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  cancelButton: { padding: 15, alignItems: 'center', marginTop: 5 },
  cancelText: { color: '#718078', fontSize: 14, fontWeight: '700' },
  productMainRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},

productActions: {
  flexDirection: 'row',
  gap: 10,
  marginTop: 14,
  borderTopWidth: 1,
  borderTopColor: '#E5EDE3',
  paddingTop: 12,
},

editButton: {
  flex: 1,
  backgroundColor: '#E5F1E5',
  padding: 11,
  borderRadius: 9,
  alignItems: 'center',
},

editButtonText: {
  color: '#174D36',
  fontWeight: '800',
  fontSize: 12,
},

deleteButton: {
  flex: 1,
  backgroundColor: '#FCE4E0',
  padding: 11,
  borderRadius: 9,
  alignItems: 'center',
},

deleteButtonText: {
  color: '#B33D2E',
  fontWeight: '800',
  fontSize: 12,
},
searchInput: {
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#DCE7DC',
  borderRadius: 12,
  paddingHorizontal: 15,
  paddingVertical: 13,
  fontSize: 14,
  color: '#183A2B',
  marginTop: 15,
  marginBottom: 15,
},

filterTitle: {
  fontSize: 11,
  fontWeight: '800',
  color: '#718477',
  marginBottom: 10,
  marginTop: 8,
},

filterRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
  marginBottom: 12,
},

filterChip: {
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#DCE7DC',
  paddingHorizontal: 14,
  paddingVertical: 9,
  borderRadius: 20,
},

activeFilterChip: {
  backgroundColor: '#174D36',
  borderColor: '#174D36',
},

filterChipText: {
  fontSize: 12,
  fontWeight: '700',
  color: '#526D5A',
},

activeFilterText: {
  color: '#FFFFFF',
},

resultCount: {
  fontSize: 11,
  color: '#87958A',
  marginBottom: 12,
},

emptyMessage: {
  textAlign: 'center',
  color: '#718078',
  padding: 25,
  fontSize: 14,
},
});
