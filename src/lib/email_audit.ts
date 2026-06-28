import { getTemplateContent, EmailTemplate, EmailTemplateData } from './emailService';
import { sendEmail } from './resend';

// Mocks variables for all template variants
const MOCK_TEMPLATE_VARIABLES: EmailTemplateData = {
  welcome: { username: 'TestUserA' },
  verification: { username: 'TestUserA', verificationLink: 'https://prizom.com/verify?token=123' },
  password_reset: { username: 'TestUserA', resetLink: 'https://prizom.com/reset?token=abc' },
  appeal_received: { username: 'TestUserA', appealReason: 'This was a false positive review.' },
  appeal_approved: { username: 'TestUserA', targetName: 'Prompt "Sunset Silhouette"' },
  appeal_rejected: { username: 'TestUserA', targetName: 'Prompt "Sunset Silhouette"' },
  prompt_removed: { username: 'TestUserA', promptTitle: 'Sunset Silhouette', reason: 'Copyright infringement' },
  prompt_warning: { username: 'TestUserA', promptTitle: 'Sunset Silhouette', reason: 'Review tags formatting' },
  account_suspended: { username: 'TestUserA', reason: 'Spamming copy triggers', days: 15 },
  account_reinstated: { username: 'TestUserA' },
  contact_reply: { replyText: 'Thank you for reaching out. We have updated your portal clearance.', originalMessage: 'hey can u activate my portel for moderatuon' },
  admin_notification: { subject: 'Database load warning', alertText: 'High connection volume on pooler' },
  account_warning: { username: 'TestUserA', reason: 'Suspicious guest copy velocity' },
  account_deactivated: { username: 'TestUserA' },
  account_deletion_requested: { username: 'TestUserA', deletionDate: '2026-07-13' }
};

export interface EmailAuditReport {
  success: boolean;
  templatesTested: number;
  passedTemplates: string[];
  failedTemplates: string[];
  resendIntegration: 'SUCCESS' | 'MOCKED' | 'FAILED';
  details: Record<string, { subject: string; length: number; hasPlaceholders: boolean; error?: string }>;
}

export async function runEmailAudit(): Promise<EmailAuditReport> {
  const report: EmailAuditReport = {
    success: true,
    templatesTested: 0,
    passedTemplates: [],
    failedTemplates: [],
    resendIntegration: 'MOCKED',
    details: {}
  };

  const templates = Object.keys(MOCK_TEMPLATE_VARIABLES) as EmailTemplate[];

  for (const template of templates) {
    report.templatesTested++;
    try {
      // 1. Render template
      const vars = MOCK_TEMPLATE_VARIABLES[template];
      const { subject, html } = getTemplateContent(template, vars as any);

      // 2. Validate template content
      if (!subject || subject.trim() === '') {
        throw new Error('Rendered subject is empty');
      }
      if (!html || html.trim() === '') {
        throw new Error('Rendered HTML content is empty');
      }

      // 3. Scan for broken/unresolved template variables (e.g. raw ${variable} showing in output)
      const hasPlaceholders = html.includes('${') || html.includes('undefined') || subject.includes('${') || subject.includes('undefined');
      
      report.details[template] = {
        subject,
        length: html.length,
        hasPlaceholders
      };

      if (hasPlaceholders) {
        throw new Error('Rendered HTML contains unresolved variables or "undefined" markers');
      }

      report.passedTemplates.push(template);
    } catch (err: any) {
      report.success = false;
      report.failedTemplates.push(template);
      report.details[template] = {
        subject: '',
        length: 0,
        hasPlaceholders: true,
        error: err.message
      };
    }
  }

  // 4. Test Resend integration key check
  const resendTest = await sendEmail({
    to: 'test_audit@prizom.com',
    subject: 'Prizom Verification Audit',
    html: '<p>Audit testing email dispatch</p>'
  });

  if (resendTest.success) {
    report.resendIntegration = 'SUCCESS';
  } else if (resendTest.mocked) {
    report.resendIntegration = 'MOCKED';
  } else {
    report.resendIntegration = 'FAILED';
  }

  return report;
}
