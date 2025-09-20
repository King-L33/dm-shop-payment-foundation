// DM Shop Webhook Handler
// Foundation for Paystack webhooks and automation integrations (Zapier, n8n, Buildship)

import { PaystackWebhookEvent } from '../types/paystack';
import { PaystackClient } from '../lib/paystack-client';

export interface AutomationWebhook {
  url: string;
  events: string[];
  headers?: Record<string, string>;
  retryAttempts?: number;
}

export interface WebhookProcessingResult {
  success: boolean;
  message: string;
  automationTriggered?: boolean;
  data?: any;
}

export class DMShopWebhookHandler {
  private paystackClient: PaystackClient;
  private automationWebhooks: AutomationWebhook[];
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor(
    paystackClient: PaystackClient,
    supabaseUrl: string,
    supabaseKey: string,
    automationWebhooks: AutomationWebhook[] = []
  ) {
    this.paystackClient = paystackClient;
    this.automationWebhooks = automationWebhooks;
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
  }

  /**
   * Process Paystack webhook events
   * Foundation for Manus enhancement
   */
  async processPaystackWebhook(
    payload: string,
    signature: string
  ): Promise<WebhookProcessingResult> {
    try {
      // Validate webhook signature
      if (!this.paystackClient.validateWebhook(payload, signature)) {
        return {
          success: false,
          message: 'Invalid webhook signature'
        };
      }

      const event: PaystackWebhookEvent = JSON.parse(payload);
      
      // Process different event types
      switch (event.event) {
        case 'charge.success':
          return await this.handleSuccessfulPayment(event);
        
        case 'charge.failed':
          return await this.handleFailedPayment(event);
        
        case 'transfer.success':
          return await this.handleSuccessfulTransfer(event);
        
        case 'transfer.failed':
          return await this.handleFailedTransfer(event);
        
        default:
          console.log(`Unhandled webhook event: ${event.event}`);
          return {
            success: true,
            message: `Event ${event.event} received but not processed`
          };
      }
    } catch (error) {
      console.error('Webhook processing error:', error);
      return {
        success: false,
        message: `Webhook processing failed: ${error.message}`
      };
    }
  }

  /**
   * Handle successful payment webhook
   * Foundation for order completion and automation triggers
   */
  private async handleSuccessfulPayment(event: PaystackWebhookEvent): Promise<WebhookProcessingResult> {
    try {
      const { data } = event;
      const { reference, amount, metadata } = data;

      // Update order status in Supabase
      await this.updateOrderStatus(reference, 'paid', {
        paystack_transaction_id: data.id,
        amount_paid: amount,
        paid_at: data.paid_at,
        gateway_response: data.gateway_response
      });

      // Trigger automation workflows
      const automationResult = await this.triggerAutomation('payment.success', {
        reference,
        amount,
        customer: data.customer,
        metadata,
        order_id: metadata?.order_id,
        seller_id: metadata?.seller_id,
        store_id: metadata?.store_id
      });

      // Process multi-vendor payment splits if applicable
      if (metadata?.split_code) {
        await this.processPaymentSplits(reference, metadata);
      }

      return {
        success: true,
        message: 'Payment processed successfully',
        automationTriggered: automationResult,
        data: { reference, amount }
      };
    } catch (error) {
      console.error('Payment processing error:', error);
      throw error;
    }
  }

  /**
   * Handle failed payment webhook
   */
  private async handleFailedPayment(event: PaystackWebhookEvent): Promise<WebhookProcessingResult> {
    try {
      const { data } = event;
      const { reference, metadata } = data;

      // Update order status
      await this.updateOrderStatus(reference, 'failed', {
        failure_reason: data.gateway_response,
        failed_at: new Date().toISOString()
      });

      // Trigger automation for failed payment
      const automationResult = await this.triggerAutomation('payment.failed', {
        reference,
        customer: data.customer,
        metadata,
        failure_reason: data.gateway_response
      });

      return {
        success: true,
        message: 'Failed payment processed',
        automationTriggered: automationResult,
        data: { reference }
      };
    } catch (error) {
      console.error('Failed payment processing error:', error);
      throw error;
    }
  }

  /**
   * Handle successful transfer (seller payout)
   */
  private async handleSuccessfulTransfer(event: PaystackWebhookEvent): Promise<WebhookProcessingResult> {
    try {
      // Update seller payout status
      // Trigger seller notification automation
      const automationResult = await this.triggerAutomation('payout.success', event.data);

      return {
        success: true,
        message: 'Transfer processed successfully',
        automationTriggered: automationResult
      };
    } catch (error) {
      console.error('Transfer processing error:', error);
      throw error;
    }
  }

  /**
   * Handle failed transfer
   */
  private async handleFailedTransfer(event: PaystackWebhookEvent): Promise<WebhookProcessingResult> {
    try {
      // Update payout status and trigger retry logic
      const automationResult = await this.triggerAutomation('payout.failed', event.data);

      return {
        success: true,
        message: 'Failed transfer processed',
        automationTriggered: automationResult
      };
    } catch (error) {
      console.error('Failed transfer processing error:', error);
      throw error;
    }
  }

  /**
   * Update order status in Supabase
   * Foundation for Manus enhancement with proper error handling
   */
  private async updateOrderStatus(
    reference: string,
    status: string,
    additionalData: Record<string, any> = {}
  ): Promise<void> {
    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/orders`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          payment_status: status,
          updated_at: new Date().toISOString(),
          ...additionalData
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update order: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Order update error:', error);
      throw error;
    }
  }

  /**
   * Process multi-vendor payment splits
   * Foundation for complex seller payout logic
   */
  private async processPaymentSplits(
    reference: string,
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      // Calculate and record individual seller earnings
      // Update seller balances
      // Trigger individual seller notifications
      
      console.log(`Processing payment splits for reference: ${reference}`);
      
      // This will be enhanced by Manus with proper split calculation
      // and seller balance updates
    } catch (error) {
      console.error('Payment split processing error:', error);
      throw error;
    }
  }

  /**
   * Trigger automation workflows (Zapier, n8n, Buildship)
   * Foundation for external automation integrations
   */
  private async triggerAutomation(
    eventType: string,
    data: any
  ): Promise<boolean> {
    try {
      const relevantWebhooks = this.automationWebhooks.filter(
        webhook => webhook.events.includes(eventType)
      );

      if (relevantWebhooks.length === 0) {
        return false;
      }

      const promises = relevantWebhooks.map(webhook => 
        this.sendAutomationWebhook(webhook, eventType, data)
      );

      await Promise.allSettled(promises);
      return true;
    } catch (error) {
      console.error('Automation trigger error:', error);
      return false;
    }
  }

  /**
   * Send webhook to automation platforms
   */
  private async sendAutomationWebhook(
    webhook: AutomationWebhook,
    eventType: string,
    data: any
  ): Promise<void> {
    const maxRetries = webhook.retryAttempts || 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-DM-Shop-Event': eventType,
            'X-DM-Shop-Timestamp': new Date().toISOString(),
            ...webhook.headers
          },
          body: JSON.stringify({
            event: eventType,
            timestamp: new Date().toISOString(),
            data
          })
        });

        if (response.ok) {
          console.log(`Automation webhook sent successfully to ${webhook.url}`);
          return;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        attempt++;
        console.error(`Automation webhook attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    console.error(`Failed to send automation webhook after ${maxRetries} attempts`);
  }

  /**
   * Add automation webhook endpoint
   */
  addAutomationWebhook(webhook: AutomationWebhook): void {
    this.automationWebhooks.push(webhook);
  }

  /**
   * Remove automation webhook endpoint
   */
  removeAutomationWebhook(url: string): void {
    this.automationWebhooks = this.automationWebhooks.filter(
      webhook => webhook.url !== url
    );
  }
}

// Factory function for webhook handler
export function createWebhookHandler(
  paystackClient: PaystackClient,
  supabaseUrl: string,
  supabaseKey: string,
  automationWebhooks: AutomationWebhook[] = []
): DMShopWebhookHandler {
  return new DMShopWebhookHandler(
    paystackClient,
    supabaseUrl,
    supabaseKey,
    automationWebhooks
  );
}

// Predefined automation webhook configurations for common platforms
export const automationConfigs = {
  zapier: (webhookUrl: string): AutomationWebhook => ({
    url: webhookUrl,
    events: ['payment.success', 'payment.failed', 'payout.success', 'payout.failed'],
    headers: {
      'User-Agent': 'DM-Shop-Webhook/1.0'
    },
    retryAttempts: 3
  }),

  n8n: (webhookUrl: string): AutomationWebhook => ({
    url: webhookUrl,
    events: ['payment.success', 'payment.failed', 'order.created', 'order.completed'],
    headers: {
      'X-N8N-Source': 'dm-shop'
    },
    retryAttempts: 5
  }),

  buildship: (webhookUrl: string): AutomationWebhook => ({
    url: webhookUrl,
    events: ['payment.success', 'seller.payout', 'customer.notification'],
    headers: {
      'X-Buildship-Source': 'dm-shop-marketplace'
    },
    retryAttempts: 3
  })
};

