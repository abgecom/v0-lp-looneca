# Funcionalidade de Assinatura - Documentação

## Status Atual
🔴 **DESATIVADA** - A funcionalidade de criação de planos/assinaturas está temporariamente desativada.

## Descrição
Esta funcionalidade permite que clientes assinem planos recorrentes (App Petloo e Loobook) junto com a compra de produtos. As assinaturas são gerenciadas através da API Pagar.me e começam 30 dias após o pagamento inicial.

## Como Reativar

Para reativar a funcionalidade de assinaturas, siga estes passos:

### 1. Frontend - Página do Carrinho
**Arquivo:** `app/carrinho/page.tsx`

Altere a constante `ENABLE_SUBSCRIPTION_OFFERS` de `false` para `true`:

\`\`\`typescript
const ENABLE_SUBSCRIPTION_OFFERS = true
\`\`\`

### 2. Contexto do Carrinho
**Arquivo:** `contexts/cart-context.tsx`

Altere os valores padrão de `recurringProducts` para `true`:

\`\`\`typescript
recurringProducts: {
  appPetloo: true,
  loobook: true,
}
\`\`\`

E também no estado inicial:

\`\`\`typescript
const [recurringProducts, setRecurringProducts] = useState({
  appPetloo: true,
  loobook: true,
})
\`\`\`

### 3. Backend - API de Pagamento
**Arquivo:** `app/api/payment/route.ts`

Altere a constante `ENABLE_SUBSCRIPTION_CREATION` de `false` para `true`:

\`\`\`typescript
const ENABLE_SUBSCRIPTION_CREATION = true
\`\`\`

### 4. Configuração Pagar.me
**Arquivo:** `lib/pagarme/config.ts`

Altere o feature flag `subscriptionsEnabled` para `true`:

\`\`\`typescript
features: {
  subscriptionsEnabled: true,
}
\`\`\`

## Arquivos Relacionados

### Frontend
- `app/carrinho/page.tsx` - Interface de seleção de ofertas
- `contexts/cart-context.tsx` - Gerenciamento de estado dos produtos recorrentes
- `app/checkout/page.tsx` - Exibição de produtos recorrentes no resumo

### Backend
- `app/api/payment/route.ts` - Processamento de pagamento e criação de assinatura
- `app/api/pagarme/create-subscription/route.ts` - Endpoint dedicado para criar assinaturas
- `app/api/pagarme/create-plan/route.ts` - Criação de planos na Pagar.me
- `app/api/pagarme/webhooks/route.ts` - Processamento de webhooks e criação de assinatura pós-pagamento

### Configuração
- `lib/pagarme/config.ts` - Configurações da API Pagar.me
- `lib/pagarme/api.ts` - Funções auxiliares para API Pagar.me

### Ações
- `actions/payment-actions.ts` - Ações de pagamento no cliente

## Variáveis de Ambiente Necessárias

\`\`\`env
PAGARME_API_KEY=sk_...
PAGARME_PUBLIC_KEY=pk_...
PAGARME_ACCOUNT_ID=acc_...
PETLOO_PLAN_ID=plan_...
PAGARME_WEBHOOK_SECRET=...
\`\`\`

## Fluxo de Assinatura

1. **Seleção no Carrinho**: Cliente seleciona App Petloo e/ou Loobook
2. **Checkout**: Produtos recorrentes aparecem como "GRÁTIS" no resumo
3. **Pagamento**: Sistema processa pagamento com cartão de crédito
4. **Salvamento do Cartão**: Cartão é salvo para cobranças futuras
5. **Criação da Assinatura**: Assinatura é criada com início em 30 dias
6. **Webhook**: Sistema processa webhooks para atualizar status

## Observações Importantes

- Assinaturas só funcionam com pagamento por **cartão de crédito**
- O cartão é salvo automaticamente quando há produtos recorrentes
- A primeira cobrança da assinatura ocorre **30 dias** após o pagamento inicial
- O plano custa **R$ 30,90/mês** (configurado na Pagar.me)
- Webhooks devem estar configurados corretamente para processar atualizações

## Testes

Antes de reativar em produção:

1. Teste o fluxo completo em ambiente de desenvolvimento
2. Verifique se os webhooks estão sendo recebidos corretamente
3. Confirme que as assinaturas estão sendo criadas na Pagar.me
4. Valide que os dados estão sendo salvos corretamente no Supabase

## Suporte

Para dúvidas ou problemas, consulte:
- Documentação da Pagar.me: https://docs.pagar.me
- Logs do sistema: Verifique console.log nos arquivos mencionados
