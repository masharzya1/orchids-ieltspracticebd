"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Headphones, PenTool, MessageSquare, Clock, AlertCircle, CheckCircle2, CreditCard, Loader2, Crown, Timer, FileDown, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

function ButtonCounter({ targetDate, onComplete }: { targetDate: string, onComplete: () => void }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;

      if (distance <= 0) {
        setTimeLeft(null);
        onComplete();
        return true;
      } else {
        setTimeLeft({
          d: Math.floor(distance / (1000 * 60 * 60 * 24)),
          h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((distance % (1000 * 60)) / 1000),
        });
        return false;
      }
    };

    const isDone = calculateTime();
    if (isDone) return;

    const timer = setInterval(() => {
      if (calculateTime()) clearInterval(timer);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  if (!timeLeft) return <span>টেস্ট শুরু করুন</span>;

  const { d, h, m, s } = timeLeft;
  const timeStr = d > 0 ? `${d}d ${h}:${m}:${s}` : `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-2">
      <Timer className="h-4 w-4" />
      <span>শুরু হতে বাকি: {timeStr}</span>
    </div>
  );
}

export default function TestDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [test, setTest] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [parts, setParts] = useState<Record<string, any[]>>({});
  const [isUpcoming, setIsUpcoming] = useState(false);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState<any>(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [hasTaken, setHasTaken] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const [testRes, sectionsRes] = await Promise.all([
        supabase.from("mock_tests").select("*").eq("id", id).single(),
        supabase.from("test_sections").select("*").eq("test_id", id).order("order_index", { ascending: true })
      ]);

      if (testRes.data) {
        setTest(testRes.data);
        const testData = testRes.data;
        if (testData.test_type === "mock" && testData.scheduled_at) {
          const scheduledTime = new Date(testData.scheduled_at).getTime();
          const now = new Date().getTime();
          if (scheduledTime > now) {
            setIsUpcoming(true);
          }
        }
      }
      if (sectionsRes.data) {
        setSections(sectionsRes.data);
        const sectionIds = sectionsRes.data.map(s => s.id);
        if (sectionIds.length > 0) {
          const { data: partsData } = await supabase.from("test_parts").select("*").in("section_id", sectionIds).order("order_index");
          if (partsData) {
            const pbs: Record<string, any[]> = {};
            partsData.forEach(p => {
              if (!pbs[p.section_id]) pbs[p.section_id] = [];
              pbs[p.section_id].push(p);
            });
            setParts(pbs);
          }
        }
      }

      if (user && testRes.data) {
        setCheckingAccess(true);
        const [purchaseRes, resultsRes] = await Promise.all([
          supabase.from("purchases").select("id, expires_at").eq("user_id", user.id).eq("test_id", id).eq("status", "completed").maybeSingle(),
          supabase.from("user_results").select("id").eq("user_id", user.id).eq("test_id", id).limit(1)
        ]);
        
        const isFree = testRes.data.is_free;
        const purchase = purchaseRes.data;
        
        // Check if purchase is still valid (not expired)
        const isExpired = purchase?.expires_at && new Date(purchase.expires_at) < new Date();
        setHasPurchased((!!purchase && !isExpired) || isFree);
        setHasTaken(resultsRes.data && resultsRes.data.length > 0 ? true : false);
        setCheckingAccess(false);
      }

      setLoading(false);
    }

    fetchData();
  }, [id]);

  const hasAccess = test?.is_free || hasPurchased;

  const handleStart = () => {
    if (!user) {
      router.push(`/login?redirectTo=/tests/${id}`);
      return;
    }
    
    if (!hasAccess) {
      router.push(`/pricing?testId=${id}`);
      return;
    }
    
    if (isUpcoming) return;

    router.push(`/tests/${id}/start`);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Skeleton className="h-12 w-2/3 mb-6" />
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-60 w-full" />
            </div>
            <Skeleton className="h-80 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!test) return <div className="pt-32 text-center font-bold">টেস্টটি খুঁজে পাওয়া যায়নি</div>;

  const sectionIcons: any = {
    listening: <Headphones className="h-5 w-5" />,
    reading: <BookOpen className="h-5 w-5" />,
    writing: <PenTool className="h-5 w-5" />,
    speaking: <MessageSquare className="h-5 w-5" />,
  };

  return (
    <div className="min-h-screen pt-16 pb-8 font-hind-siliguri bg-secondary/10">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-4">
          <Link href="/tests" className="text-primary hover:underline mb-2 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-tight">
            <ArrowLeft className="h-3 w-3" /> সব টেস্টে ফিরে যান
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tight leading-tight">{test.title}</h1>
            <div className="flex items-center gap-2">
              {test.is_free ? (
                <Badge className="bg-primary text-black font-black text-[9px] px-2 py-0">FREE</Badge>
              ) : (
                <Badge variant="secondary" className="text-[9px] font-black px-2 py-0">PREMIUM</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-border/40 bg-card/40 backdrop-blur-sm rounded-lg shadow-sm">
              <CardHeader className="py-2 px-4 border-b border-border/40">
                <CardTitle className="text-[11px] font-black uppercase tracking-tight">টেস্টের বিবরণ</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                  {test.description || "এটি একটি পূর্ণাঙ্গ আইইএলটিএস মক টেস্ট। এতে লিসেনিং, রিডিং, রাইটিং এবং স্পিকিং - এই চারটি মডিউলই অন্তর্ভুক্ত রয়েছে।"}
                </p>
                
                <h3 className="text-[10px] font-black mt-4 mb-2 uppercase tracking-widest text-primary">টেস্ট স্ট্রাকচার</h3>
                <div className="space-y-1.5">
                  {sections.map((section) => (
                    <div key={section.id} className="space-y-1">
                      <div className="flex items-center justify-between p-2 rounded-lg border border-border/30 bg-secondary/10">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                            {sectionIcons[section.section_type]}
                          </div>
                          <div>
                            <p className="font-bold capitalize text-[10px] leading-tight">{section.section_type === 'listening' ? 'লিসেনিং' : section.section_type === 'reading' ? 'রিডিং' : section.section_type === 'writing' ? 'রাইটিং' : 'স্পিকিং'}</p>
                            <p className="text-[8px] text-muted-foreground font-medium leading-tight">{section.title}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span className="text-[9px] font-bold">{section.time_limit} মিনিট</span>
                        </div>
                      </div>
                      
                      {test.test_type === "practice" && parts[section.id] && (
                        <div className="pl-9 space-y-1">
                          {parts[section.id].map(part => (
                            <div key={part.id} className="flex items-center justify-between p-1.5 rounded-md border border-border/20 bg-card/30">
                              <div className="flex items-center gap-2">
                                <div className="h-4 w-4 rounded bg-green-500/10 text-green-500 flex items-center justify-center text-[8px] font-bold">
                                  {part.part_number}
                                </div>
                                <span className="text-[9px] font-bold">{part.title}</span>
                              </div>
                              {part.pdf_url && (
                                <a 
                                  href={part.pdf_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-600 text-white text-[7px] font-black hover:bg-green-700 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <FileDown className="h-2.5 w-2.5" /> PDF
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/40 backdrop-blur-sm rounded-lg shadow-sm">
              <CardHeader className="py-2 px-4 border-b border-border/40">
                <CardTitle className="text-[11px] font-black uppercase tracking-tight">নির্দেশনা</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {[
                  "একটি স্থিতিশীল ইন্টারনেট সংযোগ নিশ্চিত করুন।",
                  "লিসেনিং সেকশনের জন্য হেডফোন ব্যবহার করুন।",
                  "সময় শেষ হলে টেস্টটি অটোমেটিক সাবমিট হয়ে যাবে।",
                  "টেস্ট শুরু করার পর বিরতি নেওয়া যাবে না।",
                  "সাবমিট করার সাথে সাথেই ফলাফল দেখতে পাবেন।"
                ].map((instruction, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                    <span className="text-muted-foreground text-[10px] font-medium leading-tight">{instruction}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border-primary/20 bg-primary/5 sticky top-20 shadow-md rounded-lg overflow-hidden">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-black">টেস্ট শুরু করুন</CardTitle>
                  <CardDescription className="font-medium text-[9px] leading-tight">আপনার কাঙ্ক্ষিত ব্যান্ড স্কোর অর্জন করতে আজই শুরু করুন।</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <Button 
                    onClick={handleStart} 
                    size="lg" 
                    className={`w-full h-10 text-xs font-black rounded-lg transition-all ${isUpcoming && !hasAccess ? 'opacity-80' : ''}`}
                    disabled={checkingAccess || (isUpcoming && hasAccess)}
                  >
                    {checkingAccess ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        চেক করা হচ্ছে...
                      </>
                    ) : (isUpcoming && hasAccess) ? (
                      <ButtonCounter targetDate={test.scheduled_at} onComplete={() => setIsUpcoming(false)} />
                    ) : !user ? (
                      "লগইন করে শুরু করুন"
                    ) : hasAccess ? (
                      (test.test_type === "mock" && hasTaken && !test.is_free) ? "ফলাফল দেখুন" : (hasTaken ? "টেস্ট পুনরায় দিন" : "টেস্ট শুরু করুন")
                    ) : (
                      <>
                        <CreditCard className="mr-1.5 h-4 w-4" />
                        অ্যাক্সেস নিন (৳{Number(test.price).toFixed(0)})
                      </>
                    )}
                  </Button>
                  
                  {!hasAccess && !checkingAccess && (
                    <p className="text-[7px] text-center mt-2 font-black text-muted-foreground uppercase tracking-widest opacity-60">
                      নিরাপদ পেমেন্ট রুপান্তর পে এর মাধ্যমে
                    </p>
                  )}
                </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
