"use client";

import { useEffect, useState } from "react";
import { 
  Settings as SettingsIcon, 
  Save, 
  Mail, 
  Server, 
  CreditCard, 
  Database, 
  Globe, 
  ShieldCheck, 
  Zap, 
  Loader2,
  Plus,
  Trash2,
  Eye,
  Code
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("general");

    // Settings State
    const [settings, setSettings] = useState<any>({
      general: {
        site_name: "IELTS Practice BD",
        site_description: "Achieve your target band score with realistic mock tests.",
        support_email: "support@ieltspracticebd.com",
        pricing_model: "hybrid"
      },
      email: {
        provider: "smtp",
        smtp_host: "",
        smtp_port: "587",
        smtp_user: "",
        smtp_pass: "",
        from_email: "noreply@ieltspracticebd.com",
        from_name: "IELTS Practice BD",
        template: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: #111; padding: 40px 20px; text-align: center; }
    .logo { color: #a3e635; font-size: 24px; font-weight: bold; letter-spacing: -1px; }
    .content { padding: 40px 30px; }
    .footer { text-align: center; padding: 30px; background: #f9f9f9; color: #888; font-size: 12px; }
    .button { display: inline-block; background: #a3e635; color: #000; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">ielts<span style="color:white">practice</span>bd</div>
    </div>
    <div class="content">
      <h2 style="margin-top:0">Welcome to Excellence</h2>
      <p>Hi {{name}},</p>
      <p>Thank you for joining our platform. We're excited to help you achieve your target IELTS band score.</p>
      <p>Click the button below to explore our latest mock tests:</p>
      <a href="{{url}}" class="button">Start Practice Now</a>
    </div>
    <div class="footer">
      <p>&copy; 2024 IELTS Practice BD. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`
      },
        payments: {
          rupantor_pay: { enabled: false, api_key: "" },
        },
      database: {
        url: "",
        service_role_key: "",
        anon_key: ""
      }
    });

    useEffect(() => {
      fetchSettings();
    }, []);

    async function fetchSettings() {
      setLoading(true);
      const { data, error } = await supabase.from("site_settings").select("*");
      
      if (data) {
        const newSettings = { ...settings };
        data.forEach((item: any) => {
          if (item.key === "email_settings") newSettings.email = item.value;
          if (item.key === "payment_settings") newSettings.payments = item.value;
          if (item.key === "database_settings") newSettings.database = item.value;
          if (item.key === "general_settings") newSettings.general = item.value;
        });
        setSettings(newSettings);
      }
      setLoading(false);
    }

    async function handleSave(category: string) {
      setSaving(true);
      let key = "";
      let value = {};

      if (category === "general") { key = "general_settings"; value = settings.general; }
      if (category === "email") { key = "email_settings"; value = settings.email; }
      if (category === "payments") { key = "payment_settings"; value = settings.payments; }
      if (category === "database") { key = "database_settings"; value = settings.database; }

      const { error } = await supabase
        .from("site_settings")
        .upsert({ key, value, updated_at: new Date().toISOString() });

      if (error) {
        toast.error("Failed to save: " + error.message);
      } else {
        toast.success("Settings saved successfully");
      }
      setSaving(false);
    }

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    return (
      <div className="space-y-8 pb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">System Settings</h1>
            <p className="text-muted-foreground">Configure your platform's core infrastructure and services.</p>
          </div>
          <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
            Admin Mode
          </Badge>
        </div>

        <Tabs defaultValue="general" onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-[800px] mb-8">
            <TabsTrigger value="general" className="gap-2"><SettingsIcon className="h-4 w-4" />General</TabsTrigger>
            <TabsTrigger value="email" className="gap-2"><Mail className="h-4 w-4" />Email</TabsTrigger>
            <TabsTrigger value="payments" className="gap-2"><CreditCard className="h-4 w-4" />Payments</TabsTrigger>
            <TabsTrigger value="database" className="gap-2"><Database className="h-4 w-4" />Database</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle>General Configuration</CardTitle>
                <CardDescription>Basic site identity and behavior.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Site Name</Label>
                    <Input 
                      value={settings.general.site_name}
                      onChange={(e) => setSettings({...settings, general: {...settings.general, site_name: e.target.value}})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Support Email</Label>
                    <Input 
                      value={settings.general.support_email}
                      onChange={(e) => setSettings({...settings, general: {...settings.general, support_email: e.target.value}})}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Site Description</Label>
                    <Textarea 
                      value={settings.general.site_description}
                      onChange={(e) => setSettings({...settings, general: {...settings.general, site_description: e.target.value}})}
                    />
                  </div>
                </div>
                <div className="pt-4">
                  <Button onClick={() => handleSave("general")} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save General Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle>SMTP / Email Service</CardTitle>
                  <CardDescription>Configure how your system sends emails.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>SMTP Host</Label>
                    <Input 
                      placeholder="smtp.resend.com"
                      value={settings.email.smtp_host}
                      onChange={(e) => setSettings({...settings, email: {...settings.email, smtp_host: e.target.value}})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Port</Label>
                      <Input 
                        placeholder="587"
                        value={settings.email.smtp_port}
                        onChange={(e) => setSettings({...settings, email: {...settings.email, smtp_port: e.target.value}})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sender Name</Label>
                      <Input 
                        value={settings.email.from_name}
                        onChange={(e) => setSettings({...settings, email: {...settings.email, from_name: e.target.value}})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>SMTP Username</Label>
                    <Input 
                      value={settings.email.smtp_user}
                      onChange={(e) => setSettings({...settings, email: {...settings.email, smtp_user: e.target.value}})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SMTP Password</Label>
                    <Input 
                      type="password"
                      value={settings.email.smtp_pass}
                      onChange={(e) => setSettings({...settings, email: {...settings.email, smtp_pass: e.target.value}})}
                    />
                  </div>
                  <div className="pt-4">
                    <Button onClick={() => handleSave("email")} disabled={saving}>
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Email Config
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Email Template</CardTitle>
                      <CardDescription>Live edit your system emails.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="gap-1"><Code className="h-3 w-3" /> HTML</Badge>
                      <Badge variant="outline" className="gap-1"><Eye className="h-3 w-3" /> Preview</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea 
                    className="font-mono text-xs h-[300px] bg-black/30"
                    value={settings.email.template}
                    onChange={(e) => setSettings({...settings, email: {...settings.email, template: e.target.value}})}
                  />
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 text-xs text-muted-foreground">
                    Available variables: <code className="text-primary">{"{{name}}"}</code>, <code className="text-primary">{"{{url}}"}</code>, <code className="text-primary">{"{{otp}}"}</code>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Rupantor Pay */}
                <Card className={`bg-card/50 border-border/50 transition-all ${settings.payments.rupantor_pay.enabled ? 'ring-1 ring-primary' : 'opacity-60'}`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-[10px]">
                          RUP
                        </div>
                        <CardTitle className="text-lg">Rupantor Pay</CardTitle>
                      </div>
                      <Switch 
                        checked={settings.payments.rupantor_pay.enabled}
                        onCheckedChange={(v) => setSettings({...settings, payments: {...settings.payments, rupantor_pay: {...settings.payments.rupantor_pay, enabled: v}}})}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <Label className="text-xs">API Key</Label>
                      <Input className="h-8 text-xs" value={settings.payments.rupantor_pay.api_key} onChange={(e) => setSettings({...settings, payments: {...settings.payments, rupantor_pay: {...settings.payments.rupantor_pay, api_key: e.target.value}}})}/>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 text-[10px] text-muted-foreground">
                      <p className="font-bold mb-1">Integration Guide:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>Get your API key from <a href="https://rupantorpay.com" target="_blank" className="text-primary hover:underline">Rupantor Pay Dashboard</a></li>
                        <li>Set your Webhook URL to: <code className="text-primary">{typeof window !== 'undefined' ? `${window.location.origin}/api/payment/rupantor-webhook` : '/api/payment/rupantor-webhook'}</code></li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="flex justify-center pt-6">
                <Button size="lg" className="w-full md:w-auto px-12" onClick={() => handleSave("payments")} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Update Payment Gateways
                </Button>
              </div>
            </TabsContent>

          <TabsContent value="database" className="space-y-6">
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle>Infrastructure & Secrets</CardTitle>
                <CardDescription>Critical backend configuration. Handle with extreme care.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Database URL (Direct Connection)</Label>
                    <Input 
                      type="password"
                      placeholder="postgresql://postgres:password@host:5432/postgres"
                      value={settings.database.url}
                      onChange={(e) => setSettings({...settings, database: {...settings.database, url: e.target.value}})}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Supabase Service Role Key</Label>
                      <Input 
                        type="password"
                        value={settings.database.service_role_key}
                        onChange={(e) => setSettings({...settings, database: {...settings.database, service_role_key: e.target.value}})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Supabase Anon Key</Label>
                      <Input 
                        type="password"
                        value={settings.database.anon_key}
                        onChange={(e) => setSettings({...settings, database: {...settings.database, anon_key: e.target.value}})}
                      />
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <Button variant="destructive" onClick={() => handleSave("database")} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    Save Critical Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-500">
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle className="font-bold">Security Notice</AlertTitle>
              <AlertDescription className="text-xs">
                Changes here will take effect immediately. Ensure your keys are correct to avoid service disruption.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </div>
    );
}

function Alert({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={`p-4 rounded-lg border flex gap-3 ${className}`}>{children}</div>
}

function AlertTitle({ children, className }: { children: React.ReactNode, className?: string }) {
  return <h5 className={`font-semibold leading-none tracking-tight ${className}`}>{children}</h5>
}

function AlertDescription({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={`text-sm opacity-90 ${className}`}>{children}</div>
}
