// Script standalone para criar o plano na nova conta Pagar.me
// Execute este script diretamente se preferir

const secretKey = "sk_0c88c08b643c48cf88486cddc3f769fa"
const accountId = "acc_LjdJzJNIXZfPzeOa"

const payload = {
  name: "Petloo Monthly Subscription",
  description: "Assinatura mensal para o app Petloo",
  interval: "month",
  interval_count: 1,
  billing_type: "postpaid",
  amount: 3090, // R$ 30,90 em centavos
  trial_period_days: 30, // Primeira cobrança só após 30 dias
  payment_methods: ["credit_card"],
  installments: [1],
}

console.log("=== CRIAÇÃO DE PLANO PETLOO - NOVA CONTA ===")
console.log("Payload:", JSON.stringify(payload, null, 2))
console.log("Account ID:", accountId)
console.log("\nEnviando requisição para Pagar.me...")

fetch("https://api.pagar.me/core/v5/plans", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Basic " + Buffer.from(secretKey + ":").toString("base64"),
    "X-Account-Id": accountId,
  },
  body: JSON.stringify(payload),
})
  .then((res) => {
    console.log("Status da resposta:", res.status)
    return res.json()
  })
  .then((data) => {
    if (data.id) {
      console.log("\n✅ SUCESSO! Plano criado com sucesso!")
      console.log("🔑 ID do plano:", data.id)
      console.log("📋 Nome:", data.name)
      console.log("💰 Valor:", data.amount / 100, "reais")
      console.log("📅 Trial period:", data.trial_period_days, "dias")
      console.log("🔄 Billing type:", data.billing_type)
      console.log("\n⚠️ IMPORTANTE: Atualize a variável de ambiente:")
      console.log(`PETLOO_PLAN_ID=${data.id}`)
      console.log("\n📋 PRÓXIMOS PASSOS:")
      console.log("1. Atualizar PETLOO_PLAN_ID no .env")
      console.log("2. Configurar webhook: https://lpl.petloo.com.br/api/webhooks/pagarme")
      console.log("3. Marcar eventos: charge.paid, charge.failed")
    } else {
      console.error("\n❌ ERRO: Resposta inesperada da API")
      console.error("Resposta completa:", JSON.stringify(data, null, 2))
    }
  })
  .catch((err) => {
    console.error("\n❌ ERRO ao criar plano:", err)
  })
