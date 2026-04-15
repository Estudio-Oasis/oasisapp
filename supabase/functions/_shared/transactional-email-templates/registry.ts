/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as quoteSent } from './quote-sent.tsx'
import { template as contactConfirmation } from './contact-confirmation.tsx'
import { template as contactInternal } from './contact-internal.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'quote-sent': quoteSent,
  'contact-confirmation': contactConfirmation,
  'contact-internal': contactInternal,
}
