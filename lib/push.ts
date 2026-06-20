import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY;
const privateKey = process.env.WEB_PUSH_PRIVATE_KEY;
const subject = process.env.WEB_PUSH_SUBJECT ?? "mailto:owner@msmsupermarket.in";

let configured = false;

function configureWebPush() {
  if (configured || !publicKey || !privateKey) return Boolean(publicKey && privateKey);
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export async function sendPushToUser(userId: string | null | undefined, payload: { title: string; body: string; url: string; orderId?: string }) {
  if (!userId || !configureWebPush()) return;

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth
        }
      }, JSON.stringify(payload));
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { endpoint: subscription.endpoint } }).catch(() => null);
      }
    }
  }));
}
