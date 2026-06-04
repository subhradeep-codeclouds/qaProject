import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendOtpEmail(name: string, otp: string) {
  await resend.emails.send({
    from:    'onboarding@resend.dev',
    to:      process.env.RESEND_TO_EMAIL!,
    subject: 'QADesk — Your verification OTP',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px;">
        <h2 style="color:#7c3aed;margin-bottom:8px;">Welcome to QADesk! 🎉</h2>
        <p style="color:#475569;">Hi ${name}, use the OTP below to verify your email. It expires in <strong>10 minutes</strong>.</p>
        <div style="margin:32px 0;text-align:center;">
          <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#1e293b;background:#e0e7ff;padding:16px 28px;border-radius:12px;">${otp}</span>
        </div>
        <p style="color:#94a3b8;font-size:13px;">If you didn't register on QADesk, ignore this email.</p>
      </div>
    `,
  })
}
