"use client"

import type React from "react"

import { useState } from "react"
import { useCart } from "@/contexts/cart-context"
import { useRouter } from "next/navigation"
import { PaymentMethod, PaymentMethods, PaymentMethodsIcons } from "@/components/payment-methods"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { api } from "@/lib/api"
import { formatPrice } from "@/lib/utils"
import { PetPhotoUpload } from "@/components/pet-photo-upload"

export default function CheckoutPage() {
  const { cartItems, clearCart, total } = useCart()
  const router = useRouter()
  const { toast } = useToast()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [cpf, setCpf] = useState("")
  const [cep, setCep] = useState("")
  const [address, setAddress] = useState("")
  const [number, setNumber] = useState("")
  const [complement, setComplement] = useState("")
  const [neighborhood, setNeighborhood] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null)
  const [selectedInstallment, setSelectedInstallment] = useState("1")
  const [appPetloo, setAppPetloo] = useState(false)
  const [loobook, setLoobook] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [petPhotos, setPetPhotos] = useState<string[]>([])

  const installments = Array.from({ length: 12 }, (_, i) => i + 1)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (cartItems.length === 0) {
      toast({
        title: "Seu carrinho está vazio.",
        description: "Adicione produtos ao carrinho antes de finalizar a compra.",
        variant: "destructive",
      })
      return
    }

    if (!paymentMethod) {
      toast({
        title: "Selecione um método de pagamento.",
        description: "Por favor, escolha um método de pagamento para prosseguir.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const paymentResponse = await api.post("/api/payment", {
        amount: total,
        paymentMethod,
        installments: selectedInstallment,
        name,
        email,
        cpf,
      })

      if (paymentResponse.status !== 200) {
        throw new Error("Erro ao processar o pagamento.")
      }

      const paymentResponseData = await paymentResponse.data

      if (!paymentResponseData.id || !paymentResponseData.status) {
        throw new Error("Erro ao obter dados de pagamento.")
      }

      // Incluir petPhotos no objeto orderData
      const orderData = {
        customer: {
          name,
          email,
          phone,
          cpf,
        },
        shipping: {
          cep,
          address,
          number,
          complement,
          neighborhood,
          city,
          state,
          method: "correios",
          price: 0,
        },
        items: cartItems,
        recurringProducts: {
          appPetloo: appPetloo,
          loobook: loobook,
        },
        paymentMethod: paymentMethod as "credit_card" | "pix",
        totalAmount: total,
        installments: selectedInstallment,
        paymentId: paymentResponseData.id,
        paymentStatus: paymentResponseData.status,
        petPhotos, // Adicionando as fotos dos pets
      }

      const orderResponse = await api.post("/api/order", orderData)

      if (orderResponse.status !== 201) {
        throw new Error("Erro ao criar o pedido.")
      }

      toast({
        title: "Pedido realizado com sucesso!",
        description: "Agradecemos a sua compra.",
      })

      clearCart()
      router.push("/success")
    } catch (error: any) {
      console.error("Erro ao finalizar a compra:", error)
      toast({
        title: "Erro ao finalizar a compra.",
        description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container max-w-5xl mx-auto py-12">
      <h1 className="text-3xl font-semibold mb-6">Checkout</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Informações Pessoais */}
        <section className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Informações Pessoais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome Completo</Label>
              <Input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input type="text" id="cpf" value={cpf} onChange={(e) => setCpf(e.target.value)} required />
            </div>
          </div>
        </section>

        {/* Endereço de Entrega */}
        <section className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Endereço de Entrega</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="cep">CEP</Label>
              <Input type="text" id="cep" value={cep} onChange={(e) => setCep(e.target.value)} required />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address">Endereço</Label>
              <Input type="text" id="address" value={address} onChange={(e) => setAddress(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="number">Número</Label>
              <Input type="text" id="number" value={number} onChange={(e) => setNumber(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="complement">Complemento</Label>
              <Input type="text" id="complement" value={complement} onChange={(e) => setComplement(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input
                type="text"
                id="neighborhood"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input type="text" id="city" value={city} onChange={(e) => setCity(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="state">Estado</Label>
              <Input type="text" id="state" value={state} onChange={(e) => setState(e.target.value)} required />
            </div>
          </div>
        </section>

        {/* Seção de upload de fotos dos pets */}
        <div className="mt-6 border rounded-lg p-4">
          <PetPhotoUpload onPhotosChange={setPetPhotos} />
        </div>

        {/* Produtos Recorrentes */}
        <section className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Produtos Recorrentes</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="appPetloo" checked={appPetloo} onCheckedChange={() => setAppPetloo(!appPetloo)} />
              <Label htmlFor="appPetloo">App Petloo</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="loobook" checked={loobook} onCheckedChange={() => setLoobook(!loobook)} />
              <Label htmlFor="loobook">Loobook</Label>
            </div>
          </div>
        </section>

        {/* Método de Pagamento */}
        <section className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Método de Pagamento</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PaymentMethods.map((method) => (
              <PaymentMethod
                key={method.value}
                id={method.value}
                title={method.label}
                icon={PaymentMethodsIcons[method.value]}
                selected={paymentMethod === method.value}
                onSelect={() => setPaymentMethod(method.value)}
              />
            ))}
          </div>

          {paymentMethod === "credit_card" && (
            <div className="mt-4">
              <Label htmlFor="installments">Parcelas</Label>
              <Select onValueChange={setSelectedInstallment}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a quantidade de parcelas" />
                </SelectTrigger>
                <SelectContent>
                  {installments.map((installment) => (
                    <SelectItem key={installment} value={String(installment)}>
                      {installment}x de {formatPrice(total / installment)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </section>

        {/* Resumo da Compra */}
        <section className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Resumo da Compra</h2>
          <ul className="space-y-2">
            {cartItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between">
                <span>
                  {item.quantity}x {item.name}
                </span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between mt-4 font-semibold">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </section>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Processando..." : "Finalizar Compra"}
        </Button>
      </form>
    </div>
  )
}
