/**
 * Stripe plan configuration — source of truth for pricing UI and checkout.
 */
export const STRIPE_PLANS = {
  team_3: {
    product_id: "prod_UAovGO1I05JCDs",
    price_id: "price_1TCTHWAtoACfSgBOGlgV68Zj",
    name: "Starter",
    seats: 3,
    price: 9,
    currency: "usd",
    label: "$9/mes",
    description: "Para freelancers y equipos pequeños",
    features: [
      "Hasta 3 miembros",
      "Historial completo",
      "Exportación de datos",
      "AI ilimitado",
      "Visibilidad de equipo",
    ],
    popular: false,
  },
  team_6: {
    product_id: "prod_UAoxhZWDzZ9c4D",
    price_id: "price_1TCTJEAtoACfSgBOB6wsdgu5",
    name: "Estudio",
    seats: 6,
    price: 16,
    currency: "usd",
    label: "$16/mes",
    description: "Para estudios y agencias medianas",
    features: [
      "Hasta 6 miembros",
      "Historial completo",
      "Exportación de datos",
      "AI ilimitado",
      "Visibilidad de equipo",
      "Soporte prioritario",
    ],
    popular: true,
  },
  team_10: {
    product_id: "prod_UAoxkBAGdpEPKi",
    price_id: "price_1TCTJbAtoACfSgBOpwnduNgK",
    name: "Agencia",
    seats: 10,
    price: 20,
    currency: "usd",
    label: "$20/mes",
    description: "Para agencias y equipos grandes",
    features: [
      "Hasta 10 miembros",
      "Historial completo",
      "Exportación de datos",
      "AI ilimitado",
      "Visibilidad de equipo",
      "Soporte prioritario",
      "Onboarding personalizado",
    ],
    popular: false,
  },
} as const;

export type StripePlanKey = keyof typeof STRIPE_PLANS;

/** Look up plan by Stripe product_id */
export function planByProductId(productId: string) {
  return Object.values(STRIPE_PLANS).find((p) => p.product_id === productId) ?? null;
}
