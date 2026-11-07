# REVIVO — Smart Inventory Management

**Stop dead stock before it dies.**

REVIVO is a mobile inventory management application designed to help merchants track products, monitor stock levels, identify inventory risks, and manage discounted products. It also provides a customer shopping experience for purchasing available products.

## Features

### Merchant Dashboard
- View total products and inventory value.
- Monitor total orders, completed orders, and pending orders.
- Track sales and revenue analytics.
- Identify high-risk and low-stock products.
- View best-selling products and revenue by product.

### Inventory Management
- Add new products.
- Edit existing product details.
- Delete products.
- Search and filter products by category and risk level.
- Track product quantity, price, and expiry date.

### Stock Risk and Discount System
REVIVO uses a rule-based system to identify inventory risks and suggest discounts.

- **High Risk:** 20% suggested discount.
- **Medium Risk:** 10% suggested discount.
- **Low Risk:** No suggested discount.

Risk assessment considers product expiry dates and available stock quantities. This is currently a rule-based prototype, not a trained machine-learning model.

### Customer Features
- Browse available products.
- View discounted prices.
- Add products to the cart.
- Place orders.
- View order history and order status.

### Data Storage
- Uses AsyncStorage for local product and order persistence.

## Technology Stack

- React Native
- Expo
- TypeScript
- JavaScript
- AsyncStorage
- React Native SVG

## Getting Started

### Prerequisites
- Node.js
- npm
- Expo-compatible development environment
- Expo Go or an Android development build

### Installation

Clone the repository:

```bash
git clone https://github.com/AREEBCOER267dbs-cell/REVIVO-Smart-Inventory.git
```

Move into the project directory:

```bash
cd REVIVO-Smart-Inventory
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npx expo start
```

Follow the Expo instructions to run the application on a supported device or emulator.

## Project Status

REVIVO is a working student project and mobile application prototype. Features are being developed and improved.

## Developer

Developed as a student project at COER University, Roorkee.

## Disclaimer

Inventory risk levels and discount recommendations are generated using predefined rules. They should not be interpreted as predictions from a trained AI or machine-learning model.