import { NextResponse } from 'next/server';
import { sendCustomEmail } from '@/lib/resend';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { to, templateName, data } = await req.json();

    // Fetch template from DB
    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', templateName)
      .single();

    if (error || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Replace placeholders
    let html = template.body;
    let subject = template.subject;
    
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, data[key]);
      subject = subject.replace(regex, data[key]);
    });

    const result = await sendCustomEmail({ to, subject, html });

    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
