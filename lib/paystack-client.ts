// DM Shop Paystack Client Foundation
// Basic structure for Manus enhancement phase

import { 
  PaystackConfig, 
  PaystackTransaction, 
  PaystackSubaccount, 
  PaystackSplit,
  PaystackApiResponse,
  PaystackError 
} from '../types/paystack';

export class PaystackClient {
  private config: PaystackConfig;
  private baseHeaders: Record<string, string>;

  constructor(config: PaystackConfig) {
    this.config = config;
    this.baseHeaders = {
      'Authorization': `Bearer ${config.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  // Foundation method - to be enhanced by Manus
  async initializeTransaction(transaction: PaystackTransaction): Promise<PaystackApiResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/transaction/initialize`, {
        method: 'POST',
        headers: this.baseHeaders,
        body: JSON.stringify(transaction),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Transaction initialization failed');
      }

      return data;
    } catch (error) {
      console.error('Paystack transaction initialization error:', error);
      throw error;
    }
  }

  // Foundation method - to be enhanced by Manus
  async verifyTransaction(reference: string): Promise<PaystackApiResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/transaction/verify/${reference}`, {
        method: 'GET',
        headers: this.baseHeaders,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Transaction verification failed');
      }

      return data;
    } catch (error) {
      console.error('Paystack transaction verification error:', error);
      throw error;
    }
  }

  // Foundation method - to be enhanced by Manus for multi-vendor
  async createSubaccount(subaccount: PaystackSubaccount): Promise<PaystackApiResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/subaccount`, {
        method: 'POST',
        headers: this.baseHeaders,
        body: JSON.stringify(subaccount),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Subaccount creation failed');
      }

      return data;
    } catch (error) {
      console.error('Paystack subaccount creation error:', error);
      throw error;
    }
  }

  // Foundation method - to be enhanced by Manus for payment splitting
  async createSplit(split: PaystackSplit): Promise<PaystackApiResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/split`, {
        method: 'POST',
        headers: this.baseHeaders,
        body: JSON.JSON.stringify(split),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Split creation failed');
      }

      return data;
    } catch (error) {
      console.error('Paystack split creation error:', error);
      throw error;
    }
  }

  // Foundation method - to be enhanced by Manus for webhook validation
  validateWebhook(payload: string, signature: string): boolean {
    try {
      // Basic webhook validation structure
      // Manus will implement proper HMAC validation
      const crypto = require('crypto');
      const hash = crypto
        .createHmac('sha512', this.config.webhookSecret)
        .update(payload, 'utf-8')
        .digest('hex');
      
      return hash === signature;
    } catch (error) {
      console.error('Webhook validation error:', error);
      return false;
    }
  }

  // Foundation method - to be enhanced by Manus
  async listBanks(): Promise<PaystackApiResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/bank?country=south%20africa`, {
        method: 'GET',
        headers: this.baseHeaders,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch banks');
      }

      return data;
    } catch (error) {
      console.error('Paystack banks fetch error:', error);
      throw error;
    }
  }

  // Foundation method - to be enhanced by Manus for account verification
  async resolveAccountNumber(accountNumber: string, bankCode: string): Promise<PaystackApiResponse> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        {
          method: 'GET',
          headers: this.baseHeaders,
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Account resolution failed');
      }

      return data;
    } catch (error) {
      console.error('Paystack account resolution error:', error);
      throw error;
    }
  }
}

// Factory function for creating Paystack client instances
export function createPaystackClient(config: PaystackConfig): PaystackClient {
  return new PaystackClient(config);
}

// Default configuration for South African market
export const defaultPaystackConfig: Partial<PaystackConfig> = {
  baseUrl: 'https://api.paystack.co',
  // publicKey and secretKey to be provided by environment variables
  // webhookSecret to be provided by environment variables
};

