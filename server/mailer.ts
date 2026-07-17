import nodemailer from 'nodemailer';

export function isMailConfigured(): boolean {
  const host = process.env.SMTP_HOST || '';
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  return !!(host && user && pass);
}

export async function sendVerificationEmail(toEmail: string, name: string, code: string) {
  const smtpHost = process.env.SMTP_HOST || '';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpSecure = process.env.SMTP_SECURE === 'true'; // true for port 465, false for other ports
  const smtpUser = process.env.SMTP_USER || '';
  const smtpPass = process.env.SMTP_PASS || '';
  const smtpFrom = process.env.SMTP_FROM || smtpUser || '"DevFint Security" <noreply@devfint.com>';

  if (!isMailConfigured()) {
    console.warn('⚠️ SMTP mail configuration is incomplete. Missing SMTP_HOST, SMTP_USER, or SMTP_PASS. Email will be simulated.');
    throw new Error('SMTP credentials are not configured in your environment variables.');
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    // Adding reasonable timeouts so the server doesn't hang on bad configurations
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000,
  });

  const mailOptions = {
    from: smtpFrom,
    to: toEmail,
    subject: `🔐 Verify Your DevFint Account - Code: ${code}`,
    html: `
      <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 30px 20px; background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 25px;">
          <div style="display: inline-block; padding: 12px; background-color: #2563eb; border-radius: 12px; margin-bottom: 8px;">
            <span style="font-size: 24px; color: #ffffff; font-weight: bold;">DF</span>
          </div>
          <h1 style="color: #0f172a; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">DevFint</h1>
          <p style="color: #64748b; font-size: 13px; margin-top: 4px; margin-bottom: 0;">Personal Wealth Management Platform</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          <h2 style="color: #0f172a; font-size: 18px; font-weight: 700; margin-top: 0; margin-bottom: 12px;">Security Verification Code</h2>
          <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-bottom: 20px; margin-top: 0;">
            Hello <strong>${name}</strong>,<br/>
            Thank you for registering with DevFint. To complete your account authorization and activate your personal finance dashboard, please verify your email address using the secure code below:
          </p>
          
          <div style="background-color: #f1f5f9; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 20px; border: 1px dashed #cbd5e1;">
            <span style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 36px; font-weight: 800; letter-spacing: 0.15em; color: #2563eb;">${code}</span>
            <p style="color: #64748b; font-size: 11px; margin-top: 8px; margin-bottom: 0; font-weight: 500;">Valid for 15 minutes. Never share this security key with anyone.</p>
          </div>
          
          <p style="color: #475569; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
            If you did not initiate this sign-up process, you can safely disregard this message or contact support if you suspect unauthorized access.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 25px; color: #94a3b8; font-size: 11px; line-height: 1.4;">
          <p style="margin: 0; font-weight: 600;">DevFint Inc.</p>
          <p style="margin: 2px 0 0 0;">Secure Automated Communication Engine • Do not reply directly to this mail.</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`📧 SUCCESS: Real-time verification email sent successfully to ${toEmail}`);
}
