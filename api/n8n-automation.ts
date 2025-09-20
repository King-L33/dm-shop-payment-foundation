// DM Shop n8n Automation Integration
// Foundation for n8n workflow automation (NOT Zapier)

export interface N8nWebhookConfig {
  baseUrl: string;
  webhookId: string;
  authToken?: string;
  retryAttempts?: number;
}

export interface N8nWorkflowTrigger {
  workflowName: string;
  webhookUrl: string;
  events: string[];
  enabled: boolean;
}

export interface DMShopAutomationEvent {
  event: string;
  timestamp: string;
  data: {
    orderId?: string;
    customerId?: string;
    sellerId?: string;
    storeId?: string;
    amount?: number;
    status?: string;
    metadata?: Record<string, any>;
  };
}

export class N8nAutomationClient {
  private config: N8nWebhookConfig;

  constructor(config: N8nWebhookConfig) {
    this.config = config;
  }

  /**
   * Trigger n8n workflow for payment events
   * Foundation for Manus enhancement
   */
  async triggerPaymentWorkflow(
    event: 'payment.success' | 'payment.failed' | 'payment.pending',
    data: DMShopAutomationEvent['data']
  ): Promise<boolean> {
    try {
      const payload: DMShopAutomationEvent = {
        event,
        timestamp: new Date().toISOString(),
        data
      };

      const response = await fetch(`${this.config.baseUrl}/webhook/${this.config.webhookId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-DM-Shop-Event': event,
          'X-DM-Shop-Source': 'payment-system',
          ...(this.config.authToken && { 'Authorization': `Bearer ${this.config.authToken}` })
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`n8n webhook failed: ${response.status} ${response.statusText}`);
      }

      console.log(`n8n payment workflow triggered: ${event}`);
      return true;
    } catch (error) {
      console.error('n8n payment workflow error:', error);
      return false;
    }
  }

  /**
   * Trigger n8n workflow for order events
   */
  async triggerOrderWorkflow(
    event: 'order.created' | 'order.paid' | 'order.shipped' | 'order.delivered' | 'order.cancelled',
    data: DMShopAutomationEvent['data']
  ): Promise<boolean> {
    try {
      const payload: DMShopAutomationEvent = {
        event,
        timestamp: new Date().toISOString(),
        data
      };

      const response = await fetch(`${this.config.baseUrl}/webhook/${this.config.webhookId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-DM-Shop-Event': event,
          'X-DM-Shop-Source': 'order-system'
        },
        body: JSON.stringify(payload)
      });

      return response.ok;
    } catch (error) {
      console.error('n8n order workflow error:', error);
      return false;
    }
  }

  /**
   * Trigger n8n workflow for seller events
   */
  async triggerSellerWorkflow(
    event: 'seller.payout' | 'seller.commission' | 'seller.notification',
    data: DMShopAutomationEvent['data']
  ): Promise<boolean> {
    try {
      const payload: DMShopAutomationEvent = {
        event,
        timestamp: new Date().toISOString(),
        data
      };

      const response = await fetch(`${this.config.baseUrl}/webhook/${this.config.webhookId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-DM-Shop-Event': event,
          'X-DM-Shop-Source': 'seller-system'
        },
        body: JSON.stringify(payload)
      });

      return response.ok;
    } catch (error) {
      console.error('n8n seller workflow error:', error);
      return false;
    }
  }

  /**
   * Trigger n8n workflow for customer events
   */
  async triggerCustomerWorkflow(
    event: 'customer.welcome' | 'customer.order_confirmation' | 'customer.shipping_update' | 'customer.support',
    data: DMShopAutomationEvent['data']
  ): Promise<boolean> {
    try {
      const payload: DMShopAutomationEvent = {
        event,
        timestamp: new Date().toISOString(),
        data
      };

      const response = await fetch(`${this.config.baseUrl}/webhook/${this.config.webhookId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-DM-Shop-Event': event,
          'X-DM-Shop-Source': 'customer-system'
        },
        body: JSON.stringify(payload)
      });

      return response.ok;
    } catch (error) {
      console.error('n8n customer workflow error:', error);
      return false;
    }
  }

  /**
   * Test n8n webhook connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const testPayload = {
        event: 'system.test',
        timestamp: new Date().toISOString(),
        data: { test: true }
      };

      const response = await fetch(`${this.config.baseUrl}/webhook/${this.config.webhookId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-DM-Shop-Event': 'system.test'
        },
        body: JSON.stringify(testPayload)
      });

      return response.ok;
    } catch (error) {
      console.error('n8n connection test failed:', error);
      return false;
    }
  }
}

/**
 * DM Shop n8n Workflow Manager
 * Manages multiple n8n workflows for different business processes
 */
export class DMShopN8nManager {
  private workflows: Map<string, N8nAutomationClient> = new Map();

  /**
   * Register n8n workflow
   */
  registerWorkflow(name: string, config: N8nWebhookConfig): void {
    this.workflows.set(name, new N8nAutomationClient(config));
  }

  /**
   * Trigger specific workflow by name
   */
  async triggerWorkflow(
    workflowName: string,
    event: string,
    data: DMShopAutomationEvent['data']
  ): Promise<boolean> {
    const workflow = this.workflows.get(workflowName);
    if (!workflow) {
      console.error(`n8n workflow not found: ${workflowName}`);
      return false;
    }

    // Route to appropriate workflow method based on event type
    if (event.startsWith('payment.')) {
      return await workflow.triggerPaymentWorkflow(event as any, data);
    } else if (event.startsWith('order.')) {
      return await workflow.triggerOrderWorkflow(event as any, data);
    } else if (event.startsWith('seller.')) {
      return await workflow.triggerSellerWorkflow(event as any, data);
    } else if (event.startsWith('customer.')) {
      return await workflow.triggerCustomerWorkflow(event as any, data);
    }

    return false;
  }

  /**
   * Broadcast event to all registered workflows
   */
  async broadcastEvent(
    event: string,
    data: DMShopAutomationEvent['data']
  ): Promise<{ [workflowName: string]: boolean }> {
    const results: { [workflowName: string]: boolean } = {};

    const promises = Array.from(this.workflows.entries()).map(async ([name, workflow]) => {
      try {
        let success = false;
        
        if (event.startsWith('payment.')) {
          success = await workflow.triggerPaymentWorkflow(event as any, data);
        } else if (event.startsWith('order.')) {
          success = await workflow.triggerOrderWorkflow(event as any, data);
        } else if (event.startsWith('seller.')) {
          success = await workflow.triggerSellerWorkflow(event as any, data);
        } else if (event.startsWith('customer.')) {
          success = await workflow.triggerCustomerWorkflow(event as any, data);
        }

        results[name] = success;
      } catch (error) {
        console.error(`n8n workflow ${name} failed:`, error);
        results[name] = false;
      }
    });

    await Promise.allSettled(promises);
    return results;
  }

  /**
   * Test all registered workflows
   */
  async testAllWorkflows(): Promise<{ [workflowName: string]: boolean }> {
    const results: { [workflowName: string]: boolean } = {};

    const promises = Array.from(this.workflows.entries()).map(async ([name, workflow]) => {
      results[name] = await workflow.testConnection();
    });

    await Promise.allSettled(promises);
    return results;
  }
}

// Predefined n8n workflow configurations for DM Shop
export const dmShopN8nWorkflows = {
  // Payment processing workflows
  paymentProcessing: (webhookId: string, baseUrl: string = 'https://your-n8n-instance.com'): N8nWebhookConfig => ({
    baseUrl,
    webhookId,
    retryAttempts: 3
  }),

  // Order fulfillment workflows
  orderFulfillment: (webhookId: string, baseUrl: string = 'https://your-n8n-instance.com'): N8nWebhookConfig => ({
    baseUrl,
    webhookId,
    retryAttempts: 5
  }),

  // Customer communication workflows
  customerCommunication: (webhookId: string, baseUrl: string = 'https://your-n8n-instance.com'): N8nWebhookConfig => ({
    baseUrl,
    webhookId,
    retryAttempts: 2
  }),

  // Seller management workflows
  sellerManagement: (webhookId: string, baseUrl: string = 'https://your-n8n-instance.com'): N8nWebhookConfig => ({
    baseUrl,
    webhookId,
    retryAttempts: 3
  }),

  // Analytics and reporting workflows
  analyticsReporting: (webhookId: string, baseUrl: string = 'https://your-n8n-instance.com'): N8nWebhookConfig => ({
    baseUrl,
    webhookId,
    retryAttempts: 1
  })
};

// Factory function for n8n manager
export function createN8nManager(): DMShopN8nManager {
  return new DMShopN8nManager();
}

// Example usage for DM Shop integration
export function setupDMShopN8nWorkflows(
  n8nBaseUrl: string,
  webhookIds: {
    payment: string;
    order: string;
    customer: string;
    seller: string;
    analytics: string;
  }
): DMShopN8nManager {
  const manager = createN8nManager();

  // Register all DM Shop workflows
  manager.registerWorkflow('payment', dmShopN8nWorkflows.paymentProcessing(webhookIds.payment, n8nBaseUrl));
  manager.registerWorkflow('order', dmShopN8nWorkflows.orderFulfillment(webhookIds.order, n8nBaseUrl));
  manager.registerWorkflow('customer', dmShopN8nWorkflows.customerCommunication(webhookIds.customer, n8nBaseUrl));
  manager.registerWorkflow('seller', dmShopN8nWorkflows.sellerManagement(webhookIds.seller, n8nBaseUrl));
  manager.registerWorkflow('analytics', dmShopN8nWorkflows.analyticsReporting(webhookIds.analytics, n8nBaseUrl));

  return manager;
}

