# SMS OTP Providers for India - Comparison Guide

## Summary

For a supermarket app in India, the cheapest and most practical options for SMS OTP verification are listed below. **WhatsApp OTP is the cheapest** option (nearly free), while SMS OTP ranges from ₹0.10 to ₹0.25 per message.

---

## Top Recommendations

### 1. Fast2SMS (Best Budget Option)
- **Website:** [fast2sms.com](https://www.fast2sms.com/)
- **Free credits:** ₹50 free on signup (approx 200+ OTPs)
- **Pricing:** ₹0.11 - ₹0.25 per SMS (DLT route)
- **OTP without DLT:** Yes! Supports sending OTP via API without DLT registration
- **WhatsApp OTP:** Free WhatsApp OTP API available (no monthly/setup cost)
- **Integration:** REST API, Node.js SDK available
- **Best for:** Small businesses, startups, low volume
- **Pros:** Cheapest, no DLT needed for OTP route, free WhatsApp OTP
- **Cons:** Less enterprise-grade support

### 2. MSG91 (Best Overall for India)
- **Website:** [msg91.com](https://msg91.com/)
- **Free tier:** 5000 free OTPs on signup (OTP Widget)
- **Pricing:** ₹0.19 - ₹0.25 per OTP SMS
- **OTP Widget:** Pre-built widget with auto-retry via WhatsApp/Email/Voice
- **DLT:** Handles DLT compliance for you
- **Integration:** REST API, Node.js SDK, React widget
- **Best for:** Production apps, multi-channel OTP
- **Pros:** Free widget, auto-fallback to voice/WhatsApp, great dashboard
- **Cons:** Slightly more expensive at low volumes

### 3. 2Factor.in (Simple & Reliable)
- **Website:** [2factor.in](https://2factor.in/)
- **Free tier:** 25 free OTPs for testing
- **Pricing:** ₹0.18 - ₹0.22 per SMS OTP
- **DLT:** Managed DLT compliance
- **Integration:** Very simple REST API
- **Best for:** Quick integration, reliable delivery
- **Pros:** Simplest API, good documentation, voice fallback
- **Cons:** No free WhatsApp OTP option

### 4. Message Central (No DLT Required)
- **Website:** [messagecentral.com](https://www.messagecentral.com/)
- **Free tier:** Free trial credits
- **Pricing:** ₹0.15 - ₹0.25 per OTP
- **DLT:** No DLT registration required (they handle it)
- **Integration:** REST API, go live in 15 minutes
- **Best for:** Quick launch without DLT hassle
- **Pros:** No DLT registration needed, fast setup
- **Cons:** Newer provider, less community support

### 5. WhatsApp Business API (Cheapest Long-term)
- **Website:** Available via Fast2SMS, MSG91, or directly via Meta
- **Free tier:** First 1000 service conversations/month are FREE
- **Pricing:** ₹0.35 - ₹0.55 per authentication message (but free within service window)
- **Best for:** Apps already using WhatsApp for order notifications
- **Pros:** Highest delivery rate (~99%), users trust WhatsApp, nearly free
- **Cons:** Requires WhatsApp Business API setup, user must have WhatsApp

---

## Cost Comparison (1000 OTPs/month)

| Provider | Monthly Cost | Notes |
|----------|-------------|-------|
| Fast2SMS (WhatsApp OTP) | FREE | No setup cost |
| WhatsApp Business API | FREE | First 1000/month free |
| Fast2SMS (SMS) | ~₹110-250 | DLT or non-DLT routes |
| MSG91 (OTP Widget) | FREE first 5000 | Then ₹0.25/OTP |
| 2Factor | ~₹180-220 | Simple REST API |
| Message Central | ~₹150-250 | No DLT needed |

---

## Recommendation for This Project

Since this supermarket app **already uses WhatsApp Business API** for order notifications, the best approach is:

1. **Primary:** Use WhatsApp OTP (free via existing WhatsApp Business API setup)
2. **Fallback:** Use Fast2SMS for SMS OTP when WhatsApp fails (₹0.11-0.21/SMS)

This gives you:
- **Zero additional cost** for most OTPs (WhatsApp)
- **SMS fallback** for users without WhatsApp (~₹0.15/SMS)
- **No DLT registration** needed (Fast2SMS handles it)

---

## Integration Notes

### WhatsApp OTP (Already in your codebase)
Your app already has `lib/whatsapp-business.ts` with `sendWhatsAppTemplate()`. You can add a `login_otp` template for authentication.

### Fast2SMS Integration (Node.js)
```typescript
// lib/sms-otp.ts
export async function sendSmsOtp(phone: string, otp: string) {
  const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method: "POST",
    headers: {
      "authorization": process.env.FAST2SMS_API_KEY!,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      route: "otp",
      variables_values: otp,
      numbers: phone.replace("+91", "")
    })
  });
  return res.json();
}
```

### MSG91 Integration
```typescript
export async function sendMsg91Otp(phone: string) {
  const res = await fetch(`https://control.msg91.com/api/v5/otp?mobile=91${phone}&template_id=${process.env.MSG91_TEMPLATE_ID}`, {
    headers: { "authkey": process.env.MSG91_AUTH_KEY! }
  });
  return res.json();
}
```

---

## DLT Registration (If Needed)

DLT (Distributed Ledger Technology) registration is mandatory for commercial SMS in India. However:
- **Fast2SMS** and **Message Central** offer routes that work WITHOUT your own DLT registration
- **MSG91** handles DLT on their end via OTP Widget
- If you want your own DLT, register on: Jio DLT (₹5000/year), Airtel DLT, or Vi DLT

---

*Last updated: June 2026*
