import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeOrder } from "@/lib/serializers";
import type { OrderStatus } from "@/lib/types";
const allowed:OrderStatus[]=["RECEIVED","ACCEPTED","COOKING","READY","COLLECTED","CANCELLED"];
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){if(!(await isAdmin()))return NextResponse.json({error:"Unauthorized"},{status:401});const{id}=await params;const{status}=await request.json();if(!allowed.includes(status))return NextResponse.json({error:"Invalid status"},{status:400});try{const order=await prisma.order.update({where:{id},data:{status},include:{lines:true}});return NextResponse.json(serializeOrder(order));}catch{return NextResponse.json({error:"Not found"},{status:404});}}
