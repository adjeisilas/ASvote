import { Resend } from "resend";
import dotenv from "dotenv";
import { supabase } from "./supabase";

dotenv.config();

let resendClient: Resend | null = null;

const getResend = () => {
  if (!resendClient) {
    const key = process.env.RESEND_API_KEY;
    if (!key) return null;
    resendClient = new Resend(key);
  }
  return resendClient;
};

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'ASVote <onboarding@resend.dev>';

const isSupabaseConfigured = () => {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return !!(url && key && url.startsWith('http'));
};

export const sendTicketEmail = async (email: string, eventTitle: string, nomineeName: string | undefined, tickets: any[]) => {
  const resend = getResend();
  
  if (!resend) {
    console.warn("RESEND_API_KEY is missing. Ticket email delivery skipped.");
    return;
  }

  try {
    const ticketHtml = tickets.map((t, idx) => `
      <div style="border: 2px solid #4f46e5; border-radius: 12px; padding: 20px; margin-bottom: 20px; font-family: sans-serif; background-color: #ffffff;">
        <h3 style="color: #4f46e5; margin-top: 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Ticket #${idx + 1}</h3>
        <p style="margin: 10px 0;"><strong>Event:</strong> ${eventTitle}</p>
        <p style="margin: 10px 0;"><strong>Tier:</strong> ${nomineeName || 'General'}</p>
        <p style="margin: 10px 0;"><strong>Attendee:</strong> ${t.ticket_holder_name || 'Valued Guest'}</p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0; border: 1px solid #e2e8f0;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${t.qr_code}" alt="QR Code" style="margin-bottom: 15px; border: 4px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" />
          <div style="font-family: monospace; font-size: 18px; font-weight: bold; letter-spacing: 3px; color: #1e293b; background: #ffffff; display: inline-block; padding: 5px 15px; border-radius: 6px; border: 1px solid #e2e8f0;">
            ${t.qr_code}
          </div>
        </div>
        <p style="font-size: 12px; color: #64748b; margin-top: 15px; text-align: center; font-style: italic;">Scan this code at the event entrance for verification.</p>
      </div>
    `).join('');

    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Your Digital Tickets for ${eventTitle}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; padding: 40px 20px; border-radius: 20px;">
          <div style="background-color: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
            <h1 style="color: #1e293b; margin-top: 0; font-size: 24px; font-weight: 800; tracking: tight;">Your Tickets are Ready!</h1>
            <p style="color: #475569; line-height: 1.6; font-size: 16px;">Thank you for your purchase. We've secured your spots for <strong>${eventTitle}</strong>. Below are your unique digital tickets.</p>
            <div style="margin-top: 30px;">
              ${ticketHtml}
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="color: #64748b; font-size: 14px;">Need help? Contact the organizer directly or reply to this email.</p>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">&copy; ${new Date().getFullYear()} ASVote Ticketing System</p>
            </div>
          </div>
        </div>
      `,
    });

    if (response.error) {
      throw response.error;
    }
  } catch (err: any) {
    console.error("Failed to send ticket email:", err);
    
    // Submit in-app helpful error reports for diagnostics only if Supabase is fully configured
    if (isSupabaseConfigured()) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        if (profile) {
          await supabase.from('notifications').insert([{
            user_id: profile.id,
            title: 'Email Delivery Issue 🎟️',
            message: `We secured your tickets for "${eventTitle}", but couldn't send the email dispatch to ${email}. Error: ${err.message || JSON.stringify(err)}. You can download your digital passes on-screen!`,
            type: 'error',
            read: false
          }]);
        }

        // Notify developer admin about exact API failure
        const { data: admin } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', 'adjeisikapasilas@gmail.com')
          .maybeSingle();

        if (admin && (!profile || admin.id !== profile.id)) {
          await supabase.from('notifications').insert([{
            user_id: admin.id,
            title: 'Resend Email API Failure 🚨',
            message: `Could not send ticket email to ${email} for "${eventTitle}". Resend API Error: ${err.message || JSON.stringify(err)}. If in sandbox, ensure target email is verified on Resend!`,
            type: 'error',
            read: false
          }]);
        }
      } catch (logErr: any) {
        console.error("Failed to insert email failure notifications:", logErr.message || logErr);
      }
    }
  }
};

export const sendSupportEmail = async (name: string, email: string, subject: string, message: string) => {
  const resend = getResend();
  const adminEmail = 'adjeisikapasilas@gmail.com';

  if (!resend) {
    console.warn("RESEND_API_KEY is missing. Support email delivery skipped.");
    return;
  }

  try {
    // 1. Send support notice to Admin
    await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `[Support Ticket] ${subject}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: sans-serif; background-color: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <h2 style="color: #4f46e5; margin-top: 0;">New Support Ticket!</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Reply-To/Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 15px; font-style: italic;">
            ${message.replace(/\n/g, '<br />')}
          </div>
          <p style="font-size: 11px; color: #94a3b8; margin-top: 25px;">ASVote Help Desk System &bull; Sent automatically</p>
        </div>
      `
    });

    // 2. Send auto-responder guarantee to User
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Support Ticket Received: ${subject}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: sans-serif; background-color: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <h2 style="color: #4f46e5; margin-top: 0;">Support Ticket Registered!</h2>
          <p>Hi ${name},</p>
          <p>We have successfully registered your support ticket at our help desk. Our team reads every submission and we will contact you shortly.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Your Message:</strong></p>
          <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; font-style: italic; color: #475569;">
            ${message.replace(/\n/g, '<br />')}
          </div>
          <p style="font-size: 12px; color: #64748b; margin-top: 25px;">ASVote Support &bull; Empowering voters & events</p>
        </div>
      `
    });
  } catch (err: any) {
    console.error("Failed to send support email:", err);
  }
};
