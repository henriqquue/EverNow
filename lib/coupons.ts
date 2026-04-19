// Coupons system utilities

import { CouponType, CouponStatus } from '@prisma/client';

// Get coupon type display name
export function getCouponTypeDisplayName(type: CouponType): string {
  const names: Record<CouponType, string> = {
    PERCENTAGE: 'Desconto Percentual',
    FIXED_AMOUNT: 'Valor Fixo',
    EXTENDED_TRIAL: 'Trial Estendido',
    FIRST_PAYMENT_FREE: 'Primeiro Pagamento Grátis',
  };
  return names[type] || type;
}

// Get coupon status display name
export function getCouponStatusDisplayName(status: CouponStatus): string {
  const names: Record<CouponStatus, string> = {
    ACTIVE: 'Ativo',
    INACTIVE: 'Inativo',
    EXPIRED: 'Expirado',
  };
  return names[status] || status;
}

// Get coupon status color
export function getCouponStatusColor(status: CouponStatus): string {
  const colors: Record<CouponStatus, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    INACTIVE: 'bg-gray-100 text-gray-800',
    EXPIRED: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

// Validate coupon code format
export function isValidCouponCode(code: string): boolean {
  // Alphanumeric, uppercase, 4-20 characters
  return /^[A-Z0-9]{4,20}$/.test(code.toUpperCase());
}

// Format coupon code
export function formatCouponCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// Calculate discount for a coupon
export interface CouponDiscount {
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  discountDescription: string;
}

export function calculateCouponDiscount(
  coupon: {
    type: CouponType;
    discountPercent?: number | null;
    discountAmount?: number | null;
    trialDays?: number | null;
  },
  originalAmount: number
): CouponDiscount {
  let discountAmount = 0;
  let discountDescription = '';

  switch (coupon.type) {
    case 'PERCENTAGE':
      const percent = coupon.discountPercent || 0;
      discountAmount = (originalAmount * percent) / 100;
      discountDescription = `${percent}% de desconto`;
      break;

    case 'FIXED_AMOUNT':
      discountAmount = Math.min(coupon.discountAmount || 0, originalAmount);
      discountDescription = `R$ ${discountAmount.toFixed(2)} de desconto`;
      break;

    case 'FIRST_PAYMENT_FREE':
      discountAmount = originalAmount;
      discountDescription = 'Primeiro pagamento grátis';
      break;

    case 'EXTENDED_TRIAL':
      discountAmount = 0;
      discountDescription = `${coupon.trialDays || 0} dias de trial grátis`;
      break;
  }

  return {
    originalAmount,
    discountAmount: Math.round(discountAmount * 100) / 100,
    finalAmount: Math.max(0, Math.round((originalAmount - discountAmount) * 100) / 100),
    discountDescription,
  };
}

// Generate random coupon code
export function generateCouponCode(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
