// Plantilla del correo transaccional de autenticación (marca Clusly). HTML apto
// para clientes de correo: estilos en línea, tablas, sin fuentes externas ni
// variables CSS. Un solo botón de acción + enlace de respaldo.

export type EmailActionType =
  | "signup"
  | "magiclink"
  | "recovery"
  | "email_change"
  | "invite";

interface Copy {
  subject: string;
  heading: string;
  intro: string;
  cta: string;
  outro: string;
}

function copyFor(type: EmailActionType, name: string): Copy {
  const hi = name ? `Hola ${name},` : "Hola,";
  switch (type) {
    case "recovery":
      return {
        subject: "Restablece tu contraseña · Clusly",
        heading: "Restablece tu contraseña",
        intro: `${hi} recibimos una solicitud para cambiar la contraseña de tu cuenta. Haz clic para elegir una nueva.`,
        cta: "Cambiar contraseña",
        outro: "Si no fuiste tú, ignora este correo: tu contraseña seguirá igual.",
      };
    case "magiclink":
      return {
        subject: "Tu enlace para entrar · Clusly",
        heading: "Entra a Clusly",
        intro: `${hi} usa este enlace para iniciar sesión. Caduca pronto, así que úsalo enseguida.`,
        cta: "Entrar a Clusly",
        outro: "Si no solicitaste este enlace, puedes ignorar este correo.",
      };
    case "email_change":
      return {
        subject: "Confirma tu nuevo correo · Clusly",
        heading: "Confirma tu nuevo correo",
        intro: `${hi} confirma esta dirección para usarla en tu cuenta de Clusly.`,
        cta: "Confirmar correo",
        outro: "Si no pediste este cambio, ignora este correo.",
      };
    case "invite":
      return {
        subject: "Te invitaron a Clusly",
        heading: "Te invitaron a Clusly",
        intro: `${hi} te invitaron a Clusly, el lugar donde la comunidad reúne y vota los mejores videos de tecnología. Activa tu cuenta para empezar.`,
        cta: "Aceptar invitación",
        outro: "Si crees que es un error, puedes ignorar este correo.",
      };
    case "signup":
    default:
      return {
        subject: "Confirma tu cuenta · Clusly",
        heading: "Confirma tu correo",
        intro: `${hi} ¡bienvenido a Clusly! Confirma tu correo para activar tu cuenta y empezar a aportar y votar videos de tecnología.`,
        cta: "Confirmar mi cuenta",
        outro: "Si no creaste esta cuenta, puedes ignorar este correo.",
      };
  }
}

export function renderAuthEmail(opts: {
  type: EmailActionType;
  actionUrl: string;
  name?: string;
}): { subject: string; html: string; text: string } {
  const { type, actionUrl } = opts;
  const name = (opts.name ?? "").trim();
  const c = copyFor(type, name);

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>${c.heading}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0f10;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f10;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#1a1a1c;border-radius:16px;overflow:hidden;border:1px solid #2a2a2e;">
        <tr>
          <td style="height:4px;background:linear-gradient(90deg,#ff6a1a,#ff9a3d);font-size:0;line-height:0;">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding:36px 36px 8px 36px;">
            <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:22px;font-weight:800;letter-spacing:-0.02em;background:linear-gradient(90deg,#ff6a1a,#ff9a3d);-webkit-background-clip:text;background-clip:text;color:#ff7a24;">Clusly</div>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 36px 0 36px;">
            <h1 style="margin:0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:26px;line-height:1.2;font-weight:800;letter-spacing:-0.02em;color:#f5f5f4;">${c.heading}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 36px 0 36px;">
            <p style="margin:0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#b8b8b6;">${c.intro}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 36px 8px 36px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" bgcolor="#ff6a1a" style="border-radius:999px;">
                  <a href="${actionUrl}" target="_blank" style="display:inline-block;padding:14px 30px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;color:#1a1000;text-decoration:none;border-radius:999px;background:linear-gradient(90deg,#ff6a1a,#ff9a3d);">${c.cta}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 36px 0 36px;">
            <p style="margin:0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:#8a8a88;">O copia y pega este enlace en tu navegador:</p>
            <p style="margin:6px 0 0 0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;line-height:1.5;word-break:break-all;"><a href="${actionUrl}" target="_blank" style="color:#ff9a3d;text-decoration:underline;">${actionUrl}</a></p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 36px 36px 36px;">
            <div style="height:1px;background-color:#2a2a2e;font-size:0;line-height:0;">&nbsp;</div>
            <p style="margin:20px 0 0 0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#6f6f6d;">${c.outro}</p>
            <p style="margin:10px 0 0 0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;color:#6f6f6d;">Clusly · Tu ruta en el mundo infinito de videos.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  const text = `${c.heading}

${c.intro}

${c.cta}: ${actionUrl}

${c.outro}

Clusly`;

  return { subject: c.subject, html, text };
}
