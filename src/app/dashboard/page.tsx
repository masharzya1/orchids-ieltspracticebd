"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Clock, 
  Target, 
  Award, 
  ChevronRight, 
  TrendingUp, 
  Mail, 
  AlertCircle, 
  RefreshCw,
  FileText
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { IELTSInfoForm } from "@/components/IELTSInfoForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsInfo, setNeedsInfo] = useState(false);

  async function fetchData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    if (user && user.email_confirmed_at) {
      const [resultsRes, purchasesRes, profileRes] = await Promise.all([
        supabase
          .from("user_results")
          .select("*, mock_tests(title)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("purchases")
          .select("*, mock_tests(title, price)")
          .eq("user_id", user.id)
          .eq("status", "completed"),
        supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
      ]);

      if (resultsRes.data) setResults(resultsRes.data);
      if (purchasesRes.data) setPurchases(purchasesRes.data);
      
      if (profileRes.data) {
        setUser((prev: any) => ({ ...prev, profile: profileRes.data }));
        if (!profileRes.data.target_score) {
          setNeedsInfo(true);
        }
      } else {
        setNeedsInfo(true);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (user && !user.email_confirmed_at) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center px-4 font-hind-siliguri">
        <div className="absolute inset-0 grid-bg opacity-30"></div>
        <Card className="w-full max-w-md relative z-10 border-primary/20 shadow-2xl rounded-2xl">
          <CardHeader className="text-center pt-8">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-black">ইমেইল কনফার্ম করুন</CardTitle>
            <CardDescription className="font-medium">
              আপনার একাউন্টটি সুরক্ষিত রাখতে ইমেইল ভেরিফাই করা প্রয়োজন।
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <Alert className="rounded-xl border-primary/20 bg-primary/5">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertDescription className="text-xs font-bold">
                আমরা <span className="text-primary">{user.email}</span> ঠিকানায় একটি লিংক পাঠিয়েছি। দয়া করে সেটি চেক করুন।
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 pb-8">
            <Button onClick={() => window.location.reload()} className="w-full h-12 text-sm font-black rounded-xl gap-2">
              <RefreshCw className="h-4 w-4" />
              কনফার্ম করেছি
            </Button>
            <Button variant="ghost" onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }} className="w-full text-xs font-bold">
              লগ আউট
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (needsInfo) {
    return (
      <div className="min-h-screen pt-20 pb-12 bg-secondary/10">
        <IELTSInfoForm userId={user.id} onComplete={() => {
          setNeedsInfo(false);
          fetchData();
        }} />
      </div>
    );
  }

    return (
      <div className="min-h-screen pt-16 pb-8 bg-secondary/10 font-hind-siliguri">
        <div className="container mx-auto px-4 max-w-5xl">
            <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h1 className="text-xl font-black leading-tight">স্বাগতম, {user?.profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0]}!</h1>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">আপনার অগ্রগতির ওপর নজর রাখুন</p>
              </div>
              <Button asChild size="sm" className="h-8 px-4 font-black rounded-lg shadow-sm text-[11px]">
                <Link href="/tests">নতুন টেস্ট শুরু করুন</Link>
              </Button>
            </div>
  
              <div className="grid lg:grid-cols-3 gap-3">
                <div className="lg:col-span-2 space-y-3">
                    {user?.profile?.target_score && (
                      <Card className="border-primary/20 bg-primary/5 overflow-hidden rounded-lg border shadow-sm">
                        <CardHeader className="py-1.5 px-3 border-b border-primary/10">
                          <CardTitle className="flex items-center gap-1.5 text-primary text-[9px] font-black uppercase tracking-tight">
                            <Target className="h-3 w-3" />
                            আইইএলটিএস লক্ষ্য
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-2 px-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div className="space-y-0">
                              <p className="text-[8px] text-muted-foreground uppercase font-black opacity-60 leading-tight mb-0.5">টেস্ট টাইপ</p>
                              <p className="font-black text-[10px] leading-tight">{user.profile.test_type || "Academic"}</p>
                            </div>
                            <div className="space-y-0">
                              <p className="text-[8px] text-muted-foreground uppercase font-black opacity-60 leading-tight mb-0.5">টার্গেট স্কোর</p>
                              <p className="font-black text-primary text-[10px] leading-tight">ব্যান্ড {user.profile.target_score}</p>
                            </div>
                            <div className="space-y-0">
                              <p className="text-[8px] text-muted-foreground uppercase font-black opacity-60 leading-tight mb-0.5">বর্তমান লেভেল</p>
                              <p className="font-black text-[10px] leading-tight">{user.profile.current_level || "নির্ধারণ করা হয়নি"}</p>
                            </div>
                            <div className="space-y-0">
                              <p className="text-[8px] text-muted-foreground uppercase font-black opacity-60 leading-tight mb-0.5">পরীক্ষার তারিখ</p>
                              <p className="font-black text-[10px] leading-tight">{user.profile.exam_date ? new Date(user.profile.exam_date).toLocaleDateString('bn-BD') : "বুক করা হয়নি"}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
  
                    <Card className="border-border/40 bg-card/40 backdrop-blur-sm rounded-lg overflow-hidden shadow-sm">
                      <CardHeader className="py-1.5 px-3 border-b border-border/40">
                        <CardTitle className="text-[9px] font-black uppercase tracking-tight">টেস্ট হিস্ট্রি</CardTitle>
                      </CardHeader>
                      <CardContent className="p-1.5 px-3">
                        {results.length === 0 ? (
                          <div className="text-center py-3">
                            <h3 className="text-[10px] font-black mb-1">কোনো টেস্ট দেওয়া হয়নি</h3>
                            <Button asChild size="sm" variant="outline" className="h-6 px-3 rounded-md font-black text-[9px]">
                              <Link href="/tests">টেস্ট শুরু করুন</Link>
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {results.slice(0, 4).map((result) => (
                              <div key={result.id} className="flex items-center justify-between p-1.5 rounded-md border border-border/40 bg-background/30 hover:bg-background/60 transition-all group">
                                <div className="flex items-center gap-2">
                                  <div className="h-6 w-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                    <Award className="h-3.5 w-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="font-bold text-[10px] truncate max-w-[140px] leading-tight mb-0">{result.mock_tests?.title}</h4>
                                    <p className="text-[7px] text-muted-foreground font-bold uppercase tracking-tight leading-none">
                                      {new Date(result.created_at).toLocaleDateString('bn-BD')}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-right">
                                    <div className="text-[11px] font-black text-primary leading-none">{result.overall_band || "—"}</div>
                                    <div className="text-[6px] text-muted-foreground font-black uppercase tracking-tight leading-none">ব্যান্ড</div>
                                  </div>
                                  <Button asChild variant="ghost" size="icon" className="h-5 w-5 group-hover:translate-x-1 transition-transform">
                                    <Link href={`/tests/${result.test_id}/results`}>
                                      <ChevronRight className="h-3 w-3" />
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                </div>
  
                <div className="space-y-3">
                  <Card className="border-border/40 bg-card/40 backdrop-blur-sm rounded-lg overflow-hidden shadow-sm">
                    <CardHeader className="py-1.5 px-3 border-b border-border/40 bg-secondary/10">
                      <CardTitle className="text-[9px] font-black uppercase tracking-tight">আমার টেস্টসমূহ</CardTitle>
                    </CardHeader>
                    <CardContent className="p-1.5 px-3 space-y-1">
                      {purchases.length === 0 ? (
                        <div className="text-center py-1">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">খালি</p>
                        </div>
                      ) : (
                        purchases.slice(0, 3).map((purchase) => (
                          <div key={purchase.id} className="flex items-center justify-between p-1.5 rounded-md bg-background/40 border border-border/40">
                            <div className="min-w-0 flex-1">
                              <p className="font-black text-[10px] truncate leading-tight mb-0">{purchase.mock_tests?.title}</p>
                              <p className="text-[7px] font-bold text-muted-foreground uppercase tracking-tight leading-none">
                                {purchase.expires_at 
                                  ? `মেয়াদ: ${new Date(purchase.expires_at).toLocaleDateString('bn-BD')}`
                                  : `কেনা: ${new Date(purchase.created_at).toLocaleDateString('bn-BD')}`}
                              </p>
                            </div>
                            <Badge variant="outline" className="ml-1 text-[6px] px-1 py-0 font-black border-green-500/30 bg-green-500/5 text-green-500 rounded-sm">ACTIVE</Badge>
                          </div>
                        ))
                      )}
                      <Button asChild variant="outline" size="sm" className="w-full mt-1 h-7 text-[9px] font-black rounded-md border-primary/20 hover:bg-primary/5">
                        <Link href="/tests">টেস্ট দেখুন</Link>
                      </Button>
                    </CardContent>
                  </Card>
  
                  <Card className="border-border/40 bg-card/40 backdrop-blur-sm rounded-lg overflow-hidden shadow-sm">
                    <CardHeader className="py-1.5 px-3 border-b border-border/40 bg-secondary/10">
                      <CardTitle className="text-[9px] font-black uppercase tracking-tight">রিসোর্স</CardTitle>
                    </CardHeader>
                    <CardContent className="p-1.5 px-3 space-y-1">
                      <Button asChild className="w-full justify-start h-7 text-[9px] font-black rounded-md border-border/40 bg-background/30" variant="outline">
                        <Link href="/tests?tab=practice">
                          <FileText className="mr-1.5 h-3 w-3 text-primary" />
                          প্র্যাকটিস ম্যাটেরিয়াল
                        </Link>
                      </Button>
                      <Button asChild className="w-full justify-start h-7 text-[9px] font-black rounded-md border-border/40 bg-background/30" variant="outline">
                        <Link href="/settings">
                          <TrendingUp className="mr-1.5 h-3 w-3 text-primary" />
                          প্রোফাইল আপডেট
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
        </div>
      </div>
    );

}
