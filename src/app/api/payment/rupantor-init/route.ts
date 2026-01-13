import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { testId, amount, customerName, customerEmail } = await req.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Rupantor Pay settings
    const { data: settingsData } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "payment_settings")
      .single();

    const rupantorSettings = settingsData?.value?.rupantor_pay;

    if (!rupantorSettings?.enabled || !rupantorSettings?.api_key) {
      return NextResponse.json({ error: "Rupantor Pay is not configured" }, { status: 500 });
    }

    // Create a pending purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from("purchases")
      .insert({
        user_id: user.id,
        test_id: testId,
        amount: amount,
        status: "pending",
        payment_provider: "rupantor_pay"
      })
      .select()
      .single();

    if (purchaseError) throw purchaseError;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;

    // Call Rupantor Pay API
    const response = await fetch("https://rupantorpay.com/api/v1/payments/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        api_key: rupantorSettings.api_key,
        amount: amount,
        customer_name: customerName,
        customer_email: customerEmail,
        order_id: purchase.id,
        success_url: `${baseUrl}/api/payment/rupantor-callback?status=success&purchaseId=${purchase.id}`,
        cancel_url: `${baseUrl}/api/payment/rupantor-callback?status=cancel&purchaseId=${purchase.id}`,
        webhook_url: `${baseUrl}/api/payment/rupantor-webhook`
      }),
    });

    const data = await response.json();

    if (data.status === "success" && data.payment_url) {
      return NextResponse.json({ paymentUrl: data.payment_url });
    } else {
      console.error("Rupantor Pay Error:", data);
      return NextResponse.json({ error: data.message || "Failed to initialize payment" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Payment Init Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
