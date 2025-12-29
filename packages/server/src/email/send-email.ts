import { Resend } from "resend";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY!);

  await resend.emails.send({
    from: process.env.RESEND_SENDER_EMAIL!,
    to,
    subject,
    html,
  });
}

export async function sendVerificationEmail({
  to,
  url,
}: {
  to: string;
  url: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; max-width: 100%;">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">Verify Your Email</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                      Thank you for signing up! We're excited to have you on board.
                    </p>
                    <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                      To complete your registration and access your account, please verify your email address by clicking the button below:
                    </p>
                    
                    <!-- Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 10px 0 30px;">
                          <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); transition: transform 0.2s;">
                            Verify Email Address
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      Or copy and paste this link into your browser:
                    </p>
                    <p style="margin: 0 0 30px; color: #667eea; font-size: 14px; line-height: 1.6; word-break: break-all;">
                      ${url}
                    </p>
                    
                    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
                      <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
                        If you didn't create an account, you can safely ignore this email.
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  await sendEmail({
    to,
    subject: "Verify your email address",
    html,
  });
}

export async function sendPasswordResetEmail({
  to,
  url,
}: {
  to: string;
  url: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; max-width: 100%;">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">Reset Your Password</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                      We received a request to reset your password.
                    </p>
                    <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                      Click the button below to choose a new password for your account:
                    </p>
                    
                    <!-- Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 10px 0 30px;">
                          <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); transition: transform 0.2s;">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      Or copy and paste this link into your browser:
                    </p>
                    <p style="margin: 0 0 30px; color: #667eea; font-size: 14px; line-height: 1.6; word-break: break-all;">
                      ${url}
                    </p>
                    
                    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
                      <p style="margin: 0 0 10px; color: #9ca3af; font-size: 13px; line-height: 1.6;">
                        If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                      </p>
                      <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
                        This link will expire in 1 hour for security reasons.
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  await sendEmail({
    to,
    subject: "Reset your password",
    html,
  });
}
