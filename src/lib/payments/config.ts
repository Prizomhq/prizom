export interface CreditPackageDefinition {
  id: string;
  name: string;
  priceInr: number;
  credits: number;
}

/**
 * CANONICAL SERVER-SIDE CREDIT PACKAGE CATALOG
 * Real money and credit grants MUST depend 100% on this catalog.
 * The client cannot modify prices or credit amounts.
 */
export const SERVER_CREDIT_PACKAGES: Record<string, CreditPackageDefinition> = {
  pack_starter: {
    id: 'pack_starter',
    name: 'Starter Pack',
    priceInr: 99,
    credits: 25,
  },
  pack_pro: {
    id: 'pack_pro',
    name: 'Pro Creator Pack',
    priceInr: 249,
    credits: 75,
  },
  pack_power: {
    id: 'pack_power',
    name: 'Power Studio Pack',
    priceInr: 599,
    credits: 200,
  },
};
