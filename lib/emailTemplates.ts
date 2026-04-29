function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function companyInviteEmailTemplate(input: {
  companyName: string;
  inviterEmail: string;
  inviteRole: string;
  acceptUrl: string;
  expiresHuman: string;
}) {
  const companyName = escapeHtml(input.companyName);
  const inviterEmail = escapeHtml(input.inviterEmail);
  const inviteRole = escapeHtml(input.inviteRole);
  const acceptUrl = input.acceptUrl;
  const expiresHuman = escapeHtml(input.expiresHuman);

  const subject = `You're invited to join ${companyName}`;
  const text =
    `You have been invited to join ${input.companyName} as ${input.inviteRole}.\n` +
    `Invited by: ${input.inviterEmail}\n\n` +
    `Accept invite: ${input.acceptUrl}\n\n` +
    `This invite expires: ${input.expiresHuman}\n`;

  const html = `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height:1.5; color:#0f172a;">
    <h2 style="margin:0 0 12px;">Join ${companyName}</h2>
    <p style="margin:0 0 16px;">
      <strong>${inviterEmail}</strong> invited you to join <strong>${companyName}</strong> as <strong>${inviteRole}</strong>.
    </p>
    <p style="margin:0 0 18px;">
      <a href="${acceptUrl}" style="display:inline-block; background:#4f46e5; color:#fff; text-decoration:none; padding:10px 14px; border-radius:10px; font-weight:600;">
        Accept invite
      </a>
    </p>
    <p style="margin:0 0 6px; color:#475569; font-size:12px;">
      Or paste this link in your browser:
    </p>
    <p style="margin:0 0 18px; font-size:12px; color:#0f172a;">
      <a href="${acceptUrl}">${acceptUrl}</a>
    </p>
    <p style="margin:0; color:#64748b; font-size:12px;">This invite expires: ${expiresHuman}</p>
  </div>
  `.trim();

  return { subject, html, text };
}

export function applicationReceivedEmailTemplate(input: {
  companyName: string;
  jobTitle: string;
  candidateEmail: string;
  applicationUrl: string;
}) {
  const companyName = escapeHtml(input.companyName);
  const jobTitle = escapeHtml(input.jobTitle);
  const candidateEmail = escapeHtml(input.candidateEmail);
  const applicationUrl = input.applicationUrl;

  const subject = `New application: ${jobTitle}`;
  const text =
    `${input.candidateEmail} applied for "${input.jobTitle}" at ${input.companyName}.\n\n` +
    `View application: ${input.applicationUrl}\n`;

  const html = `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height:1.5; color:#0f172a;">
    <h2 style="margin:0 0 12px;">New application received</h2>
    <p style="margin:0 0 10px;">
      <strong>${candidateEmail}</strong> applied for <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.
    </p>
    <p style="margin:0 0 18px;">
      <a href="${applicationUrl}" style="display:inline-block; background:#4f46e5; color:#fff; text-decoration:none; padding:10px 14px; border-radius:10px; font-weight:600;">
        View application
      </a>
    </p>
    <p style="margin:0; color:#64748b; font-size:12px;">If the button doesn't work, open: <a href="${applicationUrl}">${applicationUrl}</a></p>
  </div>
  `.trim();

  return { subject, html, text };
}

export function applicationStatusChangedEmailTemplate(input: {
  jobTitle: string;
  fromStage: string;
  toStage: string;
  applicationUrl: string;
}) {
  const jobTitle = escapeHtml(input.jobTitle);
  const fromStage = escapeHtml(input.fromStage);
  const toStage = escapeHtml(input.toStage);
  const applicationUrl = input.applicationUrl;

  const subject = `Application update: ${jobTitle}`;
  const text =
    `Your application for "${input.jobTitle}" moved from "${input.fromStage}" to "${input.toStage}".\n\n` +
    `View details: ${input.applicationUrl}\n`;

  const html = `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height:1.5; color:#0f172a;">
    <h2 style="margin:0 0 12px;">Application status updated</h2>
    <p style="margin:0 0 10px;">
      Your application for <strong>${jobTitle}</strong> moved from <strong>${fromStage}</strong> to <strong>${toStage}</strong>.
    </p>
    <p style="margin:0 0 18px;">
      <a href="${applicationUrl}" style="display:inline-block; background:#4f46e5; color:#fff; text-decoration:none; padding:10px 14px; border-radius:10px; font-weight:600;">
        View application
      </a>
    </p>
    <p style="margin:0; color:#64748b; font-size:12px;">If the button doesn't work, open: <a href="${applicationUrl}">${applicationUrl}</a></p>
  </div>
  `.trim();

  return { subject, html, text };
}

