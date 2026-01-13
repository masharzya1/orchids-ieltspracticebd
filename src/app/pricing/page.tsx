"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Loader2, 
  CreditCard, 
  ShieldCheck, 
  BookOpen,
  ArrowLeft,
  Timer
} from "lucide-react";
import Link from "next/link";

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const testId = searchParams.get("testId");
  const successParam = searchParams.get("success");

  const [loading, setLoading] = useState(true);
  const [testDetails, setTestDetails] = useState<any>(null);

  useEffect(() => {
    if (successParam === "true") {
      router.push("/dashboard");
    }
  }, [successParam, router]);

  useEffect(() => {
    async function fetchData() {
      if (testId) {
        const { data: testData } = await supabase
          .from("mock_tests")
          .select("id, title, price, test_type")
          .eq("id", testId)
          .single();

        if (testData) setTestDetails(testData);
      }
      setLoading(false);
    }

    fetchData();
  }, [testId]);

  const handleBuySingleTest = () => {
    if (!testId) {
      router.push("/tests");
      return;
    }
    router.push(`/checkout/${testId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 relative">
      <div className="absolute inset-0 grid-bg opacity-30"></div>
      
      <div className="container relative z-10 mx-auto px-4 max-w-6xl">
        <Link href={testId ? `/tests/${testId}` : "/tests"} className="inline-flex items-center text-primary hover:underline mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {testId ? "টেস্টে ফিরে যান" : "সব টেস্ট দেখুন"}
        </Link>

        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 px-4 py-1 text-primary border-primary/20 bg-primary/5">
            সাশ্রয়ী প্রাইসিং
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            আপনার <span className="gradient-text">সফলতার প্রস্তুতি</span> শুরু করুন
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            কোনো সাবস্ক্রিপশন ফি নেই। শুধুমাত্র আপনার প্রয়োজনীয় টেস্টটি কিনুন এবং প্র্যাকটিস শুরু করুন।
          </p>
        </div>

        {testDetails ? (
          <Card className="max-w-2xl mx-auto border-primary/30 bg-primary/5 backdrop-blur-sm shadow-2xl">
            <CardHeader className="text-center">
              <Badge className="w-fit mx-auto mb-4">{testDetails.test_type === 'practice' ? 'প্র্যাকটিস মেম্বারশিপ' : 'মক টেস্ট'}</Badge>
              <CardTitle className="text-3xl font-black">{testDetails.title}</CardTitle>
              <CardDescription className="text-base">
                {testDetails.test_type === 'practice' 
                  ? '১ বছরের জন্য আনলিমিটেড অ্যাক্সেস' 
                  : 'একবার পরীক্ষার দেওয়ার সুযোগ'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="flex flex-col items-center justify-center mb-10">
                <div className="flex items-baseline gap-1">
                  <span className="text-6xl font-black text-foreground">৳{Number(testDetails.price).toFixed(0)}</span>
                </div>
                <p className="text-muted-foreground mt-2 font-medium">এককালীন পেমেন্ট</p>
              </div>

              <div className="space-y-4 mb-10 max-w-md mx-auto">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="font-medium">{testDetails.test_type === 'practice' ? '৩৬৫ দিন আনলিমিটেড অ্যাক্সেস' : 'সম্পূর্ণ মক টেস্ট ইন্টারফেস'}</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="font-medium">এআই-চালিত তাৎক্ষণিক ফলাফল</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="font-medium">বিস্তারিত ব্যান্ড স্কোর অ্যানালাইসিস</span>
                </div>
              </div>

              <Button onClick={handleBuySingleTest} size="lg" className="w-full h-16 text-xl font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
                <CreditCard className="mr-3 h-6 w-6" />
                এখনই কিনুন
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-border/40 bg-card/40 backdrop-blur-sm p-8 flex flex-col hover:border-primary/30 transition-all">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <Timer className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-black mb-2">মক টেস্ট</h3>
              <p className="text-muted-foreground mb-8 font-medium">আসল পরীক্ষার পরিবেশে একটি সম্পূর্ণ মক টেস্ট দিন।</p>
              <div className="mt-auto">
                <p className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-wider">শুরু মাত্র ৳৪৯৯ থেকে</p>
                <Button asChild variant="outline" className="w-full h-12 font-bold rounded-xl">
                  <Link href="/tests">সব মক টেস্ট দেখুন</Link>
                </Button>
              </div>
            </Card>

            <Card className="border-border/40 bg-card/40 backdrop-blur-sm p-8 flex flex-col hover:border-green-500/30 transition-all">
              <div className="h-14 w-14 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center mb-6">
                <BookOpen className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-black mb-2">প্র্যাকটিস মেম্বারশিপ</h3>
              <p className="text-muted-foreground mb-8 font-medium">১ বছরের জন্য নির্দিষ্ট বিষয়ের ওপর আনলিমিটেড প্র্যাকটিস করুন।</p>
              <div className="mt-auto">
                <p className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-wider">শুরু মাত্র ৳৯৯৯ থেকে</p>
                <Button asChild variant="outline" className="w-full h-12 font-bold rounded-xl hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/30">
                  <Link href="/tests?tab=practice">প্র্যাকটিস ম্যাটেরিয়াল দেখুন</Link>
                </Button>
              </div>
            </Card>
          </div>
        )}

        <div className="mt-20 text-center">
          <div className="flex flex-wrap justify-center gap-12 text-sm font-bold text-muted-foreground/80 uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span>নিরাপদ রুপান্তর পে</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>তাৎক্ষণিক অ্যাক্সেস</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    }>
      <PricingContent />
    </Suspense>
  );
}
