import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Estudio Oasis"

interface ContactInternalProps {
  name?: string
  email?: string
  company?: string
  need?: string
  budget?: string
  message?: string
}

const ContactInternalEmail = ({ name, email, company, need, budget, message }: ContactInternalProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Nuevo contacto: {name || 'Sin nombre'} — {company || 'Sin empresa'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>OASIS — NUEVO CONTACTO</Text>
        <Hr style={hr} />
        <Heading style={h1}>
          {name || 'Sin nombre'}
        </Heading>

        <Section style={fieldSection}>
          <Text style={fieldLabel}>Email</Text>
          <Text style={fieldValue}>{email || '—'}</Text>
        </Section>

        <Section style={fieldSection}>
          <Text style={fieldLabel}>Empresa</Text>
          <Text style={fieldValue}>{company || '—'}</Text>
        </Section>

        <Section style={fieldSection}>
          <Text style={fieldLabel}>Necesita</Text>
          <Text style={fieldValue}>{need || '—'}</Text>
        </Section>

        <Section style={fieldSection}>
          <Text style={fieldLabel}>Presupuesto</Text>
          <Text style={fieldValue}>{budget || '—'}</Text>
        </Section>

        <Hr style={hr} />

        <Text style={fieldLabel}>Mensaje</Text>
        <Text style={messageText}>{message || '—'}</Text>

        <Hr style={hr} />
        <Text style={footer}>
          Enviado desde el formulario de contacto de {SITE_NAME}
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactInternalEmail,
  subject: (data: Record<string, any>) => `Nuevo contacto: ${data.name || 'Sin nombre'} — ${data.company || 'Web'}`,
  displayName: 'Contact form internal notification',
  to: 'r@oasistud.io',
  previewData: { name: 'María López', email: 'maria@acme.com', company: 'Acme Corp', need: 'Branding / Identidad de marca', budget: '$50,000 – $150,000 MXN', message: 'Hola, necesitamos un rediseño de marca completo para nuestra empresa.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '40px 25px', maxWidth: '560px', margin: '0 auto' }
const brand = { fontSize: '14px', fontWeight: 'bold' as const, letterSpacing: '3px', color: '#C4A265', margin: '0 0 20px' }
const hr = { borderColor: '#E7E0D8', margin: '20px 0' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1C1917', fontFamily: "'Playfair Display', Georgia, serif", margin: '0 0 20px' }
const fieldSection = { margin: '0 0 12px' }
const fieldLabel = { fontSize: '11px', fontWeight: 'bold' as const, color: '#A8A29E', textTransform: 'uppercase' as const, letterSpacing: '1px', margin: '0 0 2px' }
const fieldValue = { fontSize: '15px', color: '#1C1917', margin: '0' }
const messageText = { fontSize: '15px', color: '#57534E', lineHeight: '1.6', margin: '4px 0 0', whiteSpace: 'pre-wrap' as const }
const footer = { fontSize: '12px', color: '#A8A29E', margin: '20px 0 0' }
