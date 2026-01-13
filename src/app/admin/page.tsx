import { createClient } from "@/lib/supabase/server";
import { Users, BookOpen, CreditCard, TrendingUp, ArrowRight } from "lucide-react";
import { FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const { count: userCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: testCount } = await supabase
    .from("mock_tests")
    .select("*", { count: "exact", head: true });

  const { data: recentPurchases } = await supabase
    .from("purchases")
    .select("*, mock_tests(title), profiles(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(5);

    const stats = [
      { label: "Total Users", value: userCount || 0, icon: Users, color: "text-blue-500" },
      { label: "Mock Tests", value: testCount || 0, icon: BookOpen, color: "text-green-500" },
      { label: "Total Revenue", value: "৳০", icon: TrendingUp, color: "text-purple-500" },
      { label: "Total Sales", value: "০", icon: CreditCard, color: "text-orange-500" },
    ];

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">কন্টেন্ট ম্যানেজমেন্ট সিস্টেম</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link href="/admin/tests?type=mock" className="group relative bg-card border border-border p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-colors"></div>
            <div className="flex items-center gap-6 mb-6">
              <div className="p-5 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-black transition-all duration-500 shadow-lg">
                <BookOpen className="h-10 w-10" />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight">Mock</h2>
                <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Test Management</p>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed font-medium mb-6">
              মক টেস্ট ম্যানেজ করুন। পরীক্ষার সময়, তারিখ এবং প্রাইস সেট করুন।
            </p>
            <div className="flex items-center text-primary font-bold group-hover:gap-3 transition-all">
              Manage Mock Tests <ArrowRight className="h-5 w-5 ml-2" />
            </div>
          </Link>

          <Link href="/admin/tests?type=practice" className="group relative bg-card border border-border p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-green-500/20 transition-colors"></div>
            <div className="flex items-center gap-6 mb-6">
              <div className="p-5 rounded-2xl bg-green-500/10 text-green-500 group-hover:bg-green-500 group-hover:text-white transition-all duration-500 shadow-lg">
                <FileText className="h-10 w-10" />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight">Practice</h2>
                <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Material Management</p>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed font-medium mb-6">
              প্র্যাকটিস ম্যাটেরিয়াল, পিডিএফ এবং স্টাডি কন্টেন্ট আপলোড করুন।
            </p>
            <div className="flex items-center text-green-600 font-bold group-hover:gap-3 transition-all">
              Manage Practice <ArrowRight className="h-5 w-5 ml-2" />
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border p-6 rounded-3xl">
            <h3 className="text-xl font-bold mb-4">Quick Stats</h3>
            <div className="space-y-4">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30">
                  <div className="flex items-center gap-3">
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    <span className="text-sm font-medium">{stat.label}</span>
                  </div>
                  <span className="font-bold">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 bg-card border border-border rounded-3xl p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Recent Purchases
            </h2>
            <div className="space-y-4">
              {recentPurchases?.map((purchase: any) => (
                <div key={purchase.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
                  <div>
                    <p className="font-semibold">{purchase.profiles?.full_name || "Unknown User"}</p>
                    <p className="text-sm text-muted-foreground">{purchase.mock_tests?.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">৳{Number(purchase.amount).toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(purchase.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {(!recentPurchases || recentPurchases.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  No recent purchases found.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-start gap-1 rounded-xl">
                <Link href="/admin/tests">
                  <span className="font-semibold">Add New Test</span>
                  <span className="text-xs text-muted-foreground">Create a mock test</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-start gap-1 rounded-xl">
                <Link href="/admin/users">
                  <span className="font-semibold">User Management</span>
                  <span className="text-xs text-muted-foreground">Manage accounts</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
}
