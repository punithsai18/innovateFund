import nodemailer from "nodemailer";

// Lazy singleton transporter (so we don't recreate for every email)
let cachedTransporter = null;

const createTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS; // allow either var name

  if (!user || !pass) {
    console.warn(
      "[emailService] EMAIL_USER / EMAIL_PASSWORD not set. Emails will be skipped."
    );
    cachedTransporter = null;
    return null;
  }

  // Using Gmail service (requires App Password & 2FA). For other providers, set host/port/secure explicitly.
  cachedTransporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: { user, pass },
  });

  // Optional verify (non-blocking)
  cachedTransporter
    .verify()
    .then(() => {
      console.log("[emailService] Transporter verified and ready.");
    })
    .catch((err) => {
      console.error(
        "[emailService] Transporter verification failed:",
        err.message
      );
    });

  return cachedTransporter;
};

// Email templates
const templates = {
  notification: (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; text-align: center;">InnovateFund</h1>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-bottom: 20px;">Hi ${
          data.recipientName
        },</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #495057; margin-top: 0;">${data.title}</h3>
          <p style="color: #6c757d; line-height: 1.6; margin: 0;">${
            data.message
          }</p>
        </div>
        
        ${
          data.actionUrl
            ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.actionUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Details
            </a>
          </div>
        `
            : ""
        }
        
        <div style="border-top: 1px solid #dee2e6; padding-top: 20px; margin-top: 30px; color: #6c757d; font-size: 14px;">
          <p>This notification was sent from InnovateFund. If you no longer wish to receive these emails, you can update your preferences in your account settings.</p>
        </div>
      </div>
    </div>
  `,

  welcome: (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; text-align: center;">Welcome to InnovateFund!</h1>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-bottom: 20px;">Hi ${data.name},</h2>
        
        <p style="color: #495057; line-height: 1.6;">Thank you for joining InnovateFund, where innovation meets investment!</p>
        
        <p style="color: #495057; line-height: 1.6;">As ${
          data.userType === "innovator" ? "an innovator" : "an investor"
        }, you're now part of a community that's shaping the future through collaboration and funding.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #495057; margin-top: 0;">Get Started:</h3>
          <ul style="color: #6c757d; line-height: 1.6;">
            ${
              data.userType === "innovator"
                ? `
              <li>Complete your profile to attract investors</li>
              <li>Submit your first innovative idea</li>
              <li>Connect with potential collaborators</li>
              <li>Use our AI assistant for guidance</li>
            `
                : `
              <li>Explore investment opportunities</li>
              <li>Set your investment preferences</li>
              <li>Join sector-specific investor rooms</li>
              <li>Connect with innovators</li>
            `
            }
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${
            process.env.FRONTEND_URL || "http://localhost:5173"
          }" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Start Exploring
          </a>
        </div>
      </div>
    </div>
  `,
};

export const sendEmail = async ({ to, subject, template, data }) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      // Skip silently if no config; still resolve for caller
      return { skipped: true, reason: "Email credentials not configured" };
    }

    if (!templates[template]) {
      throw new Error(`Unknown email template: ${template}`);
    }

    if (!to) {
      throw new Error("Recipient email (to) is required");
    }

    const fromAddress =
      process.env.EMAIL_FROM || `"InnovateFund" <${process.env.EMAIL_USER}>`;

    const mailOptions = {
      from: fromAddress,
      to,
      subject,
      html: templates[template](data || {}),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("[emailService] Email sent:", info.messageId, "to", to);
    return info;
  } catch (error) {
    console.error("[emailService] Email sending error:", error.message);
    return { error: true, message: error.message };
  }
};

export const sendWelcomeEmail = async (user) => {
  if (!user?.email) return;
  const res = await sendEmail({
    to: user.email,
    subject: "Welcome to InnovateFund!",
    template: "welcome",
    data: {
      name: user.name,
      userType: user.userType,
    },
  });
  if (res?.skipped) {
    console.log("[emailService] Welcome email skipped:", res.reason);
  }
};
