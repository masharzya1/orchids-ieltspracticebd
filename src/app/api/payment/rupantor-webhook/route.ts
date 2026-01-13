import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log("Rupantor Pay Webhook Received:", payload);

    // Get Rupantor Pay settings to verify
    const { data: settingsData } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "payment_settings")
      .single();

    const rupantorSettings = settingsData?.value?.rupantor_pay;

    if (!rupantorSettings?.api_key) {
      return NextResponse.json({ error: "Rupantor Pay is not configured" }, { status: 500 });
    }

    // Standard Rupantor Pay webhook verification
    const verifyRes = await fetch("https://rupantorpay.com/api/v1/payments/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        api_key: rupantorSettings.api_key,
        payment_id: payload.payment_id
      }),
    });

    const verifyData = await verifyRes.json();

    if (verifyData.status === "success" && verifyData.payment?.status === "completed") {
      const purchaseId = verifyData.payment.order_id || payload.order_id;

      // Get purchase and test details to determine expiration
      const { data: purchaseData } = await supabase
        .from("purchases")
        .select("*, mock_tests(test_type)")
        .eq("id", purchaseId)
        .single();

      if (!purchaseData) throw new Error("Purchase not found");

      let expiresAt: string | null = null;
      if (purchaseData.mock_tests?.test_type === "practice") {
        // 1 year validity for practice tests
        const date = new Date();
        date.setFullYear(date.getFullYear() + 1);
        expiresAt = date.toISOString();
      }

      // Update purchase status and expiration
      const { error: updateError } = await supabase
        .from("purchases")
        .update({ 
          status: "completed",
          payment_id: payload.payment_id,
          expires_at: expiresAt,
          updated_at: new Date().toISOString()
        })
        .eq("id", purchaseId);

      if (updateError) throw updateError;

      return NextResponse.json({ message: "Webhook processed successfully" });
    } else {
      console.warn("Rupantor Pay Webhook Verification Failed:", verifyData);
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
