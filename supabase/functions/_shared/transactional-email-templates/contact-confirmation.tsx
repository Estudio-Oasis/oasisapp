import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Estudio Oasis"

interface ContactConfirmationProps {
  name?: string
  company?: string
  need?: string
}

const ContactConfirmationEmail = ({ name, company, need }: ContactConfirmationProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Recibimos tu mensaje — {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>OASIS</Text>
        <Hr style={hr} />
        <Heading style={h1}>
          {name ? `Gracias, ${name}.` : 'Gracias por escribirnos.'}
        </Heading>
        <Text style={text}>
          Recibimos tu mensaje{company ? ` sobre ${company}` : ''}{need ? ` relacionado con "${need}"` : ''}.
          Nuestro equipo lo revisará y te responderemos en menos de 24 horas hábiles.
        </Text>
        <Text style={text}>
          Si necesitas algo urgente, puedes contactarnos directamente a{' '}
          <a href="mailto:r@oasistud.io" style={link}>r@oasistud.io</a> o al{' '}
          <a href="tel:+524531090660" style={link}>+52 453 109 0660</a>.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          {SITE_NAME} · Ciudad de México
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactConfirmationEmail,
  subject: 'Recibimos tu mensaje — Estudio Oasis',
  displayName: 'Contact form confirmation',
  previewData: { name: 'María', company: 'Acme Corp', need: 'Branding / Identidad de marca' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '40px 25px', maxWidth: '560px', margin: '0 auto' }
const brand = { fontSize: '18px', fontWeight: 'bold' as const, letterSpacing: '2px', color: '#1C1917', margin: '0 0 20px' }
const hr = { borderColor: '#E7E0D8', margin: '20px 0' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1C1917', fontFamily: "'Playfair Display', Georgia, serif", margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#57534E', lineHeight: '1.6', margin: '0 0 16px' }
const link = { color: '#C4A265', textDecoration: 'underline' }
const footer = { fontSize: '12px', color: '#A8A29E', margin: '20px 0 0' }
