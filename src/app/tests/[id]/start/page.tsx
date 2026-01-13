"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock, ChevronLeft, ChevronRight, Send, Headphones, BookOpen, PenTool, MessageSquare, CheckCircle2, Play, AlertCircle, ArrowLeft, FileText, Loader2, Music } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import IDPExamInterface from "@/components/IDPExamInterface";
import ExamTransition from "@/components/ExamTransition";

interface TestSection {
  id: string;
  section_type: string;
  title: string;
  time_limit: number;
  instructions: string;
  parts?: TestPart[];
}

interface TestPart {
  id: string;
  part_number: number;
  title: string;
  instructions: string;
  passage_text?: string;
  audio_url?: string;
}

interface Question {
  id: string;
  part_id: string;
  question_type: string;
  question_text: string;
  options: string[] | null;
  correct_answer: string;
  points: number;
  order_index: number;
}

export default function TestEnginePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const testId = resolvedParams.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<any>(null);
  const [sections, setSections] = useState<TestSection[]>([]);
  const [parts, setParts] = useState<TestPart[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  const [mode, setMode] = useState<"selection" | "exam">("selection");
  const [showTransition, setShowTransition] = useState(false);
  const [pendingSection, setPendingSection] = useState<TestSection | null>(null);
  const [activeSection, setActiveSection] = useState<TestSection | null>(null);
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [globalTimeLeft, setGlobalTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [testId]);

    // Global Timer Effect
    useEffect(() => {
      if (globalTimeLeft === null || globalTimeLeft <= 0 || test?.test_type !== "mock") return;

      const timer = setInterval(() => {
        setGlobalTimeLeft((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(timer);
            // Only auto-submit if in exam mode or has started sections
            if (mode === "exam" || completedSections.length > 0) {
              handleSubmitTest();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }, [globalTimeLeft, test, mode, completedSections]);

    async function fetchInitialData() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Check access
      const [testRes, purchaseRes, takenRes] = await Promise.all([
        supabase.from("mock_tests").select("*").eq("id", testId).single(),
        supabase.from("purchases").select("id, expires_at").eq("user_id", user.id).eq("test_id", testId).eq("status", "completed").maybeSingle(),
        supabase.from("user_results").select("id").eq("user_id", user.id).eq("test_id", testId).limit(1)
      ]);

      if (!testRes.data) {
        router.push("/tests");
        return;
      }

      const testData = testRes.data;
      const isFree = testData.is_free;
      const purchase = purchaseRes.data;
      const hasTaken = takenRes.data && takenRes.data.length > 0;
      
      const hasPurchased = !!purchase && (!purchase.expires_at || new Date(purchase.expires_at) > new Date());

      if (!isFree && !hasPurchased) {
        router.push(`/tests/${testId}`);
        return;
      }

      if (testData.test_type === "mock" && hasTaken && !isFree) {
        toast.error("এই মক টেস্টটি আপনি একবার দিয়ে ফেলেছেন।");
        router.push(`/tests/${testId}/results`);
        return;
      }

      setTest(testData);

      const [sectionsRes, partsRes] = await Promise.all([
        supabase.from("test_sections").select("*").eq("test_id", testId).order("order_index"),
        supabase.from("test_parts").select("*").in("section_id", (await supabase.from("test_sections").select("id").eq("test_id", testId)).data?.map(s => s.id) || []).order("part_number")
      ]);
      
        if (sectionsRes.data) {
          const sectionsWithParts = sectionsRes.data.map((s: any) => ({
            ...s,
            parts: partsRes.data?.filter(p => p.section_id === s.id) || []
          }));
          setSections(sectionsWithParts);

          // Initialize Global Timer for Mock Tests
          if (testData.test_type === "mock") {
            const totalMinutes = sectionsRes.data.reduce((acc: number, s: any) => acc + (s.time_limit || 0), 0);
            const storageKey = `test_start_${user.id}_${testId}`;
            const storedStart = localStorage.getItem(storageKey);
            
            if (storedStart) {
              const startTime = parseInt(storedStart);
              const elapsed = Math.floor((Date.now() - startTime) / 1000);
              const remaining = (totalMinutes * 60) - elapsed;
              
              if (remaining <= 0) {
                // If it's a very old session, just clear it and reset if nothing is done
                localStorage.removeItem(storageKey);
                setGlobalTimeLeft(totalMinutes * 60);
              } else {
                setGlobalTimeLeft(remaining);
              }
            } else {
              // Only set it once the user actually starts the first module
              setGlobalTimeLeft(totalMinutes * 60);
            }
          }

          // We no longer auto-start. The student selects the module.
          setMode("selection");
        }

      setLoading(false);
    }


  const startSection = async (section: TestSection) => {
    setPendingSection(section);
    setShowTransition(true);
  };

  const finalizeStartSection = async () => {
    if (!pendingSection) return;
    const section = pendingSection;
    setLoading(true);
    setShowTransition(false);

    // Set Global Start Time if not set
    if (test?.test_type === "mock") {
      const { data: { user } } = await supabase.auth.getUser();
      const storageKey = `test_start_${user?.id}_${testId}`;
      if (!localStorage.getItem(storageKey)) {
        const now = Date.now();
        localStorage.setItem(storageKey, now.toString());
        const totalMinutes = sections.reduce((acc, s) => acc + (s.time_limit || 0), 0);
        setGlobalTimeLeft(totalMinutes * 60);
      } else {
        // Double check remaining time
        if (globalTimeLeft !== null && globalTimeLeft <= 0) {
          toast.error("সময় শেষ!");
          setLoading(false);
          return;
        }
      }
    }

    setActiveSection(section);
    
    const [partsRes, questionsRes] = await Promise.all([
      supabase.from("test_parts").select("*").eq("section_id", section.id).order("part_number"),
      supabase.from("questions").select("*").eq("section_id", section.id).order("order_index")
    ]);

    if (partsRes.data) setParts(partsRes.data);
    if (questionsRes.data) setQuestions(questionsRes.data);
    
    setTimeLeft(section.time_limit * 60);
    setCurrentPartIndex(0);
    setMode("exam");
    setLoading(false);
  };

  useEffect(() => {
    if (timeLeft <= 0 || mode !== "exam") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishSection();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, mode]);

  const finishSection = () => {
    if (activeSection) {
      setCompletedSections(prev => [...prev, activeSection.id]);
    }
    setMode("selection");
    setActiveSection(null);
    setParts([]);
    setQuestions([]);
    toast.success("Section completed!");
  };

  const calculateScore = () => {
    let totalPoints = 0;
    let earnedPoints = 0;

    questions.forEach(q => {
      const correctAnswers = q.correct_answer.split(",").map(a => a.trim().toLowerCase());
      const userAnswers = (answers[q.id] || "").split(",").map((a: string) => a.trim().toLowerCase());
      
      totalPoints += q.points;

      if (q.question_type === "gap_fill") {
        const numGaps = q.question_text.match(/\[\[\d+\]\]/g)?.length || 1;
        let correctCount = 0;
        for (let i = 0; i < numGaps; i++) {
          if (userAnswers[i] === correctAnswers[i]) {
            correctCount++;
          }
        }
        // Award points proportionally
        earnedPoints += (correctCount / numGaps) * q.points;
      } else {
        if (correctAnswers.includes(userAnswers[0] || "")) {
          earnedPoints += q.points;
        }
      }
    });

    return { earnedPoints, totalPoints };
  };

  const handleSubmitTest = async () => {
    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    // Final score calculation (aggregating all sections)
    // For now, let's just save the results
    const { data: result, error } = await supabase.from("user_results").insert({
      user_id: user?.id,
      test_id: testId,
      answers: answers,
      scores: { completed: completedSections.length, total: sections.length },
    }).select().single();

      if (error) {
        toast.error("Failed to submit test");
        setIsSubmitting(false);
      } else {
        if (user) {
          localStorage.removeItem(`test_start_${user.id}_${testId}`);
        }
        toast.success("Final results submitted!");
        router.push(`/tests/${testId}/results?resultId=${result.id}`);
      }

  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

    const renderGapFill = (text: string, partId: string) => {
      if (!text) return null;
      
      const textParts = text.split(/(\[\[\d+\]\])/g);
      return (
        <div className="leading-relaxed text-lg">
          {textParts.map((item, i) => {
            const match = item.match(/\[\[(\d+)\]\]/);
            if (match) {
              const placeholder = match[0];
              const placeholderNum = match[1];
              
              const q = questions.find(q => q.part_id === partId && q.question_text.includes(placeholder));
              
                if (q) {
                  const allPlaceholdersInQ = q.question_text.match(/\[\[\d+\]\]/g) || [];
                  const pIndex = Math.max(0, allPlaceholdersInQ.indexOf(placeholder));
                  const currentVal = answers[q.id] || "";
                  const answerParts = typeof currentVal === 'string' ? currentVal.split(",") : [];
                  
                    return (
                      <Input 
                        key={i}
                        className="w-20 h-8 inline-block mx-1 border-2 border-primary/20 rounded-md bg-background focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary text-center font-bold text-sm px-1"
                        placeholder={placeholderNum}
                        value={String(answerParts[pIndex] || "")}
                        onChange={(e) => {
                          const newAnswers = typeof currentVal === 'string' ? currentVal.split(",") : [];
                          while (newAnswers.length < allPlaceholdersInQ.length) newAnswers.push("");
                          newAnswers[pIndex] = e.target.value;
                          setAnswers(prev => ({ ...prev, [q.id]: newAnswers.join(",") }));
                        }}
                      />
                    );
                }

              return <span key={i} className="text-destructive font-bold">[[{placeholderNum}]]</span>;
            }
            return <span key={i}>{item}</span>;
          })}
        </div>
      );
    };

    const renderQuestionText = (q: Question) => {
      const text = q.question_text;
      if (!text.includes("[[")) return <div className="text-base leading-relaxed pt-1 font-bold text-foreground">{text}</div>;

      const textParts = text.split(/(\[\[\d+\]\])/g);
      const allPlaceholdersInQ = text.match(/\[\[\d+\]\]/g) || [];

      return (
        <div className="text-base leading-relaxed pt-1 font-semibold text-card-foreground">
          {textParts.map((item, i) => {
            const match = item.match(/\[\[(\d+)\]\]/);
            if (match) {
              const placeholderNum = match[1];
              const pIndex = Math.max(0, allPlaceholdersInQ.indexOf(item));
              const currentVal = answers[q.id] || "";
              const answerParts = typeof currentVal === 'string' ? currentVal.split(",") : [];
              
                return (
                  <Input 
                    key={i}
                    className="w-20 h-8 inline-block mx-1 border-2 border-primary/20 rounded-md bg-background focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary text-center font-bold text-sm px-1"
                    placeholder={placeholderNum}
                    value={String(answerParts[pIndex] || "")}
                    onChange={(e) => {
                      const newAnswers = typeof currentVal === 'string' ? currentVal.split(",") : [];
                      while (newAnswers.length < allPlaceholdersInQ.length) newAnswers.push("");
                      newAnswers[pIndex] = e.target.value;
                      setAnswers(prev => ({ ...prev, [q.id]: newAnswers.join(",") }));
                    }}
                  />
                );
            }
            return <span key={i}>{item}</span>;
          })}
        </div>
      );
    };

  if (loading && mode === "selection") return <div className="flex items-center justify-center min-h-screen"><TestLoader /></div>;

  if (mode === "selection") {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-hind-siliguri">
        <ExamTransition 
          isOpen={showTransition} 
          onComplete={finalizeStartSection}
          testTitle={test?.title || ""}
          sectionTitle={pendingSection?.title || ""}
        />
        
        {/* TOP BAR */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black text-[#0072bc] tracking-tighter">IELTS</h1>
            <div className="h-8 w-px bg-gray-200" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">CDI Test Engine</span>
              <span className="text-lg font-black text-[#222] truncate max-w-[300px]">{test?.title}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {test?.test_type === "mock" && globalTimeLeft !== null && (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl border border-red-100 font-bold text-sm">
                <Clock className="h-4 w-4" />
                <span className="tabular-nums">Total Time Remaining: {formatTime(globalTimeLeft)}</span>
              </div>
            )}
            <button 
              onClick={() => router.push(`/tests/${testId}`)}
              className="flex items-center gap-2 px-4 h-10 bg-white border border-gray-200 rounded-xl text-xs font-black hover:bg-gray-50 transition-all shadow-sm uppercase tracking-widest text-gray-500"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> EXIT TEST
            </button>
          </div>
        </header>

          <main className="flex-1 overflow-auto p-8 bg-[#f0f2f5]">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col mb-12 items-center text-center">
                <h2 className="text-4xl md:text-5xl font-black text-[#222] tracking-tighter mb-4">Select Your Test Module</h2>
                <p className="text-muted-foreground font-bold text-sm uppercase tracking-widest bg-white px-6 py-2 rounded-full shadow-sm border border-gray-100">
                  Pick a section to start or continue your exam
                </p>
              </div>
  
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {sections.map((section) => {
                  const isCompleted = completedSections.includes(section.id);
                  const sectionType = section.section_type;
                  const isBlue = sectionType === 'reading' || sectionType === 'listening';
                  const isRed = sectionType === 'writing';
                  const themeColor = isBlue ? "#0072bc" : isRed ? "#DC2626" : "#7c3aed";
                  const themeBg = isBlue ? "bg-[#0072bc]" : isRed ? "bg-[#DC2626]" : "bg-[#7c3aed]";
                  const themeLightBg = isBlue ? "bg-[#0072bc]/5" : isRed ? "bg-[#DC2626]/5" : "bg-[#7c3aed]/5";
                  
                  return (
                    <button
                      key={section.id}
                      disabled={isCompleted}
                      onClick={() => startSection(section)}
                      className={cn(
                        "group bg-white p-8 rounded-[2.5rem] border-2 shadow-xl transition-all duration-500 text-left relative overflow-hidden flex flex-col items-start min-h-[320px]",
                        isCompleted 
                          ? "border-green-500 opacity-80 cursor-default" 
                          : cn("border-transparent hover:shadow-2xl hover:-translate-y-2 cursor-pointer", 
                               isBlue ? "hover:border-[#0072bc]" : isRed ? "hover:border-[#DC2626]" : "hover:border-[#7c3aed]")
                      )}
                    >
                      {/* Background Icon Watermark */}
                      <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
                        {sectionType === 'listening' ? <Headphones size={160}/> : 
                         sectionType === 'reading' ? <BookOpen size={160}/> : 
                         sectionType === 'writing' ? <PenTool size={160}/> : 
                         <MessageSquare size={160}/>}
                      </div>
  
                      <div className={cn(
                        "h-20 w-20 rounded-[1.75rem] flex items-center justify-center mb-8 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3 shadow-lg border-b-4",
                        isCompleted 
                          ? "bg-green-500 text-white border-green-600" 
                          : cn(themeLightBg, isBlue ? "text-[#0072bc] group-hover:bg-[#0072bc]" : 
                                              isRed ? "text-[#DC2626] group-hover:bg-[#DC2626]" : 
                                              "text-[#7c3aed] group-hover:bg-[#7c3aed]", "group-hover:text-white")
                      )}>
                        {sectionType === 'listening' && <Headphones size={36}/>}
                        {sectionType === 'reading' && <BookOpen size={36}/>}
                        {sectionType === 'writing' && <PenTool size={36}/>}
                        {sectionType === 'speaking' && <MessageSquare size={36}/>}
                      </div>
  
                      <div className="relative z-10">
                        <h3 className={cn(
                          "text-2xl font-black uppercase tracking-tighter mb-1 transition-colors",
                          isBlue ? "group-hover:text-[#0072bc]" : isRed ? "group-hover:text-[#DC2626]" : "group-hover:text-[#7c3aed]"
                        )}>{section.title}</h3>
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {section.time_limit} MINS</span>
                          <div className="w-1 h-1 rounded-full bg-gray-300" />
                          <span className="flex items-center gap-1.5"><FileText className="h-3 w-3" /> {section.parts?.length || 0} PARTS</span>
                        </div>
                      </div>
  
                      <div className="mt-8 w-full">
                        {isCompleted ? (
                          <div className="flex items-center gap-2 text-green-600 font-black text-xs uppercase tracking-widest">
                            <CheckCircle2 size={16} /> Completed
                          </div>
                        ) : (
                          <div className={cn(
                            "flex items-center gap-2 font-black text-xs uppercase tracking-widest group-hover:translate-x-2 transition-transform",
                            isBlue ? "text-[#0072bc]" : isRed ? "text-[#DC2626]" : "text-[#7c3aed]"
                          )}>
                            Start Section <ChevronRight size={16} />
                          </div>
                        )}
                      </div>
  
                      {isCompleted && (
                        <div className="absolute top-6 right-6 h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg">
                          <CheckCircle2 size={18} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

            {completedSections.length > 0 && (
              <div className="mt-20 flex flex-col items-center gap-6">
                <div className="h-px w-32 bg-gray-200" />
                <Button 
                  size="lg" 
                  onClick={handleSubmitTest} 
                  disabled={isSubmitting} 
                  className="px-16 h-16 text-xl font-black rounded-[2rem] shadow-2xl bg-[#0072bc] hover:bg-[#005a96] hover:scale-105 active:scale-95 transition-all uppercase tracking-tighter"
                >
                  {isSubmitting ? "Submitting..." : "Submit Entire Test"}
                </Button>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-4">
                  <span>PROGRESS: {completedSections.length} OF {sections.length}</span>
                  <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-1000" 
                      style={{ width: `${(completedSections.length / sections.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

    // --- Exam Mode ---
    return (
      <IDPExamInterface
        testTitle={test?.title || ""}
        sectionType={activeSection?.section_type || ""}
        parts={parts}
        questions={questions}
        timeLeft={timeLeft}
        answers={answers}
        onAnswerChange={(qId, val) => setAnswers(prev => ({ ...prev, [qId]: val }))}
        onFinish={finishSection}
        onExit={() => {
          if (confirm("Are you sure you want to exit? Your progress for this section will be lost.")) {
            setMode("selection");
            setActiveSection(null);
          }
        }}
      />
    );

}

function TestLoader() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
      <p className="text-muted-foreground animate-pulse font-medium">Preparing your exam experience...</p>
    </div>
  );
}
