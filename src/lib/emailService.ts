import { sendEmail } from './resend';
import { createAdminClient } from './supabase/server';

export type EmailTemplate =
  | 'welcome'
  | 'verification'
  | 'password_reset'
  | 'appeal_received'
  | 'appeal_approved'
  | 'appeal_rejected'
  | 'prompt_removed'
  | 'prompt_warning'
  | 'account_suspended'
  | 'account_reinstated'
  | 'contact_reply'
  | 'admin_notification'
  | 'account_warning'
  | 'account_deactivated'
  | 'account_deletion_requested';

export interface EmailTemplateData {
  welcome: { username: string };
  verification: { username: string; verificationLink: string };
  password_reset: { username: string; resetLink: string };
  appeal_received: { username: string; appealReason: string };
  appeal_approved: { username: string; targetName: string };
  appeal_rejected: { username: string; targetName: string };
  prompt_removed: { username: string; promptTitle: string; reason: string };
  prompt_warning: { username: string; promptTitle: string; reason: string };
  account_suspended: { username: string; reason: string; days?: number };
  account_reinstated: { username: string };
  contact_reply: { replyText: string; originalMessage: string };
  admin_notification: { subject: string; alertText: string };
  account_warning: { username: string; reason: string };
  account_deactivated: { username: string };
  account_deletion_requested: { username: string; deletionDate?: string };
}

// Map templates to content generator
export function getTemplateContent<T extends EmailTemplate>(
  template: T,
  variables: EmailTemplateData[T]
): { subject: string; html: string } {
  let subject = '';
  let html = '';

  const wrapBaseLayout = (body: string) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Inter', -apple-system, sans-serif; background-color: #f9fafb; color: #111827; padding: 24px; margin: 0; }
          .container { max-width: 600px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 32px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { font-size: 20px; font-weight: 800; color: #4f46e5; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.05em; }
          .footer { font-size: 11px; color: #6b7280; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px; }
          .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; margin-top: 16px; font-size: 14px; }
          blockquote { border-left: 4px solid #e5e7eb; padding-left: 16px; font-style: italic; color: #4b5563; margin: 16px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">Prizom</div>
          <div>${body}</div>
          <div class="footer">
            This email was sent by Prizom. If you have any questions, contact support.<br/>
            &copy; ${new Date().getFullYear()} Prizom. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  switch (template) {
    case 'welcome': {
      const { username } = variables as EmailTemplateData['welcome'];
      subject = 'Welcome to Prizom!';
      html = wrapBaseLayout(`
        <h3>Hello ${username},</h3>
        <p>Welcome to Prizom — the open collaborative registry for AI prompts! We are thrilled to have you here.</p>
        <p>Discover, copy, and dynamically remix prompt engineering masterpieces, build your creator profile, and save your prompt configurations.</p>
        <a href="https://prizom.in/discover" class="btn">Discover Prompts</a>
      `);
      break;
    }
    case 'verification': {
      const { username, verificationLink } = variables as EmailTemplateData['verification'];
      subject = 'Verify your Prizom email address';
      html = wrapBaseLayout(`
        <h3>Hello ${username},</h3>
        <p>Please click the button below to verify your email address and activate your Prizom account.</p>
        <a href="${verificationLink}" class="btn">Verify Email Address</a>
        <p style="margin-top: 24px; font-size: 12px; color: #6b7280;">If the button above does not work, copy and paste the link below into your browser:<br/>${verificationLink}</p>
      `);
      break;
    }
    case 'password_reset': {
      const { username, resetLink } = variables as EmailTemplateData['password_reset'];
      subject = 'Reset your Prizom password';
      html = wrapBaseLayout(`
        <h3>Hello ${username},</h3>
        <p>We received a request to reset the password for your Prizom account. Click the button below to secure your account.</p>
        <a href="${resetLink}" class="btn">Reset Password</a>
        <p style="margin-top: 24px; font-size: 12px; color: #6b7280;">If you did not request this, you can ignore this email safely. The link is valid for 24 hours.</p>
      `);
      break;
    }
    case 'appeal_received': {
      const { username, appealReason } = variables as EmailTemplateData['appeal_received'];
      subject = 'Prizom Suspension Appeal Received';
      html = wrapBaseLayout(`
        <h3>Hello ${username},</h3>
        <p>We have received your suspension appeal request.</p>
        <p>Our moderation team will review the details and respond as soon as possible.</p>
        <blockquote>
          "${appealReason}"
        </blockquote>
        <p>Team Prizom</p>
      `);
      break;
    }
    case 'appeal_approved': {
      const { username, targetName } = variables as EmailTemplateData['appeal_approved'];
      subject = `Prizom Appeal Approved: ${targetName}`;
      html = wrapBaseLayout(`
        <h3>Hello ${username},</h3>
        <p>Good news! Your appeal regarding <strong>${targetName}</strong> has been approved.</p>
        <p>The content/account has been fully restored and is visible publicly again. Thank you for your patience.</p>
        <p>Team Prizom</p>
      `);
      break;
    }
    case 'appeal_rejected': {
      const { username, targetName } = variables as EmailTemplateData['appeal_rejected'];
      subject = `Prizom Appeal Rejected: ${targetName}`;
      html = wrapBaseLayout(`
        <h3>Hello ${username},</h3>
        <p>We have reviewed your appeal regarding <strong>${targetName}</strong> and regret to inform you that it has been rejected.</p>
        <p>The content will remain hidden or the account suspended according to the platform moderation rules.</p>
        <p>Team Prizom</p>
      `);
      break;
    }
    case 'prompt_removed': {
      const { username, promptTitle, reason } = variables as EmailTemplateData['prompt_removed'];
      subject = `Prizom Content Action Notice: "${promptTitle}" Removed`;
      html = wrapBaseLayout(`
        <h3>Hello ${username},</h3>
        <p>Your prompt "<strong>${promptTitle}</strong>" has been removed due to a community guidelines policy violation.</p>
        <p><strong>Moderator Reason:</strong> ${reason}</p>
        <p>You have 15 days to appeal this decision from your creator profile dashboard under "Removed Content". If no appeal is submitted, the prompt will be permanently deleted.</p>
        <p>Team Prizom</p>
      `);
      break;
    }
    case 'prompt_warning': {
      const { username, promptTitle, reason } = variables as EmailTemplateData['prompt_warning'];
      subject = `Content Warning Alert: "${promptTitle}"`;
      html = wrapBaseLayout(`
        <h3>Hello ${username},</h3>
        <p>Your prompt "<strong>${promptTitle}</strong>" has received a safety warning for guidelines violations.</p>
        <p><strong>Moderator Alert:</strong> ${reason}</p>
        <p>No account suspension was issued, but please review the content guidelines to keep your account in good standing.</p>
        <p>Team Prizom</p>
      `);
      break;
    }
    case 'account_suspended': {
      const { username, reason, days = 15 } = variables as EmailTemplateData['account_suspended'];
      const isPermanent = days >= 365;
      subject = isPermanent ? 'Your Prizom Account Has Been Permanently Banned' : 'Prizom Account Suspension Notice';
      html = wrapBaseLayout(`
        <h3>Hello ${username},</h3>
        <p>Your Prizom account has been ${isPermanent ? '<strong>permanently banned</strong>' : `suspended for <strong>${days} days</strong>`} due to a violation of our community guidelines.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        ${isPermanent ? '<p>You will no longer be able to access your account, create prompts, or appeal this decision.</p>' : `<p>You can appeal this decision from the Prizom platform. If no appeal is submitted and approved within ${days} days, your account will be permanently deleted.</p>`}
        <p>Team Prizom</p>
      `);
      break;
    }
    case 'account_warning': {
      const { username, reason } = variables as EmailTemplateData['account_warning'];
      subject = 'Prizom Account Warning Notice';
      html = wrapBaseLayout(`
        <h3>Hello ${username},</h3>
        <p>Your account has received a warning alert for community guidelines violations.</p>
        <p><strong>Moderator Alert:</strong> ${reason}</p>
        <p>Please review our terms and guidelines to avoid future restrictions or suspension.</p>
        <p>Team Prizom</p>
      `);
      break;
    }
    case 'account_reinstated': {
      const { username } = variables as EmailTemplateData['account_reinstated'];
      subject = 'Your Prizom Account Has Been Reinstated';
      html = wrapBaseLayout(`
        <h3>Hello ${username},</h3>
        <p>Good news! Your Prizom account has been fully reinstated.</p>
        <p>You can now log in and use the platform normally. Welcome back!</p>
        <p>Team Prizom</p>
      `);
      break;
    }
    case 'contact_reply': {
      const { replyText, originalMessage } = variables as EmailTemplateData['contact_reply'];
      subject = 'Reply from Prizom Support';
      html = wrapBaseLayout(`
        <p>${replyText.replace(/\n/g, '<br/>')}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 12px; color: #6b7280;"><strong>Your Original Message:</strong><br/>${originalMessage.replace(/\n/g, '<br/>')}</p>
      `);
      break;
    }
    case 'admin_notification': {
      const { subject: alertSubj, alertText } = variables as EmailTemplateData['admin_notification'];
      subject = `Prizom System Alert: ${alertSubj}`;
      html = wrapBaseLayout(`
        <h3>System Notification</h3>
        <p style="color: #ef4444; font-weight: bold;">Alert details:</p>
        <div style="background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 16px; font-family: monospace; font-size: 13px; color: #991b1b; white-space: pre-wrap;">${alertText}</div>
      `);
      break;
    }
    case 'account_deactivated': {
      const { username } = variables as EmailTemplateData['account_deactivated'];
      subject = 'Your Prizom Account Has Been Deactivated';
      html = wrapBaseLayout(`
        <h3>Hello ${username},</h3>
        <p>This email confirms that your Prizom account has been temporarily deactivated, as per your request.</p>
        <p>Your profile, prompts, and rankings are now hidden from the community. Don't worry—none of your data has been deleted.</p>
        <p><strong>Want to return?</strong> Simply log back into your Prizom account at any time, and you will be prompted to reactivate your account instantly.</p>
        <p>Team Prizom</p>
      `);
      break;
    }
    case 'account_deletion_requested': {
      const { username, deletionDate } = variables as EmailTemplateData['account_deletion_requested'];
      const displayDate = deletionDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toDateString();
      subject = 'Prizom Account Deletion Scheduled (15-Day Recovery Window)';
      html = wrapBaseLayout(`
        <h3>Hello ${username},</h3>
        <p>We received your request to permanently delete your Prizom account.</p>
        <p>Your profile and prompts have been hidden immediately. Your account is scheduled for permanent deletion on <strong>${displayDate}</strong> (15 days from now).</p>
        <p><strong>Changed your mind?</strong> If you want to cancel the deletion, simply log back into your account before the 15-day window expires. You will see a banner allowing you to cancel the scheduled deletion and restore your account instantly.</p>
        <p>After 15 days, all of your profile data, prompts, likes, saves, collections, and Cloudinary media assets will be permanently and irreversibly purged from our systems.</p>
        <p>Team Prizom</p>
      `);
      break;
    }
  }

  return { subject, html };
}

export async function dispatchEmail<T extends EmailTemplate>(
  recipient: string,
  template: T,
  variables: EmailTemplateData[T]
) {
  const { subject, html } = getTemplateContent(template, variables);
  const supabase = await createAdminClient();

  // 1. Insert pending log
  const { data: log, error: logError } = await supabase
    .from('email_logs')
    .insert({
      recipient,
      template,
      status: 'pending',
      provider: 'resend',
      subject,
      html_content: html,
      retry_count: 0
    })
    .select('id')
    .single();

  if (logError) {
    console.error('Failed to log email to email_logs:', logError.message);
  }

  const logId = log?.id;

  // 2. Try sending
  const res = await sendEmail({ to: recipient, subject, html });

  if (res.success) {
    // 3. Update to sent
    if (logId) {
      await supabase
        .from('email_logs')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', logId);
    }
    return { success: true, messageId: res.messageId };
  } else {
    // 4. Update to failed and schedule retry
    const nextRetry = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes (2^1 minutes)
    if (logId) {
      await supabase
        .from('email_logs')
        .update({
          status: 'failed',
          error: res.error || 'Unknown error',
          next_retry_at: nextRetry.toISOString(),
          retry_count: 1
        })
        .eq('id', logId);
    }
    return { success: false, error: res.error };
  }
}

export async function runEmailRetryQueue() {
  const supabase = await createAdminClient();
  const now = new Date().toISOString();

  // Find all failed emails where retry_count < 3 and next_retry_at <= now
  const { data: failedEmails, error } = await supabase
    .from('email_logs')
    .select('*')
    .eq('status', 'failed')
    .lt('retry_count', 3)
    .lte('next_retry_at', now);

  if (error) {
    console.error('Error fetching failed emails for retry queue:', error.message);
    return { success: false, error: error.message };
  }

  const results = [];

  for (const log of failedEmails) {
    const nextRetryCount = log.retry_count + 1;
    // Calculate exponential backoff: 2^nextRetryCount minutes
    const backoffMinutes = Math.pow(2, nextRetryCount);
    const nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString();

    const res = await sendEmail({
      to: log.recipient,
      subject: log.subject || 'Prizom Notification',
      html: log.html_content || ''
    });

    if (res.success) {
      await supabase
        .from('email_logs')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          error: null
        })
        .eq('id', log.id);

      results.push({ id: log.id, status: 'sent' });
    } else {
      await supabase
        .from('email_logs')
        .update({
          retry_count: nextRetryCount,
          next_retry_at: nextRetryAt,
          error: res.error || 'Retry attempt failed'
        })
        .eq('id', log.id);

      results.push({ id: log.id, status: 'failed', retry_count: nextRetryCount, error: res.error });
    }
  }

  return { success: true, processed: results.length, details: results };
}
