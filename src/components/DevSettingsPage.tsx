import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  Terminal, 
  Upload, 
  Play, 
  Square, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Image as ImageIcon, 
  FileText, 
  Sparkles, 
  Server, 
  Check,
  Plus,
  Trash2,
  Database,
  ToggleLeft,
  ToggleRight,
  Wand2,
  MessageSquare,
  Send,
  Copy,
  FolderArchive,
  Archive,
  Download
} from 'lucide-react';
import { DBState } from '../types/prompter';

export interface UserProfile {
  id: string;
  name: string;
  isMain: boolean;
  createdAt: number;
}

interface DevSettingsPageProps {
  db: DBState;
  onUpdateDb: React.Dispatch<React.SetStateAction<DBState>>;
  onBack: () => void;
  nsfwOn: boolean;
  users?: UserProfile[];
  activeUserId?: string;
  onSwitchUser?: (userId: string) => void;
  onCreateUser?: (name: string) => void;
  onDeleteUser?: (userId: string) => void;
  onExtractToUser?: (userId: string, data: any, categoryFilter?: string | string[]) => Promise<{ added: number; presets: number }>;
  initialActivePreset?: 'extractor' | 'refiner' | 'chat';
  initialRefinePrompt?: string;
  onRestoreMainDB?: () => void;
  onFullExport?: () => void;
  onFullImport?: () => void;
}

interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format?: string;
    family?: string;
    families?: string[];
    parameter_size?: string;
    quantization_level?: string;
  };
}

interface RunningModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  expires_at: string;
  size_vram?: number;
}

export const EXTRACTOR_PRESETS = {
  detailed: {
    name: 'Detailed Output',
    systemPrompt: `You are an expert AI vision analyst and structured prompt engineer. Analyze the provided image and extract 6 distinct, isolated elements into a valid JSON object.

Compose every extracted prompt in clear, natural language of detailed length (typically 2 to 3 articulate sentences) to retain richer essential detail and atmosphere. Avoid excessive micro-details or comma-separated keyword lists, but ensure comprehensive descriptive depth. Strictly isolate each element from other domains so elements can be paired with any setting without contradiction.

Element Definitions & Boundaries:
1. "subject": Person and physique only (facial features, hair color and style, eyes, skin tone, build, and defining physical characteristics). Strictly exclude clothing, posture, lighting, and environment.
2. "outfit": Garments, footwear, and accessories only. Structure as either:
   - Option A: { "top": { "name": "...", "prompt": "..." }, "bottom": { "name": "...", "prompt": "..." }, "accessories": { "name": "...", "prompt": "..." } }
   - Option B: { "one_piece": { "name": "...", "prompt": "..." }, "accessories": { "name": "...", "prompt": "..." } }
   Strictly exclude physical body traits and background.
3. "pose": Stance, posture, limb orientation, and bodily action only (e.g. seated with crossed legs, standing poised, leaning back). Strictly describe bodily posture and kinematics; exclude all environment, furniture, vehicles, and setting details.
4. "composition": Camera perspective and shot framing. Categorize into exactly one subcategory based on context:
   - "angle": Camera elevation or tilt (e.g. eye-level straight, low angle looking up, bird's-eye overhead, Dutch tilt).
   - "framing": Portrait cropping distance (e.g. close-up headshot, half-body waist-up, full-body shot).
   - "style": Perspective technique (e.g. mirror selfie, candid POV, over-the-shoulder view).
   Format: { "type": "angle" | "framing" | "style", "name": "...", "prompt": "..." }
5. "environment": Physical setting, location, architecture, and background scenery only. Categorize into:
   - "indoor": Interior rooms, studios, apartments, cafes, or architectural spaces.
   - "outdoor": Open-air landscapes, streets, beaches, forests, rooftops, or natural outdoor scenery.
   Format: { "type": "indoor" | "outdoor", "name": "...", "prompt": "..." }
   Strictly exclude lighting conditions or person details.
6. "lighting": Illumination characteristics, light sources, color temperature, and shadows only (e.g. soft diffused window light, warm golden hour sun, moody chiaroscuro). Strictly exclude location and scenery details.

Prompt Writing Guidelines:
- Format: Natural, descriptive prose of 2–3 sentences balancing rich detail and vividness without verbosity or tag lists.
- JSON Output: Return only a valid JSON object containing keys: "subject", "outfit", "pose", "composition", "environment", "lighting".`,
    userPrompt: 'Extract the 6 distinct elements (subject, outfit, pose, composition, environment, lighting) as structured JSON. Write each prompt in clear, natural language of 2–3 sentences to capture rich detail while maintaining strict element isolation.'
  },
  medium: {
    name: 'Medium Length Output',
    systemPrompt: `You are an expert AI vision analyst and structured prompt engineer. Analyze the provided image and extract 6 distinct, isolated elements into a valid JSON object.

Compose every extracted prompt in clear, natural language of medium length (typically 1 to 2 articulate sentences). Avoid excessive micro-details, and never reduce descriptions into comma-separated keywords. Retain all essential visual traits and atmosphere while strictly isolating each element from other domains so elements can be paired with any setting without contradiction.

Element Definitions & Boundaries:
1. "subject": Person and physique only (facial features, hair color and style, eyes, skin tone, build, and defining physical characteristics). Strictly exclude clothing, posture, lighting, and environment.
2. "outfit": Garments, footwear, and accessories only. Structure as either:
   - Option A: { "top": { "name": "...", "prompt": "..." }, "bottom": { "name": "...", "prompt": "..." }, "accessories": { "name": "...", "prompt": "..." } }
   - Option B: { "one_piece": { "name": "...", "prompt": "..." }, "accessories": { "name": "...", "prompt": "..." } }
   Strictly exclude physical body traits and background.
3. "pose": Stance, posture, limb orientation, and bodily action only (e.g. seated with crossed legs, standing poised, leaning back). Strictly describe bodily posture and kinematics; exclude all environment, furniture, vehicles, and setting details.
4. "composition": Camera perspective and shot framing. Categorize into exactly one subcategory based on context:
   - "angle": Camera elevation or tilt (e.g. eye-level straight, low angle looking up, bird's-eye overhead, Dutch tilt).
   - "framing": Portrait cropping distance (e.g. close-up headshot, half-body waist-up, full-body shot).
   - "style": Perspective technique (e.g. mirror selfie, candid POV, over-the-shoulder view).
   Format: { "type": "angle" | "framing" | "style", "name": "...", "prompt": "..." }
5. "environment": Physical setting, location, architecture, and background scenery only. Categorize into:
   - "indoor": Interior rooms, studios, apartments, cafes, or architectural spaces.
   - "outdoor": Open-air landscapes, streets, beaches, forests, rooftops, or natural outdoor scenery.
   Format: { "type": "indoor" | "outdoor", "name": "...", "prompt": "..." }
   Strictly exclude lighting conditions or person details.
6. "lighting": Illumination characteristics, light sources, color temperature, and shadows only (e.g. soft diffused window light, warm golden hour sun, moody chiaroscuro). Strictly exclude location and scenery details.

Prompt Writing Guidelines:
- Format: Natural, descriptive prose of medium length (1–2 sentences) that balances clarity and vividness without verbosity or tag lists.
- JSON Output: Return only a valid JSON object containing keys: "subject", "outfit", "pose", "composition", "environment", "lighting".`,
    userPrompt: 'Extract the 6 distinct elements (subject, outfit, pose, composition, environment, lighting) as structured JSON. Write each prompt in clear, natural language of medium length (1–2 sentences) retaining essential characteristics with strict element isolation.'
  }
};

export const DEFAULT_EXTRACTOR_SYSTEM_PROMPT = EXTRACTOR_PRESETS.detailed.systemPrompt;
export const DEFAULT_EXTRACTOR_USER_PROMPT = EXTRACTOR_PRESETS.detailed.userPrompt;

export const DevSettingsPage: React.FC<DevSettingsPageProps> = ({
  db,
  onUpdateDb,
  onBack,
  nsfwOn,
  users,
  activeUserId,
  onSwitchUser,
  onCreateUser,
  onDeleteUser,
  onExtractToUser,
  initialActivePreset,
  initialRefinePrompt,
  onRestoreMainDB,
  onFullExport,
  onFullImport
}) => {
  // Ollama URL State
  const [ollamaUrl, setOllamaUrl] = useState<string>(() => {
    return localStorage.getItem('ultimate_prompter_ollama_url') || 'http://localhost:11434';
  });

  const [models, setModels] = useState<OllamaModel[]>([]);
  const [runningModels, setRunningModels] = useState<RunningModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connected' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState<string>('');

  // Active Preset Tab State
  const [activePreset, setActivePreset] = useState<'extractor' | 'refiner' | 'chat'>(initialActivePreset || 'extractor');

  // Model Thinking Toggle State
  const [thinkingEnabled, setThinkingEnabled] = useState<boolean>(false);

  // Abort Controllers for stopping AI generation immediately
  const chatAbortControllerRef = useRef<AbortController | null>(null);
  const refinerAbortControllerRef = useRef<AbortController | null>(null);
  const visionAbortControllerRef = useRef<AbortController | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Helper to detect image files by MIME type or extension
  const isImageFile = (file: File): boolean => {
    if (file.type && file.type.startsWith('image/')) return true;
    const name = (file.name || '').toLowerCase();
    return (
      name.endsWith('.png') ||
      name.endsWith('.jpg') ||
      name.endsWith('.jpeg') ||
      name.endsWith('.webp') ||
      name.endsWith('.gif') ||
      name.endsWith('.bmp') ||
      name.endsWith('.avif') ||
      name.endsWith('.svg')
    );
  };

  // Chat State with session persistence
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem('dev_chat_messages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [chatIsGenerating, setChatIsGenerating] = useState<boolean>(false);

  useEffect(() => {
    try {
      sessionStorage.setItem('dev_chat_messages', JSON.stringify(chatMessages));
    } catch {}
  }, [chatMessages]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, chatIsGenerating]);

  // Helper to filter out reasoning blocks (<think>, <thought>, <reasoning>) if thinking is turned off
  const filterThinkingOutput = (text: string, isThinkingOn: boolean): string => {
    if (isThinkingOn) return text;
    return text
      .replace(/<think[\s\S]*?<\/think>/gi, '')
      .replace(/<think[\s\S]*$/gi, '')
      .replace(/<thought[\s\S]*?<\/thought>/gi, '')
      .replace(/<thought[\s\S]*$/gi, '')
      .replace(/<reasoning[\s\S]*?<\/reasoning>/gi, '')
      .replace(/<reasoning[\s\S]*$/gi, '')
      .replace(/<\/?(?:think|thought|reasoning)>/gi, '')
      .replace(/(?:^|\n)(?:\*\*|###\s*)?(?:Thinking Process|Thought Process|Reasoning Process|Thinking|Reasoning):\s*[\s\S]*?(?=(?:\n\n|\n[A-Z0-9#*]|$))/gi, '')
      .trimStart();
  };

  useEffect(() => {
    if (initialActivePreset) {
      setActivePreset(initialActivePreset);
    }
  }, [initialActivePreset]);

  // Prompt Refiner State with session persistence
  const [refinerSystemPrompt, setRefinerSystemPrompt] = useState<string>(
    'You are an expert AI prompt refiner. Take the provided prompt and enhance it to be richer, more descriptive, cinematic, detailed, and optimized for high-end AI generation. Maintain the core essence while significantly elevating quality and descriptive depth.'
  );
  const [refinerImportedPrompt, setRefinerImportedPrompt] = useState<string>(() => {
    return initialRefinePrompt || sessionStorage.getItem('dev_refiner_imported') || '';
  });
  const [refinerUserPrompt, setRefinerUserPrompt] = useState<string>('Refine and enhance this prompt for maximum aesthetic impact.');
  const [refinerIsGenerating, setRefinerIsGenerating] = useState<boolean>(false);
  const [refinerRawResponse, setRefinerRawResponse] = useState<string>(() => {
    return sessionStorage.getItem('dev_refiner_raw') || '';
  });
  const [refinerIsCopied, setRefinerIsCopied] = useState<boolean>(false);

  useEffect(() => {
    try {
      sessionStorage.setItem('dev_refiner_imported', refinerImportedPrompt || '');
      sessionStorage.setItem('dev_refiner_raw', refinerRawResponse || '');
    } catch {}
  }, [refinerImportedPrompt, refinerRawResponse]);

  useEffect(() => {
    if (initialRefinePrompt) {
      setRefinerImportedPrompt(initialRefinePrompt);
    }
  }, [initialRefinePrompt]);

  const handleStopRefiner = () => {
    if (refinerAbortControllerRef.current) {
      refinerAbortControllerRef.current.abort();
      refinerAbortControllerRef.current = null;
    }
    setRefinerIsGenerating(false);
  };

  const handleRunRefiner = async () => {
    if (!selectedModel) {
      alert('Please select an Ollama model first.');
      return;
    }
    setRefinerIsGenerating(true);
    setRefinerRawResponse('');
    setRefinerIsCopied(false);

    const controller = new AbortController();
    refinerAbortControllerRef.current = controller;

    try {
      let sysPrompt = refinerSystemPrompt;
      if (!thinkingEnabled) {
        sysPrompt += `\n\n[CRITICAL DIRECTIVE: STRICTLY NO THINKING OR REASONING. Do NOT use any <think> tags. Do NOT output any internal monologue, reasoning steps, or thought process. Answer directly and immediately with ONLY the final refined prompt. No preamble or meta commentary.]`;
      }

      let userMsg = `[Imported Prompt to Refine]:\n${refinerImportedPrompt}\n\nUser Instructions: ${refinerUserPrompt}`;
      if (!thinkingEnabled) {
        userMsg = `[CRITICAL: DIRECT REPLY ONLY. NO THINKING STEPS. NO <think> TAGS]:\n${userMsg}`;
      }

      const res = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: selectedModel,
          system: sysPrompt,
          prompt: `${sysPrompt}\n\n${userMsg}`,
          stream: true,
          think: thinkingEnabled,
          options: {
            think: thinkingEnabled
          }
        })
      });

      if (!res.ok) throw new Error(`Inference HTTP error! status: ${res.status}`);
      if (!res.body) throw new Error('Response body missing.');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        if (controller.signal.aborted) break;
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsedChunk = JSON.parse(line);
            if (parsedChunk.response) {
              accumulated += parsedChunk.response;
              setRefinerRawResponse(filterThinkingOutput(accumulated, thinkingEnabled));
            }
          } catch {
            accumulated += line;
            setRefinerRawResponse(filterThinkingOutput(accumulated, thinkingEnabled));
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || controller.signal.aborted) {
        // Stopped by user
      } else {
        setRefinerRawResponse(`Error during refinement: ${err.message}`);
      }
    } finally {
      refinerAbortControllerRef.current = null;
      setRefinerIsGenerating(false);
    }
  };

  const handleCopyRefined = () => {
    if (!refinerRawResponse) return;
    navigator.clipboard.writeText(refinerRawResponse);
    setRefinerIsCopied(true);
    setTimeout(() => setRefinerIsCopied(false), 2500);
  };

  // Chat with AI State
  interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    images?: string[];
  }
  const [chatInput, setChatInput] = useState<string>('');
  const [chatImages, setChatImages] = useState<string[]>([]);
  const [isChatDraggingOver, setIsChatDraggingOver] = useState<boolean>(false);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  const chatDragCounterRef = useRef(0);

  const processChatFiles = (files: File[]) => {
    const imageFiles = files.filter(isImageFile);
    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const res = evt.target?.result as string;
        if (res) {
          let base64 = res;
          if (base64.includes('base64,')) {
            base64 = base64.split('base64,')[1];
          }
          setChatImages((prev) => [...prev, base64]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleChatImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    processChatFiles(Array.from(files));
    e.target.value = '';
  };

  const handleChatDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    chatDragCounterRef.current++;
    setIsChatDraggingOver(true);
  };

  const handleChatDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    if (!isChatDraggingOver) {
      setIsChatDraggingOver(true);
    }
  };

  const handleChatDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    chatDragCounterRef.current--;
    if (chatDragCounterRef.current <= 0) {
      chatDragCounterRef.current = 0;
      setIsChatDraggingOver(false);
    }
  };

  const handleChatDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    chatDragCounterRef.current = 0;
    setIsChatDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processChatFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleStopChatMessage = () => {
    if (chatAbortControllerRef.current) {
      chatAbortControllerRef.current.abort();
      chatAbortControllerRef.current = null;
    }
    setChatIsGenerating(false);
  };

  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!chatInput.trim() && chatImages.length === 0) || !selectedModel) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: chatInput.trim(),
      images: chatImages.length > 0 ? [...chatImages] : undefined
    };

    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput('');
    setChatImages([]);
    setChatIsGenerating(true);

    const assistantIndex = newMessages.length;
    setChatMessages([...newMessages, { role: 'assistant', content: '' }]);

    const controller = new AbortController();
    chatAbortControllerRef.current = controller;

    try {
      const apiMessages = newMessages.map((m, idx) => {
        // When thinking is disabled, inject directive directly into the user's latest prompt so reasoning models don't ignore it
        if (!thinkingEnabled && idx === newMessages.length - 1 && m.role === 'user') {
          return {
            role: 'user',
            content: `[CRITICAL DIRECTIVE: DO NOT GENERATE ANY THINKING PROCESS, REASONING STEPS, INTERNAL MONOLOGUE, OR <think> TAGS. DO NOT THINK. ANSWER IMMEDIATELY AND DIRECTLY WITH ONLY THE FINAL RESPONSE.]\n\n${m.content}`,
            ...(m.images && m.images.length > 0 ? { images: m.images } : {})
          };
        }
        return {
          role: m.role,
          content: m.content,
          ...(m.images && m.images.length > 0 ? { images: m.images } : {})
        };
      });

      const noThinkingDirective = 
        `CRITICAL DIRECTIVE: You MUST NOT generate any thinking process, reasoning steps, internal monologue, or <think> tags. Never output <think> or </think>. You must skip thinking completely and reply immediately and directly with your final response.`;

      const messagesToSend = !thinkingEnabled
        ? [
            {
              role: 'system',
              content: noThinkingDirective
            },
            ...apiMessages
          ]
        : apiMessages;

      const res = await fetch(`${ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: selectedModel,
          messages: messagesToSend,
          stream: true,
          think: thinkingEnabled,
          options: {
            think: thinkingEnabled
          }
        })
      });

      if (!res.ok) throw new Error(`Chat HTTP error! status: ${res.status}`);
      if (!res.body) throw new Error('Response body missing.');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        if (controller.signal.aborted) break;
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.message?.content) {
              accumulated += parsed.message.content;
              setChatMessages((prev) => {
                const updated = [...prev];
                updated[assistantIndex] = { role: 'assistant', content: filterThinkingOutput(accumulated, thinkingEnabled) };
                return updated;
              });
            } else if (parsed.message?.thinking) {
              if (thinkingEnabled) {
                accumulated += `<think>${parsed.message.thinking}</think>`;
                setChatMessages((prev) => {
                  const updated = [...prev];
                  updated[assistantIndex] = { role: 'assistant', content: accumulated };
                  return updated;
                });
              }
              // If thinking is disabled, do not append parsed.message.thinking
            }
          } catch {
            accumulated += line;
            setChatMessages((prev) => {
              const updated = [...prev];
              updated[assistantIndex] = { role: 'assistant', content: filterThinkingOutput(accumulated, thinkingEnabled) };
              return updated;
            });
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || controller.signal.aborted) {
        setChatMessages((prev) => {
          const updated = [...prev];
          if (updated[assistantIndex] && !updated[assistantIndex].content) {
            updated[assistantIndex] = { role: 'assistant', content: '(Response stopped by user)' };
          }
          return updated;
        });
      } else {
        setChatMessages((prev) => {
          const updated = [...prev];
          updated[assistantIndex] = { role: 'assistant', content: `Error: ${err.message}` };
          return updated;
        });
      }
    } finally {
      chatAbortControllerRef.current = null;
      setChatIsGenerating(false);
    }
  };



  // Image Vision Testing State with session persistence
  const [testImage, setTestImage] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('dev_test_image') || null;
    } catch {
      return null;
    }
  });
  const [testImageName, setTestImageName] = useState<string>(() => {
    try {
      return sessionStorage.getItem('dev_test_image_name') || '';
    } catch {
      return '';
    }
  });

  const [systemPrompt, setSystemPrompt] = useState<string>(DEFAULT_EXTRACTOR_SYSTEM_PROMPT);
  const [userPrompt, setUserPrompt] = useState<string>(DEFAULT_EXTRACTOR_USER_PROMPT);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [rawResponse, setRawResponse] = useState<string>(() => {
    try {
      return sessionStorage.getItem('dev_extractor_raw') || '';
    } catch {
      return '';
    }
  });
  const [parsedData, setParsedData] = useState<any | null>(() => {
    try {
      const s = sessionStorage.getItem('dev_extractor_parsed');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });


  useEffect(() => {
    try {
      if (testImage) {
        sessionStorage.setItem('dev_test_image', testImage);
      } else {
        sessionStorage.removeItem('dev_test_image');
      }
      sessionStorage.setItem('dev_test_image_name', testImageName || '');
      sessionStorage.setItem('dev_extractor_raw', rawResponse || '');
      if (parsedData) {
        sessionStorage.setItem('dev_extractor_parsed', JSON.stringify(parsedData));
      } else {
        sessionStorage.removeItem('dev_extractor_parsed');
      }
    } catch {}
  }, [testImage, testImageName, rawResponse, parsedData]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('ultimate_prompter_ollama_url', ollamaUrl);
  }, [ollamaUrl]);

  useEffect(() => {
    handleScanModels();
  }, [ollamaUrl]);

  const handleScanModels = async () => {
    setIsLoadingModels(true);
    setConnectionMessage('Scanning Ollama models...');
    try {
      const res = await fetch(`${ollamaUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      const list = data.models || [];
      setModels(list);
      setConnectionStatus('connected');
      setConnectionMessage(`Successfully connected! Found ${list.length} local model(s).`);

      if (list.length > 0 && (!selectedModel || !list.some((m: OllamaModel) => m.name === selectedModel))) {
        const visionModel = list.find((m: OllamaModel) => 
          m.name.toLowerCase().includes('llava') || 
          m.name.toLowerCase().includes('vision') ||
          m.name.toLowerCase().includes('bakllava') ||
          m.name.toLowerCase().includes('minicpm')
        );
        setSelectedModel(visionModel ? visionModel.name : list[0].name);
      }

      fetchRunningModels();
    } catch (err: any) {
      setConnectionStatus('error');
      setConnectionMessage(`Connection failed: ${err.message}. Make sure Ollama is running and CORS is enabled (OLLAMA_ORIGINS="*").`);
      setModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const fetchRunningModels = async () => {
    try {
      const res = await fetch(`${ollamaUrl}/api/ps`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        setRunningModels(data.models || []);
      }
    } catch {
      setRunningModels([]);
    }
  };

  const handleLoadModel = async () => {
    if (!selectedModel) return;
    try {
      setConnectionMessage(`Loading model ${selectedModel} into memory...`);
      const res = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          prompt: '',
          keep_alive: '10m'
        })
      });
      if (res.ok) {
        setConnectionMessage(`Model ${selectedModel} loaded successfully!`);
        fetchRunningModels();
      } else {
        throw new Error('Failed to load model');
      }
    } catch (err: any) {
      setConnectionMessage(`Error loading model: ${err.message}`);
    }
  };

  const handleUnloadModel = async () => {
    if (!selectedModel) return;
    try {
      setConnectionMessage(`Unloading model ${selectedModel} from memory...`);
      const res = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          prompt: '',
          keep_alive: 0
        })
      });
      if (res.ok) {
        setConnectionMessage(`Model ${selectedModel} unloaded from memory.`);
        fetchRunningModels();
      } else {
        throw new Error('Failed to unload model');
      }
    } catch (err: any) {
      setConnectionMessage(`Error unloading model: ${err.message}`);
    }
  };

  const [isExtractorDraggingOver, setIsExtractorDraggingOver] = useState<boolean>(false);
  const extractorDragCounterRef = useRef(0);

  const processExtractorFile = (file: File) => {
    if (!file) return;
    setTestImageName(file.name);

    if (isImageFile(file)) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = evt.target?.result as string;
        if (result) {
          setTestImage(result);
        }
      };
      reader.readAsDataURL(file);
    } else {
      // Support prompt text or JSON files dropped into extractor
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        if (text) {
          try {
            const parsed = JSON.parse(text);
            setParsedData(parsed);
            setRawResponse(JSON.stringify(parsed, null, 2));
          } catch {
            setRawResponse(text);
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processExtractorFile(file);
    e.target.value = '';
  };

  const handleExtractorDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    extractorDragCounterRef.current++;
    setIsExtractorDraggingOver(true);
  };

  const handleExtractorDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    if (!isExtractorDraggingOver) {
      setIsExtractorDraggingOver(true);
    }
  };

  const handleExtractorDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    extractorDragCounterRef.current--;
    if (extractorDragCounterRef.current <= 0) {
      extractorDragCounterRef.current = 0;
      setIsExtractorDraggingOver(false);
    }
  };

  const handleExtractorDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    extractorDragCounterRef.current = 0;
    setIsExtractorDraggingOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const imgFile = Array.from(files).find(isImageFile) || files[0];
      if (imgFile) {
        processExtractorFile(imgFile);
      }
    }
  };

  const handleStopVisionTest = () => {
    if (visionAbortControllerRef.current) {
      visionAbortControllerRef.current.abort();
      visionAbortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  // Run Vision Inference with Live Streaming & Thinking Toggle
  const handleRunVisionTest = async () => {
    if (!selectedModel) {
      alert('Please select an Ollama model first.');
      return;
    }
    if (!testImage) {
      alert('Please upload a test image for vision analysis.');
      return;
    }

    setIsGenerating(true);
    setRawResponse('');
    setParsedData(null);

    const controller = new AbortController();
    visionAbortControllerRef.current = controller;

    try {
      let base64Data = testImage;
      if (testImage.includes('base64,')) {
        base64Data = testImage.split('base64,')[1];
      }

      let finalSysPrompt = systemPrompt;
      if (!thinkingEnabled) {
        finalSysPrompt += `\n\n[CRITICAL DIRECTIVE: STRICTLY NO THINKING OR REASONING. Do NOT use any <think> tags. Do NOT output internal monologue, reasoning steps, or thought process. Output only the final structured JSON response starting with '{'.]`;
      }

      const requestUserPrompt = !thinkingEnabled
        ? `[IMPORTANT: Reply directly with the structured JSON object. Do not think or include <think> tags.]\n\n${userPrompt}`
        : userPrompt;

      const res = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: selectedModel,
          system: finalSysPrompt,
          prompt: `${finalSysPrompt}\n\nUser Request: ${requestUserPrompt}`,
          images: [base64Data],
          stream: true,
          think: thinkingEnabled,
          options: {
            think: thinkingEnabled
          }
        })
      });

      if (!res.ok) throw new Error(`Inference HTTP error! status: ${res.status}`);
      if (!res.body) throw new Error('Response body is missing stream reader.');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        if (controller.signal.aborted) break;
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsedChunk = JSON.parse(line);
            if (parsedChunk.response) {
              accumulated += parsedChunk.response;
              setRawResponse(filterThinkingOutput(accumulated, thinkingEnabled));
            }
          } catch {
            accumulated += line;
            setRawResponse(filterThinkingOutput(accumulated, thinkingEnabled));
          }
        }
      }

      try {
        const cleanedText = filterThinkingOutput(accumulated, thinkingEnabled);
        let jsonStr = '';
        const blockMatch = cleanedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (blockMatch) {
          jsonStr = blockMatch[1].trim();
        } else {
          const jsonMatch = cleanedText.match(/\{[\s\S]*\}/) || accumulated.match(/\{[\s\S]*\}/);
          if (jsonMatch) jsonStr = jsonMatch[0];
        }

        if (jsonStr) {
          const parsed = JSON.parse(jsonStr);
          setParsedData(parsed);
        } else {
          setParsedData({ raw_text: cleanedText });
        }
      } catch {
        try {
          const cleanedText = filterThinkingOutput(accumulated, thinkingEnabled);
          const firstBrace = cleanedText.indexOf('{');
          const lastBrace = cleanedText.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            const parsed = JSON.parse(cleanedText.substring(firstBrace, lastBrace + 1));
            setParsedData(parsed);
          } else {
            setParsedData({ raw_text: cleanedText });
          }
        } catch {
          setParsedData({ raw_text: filterThinkingOutput(accumulated, thinkingEnabled) });
        }
      }

    } catch (err: any) {
      if (err.name === 'AbortError' || controller.signal.aborted) {
        // Stopped by user
      } else {
        setRawResponse(`Error during inference: ${err.message}\nMake sure the selected model supports vision (e.g., llava or llama3.2-vision).`);
      }
    } finally {
      visionAbortControllerRef.current = null;
      setIsGenerating(false);
    }
  };



  const isRunning = runningModels.some((rm) => rm.model === selectedModel || rm.name === selectedModel);

  return (
    <div className="flex-1 p-4 lg:p-8 max-w-[1600px] w-full mx-auto flex flex-col gap-6 relative z-10">
      {/* Top Header & Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-white/80 hover:text-white border border-white/[0.08] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Studio</span>
          </button>
          <div className="flex items-center gap-2">
            <Cpu className={`w-5 h-5 ${nsfwOn ? 'text-red-500' : 'text-orange-500'}`} />
            <h1 className="text-xl font-bold tracking-tight text-white">Developer & Local AI Settings</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium border ${
            connectionStatus === 'connected' 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
              : connectionStatus === 'error'
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              : 'bg-white/5 text-white/50 border-white/10'
          }`}>
            {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'error' ? 'Connection Error' : 'Idle'}
          </span>
        </div>
      </div>

      {/* Preset Mode Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { id: 'extractor', label: '1. Prompt Extractor', icon: Sparkles, desc: 'Image-to-prompt extraction' },
          { id: 'refiner', label: '2. Prompt Refiner', icon: Wand2, desc: 'Enhance & refine inspection prompt' },
          { id: 'chat', label: '3. Chat with AI', icon: MessageSquare, desc: 'Open-ended chat with multi-image support' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activePreset === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActivePreset(tab.id as any)}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left ${
                isActive
                  ? nsfwOn
                    ? 'bg-red-500/15 border-red-500/50 text-white shadow-[0_0_20px_rgba(255,34,56,0.25)]'
                    : 'bg-orange-500/15 border-orange-500/50 text-white shadow-[0_0_20px_rgba(255,102,0,0.25)]'
                  : 'bg-[#121116]/80 border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <div className={`p-2 rounded-xl ${isActive ? (nsfwOn ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400') : 'bg-white/5 text-white/40'}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold leading-tight truncate">{tab.label}</p>
                <p className="text-[11px] text-white/40 mt-0.5 truncate">{tab.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Connection & Model Management */}
        <div className="space-y-6">

          {/* Ollama Connection Card */}
          <div className="rounded-2xl bg-[#121116]/90 border border-white/[0.08] p-5 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className={`w-4 h-4 ${nsfwOn ? 'text-red-400' : 'text-orange-400'}`} />
                <h2 className="text-sm font-bold text-white">Ollama API Connection</h2>
              </div>
              <button
                onClick={handleScanModels}
                disabled={isLoadingModels}
                className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white transition-colors"
                title="Scan connection & models"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingModels ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-white/60 font-medium">Ollama API URL</label>
              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                placeholder="http://localhost:11434"
                className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-orange-500 font-mono transition-colors"
              />
            </div>

            {/* Helpful Note / Command to run Ollama */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2 text-xs">
              <p className="text-white/70 font-medium">To run Ollama with CORS enabled, execute:</p>
              <div className="p-2.5 rounded-lg bg-black/60 border border-white/10 font-mono text-emerald-300 select-all overflow-x-auto whitespace-pre">
{`$env:OLLAMA_ORIGINS="*"
ollama serve`}
              </div>
            </div>

            {connectionMessage && (
              <div className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                connectionStatus === 'error' 
                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/30' 
                  : 'bg-white/[0.03] text-white/70 border-white/[0.06]'
              }`}>
                {connectionStatus === 'error' ? <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />}
                <span className="leading-relaxed">{connectionMessage}</span>
              </div>
            )}
          </div>

          {/* Model Management Card */}
          <div className="rounded-2xl bg-[#121116]/90 border border-white/[0.08] p-5 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className={`w-4 h-4 ${nsfwOn ? 'text-red-400' : 'text-orange-400'}`} />
                <h2 className="text-sm font-bold text-white">Local Vision Model Selector</h2>
              </div>
              <span className="text-[11px] font-mono text-white/40">{models.length} available</span>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs text-white/60 font-medium">Select Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-orange-500 font-mono transition-colors"
                >
                  {models.length === 0 && <option value="">No local models found (run ollama pull llava)</option>}
                  {models.map((m) => (
                    <option key={m.digest} value={m.name}>
                      {m.name} {m.details?.parameter_size ? `(${m.details.parameter_size})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedModel && (
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-white/30'}`} />
                    <span className="text-xs text-white/70 font-medium">
                      {isRunning ? 'Loaded in memory' : 'Idle / Unloaded'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleLoadModel}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Play className="w-3 h-3" />
                      <span>Load</span>
                    </button>
                    <button
                      onClick={handleUnloadModel}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Square className="w-3 h-3" />
                      <span>Unload</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columns 2 & 3: Active Preset UI */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Preset 1: Prompt Extractor & Distributor */}
          {activePreset === 'extractor' && (
            <div 
              onDragOver={handleExtractorDragOver}
              onDragEnter={handleExtractorDragEnter}
              onDragLeave={handleExtractorDragLeave}
              onDrop={handleExtractorDrop}
              className={`rounded-2xl bg-[#121116]/90 border p-6 shadow-xl backdrop-blur-md space-y-5 transition-colors ${
                isExtractorDraggingOver
                  ? nsfwOn
                    ? 'border-red-500/60 shadow-[0_0_25px_rgba(255,34,56,0.25)] ring-1 ring-red-500/30'
                    : 'border-orange-500/60 shadow-[0_0_25px_rgba(255,102,0,0.25)] ring-1 ring-orange-500/30'
                  : 'border-white/[0.08]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className={`w-4 h-4 ${nsfwOn ? 'text-red-400' : 'text-orange-400'}`} />
                  <h2 className="text-sm font-bold text-white">Image Vision Testing & Prompt Extraction</h2>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setThinkingEnabled(!thinkingEnabled)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                      thinkingEnabled 
                        ? (nsfwOn ? 'bg-red-500/20 border-red-500/40 text-red-300' : 'bg-orange-500/20 border-orange-500/40 text-orange-300') 
                        : 'bg-white/5 border-white/10 text-white/50'
                    }`}
                    title="Toggle model reasoning / thinking mode (bypasses thinking via /set nothing when off)"
                  >
                    {thinkingEnabled ? <ToggleRight className={`w-4 h-4 ${nsfwOn ? 'text-red-400' : 'text-orange-400'}`} /> : <ToggleLeft className="w-4 h-4 text-white/40" />}
                    <span>Reasoning / Thinking: {thinkingEnabled ? 'ON' : 'OFF'}</span>
                  </button>

                  <span className="text-xs text-white/50">Model: <strong className="text-white font-mono">{selectedModel || 'None'}</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs text-white/60 font-medium">Test Image Input</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleExtractorDragOver}
                    onDragEnter={handleExtractorDragEnter}
                    onDragLeave={handleExtractorDragLeave}
                    onDrop={handleExtractorDrop}
                    className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all min-h-[200px] ${
                      isExtractorDraggingOver
                        ? nsfwOn
                          ? 'border-red-500 bg-red-500/15 shadow-[0_0_20px_rgba(255,34,56,0.3)]'
                          : 'border-orange-500 bg-orange-500/15 shadow-[0_0_20px_rgba(255,102,0,0.3)]'
                        : testImage 
                        ? 'border-orange-500/50 bg-black/40' 
                        : 'border-white/10 hover:border-white/30 bg-white/[0.02]'
                    }`}
                  >
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="hidden" 
                    />
                    {testImage ? (
                      <div className="relative w-full h-[180px] rounded-xl overflow-hidden flex items-center justify-center">
                        <img src={testImage} alt="Uploaded test" className="max-h-full max-w-full object-contain rounded-lg" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-black/80 text-white border border-white/20">Change Image</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center text-white/50">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-semibold text-white/80">Click to upload image or drag & drop</p>
                          <p className="text-[11px] text-white/40 mt-0.5">Supports PNG, JPG, WEBP</p>
                        </div>
                      </>
                    )}
                  </div>
                  {testImageName && <p className="text-[11px] text-white/50 font-mono truncate">File: {testImageName}</p>}
                </div>

                <div className="space-y-4">
                  {/* Preset Selector for Output Length */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/60 font-medium">Output Length Preset</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSystemPrompt(EXTRACTOR_PRESETS.detailed.systemPrompt);
                          setUserPrompt(EXTRACTOR_PRESETS.detailed.userPrompt);
                        }}
                        className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          systemPrompt === EXTRACTOR_PRESETS.detailed.systemPrompt
                            ? nsfwOn
                              ? 'bg-red-500/20 text-red-300 border-red-500/50 shadow-sm'
                              : 'bg-orange-500/20 text-orange-300 border-orange-500/50 shadow-sm'
                            : 'bg-black/40 text-white/70 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Detailed Output (2–3 Sentences)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSystemPrompt(EXTRACTOR_PRESETS.medium.systemPrompt);
                          setUserPrompt(EXTRACTOR_PRESETS.medium.userPrompt);
                        }}
                        className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          systemPrompt === EXTRACTOR_PRESETS.medium.systemPrompt
                            ? nsfwOn
                              ? 'bg-red-500/20 text-red-300 border-red-500/50 shadow-sm'
                              : 'bg-orange-500/20 text-orange-300 border-orange-500/50 shadow-sm'
                            : 'bg-black/40 text-white/70 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Medium Length Output (1–2 Sentences)</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-white/60 font-medium">System Prompt (Extraction Blueprint)</label>
                      {systemPrompt !== DEFAULT_EXTRACTOR_SYSTEM_PROMPT && (
                        <button
                          type="button"
                          onClick={() => setSystemPrompt(DEFAULT_EXTRACTOR_SYSTEM_PROMPT)}
                          className="text-[10px] text-orange-400 hover:text-orange-300 font-mono transition-colors"
                        >
                          Reset to Default
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={5}
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white/80 font-sans resize-y focus:outline-none focus:border-orange-500/60 leading-relaxed transition-colors"
                      placeholder="Enter system prompt for Ollama vision model extraction..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-white/60 font-medium">User Prompt / Instructions</label>
                      {userPrompt !== DEFAULT_EXTRACTOR_USER_PROMPT && (
                        <button
                          type="button"
                          onClick={() => setUserPrompt(DEFAULT_EXTRACTOR_USER_PROMPT)}
                          className="text-[10px] text-orange-400 hover:text-orange-300 font-mono transition-colors"
                        >
                          Reset to Default
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={2}
                      value={userPrompt}
                      onChange={(e) => setUserPrompt(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white/80 focus:outline-none focus:border-orange-500/60 leading-relaxed resize-y transition-colors"
                      placeholder="Enter user instructions for prompt extraction..."
                    />
                  </div>

                {isGenerating ? (
                  <button
                    onClick={handleStopVisionTest}
                    className="w-full py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_20px_rgba(225,29,72,0.4)] animate-pulse cursor-pointer"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Stop Vision Inference</span>
                  </button>
                ) : (
                  <button
                    onClick={handleRunVisionTest}
                    disabled={!testImage || !selectedModel}
                    className={`w-full py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
                      nsfwOn
                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(255,34,56,0.3)]'
                        : 'bg-orange-500 hover:bg-orange-400 text-black shadow-[0_0_20px_rgba(255,102,0,0.3)]'
                    } disabled:opacity-40 disabled:pointer-events-none`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Run Vision Inference & Stream Extraction</span>
                  </button>
                )}
                </div>
              </div>

              {(rawResponse || parsedData) && (
                <div className="pt-5 border-t border-white/[0.08] space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Live Stream Output & Parsed Output</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <span className="text-[11px] text-white/50 font-medium">Live Streaming Model Output</span>
                        <div 
                          className="p-3.5 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-white/80 max-h-[220px] overflow-y-auto whitespace-pre-wrap leading-relaxed"
                          ref={(el) => {
                            if (el) el.scrollTop = el.scrollHeight;
                          }}
                        >
                          {rawResponse || 'Waiting for stream response...'}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] text-white/50 font-medium">Parsed Structured Categories</span>
                      <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-emerald-300 max-h-[220px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                        {parsedData ? JSON.stringify(parsedData, null, 2) : 'Awaiting valid JSON parsing...'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preset 2: Prompt Refiner */}
          {activePreset === 'refiner' && (
            <div className="rounded-2xl bg-[#121116]/90 border border-white/[0.08] p-6 shadow-xl backdrop-blur-md space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wand2 className={`w-4 h-4 ${nsfwOn ? 'text-red-400' : 'text-orange-400'}`} />
                  <h2 className="text-sm font-bold text-white">Prompt Refinement & Enhancement Console</h2>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setThinkingEnabled(!thinkingEnabled)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                      thinkingEnabled 
                        ? (nsfwOn ? 'bg-red-500/20 border-red-500/40 text-red-300' : 'bg-orange-500/20 border-orange-500/40 text-orange-300') 
                        : 'bg-white/5 border-white/10 text-white/50'
                    }`}
                    title="Toggle model reasoning / thinking mode (bypasses thinking via /set nothing when off)"
                  >
                    {thinkingEnabled ? <ToggleRight className={`w-4 h-4 ${nsfwOn ? 'text-red-400' : 'text-orange-400'}`} /> : <ToggleLeft className="w-4 h-4 text-white/40" />}
                    <span>Reasoning / Thinking: {thinkingEnabled ? 'ON' : 'OFF'}</span>
                  </button>

                  <span className="text-xs text-white/50">Model: <strong className="text-white font-mono">{selectedModel || 'None'}</strong></span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-white/60 font-medium">System Prompt (Refinement Instructions)</label>
                    {refinerSystemPrompt !== 'You are an expert AI prompt refiner. Take the provided prompt and enhance it to be richer, more descriptive, cinematic, detailed, and optimized for high-end AI generation. Maintain the core essence while significantly elevating quality and descriptive depth.' && (
                      <button
                        type="button"
                        onClick={() => setRefinerSystemPrompt('You are an expert AI prompt refiner. Take the provided prompt and enhance it to be richer, more descriptive, cinematic, detailed, and optimized for high-end AI generation. Maintain the core essence while significantly elevating quality and descriptive depth.')}
                        className="text-[10px] text-orange-400 hover:text-orange-300 font-mono transition-colors"
                      >
                        Reset to Default
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={refinerSystemPrompt}
                    onChange={(e) => setRefinerSystemPrompt(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white/80 font-sans resize-y focus:outline-none focus:border-orange-500/60 leading-relaxed transition-colors"
                    placeholder="Enter prompt refinement system instructions..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-white/60 font-medium">Imported Prompt (from Prompt Inspection)</label>
                  <textarea
                    rows={3}
                    value={refinerImportedPrompt}
                    onChange={(e) => setRefinerImportedPrompt(e.target.value)}
                    placeholder="Imported prompt will appear here or can be typed..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs font-mono text-white/90 focus:outline-none focus:border-orange-500 resize-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-white/60 font-medium">User Instructions / Refinement Directive</label>
                    {refinerUserPrompt !== 'Refine and enhance this prompt for maximum aesthetic impact.' && (
                      <button
                        type="button"
                        onClick={() => setRefinerUserPrompt('Refine and enhance this prompt for maximum aesthetic impact.')}
                        className="text-[10px] text-orange-400 hover:text-orange-300 font-mono transition-colors"
                      >
                        Reset to Default
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={refinerUserPrompt}
                    onChange={(e) => setRefinerUserPrompt(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white/80 focus:outline-none focus:border-orange-500/60 transition-colors"
                    placeholder="Enter user refinement directive..."
                  />
                </div>

                {refinerIsGenerating ? (
                  <button
                    onClick={handleStopRefiner}
                    className="w-full py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_20px_rgba(225,29,72,0.4)] animate-pulse cursor-pointer"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Stop Prompt Refinement</span>
                  </button>
                ) : (
                  <button
                    onClick={handleRunRefiner}
                    disabled={!refinerImportedPrompt.trim() || !selectedModel}
                    className={`w-full py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
                      nsfwOn
                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(255,34,56,0.3)]'
                        : 'bg-orange-500 hover:bg-orange-400 text-black shadow-[0_0_20px_rgba(255,102,0,0.3)]'
                    } disabled:opacity-40 disabled:pointer-events-none`}
                  >
                    <Wand2 className="w-4 h-4" />
                    <span>Run Prompt Refinement & Stream</span>
                  </button>
                )}
              </div>

              {(refinerRawResponse || refinerIsGenerating) && (
                <div className="pt-5 border-t border-white/[0.08] space-y-3 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Live Response Viewer (Refined Output)</h3>
                    </div>

                    <button
                      onClick={handleCopyRefined}
                      disabled={!refinerRawResponse}
                      className={`px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all ${
                        refinerIsCopied
                          ? 'bg-emerald-500 text-black'
                          : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                      }`}
                    >
                      {refinerIsCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{refinerIsCopied ? 'Copied Refined Prompt!' : 'Copy Refined Prompt'}</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-black/70 border border-white/10 text-xs font-mono text-white/90 max-h-[300px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {refinerRawResponse || 'Awaiting live stream response...'}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preset 3: Chat with AI */}
          {activePreset === 'chat' && (
            <div 
              onDragOver={handleChatDragOver}
              onDragEnter={handleChatDragEnter}
              onDragLeave={handleChatDragLeave}
              onDrop={handleChatDrop}
              className={`rounded-2xl bg-[#121116]/90 border p-6 shadow-xl backdrop-blur-md flex flex-col h-[650px] relative transition-colors ${
                isChatDraggingOver 
                  ? nsfwOn 
                    ? 'border-red-500/60 shadow-[0_0_25px_rgba(255,34,56,0.25)] ring-1 ring-red-500/30' 
                    : 'border-orange-500/60 shadow-[0_0_25px_rgba(255,102,0,0.25)] ring-1 ring-orange-500/30' 
                  : 'border-white/[0.08]'
              }`}
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <MessageSquare className={`w-4 h-4 ${nsfwOn ? 'text-red-400' : 'text-orange-400'}`} />
                  <h2 className="text-sm font-bold text-white">Chat with AI (Multi-Image & Live Stream)</h2>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setThinkingEnabled(!thinkingEnabled)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                      thinkingEnabled 
                        ? (nsfwOn ? 'bg-red-500/20 border-red-500/40 text-red-300' : 'bg-orange-500/20 border-orange-500/40 text-orange-300') 
                        : 'bg-white/5 border-white/10 text-white/50'
                    }`}
                    title="Toggle model reasoning / thinking mode (bypasses thinking via /set nothing when off)"
                  >
                    {thinkingEnabled ? <ToggleRight className={`w-4 h-4 ${nsfwOn ? 'text-red-400' : 'text-orange-400'}`} /> : <ToggleLeft className="w-4 h-4 text-white/40" />}
                    <span>Reasoning / Thinking: {thinkingEnabled ? 'ON' : 'OFF'}</span>
                  </button>

                  <span className="text-xs text-white/50">Model: <strong className="text-white font-mono">{selectedModel || 'None'}</strong></span>
                </div>
              </div>

              <div 
                ref={chatContainerRef}
                onDragOver={handleChatDragOver}
                onDragEnter={handleChatDragEnter}
                onDragLeave={handleChatDragLeave}
                onDrop={handleChatDrop}
                className="flex-1 overflow-y-auto py-4 space-y-4 pr-2"
              >
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-white/40 p-6">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
                    <p className="text-xs font-medium">No messages yet. Start a conversation with the loaded Ollama model.</p>
                    <p className="text-[11px] text-white/30 mt-1">You can attach multiple images and chat freely.</p>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-[10px] font-mono text-white/40 uppercase">{msg.role}</span>
                      </div>

                      <div className={`max-w-[85%] rounded-2xl p-4 text-xs font-sans leading-relaxed space-y-3 ${
                        msg.role === 'user'
                          ? nsfwOn ? 'bg-red-600/30 border border-red-500/40 text-white' : 'bg-orange-500/30 border border-orange-500/40 text-white'
                          : 'bg-black/60 border border-white/10 text-white/90 font-mono'
                      }`}>
                        {msg.images && msg.images.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {msg.images.map((img, i) => (
                              <img key={i} src={`data:image/jpeg;base64,${img}`} alt="Attached" className="w-16 h-16 object-cover rounded-lg border border-white/20" />
                            ))}
                          </div>
                        )}
                        <p className="whitespace-pre-wrap">
                          {msg.content || (chatIsGenerating && idx === chatMessages.length - 1 ? (
                            <span className="flex items-center gap-1.5 text-white/50 italic">
                              <span className="inline-block w-2 h-2 rounded-full bg-orange-400 animate-ping" />
                              {!thinkingEnabled ? 'Generating direct reply...' : 'Thinking & streaming response...'}
                            </span>
                          ) : '')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {chatImages.length > 0 && (
                <div className="flex items-center gap-2 py-2 border-t border-white/[0.06] overflow-x-auto">
                  <span className="text-[11px] text-white/50 shrink-0">Attached ({chatImages.length}):</span>
                  {chatImages.map((img, i) => (
                    <div key={i} className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/20 shrink-0">
                      <img src={`data:image/jpeg;base64,${img}`} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setChatImages(chatImages.filter((_, idx) => idx !== i))}
                        className="absolute top-0.5 right-0.5 bg-black/80 text-white p-0.5 rounded-full text-[10px]"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form 
                onSubmit={(e) => {
                  if (chatIsGenerating) {
                    e.preventDefault();
                    handleStopChatMessage();
                  } else {
                    handleSendChatMessage(e);
                  }
                }} 
                className="pt-3 border-t border-white/[0.08] flex items-center gap-2"
              >
                <input
                  type="file"
                  ref={chatFileInputRef}
                  accept="image/*"
                  multiple
                  onChange={handleChatImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => chatFileInputRef.current?.click()}
                  className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/[0.08] transition-colors shrink-0"
                  title="Attach images"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={chatIsGenerating ? 'AI is replying... Click the stop icon to halt generation' : 'Type your message or prompt...'}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
                {chatIsGenerating ? (
                  <button
                    type="button"
                    onClick={handleStopChatMessage}
                    className="p-2.5 rounded-xl font-semibold text-xs flex items-center justify-center bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/40 transition-all cursor-pointer animate-pulse"
                    title="Stop AI response"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={(!chatInput.trim() && chatImages.length === 0) || !selectedModel}
                    className={`p-2.5 rounded-xl font-semibold text-xs flex items-center justify-center transition-all ${
                      nsfwOn ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-orange-500 hover:bg-orange-400 text-black'
                    } disabled:opacity-40 disabled:pointer-events-none`}
                    title="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
