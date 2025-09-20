# DM Shop Payment Foundation

A comprehensive payment integration foundation for the DM Shop multi-vendor marketplace, built for the South African market with Paystack integration and automation-ready architecture.

## 🎯 Project Overview

This foundation provides the core payment processing infrastructure for DM Shop, designed to be enhanced by Manus AI with MCP connectivity for production deployment.

### Key Features

- **Paystack Integration**: Complete South African payment processing
- **Multi-Vendor Support**: Payment splitting and commission management
- **Freemium Model**: 7% commission (free) / 4% commission (premium) + R15 service fee
- **Automation Ready**: Webhook handlers for Zapier, n8n, and Buildship
- **Supabase Integration**: Database operations with MCP connectivity
- **South African Optimization**: ZAR currency, local banking, phone validation

## 🏗️ Architecture

```
dm-shop-payment-foundation/
├── types/
│   └── paystack.ts          # TypeScript interfaces and types
├── lib/
│   └── paystack-client.ts   # Core Paystack API client
├── utils/
│   └── payment-calculator.ts # Commission and fee calculations
├── api/
│   └── webhook-handler.ts   # Webhook processing and automation
├── src/
│   └── supabase-integration.ts # Database operations
└── README.md
```

## 🚀 Development Workflow

### Phase 1: Lovable.dev Foundation
- Web application core logic and UI
- Basic payment flow structure
- Multi-vendor marketplace features
- South African localization

### Phase 2: Manus Enhancement
- Advanced Paystack integration
- Complex business logic implementation
- MCP connectivity (Supabase, Zapier, n8n)
- Production optimization and security

## 💰 DM Shop Business Model

### Freemium Pricing Structure

**Free Tier Sellers:**
- 7% commission on sales
- R15 service fee per transaction (charged to customer)
- Basic seller dashboard and analytics

**Premium Tier Sellers:**
- 4% commission on sales  
- R15 service fee per transaction (charged to customer)
- Advanced analytics and priority support
- Enhanced store customization

### Payment Flow Example

```typescript
// Product: R100
// Free Tier Seller
const calculation = calculatePayment(100, 'free');
// Result:
// - Customer pays: R122 (R100 + R7 commission + R15 service fee)
// - Seller receives: R100 (minus Paystack fees ~R3.54)
// - Platform revenue: R22 (R7 commission + R15 service fee)
```

## 🔧 Core Components

### 1. Paystack Client (`lib/paystack-client.ts`)

```typescript
import { createPaystackClient } from './lib/paystack-client';

const client = createPaystackClient({
  publicKey: process.env.PAYSTACK_PUBLIC_KEY,
  secretKey: process.env.PAYSTACK_SECRET_KEY,
  baseUrl: 'https://api.paystack.co',
  webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET
});

// Initialize payment
const transaction = await client.initializeTransaction({
  reference: 'DMSHOP_ORDER_123',
  amount: 12200, // R122 in kobo
  email: 'customer@example.com',
  currency: 'ZAR',
  metadata: {
    seller_id: 'seller_123',
    store_id: 'store_456',
    order_id: 'order_789',
    commission_rate: 0.07
  }
});
```

### 2. Payment Calculator (`utils/payment-calculator.ts`)

```typescript
import { calculatePayment, calculateOrderPayment } from './utils/payment-calculator';

// Single product calculation
const payment = calculatePayment(100, 'free');
console.log(payment.customerTotal); // 122
console.log(payment.commission); // 7
console.log(payment.serviceFee); // 15

// Multi-vendor order calculation
const orderPayment = calculateOrderPayment([
  {
    productId: 'prod_1',
    storeId: 'store_1',
    sellerId: 'seller_1',
    sellerTier: 'free',
    price: 100,
    quantity: 2
  }
]);
```

### 3. Webhook Handler (`api/webhook-handler.ts`)

```typescript
import { createWebhookHandler, automationConfigs } from './api/webhook-handler';

const webhookHandler = createWebhookHandler(
  paystackClient,
  supabaseUrl,
  supabaseKey,
  [
    automationConfigs.zapier('https://hooks.zapier.com/hooks/catch/...'),
    automationConfigs.n8n('https://your-n8n.com/webhook/...'),
    automationConfigs.buildship('https://api.buildship.app/...')
  ]
);

// Process Paystack webhook
const result = await webhookHandler.processPaystackWebhook(payload, signature);
```

### 4. Supabase Integration (`src/supabase-integration.ts`)

```typescript
import { createMCPSupabaseClient } from './src/supabase-integration';

const supabase = await createMCPSupabaseClient();

// Create order
const order = await supabase.createOrder({
  user_id: 'customer_123',
  total_amount: 122,
  commission_amount: 7,
  service_fee: 15,
  status: 'pending',
  payment_status: 'pending'
});

// Process payment completion
await supabase.processOrderPayment(orderPayment, paystackEvent);
```

## 🔗 Automation Integrations

### Zapier Webhooks
- **Payment Success**: Trigger customer receipt email
- **Payment Failed**: Create support ticket
- **Seller Payout**: Send payout notification

### n8n Workflows  
- **Order Processing**: Inventory updates and fulfillment
- **Customer Service**: Automated support workflows
- **Analytics**: Data synchronization and reporting

### Buildship Automation
- **Seller Notifications**: Commission updates and earnings
- **Customer Communications**: Order status updates
- **Platform Analytics**: Revenue tracking and insights

## 🇿🇦 South African Features

### Currency and Formatting
```typescript
import { formatZAR, zarToKobo } from './utils/payment-calculator';

const price = 99.99;
console.log(formatZAR(price)); // "R 99.99"
console.log(zarToKobo(price)); // 9999 (kobo for Paystack)
```

### Phone Number Validation
```typescript
import { validateSAPhoneNumber, formatSAPhoneNumber } from './utils/payment-calculator';

const phone = "0821234567";
console.log(validateSAPhoneNumber(phone)); // true
console.log(formatSAPhoneNumber(phone)); // "+27821234567"
```

### Banking Integration
```typescript
// Get South African banks
const banks = await paystackClient.listBanks();

// Verify account details
const account = await paystackClient.resolveAccountNumber(
  "1234567890", 
  "632005" // Standard Bank code
);
```

## 🔒 Security Features

### Webhook Validation
- HMAC signature verification for all Paystack webhooks
- Replay attack prevention with timestamp validation
- Secure secret management for webhook endpoints

### Payment Security
- PCI DSS compliant payment processing through Paystack
- Secure subaccount management for multi-vendor splits
- Fraud detection and prevention mechanisms

### Data Protection
- POPIA compliance for South African data protection
- Encrypted sensitive data storage
- Secure API key management

## 📊 Analytics and Reporting

### Seller Dashboard Metrics
```typescript
const analytics = await supabase.getStoreAnalytics('store_123', 30);
console.log(analytics);
// {
//   totalSales: 5000,
//   totalOrders: 25,
//   totalCommissions: 350,
//   averageOrderValue: 200,
//   recentTransactions: [...]
// }
```

### Platform Revenue Tracking
```typescript
import { calculatePlatformRevenue } from './utils/payment-calculator';

const revenue = calculatePlatformRevenue(
  totalCommissions: 1000,
  totalServiceFees: 750,
  paystackFees: 150
);
// {
//   grossRevenue: 1750,
//   netRevenue: 1600,
//   paystackCosts: 150
// }
```

## 🚀 Next Steps for Manus Enhancement

### Priority Enhancements
1. **Advanced Error Handling**: Comprehensive error recovery and retry logic
2. **Performance Optimization**: Caching, rate limiting, and optimization
3. **Security Hardening**: Advanced fraud detection and security measures
4. **Testing Suite**: Comprehensive unit and integration tests
5. **Monitoring**: Application performance monitoring and alerting

### MCP Integrations
1. **Supabase MCP**: Enhanced database operations and real-time features
2. **Zapier MCP**: Advanced automation workflow management
3. **Custom MCPs**: Integration with Paxi, Pudo, and other SA services

### Production Features
1. **Multi-Currency Support**: Expansion beyond ZAR for regional growth
2. **Advanced Analytics**: Machine learning insights and predictions
3. **Seller Tools**: Advanced inventory management and marketing tools
4. **Customer Features**: Loyalty programs and personalized experiences

## 📝 Environment Variables

```env
# Paystack Configuration
PAYSTACK_PUBLIC_KEY=pk_test_...
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_WEBHOOK_SECRET=whsec_...

# Supabase Configuration  
SUPABASE_URL=https://qkxmoulnarlratelimif.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Automation Webhooks
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/...
N8N_WEBHOOK_URL=https://your-n8n.com/webhook/...
BUILDSHIP_WEBHOOK_URL=https://api.buildship.app/...
```

## 🤝 Contributing

This foundation is designed to be enhanced by Manus AI with MCP connectivity. The code structure provides clear extension points for advanced features while maintaining the core business logic for the South African multi-vendor marketplace.

## 📄 License

This project is part of the DM Shop marketplace platform. All rights reserved.

---

**Built for the South African market with ❤️ by the DM Shop team**

