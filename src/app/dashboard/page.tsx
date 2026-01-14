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
        <div className="min-h-screen pt-20 pb-12 bg-secondary/10 font-hind-siliguri">
          <div className="container mx-auto px-4 max-w-6xl">
              <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-black leading-tight">স্বাগতম, {user?.profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0]}!</h1>
                  <p className="text-sm font-bold text-muted-foreground mt-1">আপনার অগ্রগতির ওপর নজর রাখুন</p>
                </div>
                <Button asChild size="default" className="h-11 px-6 font-black rounded-xl shadow-md text-sm">
                  <Link href="/tests">নতুন টেস্ট শুরু করুন</Link>
                </Button>
              </div>
    
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                      {user?.profile?.target_score && (
                        <Card className="border-primary/20 bg-primary/5 overflow-hidden rounded-2xl border shadow-lg">
                          <CardHeader className="py-4 px-6 border-b border-primary/10">
                            <CardTitle className="flex items-center gap-2 text-primary text-sm font-black uppercase tracking-tight">
                              <Target className="h-4 w-4" />
                              আইইএলটিএস লক্ষ্য
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase font-bold opacity-70">টেস্ট টাইপ</p>
                                <p className="font-black text-base">{user.profile.test_type || "Academic"}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase font-bold opacity-70">টার্গেট স্কোর</p>
                                <p className="font-black text-primary text-lg">ব্যান্ড {user.profile.target_score}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase font-bold opacity-70">বর্তমান লেভেল</p>
                                <p className="font-black text-base">{user.profile.current_level || "নির্ধারণ করা হয়নি"}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase font-bold opacity-70">পরীক্ষার তারিখ</p>
                                <p className="font-black text-base">{user.profile.exam_date ? new Date(user.profile.exam_date).toLocaleDateString('bn-BD') : "বুক করা হয়নি"}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
    
                      <Card className="border-border/40 bg-card/40 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg">
                        <CardHeader className="py-4 px-6 border-b border-border/40">
                          <CardTitle className="text-sm font-black uppercase tracking-tight">টেস্ট হিস্ট্রি</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 px-6">
                          {results.length === 0 ? (
                            <div className="text-center py-8">
                              <h3 className="text-base font-black mb-2">কোনো টেস্ট দেওয়া হয়নি</h3>
                              <p className="text-sm text-muted-foreground mb-4">এখনই আপনার প্রথম টেস্ট দিন</p>
                              <Button asChild size="default" variant="outline" className="h-10 px-6 rounded-xl font-black text-sm">
                                <Link href="/tests">টেস্ট শুরু করুন</Link>
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {results.slice(0, 5).map((result) => (
                                <div key={result.id} className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-background/30 hover:bg-background/60 transition-all group">
                                  <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                      <Award className="h-6 w-6" />
                                    </div>
                                    <div className="min-w-0">
                                      <h4 className="font-bold text-base truncate max-w-[200px] leading-tight">{result.mock_tests?.title}</h4>
                                      <p className="text-xs text-muted-foreground font-bold mt-0.5">
                                        {new Date(result.created_at).toLocaleDateString('bn-BD')}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <div className="text-xl font-black text-primary leading-none">{result.overall_band || "—"}</div>
                                      <div className="text-[10px] text-muted-foreground font-black uppercase tracking-tight leading-none mt-1">ব্যান্ড</div>
                                    </div>
                                    <Button asChild variant="ghost" size="icon" className="h-10 w-10 group-hover:translate-x-1 transition-transform">
                                      <Link href={`/tests/${result.test_id}/results`}>
                                        <ChevronRight className="h-5 w-5" />
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
    
                  <div className="space-y-6">
                    <Card className="border-border/40 bg-card/40 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg">
                      <CardHeader className="py-4 px-6 border-b border-border/40 bg-secondary/10">
                        <CardTitle className="text-sm font-black uppercase tracking-tight">আমার টেস্টসমূহ</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 px-6 space-y-3">
                        {purchases.length === 0 ? (
                          <div className="text-center py-4">
                            <p className="text-sm font-bold text-muted-foreground">কোনো টেস্ট কেনা হয়নি</p>
                          </div>
                        ) : (
                          purchases.slice(0, 4).map((purchase) => (
                            <div key={purchase.id} className="flex items-center justify-between p-4 rounded-xl bg-background/40 border border-border/40">
                              <div className="min-w-0 flex-1">
                                <p className="font-black text-sm truncate leading-tight">{purchase.mock_tests?.title}</p>
                                <p className="text-xs font-bold text-muted-foreground mt-1">
                                  {purchase.expires_at 
                                    ? `মেয়াদ: ${new Date(purchase.expires_at).toLocaleDateString('bn-BD')}`
                                    : `কেনা: ${new Date(purchase.created_at).toLocaleDateString('bn-BD')}`}
                                </p>
                              </div>
                              <Badge variant="outline" className="ml-2 text-xs px-2 py-0.5 font-black border-green-500/30 bg-green-500/5 text-green-500 rounded-lg">ACTIVE</Badge>
                            </div>
                          ))
                        )}
                        <Button asChild variant="outline" size="default" className="w-full mt-2 h-11 text-sm font-black rounded-xl border-primary/20 hover:bg-primary/5">
                          <Link href="/tests">সব টেস্ট দেখুন</Link>
                        </Button>
                      </CardContent>
                    </Card>
    
                    <Card className="border-border/40 bg-card/40 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg">
                      <CardHeader className="py-4 px-6 border-b border-border/40 bg-secondary/10">
                        <CardTitle className="text-sm font-black uppercase tracking-tight">রিসোর্স</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 px-6 space-y-3">
                        <Button asChild className="w-full justify-start h-11 text-sm font-black rounded-xl border-border/40 bg-background/30" variant="outline">
                          <Link href="/tests?tab=practice">
                            <FileText className="mr-3 h-4 w-4 text-primary" />
                            প্র্যাকটিস ম্যাটেরিয়াল
                          </Link>
                        </Button>
                        <Button asChild className="w-full justify-start h-11 text-sm font-black rounded-xl border-border/40 bg-background/30" variant="outline">
                          <Link href="/settings">
                            <TrendingUp className="mr-3 h-4 w-4 text-primary" />
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
