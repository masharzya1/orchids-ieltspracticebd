"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Mail, Save, Plus, Trash2, Info } from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  updated_at: string;
}

export default function EmailSettingsPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fromEmail, setFromEmail] = useState("ielts-practice-bd <[email protected]>");

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    setLoading(true);
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .order("name");
    
    if (data) setTemplates(data);
    setLoading(false);
  }

  const handleUpdateTemplate = async (template: EmailTemplate) => {
    setSaving(true);
    const { error } = await supabase
      .from("email_templates")
      .update({
        subject: template.subject,
        body: template.body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", template.id);

    if (error) toast.error("Failed to save template");
    else toast.success(`Template "${template.name}" updated`);
    setSaving(false);
  };

  const handleCreateTemplate = async () => {
    const name = prompt("Enter template name (e.g. welcome_email):");
    if (!name) return;

    const { error } = await supabase.from("email_templates").insert({
      name,
      subject: "Welcome to IELTS Practice BD",
      body: "Hi {{name}},\n\nWelcome to our platform!",
    });

    if (error) toast.error("Failed to create template");
    else { toast.success("Template created"); fetchTemplates(); }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const { error } = await supabase.from("email_templates").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Template deleted"); fetchTemplates(); }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Email Settings</h1>
        <p className="text-muted-foreground">Manage your custom email templates and domain.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Sender Configuration</CardTitle>
          <CardDescription>Configure your custom domain and sender address.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>From Email Address</Label>
            <Input 
              value={fromEmail} 
              onChange={(e) => setFromEmail(e.target.value)} 
              placeholder="Your Name <[email protected]>"
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Info className="h-3 w-3" /> 
              Ensure your domain is verified in the Resend dashboard.
            </p>
          </div>
          <Button onClick={() => toast.success("Settings saved (Simulated)")}>Save Settings</Button>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Email Templates</h2>
        <Button onClick={handleCreateTemplate}><Plus className="h-4 w-4 mr-2" /> New Template</Button>
      </div>

      <div className="grid gap-6">
        {templates.map((template, idx) => (
          <Card key={template.id}>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription>Updated {new Date(template.updated_at).toLocaleDateString()}</CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteTemplate(template.id)}><Trash2 className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input 
                  value={template.subject} 
                  onChange={(e) => {
                    const newTemplates = [...templates];
                    newTemplates[idx].subject = e.target.value;
                    setTemplates(newTemplates);
                  }} 
                />
              </div>
              <div className="space-y-2">
                <Label>Body (HTML supported)</Label>
                <Textarea 
                  rows={8} 
                  value={template.body} 
                  onChange={(e) => {
                    const newTemplates = [...templates];
                    newTemplates[idx].body = e.target.value;
                    setTemplates(newTemplates);
                  }} 
                />
                <p className="text-xs text-muted-foreground italic">Use placeholders like {"{{name}}"}, {"{{url}}"} in your templates.</p>
              </div>
              <Button onClick={() => handleUpdateTemplate(template)} disabled={saving} className="w-full sm:w-auto">
                <Save className="h-4 w-4 mr-2" /> Save Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
