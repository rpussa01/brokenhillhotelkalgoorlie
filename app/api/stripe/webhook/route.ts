import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) return new Response("Stripe is not configured",{status:503});
  const stripe=new Stripe(process.env.STRIPE_SECRET_KEY); const signature=request.headers.get("stripe-signature"); if(!signature)return new Response("Missing signature",{status:400});
  try { const event=stripe.webhooks.constructEvent(await request.text(),signature,process.env.STRIPE_WEBHOOK_SECRET); if(event.type==="checkout.session.completed"){const orderId=event.data.object.metadata?.orderId;if(orderId)await prisma.order.updateMany({where:{id:orderId},data:{paymentStatus:"PAID",status:"RECEIVED"}});} return new Response("ok"); } catch { return new Response("Invalid webhook",{status:400}); }
}
