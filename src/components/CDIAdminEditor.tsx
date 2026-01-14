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
  LogOut,
  Save,
  Plus,
  Trash2,
  Image as ImageIcon,
  Table as TableIcon,
  Type,
  List,
  Layout as LayoutIcon,
  Settings,
  AudioLines,
  FileText,
  Play,
  Pause,
  Wifi,
  Bell,
  Menu,
  MousePointer2,
  CheckCircle2,
  Layers,
  Copy,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CDIAdminEditorProps {
  testTitle: string;
  section: any;
  parts: any[];
  questions: any[];
  onSave: (data: { 
    parts: any[], 
    questions: any[], 
    deletedPartIds: string[], 
    deletedQuestionIds: string[] 
  }) => Promise<void>;
  onExit: () => void;
}

const QUESTION_TYPES = [
  { id: "flow_chart", label: "Flow Chart", icon: "📊", description: "Fill in blanks in a flow chart/diagram" },
  { id: "true_false_ng", label: "True/False/NG", icon: "✓✗", description: "True, False, or Not Given" },
  { id: "paragraph_matching", label: "Paragraph Match", icon: "¶", description: "Match statements to paragraphs (A-G)" },
  { id: "gap_fill", label: "Gap Fill", icon: "___", description: "Fill in blanks from passage" },
  { id: "multiple_choice", label: "Multiple Choice", icon: "◉", description: "Choose one correct option" },
  { id: "multiple_choice_multi", label: "Multi-Select", icon: "☑☑", description: "Choose multiple correct options" },
  { id: "matching", label: "Matching", icon: "↔", description: "Match items to dates/categories" },
  { id: "summary_completion", label: "Summary", icon: "📝", description: "Complete a summary with words" },
  { id: "short_answer", label: "Short Answer", icon: "✏", description: "Write a brief answer" },
];

export default function CDIAdminEditor({
  testTitle,
  section,
  parts: initialParts,
  questions: initialQuestions,
  onSave,
  onExit
}: CDIAdminEditorProps) {
    const [parts, setParts] = useState(initialParts);
    const [questions, setQuestions] = useState(initialQuestions);
    const [deletedPartIds, setDeletedPartIds] = useState<string[]>([]);
    const [deletedQuestionIds, setDeletedQuestionIds] = useState<string[]>([]);
    const [currentPartIndex, setCurrentPartIndex] = useState(0);
    const [questionGroups, setQuestionGroups] = useState<any[]>([]);

    useEffect(() => {
      setParts(initialParts.length > 0 ? initialParts : []);
      setQuestions(initialQuestions);
      setDeletedPartIds([]);
      setDeletedQuestionIds([]);
      setCurrentPartIndex(0);
    }, [initialParts, initialQuestions]);

    useEffect(() => {
      if (parts.length === 0 && section?.id) {
        const newPartId = `temp-part-${Date.now()}`;
        setParts([{
          id: newPartId,
          temp_id: newPartId,
          section_id: section.id,
          part_number: 1,
          title: "New Part",
          instructions: "",
          passage_text: "",
          order_index: 1,
          question_groups: []
        }]);
      }
    }, [parts.length, section?.id]);

    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
    const [bulkMode, setBulkMode] = useState(false);
    const [bulkText, setBulkText] = useState("");
    const [leftPanelWidth, setLeftPanelWidth] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [editingGroup, setEditingGroup] = useState<any>(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showTableModal, setShowTableModal] = useState(false);
  
    const containerRef = useRef<HTMLDivElement>(null);
    const sectionType = section?.section_type || "reading";
    
    const getTheme = () => {
      switch(sectionType) {
        case 'listening':
          return {
            primary: "#0072bc",
            bg: "bg-[#0072bc]",
            text: "text-[#0072bc]",
            border: "border-[#0072bc]",
            hoverBg: "hover:bg-[#005a96]",
            lightBg: "bg-blue-50",
            lightBorder: "border-blue-100"
          };
        case 'reading':
          return {
            primary: "#0072bc",
            bg: "bg-[#0072bc]",
            text: "text-[#0072bc]",
            border: "border-[#0072bc]",
            hoverBg: "hover:bg-[#005a96]",
            lightBg: "bg-blue-50",
            lightBorder: "border-blue-100"
          };
        case 'writing':
          return {
            primary: "#DC2626",
            bg: "bg-[#DC2626]",
            text: "text-[#DC2626]",
            border: "border-[#DC2626]",
            hoverBg: "hover:bg-[#B91C1C]",
            lightBg: "bg-red-50",
            lightBorder: "border-red-100"
          };
        default:
          return {
            primary: "#7c3aed",
            bg: "bg-purple-600",
            text: "text-purple-600",
            border: "border-purple-600",
            hoverBg: "hover:bg-purple-700",
            lightBg: "bg-purple-50",
            lightBorder: "border-purple-100"
          };
      }
    };

    const theme = getTheme();
    const themeBg = theme.bg;
    const themeText = theme.text;
    const themeBorder = theme.border;

    const currentPart = parts[currentPartIndex];
    const partQuestions = questions.filter(q => q.part_id === currentPart?.id || (q.temp_part_id && q.temp_part_id === currentPart?.id));
    const partGroups = currentPart?.question_groups || [];

    const addPart = () => {
      const newPartId = `temp-part-${Date.now()}`;
      const newPart = {
        id: newPartId,
        temp_id: newPartId,
        section_id: section.id,
        part_number: parts.length + 1,
        title: `Part ${parts.length + 1}`,
        instructions: "",
        passage_text: "",
        order_index: parts.length + 1,
        question_groups: []
      };
      setParts([...parts, newPart]);
      setCurrentPartIndex(parts.length);
      toast.success("New part added");
    };

    const deletePart = (index: number) => {
      if (parts.length <= 1) {
        toast.error("At least one part is required");
        return;
      }
      const partToDelete = parts[index];
      
      // Track for deletion in DB
      if (partToDelete.id && !partToDelete.id.toString().startsWith('temp-')) {
        setDeletedPartIds(prev => [...prev, partToDelete.id]);
        
        // Also track all questions in this part for deletion
        const partQs = questions.filter(q => q.part_id === partToDelete.id);
        const qIds = partQs.map(q => q.id).filter(id => id && !id.toString().startsWith('temp-'));
        setDeletedQuestionIds(prev => [...prev, ...qIds]);
      }

      const newParts = parts.filter((_, i) => i !== index);
      const indexedParts = newParts.map((p, i) => ({ ...p, part_number: i + 1, order_index: i + 1 }));
      setParts(indexedParts);
      setQuestions(prev => prev.filter(q => q.part_id !== partToDelete.id && q.temp_part_id !== partToDelete.id));
      if (currentPartIndex >= indexedParts.length) {
        setCurrentPartIndex(indexedParts.length - 1);
      }
      toast.info("Part removed");
    };

    const addGap = (qId: string) => {
      const q = questions.find(q => q.id === qId || q.temp_id === qId);
      if (!q) return;
      
      const newText = (q.question_text || "") + " __________ ";
      updateQuestion(qId, "question_text", newText);
      toast.success("Gap added to question");
    };
    
    const updatePart = (id: string, field: string, value: any) => {
      setParts(prev => prev.map(p => (p.id === id || p.temp_id === id) ? { ...p, [field]: value } : p));
    };
    
    const updateQuestion = (id: string, field: string, value: any) => {
      setQuestions(prev => prev.map(q => (q.id === id || q.temp_id === id) ? { ...q, [field]: value } : q));
    };

    const deleteQuestionGroup = (groupId: string) => {
      // Track group questions for deletion
      const groupQs = questions.filter(q => q.group_id === groupId);
      const qIds = groupQs.map(q => q.id).filter(id => id && !id.toString().startsWith('temp-'));
      if (qIds.length > 0) {
        setDeletedQuestionIds(prev => [...prev, ...qIds]);
      }

      const updatedGroups = (currentPart?.question_groups || []).filter((g: any) => g.id !== groupId);
      updatePart(currentPart.id || currentPart.temp_id, "question_groups", updatedGroups);
      setQuestions(prev => prev.filter(q => q.group_id !== groupId));
      toast.info("Question group removed");
    };

    const deleteQuestion = (id: string) => {
      const q = questions.find(q => q.id === id || q.temp_id === id);
      if (q && q.id && !q.id.toString().startsWith('temp-')) {
        setDeletedQuestionIds(prev => [...prev, q.id]);
      }
      setQuestions(prev => prev.filter(q => q.id !== id && q.temp_id !== id));
      toast.info("Question removed");
    };

    const handleSaveAll = async () => {
      setIsSaving(true);
      try {
        await onSave({ parts, questions, deletedPartIds, deletedQuestionIds });
        setDeletedPartIds([]);
        setDeletedQuestionIds([]);
        toast.success("Changes saved successfully");
      } catch (err) {
        toast.error("Failed to save changes");
      } finally {
        setIsSaving(false);
      }
    };
  
    const updatePart = (id: string, field: string, value: any) => {
      setParts(prev => prev.map(p => (p.id === id || p.temp_id === id) ? { ...p, [field]: value } : p));
    };
  
    const updateQuestion = (id: string, field: string, value: any) => {
      setQuestions(prev => prev.map(q => (q.id === id || q.temp_id === id) ? { ...q, [field]: value } : q));
    };

    const addQuestionGroup = (type: string) => {
      if (!currentPart) return;
      
      const groupId = `group-${Date.now()}`;
      const newGroup = {
        id: groupId,
        type: type,
        title: QUESTION_TYPES.find(t => t.id === type)?.label || "Question Group",
        instructions: getDefaultInstructions(type),
        startQuestion: partQuestions.length + 1,
        endQuestion: partQuestions.length + 5,
        options: type === "paragraph_matching" ? ["A", "B", "C", "D", "E", "F", "G"] : 
                 type === "matching" ? ["A", "B", "C", "D", "E", "F", "G"] : 
                 type === "true_false_ng" ? ["TRUE", "FALSE", "NOT GIVEN"] : [],
        diagramTitle: type === "flow_chart" ? "Flow Chart Title" : "",
        diagramImage: "",
        sections: type === "flow_chart" ? [
          { id: `section-${Date.now()}-1`, title: "Section 1" },
          { id: `section-${Date.now()}-2`, title: "Section 2" }
        ] : []
      };
      
      const updatedPart = {
        ...currentPart,
        question_groups: [...(currentPart.question_groups || []), newGroup]
      };
      
      setParts(prev => prev.map(p => (p.id === currentPart.id || p.temp_id === currentPart.id) ? updatedPart : p));
      
      const questionsToAdd = [];
      for (let i = 0; i < 5; i++) {
        questionsToAdd.push({
          id: `temp-q-${Date.now()}-${i}`,
          temp_id: `temp-q-${Date.now()}-${i}`,
          part_id: currentPart.id,
          temp_part_id: currentPart.id,
          section_id: section.id,
          question_type: type,
          question_text: "",
          group_id: groupId,
          sectionIndex: type === "flow_chart" ? (i < 3 ? 0 : 1) : undefined,
          options: type === "multiple_choice" || type === "multiple_choice_multi" ? ["Option A", "Option B", "Option C", "Option D"] : null,
          correct_answer: "",
          points: 1,
          order_index: questions.length + i + 1
        });
      }
      setQuestions([...questions, ...questionsToAdd]);
      setShowGroupModal(false);
      toast.success(`${QUESTION_TYPES.find(t => t.id === type)?.label} group added with 5 questions`);
    };

    const addSectionToGroup = (groupId: string) => {
      const group = partGroups.find((g: any) => g.id === groupId);
      if (!group) return;
      const newSection = { id: `section-${Date.now()}`, title: `Section ${(group.sections || []).length + 1}` };
      updateQuestionGroup(groupId, "sections", [...(group.sections || []), newSection]);
      toast.success("Section added");
    };

    const updateSection = (groupId: string, sectionIdx: number, title: string) => {
      const group = partGroups.find((g: any) => g.id === groupId);
      if (!group) return;
      const updatedSections = [...(group.sections || [])];
      updatedSections[sectionIdx] = { ...updatedSections[sectionIdx], title };
      updateQuestionGroup(groupId, "sections", updatedSections);
    };

    const deleteSection = (groupId: string, sectionIdx: number) => {
      const group = partGroups.find((g: any) => g.id === groupId);
      if (!group || (group.sections || []).length <= 1) {
        toast.error("At least one section required");
        return;
      }
      const updatedSections = (group.sections || []).filter((_: any, i: number) => i !== sectionIdx);
      updateQuestionGroup(groupId, "sections", updatedSections);
      setQuestions(prev => prev.map(q => q.group_id === groupId && q.sectionIndex === sectionIdx ? { ...q, sectionIndex: 0 } : q));
      toast.info("Section removed");
    };

    const getDefaultInstructions = (type: string) => {
      switch(type) {
        case "flow_chart": return "Complete the flow-chart below. Choose NO MORE THAN TWO WORDS from the passage for each answer.";
        case "true_false_ng": return "Do the following statements agree with the information given in the passage?";
        case "paragraph_matching": return "Reading Passage has paragraphs A-G. Which paragraph contains the following information?";
        case "gap_fill": return "Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.";
        case "multiple_choice": return "Choose the correct letter, A, B, C or D.";
        case "multiple_choice_multi": return "Choose TWO letters, A-E.";
        case "matching": return "Look at the following statements and the list of dates below. Match each statement with the correct date.";
        case "summary_completion": return "Complete the summary below. Choose NO MORE THAN TWO WORDS from the passage for each answer.";
        default: return "Answer the following questions.";
      }
    };

    const updateQuestionGroup = (groupId: string, field: string, value: any) => {
      const updatedGroups = (currentPart?.question_groups || []).map((g: any) => 
        g.id === groupId ? { ...g, [field]: value } : g
      );
      updatePart(currentPart.id || currentPart.temp_id, "question_groups", updatedGroups);
    };

    const deleteQuestionGroup = (groupId: string) => {
      const updatedGroups = (currentPart?.question_groups || []).filter((g: any) => g.id !== groupId);
      updatePart(currentPart.id || currentPart.temp_id, "question_groups", updatedGroups);
      setQuestions(prev => prev.filter(q => q.group_id !== groupId));
      toast.info("Question group removed");
    };

    const addQuestionToGroup = (groupId: string, type: string, sectionIdx?: number) => {
      const newId = `temp-q-${Date.now()}`;
      const groupQuestions = questions.filter(q => q.group_id === groupId);
      const group = partGroups.find((g: any) => g.id === groupId);
      const newQ = {
        id: newId,
        temp_id: newId,
        part_id: currentPart.id,
        temp_part_id: currentPart.id,
        section_id: section.id,
        question_type: type,
        question_text: "",
        group_id: groupId,
        sectionIndex: sectionIdx !== undefined ? sectionIdx : (type === "flow_chart" ? 0 : undefined),
        options: type === "multiple_choice" || type === "multiple_choice_multi" ? ["Option A", "Option B", "Option C", "Option D"] : null,
        correct_answer: "",
        points: 1,
        order_index: questions.length + 1
      };
      setQuestions([...questions, newQ]);
      toast.success("Question added to group");
    };
  
    const addQuestion = () => {
      if (!currentPart) {
        toast.error("Please add a part first");
        return;
      }
      const newId = `temp-q-${Date.now()}`;
      const newQ = {
        id: newId,
        temp_id: newId,
        part_id: currentPart.id,
        temp_part_id: currentPart.id,
        section_id: section.id,
        question_type: "short_answer",
        question_text: "New Question",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correct_answer: "",
        points: 1,
        order_index: questions.length + 1
      };
      setQuestions([...questions, newQ]);
      toast.success("Question added");
    };


  const deleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id && q.temp_id !== id));
    toast.info("Question removed");
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await onSave({ parts, questions });
      toast.success("Changes saved successfully");
    } catch (err) {
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
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
      setLeftPanelWidth(Math.max(20, Math.min(80, newWidth)));
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

  const insertImageToPassage = (imageUrl: string) => {
    const currentText = currentPart?.passage_text || "";
    const imageTag = `\n[IMAGE:${imageUrl}]\n`;
    updatePart(currentPart.id || currentPart.temp_id, "passage_text", currentText + imageTag);
    setShowImageModal(false);
    toast.success("Image added to passage");
  };

  const insertTableToPassage = (rows: number, cols: number) => {
    const currentText = currentPart?.passage_text || "";
    let tableMarkup = "\n[TABLE]\n";
    for (let r = 0; r < rows; r++) {
      const cells = [];
      for (let c = 0; c < cols; c++) {
        cells.push(r === 0 ? `Header ${c+1}` : `Cell ${r},${c+1}`);
      }
      tableMarkup += `| ${cells.join(" | ")} |\n`;
    }
    tableMarkup += "[/TABLE]\n";
    updatePart(currentPart.id || currentPart.temp_id, "passage_text", currentText + tableMarkup);
    setShowTableModal(false);
    toast.success("Table added to passage");
  };

  const isSplitLayout = sectionType === "reading" || sectionType === "writing";

  const renderQuestionGroup = (group: any, groupIndex: number) => {
    const groupQuestions = questions.filter(q => q.group_id === group.id);
    const globalStartIdx = questions.filter(q => 
      (q.part_id === currentPart?.id || q.temp_part_id === currentPart?.id) && 
      q.order_index < groupQuestions[0]?.order_index
    ).length;

    const isFlowChart = group.type === "flow_chart";
    const sections = group.sections || [];

    return (
      <div key={group.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className={cn("p-4 border-b border-gray-100 flex items-center justify-between", theme.lightBg)}>
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg", themeBg)}>
              {QUESTION_TYPES.find(t => t.id === group.type)?.icon || "?"}
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wide">{group.title}</h3>
              <p className="text-[10px] text-gray-500 font-bold">Questions {globalStartIdx + 1}-{globalStartIdx + groupQuestions.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => addQuestionToGroup(group.id, group.type)}
              className={cn("p-2 rounded-lg transition-colors", theme.lightBg, "hover:bg-opacity-80")}
              title="Add question to group"
            >
              <Plus size={16} className={themeText} />
            </button>
            <button 
              onClick={() => deleteQuestionGroup(group.id)}
              className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
              title="Delete group"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <Label className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Instructions</Label>
          <Textarea 
            value={group.instructions}
            onChange={(e) => updateQuestionGroup(group.id, "instructions", e.target.value)}
            className="w-full h-16 border-none bg-transparent text-sm italic text-gray-600 font-medium resize-none focus:ring-0 p-0"
            placeholder="Enter instructions for this question group..."
          />
        </div>

        {(group.type === "flow_chart" || group.type === "summary_completion") && (
          <div className="p-4 border-b border-gray-100 bg-yellow-50/50">
            <Label className="text-[9px] font-black uppercase text-yellow-700 tracking-widest mb-2 block">
              {group.type === "flow_chart" ? "Flow Chart / Diagram Title" : "Summary Title"}
            </Label>
            <Input 
              value={group.diagramTitle || ""}
              onChange={(e) => updateQuestionGroup(group.id, "diagramTitle", e.target.value)}
              className="h-10 border-yellow-200 bg-white font-bold"
              placeholder="e.g., Clarence Birdseye and the Frozen Food Industry"
            />
            {group.type === "flow_chart" && (
              <>
                <div className="mt-3">
                  <Label className="text-[9px] font-black uppercase text-yellow-700 tracking-widest mb-2 block">Diagram Image URL (optional)</Label>
                  <Input 
                    value={group.diagramImage || ""}
                    onChange={(e) => updateQuestionGroup(group.id, "diagramImage", e.target.value)}
                    className="h-10 border-yellow-200 bg-white"
                    placeholder="https://example.com/diagram.png"
                  />
                </div>
                <div className="mt-4 pt-4 border-t border-yellow-200">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-[9px] font-black uppercase text-yellow-700 tracking-widest">Sections (with Arrow Flow)</Label>
                    <button 
                      onClick={() => addSectionToGroup(group.id)}
                      className="text-[9px] font-black text-yellow-700 bg-yellow-100 px-3 py-1 rounded-lg hover:bg-yellow-200 transition-colors flex items-center gap-1"
                    >
                      <Plus size={12} /> ADD SECTION
                    </button>
                  </div>
                  <div className="space-y-2">
                    {sections.map((section: any, sIdx: number) => (
                      <div key={section.id} className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-yellow-200 rounded-full flex items-center justify-center text-[10px] font-black text-yellow-700">{sIdx + 1}</div>
                        <Input 
                          value={section.title}
                          onChange={(e) => updateSection(group.id, sIdx, e.target.value)}
                          className="h-8 flex-1 border-yellow-200 bg-white text-sm font-bold"
                          placeholder={`Section ${sIdx + 1} title (e.g., Early adventures)`}
                        />
                        <button 
                          onClick={() => deleteSection(group.id, sIdx)}
                          className="p-1 hover:bg-red-100 rounded text-red-400 hover:text-red-600"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {(group.type === "paragraph_matching" || group.type === "matching") && (
          <div className="p-4 border-b border-gray-100 bg-purple-50/50">
            <Label className="text-[9px] font-black uppercase text-purple-700 tracking-widest mb-2 block">
              Available Options (comma separated)
            </Label>
            <Input 
              value={(group.options || []).join(", ")}
              onChange={(e) => updateQuestionGroup(group.id, "options", e.target.value.split(",").map((s: string) => s.trim()))}
              className="h-10 border-purple-200 bg-white font-bold"
              placeholder="A, B, C, D, E, F, G"
            />
          </div>
        )}

        {isFlowChart && sections.length > 0 ? (
          <div className="p-4 space-y-4">
            {sections.map((flowSection: any, sIdx: number) => {
              const sectionQuestions = groupQuestions.filter((q: any) => q.sectionIndex === sIdx);
              return (
                <div key={flowSection.id}>
                  {sIdx > 0 && (
                    <div className="flex justify-center py-2">
                      <div className="text-gray-400 text-lg">↓</div>
                    </div>
                  )}
                  <div className="border border-gray-200 rounded-xl bg-gray-50/50 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
                      <h5 className="font-bold text-sm text-gray-700">{flowSection.title}</h5>
                      <button 
                        onClick={() => addQuestionToGroup(group.id, group.type, sIdx)}
                        className="text-[9px] font-black text-gray-500 hover:text-gray-700 flex items-center gap-1"
                      >
                        <Plus size={12} /> Add Question
                      </button>
                    </div>
                    <div className="p-4 space-y-3">
                      {sectionQuestions.length === 0 ? (
                        <p className="text-xs text-gray-400 italic text-center py-4">No questions in this section. Click "Add Question" above.</p>
                      ) : (
                        sectionQuestions.map((q: any) => {
                          const globalIdx = groupQuestions.findIndex((gq: any) => gq.id === q.id || gq.temp_id === q.temp_id);
                          return renderFlowChartQuestion(q, globalStartIdx + globalIdx, group);
                        })
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {groupQuestions.map((q, idx) => renderStandardQuestion(q, globalStartIdx + idx, group))}
          </div>
        )}
      </div>
    );
  };

  const renderFlowChartQuestion = (q: any, globalIdx: number, group: any) => (
    <div key={q.id || q.temp_id} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-all group/q">
      <div className="text-red-500 text-lg mt-0.5">●</div>
      <div className="flex-1 space-y-2">
        <Textarea 
          value={q.question_text}
          onChange={(e) => updateQuestion(q.id || q.temp_id, "question_text", e.target.value)}
          className="w-full border-none bg-transparent font-medium text-sm min-h-[36px] resize-none focus:ring-0 p-0"
          placeholder="e.g., he left __________ for financial reasons (use __ for blanks)"
        />
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-gray-400 uppercase">Answer:</span>
          <Input 
            value={q.correct_answer}
            onChange={(e) => updateQuestion(q.id || q.temp_id, "correct_answer", e.target.value)}
            className="h-7 text-xs border-gray-200 rounded-lg flex-1 max-w-[200px] font-bold"
            placeholder="Correct answer"
          />
          <select 
            value={q.sectionIndex ?? 0}
            onChange={(e) => updateQuestion(q.id || q.temp_id, "sectionIndex", parseInt(e.target.value))}
            className="h-7 text-[10px] font-bold border border-gray-200 rounded-lg px-2 bg-white"
          >
            {(group.sections || []).map((s: any, i: number) => (
              <option key={s.id} value={i}>Section {i + 1}</option>
            ))}
          </select>
        </div>
      </div>
      <button 
        onClick={() => deleteQuestion(q.id || q.temp_id)}
        className="p-1.5 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover/q:opacity-100"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );

  const renderStandardQuestion = (q: any, globalIdx: number, group: any) => (
    <div key={q.id || q.temp_id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-all group/q">
      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-sm", themeBg, "text-white")}>
        {globalIdx + 1}
      </div>
      
      <div className="flex-1 space-y-2">
        <Textarea 
          value={q.question_text}
          onChange={(e) => updateQuestion(q.id || q.temp_id, "question_text", e.target.value)}
          className="w-full border-none bg-transparent font-medium text-sm min-h-[36px] resize-none focus:ring-0 p-0"
          placeholder={getPlaceholderForType(group.type)}
        />
        
        {group.type === "multiple_choice" && (
          <div className="space-y-1.5 pl-2 border-l-2 border-gray-200">
            {(q.options || ["A", "B", "C", "D"]).map((opt: string, oIdx: number) => (
              <div key={oIdx} className="flex items-center gap-2">
                <div className={cn(
                  "w-5 h-5 rounded flex items-center justify-center text-[10px] font-black border",
                  q.correct_answer === opt ? "bg-green-500 text-white border-green-500" : "bg-white text-gray-300 border-gray-200"
                )}>
                  {String.fromCharCode(65 + oIdx)}
                </div>
                <Input 
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...(q.options || [])];
                    newOpts[oIdx] = e.target.value;
                    updateQuestion(q.id || q.temp_id, "options", newOpts);
                  }}
                  className="h-7 text-xs border-gray-100 rounded-lg flex-1"
                />
                <button 
                  onClick={() => updateQuestion(q.id || q.temp_id, "correct_answer", opt)}
                  className={cn("text-[8px] font-black px-2 py-0.5 rounded", q.correct_answer === opt ? "bg-green-100 text-green-600" : "text-gray-300 hover:text-green-500")}
                >
                  ✓
                </button>
              </div>
            ))}
          </div>
        )}

        {(group.type === "true_false_ng") && (
          <div className="flex gap-2">
            {["TRUE", "FALSE", "NOT GIVEN"].map((opt) => (
              <button
                key={opt}
                onClick={() => updateQuestion(q.id || q.temp_id, "correct_answer", opt.toLowerCase().replace(" ", "-"))}
                className={cn(
                  "text-[9px] font-black px-3 py-1.5 rounded-lg border transition-all",
                  q.correct_answer === opt.toLowerCase().replace(" ", "-") 
                    ? "bg-green-500 text-white border-green-500" 
                    : "bg-white text-gray-400 border-gray-200 hover:border-green-300"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {(group.type === "paragraph_matching" || group.type === "matching") && (
          <div className="flex flex-wrap gap-1.5">
            {(group.options || ["A", "B", "C", "D", "E", "F", "G"]).map((opt: string) => (
              <button
                key={opt}
                onClick={() => updateQuestion(q.id || q.temp_id, "correct_answer", opt)}
                className={cn(
                  "w-7 h-7 text-[10px] font-black rounded-lg border transition-all",
                  q.correct_answer === opt 
                    ? "bg-green-500 text-white border-green-500" 
                    : "bg-white text-gray-400 border-gray-200 hover:border-green-300"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {(group.type === "gap_fill" || group.type === "summary_completion" || group.type === "short_answer") && (
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-gray-400 uppercase">Answer:</span>
            <Input 
              value={q.correct_answer}
              onChange={(e) => updateQuestion(q.id || q.temp_id, "correct_answer", e.target.value)}
              className="h-7 text-xs border-gray-200 rounded-lg flex-1 max-w-[200px] font-bold"
              placeholder="Correct answer"
            />
          </div>
        )}

        {group.type === "multiple_choice_multi" && (
          <div className="space-y-2">
            <div className="space-y-1.5 pl-2 border-l-2 border-gray-200">
              {(q.options || ["A", "B", "C", "D", "E"]).map((opt: string, oIdx: number) => (
                <div key={oIdx} className="flex items-center gap-2">
                  <div className={cn(
                    "w-5 h-5 rounded flex items-center justify-center text-[10px] font-black border",
                    (q.correct_answer || "").includes(String.fromCharCode(65 + oIdx)) ? "bg-green-500 text-white border-green-500" : "bg-white text-gray-300 border-gray-200"
                  )}>
                    {String.fromCharCode(65 + oIdx)}
                  </div>
                  <Input 
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...(q.options || [])];
                      newOpts[oIdx] = e.target.value;
                      updateQuestion(q.id || q.temp_id, "options", newOpts);
                    }}
                    className="h-7 text-xs border-gray-100 rounded-lg flex-1"
                  />
                  <button 
                    onClick={() => {
                      const letter = String.fromCharCode(65 + oIdx);
                      const current = q.correct_answer || "";
                      const newAnswer = current.includes(letter) 
                        ? current.replace(letter, "").replace(/,\s*,/g, ",").replace(/^,|,$/g, "")
                        : current ? `${current}, ${letter}` : letter;
                      updateQuestion(q.id || q.temp_id, "correct_answer", newAnswer);
                    }}
                    className={cn("text-[8px] font-black px-2 py-0.5 rounded", (q.correct_answer || "").includes(String.fromCharCode(65 + oIdx)) ? "bg-green-100 text-green-600" : "text-gray-300 hover:text-green-500")}
                  >
                    ✓
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-gray-400 font-bold">Selected: {q.correct_answer || "None"}</p>
          </div>
        )}
      </div>

      <button 
        onClick={() => deleteQuestion(q.id || q.temp_id)}
        className="p-1.5 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover/q:opacity-100"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );

  const getPlaceholderForType = (type: string) => {
    switch(type) {
      case "flow_chart": return "e.g., he left __________ for financial reasons";
      case "true_false_ng": return "e.g., The public today has a positive view of frozen foods.";
      case "paragraph_matching": return "e.g., An explanation of the neurological process";
      case "gap_fill": return "e.g., It appears that placebos can treat or reduce the __________ of conditions.";
      case "summary_completion": return "e.g., What were carved in the experimental dials?";
      case "matching": return "e.g., When did Francis Ronalds achieve a satisfactory result?";
      default: return "Enter question text...";
    }
  };

  const ungroupedQuestions = partQuestions.filter(q => !q.group_id);

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col font-sans select-none text-[#333] text-sm" ref={containerRef}>
      <header className="bg-white border-b border-gray-200 px-4 py-1.5 sticky top-0 z-50 shadow-sm shrink-0">
        <div className="w-full flex items-center justify-between h-10">
          <div className="flex items-center space-x-6 flex-1 justify-start min-w-0">
            <h1 className={cn("font-bold text-2xl tracking-wide whitespace-nowrap", themeText)}>IELTS</h1>
            <div className="h-5 w-px bg-gray-200" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none">Visual Editor</span>
              <span className="text-xs font-bold truncate max-w-[200px]">{testTitle}</span>
            </div>
          </div>

          <div className="flex-1 flex justify-center px-2">
            <div className="bg-gray-100 p-0.5 rounded-lg flex items-center shadow-inner">
              <button 
                onClick={() => setActiveTab("edit")}
                className={cn(
                  "px-6 py-1.5 rounded-md text-[10px] font-black transition-all flex items-center gap-2",
                  activeTab === "edit" ? cn(themeBg, "text-white shadow-md") : "text-gray-500 hover:text-gray-700"
                )}
              >
                <Settings size={14} /> EDIT
              </button>
              <button 
                onClick={() => setActiveTab("preview")}
                className={cn(
                  "px-6 py-1.5 rounded-md text-[10px] font-black transition-all flex items-center gap-2",
                  activeTab === "preview" ? cn(themeBg, "text-white shadow-md") : "text-gray-500 hover:text-gray-700"
                )}
              >
                <Eye size={14} /> PREVIEW
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3 flex-1 justify-end min-w-0">
            <Button 
              onClick={handleSaveAll} 
              disabled={isSaving}
              size="sm"
              className={cn("text-white gap-2 font-black px-6 rounded-lg h-9 shadow-md transition-all active:scale-95", themeBg, sectionType === 'reading' || sectionType === 'listening' ? "hover:bg-[#005a96]" : "hover:bg-[#B91C1C]")}
            >
              {isSaving ? "SAVING..." : <><Save size={16} /> SAVE CHANGES</>}
            </Button>
            <button 
              onClick={onExit}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
              title="Exit Editor"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {activeTab === "edit" && (
        <div className="h-14 bg-[#f8f9fa] border-b border-gray-200 flex items-center px-4 shrink-0 gap-4 overflow-x-auto no-scrollbar shadow-inner">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">Parts:</span>
            <div className="flex items-center gap-1.5">
              {parts.map((p, idx) => (
                <div key={p.id || p.temp_id} className="flex items-center group/p relative">
                  <button
                    onClick={() => setCurrentPartIndex(idx)}
                    className={cn(
                      "h-8 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border flex items-center gap-2",
                      currentPartIndex === idx 
                        ? cn("bg-white text-[#222] shadow-sm", themeBorder) 
                        : "bg-gray-100 border-transparent text-gray-500 hover:bg-white hover:border-gray-300"
                    )}
                  >
                    PART {p.part_number}
                  </button>
                  <button 
                    onClick={() => deletePart(idx)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white opacity-0 group-hover/p:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600 shadow-lg z-10"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
              <button 
                onClick={addPart}
                className={cn("w-8 h-8 rounded-xl text-white flex items-center justify-center hover:scale-105 transition-transform shadow-lg", themeBg)}
                title="Add New Part"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          <div className="h-6 w-px bg-gray-200 shrink-0" />

          <div className="flex items-center gap-2 shrink-0">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowGroupModal(true)} 
              className={cn("h-8 text-[10px] bg-white border-gray-200 gap-2 font-black transition-colors py-0 px-4 rounded-xl", "hover:" + themeBorder, "hover:" + themeText)}
            >
              <Layers size={14} /> ADD QUESTION GROUP
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowImageModal(true)} 
              className="h-8 text-[10px] bg-white border-gray-200 gap-2 font-black py-0 px-3 rounded-xl hover:border-green-400 hover:text-green-600"
            >
              <ImageIcon size={14} /> IMAGE
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowTableModal(true)} 
              className="h-8 text-[10px] bg-white border-gray-200 gap-2 font-black py-0 px-3 rounded-xl hover:border-purple-400 hover:text-purple-600"
            >
              <TableIcon size={14} /> TABLE
            </Button>
          </div>
        </div>
      )}

      <main className="flex-1 flex relative overflow-hidden bg-[#f0f2f5]">
        {isSplitLayout ? (
          <>
            <div 
              className="overflow-auto border-r border-gray-200 bg-white h-full shadow-lg z-10" 
              style={{ width: `${leftPanelWidth}%` }}
            >
              <div className="p-6 max-w-4xl mx-auto space-y-6">
                <div className={cn("p-4 rounded-2xl border flex flex-col gap-2", sectionType === 'reading' ? "bg-[#0072bc]/5 border-[#0072bc]/10" : "bg-[#DC2626]/5 border-[#DC2626]/10")}>
                  <div className="flex items-center justify-between">
                    <Label className={cn("text-[10px] font-black uppercase tracking-widest", themeText)}>Part {currentPart?.part_number} Heading</Label>
                    <div className="text-[10px] font-black text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100">Reading Passage</div>
                  </div>
                  <input 
                    type="text" 
                    value={currentPart?.title || ""} 
                    onChange={(e) => updatePart(currentPart.id || currentPart.temp_id, "title", e.target.value)}
                    className="text-2xl font-black w-full border-b-2 border-transparent focus:border-current outline-none bg-transparent transition-all placeholder:text-gray-300 py-1"
                    placeholder="Enter Passage Title..."
                  />
                  <p className="text-[10px] font-bold text-gray-400 mt-1 italic">You should spend about 20 minutes on Questions which are based on Reading Passage {currentPart?.part_number} below.</p>
                </div>
  
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                      <FileText size={12} /> Passage Content
                    </Label>
                    <div className="flex gap-1">
                      <button onClick={() => setShowTableModal(true)} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 transition-colors" title="Insert Table"><TableIcon size={14}/></button>
                      <button onClick={() => setShowImageModal(true)} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 transition-colors" title="Insert Image"><ImageIcon size={14}/></button>
                    </div>
                  </div>
                  <Textarea 
                    value={currentPart?.passage_text || ""} 
                    onChange={(e) => updatePart(currentPart.id || currentPart.temp_id, "passage_text", e.target.value)}
                    className="w-full min-h-[600px] border-2 border-gray-50 rounded-2xl focus:border-[#0072bc] p-6 font-serif text-lg leading-[1.8] shadow-inner transition-all resize-none bg-gray-50/30"
                    placeholder="Type or paste your passage content here...&#10;&#10;Use [IMAGE:url] to insert images&#10;Use [TABLE]...[/TABLE] for tables&#10;Use <b>text</b> for bold paragraph labels like A, B, C"
                  />
                </div>
              </div>
            </div>
  
            <div 
              onMouseDown={handleMouseDown}
              className="w-1.5 bg-gray-200 hover:bg-[#0072bc] cursor-col-resize transition-all flex-shrink-0 relative group z-20"
            >
              <div className="absolute inset-y-0 -left-2 -right-2 bg-transparent" />
            </div>
  
            <div className="overflow-auto flex-1 bg-[#f8f9fa] h-full">
              <div className="p-6 max-w-3xl mx-auto space-y-6">
                {partGroups.length > 0 && (
                  <div className="space-y-6">
                    {partGroups.map((group: any, idx: number) => renderQuestionGroup(group, idx))}
                  </div>
                )}

                {ungroupedQuestions.length > 0 && (
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="font-black text-sm uppercase tracking-wide mb-4 text-gray-500">Ungrouped Questions</h3>
                    <div className="space-y-3">
                      {ungroupedQuestions.map((q, idx) => (
                        <div key={q.id || q.temp_id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-sm", themeBg, "text-white")}>
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <Textarea 
                              value={q.question_text}
                              onChange={(e) => updateQuestion(q.id || q.temp_id, "question_text", e.target.value)}
                              className="w-full border-none bg-transparent font-medium text-sm min-h-[36px] resize-none focus:ring-0 p-0"
                              placeholder="Question text..."
                            />
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[9px] font-black text-gray-400 uppercase">Answer:</span>
                              <Input 
                                value={q.correct_answer}
                                onChange={(e) => updateQuestion(q.id || q.temp_id, "correct_answer", e.target.value)}
                                className="h-7 text-xs border-gray-200 rounded-lg flex-1 max-w-[200px] font-bold"
                              />
                            </div>
                          </div>
                          <button onClick={() => deleteQuestion(q.id || q.temp_id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-500">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button 
                  onClick={() => setShowGroupModal(true)} 
                  className={cn("w-full h-14 border-2 border-dashed bg-white transition-all rounded-2xl font-black flex items-center justify-center gap-3 shadow-sm text-sm group", themeText, themeBorder, "hover:bg-opacity-5")}
                >
                  <Layers size={20} /> 
                  ADD QUESTION GROUP (IDP Style)
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-auto bg-[#f8f9fa]">
            <div className="max-w-4xl mx-auto p-8 space-y-6">
              <div className={cn("p-6 rounded-[2rem] text-white shadow-xl flex items-center justify-between relative overflow-hidden h-32", themeBg)}>
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Volume2 size={120} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black tracking-widest uppercase">IELTS Listening</span>
                    <span className="px-3 py-1 bg-black/20 rounded-full text-[10px] font-black tracking-widest uppercase">Section {currentPartIndex + 1}</span>
                  </div>
                  <h2 className="text-3xl font-black tracking-tighter uppercase">Listening Editor</h2>
                </div>
                <div className="h-16 w-16 bg-white/20 rounded-[1.5rem] flex items-center justify-center relative z-10 backdrop-blur-md border border-white/20 shadow-lg">
                  <AudioLines className="h-8 w-8 text-white" />
                </div>
              </div>
  
              <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-lg space-y-6">
                <div className="space-y-3">
                  <Label className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-2", themeText)}>
                    <Wifi size={14} /> AUDIO SOURCE (URL)
                  </Label>
                  <div className="flex gap-4">
                    <Input 
                      value={currentPart?.audio_url || ""} 
                      onChange={(e) => updatePart(currentPart.id || currentPart.temp_id, "audio_url", e.target.value)}
                      placeholder="https://example.com/audio.mp3"
                      className="h-12 text-sm border-gray-100 rounded-2xl focus:border-[#0072bc] bg-gray-50/50 font-bold flex-1 px-4"
                    />
                    <Button className={cn("h-12 px-6 rounded-2xl shadow-lg", themeBg)} size="default">
                      <Play className="h-5 w-5 mr-2" /> TEST AUDIO
                    </Button>
                  </div>
                </div>
  
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">SECTION INSTRUCTIONS</Label>
                  <Textarea 
                    value={currentPart?.instructions || ""} 
                    onChange={(e) => updatePart(currentPart.id || currentPart.temp_id, "instructions", e.target.value)}
                    className="w-full h-24 border-gray-100 rounded-2xl focus:border-[#0072bc] p-4 italic text-sm font-bold bg-gray-50/30 shadow-inner"
                    placeholder="Enter instructions..."
                  />
                </div>
              </div>
  
              {partGroups.length > 0 && (
                <div className="space-y-6">
                  {partGroups.map((group: any, idx: number) => renderQuestionGroup(group, idx))}
                </div>
              )}

              <Button 
                onClick={() => setShowGroupModal(true)} 
                className={cn("w-full h-20 border-4 border-dashed bg-white transition-all rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 shadow-xl group", themeText, themeBorder)}
              >
                <Layers size={32} /> 
                ADD QUESTION GROUP
              </Button>
            </div>
          </div>
        )}
      </main>
  
      <footer className="bg-[#f8f9fa] border-t border-gray-200 sticky bottom-0 shrink-0 h-16 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-[100]">
        <div className="flex justify-between items-center px-6 h-full gap-8">
          <div className="flex items-center h-full">
            {parts.map((p, idx) => (
              <button 
                key={p.id || p.temp_id}
                onClick={() => setCurrentPartIndex(idx)}
                className={cn(
                  "h-full px-8 text-xs font-black uppercase tracking-widest border-t-4 transition-all flex items-center gap-2",
                  currentPartIndex === idx 
                    ? cn(themeBorder, themeText, "bg-white") 
                    : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                )}
              >
                Part {p.part_number}
              </button>
            ))}
          </div>

          <div className="flex-1 flex justify-center items-center gap-1.5 overflow-x-auto px-4 no-scrollbar">
            {partQuestions.map((q, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "min-w-[28px] h-7 rounded-md text-[10px] font-black flex items-center justify-center border-b-2 transition-all cursor-pointer hover:-translate-y-0.5 shadow-sm", 
                  q.correct_answer 
                    ? "bg-[#222] border-black text-white" 
                    : "bg-white border-gray-200 text-gray-400"
                )}
                title={`Question ${idx + 1}: ${q.correct_answer ? 'Configured' : 'Empty'}`}
              >
                {idx + 1}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {currentPartIndex < parts.length - 1 ? (
              <button 
                onClick={() => setCurrentPartIndex(prev => prev + 1)}
                className={cn("text-white px-8 py-2 font-black h-11 text-[11px] rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg uppercase tracking-widest flex items-center gap-2", themeBg)}
              >
                Next Part
                <ArrowRight size={16} />
              </button>
            ) : (
              <button 
                onClick={handleSaveAll}
                className="bg-[#222] text-white px-8 py-2 font-black h-11 text-[11px] rounded-xl transition-all hover:bg-black hover:scale-105 active:scale-95 shadow-lg uppercase tracking-widest flex items-center gap-2"
              >
                Finish & Save Section
                <CheckCircle2 size={16} />
              </button>
            )}
          </div>
        </div>
      </footer>

      {showGroupModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className={cn("p-6 text-white flex justify-between items-center", themeBg)}>
              <div>
                <h3 className="text-2xl font-black tracking-tight">Add Question Group</h3>
                <p className="text-xs opacity-80 mt-1 font-bold">Choose the type of question group to add (IDP Style)</p>
              </div>
              <Button variant="ghost" onClick={() => setShowGroupModal(false)} className="text-white hover:bg-white/10 h-10 w-10 rounded-full">
                <LogOut size={20} />
              </Button>
            </div>
            <div className="p-6 grid grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
              {QUESTION_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => addQuestionGroup(type.id)}
                  className="p-4 rounded-2xl border-2 border-gray-100 hover:border-[#0072bc] transition-all text-left group hover:shadow-lg"
                >
                  <div className="text-3xl mb-2">{type.icon}</div>
                  <h4 className="font-black text-sm group-hover:text-[#0072bc]">{type.label}</h4>
                  <p className="text-[10px] text-gray-400 mt-1 font-medium">{type.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showImageModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 bg-green-600 text-white flex justify-between items-center">
              <h3 className="text-xl font-black">Insert Image</h3>
              <Button variant="ghost" onClick={() => setShowImageModal(false)} className="text-white hover:bg-white/10 h-10 w-10 rounded-full">
                <LogOut size={20} />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Image URL</Label>
                <Input 
                  id="image-url-input"
                  placeholder="https://example.com/image.png"
                  className="h-12 border-gray-200 rounded-xl"
                />
              </div>
              <Button 
                onClick={() => {
                  const input = document.getElementById('image-url-input') as HTMLInputElement;
                  if (input?.value) insertImageToPassage(input.value);
                }}
                className="w-full h-12 bg-green-600 hover:bg-green-700 rounded-xl font-black"
              >
                <ImageIcon size={18} className="mr-2" /> INSERT IMAGE
              </Button>
            </div>
          </div>
        </div>
      )}

      {showTableModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 bg-purple-600 text-white flex justify-between items-center">
              <h3 className="text-xl font-black">Insert Table</h3>
              <Button variant="ghost" onClick={() => setShowTableModal(false)} className="text-white hover:bg-white/10 h-10 w-10 rounded-full">
                <LogOut size={20} />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Rows</Label>
                  <Input id="table-rows" type="number" defaultValue={3} min={1} max={20} className="h-12 border-gray-200 rounded-xl" />
                </div>
                <div>
                  <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Columns</Label>
                  <Input id="table-cols" type="number" defaultValue={3} min={1} max={10} className="h-12 border-gray-200 rounded-xl" />
                </div>
              </div>
              <Button 
                onClick={() => {
                  const rows = parseInt((document.getElementById('table-rows') as HTMLInputElement)?.value || '3');
                  const cols = parseInt((document.getElementById('table-cols') as HTMLInputElement)?.value || '3');
                  insertTableToPassage(rows, cols);
                }}
                className="w-full h-12 bg-purple-600 hover:bg-purple-700 rounded-xl font-black"
              >
                <TableIcon size={18} className="mr-2" /> INSERT TABLE
              </Button>
            </div>
          </div>
        </div>
      )}

      {bulkMode && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col scale-in-center">
            <div className={cn("p-8 text-white flex justify-between items-center", themeBg)}>
              <div>
                <h3 className="text-2xl font-black tracking-tight">Bulk Import Questions</h3>
                <p className="text-xs opacity-80 mt-1 font-bold">Paste multiple questions (one per line).</p>
              </div>
              <Button variant="ghost" onClick={() => setBulkMode(false)} className="text-white hover:bg-white/10 h-12 w-12 rounded-full"><LogOut size={24} /></Button>
            </div>
            <div className="p-8 space-y-6">
              <div className="relative">
                <Textarea 
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="min-h-[300px] font-bold text-lg leading-relaxed border-gray-100 rounded-2xl bg-gray-50 p-6 focus:ring-[#0072bc] shadow-inner resize-none"
                  placeholder="Where was Clarence Birdseye born?&#10;What year did he move to Montana?&#10;Why did he leave college?"
                />
                <div className="absolute bottom-4 right-4 text-[10px] font-black text-gray-300 uppercase tracking-widest">Questions detected: {bulkText.split('\n').filter(l => l.trim()).length}</div>
              </div>
              <div className="flex gap-4">
                <Button 
                  onClick={() => {
                    const lines = bulkText.split('\n').filter(l => l.trim());
                    const newQs = lines.map((line, idx) => ({
                      temp_id: `bulk-${Date.now()}-${idx}`,
                      part_id: currentPart?.id,
                      temp_part_id: currentPart?.temp_id,
                      section_id: section.id,
                      question_type: "short_answer",
                      question_text: line.trim(),
                      options: ["Option A", "Option B", "Option C", "Option D"],
                      correct_answer: "",
                      points: 1,
                      order_index: questions.length + idx + 1
                    }));
                    setQuestions([...questions, ...newQs]);
                    setBulkText("");
                    setBulkMode(false);
                    toast.success(`${newQs.length} questions imported successfully`);
                  }} 
                  className={cn("flex-1 h-14 font-black text-lg rounded-2xl shadow-xl transition-all active:scale-95", themeBg)}
                >
                  IMPORT {bulkText.split('\n').filter(l => l.trim()).length} QUESTIONS
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
