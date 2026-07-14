import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeOrder } from "@/lib/serializers";
export async function GET(){if(!(await isAdmin()))return NextResponse.json({error:"Unauthorized"},{status:401});const orders=await prisma.order.findMany({include:{lines:true},orderBy:{createdAt:"desc"}});return NextResponse.json(orders.map(serializeOrder));}
