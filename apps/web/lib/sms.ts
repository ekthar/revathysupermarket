type SendSmsParams = {
  to: string;
  message: string;
  orderId?: string;
};

type SmsResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

function normalizeToIndianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

/**
 * Send an SMS message via the configured SMS provider.
 * Returns gracefully with success: false if not configured.
 */
export async function sendSms({ to, message, orderId }: SendSmsParams): Promise<SmsResult> {
  const apiKey = process.env.SMS_API_KEY;
  const senderId = process.env.SMS_SENDER_ID;
  const apiUrl = process.env.SMS_API_URL;

  if (!apiKey || !senderId || !apiUrl) {
    return { success: false, error: "SMS API is not configured." };
  }

  const phone = normalizeToIndianPhone(to);

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: senderId,
        to: phone,
        message,
        ...(orderId ? { orderId } : {}),
      }),
    });

    const data = await response.json().catch(() => ({}));
    const messageId = data?.messageId as string | undefined;

    if (!response.ok) {
      const error = data?.error?.message ?? data?.message ?? "SMS send failed.";
      return { success: false, error };
    }

    return { success: true, messageId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "SMS send failed.";
    return { success: false, error: errorMessage };
  }
}

/**
 * Send an OTP code via SMS.
 * Convenience wrapper around sendSms.
 */
export async function sendOtpViaSms(phone: string, otp: string): Promise<SmsResult> {
  return sendSms({
    to: phone,
    message: `Your OTP is ${otp}. It is valid for 5 minutes. Do not share it with anyone.`,
  });
}
