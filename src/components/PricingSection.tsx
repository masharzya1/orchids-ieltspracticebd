"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  ShieldCheck,
  BookOpen,
  Timer,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

export default function PricingSection() {
  return (
    <section id="pricing" className="relative py-24 md:py-32 border-t border-border overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30"></div>
      
      <div className="container relative z-10 mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-1 text-primary border-primary/20 bg-primary/5">
            সাশ্রয়ী প্রাইসিং
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            আপনার <span className="gradient-text">সফলতার প্রস্তুতি</span> শুরু করুন
          </h2>
          <p className="text-lg text-muted-foreground">
            কোনো সাবস্ক্রিপশন নেই। শুধুমাত্র আপনার প্রয়োজনীয় টেস্টটি কিনুন এবং প্র্যাকটিস শুরু করুন।
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="group border-border/40 bg-card/40 backdrop-blur-sm p-8 flex flex-col hover:border-primary/40 transition-all duration-500 hover:translate-y-[-8px]">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-black transition-all">
              <Timer className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-black mb-2">মক টেস্ট</h3>
            <p className="text-muted-foreground mb-8 font-medium">আসল পরীক্ষার পরিবেশে একটি সম্পূর্ণ মক টেস্ট দিন। তাৎক্ষণিক এআই রেজাল্ট ও ফিডব্যাক।</p>
            <div className="mt-auto space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>সিঙ্গেল টেস্ট অ্যাক্সেস</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>আসল পরীক্ষার ইন্টারফেস</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-wider">শুরু মাত্র ৳৪৯৯ থেকে</p>
                <Button asChild className="w-full h-14 font-black rounded-xl shadow-lg shadow-primary/10">
                  <Link href="/tests">মক টেস্ট শুরু করুন <ChevronRight className="ml-2 h-5 w-5" /></Link>
                </Button>
              </div>
            </div>
          </Card>

          <Card className="group border-border/40 bg-card/40 backdrop-blur-sm p-8 flex flex-col hover:border-green-500/40 transition-all duration-500 hover:translate-y-[-8px]">
            <div className="h-14 w-14 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center mb-6 group-hover:bg-green-500 group-hover:text-white transition-all">
              <BookOpen className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-black mb-2">প্র্যাকটিস মেম্বারশিপ</h3>
            <p className="text-muted-foreground mb-8 font-medium">১ বছরের জন্য নির্দিষ্ট বিষয়ের ওপর আনলিমিটেড প্র্যাকটিস করার সুযোগ।</p>
            <div className="mt-auto space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>৩৬৫ দিন আনলিমিটেড প্র্যাকটিস</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>রেগুলার কন্টেন্ট আপডেট</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-wider">শুরু মাত্র ৳৯৯৯ থেকে</p>
                <Button asChild variant="outline" className="w-full h-14 font-black rounded-xl border-green-500/20 hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/40">
                  <Link href="/tests?tab=practice">প্র্যাকটিস শুরু করুন <ChevronRight className="ml-2 h-5 w-5" /></Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-20 flex flex-col items-center gap-8">
          <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-muted-foreground/80">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary/70" />
              <span>নিরাপদ রুপান্তর পে</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary/70" />
              <span>তাৎক্ষণিক অ্যাক্সেস</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
