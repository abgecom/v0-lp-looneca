"use client"

import type React from "react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface FAQItem {
  question: string
  answer: string | React.ReactNode
}

interface FAQSectionProps {
  title: string
  faqs: FAQItem[]
}

export default function FAQSection({ title, faqs }: FAQSectionProps) {
  return (
    <section className="py-12 px-4 bg-[#F1E9DB] border-t border-gray-200">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">{title}</h2>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border-b border-gray-200">
              <AccordionTrigger className="text-left font-semibold py-4 hover:text-[#F1542E] transition-colors">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="py-4 text-gray-700">
                {typeof faq.answer === "string" ? <p className="whitespace-pre-line">{faq.answer}</p> : faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
