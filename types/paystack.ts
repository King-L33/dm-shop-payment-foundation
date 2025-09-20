// DM Shop Paystack Integration Types
// Foundation for Manus enhancement phase

export interface PaystackConfig {
  publicKey: string;
  secretKey: string;
  baseUrl: string;
  webhookSecret: string;
}

export interface PaystackCustomer {
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  metadata?: Record<string, any>;
}

export interface PaystackTransaction {
  reference: string;
  amount: number; // Amount in kobo (ZAR cents)
  email: string;
  currency: 'ZAR';
  callback_url?: string;
  metadata?: {
    seller_id: string;
    store_id: string;
    order_id: string;
    commission_rate: number;
    service_fee: number;
    custom_fields?: Array<{
      display_name: string;
      variable_name: string;
      value: string;
    }>;
  };
  split_code?: string; // For multi-vendor payment splitting
}

export interface PaystackSplit {
  name: string;
  type: 'percentage' | 'flat';
  currency: 'ZAR';
  subaccounts: Array<{
    subaccount: string;
    share: number;
  }>;
  bearer_type: 'account' | 'subaccount' | 'all-proportional' | 'all';
  bearer_subaccount?: string;
}

export interface PaystackSubaccount {
  business_name: string;
  settlement_bank: string;
  account_number: string;
  percentage_charge: number;
  description?: string;
  primary_contact_email?: string;
  primary_contact_name?: string;
  primary_contact_phone?: string;
  metadata?: {
    store_id: string;
    seller_id: string;
    seller_tier: 'free' | 'premium';
  };
}

export interface PaystackWebhookEvent {
  event: string;
  data: {
    id: number;
    domain: string;
    status: 'success' | 'failed' | 'abandoned';
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: 'ZAR';
    ip_address: string;
    metadata: Record<string, any>;
    fees_breakdown: Array<{
      type: string;
      amount: number;
      percentage: number;
      currency: 'ZAR';
    }>;
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
      metadata: Record<string, any>;
    };
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
    };
  };
}

// DM Shop specific payment calculation types
export interface DMShopPaymentCalculation {
  productPrice: number;
  sellerTier: 'free' | 'premium';
  commission: number;
  serviceFee: number;
  customerTotal: number;
  sellerReceives: number;
  paystackFees: number;
  netSellerAmount: number;
}

export interface DMShopOrderPayment {
  orderId: string;
  customerId: string;
  items: Array<{
    productId: string;
    variantId: string;
    storeId: string;
    sellerId: string;
    sellerTier: 'free' | 'premium';
    price: number;
    quantity: number;
    commission: number;
  }>;
  totals: {
    subtotal: number;
    totalCommission: number;
    totalServiceFee: number;
    shippingFee: number;
    grandTotal: number;
  };
  paymentSplits: Array<{
    sellerId: string;
    storeId: string;
    subaccountCode: string;
    amount: number;
    commission: number;
  }>;
}

export interface PaystackApiResponse<T = any> {
  status: boolean;
  message: string;
  data: T;
}

export interface PaystackError {
  status: false;
  message: string;
  errors?: Record<string, string[]>;
}

