import crypto from "crypto";

export const PASSWORD_RESET_SUCCESS_MESSAGE = "Si el correo esta registrado, enviaremos instrucciones para recuperar tu contrasena.";

export function createResetToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashResetToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getPasswordResetUrl(token: string, request?: Request) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    (request ? new URL(request.url).origin : "http://localhost:3000");
  return `${baseUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
}

export async function sendPasswordResetEmail({ to, name, resetUrl }: { to: string; name: string; resetUrl: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[password-reset] RESEND_API_KEY is not configured.");
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "CromoSwap Cuenca <onboarding@resend.dev>",
      to,
      subject: "Recupera tu contrasena de CromoSwap Cuenca",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#19302b">
          <h1 style="font-size:22px;margin:0 0 12px">CromoSwap Cuenca</h1>
          <p>Hola ${escapeEmailHtml(name || "Usuario")},</p>
          <p>Recibimos una solicitud para cambiar tu contrasena. Este enlace expira en 1 hora y solo puede usarse una vez.</p>
          <p>
            <a href="${escapeEmailHtml(resetUrl)}" style="display:inline-block;background:#2f855f;color:#fff;text-decoration:none;padding:12px 16px;border-radius:8px;font-weight:bold">
              Cambiar contrasena
            </a>
          </p>
          <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
        </div>
      `,
      text: `Hola ${name || "Usuario"},\n\nUsa este enlace para cambiar tu contrasena. Expira en 1 hora:\n${resetUrl}\n\nSi no solicitaste este cambio, ignora este correo.`
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[password-reset] Resend error:", response.status, errorText);
  }
}

function escapeEmailHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
