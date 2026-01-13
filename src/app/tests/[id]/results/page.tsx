"use client";

import { useEffect, useState, use } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, ChevronRight, LayoutDashboard, Target, Clock, AlertCircle, XCircle, RotateCcw, ChevronDown, ChevronUp, Award } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const testId = resolvedParams.id;
  const searchParams = useSearchParams();
  const resultId = searchParams.get("resultId");
  const router = useRouter();

  const [result, setResult] = useState<any>(null);
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let resultData;
      if (resultId) {
        const { data } = await supabase
          .from("user_results")
          .select("*, mock_tests(title)")
          .eq("id", resultId)
          .single();
        resultData = data;
      } else {
        const { data } = await supabase
          .from("user_results")
          .select("*, mock_tests(title)")
          .eq("user_id", user.id)
          .eq("test_id", testId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        resultData = data;
      }

      if (resultData) {
        setResult(resultData);
        
        // Fetch test data and questions for mistake analysis
        const [testRes, sectionsRes, questionsRes] = await Promise.all([
          supabase.from("mock_tests").select("*").eq("id", testId).single(),
          supabase.from("test_sections").select("*").eq("test_id", testId).order("order_index"),
          supabase.from("questions").select("*").eq("section_id", "any").in("section_id", (await supabase.from("test_sections").select("id").eq("test_id", testId)).data?.map(s => s.id) || [])
        ]);

        // Actually we need to fetch questions for all sections of this test
        const { data: allSections } = await supabase.from("test_sections").select("id").eq("test_id", testId);
        const sectionIds = allSections?.map(s => s.id) || [];
        
        const { data: allQuestions } = await supabase
          .from("questions")
          .select("*")
          .in("section_id", sectionIds)
          .order("order_index");

        setTest(testRes.data);
        setSections(sectionsRes.data || []);
        setQuestions(allQuestions || []);
      }
      setLoading(false);
    }

    fetchData();
  }, [testId, resultId]);

  const handleRetake = async () => {
    if (!confirm("Are you sure you want to retake this test? This will not delete your current result, but you will start a new session.")) return;
    router.push(`/tests/${testId}/start`);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  if (!result) return <div className="pt-32 text-center">No results found.</div>;

  // Scoring Logic
  const userAnswers = result.answers || {};
  let correctCount = 0;
  let totalCount = questions.length;

  questions.forEach(q => {
    const userAnswer = (userAnswers[q.id] || "").toString().trim().toLowerCase();
    const correctAnswers = q.correct_answer.split(",").map(a => a.trim().toLowerCase());
    if (correctAnswers.includes(userAnswer)) correctCount++;
  });

  const percentage = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;
  
  // Approximate Band Score (Simple linear mapping for demo)
  const bandScore = totalCount > 0 ? (Math.round((correctCount / totalCount) * 9 * 2) / 2).toFixed(1) : "0.0";

  return (
    <div className="min-h-screen pt-24 pb-16 bg-secondary/10">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/20 text-primary mb-6 rotate-12">
            <Award className="h-12 w-12" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Examination Complete</h1>
          <p className="text-muted-foreground text-lg">
            Review your performance for <span className="text-primary font-bold">{result.mock_tests?.title}</span>
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-primary/20 bg-primary/5 text-center p-6 flex flex-col items-center justify-center">
            <Target className="h-6 w-6 text-primary mb-2" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Estimated Band</p>
            <div className="text-5xl font-black text-primary mt-1">{bandScore}</div>
          </Card>

          <Card className="text-center p-6 flex flex-col items-center justify-center border-border/50">
            <CheckCircle2 className="h-6 w-6 text-green-500 mb-2" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Correct Answers</p>
            <div className="text-5xl font-black mt-1">{correctCount}<span className="text-xl text-muted-foreground">/{totalCount}</span></div>
          </Card>

          <Card className="text-center p-6 flex flex-col items-center justify-center border-border/50">
            <Clock className="h-6 w-6 text-blue-500 mb-2" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Sections Done</p>
            <div className="text-5xl font-black mt-1">{result.scores?.completed || 0}<span className="text-xl text-muted-foreground">/{result.scores?.total || 4}</span></div>
          </Card>
        </div>

        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Review Mistakes</h2>
            <Badge variant="outline" className="text-destructive border-destructive/20 bg-destructive/5">
              {totalCount - correctCount} Mistakes found
            </Badge>
          </div>

          <Accordion type="multiple" className="space-y-4">
            {sections.map(section => {
              const sectionQuestions = questions.filter(q => q.section_id === section.id);
              const sectionMistakes = sectionQuestions.filter(q => {
                const userAnswer = (userAnswers[q.id] || "").toString().trim().toLowerCase();
                const correctAnswers = q.correct_answer.split(",").map(a => a.trim().toLowerCase());
                return !correctAnswers.includes(userAnswer);
              });

              if (sectionQuestions.length === 0) return null;

              return (
                <AccordionItem key={section.id} value={section.id} className="border rounded-2xl bg-card overflow-hidden">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-secondary/20">
                    <div className="flex items-center gap-4 text-left">
                      <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                        <AlertCircle className={`h-5 w-5 ${sectionMistakes.length > 0 ? 'text-destructive' : 'text-green-500'}`} />
                      </div>
                      <div>
                        <p className="font-bold capitalize">{section.title}</p>
                        <p className="text-xs text-muted-foreground">{sectionMistakes.length} mistakes out of {sectionQuestions.length} questions</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-6 pt-0 space-y-4">
                    {sectionQuestions.map((q, idx) => {
                      const userAnswer = userAnswers[q.id] || "(No answer)";
                      const correctAnswers = q.correct_answer.split(",").map(a => a.trim().toLowerCase());
                      const isCorrect = correctAnswers.includes(userAnswer.toString().trim().toLowerCase());

                      return (
                        <div key={q.id} className={`p-4 rounded-xl border ${isCorrect ? 'border-green-500/20 bg-green-500/5' : 'border-destructive/20 bg-destructive/5'}`}>
                          <div className="flex items-start gap-4">
                            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold mt-1 ${isCorrect ? 'bg-green-500 text-white' : 'bg-destructive text-white'}`}>
                              {idx + 1}
                            </span>
                              <div className="flex-1">
                                <p className="font-medium text-sm mb-3">{q.question_text.replace(/\[\[\d+\]\]/g, '___')}</p>
                                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                                <div className="space-y-1">
                                  <p className="text-muted-foreground font-bold uppercase tracking-wider">Your Answer</p>
                                  <p className={`font-bold ${isCorrect ? 'text-green-600' : 'text-destructive'}`}>
                                    {isCorrect ? <CheckCircle2 className="inline h-3 w-3 mr-1" /> : <XCircle className="inline h-3 w-3 mr-1" />}
                                    {userAnswer}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-muted-foreground font-bold uppercase tracking-wider">Correct Answer</p>
                                  <p className="font-bold text-green-600 underline decoration-dotted">{q.correct_answer}</p>
                                </div>
                              </div>
                              {q.explanation && (
                                <div className="mt-4 p-3 bg-background rounded-lg border border-border/50 text-xs">
                                  <p className="font-bold mb-1 flex items-center gap-1 text-primary"><InfoIcon className="h-3 w-3" /> Explanation:</p>
                                  <p className="text-muted-foreground leading-relaxed">{q.explanation}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row gap-4">
          <Button onClick={handleRetake} variant="secondary" className="flex-1 h-14 font-bold text-lg rounded-2xl shadow-lg">
            <RotateCcw className="mr-2 h-5 w-5" />
            Retake Test
          </Button>
          <Button asChild className="flex-1 h-14 font-bold text-lg rounded-2xl shadow-lg" size="lg">
            <Link href="/dashboard">
              <LayoutDashboard className="mr-2 h-5 w-5" />
              Go to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function InfoIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  )
}
