import { authenticateMobileRequest } from "@/lib/mobile-auth";
import { mobileJson, mobileOptionsResponse } from "@/lib/mobile-cors";
import { prisma } from "@/lib/prisma";

export async function OPTIONS(request: Request) {
  return mobileOptionsResponse(request);
}

export async function GET(request: Request) {
  const auth = authenticateMobileRequest(request);

  if (!auth) {
    return mobileJson(request, { error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      image: true,
    },
  });

  if (!user?.isActive) {
    return mobileJson(request, { error: "Unauthorized" }, { status: 401 });
  }

  return mobileJson(request, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      image: user.image,
    },
  });
}
