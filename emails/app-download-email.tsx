import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components"

interface AppDownloadEmailProps {
  customerName: string
}

export function AppDownloadEmail({ customerName }: AppDownloadEmailProps) {
  const firstName = customerName.split(" ")[0]

  return (
    <Html>
      <Head />
      <Preview>Sua tag Petloo vai chegar junto com a Looneca! Baixe o app agora para ativar o rastreamento.</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with logo */}
          <Section style={headerSection}>
            <Img
              src="https://www.petloo.com.br/images/petloo-logo-new.png"
              width="140"
              height="auto"
              alt="Petloo"
              style={logo}
            />
          </Section>

          {/* Hero section */}
          <Section style={heroSection}>
            <Heading style={heroHeading}>
              Oba, {firstName}! Sua tag Petloo está a caminho!
            </Heading>
            <Text style={heroSubtext}>
              A tag de rastreamento vai chegar junto com o seu pedido da Looneca.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Main content */}
          <Section style={contentSection}>
            <Text style={paragraph}>
              Obrigado por ter escolhido a Looneca e a tag de rastreamento Petloo! Ficamos muito felizes que
              você está cuidando do seu pet com tanto carinho.
            </Text>

            <Text style={paragraph}>
              A sua <strong>tag de rastreamento</strong> será enviada junto com o pedido da Looneca. Quando
              ela chegar, você vai precisar do <strong>app Petloo</strong> instalado para ativar o
              rastreamento.
            </Text>

            {/* Highlight box */}
            <Section style={highlightBox}>
              <Text style={highlightTitle}>
                Importante: baixe o app agora!
              </Text>
              <Text style={highlightText}>
                Para ativar a tag quando ela chegar, o app Petloo precisa estar instalado no seu celular.
                Baixe agora e deixe tudo pronto!
              </Text>
            </Section>

            {/* CTA Buttons */}
            <Section style={buttonSection}>
              <Row>
                <Column align="center" style={buttonColumn}>
                  <Button
                    href="https://apps.apple.com/br/app/petloo/id6747433542"
                    style={iosButton}
                  >
                    Baixar para iPhone
                  </Button>
                </Column>
                <Column align="center" style={buttonColumn}>
                  <Button
                    href="https://play.google.com/store/apps/details?id=br.com.petloo.petloo_app&pcampaignid=web_share"
                    style={androidButton}
                  >
                    Baixar para Android
                  </Button>
                </Column>
              </Row>
            </Section>

            <Hr style={divider} />

            {/* Extra features section */}
            <Section style={featuresSection}>
              <Heading as="h3" style={featuresHeading}>
                Enquanto a tag não chega, o app já tem muita coisa legal:
              </Heading>

              <Section style={featureItem}>
                <Text style={featureText}>
                  <strong>Cartão de vacina digital</strong> — com lembrete de vencimento para você nunca
                  esquecer
                </Text>
              </Section>

              <Section style={featureItem}>
                <Text style={featureText}>
                  <strong>Perfil completo do pet</strong> — registre todas as informações importantes do seu
                  companheiro
                </Text>
              </Section>

              <Section style={featureItem}>
                <Text style={featureText}>
                  <strong>E muito mais</strong> — estamos sempre adicionando funcionalidades novas para
                  cuidar melhor do seu pet
                </Text>
              </Section>
            </Section>

            <Hr style={divider} />

            {/* Closing */}
            <Text style={paragraph}>
              Qualquer dúvida, é só responder este email. Estamos sempre por aqui para ajudar!
            </Text>

            <Text style={closingText}>
              Com carinho,
              <br />
              Equipe Petloo
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Petloo — Cuidando de quem cuida de você.
            </Text>
            <Text style={footerLinks}>
              <Link href="https://www.petloo.com.br" style={footerLink}>
                petloo.com.br
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default AppDownloadEmail

// ---- Styles ----

const main = {
  backgroundColor: "#f6f6f6",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

const container = {
  margin: "0 auto",
  padding: "0",
  maxWidth: "600px",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  overflow: "hidden" as const,
}

const headerSection = {
  backgroundColor: "#F1542E",
  padding: "24px 40px",
  textAlign: "center" as const,
}

const logo = {
  margin: "0 auto",
}

const heroSection = {
  padding: "32px 40px 16px",
  textAlign: "center" as const,
}

const heroHeading = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#1a1a1a",
  lineHeight: "1.3",
  margin: "0 0 8px",
}

const heroSubtext = {
  fontSize: "16px",
  color: "#555555",
  lineHeight: "1.5",
  margin: "0",
}

const divider = {
  borderColor: "#eeeeee",
  margin: "24px 40px",
}

const contentSection = {
  padding: "0 40px",
}

const paragraph = {
  fontSize: "15px",
  color: "#333333",
  lineHeight: "1.6",
  margin: "0 0 16px",
}

const highlightBox = {
  backgroundColor: "#FFF3F0",
  border: "1px solid #F1542E",
  borderRadius: "8px",
  padding: "20px 24px",
  margin: "24px 0",
}

const highlightTitle = {
  fontSize: "16px",
  fontWeight: "700",
  color: "#F1542E",
  margin: "0 0 8px",
}

const highlightText = {
  fontSize: "14px",
  color: "#333333",
  lineHeight: "1.5",
  margin: "0",
}

const buttonSection = {
  padding: "8px 0 24px",
}

const buttonColumn = {
  width: "50%",
  paddingRight: "6px",
  paddingLeft: "6px",
}

const iosButton = {
  backgroundColor: "#1a1a1a",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  padding: "14px 20px",
  borderRadius: "8px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
}

const androidButton = {
  backgroundColor: "#F1542E",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  padding: "14px 20px",
  borderRadius: "8px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
}

const featuresSection = {
  padding: "0",
}

const featuresHeading = {
  fontSize: "16px",
  fontWeight: "700",
  color: "#1a1a1a",
  margin: "0 0 16px",
}

const featureItem = {
  padding: "0 0 4px",
}

const featureText = {
  fontSize: "14px",
  color: "#333333",
  lineHeight: "1.5",
  margin: "0 0 12px",
  paddingLeft: "12px",
  borderLeft: "3px solid #F1542E",
}

const closingText = {
  fontSize: "15px",
  color: "#333333",
  lineHeight: "1.6",
  margin: "16px 0 0",
}

const footer = {
  backgroundColor: "#fafafa",
  padding: "24px 40px",
  textAlign: "center" as const,
  borderTop: "1px solid #eeeeee",
}

const footerText = {
  fontSize: "13px",
  color: "#999999",
  margin: "0 0 8px",
}

const footerLinks = {
  fontSize: "13px",
  margin: "0",
}

const footerLink = {
  color: "#F1542E",
  textDecoration: "underline",
}
