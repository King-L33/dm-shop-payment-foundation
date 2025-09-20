// DM Shop Supabase Integration Layer
// Foundation for database operations and MCP integration

import { DMShopOrderPayment, PaystackWebhookEvent } from '../types/paystack';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceKey?: string;
}

export interface OrderRecord {
  id: string;
  user_id: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'failed';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_reference?: string;
  paystack_transaction_id?: string;
  total_amount: number;
  commission_amount: number;
  service_fee: number;
  shipping_fee: number;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface StoreRecord {
  id: string;
  user_id: string;
  name: string;
  description: string;
  logo?: string;
  status: 'online' | 'pending' | 'suspended';
  paystack_subaccount_code?: string;
  seller_tier: 'free' | 'premium';
  commission_rate: number;
  total_earnings: number;
  available_balance: number;
  created_at: string;
  updated_at: string;
}

export interface TransactionRecord {
  id: string;
  order_id: string;
  store_id: string;
  user_id: string;
  type: 'sale' | 'commission' | 'service_fee' | 'payout' | 'refund';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  paystack_reference?: string;
  description: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export class DMShopSupabaseClient {
  private config: SupabaseConfig;
  private baseHeaders: Record<string, string>;

  constructor(config: SupabaseConfig) {
    this.config = config;
    this.baseHeaders = {
      'Authorization': `Bearer ${config.anonKey}`,
      'Content-Type': 'application/json',
      'apikey': config.anonKey
    };
  }

  /**
   * Create new order record
   * Foundation for order management
   */
  async createOrder(orderData: Partial<OrderRecord>): Promise<OrderRecord> {
    try {
      const response = await fetch(`${this.config.url}/rest/v1/orders`, {
        method: 'POST',
        headers: {
          ...this.baseHeaders,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          ...orderData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create order: ${error}`);
      }

      const [order] = await response.json();
      return order;
    } catch (error) {
      console.error('Order creation error:', error);
      throw error;
    }
  }

  /**
   * Update order status and payment information
   */
  async updateOrder(orderId: string, updates: Partial<OrderRecord>): Promise<OrderRecord> {
    try {
      const response = await fetch(`${this.config.url}/rest/v1/orders?id=eq.${orderId}`, {
        method: 'PATCH',
        headers: {
          ...this.baseHeaders,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          ...updates,
          updated_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to update order: ${error}`);
      }

      const [order] = await response.json();
      return order;
    } catch (error) {
      console.error('Order update error:', error);
      throw error;
    }
  }

  /**
   * Get order by payment reference
   */
  async getOrderByReference(reference: string): Promise<OrderRecord | null> {
    try {
      const response = await fetch(
        `${this.config.url}/rest/v1/orders?payment_reference=eq.${reference}&select=*`,
        {
          method: 'GET',
          headers: this.baseHeaders
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch order: ${response.statusText}`);
      }

      const orders = await response.json();
      return orders.length > 0 ? orders[0] : null;
    } catch (error) {
      console.error('Order fetch error:', error);
      throw error;
    }
  }

  /**
   * Update store earnings and balance
   */
  async updateStoreEarnings(
    storeId: string,
    earningsAmount: number,
    transactionType: 'add' | 'subtract' = 'add'
  ): Promise<StoreRecord> {
    try {
      // First get current store data
      const storeResponse = await fetch(
        `${this.config.url}/rest/v1/stores?id=eq.${storeId}&select=*`,
        {
          method: 'GET',
          headers: this.baseHeaders
        }
      );

      if (!storeResponse.ok) {
        throw new Error(`Failed to fetch store: ${storeResponse.statusText}`);
      }

      const [store] = await storeResponse.json();
      if (!store) {
        throw new Error(`Store not found: ${storeId}`);
      }

      // Calculate new balances
      const currentEarnings = parseFloat(store.total_earnings || '0');
      const currentBalance = parseFloat(store.available_balance || '0');
      
      const newEarnings = transactionType === 'add' 
        ? currentEarnings + earningsAmount 
        : currentEarnings - earningsAmount;
      
      const newBalance = transactionType === 'add'
        ? currentBalance + earningsAmount
        : currentBalance - earningsAmount;

      // Update store record
      const updateResponse = await fetch(`${this.config.url}/rest/v1/stores?id=eq.${storeId}`, {
        method: 'PATCH',
        headers: {
          ...this.baseHeaders,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          total_earnings: newEarnings,
          available_balance: newBalance,
          updated_at: new Date().toISOString()
        })
      });

      if (!updateResponse.ok) {
        const error = await updateResponse.text();
        throw new Error(`Failed to update store earnings: ${error}`);
      }

      const [updatedStore] = await updateResponse.json();
      return updatedStore;
    } catch (error) {
      console.error('Store earnings update error:', error);
      throw error;
    }
  }

  /**
   * Create transaction record
   */
  async createTransaction(transactionData: Partial<TransactionRecord>): Promise<TransactionRecord> {
    try {
      const response = await fetch(`${this.config.url}/rest/v1/transactions`, {
        method: 'POST',
        headers: {
          ...this.baseHeaders,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          ...transactionData,
          created_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create transaction: ${error}`);
      }

      const [transaction] = await response.json();
      return transaction;
    } catch (error) {
      console.error('Transaction creation error:', error);
      throw error;
    }
  }

  /**
   * Process multi-vendor order payment
   * Foundation for complex payment splitting
   */
  async processOrderPayment(
    orderPayment: DMShopOrderPayment,
    paystackEvent: PaystackWebhookEvent
  ): Promise<void> {
    try {
      // Update main order
      await this.updateOrder(orderPayment.orderId, {
        payment_status: 'paid',
        paystack_transaction_id: paystackEvent.data.id.toString(),
        payment_reference: paystackEvent.data.reference
      });

      // Process each seller's earnings
      for (const split of orderPayment.paymentSplits) {
        // Update store earnings
        await this.updateStoreEarnings(split.storeId, split.amount);

        // Create transaction record for seller
        await this.createTransaction({
          order_id: orderPayment.orderId,
          store_id: split.storeId,
          user_id: split.sellerId,
          type: 'sale',
          amount: split.amount,
          status: 'completed',
          paystack_reference: paystackEvent.data.reference,
          description: `Sale earnings for order ${orderPayment.orderId}`,
          metadata: {
            commission_charged: split.commission,
            original_amount: split.amount + split.commission
          }
        });

        // Create commission transaction record
        await this.createTransaction({
          order_id: orderPayment.orderId,
          store_id: split.storeId,
          user_id: split.sellerId,
          type: 'commission',
          amount: split.commission,
          status: 'completed',
          paystack_reference: paystackEvent.data.reference,
          description: `Commission for order ${orderPayment.orderId}`,
          metadata: {
            commission_rate: split.commission / (split.amount + split.commission)
          }
        });
      }

      // Create service fee transaction
      await this.createTransaction({
        order_id: orderPayment.orderId,
        store_id: null,
        user_id: orderPayment.customerId,
        type: 'service_fee',
        amount: orderPayment.totals.totalServiceFee,
        status: 'completed',
        paystack_reference: paystackEvent.data.reference,
        description: `Service fee for order ${orderPayment.orderId}`
      });

    } catch (error) {
      console.error('Order payment processing error:', error);
      throw error;
    }
  }

  /**
   * Get store analytics data
   * Foundation for seller dashboard
   */
  async getStoreAnalytics(storeId: string, days: number = 30): Promise<{
    totalSales: number;
    totalOrders: number;
    totalCommissions: number;
    averageOrderValue: number;
    recentTransactions: TransactionRecord[];
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get transactions for the period
      const response = await fetch(
        `${this.config.url}/rest/v1/transactions?store_id=eq.${storeId}&created_at=gte.${startDate.toISOString()}&select=*&order=created_at.desc`,
        {
          method: 'GET',
          headers: this.baseHeaders
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }

      const transactions: TransactionRecord[] = await response.json();

      // Calculate analytics
      const salesTransactions = transactions.filter(t => t.type === 'sale');
      const commissionTransactions = transactions.filter(t => t.type === 'commission');

      const totalSales = salesTransactions.reduce((sum, t) => sum + t.amount, 0);
      const totalCommissions = commissionTransactions.reduce((sum, t) => sum + t.amount, 0);
      const totalOrders = salesTransactions.length;
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      return {
        totalSales,
        totalOrders,
        totalCommissions,
        averageOrderValue,
        recentTransactions: transactions.slice(0, 10)
      };
    } catch (error) {
      console.error('Analytics fetch error:', error);
      throw error;
    }
  }

  /**
   * Update store Paystack subaccount code
   */
  async updateStoreSubaccount(storeId: string, subaccountCode: string): Promise<void> {
    try {
      await fetch(`${this.config.url}/rest/v1/stores?id=eq.${storeId}`, {
        method: 'PATCH',
        headers: this.baseHeaders,
        body: JSON.stringify({
          paystack_subaccount_code: subaccountCode,
          updated_at: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Subaccount update error:', error);
      throw error;
    }
  }
}

// Factory function for Supabase client
export function createSupabaseClient(config: SupabaseConfig): DMShopSupabaseClient {
  return new DMShopSupabaseClient(config);
}

// MCP integration helper using the configured Supabase project
export async function createMCPSupabaseClient(): Promise<DMShopSupabaseClient> {
  const config: SupabaseConfig = {
    url: 'https://qkxmoulnarlratelimif.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFreG1vdWxuYXJscmF0ZWxpbWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMzM2MDYsImV4cCI6MjA3MjcwOTYwNn0.ppEbWI9TIsz58nA_J_g5zzUHi85gHVv8Ft0bNm1ZxSQ'
  };

  return createSupabaseClient(config);
}

