import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const purchaseId = searchParams.get("purchaseId");

  if (status === "success") {
    return NextResponse.redirect(new URL(`/payment/success?purchaseId=${purchaseId}`, req.url));
  } else {
    return NextResponse.redirect(new URL(`/payment/cancel?purchaseId=${purchaseId}`, req.url));
  }
}
