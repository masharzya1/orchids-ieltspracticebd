"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Headphones, PenTool, MessageSquare, ChevronRight, Lock, CheckCircle2, Clock, Timer, Calendar } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MockTest {
  id: string;
  title: string;
  description: string;
  price: number;
  is_free: boolean;
  thumbnail_url?: string;
  test_type: "mock" | "practice";
  scheduled_at?: string;
}

function TestActionButton({ 
  test, 
  hasAccess, 
  isTaken 
}: { 
  test: MockTest, 
  hasAccess: boolean, 
  isTaken: boolean 
}) {
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);
  const [isUpcoming, setIsUpcoming] = useState(false);

  useEffect(() => {
    if (!test.scheduled_at) return;

    const calculateTime = () => {
      const now = new Date().getTime();
      const distance = new Date(test.scheduled_at!).getTime() - now;

      if (distance <= 0) {
        setTimeLeft(null);
        setIsUpcoming(false);
        return false;
      } else {
        setTimeLeft({
          d: Math.floor(distance / (1000 * 60 * 60 * 24)),
          h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((distance % (1000 * 60)) / 1000),
        });
        setIsUpcoming(true);
        return true;
      }
    };

    calculateTime();
    const timer = setInterval(() => {
      const active = calculateTime();
      if (!active) clearInterval(timer);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [test.scheduled_at]);

  if (!hasAccess) {
    return (
      <Button asChild size="sm" className="w-full h-7 text-[9px] font-black rounded-lg shadow-sm hover:scale-[1.01] transition-all py-0">
        <Link href={`/checkout/${test.id}`}>
          রেজিস্ট্রেশন করুন
          <ChevronRight className="ml-1 h-3 w-3" />
        </Link>
      </Button>
    );
  }

  if (isUpcoming && timeLeft) {
    return (
      <Button disabled size="sm" variant="secondary" className="w-full h-7 text-[8px] font-black rounded-lg opacity-90 flex items-center justify-center gap-1 py-0">
        <Timer className="h-2.5 w-2.5" />
        <span>শুরু হবে: {timeLeft.d > 0 && `${timeLeft.d}d `}{timeLeft.h.toString().padStart(2, '0')}:{timeLeft.m.toString().padStart(2, '0')}:{timeLeft.s.toString().padStart(2, '0')}</span>
      </Button>
    );
  }

  // Single access for mock tests
  const buttonText = isTaken ? (test.test_type === "mock" && !test.is_free ? "ফলাফল দেখুন" : "আবার দিন") : "শুরু করুন";
  const href = isTaken && test.test_type === "mock" && !test.is_free ? `/tests/${test.id}/results` : `/tests/${test.id}`;

  return (
    <Button asChild size="sm" className="w-full h-7 text-[9px] font-black rounded-lg shadow-sm hover:scale-[1.01] transition-all py-0">
      <Link href={href}>
        {buttonText}
        <ChevronRight className="ml-1 h-3 w-3" />
      </Link>
    </Button>
  );
}

export default function TestsPage() {
  const [tests, setTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasedTestIds, setPurchasedTestIds] = useState<string[]>([]);
  const [takenTestIds, setTakenTestIds] = useState<string[]>([]);

  useEffect(() => {
    async function fetchTests() {
      const { data: { user } } = await supabase.auth.getUser();

      const { data } = await supabase
        .from("mock_tests")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) setTests(data);

      if (user) {
        const [purchasesRes, resultsRes] = await Promise.all([
          supabase.from("purchases")
            .select("test_id, expires_at")
            .eq("user_id", user.id)
            .eq("status", "completed"),
          supabase.from("user_results")
            .select("test_id")
            .eq("user_id", user.id)
        ]);

        if (purchasesRes.data) {
          const now = new Date();
          const activePurchases = purchasesRes.data
            .filter(p => !p.expires_at || new Date(p.expires_at) > now)
            .map(p => p.test_id);
          setPurchasedTestIds(activePurchases);
        }
        if (resultsRes.data) {
          setTakenTestIds(resultsRes.data.map((r) => r.test_id));
        }
      }

      setLoading(false);
    }

    fetchTests();
  }, []);

  const hasAccess = (test: MockTest) => test.is_free || purchasedTestIds.includes(test.id);

  return (
    <div className="min-h-screen font-hind-siliguri">
      <main className="pt-20 pb-16">
          <div className="container max-w-4xl mx-auto px-4">
              <div className="mb-6">
                <Badge variant="outline" className="mb-1 px-2 py-0 text-[8px] text-primary border-primary/20 bg-primary/5 uppercase font-bold tracking-widest">
                  আইইএলটিএস প্র্যাকটিস ও মক
                </Badge>
                <h1 className="text-2xl md:text-3xl font-black mb-1 tracking-tight">আপনার সফলতার যাত্রা শুরু হোক</h1>
                <p className="text-xs text-muted-foreground font-medium max-w-2xl opacity-80">
                  সঠিক প্রস্তুতি এবং নির্ভুল মক টেস্টের মাধ্যমে আপনার ব্যান্ড স্কোর নিশ্চিত করুন।
                </p>
              </div>

              <Tabs defaultValue="mock" className="space-y-4">
                <TabsList className="h-10 p-0.5 rounded-lg bg-secondary/30 backdrop-blur-md border border-border/50">
                  <TabsTrigger value="mock" className="px-4 rounded-md font-black text-xs data-[state=active]:bg-primary data-[state=active]:text-black transition-all">Mock Tests</TabsTrigger>
                  <TabsTrigger value="practice" className="px-4 rounded-md font-black text-xs data-[state=active]:bg-green-600 data-[state=active]:text-white transition-all">Practice Materials</TabsTrigger>
                </TabsList>

                <TabsContent value="mock">
                  {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[200px] rounded-2xl" />)}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {tests.filter(t => t.test_type === "mock").map((test) => (
                        <Card key={test.id} className="group overflow-hidden border-border/30 hover:border-primary/40 transition-all duration-300 flex flex-col rounded-[1rem] bg-card/40 backdrop-blur-sm relative shadow-sm">
                            <div className="aspect-[16/10] relative bg-muted/30 overflow-hidden border-b border-border/10">
                              {test.thumbnail_url ? (
                                <img src={test.thumbnail_url} alt={test.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary/5">
                                  <Clock className="h-6 w-6 text-primary/10 group-hover:scale-105 transition-transform duration-500" />
                                </div>
                              )}
                              
                              <div className="absolute top-1 right-1">
                                {test.is_free ? (
                                  <Badge className="bg-primary text-black font-black text-[7px] px-1.5 py-0 rounded-full">FREE</Badge>
                                ) : purchasedTestIds.includes(test.id) ? (
                                  <Badge className="bg-green-500 text-white font-black text-[7px] px-1.5 py-0 rounded-full flex items-center gap-0.5">
                                    <CheckCircle2 className="h-2 w-2" /> UNLOCKED
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-background/90 backdrop-blur-md font-black text-[8px] px-1.5 py-0 rounded-full border border-border/20">
                                    ৳{Number(test.price).toFixed(0)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                              <CardHeader className="p-2 pb-0.5 space-y-0">
                                <CardTitle className="text-[11px] font-black line-clamp-1 tracking-tight group-hover:text-primary transition-colors leading-tight">{test.title}</CardTitle>
                                <CardDescription className="line-clamp-1 text-[8px] font-medium leading-none h-3 opacity-70 mt-0.5">
                                  {test.description || "আইইএলটিএস মক টেস্ট।"}
                                </CardDescription>
                              </CardHeader>
                              
                              <CardFooter className="p-2 pt-1 mt-auto">
                                <TestActionButton 
                                  test={test} 
                                  hasAccess={hasAccess(test)} 
                                  isTaken={takenTestIds.includes(test.id)} 
                                />
                              </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>


              <TabsContent value="practice">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tests.filter(t => t.test_type === "practice").map((test) => {
                    const access = hasAccess(test);
                    return (
                        <Card key={test.id} className="group overflow-hidden border-border/30 hover:border-green-500/40 transition-all duration-300 flex flex-col rounded-[1.5rem] bg-card/40 backdrop-blur-sm relative shadow-sm hover:shadow-xl">
                          <div className="aspect-[16/9] relative bg-muted/30 overflow-hidden border-b border-border/10">
                            <div className="w-full h-full flex items-center justify-center bg-green-500/5 group-hover:bg-green-500/10 transition-colors">
                              <BookOpen className="h-8 w-8 text-green-500/10 group-hover:scale-105 transition-transform duration-500" />
                            </div>
                            
                            <div className="absolute top-2 right-2">
                              {test.is_free ? (
                                <Badge className="bg-green-500 text-white font-black text-[9px] px-2 py-0.5 rounded-full">FREE</Badge>
                              ) : access ? (
                                <Badge className="bg-green-500 text-white font-black text-[9px] px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                                  <CheckCircle2 className="h-2.5 w-2.5" /> ACCESS
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-background/90 backdrop-blur-md font-black text-[9px] px-2 py-0.5 rounded-full border border-border/20 flex items-center gap-1">
                                  <Lock className="h-2.5 w-2.5" /> ৳{Number(test.price).toFixed(0)}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <CardHeader className="p-2.5 pb-0.5 space-y-0">
                            <CardTitle className="text-sm font-black line-clamp-1 tracking-tight group-hover:text-green-500 transition-colors leading-none">{test.title}</CardTitle>
                            <CardDescription className="line-clamp-1 text-[9px] font-medium leading-normal h-4 opacity-70">
                              {test.description || "১ বছরের প্র্যাকটিস ম্যাটেরিয়াল।"}
                            </CardDescription>
                          </CardHeader>
                          
                          <CardFooter className="p-2.5 pt-0.5 mt-auto">
                            {access ? (
                              <Button asChild size="sm" className="w-full h-8 text-[10px] font-black rounded-lg bg-green-600 hover:bg-green-700 shadow-md shadow-green-500/10">
                                <Link href={`/tests/${test.id}`}>ম্যাটেরিয়াল দেখুন <ChevronRight className="ml-1 h-3 w-3" /></Link>
                              </Button>
                            ) : (
                              <Button asChild size="sm" variant="outline" className="w-full h-8 text-[10px] font-black rounded-lg border-green-500/20 hover:bg-green-500/5 hover:text-green-500 hover:border-green-500/40">
                                <Link href={`/checkout/${test.id}`}>এখনই কিনুন <ChevronRight className="ml-1 h-3 w-3" /></Link>
                              </Button>
                            )}
                          </CardFooter>
                        </Card>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </div>
      </main>
    </div>
  );
}
