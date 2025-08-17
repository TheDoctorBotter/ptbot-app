import { Resend } from 'resend';

interface VerificationEmailData {
  to: string;
  firstName: string;
  verificationToken: string;
  appUrl: string;
}

interface WelcomeEmailData {
  to: string;
  firstName: string;
}

export class EmailService {
  private resend: Resend;
  private fromEmail: string;
  private fromName: string;

  constructor(apiKey: string, fromEmail: string = 'noreply@justinlemmodpt.com', fromName: string = 'PTBot Team') {
    this.resend = new Resend(apiKey);
    this.fromEmail = fromEmail;
    this.fromName = fromName;
  }

  async sendVerificationEmail(data: VerificationEmailData): Promise<boolean> {
    try {
      console.log('📧 Sending verification email with Resend...', {
        to: data.to,
        from: `${this.fromName} <${this.fromEmail}>`,
        hasApiKey: !!this.resend,
        verificationUrl: `${data.appUrl}/verify-email?token=${data.verificationToken}`
      });
      
      const verificationUrl = `${data.appUrl}/verify-email?token=${data.verificationToken}`;
      
      const { error } = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: data.to,
        subject: 'Verify Your PTBot Account',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Verify Your PTBot Account</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #2563EB, #1D4ED8); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to PTBot!</h1>
                <p style="color: #BFDBFE; margin: 10px 0 0 0; font-size: 16px;">Your Virtual Physical Therapy Assistant</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
                <h2 style="color: #2563EB; margin-top: 0;">Hi ${data.firstName}!</h2>
                <p>Thank you for creating your PTBot account. To get started with your personalized physical therapy journey, please verify your email address.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${verificationUrl}" 
                     style="background: #2563EB; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                    Verify My Email
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #666;">
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  <a href="${verificationUrl}" style="color: #2563EB; word-break: break-all;">${verificationUrl}</a>
                </p>
              </div>
              
              <div style="background: #EBF4FF; padding: 20px; border-radius: 8px; border-left: 4px solid #2563EB;">
                <h3 style="color: #2563EB; margin-top: 0;">What's Next?</h3>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>Complete your symptom assessment</li>
                  <li>Get personalized exercise recommendations</li>
                  <li>Track your recovery progress</li>
                  <li>Chat with PTBot for guidance</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #999;">
                  This verification link will expire in 24 hours.<br>
                  If you didn't create this account, please ignore this email.
                </p>
                <p style="font-size: 12px; color: #999;">
                  © 2025 PTBot - Your Virtual Physical Therapy Assistant
                </p>
              </div>
            </body>
          </html>
        `,
      });

      if (error) {
        console.error('❌ Resend API error:', {
          error,
          message: error.message,
          name: error.name
        });
        return false;
      }

      console.log('✅ Email sent successfully via Resend API');
      return true;
    } catch (error) {
      console.error('❌ Email service exception:', {
        error: error.message,
        stack: error.stack,
        apiKeyConfigured: !!this.resend
      });
      return false;
    }
  }

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    try {
      const { error } = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: data.to,
        subject: 'Welcome to PTBot - Your Recovery Journey Starts Now!',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Welcome to PTBot</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Account Verified!</h1>
                <p style="color: #A7F3D0; margin: 10px 0 0 0; font-size: 16px;">Welcome to PTBot, ${data.firstName}!</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
                <h2 style="color: #10B981; margin-top: 0;">Your Recovery Journey Starts Now</h2>
                <p>Your email has been successfully verified! You now have full access to all PTBot features:</p>
                
                <div style="margin: 25px 0;">
                  <div style="display: flex; align-items: center; margin-bottom: 15px;">
                    <span style="background: #10B981; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 12px;">✓</span>
                    <strong>AI-Powered Chat</strong> - Get instant answers about your symptoms
                  </div>
                  <div style="display: flex; align-items: center; margin-bottom: 15px;">
                    <span style="background: #10B981; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 12px;">✓</span>
                    <strong>Symptom Assessment</strong> - Track your condition with detailed evaluations
                  </div>
                  <div style="display: flex; align-items: center; margin-bottom: 15px;">
                    <span style="background: #10B981; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 12px;">✓</span>
                    <strong>Exercise Library</strong> - Access professional PT exercises
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background: #10B981; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 12px;">✓</span>
                    <strong>Progress Tracking</strong> - Monitor your recovery over time
                  </div>
                </div>
              </div>
              
              <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; border-left: 4px solid #F59E0B; margin-bottom: 25px;">
                <h3 style="color: #92400E; margin-top: 0;">🏥 Texas Residents</h3>
                <p style="color: #92400E; margin: 0;">
                  You can book virtual consultations with Dr. Justin Lemmo, PT, DPT for personalized treatment plans!
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #999;">
                  © 2025 PTBot - Your Virtual Physical Therapy Assistant
                </p>
              </div>
            </body>
          </html>
        `,
      });

      if (error) {
        console.error('Welcome email error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(to: string, firstName: string, resetToken: string, appUrl: string): Promise<boolean> {
    try {
      const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;
      
      const { error } = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to,
        subject: 'Reset Your PTBot Password',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Reset Your PTBot Password</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #EF4444, #DC2626); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🔒 Password Reset</h1>
                <p style="color: #FECACA; margin: 10px 0 0 0; font-size: 16px;">PTBot Account Security</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
                <h2 style="color: #EF4444; margin-top: 0;">Hi ${firstName},</h2>
                <p>We received a request to reset your PTBot account password. Click the button below to create a new password:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" 
                     style="background: #EF4444; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                    Reset My Password
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #666;">
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  <a href="${resetUrl}" style="color: #EF4444; word-break: break-all;">${resetUrl}</a>
                </p>
              </div>
              
              <div style="background: #FEE2E2; padding: 20px; border-radius: 8px; border-left: 4px solid #EF4444;">
                <h3 style="color: #DC2626; margin-top: 0;">⚠️ Security Notice</h3>
                <ul style="margin: 0; padding-left: 20px; color: #DC2626;">
                  <li>This link will expire in 1 hour</li>
                  <li>If you didn't request this reset, ignore this email</li>
                  <li>Your current password remains unchanged until you create a new one</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #999;">
                  © 2025 PTBot - Your Virtual Physical Therapy Assistant
                </p>
              </div>
            </body>
          </html>
        `,
      });

      if (error) {
        console.error('Password reset email error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }
}

// Utility function to generate verification tokens
export const generateVerificationToken = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Utility function to validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};