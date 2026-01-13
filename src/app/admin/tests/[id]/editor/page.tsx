"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import CDIAdminEditor from "@/components/CDIAdminEditor";
import { Loader2, Headphones, BookOpen, PenTool, MessageSquare, ArrowRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminTestEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const testId = resolvedParams.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [activePartId, setActivePartId] = useState<string | null>(null);

  useEffect(() => {
    fetchTestData();
  }, [testId]);

  async function fetchTestData() {
    setLoading(true);
    try {
      const { data: testData } = await supabase.from("mock_tests").select("*").eq("id", testId).single();
      if (!testData) {
        router.push("/admin/tests");
        return;
      }
      setTest(testData);

      const { data: sectionsData } = await supabase.from("test_sections").select("*").eq("test_id", testId).order("order_index");
      if (sectionsData) {
        setSections(sectionsData);
        // Initially, we stay in the "Modules Overview" if activeSectionId is null

        const sectionIds = sectionsData.map(s => s.id);
        const [partsRes, questionsRes] = await Promise.all([
          supabase.from("test_parts").select("*").in("section_id", sectionIds).order("order_index"),
          supabase.from("questions").select("*").in("section_id", sectionIds).order("order_index")
        ]);

        if (partsRes.data) setParts(partsRes.data);
        if (questionsRes.data) setQuestions(questionsRes.data);
      }
    } catch (err) {
      console.error("Error fetching test data:", err);
      toast.error("Failed to load test data");
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async (data: { parts: any[], questions: any[] }) => {
    try {
      // 1. Update/Insert Parts
      for (const part of data.parts) {
        const partData = {
          section_id: part.section_id,
          part_number: part.part_number,
          title: part.title,
          instructions: part.instructions,
          passage_text: part.passage_text,
          audio_url: part.audio_url,
          order_index: part.order_index
        };

        if (part.id && !part.id.toString().startsWith('temp-')) {
          await supabase.from("test_parts").update(partData).eq("id", part.id);
        } else {
          const { data: newPart } = await supabase.from("test_parts").insert(partData).select().single();
          if (newPart) {
            // Update temporary part IDs in questions
            data.questions = data.questions.map(q => 
              (q.part_id === part.id || q.temp_part_id === part.id) ? { ...q, part_id: newPart.id } : q
            );
          }
        }
      }

      // 2. Update/Insert Questions
      for (const q of data.questions) {
        const qData = {
          section_id: q.section_id,
          part_id: q.part_id,
          question_type: q.question_type,
          question_text: q.question_text,
          options: q.options,
          correct_answer: q.correct_answer,
          points: q.points,
          order_index: q.order_index
        };

        if (q.id && !q.id.toString().startsWith('temp-')) {
          await supabase.from("questions").update(qData).eq("id", q.id);
        } else {
          await supabase.from("questions").insert(qData);
        }
      }

      toast.success("Changes saved successfully");
      fetchTestData();
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save some changes");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white gap-6">
        <div className="relative">
          <div className="h-24 w-24 rounded-full border-4 border-[#0072bc]/10 animate-pulse"></div>
          <Loader2 className="h-12 w-12 animate-spin text-[#0072bc] absolute inset-0 m-auto" />
        </div>
        <div className="text-center">
          <p className="text-xl font-black tracking-tighter text-[#222]">OPENING VISUAL EDITOR</p>
          <p className="text-[#666] text-xs font-bold uppercase tracking-widest mt-1">Applying IDP Standard Theme...</p>
        </div>
      </div>
    );
  }

  const activeSection = sections.find(s => s.id === activeSectionId);
  
  // Dashboard / Module Selection View
  if (!activeSectionId) {
    return (
      <div className="fixed inset-0 bg-[#f8f9fa] flex flex-col font-hind-siliguri">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black text-[#DC2626]">IELTS</h1>
            <div className="h-8 w-px bg-gray-200" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Visual Test Editor</span>
              <span className="text-lg font-black text-[#222] truncate max-w-[300px]">{test?.title}</span>
            </div>
          </div>
          <button 
            onClick={() => router.push(`/admin/tests/${testId}`)}
            className="flex items-center gap-2 px-6 h-10 bg-white border border-gray-200 rounded-xl text-sm font-black hover:bg-gray-50 transition-all shadow-sm"
          >
            EXIT EDITOR
          </button>
        </header>

        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col mb-12">
              <h2 className="text-4xl font-black text-[#222] tracking-tighter">Test Modules</h2>
              <p className="text-muted-foreground font-bold text-sm uppercase tracking-widest mt-2">Select a module to begin visual editing</p>
            </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {sections.map(s => {
                  const sectionParts = parts.filter(p => p.section_id === s.id);
                  const sectionQuestions = questions.filter(q => q.section_id === s.id);
                  const isBlue = s.section_type === 'reading' || s.section_type === 'listening';
                  const isRed = s.section_type === 'writing';
                  const themeColor = isBlue ? "#0072bc" : isRed ? "#DC2626" : "#7c3aed";
                  const themeBg = isBlue ? "bg-[#0072bc]" : isRed ? "bg-[#DC2626]" : "bg-[#7c3aed]";
                  const themeLightBg = isBlue ? "bg-[#0072bc]/5" : isRed ? "bg-[#DC2626]/5" : "bg-[#7c3aed]/5";
                  
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveSectionId(s.id)}
                      className={cn(
                        "group bg-white p-8 rounded-[2rem] border-2 border-transparent shadow-xl hover:shadow-2xl transition-all duration-500 text-left relative overflow-hidden flex flex-col items-start",
                        isBlue ? "hover:border-[#0072bc]" : isRed ? "hover:border-[#DC2626]" : "hover:border-[#7c3aed]"
                      )}
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-6xl font-black uppercase">{s.section_type[0]}</span>
                      </div>
                      
                      <div className={cn(
                        "h-16 w-16 rounded-2xl flex items-center justify-center mb-8 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3 group-hover:text-white",
                        themeLightBg,
                        isBlue ? "text-[#0072bc] group-hover:bg-[#0072bc]" : 
                        isRed ? "text-[#DC2626] group-hover:bg-[#DC2626]" : 
                        "text-[#7c3aed] group-hover:bg-[#7c3aed]"
                      )}>
                        {s.section_type === 'listening' ? <Headphones size={32}/> : 
                         s.section_type === 'reading' ? <BookOpen size={32}/> : 
                         s.section_type === 'writing' ? <PenTool size={32}/> : 
                         <MessageSquare size={32}/>}
                      </div>

                      <h3 className={cn(
                        "text-2xl font-black uppercase tracking-tight mb-2 transition-colors",
                        isBlue ? "group-hover:text-[#0072bc]" : isRed ? "group-hover:text-[#DC2626]" : "group-hover:text-[#7c3aed]"
                      )}>{s.section_type}</h3>
                      
                      <div className="mt-auto space-y-1">
                        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                          <div className={cn("w-1.5 h-1.5 rounded-full", isBlue ? "bg-[#0072bc]" : isRed ? "bg-[#DC2626]" : "bg-[#7c3aed]")} />
                          {sectionParts.length} Parts
                        </div>
                        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                          {sectionQuestions.length} Questions
                        </div>
                      </div>

                      <div className="absolute bottom-6 right-6 h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0 shadow-lg border border-gray-100">
                        <ArrowRight size={18} className={isBlue ? "text-[#0072bc]" : isRed ? "text-[#DC2626]" : "text-[#7c3aed]"} />
                      </div>
                    </button>
                  );
                })}
              </div>
          </div>
        </main>
      </div>
    );
  }

  // Inside a Module - Modules + Parts flow
  return (
    <div className="fixed inset-0 bg-white flex flex-col font-hind-siliguri overflow-hidden">
      {/* Mini Module Switcher */}
      <div className="h-12 bg-[#222] text-white flex items-center px-6 gap-2 shrink-0 overflow-x-auto no-scrollbar border-b border-black">
        <button 
          onClick={() => setActiveSectionId(null)}
          className="mr-4 text-[10px] font-black uppercase tracking-widest text-[#999] hover:text-white flex items-center gap-2 transition-colors"
        >
          <ChevronLeft size={12} /> ALL MODULES
        </button>
        <div className="h-4 w-px bg-white/10 mr-4" />
        {sections.map(s => {
          const isBlue = s.section_type === 'reading' || s.section_type === 'listening';
          const isRed = s.section_type === 'writing';
          const activeColor = isBlue ? "bg-[#0072bc]" : isRed ? "bg-[#DC2626]" : "bg-[#7c3aed]";
          
          return (
            <button
              key={s.id}
              onClick={() => setActiveSectionId(s.id)}
              className={cn(
                "h-8 px-5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-2",
                activeSectionId === s.id 
                  ? cn(activeColor, "text-white shadow-lg") 
                  : "text-[#999] hover:text-white hover:bg-white/5"
              )}
            >
              {s.section_type === 'listening' ? <Headphones size={10}/> : 
               s.section_type === 'reading' ? <BookOpen size={10}/> : 
               s.section_type === 'writing' ? <PenTool size={10}/> : 
               <MessageSquare size={10}/>}
              {s.section_type}
            </button>
          );
        })}
      </div>

      <CDIAdminEditor
        key={activeSectionId}
        testTitle={test?.title}
        section={activeSection}
        parts={parts.filter(p => p.section_id === activeSectionId)}
        questions={questions.filter(q => q.section_id === activeSectionId)}
        onSave={handleSave}
        onExit={() => setActiveSectionId(null)}
      />
    </div>
  );
}

