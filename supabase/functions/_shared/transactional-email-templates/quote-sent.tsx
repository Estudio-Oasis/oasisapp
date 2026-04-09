import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'OasisOS'

interface QuoteSentProps {
  contactName?: string
  quoteTitle?: string
  quoteNumber?: string
  totalAmount?: string
  currency?: string
  validUntil?: string
  senderName?: string
  agencyName?: string
  approvalUrl?: string
  message?: string
}

const QuoteSentEmail = ({
  contactName,
  quoteTitle,
  quoteNumber,
  totalAmount,
  currency,
  validUntil,
  senderName,
  agencyName,
  approvalUrl,
  message,
}: QuoteSentProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Cotización: {quoteTitle || 'Nueva cotización'}</Preview>
    <Body style={main}>
      <Container style={container}>
        {agencyName && (
          <Text style={agencyLabel}>{agencyName}</Text>
        )}
        <Heading style={h1}>
          {contactName ? `Hola ${contactName},` : 'Hola,'}
        </Heading>
        <Text style={text}>
          {message || `Te compartimos la cotización ${quoteNumber ? `#${quoteNumber}` : ''} para "${quoteTitle || 'tu proyecto'}".`}
        </Text>

        <Section style={summaryBox}>
          <Text style={summaryLabel}>Cotización</Text>
          <Text style={summaryValue}>{quoteTitle || '—'}</Text>
          <Hr style={divider} />
          <Text style={summaryLabel}>Total</Text>
          <Text style={summaryTotal}>{totalAmount ? `$${totalAmount}` : '—'} {currency || 'USD'}</Text>
          {validUntil && (
            <>
              <Hr style={divider} />
              <Text style={summaryLabel}>Válida hasta</Text>
              <Text style={summaryValue}>{validUntil}</Text>
            </>
          )}
        </Section>

        {approvalUrl && (
          <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
            <Button style={ctaButton} href={approvalUrl}>
              Ver cotización y aprobar
            </Button>
          </Section>
        )}

        <Text style={text}>
          Quedo atento a tus comentarios.
        </Text>
        <Text style={signature}>
          {senderName || 'El equipo'}
          {agencyName ? `\n${agencyName}` : ''}
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: QuoteSentEmail,
  subject: (data: Record<string, any>) =>
    `Cotización: ${data.quoteTitle || 'Nueva cotización'}${data.agencyName ? ` — ${data.agencyName}` : ''}`,
  displayName: 'Cotización enviada',
  previewData: {
    contactName: 'María García',
    quoteTitle: 'Rediseño de sitio web',
    quoteNumber: 'COT-2026-001',
    totalAmount: '15,000',
    currency: 'MXN',
    validUntil: '15 de mayo de 2026',
    senderName: 'Carlos López',
    agencyName: 'Estudio Oasis',
    approvalUrl: 'https://oasisapp.lovable.app/q/sample-token',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '32px 24px', maxWidth: '520px', margin: '0 auto' }
const agencyLabel = { fontSize: '11px', fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: '1px', color: '#C4A265', margin: '0 0 24px' }
const h1 = { fontSize: '20px', fontWeight: '600' as const, color: '#1A1A1A', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#555555', lineHeight: '1.6', margin: '0 0 16px' }
const summaryBox = { backgroundColor: '#FAF7F2', borderRadius: '8px', padding: '20px', margin: '16px 0' }
const summaryLabel = { fontSize: '10px', fontWeight: '600' as const, textTransform: 'uppercase' as const, letterSpacing: '0.5px', color: '#999999', margin: '0 0 4px' }
const summaryValue = { fontSize: '14px', fontWeight: '500' as const, color: '#1A1A1A', margin: '0 0 12px' }
const summaryTotal = { fontSize: '22px', fontWeight: '700' as const, color: '#1A1A1A', margin: '0 0 4px' }
const divider = { borderColor: '#E8DDD0', margin: '12px 0' }
const ctaButton = { backgroundColor: '#C4A265', color: '#ffffff', fontSize: '14px', fontWeight: '600' as const, padding: '12px 28px', borderRadius: '6px', textDecoration: 'none' }
const signature = { fontSize: '13px', color: '#888888', lineHeight: '1.5', margin: '24px 0 0', whiteSpace: 'pre-line' as const }
