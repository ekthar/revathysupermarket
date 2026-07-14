/**
 * Resend API client - sends emails via fetch to https://api.resend.com/emails.
 * No npm dependency required.
 */

type SendEmailParams = {
  from: string;
  to: string;
  subject: string;
  html: string;
};

type SendEmailResult = {
  success: boolean;
  id?: string;
  error?: string;
};

/**
 * Sends an email via the Resend API.
 * Uses the RESEND_API_KEY environment variable for authentication.
 */
export async function sendEmailViaResend(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return { success: false, error: "RESEND_API_KEY is not configured." };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: params.from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = (data as { message?: string })?.message ?? "Email send failed.";
      return { success: false, error };
    }

    return { success: true, id: (data as { id?: string })?.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Email send failed.";
    return { success: false, error: errorMessage };
  }
}
