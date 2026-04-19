import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendResetPasswordEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/redefinir-senha?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || '"EverNOW" <noreply@evernow.com.br>',
    to: email,
    subject: "Recuperação de Senha - EverNOW",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Recuperação de Senha</h2>
        <p>Você solicitou a redefinição de sua senha no EverNOW.</p>
        <p>Clique no botão abaixo para escolher uma nova senha:</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; rounded: 8px; font-weight: bold;">
            Redefinir Minha Senha
          </a>
        </div>
        <p>Este link expirará em 1 hora.</p>
        <p>Se você não solicitou isso, ignore este e-mail.</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6b7280;">Equipe EverNOW</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
    // In development, we log the link so the dev can use it even without SMTP
    if (process.env.NODE_ENV === "development") {
      console.log("DEBUG: Reset Link:", resetUrl);
    }
    throw new Error("Falha ao enviar e-mail de recuperação.");
  }
}
