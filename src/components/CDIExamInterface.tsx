"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Eye, 
  EyeOff, 
  Flag, 
  Volume2, 
  ArrowRight,
  HelpCircle,
  MoreVertical,
  LogOut,
  Maximize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CDIExamInterfaceProps {
  testTitle: string;
  sectionType: string;
  parts: any[];
  questions: any[];
  timeLeft: number;
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, answer: any) => void;
  onFinish: () => void;
  onExit: () => void;
}

export default function CDIExamInterface({
  testTitle,
  sectionType,
  parts,
  questions,
  timeLeft,
  answers,
  onAnswerChange,
  onFinish,
  onExit
}: CDIExamInterfaceProps) {
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [showTimer, setShowTimer] = useState(true);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [fontSize, setFontSize] = useState<"standard" | "large" | "extra-large">("standard");
  const [volume, setVolume] = useState(80);
  
  const currentPart = parts[currentPartIndex];
  const partQuestions = questions.filter(q => q.part_id === currentPart?.id);

  const toggleFlag = (id: string) => {
    setFlaggedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isAnswered = (questionId: string) => {
    const ans = answers[questionId];
    return ans !== undefined && ans !== "" && ans !== null;
  };

  const scrollToQuestion = (id: string) => {
    const el = document.getElementById(`q-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const renderGapFill = (text: string, qId: string, placeholderIndex: number, placeholderNum: string) => {
    const currentVal = answers[qId] || "";
    const answerParts = typeof currentVal === 'string' ? currentVal.split(",") : [];
    
    return (
      <input
        type="text"
        className="w-24 h-7 inline-block mx-1 border border-[#999] bg-white focus:border-[#0072bc] outline-none px-2 text-sm font-sans"
        value={answerParts[placeholderIndex] || ""}
        onChange={(e) => {
          const allPlaceholders = questions.find(q => q.id === qId)?.question_text.match(/\[\[\d+\]\]/g) || [];
          const newAnswers = [...answerParts];
          while (newAnswers.length < allPlaceholders.length) newAnswers.push("");
          newAnswers[placeholderIndex] = e.target.value;
          onAnswerChange(qId, newAnswers.join(","));
        }}
      />
    );
  };

  const processTextWithGaps = (text: string, partId: string) => {
    if (!text) return null;
    const textParts = text.split(/(\[\[\d+\]\])/g);
    return (
      <div className="leading-relaxed">
        {textParts.map((item, i) => {
          const match = item.match(/\[\[(\d+)\]\]/);
          if (match) {
            const placeholderNum = match[1];
            const q = questions.find(q => q.part_id === partId && q.question_text.includes(item));
            if (q) {
              const allPlaceholders = q.question_text.match(/\[\[\d+\]\]/g) || [];
              const pIndex = allPlaceholders.indexOf(item);
              return <React.Fragment key={i}>{renderGapFill(q.question_text, q.id, pIndex, placeholderNum)}</React.Fragment>;
            }
            return <span key={i} className="font-bold text-[#0072bc]">[{placeholderNum}]</span>;
          }
          return <span key={i}>{item}</span>;
        })}
      </div>
    );
  };

  return (
    <div className={cn(
      "fixed inset-0 z-[100] bg-[#f0f2f5] flex flex-col font-sans select-none text-[#333]",
      fontSize === "large" && "text-lg",
      fontSize === "extra-large" && "text-xl"
    )}
    onContextMenu={(e) => e.preventDefault()}
    >
      {/* CDI TOP HEADER */}
      <header className="h-14 bg-[#333] text-white flex items-center justify-between px-6 shrink-0 border-b border-[#000]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[#ccc] text-xs font-bold uppercase tracking-wider">Candidate:</span>
            <span className="font-bold text-sm">TEST TAKER (000001)</span>
          </div>
          <div className="h-4 w-px bg-white/20" />
          <h1 className="font-bold text-sm uppercase tracking-wide">IELTS {sectionType}</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowTimer(!showTimer)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title={showTimer ? "Hide Timer" : "Show Timer"}
            >
              {showTimer ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
            <div className={cn(
              "flex items-center gap-2 px-3 py-1 bg-[#444] rounded border border-white/10 min-w-[100px] justify-center",
              !showTimer && "opacity-0 pointer-events-none"
            )}>
              <Clock size={16} className="text-[#00c5ff]" />
              <span className="font-mono text-lg font-bold text-[#00c5ff]">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={onExit}
                  className="flex items-center gap-2 text-xs font-bold text-[#ff4d4d] hover:bg-[#ff4d4d]/10 px-2 py-1 rounded border border-[#ff4d4d]/20 transition-colors"
                >
                  <LogOut size={14} />
                  EXIT TEST
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Quit and lose progress for this section</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </header>

      {/* CDI TOOLBAR */}
      <div className="h-10 bg-[#e1e4e8] border-b border-[#ccc] flex items-center justify-between px-6 shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <button className="text-[11px] font-bold px-3 py-1 bg-white border border-[#ccc] hover:bg-[#f9f9f9] transition-colors rounded shadow-sm">
            Highlight
          </button>
          <button className="text-[11px] font-bold px-3 py-1 bg-white border border-[#ccc] hover:bg-[#f9f9f9] transition-colors rounded shadow-sm">
            Notes
          </button>
        </div>

        <div className="flex items-center gap-4">
          {sectionType === "listening" && (
            <div className="flex items-center gap-3 bg-white/50 px-3 py-1 rounded-full border border-[#ccc]">
              <Volume2 size={14} className="text-[#666]" />
              <input 
                type="range" 
                min="0" max="100" 
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value))}
                className="w-24 h-1 bg-[#ccc] rounded-lg appearance-none cursor-pointer accent-[#0072bc]"
              />
            </div>
          )}
          <div className="flex items-center gap-1 bg-white border border-[#ccc] rounded p-0.5 shadow-sm">
            {(["standard", "large", "extra-large"] as const).map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={cn(
                  "px-2 py-0.5 text-[10px] font-bold rounded transition-all",
                  fontSize === size ? "bg-[#0072bc] text-white" : "hover:bg-[#f0f0f0] text-[#666]"
                )}
              >
                {size === "standard" ? "A" : size === "large" ? "A+" : "A++"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Passage / Audio */}
        <div className="w-1/2 border-r border-[#ccc] bg-white flex flex-col">
          <div className="h-8 bg-[#f5f5f5] border-b border-[#ccc] px-4 flex items-center text-[11px] font-bold text-[#666] uppercase tracking-wider">
            {sectionType === "reading" ? "Reading Passage" : "Listening Audio"}
          </div>
          <div className="flex-1 overflow-y-auto p-10 leading-[1.8] font-serif text-[#111]">
            <h2 className="text-2xl font-bold mb-8 text-[#000]">{currentPart?.title}</h2>
            
            {sectionType === "listening" && currentPart?.audio_url && (
              <div className="mb-10 p-6 bg-[#f8f9fa] border-2 border-dashed border-[#ccc] rounded-xl flex flex-col items-center gap-4">
                <div className="p-4 bg-white rounded-full shadow-md">
                  <Volume2 size={32} className="text-[#0072bc]" />
                </div>
                <audio 
                  controls 
                  className="w-full"
                  volume={volume / 100}
                >
                  <source src={currentPart.audio_url} type="audio/mpeg" />
                </audio>
                <p className="text-xs text-[#999] font-sans font-bold uppercase tracking-widest">Recording for {currentPart?.title}</p>
              </div>
            )}

            <div className="whitespace-pre-wrap">
              {currentPart?.passage_text && processTextWithGaps(currentPart.passage_text, currentPart.id)}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Questions */}
        <div className="w-1/2 bg-[#fff] flex flex-col">
          <div className="h-8 bg-[#f5f5f5] border-b border-[#ccc] px-4 flex items-center text-[11px] font-bold text-[#666] uppercase tracking-wider">
            Questions
          </div>
          <div className="flex-1 overflow-y-auto p-10 bg-[#fafafa]">
            <div className="max-w-xl mx-auto space-y-12 pb-20">
              <div className="p-5 bg-white border border-[#eee] rounded shadow-sm text-sm italic text-[#555] leading-relaxed">
                <p className="font-bold text-[#000] mb-2 not-italic text-xs uppercase tracking-wider">Instructions:</p>
                {currentPart?.instructions}
              </div>

              {partQuestions.map((q) => (
                <div key={q.id} id={`q-${q.id}`} className="space-y-4 group">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="w-8 h-8 rounded border-2 border-[#ccc] flex items-center justify-center font-bold text-sm bg-white">
                        {q.order_index}
                      </div>
                      <button 
                        onClick={() => toggleFlag(q.id)}
                        className={cn(
                          "p-1 rounded transition-colors",
                          flaggedQuestions.has(q.id) ? "text-[#ff4d4d]" : "text-[#ccc] hover:text-[#999]"
                        )}
                        title="Review"
                      >
                        <Flag size={14} fill={flaggedQuestions.has(q.id) ? "currentColor" : "none"} />
                      </button>
                    </div>

                    <div className="flex-1 pt-1">
                      <div className="font-bold text-[#000] mb-4">
                        {q.question_text.includes("[[") ? (
                          <div className="flex flex-wrap items-center gap-1">
                            {q.question_text.split(/(\[\[\d+\]\])/g).map((part, i) => {
                              const match = part.match(/\[\[(\d+)\]\]/);
                              if (match) {
                                const placeholderNum = match[1];
                                const allPlaceholders = q.question_text.match(/\[\[\d+\]\]/g) || [];
                                const pIndex = allPlaceholders.indexOf(part);
                                return <React.Fragment key={i}>{renderGapFill(q.question_text, q.id, pIndex, placeholderNum)}</React.Fragment>;
                              }
                              return <span key={i}>{part}</span>;
                            })}
                          </div>
                        ) : (
                          q.question_text
                        )}
                      </div>

                      {q.question_type === "multiple_choice" && (
                        <RadioGroup 
                          onValueChange={(val) => onAnswerChange(q.id, val)}
                          value={answers[q.id]}
                          className="space-y-2"
                        >
                          {q.options?.map((opt: string, i: number) => (
                            <div 
                              key={i} 
                              className={cn(
                                "flex items-center space-x-3 p-3 border rounded transition-all cursor-pointer",
                                answers[q.id] === opt 
                                  ? "border-[#0072bc] bg-[#eef6fc] shadow-sm" 
                                  : "border-[#eee] hover:border-[#ccc] bg-white"
                              )}
                              onClick={() => onAnswerChange(q.id, opt)}
                            >
                              <RadioGroupItem value={opt} id={`${q.id}-${i}`} className="text-[#0072bc] h-4 w-4 border-[#ccc]" />
                              <Label htmlFor={`${q.id}-${i}`} className="flex-grow cursor-pointer font-medium text-sm">
                                <span className="mr-2 font-bold text-[#999]">{String.fromCharCode(65 + i)}.</span>
                                {opt}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}

                      {(q.question_type === "short_answer" || (q.question_type !== "multiple_choice" && !q.question_text.includes("[["))) && (
                        <input
                          type="text"
                          className="w-full max-w-sm h-10 border border-[#ccc] bg-white focus:border-[#0072bc] outline-none px-4 text-sm font-sans rounded shadow-inner"
                          placeholder="Type your answer here..."
                          value={answers[q.id] || ""}
                          onChange={(e) => onAnswerChange(q.id, e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* CDI BOTTOM NAVIGATION */}
      <footer className="h-20 bg-[#f5f5f5] border-t border-[#ccc] flex items-center px-6 shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-[80vw] no-scrollbar">
            {questions.map((q) => (
              <button
                key={q.id}
                onClick={() => {
                  const partIdx = parts.findIndex(p => p.id === q.part_id);
                  if (partIdx !== -1) setCurrentPartIndex(partIdx);
                  setTimeout(() => scrollToQuestion(q.id), 100);
                }}
                className={cn(
                  "min-w-[32px] h-8 rounded border-b-2 flex items-center justify-center text-[11px] font-bold transition-all relative",
                  isAnswered(q.id) 
                    ? "bg-[#0072bc] border-[#005a96] text-white" 
                    : "bg-white border-[#ccc] text-[#666] hover:bg-[#eee]"
                )}
              >
                {q.order_index}
                {flaggedQuestions.has(q.id) && (
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#ff4d4d] rounded-full border border-white" />
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold text-[#999] uppercase tracking-widest">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-[#0072bc] rounded-sm" /> Answered</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-white border border-[#ccc] rounded-sm" /> Unanswered</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-[#ff4d4d] rounded-full" /> Review</div>
          </div>
        </div>

        <div className="flex items-center gap-4 pl-6 border-l border-[#ccc] ml-6">
          <Button 
            variant="outline"
            disabled={currentPartIndex === 0}
            onClick={() => setCurrentPartIndex(prev => prev - 1)}
            className="bg-white border-[#ccc] text-[#333] hover:bg-[#eee] h-10 px-6 font-bold rounded shadow-sm"
          >
            <ChevronLeft size={18} className="mr-1" /> BACK
          </Button>

          {currentPartIndex < parts.length - 1 ? (
            <Button 
              onClick={() => setCurrentPartIndex(prev => prev + 1)}
              className="bg-[#0072bc] hover:bg-[#005a96] text-white h-10 px-6 font-bold rounded shadow-sm"
            >
              NEXT <ChevronRight size={18} className="ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={onFinish}
              className="bg-[#28a745] hover:bg-[#218838] text-white h-10 px-8 font-bold rounded shadow-sm"
            >
              FINISH SECTION <ArrowRight size={18} className="ml-2" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
