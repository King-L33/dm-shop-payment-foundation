// DM Shop Payment Calculator Utilities
// Foundation for commission and fee calculations

import { DMShopPaymentCalculation, DMShopOrderPayment } from '../types/paystack';

/**
 * Calculate payment breakdown for DM Shop freemium model
 * Free tier: 7% commission + R15 service fee (charged to customer)
 * Premium tier: 4% commission + R15 service fee (charged to customer)
 */
export function calculatePayment(
  productPrice: number, 
  sellerTier: 'free' | 'premium'
): DMShopPaymentCalculation {
  const serviceFee = 15; // R15 service fee for both tiers
  
  if (sellerTier === 'free') {
    const commission = productPrice * 0.07; // 7% commission
    const customerTotal = productPrice + commission + serviceFee;
    
    // Estimate Paystack fees (2.9% + R2 for local cards)
    const paystackFees = (customerTotal * 0.029) + 2;
    const netSellerAmount = productPrice - paystackFees;
    
    return {
      productPrice,
      sellerTier,
      commission,
      serviceFee,
      customerTotal,
      sellerReceives: productPrice,
      paystackFees,
      netSellerAmount
    };
  } else {
    const commission = productPrice * 0.04; // 4% commission for premium
    const customerTotal = productPrice + commission + serviceFee;
    
    // Estimate Paystack fees
    const paystackFees = (customerTotal * 0.029) + 2;
    const netSellerAmount = productPrice - paystackFees;
    
    return {
      productPrice,
      sellerTier,
      commission,
      serviceFee,
      customerTotal,
      sellerReceives: productPrice,
      paystackFees,
      netSellerAmount
    };
  }
}

/**
 * Calculate multi-vendor order payment splits
 * Foundation for complex order processing
 */
export function calculateOrderPayment(
  items: Array<{
    productId: string;
    variantId: string;
    storeId: string;
    sellerId: string;
    sellerTier: 'free' | 'premium';
    price: number;
    quantity: number;
  }>,
  shippingFee: number = 85 // Default R85 Paxi shipping
): DMShopOrderPayment {
  let subtotal = 0;
  let totalCommission = 0;
  let totalServiceFee = 0;
  const paymentSplits: Array<{
    sellerId: string;
    storeId: string;
    subaccountCode: string;
    amount: number;
    commission: number;
  }> = [];

  // Calculate totals and prepare splits
  const processedItems = items.map(item => {
    const itemTotal = item.price * item.quantity;
    const calculation = calculatePayment(itemTotal, item.sellerTier);
    
    subtotal += itemTotal;
    totalCommission += calculation.commission;
    totalServiceFee += calculation.serviceFee;

    // Group by seller for payment splits
    const existingSplit = paymentSplits.find(split => split.sellerId === item.sellerId);
    if (existingSplit) {
      existingSplit.amount += calculation.sellerReceives;
      existingSplit.commission += calculation.commission;
    } else {
      paymentSplits.push({
        sellerId: item.sellerId,
        storeId: item.storeId,
        subaccountCode: `ACCT_${item.sellerId}`, // To be replaced with actual subaccount codes
        amount: calculation.sellerReceives,
        commission: calculation.commission
      });
    }

    return {
      ...item,
      commission: calculation.commission
    };
  });

  const grandTotal = subtotal + totalCommission + totalServiceFee + shippingFee;

  return {
    orderId: '', // To be set by calling function
    customerId: '', // To be set by calling function
    items: processedItems,
    totals: {
      subtotal,
      totalCommission,
      totalServiceFee,
      shippingFee,
      grandTotal
    },
    paymentSplits
  };
}

/**
 * Convert ZAR amount to kobo (cents) for Paystack
 */
export function zarToKobo(zarAmount: number): number {
  return Math.round(zarAmount * 100);
}

/**
 * Convert kobo (cents) to ZAR for display
 */
export function koboToZar(koboAmount: number): number {
  return koboAmount / 100;
}

/**
 * Format ZAR currency for display
 */
export function formatZAR(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * Generate unique payment reference for DM Shop
 */
export function generatePaymentReference(orderId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `DMSHOP_${orderId}_${timestamp}_${random}`.toUpperCase();
}

/**
 * Validate South African phone number format
 */
export function validateSAPhoneNumber(phone: string): boolean {
  // South African phone number patterns
  const patterns = [
    /^(\+27|0)[1-9][0-9]{8}$/, // Standard format
    /^27[1-9][0-9]{8}$/, // International without +
  ];
  
  return patterns.some(pattern => pattern.test(phone.replace(/\s/g, '')));
}

/**
 * Format South African phone number for Paystack
 */
export function formatSAPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\s/g, '');
  
  if (cleaned.startsWith('+27')) {
    return cleaned;
  } else if (cleaned.startsWith('27')) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith('0')) {
    return `+27${cleaned.substring(1)}`;
  }
  
  return phone; // Return original if format not recognized
}

/**
 * Calculate platform revenue from commissions
 */
export function calculatePlatformRevenue(
  totalCommissions: number,
  totalServiceFees: number,
  paystackFees: number
): {
  grossRevenue: number;
  netRevenue: number;
  paystackCosts: number;
} {
  const grossRevenue = totalCommissions + totalServiceFees;
  const netRevenue = grossRevenue - paystackFees;
  
  return {
    grossRevenue,
    netRevenue,
    paystackCosts: paystackFees
  };
}

