"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Volume2,
  Wifi,
  Bell,
  Menu,
  HighlighterIcon,
  X,
  Check,
  ChevronDown,
  ArrowDown
} from "lucide-react";
import { cn } from "@/lib/utils";

interface IDPExamInterfaceProps {
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

export default function IDPExamInterface({
  testTitle,
  sectionType,
  parts,
  questions,
  timeLeft,
  answers,
  onAnswerChange,
  onFinish,
  onExit
}: IDPExamInterfaceProps) {
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [leftPanelWidth, setLeftPanelWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [highlights, setHighlights] = useState<{text: string, color: string}[]>([]);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [highlightPosition, setHighlightPosition] = useState({x: 0, y: 0});
  const [selectedText, setSelectedText] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const passageRef = useRef<HTMLDivElement>(null);
  
  const currentPart = parts[currentPartIndex];
  const partQuestions = questions.filter(q => q.part_id === currentPart?.id);
  const partGroups = currentPart?.question_groups || [];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftPanelWidth(Math.max(25, Math.min(75, newWidth)));
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectedText(selection.toString().trim());
      setHighlightPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
      setShowHighlightMenu(true);
    } else {
      setShowHighlightMenu(false);
    }
  }, []);

  const applyHighlight = (color: string) => {
    if (selectedText) {
      setHighlights(prev => [...prev, { text: selectedText, color }]);
      setShowHighlightMenu(false);
      window.getSelection()?.removeAllRanges();
    }
  };

  const removeHighlight = (index: number) => {
    setHighlights(prev => prev.filter((_, i) => i !== index));
  };

  const renderPassageWithHighlights = (text: string) => {
    if (!text) return text;
    let result = text;
    
    highlights.forEach((h) => {
      const regex = new RegExp(`(${h.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      result = result.replace(regex, `<mark class="highlight-${h.color}">$1</mark>`);
    });
    
    return result;
  };

  const renderPassageContent = (text: string) => {
    if (!text) return null;
    
    let processedText = renderPassageWithHighlights(text);
    
    processedText = processedText.replace(/\[IMAGE:(.*?)\]/g, '<img src="$1" class="my-4 max-w-full rounded-lg border border-gray-200" alt="Passage image" />');
    
    processedText = processedText.replace(/\[TABLE\]([\s\S]*?)\[\/TABLE\]/g, (match, tableContent) => {
      const rows = tableContent.trim().split('\n').filter((r: string) => r.trim());
      let tableHtml = '<table class="my-4 w-full border-collapse border border-gray-300 text-sm">';
      rows.forEach((row: string, idx: number) => {
        const cells = row.split('|').filter((c: string) => c.trim());
        const tag = idx === 0 ? 'th' : 'td';
        const bgClass = idx === 0 ? 'bg-gray-100 font-bold' : '';
        tableHtml += '<tr>';
        cells.forEach((cell: string) => {
          tableHtml += `<${tag} class="border border-gray-300 px-3 py-2 ${bgClass}">${cell.trim()}</${tag}>`;
        });
        tableHtml += '</tr>';
      });
      tableHtml += '</table>';
      return tableHtml;
    });
    
    return processedText;
  };

  const isAnswered = (questionId: string) => {
    const ans = answers[questionId];
    return ans !== undefined && ans !== "" && ans !== null;
  };

  const scrollToQuestion = (id: string) => {
    const el = document.getElementById(`q-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const isSplitLayout = sectionType === "reading" || sectionType === "writing";

  const getQuestionRange = (partIndex: number) => {
    let start = 1;
    for (let i = 0; i < partIndex; i++) {
      const pQuestions = questions.filter(q => q.part_id === parts[i]?.id);
      start += pQuestions.length;
    }
    const end = start + partQuestions.length - 1;
    return { start, end };
  };

  const { start: qStart, end: qEnd } = getQuestionRange(currentPartIndex);

  const getGroupQuestions = (groupId: string) => {
    return partQuestions.filter(q => q.group_id === groupId);
  };

  const renderFlowChart = (group: any, groupStartIdx: number) => {
    const groupQuestions = getGroupQuestions(group.id);
    const sections = group.sections || [];
    
    return (
      <div key={group.id} className="mb-8">
        <h3 className="font-bold text-base mb-3">Questions {groupStartIdx + 1}–{groupStartIdx + groupQuestions.length}</h3>
        <p className="text-sm text-gray-700 mb-2">{group.instructions}</p>
        <p className="text-sm text-gray-600 italic mb-6">Write your answers in boxes {groupStartIdx + 1}-{groupStartIdx + groupQuestions.length} on your answer sheet.</p>
        
        <div className="space-y-0">
          {/* Main Title Box */}
          <div className="border border-gray-300 rounded-lg bg-white p-4 text-center">
            <h4 className="font-bold text-sm">{group.diagramTitle || "Flow Chart"}</h4>
          </div>
          
          {/* Arrow */}
          <div className="flex justify-center py-2">
            <ArrowDown className="w-5 h-5 text-gray-400" />
          </div>
          
          {/* Sections with questions */}
          {sections.length > 0 ? (
            sections.map((section: any, sIdx: number) => {
              const sectionQuestions = groupQuestions.filter((q: any) => q.sectionIndex === sIdx);
              return (
                <React.Fragment key={sIdx}>
                  <div className="border border-gray-300 rounded-lg bg-gray-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <h5 className="font-bold text-sm">{section.title}</h5>
                    </div>
                    <div className="p-4 space-y-3">
                      {sectionQuestions.map((q: any, qIdx: number) => {
                        const globalIdx = groupQuestions.findIndex((gq: any) => gq.id === q.id);
                        return renderFlowChartQuestion(q, groupStartIdx + globalIdx);
                      })}
                    </div>
                  </div>
                  {sIdx < sections.length - 1 && (
                    <div className="flex justify-center py-2">
                      <ArrowDown className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </React.Fragment>
              );
            })
          ) : (
            <div className="border border-gray-300 rounded-lg bg-gray-50 p-4 space-y-3">
              {groupQuestions.map((q: any, idx: number) => renderFlowChartQuestion(q, groupStartIdx + idx))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderFlowChartQuestion = (q: any, globalIdx: number) => {
    const parts = q.question_text?.split(/(\[\[\d+\]\]|__+)/g) || [q.question_text];
    
    return (
      <div key={q.id} id={`q-${q.id}`} className="flex items-start gap-2">
        <span className="text-red-500 text-lg mt-0.5">●</span>
        <div className="flex-1 flex items-center flex-wrap gap-1 text-sm leading-relaxed">
          {parts.map((part: string, i: number) => {
            if (part.match(/^\[\[\d+\]\]$/) || part.match(/^__+$/)) {
              return (
                <input 
                  key={i}
                  type="text"
                  className="inline-block w-36 h-8 px-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 bg-white text-center"
                  value={answers[q.id] || ""}
                  onChange={(e) => onAnswerChange(q.id, e.target.value)}
                  placeholder={`${globalIdx + 1}`}
                />
              );
            }
            return <span key={i}>{part}</span>;
          })}
          {!q.question_text?.match(/(\[\[\d+\]\]|__+)/) && (
            <input 
              type="text"
              className="w-36 h-8 px-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 bg-white text-center ml-1"
              value={answers[q.id] || ""}
              onChange={(e) => onAnswerChange(q.id, e.target.value)}
              placeholder={`${globalIdx + 1}`}
            />
          )}
        </div>
      </div>
    );
  };

  const renderTrueFalseNG = (group: any, groupStartIdx: number) => {
    const groupQuestions = getGroupQuestions(group.id);
    
    return (
      <div key={group.id} className="mb-8">
        <h3 className="font-bold text-base mb-3">Questions {groupStartIdx + 1}–{groupStartIdx + groupQuestions.length}</h3>
        <p className="text-sm text-gray-700 mb-2">{group.instructions}</p>
        <div className="text-sm text-gray-600 mb-4 space-y-1">
          <p>On your answer sheet please write</p>
          <p><strong>TRUE</strong> if the statement agrees with the writer</p>
          <p><strong>FALSE</strong> if the statement contradicts the writer</p>
          <p><strong>NOT GIVEN</strong> if there is no information about this in the passage.</p>
        </div>
        
        <div className="space-y-4">
          {groupQuestions.map((q: any, idx: number) => (
            <div key={q.id} id={`q-${q.id}`} className="space-y-2">
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                  {groupStartIdx + idx + 1}
                </span>
                <p className="text-sm text-gray-800 pt-1">{q.question_text}</p>
              </div>
              <div className="flex gap-4 ml-11">
                {["TRUE", "FALSE", "NOT GIVEN"].map((opt) => (
                  <label 
                    key={opt}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                      answers[q.id] === opt.toLowerCase().replace(" ", "-")
                        ? "border-blue-600 bg-blue-600" 
                        : "border-gray-300"
                    )}>
                      {answers[q.id] === opt.toLowerCase().replace(" ", "-") && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <input 
                      type="radio" 
                      name={`q-${q.id}`} 
                      value={opt.toLowerCase().replace(" ", "-")}
                      checked={answers[q.id] === opt.toLowerCase().replace(" ", "-")}
                      onChange={() => onAnswerChange(q.id, opt.toLowerCase().replace(" ", "-"))}
                      className="sr-only"
                    />
                    <span className="text-sm">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderParagraphMatching = (group: any, groupStartIdx: number) => {
    const groupQuestions = getGroupQuestions(group.id);
    const options = group.options || ["A", "B", "C", "D", "E", "F", "G"];
    
    return (
      <div key={group.id} className="mb-8">
        <h3 className="font-bold text-base mb-3">Questions {groupStartIdx + 1}–{groupStartIdx + groupQuestions.length}</h3>
        <p className="text-sm text-gray-700 mb-2">{group.instructions}</p>
        <p className="text-sm text-gray-600 italic mb-4">Write the appropriate letter A-{String.fromCharCode(64 + options.length)} for box {groupStartIdx + 1}-{groupStartIdx + groupQuestions.length} on your answer sheet.</p>
        
        <div className="space-y-4">
          {groupQuestions.map((q: any, idx: number) => (
            <div key={q.id} id={`q-${q.id}`} className="flex items-center gap-4">
              <span className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                {groupStartIdx + idx + 1}
              </span>
              <p className="text-sm text-gray-800 flex-1">{q.question_text}</p>
              <div className="relative">
                <select
                  value={answers[q.id] || ""}
                  onChange={(e) => onAnswerChange(q.id, e.target.value)}
                  className="w-20 h-9 px-3 pr-8 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 bg-white appearance-none cursor-pointer"
                >
                  <option value="">{groupStartIdx + idx + 1}</option>
                  {options.map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMatching = (group: any, groupStartIdx: number) => {
    const groupQuestions = getGroupQuestions(group.id);
    const options = group.options || [];
    
    return (
      <div key={group.id} className="mb-8">
        <h3 className="font-bold text-base mb-3">Questions {groupStartIdx + 1}–{groupStartIdx + groupQuestions.length}</h3>
        <p className="text-sm text-gray-700 mb-4">{group.instructions}</p>
        
        {options.length > 0 && (
          <div className="border border-gray-300 rounded-lg p-4 mb-4 bg-gray-50">
            <p className="font-bold text-sm mb-3">Choose from the following options:</p>
            <div className="grid grid-cols-4 gap-2">
              {options.map((opt: string, idx: number) => (
                <div key={opt} className="border border-gray-200 bg-white rounded p-2 text-center">
                  <div className="font-bold text-sm">{String.fromCharCode(65 + idx)}</div>
                  <div className="text-xs text-gray-600">{opt}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          {groupQuestions.map((q: any, idx: number) => (
            <div key={q.id} id={`q-${q.id}`} className="flex items-center gap-4">
              <span className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                {groupStartIdx + idx + 1}
              </span>
              <p className="text-sm text-gray-800 flex-1">{q.question_text}</p>
              <input 
                type="text"
                className="w-20 h-9 px-3 border border-dashed border-gray-400 rounded text-sm focus:outline-none focus:border-blue-500 bg-white text-center"
                value={answers[q.id] || ""}
                onChange={(e) => onAnswerChange(q.id, e.target.value.toUpperCase())}
                placeholder=""
                maxLength={1}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSentenceCompletion = (group: any, groupStartIdx: number) => {
    const groupQuestions = getGroupQuestions(group.id);
    
    return (
      <div key={group.id} className="mb-8">
        <h3 className="font-bold text-base mb-3">Questions {groupStartIdx + 1}–{groupStartIdx + groupQuestions.length}</h3>
        <p className="text-sm text-gray-700 mb-2">{group.instructions}</p>
        <p className="text-sm text-gray-600 italic mb-4">Write your answers in boxes {groupStartIdx + 1}-{groupStartIdx + groupQuestions.length} below.</p>
        
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 space-y-4">
          {groupQuestions.map((q: any, idx: number) => {
            const textParts = q.question_text?.split(/(\[\[\d+\]\]|__+)/g) || [];
            
            return (
              <div key={q.id} id={`q-${q.id}`} className="text-sm leading-relaxed">
                {textParts.map((part: string, i: number) => {
                  if (part.match(/^\[\[\d+\]\]$/) || part.match(/^__+$/)) {
                    return (
                      <span key={i} className="inline-flex items-center mx-1">
                        <input 
                          type="text"
                          className="w-32 h-7 px-2 border border-gray-400 rounded text-sm focus:outline-none focus:border-blue-500 bg-white text-center"
                          value={answers[q.id] || ""}
                          onChange={(e) => onAnswerChange(q.id, e.target.value)}
                          placeholder={`${groupStartIdx + idx + 1}`}
                        />
                      </span>
                    );
                  }
                  return <span key={i}>{part}</span>;
                })}
                {!q.question_text?.match(/(\[\[\d+\]\]|__+)/) && (
                  <>
                    <span>{q.question_text}</span>
                    <input 
                      type="text"
                      className="w-32 h-7 px-2 ml-2 border border-gray-400 rounded text-sm focus:outline-none focus:border-blue-500 bg-white"
                      value={answers[q.id] || ""}
                      onChange={(e) => onAnswerChange(q.id, e.target.value)}
                      placeholder={`${groupStartIdx + idx + 1}`}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMultipleChoice = (group: any, groupStartIdx: number) => {
    const groupQuestions = getGroupQuestions(group.id);
    
    return (
      <div key={group.id} className="mb-8">
        <h3 className="font-bold text-base mb-3">Questions {groupStartIdx + 1}–{groupStartIdx + groupQuestions.length}</h3>
        <p className="text-sm text-gray-700 mb-4">{group.instructions}</p>
        
        <div className="space-y-6">
          {groupQuestions.map((q: any, idx: number) => (
            <div key={q.id} id={`q-${q.id}`}>
              <div className="flex items-start gap-3 mb-3">
                <span className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                  {groupStartIdx + idx + 1}
                </span>
                <p className="text-sm text-gray-800 pt-1">{q.question_text}</p>
              </div>
              <div className="space-y-2 ml-11">
                {(q.options || []).map((opt: string, oIdx: number) => (
                  <label 
                    key={oIdx}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded cursor-pointer transition-all",
                      answers[q.id] === opt ? "bg-blue-50" : "hover:bg-gray-50"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                      answers[q.id] === opt
                        ? "border-blue-600 bg-blue-600" 
                        : "border-gray-300"
                    )}>
                      {answers[q.id] === opt && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <input 
                      type="radio" 
                      name={`q-${q.id}`} 
                      value={opt}
                      checked={answers[q.id] === opt}
                      onChange={() => onAnswerChange(q.id, opt)}
                      className="sr-only"
                    />
                    <span className="font-medium text-gray-600 mr-2">{String.fromCharCode(65 + oIdx)}</span>
                    <span className="text-sm">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMultiSelect = (group: any, groupStartIdx: number) => {
    const groupQuestions = getGroupQuestions(group.id);
    
    return (
      <div key={group.id} className="mb-8">
        <h3 className="font-bold text-base mb-3">Questions {groupStartIdx + 1}–{groupStartIdx + groupQuestions.length}</h3>
        <p className="text-sm text-gray-700 mb-2">{group.instructions}</p>
        <p className="text-sm text-gray-600 italic mb-4">Write your answers in boxes {groupStartIdx + 1}-{groupStartIdx + groupQuestions.length} on your answer sheet.</p>
        
        <div className="space-y-6">
          {groupQuestions.map((q: any, idx: number) => (
            <div key={q.id} id={`q-${q.id}`}>
              <div className="flex items-start gap-3 mb-3">
                <div className="flex gap-1">
                  {[groupStartIdx + idx + 1, groupStartIdx + idx + 2].slice(0, group.selectCount || 2).map(n => (
                    <span key={n} className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {n}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-gray-800 pt-1">{q.question_text}</p>
              </div>
              <div className="space-y-2 ml-11">
                {(q.options || []).map((opt: string, oIdx: number) => {
                  const letter = String.fromCharCode(65 + oIdx);
                  const currentAnswer = answers[q.id] || "";
                  const isSelected = currentAnswer.includes(letter);
                  
                  return (
                    <label 
                      key={oIdx}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded cursor-pointer transition-all",
                        isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                        isSelected
                          ? "border-blue-600 bg-blue-600" 
                          : "border-gray-300"
                      )}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => {
                          const newAnswer = isSelected 
                            ? currentAnswer.replace(letter, "").replace(/,\s*,/g, ",").replace(/^,|,$/g, "").trim()
                            : currentAnswer ? `${currentAnswer}, ${letter}` : letter;
                          onAnswerChange(q.id, newAnswer);
                        }}
                        className="sr-only"
                      />
                      <span className="font-medium text-gray-600 mr-2">{letter}</span>
                      <span className="text-sm">{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderShortAnswer = (group: any, groupStartIdx: number) => {
    const groupQuestions = getGroupQuestions(group.id);
    
    return (
      <div key={group.id} className="mb-8">
        <h3 className="font-bold text-base mb-3">Questions {groupStartIdx + 1}–{groupStartIdx + groupQuestions.length}</h3>
        <p className="text-sm text-gray-700 mb-4">{group.instructions}</p>
        
        <div className="space-y-4">
          {groupQuestions.map((q: any, idx: number) => (
            <div key={q.id} id={`q-${q.id}`} className="flex items-start gap-3">
              <span className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                {groupStartIdx + idx + 1}
              </span>
              <div className="flex-1">
                <p className="text-sm text-gray-800 mb-2">{q.question_text}</p>
                <input 
                  type="text"
                  className="w-full max-w-md h-9 px-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 bg-white"
                  value={answers[q.id] || ""}
                  onChange={(e) => onAnswerChange(q.id, e.target.value)}
                  placeholder={`${groupStartIdx + idx + 1}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderQuestionGroup = (group: any, groupStartIdx: number) => {
    switch(group.type) {
      case "flow_chart":
      case "summary_completion":
        return renderFlowChart(group, groupStartIdx);
      case "true_false_ng":
        return renderTrueFalseNG(group, groupStartIdx);
      case "paragraph_matching":
        return renderParagraphMatching(group, groupStartIdx);
      case "matching":
        return renderMatching(group, groupStartIdx);
      case "gap_fill":
        return renderSentenceCompletion(group, groupStartIdx);
      case "multiple_choice":
        return renderMultipleChoice(group, groupStartIdx);
      case "multiple_choice_multi":
        return renderMultiSelect(group, groupStartIdx);
      default:
        return renderShortAnswer(group, groupStartIdx);
    }
  };

  const renderUngroupedQuestions = () => {
    const ungrouped = partQuestions.filter(q => !q.group_id);
    if (ungrouped.length === 0) return null;

    return (
      <div className="mb-8">
        <h3 className="font-bold text-base mb-3">Questions {qStart}–{qEnd}</h3>
        <p className="text-sm text-gray-600 italic mb-4">{currentPart?.instructions || "Answer the following questions."}</p>
        <div className="space-y-4">
          {ungrouped.map((q: any, idx: number) => (
            <div key={q.id} id={`q-${q.id}`} className="flex items-start gap-3">
              <span className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                {qStart + idx}
              </span>
              <div className="flex-1">
                <p className="text-sm text-gray-800 mb-2">{q.question_text}</p>
                {q.question_type === "multiple_choice" ? (
                  <div className="space-y-2">
                    {(q.options || []).map((opt: string, oIdx: number) => (
                      <label 
                        key={oIdx}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded cursor-pointer",
                          answers[q.id] === opt ? "bg-blue-50" : "hover:bg-gray-50"
                        )}
                      >
                        <input 
                          type="radio" 
                          name={`q-${q.id}`} 
                          value={opt}
                          checked={answers[q.id] === opt}
                          onChange={() => onAnswerChange(q.id, opt)}
                          className="accent-blue-600"
                        />
                        <span className="text-sm">{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <input 
                    type="text"
                    className="w-full max-w-md h-9 px-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 bg-white"
                    value={answers[q.id] || ""}
                    onChange={(e) => onAnswerChange(q.id, e.target.value)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  let runningQuestionIdx = 0;

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col font-['Arial',sans-serif] select-none" ref={containerRef}>
      {showHighlightMenu && (
        <div 
          className="fixed z-[200] bg-white rounded-xl shadow-2xl border border-gray-200 p-2 flex gap-1"
          style={{ 
            left: highlightPosition.x, 
            top: highlightPosition.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <button onClick={() => applyHighlight('yellow')} className="w-6 h-6 rounded-full bg-yellow-300 hover:scale-110 transition-transform" title="Yellow" />
          <button onClick={() => applyHighlight('green')} className="w-6 h-6 rounded-full bg-green-300 hover:scale-110 transition-transform" title="Green" />
          <button onClick={() => applyHighlight('blue')} className="w-6 h-6 rounded-full bg-blue-300 hover:scale-110 transition-transform" title="Blue" />
          <button onClick={() => applyHighlight('pink')} className="w-6 h-6 rounded-full bg-pink-300 hover:scale-110 transition-transform" title="Pink" />
          <button onClick={() => setShowHighlightMenu(false)} className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors" title="Cancel">
            <X size={12} />
          </button>
        </div>
      )}

      <style jsx global>{`
        .highlight-yellow { background-color: #fef08a; padding: 0 2px; border-radius: 2px; }
        .highlight-green { background-color: #bbf7d0; padding: 0 2px; border-radius: 2px; }
        .highlight-blue { background-color: #bfdbfe; padding: 0 2px; border-radius: 2px; }
        .highlight-pink { background-color: #fbcfe8; padding: 0 2px; border-radius: 2px; }
      `}</style>

      <header className="bg-[#1a1a1a] text-white h-10 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-lg font-black tracking-tight text-red-600">IELTS</span>
          <span className="text-xs text-gray-400">Test taker ID</span>
          <span className="text-xs text-white/80">@ieltspracticebd</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm bg-gray-800 px-3 py-1 rounded-lg">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="font-bold tabular-nums">{formatTime(timeLeft)}</span>
          </div>
          
          <div className="flex items-center gap-3 text-gray-400">
            <Wifi className="w-4 h-4" />
            <Bell className="w-4 h-4" />
            <Menu className="w-4 h-4" />
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {isSplitLayout ? (
          <>
            <div 
              className="h-full overflow-y-auto bg-white border-r border-gray-200"
              style={{ width: `${leftPanelWidth}%` }}
            >
              <div className="sticky top-0 bg-gray-100 border-b border-gray-200 px-6 py-3 z-10">
                <h2 className="font-bold text-sm mb-1">Part {currentPart?.part_number || currentPartIndex + 1}</h2>
                <p className="text-xs text-gray-600">
                  You should spend about 20 minutes on Questions {qStart}-{qEnd} which are based on Reading Passage {currentPartIndex + 1}.
                </p>
              </div>

              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-black uppercase tracking-tight leading-tight">
                    {currentPart?.title || "READING PASSAGE"}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-100">
                    <HighlighterIcon className="w-3 h-3 text-yellow-600" />
                    <span>Select text to highlight</span>
                  </div>
                </div>

                {highlights.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {highlights.map((h, idx) => (
                      <div key={idx} className={cn(
                        "text-xs px-2 py-1 rounded-full flex items-center gap-1 cursor-pointer hover:opacity-70",
                        h.color === 'yellow' && "bg-yellow-100 text-yellow-800",
                        h.color === 'green' && "bg-green-100 text-green-800",
                        h.color === 'blue' && "bg-blue-100 text-blue-800",
                        h.color === 'pink' && "bg-pink-100 text-pink-800"
                      )} onClick={() => removeHighlight(idx)}>
                        <span className="truncate max-w-[100px]">{h.text}</span>
                        <X size={10} />
                      </div>
                    ))}
                  </div>
                )}

                <div 
                  ref={passageRef}
                  className="text-[14px] leading-[1.8] text-gray-800 text-justify space-y-4 select-text"
                  onMouseUp={handleTextSelection}
                  dangerouslySetInnerHTML={{ 
                    __html: currentPart?.passage_text?.split('\n').map((para: string) => 
                      `<p>${renderPassageContent(para)}</p>`
                    ).join('') || ''
                  }}
                />

                {sectionType === "writing" && (
                  <div className="mt-8 border-t pt-6">
                    <textarea 
                      className="w-full h-[400px] p-4 border border-gray-300 rounded text-[14px] leading-relaxed resize-none focus:outline-none focus:border-blue-500"
                      placeholder="Write your answer here..."
                      value={answers[`writing-${currentPart?.id}`] || ""}
                      onChange={(e) => onAnswerChange(`writing-${currentPart?.id}`, e.target.value)}
                    />
                    <div className="mt-2 text-xs text-gray-500">
                      Word count: {(answers[`writing-${currentPart?.id}`] || "").trim().split(/\s+/).filter(Boolean).length}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div 
              onMouseDown={handleMouseDown}
              className="w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize transition-colors shrink-0"
            />

            <div className="flex-1 h-full overflow-y-auto bg-[#f5f5f5]">
              <div className="px-6 py-4">
                {partGroups.length > 0 ? (
                  partGroups.map((group: any) => {
                    const groupQuestions = getGroupQuestions(group.id);
                    const element = renderQuestionGroup(group, runningQuestionIdx);
                    runningQuestionIdx += groupQuestions.length;
                    return element;
                  })
                ) : (
                  renderUngroupedQuestions()
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 h-full overflow-y-auto bg-[#f5f5f5]">
            <div className="bg-white border-b border-gray-200 px-8 py-4">
              <h2 className="text-lg font-bold text-black">Section {currentPartIndex + 1}</h2>
              <p className="text-sm text-gray-600 mt-1">Listen and answer questions {qStart}-{qEnd}.</p>
              
              {currentPart?.audio_url && (
                <div className="mt-4">
                  <audio controls className="w-full max-w-md h-10">
                    <source src={currentPart.audio_url} type="audio/mpeg" />
                  </audio>
                </div>
              )}
            </div>

            <div className="px-8 py-6 max-w-3xl">
              {partGroups.length > 0 ? (
                partGroups.map((group: any) => {
                  const groupQuestions = getGroupQuestions(group.id);
                  const element = renderQuestionGroup(group, runningQuestionIdx);
                  runningQuestionIdx += groupQuestions.length;
                  return element;
                })
              ) : (
                renderUngroupedQuestions()
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 h-12 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentPartIndex(prev => Math.max(0, prev - 1))}
            disabled={currentPartIndex === 0}
            className="w-8 h-8 bg-red-600 hover:bg-red-700 rounded-full text-white disabled:opacity-50 flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setCurrentPartIndex(prev => Math.min(parts.length - 1, prev + 1))}
            disabled={currentPartIndex === parts.length - 1}
            className="w-8 h-8 bg-red-600 hover:bg-red-700 rounded-full text-white disabled:opacity-50 flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          {parts.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setCurrentPartIndex(i)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded transition-colors",
                currentPartIndex === i 
                  ? "bg-[#1a1a1a] text-white" 
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              Part {p.part_number || i + 1}
            </button>
          ))}

          <div className="flex items-center gap-0.5 ml-4 border-l border-gray-200 pl-4">
            {partQuestions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => scrollToQuestion(q.id)}
                className={cn(
                  "w-6 h-6 flex items-center justify-center text-[10px] font-medium border transition-all",
                  isAnswered(q.id) 
                    ? "bg-gray-800 text-white border-gray-800" 
                    : "bg-white text-gray-800 border-gray-300"
                )}
              >
                {qStart + idx}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={onFinish}
          className="bg-[#dc2626] hover:bg-[#b91c1c] text-white px-4 py-1.5 rounded text-xs font-bold transition-colors uppercase tracking-tight"
        >
          Submit Test
        </button>
      </footer>
    </div>
  );
}
