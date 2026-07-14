import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { orderSchema } from "@/lib/validation";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const parsed = orderSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Please check your order details." }, { status: 400 });
    const input = parsed.data;
    if (input.paymentMethod === "ONLINE" && !process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "Online payment has not been configured. Choose pay at pickup." }, { status: 503 });
    const order = await prisma.$transaction(async tx => {
      const settings = await tx.settings.upsert({ where:{id:"main"}, update:{}, create:{id:"main",venueName:"Broken Hill Hotel",phone:"(08) 9093 0306",address:"21 Forrest Street, South Boulder WA 6432",isOrderingOpen:true,pickupMinutes:30} });
      if (!settings.isOrderingOpen) throw new Error("Online ordering is currently closed.");
      const ids = input.lines.map(line => line.itemId);
      const menuItems = await tx.menuItem.findMany({ where: { id: { in: ids }, active: true, soldOut: false } });
      if (menuItems.length !== new Set(ids).size) throw new Error("One of your selected items is unavailable.");
      const lines = input.lines.map(line => { const item=menuItems.find(x=>x.id===line.itemId)!; return { itemId:item.id,name:item.name,quantity:line.quantity,unitPriceCents:item.priceCents,notes:line.notes }; });
      const totalCents=lines.reduce((sum,line)=>sum+line.unitPriceCents*line.quantity,0);
      const counter=await tx.counter.upsert({where:{id:"orders"},create:{id:"orders",value:101},update:{value:{increment:1}}});
      return tx.order.create({ data:{ orderNumber:counter.value, customerName:input.customerName, customerPhone:input.customerPhone, customerEmail:input.customerEmail||null, pickupTime:new Date(input.pickupTime), notes:input.notes||null, paymentMethod:input.paymentMethod, paymentStatus:input.paymentMethod==="ONLINE"?"PENDING":"PAY_AT_PICKUP", status:input.paymentMethod==="ONLINE"?"PENDING_PAYMENT":"RECEIVED", subtotalCents:totalCents,totalCents,lines:{create:lines} }, include:{lines:true} });
    });
    if (input.paymentMethod === "ONLINE") {
      const stripe=new Stripe(process.env.STRIPE_SECRET_KEY!); const baseUrl=process.env.NEXT_PUBLIC_BASE_URL||new URL(request.url).origin;
      const session=await stripe.checkout.sessions.create({mode:"payment",success_url:`${baseUrl}/order-success?id=${order.id}&paid=1`,cancel_url:`${baseUrl}/order?cancelled=1`,customer_email:order.customerEmail||undefined,phone_number_collection:{enabled:true},metadata:{orderId:order.id},line_items:order.lines.map(line=>({quantity:line.quantity,price_data:{currency:"aud",unit_amount:line.unitPriceCents,product_data:{name:line.name}}}))});
      await prisma.order.update({where:{id:order.id},data:{stripeSessionId:session.id}});
      return NextResponse.json({orderId:order.id,checkoutUrl:session.url});
    }
    return NextResponse.json({orderId:order.id});
  } catch(error) { return NextResponse.json({error:error instanceof Error?error.message:"Could not create order."},{status:500}); }
}
