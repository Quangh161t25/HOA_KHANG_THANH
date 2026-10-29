import { useEffect, useRef, useState } from 'react';
import {
  Bot,
  Camera,
  Check,
  Cloud,
  Cpu,
  Eye,
  EyeOff,
  FileImage,
  Flower2,
  Loader2,
  Maximize2,
  Minimize2,
  Move,
  Plus,
  RefreshCw,
  RotateCcw,
  Settings2,
  Sparkles,
  Trash2,
  Upload,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { useFlowerStore } from '@/stores/hoaKhangThanhStore';
import type { SupplierOrderItem } from '@/types/hoaKhangThanh';
import { convertToSupplierOrderItems, parseFlowerTextToItems, type ParsedFlowerItem } from './imageParser';
import { preprocessInvoiceImage } from './imagePreprocess';
import {
  AI_PROVIDER_DEFAULTS,
  draftsToEditableText,
  draftsToParsedItems,
  loadAiOcrConfig,
  readInvoiceWithAI,
  saveAiOcrConfig,
  type AiOcrConfig,
  type AiProvider,
} from './aiVisionOcr';
import {
  OCR_SPACE_KEY_URL,
  OCR_SPACE_TEST_KEY,
  loadOcrSpaceKey,
  readInvoiceWithOcrSpace,
  saveOcrSpaceKey,
} from './ocrSpace';
import {
  OCR4AI_DEFAULT_BASE_URL,
  OCR4AI_DEFAULT_MODEL,
  OCR4AI_DOCS_URL,
  OCR4AI_REGISTER_URL,
  loadOcr4AiConfig,
  readInvoiceWithOcr4Ai,
  saveOcr4AiConfig,
  type Ocr4AiConfig,
} from './ocr4ai';

/** Engine đọc ảnh: Ocr4AI (laychu.com) / Cloud (OCR.space) / AI Gemini / Tesseract offline */
type OcrEngine = 'ocr4ai' | 'cloud' | 'gemini' | 'tesseract';

const ENGINE_STORAGE_KEY = 'hkt_ocr_engine';

function loadOcrEngine(): OcrEngine {
  try {
    const saved = localStorage.getItem(ENGINE_STORAGE_KEY);
    if (saved === 'ocr4ai' || saved === 'cloud' || saved === 'gemini' || saved === 'tesseract') return saved;
  } catch {
    /* bỏ qua */
  }
  return 'ocr4ai';
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApplyItems: (items: SupplierOrderItem[]) => void;
}

// Hóa đơn mẫu đúng định dạng hóa đơn bán hàng của nhà vườn (ảnh chụp/Zalo)
const SAMPLE_RECEIPT_TEXT = `HOA TƯƠI HIỆP LĨNH
Địa chỉ: số 126 Nguyễn Tử Lực, Tp Đà Lạt
Điện thoại: 079 2485 708

HÓA ĐƠN BÁN HÀNG
Ngày 25/10/2026
17:56
Số
HĐ: HD063937
Khách hàng: a hậu
Liên hệ:

STT Tên hàng và quy cách ĐVT SL Đơn giá Thành toán
1 thảo tím kg 4 38,000 152,000
2 thảo trắng kg 1 36,000 36,000
3 hoàng anh kg 4 48,000 192,000
Tổng cộng: 380,000
Công nợ cũ 26,509,000
Khách thanh toán 0
Công nợ còn lại 26,889,000
Bằng chữ: Hai mươi sáu triệu tám trăm tám mươi chín nghìn đồng chẵn`;

export function ImageOrderReaderModal({ isOpen, onClose, onApplyItems }: Props) {
  const { flowers } = useFlowerStore();

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [rawText, setRawText] = useState<string>('');
  const [parsedItems, setParsedItems] = useState<ParsedFlowerItem[]>([]);
  const [showRawText, setShowRawText] = useState(false);

  // Cấu hình AI vision (lưu trên máy người dùng)
  const [aiConfig, setAiConfig] = useState<AiOcrConfig | null>(() => loadAiOcrConfig());
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [aiDraft, setAiDraft] = useState<AiOcrConfig>(() => {
    const saved = loadAiOcrConfig();
    const provider: AiProvider = saved?.provider || 'gemini';
    return {
      provider,
      apiKey: saved?.apiKey || '',
      model: saved?.model || AI_PROVIDER_DEFAULTS[provider].model,
      baseUrl: saved?.baseUrl || AI_PROVIDER_DEFAULTS[provider].baseUrl,
    };
  });
  const [showApiKey, setShowApiKey] = useState(false);

  // Cấu hình Ocr4AI (https://ocr.laychu.com/api-docs#models)
  const [ocr4aiConfig, setOcr4aiConfig] = useState<Ocr4AiConfig | null>(() => loadOcr4AiConfig());
  const [ocr4aiDraft, setOcr4aiDraft] = useState<Ocr4AiConfig>(() => {
    const saved = loadOcr4AiConfig();
    return {
      apiKey: saved?.apiKey || '',
      baseUrl: saved?.baseUrl || OCR4AI_DEFAULT_BASE_URL,
      model: saved?.model || OCR4AI_DEFAULT_MODEL,
      ocrFormat: saved?.ocrFormat || 'markdown',
    };
  });
  const [showOcr4aiKey, setShowOcr4aiKey] = useState(false);

  // Engine đọc ảnh + key OCR.space (OCR Cloud)
  const [engine, setEngineState] = useState<OcrEngine>(() => loadOcrEngine());
  const [cloudKey, setCloudKey] = useState<string>(() => loadOcrSpaceKey());
  const [cloudKeyDraft, setCloudKeyDraft] = useState<string>(() => loadOcrSpaceKey());
  const [showCloudKey, setShowCloudKey] = useState(false);

  // Kích thước Drawer căn phải: 'lg' (76rem), 'xl' (88rem), 'full' (Toàn màn hình)
  const [drawerSize, setDrawerSize] = useState<'lg' | 'xl' | 'full'>('xl');

  // Trạng thái thu phóng & di chuyển ảnh (Zoom & Pan)
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreenImage, setIsFullscreenImage] = useState<boolean>(false);
  const imageContainerRef = useRef<HTMLDivElement | null>(null);

  const handleZoomChange = (delta: number) => {
    setZoom((prev) => {
      const next = Math.min(4, Math.max(0.5, Math.round((prev + delta) * 100) / 100));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    handleZoomChange(delta);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const setEngine = (next: OcrEngine) => {
    setEngineState(next);
    try {
      localStorage.setItem(ENGINE_STORAGE_KEY, next);
    } catch {
      /* bỏ qua */
    }
  };

  const cloudKeyInUse = cloudKey || OCR_SPACE_TEST_KEY;

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Lắng nghe phím dán ảnh Ctrl+V từ clipboard
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const result = event.target?.result as string;
              setImageSrc(result);
              setZoom(1);
              setPan({ x: 0, y: 0 });
              toast.success('Đã dán ảnh từ clipboard (Ctrl+V) thành công!');
            };
            reader.readAsDataURL(blob);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  const applyParsedText = (text: string) => {
    const parsed = parseFlowerTextToItems(text, flowers);
    setRawText(text);
    setParsedItems(parsed);
    return parsed;
  };

  // Chọn ảnh từ máy tính
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file hình ảnh hợp lệ (.jpg, .png, .jpeg)');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string);
        setZoom(1);
        setPan({ x: 0, y: 0 });
        toast.success(`Đã tải ảnh ${file.name}`);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Nạp dữ liệu mẫu thử nghiệm 1 chạm
  const handleLoadSample = () => {
    setImageSrc('https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=60');
    setZoom(1);
    setPan({ x: 0, y: 0 });
    const parsed = applyParsedText(SAMPLE_RECEIPT_TEXT);
    toast.success(`Đã nạp hóa đơn mẫu: ${parsed.length} mặt hàng`);
  };

  // Đọc ảnh bằng Ocr4AI (https://ocr.laychu.com/api-docs#models)
  const runOcr4Ai = async (): Promise<boolean> => {
    if (!imageSrc) return false;
    if (!ocr4aiConfig?.apiKey) {
      setIsAiSettingsOpen(true);
      toast.error('Chưa có API key Ocr4AI. Nhập key từ ocr.laychu.com để tiếp tục.');
      return false;
    }

    setProgressStatus('Đang gửi ảnh tới Ocr4AI (ocr.laychu.com)...');
    setProgressPercent(30);

    try {
      const result = await readInvoiceWithOcr4Ai(imageSrc, ocr4aiConfig);
      setProgressPercent(85);

      const extractedText = result.markdown || result.text;
      const parsed = parseFlowerTextToItems(extractedText, flowers);

      setRawText(extractedText);
      setParsedItems(parsed);

      if (parsed.length === 0) {
        toast.info('Ocr4AI đã đọc chữ nhưng chưa khớp dòng hàng nào. Đang thử Tesseract...');
        return false;
      }

      setProgressPercent(100);
      const timeStr = result.elapsedMs ? ` (${result.elapsedMs}ms)` : '';
      toast.success(`Ocr4AI đọc được ${parsed.length} mặt hàng hoa và số lượng${timeStr}!`);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi không xác định';
      console.warn('Ocr4AI error:', err);
      toast.error(`Ocr4AI: ${message} Đang chuyển sang Tesseract...`);
      return false;
    }
  };

  // Đọc ảnh bằng OCR Cloud (OCR.space) — trả về false nếu không dùng được
  const runCloudOcr = async (): Promise<boolean> => {
    if (!imageSrc) return false;

    setProgressStatus('Đang gửi ảnh tới OCR.space (OCR Cloud)...');
    setProgressPercent(30);

    try {
      const result = await readInvoiceWithOcrSpace(imageSrc, cloudKeyInUse);
      setProgressPercent(85);

      const extractedText = result.text;
      const parsed = parseFlowerTextToItems(extractedText, flowers);

      setRawText(extractedText);
      setParsedItems(parsed);

      if (parsed.length === 0) {
        toast.info('OCR Cloud đọc được chữ nhưng chưa khớp dòng hàng nào. Đang thử Tesseract...');
        return false;
      }

      setProgressPercent(100);
      toast.success(
        `OCR Cloud đọc được ${parsed.length} mặt hàng${result.partial ? ' (ảnh hơi mờ, nên kiểm tra lại)' : ''}!`,
      );
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi không xác định';
      console.warn('OCR.space error:', err);
      toast.error(`${message} Đang chuyển sang Tesseract...`);
      return false;
    }
  };

  // Đọc ảnh bằng AI vision (Gemini / OpenAI...) — trả về false nếu không dùng được
  const runAiOcr = async (): Promise<boolean> => {
    if (!aiConfig?.apiKey || !imageSrc) return false;

    setProgressStatus(`AI (${AI_PROVIDER_DEFAULTS[aiConfig.provider].label}) đang đọc hóa đơn...`);
    setProgressPercent(35);

    try {
      const drafts = await readInvoiceWithAI(imageSrc, aiConfig);
      if (drafts.length === 0) {
        toast.info('AI chưa thấy dòng hàng nào trong ảnh, chuyển sang OCR offline...');
        return false;
      }

      setRawText(draftsToEditableText(drafts));
      setParsedItems(draftsToParsedItems(drafts, flowers));
      setProgressPercent(100);
      toast.success(`AI đọc được ${drafts.length} mặt hàng và số lượng!`);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi không xác định';
      console.warn('AI vision OCR error:', err);
      toast.error(`AI đọc ảnh lỗi: ${message} Đang chuyển sang OCR offline...`);
      return false;
    }
  };

  // OCR offline bằng Tesseract (không cần mạng)
  const runOfflineOcr = async (): Promise<void> => {
    if (!imageSrc) return;
    setProgressStatus('Đang làm nét ảnh hóa đơn...');
    setProgressPercent(8);

    try {
      // Làm nét ảnh: cắt viền trắng, phóng to, xoá đường kẻ bảng
      let ocrSource = imageSrc;
      try {
        ocrSource = await preprocessInvoiceImage(imageSrc);
      } catch (preErr) {
        console.warn('Không tiền xử lý được ảnh, dùng ảnh gốc:', preErr);
      }

      setProgressPercent(20);
      setProgressStatus('Đang khởi tạo bộ máy nhận diện OCR...');

      // Import động tesseract.js để không ảnh hưởng tải trang ban đầu
      const { createWorker } = await import('tesseract.js');

      setProgressStatus('Đang nạp từ điển tiếng Việt & tiếng Anh...');
      setProgressPercent(25);

      const worker = await createWorker('vie+eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const p = Math.round((m.progress || 0) * 100);
            setProgressPercent(30 + Math.round(p * 0.65));
            setProgressStatus(`Đang đọc văn bản trên hóa đơn... ${p}%`);
          }
        },
      });

      // Giữ khoảng trắng giữa các cột để tách tên hàng / ĐVT / SL chuẩn hơn
      await worker.setParameters({ preserve_interword_spaces: '1' });

      setProgressStatus('Đang quét từng dòng chữ trên ảnh...');
      const ret = await worker.recognize(ocrSource);

      let extractedText = ret.data.text || '';
      let parsed = extractedText.trim() ? parseFlowerTextToItems(extractedText, flowers) : [];

      // Ảnh đã làm nét không đọc được gì => thử lại trên ảnh gốc
      if (parsed.length === 0 && ocrSource !== imageSrc) {
        setProgressStatus('Chưa đọc được mặt hàng nào, đang thử lại trên ảnh gốc...');
        const retry = await worker.recognize(imageSrc);
        const retryText = retry.data.text || '';
        const retryParsed = retryText.trim() ? parseFlowerTextToItems(retryText, flowers) : [];
        if (retryParsed.length > parsed.length) {
          extractedText = retryText;
          parsed = retryParsed;
        }
      }

      await worker.terminate();
      setProgressPercent(100);

      if (!extractedText.trim()) {
        toast.warning('Ảnh mờ hoặc không nhận diện được chữ rõ ràng. Bạn có thể tự gõ văn bản vào ô bên dưới.');
        setRawText('');
        setParsedItems([]);
      } else {
        setRawText(extractedText);
        setParsedItems(parsed);
        if (parsed.length > 0) {
          toast.success(`Nhận diện thành công ${parsed.length} mặt hàng và số lượng!`);
        } else {
          toast.info('Đã đọc được chữ nhưng chưa khớp mặt hàng. Bạn có thể kiểm tra ô văn bản bên dưới.');
        }
      }
    } catch (err) {
      console.error('OCR Error:', err);
      // Không tự điền dữ liệu mẫu khi OCR lỗi để tránh đưa nhầm hàng vào đơn
      toast.error('Không tải được bộ nhận diện OCR. Kiểm tra kết nối mạng rồi thử lại, hoặc dán văn bản hóa đơn vào ô bên dưới.');
    }
  };

  // Chạy nhận diện ảnh theo engine đang chọn; lỗi thì quay về OCR offline
  const handleRunOCR = async () => {
    if (!imageSrc) {
      toast.error('Vui lòng tải ảnh lên trước khi đọc!');
      return;
    }

    if (engine === 'ocr4ai' && !ocr4aiConfig?.apiKey) {
      setIsAiSettingsOpen(true);
      toast.error('Chưa có API key Ocr4AI. Nhập key từ ocr.laychu.com hoặc chọn engine khác.');
      return;
    }

    if (engine === 'gemini' && !aiConfig?.apiKey) {
      setIsAiSettingsOpen(true);
      toast.error('Chưa có API key AI. Nhập key Gemini/OpenAI hoặc chọn Tesseract.');
      return;
    }

    setIsProcessing(true);
    try {
      if (engine === 'ocr4ai') {
        const handled = await runOcr4Ai();
        if (!handled) await runOfflineOcr();
      } else if (engine === 'cloud') {
        const handled = await runCloudOcr();
        if (!handled) await runOfflineOcr();
      } else if (engine === 'gemini') {
        const handled = await runAiOcr();
        if (!handled) await runOfflineOcr();
      } else {
        await runOfflineOcr();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Lưu / xoá API key Ocr4AI (https://ocr.laychu.com/api-docs#models)
  const handleSaveOcr4aiConfig = () => {
    const key = ocr4aiDraft.apiKey.trim();
    if (!key) {
      toast.error('Vui lòng nhập API key Ocr4AI (từ trang ocr.laychu.com).');
      return;
    }
    const config: Ocr4AiConfig = {
      apiKey: key,
      baseUrl: (ocr4aiDraft.baseUrl || OCR4AI_DEFAULT_BASE_URL).trim(),
      model: (ocr4aiDraft.model || OCR4AI_DEFAULT_MODEL).trim(),
      ocrFormat: ocr4aiDraft.ocrFormat === 'text' ? 'text' : 'markdown',
    };
    saveOcr4AiConfig(config);
    setOcr4aiConfig(config);
    setEngine('ocr4ai');
    setIsAiSettingsOpen(false);
    toast.success('Đã lưu API key Ocr4AI! Đã chuyển sang chế độ đọc bằng Ocr4AI.');
  };

  const handleClearOcr4aiConfig = () => {
    saveOcr4AiConfig(null);
    setOcr4aiConfig(null);
    setOcr4aiDraft({
      apiKey: '',
      baseUrl: OCR4AI_DEFAULT_BASE_URL,
      model: OCR4AI_DEFAULT_MODEL,
      ocrFormat: 'markdown',
    });
    toast.info('Đã xóa cấu hình Ocr4AI.');
  };

  // Lưu cấu hình AI
  const handleSaveAiConfig = () => {
    const provider = aiDraft.provider;
    const defaults = AI_PROVIDER_DEFAULTS[provider];
    const config: AiOcrConfig = {
      provider,
      apiKey: aiDraft.apiKey.trim(),
      model: aiDraft.model.trim() || defaults.model,
      baseUrl: (aiDraft.baseUrl || defaults.baseUrl).trim().replace(/\/+$/, ''),
    };

    if (!config.apiKey) {
      toast.error('Vui lòng nhập API key của nhà cung cấp AI.');
      return;
    }

    saveAiOcrConfig(config);
    setAiConfig(config);
    setAiDraft(config);
    setIsAiSettingsOpen(false);
    setEngine('gemini');
    toast.success(`Đã lưu cấu hình ${defaults.label}. Ảnh sẽ được đọc bằng AI.`);
  };

  const handleClearAiConfig = () => {
    saveAiOcrConfig(null);
    setAiConfig(null);
    const provider: AiProvider = 'gemini';
    setAiDraft({
      provider,
      apiKey: '',
      model: AI_PROVIDER_DEFAULTS[provider].model,
      baseUrl: AI_PROVIDER_DEFAULTS[provider].baseUrl,
    });
    toast.success('Đã xoá API key. Chuyển về OCR offline (Tesseract).');
  };

  const handleChangeAiProvider = (provider: AiProvider) => {
    const defaults = AI_PROVIDER_DEFAULTS[provider];
    setAiDraft((prev) => ({ ...prev, provider, model: defaults.model, baseUrl: defaults.baseUrl }));
  };

  // Lưu / xoá API key OCR.space cho engine OCR Cloud
  const handleSaveCloudKey = () => {
    const key = cloudKeyDraft.trim();
    if (!key) {
      toast.error('Vui lòng nhập API key OCR.space (hoặc bấm "Dùng key test").');
      return;
    }
    saveOcrSpaceKey(key);
    setCloudKey(key);
    setEngine('cloud');
    toast.success('Đã lưu API key OCR.space. Ảnh sẽ được đọc bằng OCR Cloud.');
  };

  const handleUseTestCloudKey = () => {
    saveOcrSpaceKey(null);
    setCloudKey('');
    setCloudKeyDraft('');
    setEngine('cloud');
    toast.info('Đang dùng key dùng thử của OCR.space (giới hạn lượt gọi).');
  };

  const handleUpdateItemQuantity = (id: string, qty: number) => {
    setParsedItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, qty) } : item)));
  };

  // Đổi loại hoa khớp danh mục
  const handleSelectFlower = (id: string, flowerId: string) => {
    const f = flowers.find((fl) => fl.id === flowerId);
    if (!f) return;
    setParsedItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              matchedFlowerId: f.id,
              flowerName: f.name,
              flowerCode: f.code,
              customName: f.customName || '',
              costPrice: f.costPrice,
              unit: f.unit,
            }
          : item,
      ),
    );
  };

  const handleDeleteItem = (id: string) => {
    setParsedItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleAddRow = () => {
    const defaultFlower = flowers[0];
    setParsedItems((prev) => [
      ...prev,
      {
        id: `manual-${Date.now()}`,
        flowerName: defaultFlower?.name || 'Hoa mới',
        flowerCode: defaultFlower?.code || 'HOA-MOI',
        customName: defaultFlower?.customName || '',
        matchedFlowerId: defaultFlower?.id,
        quantity: 1,
        costPrice: defaultFlower?.costPrice || 0,
        unit: defaultFlower?.unit || 'Cành',
        confidence: 'high',
      },
    ]);
  };

  const handleConfirmAndApply = () => {
    if (parsedItems.length === 0) {
      toast.error('Chưa có mặt hàng hoa nào được nhận diện để đưa vào đơn!');
      return;
    }
    const orderItems = convertToSupplierOrderItems(parsedItems);
    onApplyItems(orderItems);
    toast.success(`Đã tự động điền ${orderItems.length} mặt hàng hoa và số lượng vào đơn hàng NCC!`);
    onClose();
  };

  const engineLabel =
    engine === 'ocr4ai'
      ? 'Ocr4AI (laychu.com)'
      : engine === 'cloud'
        ? 'OCR Cloud'
        : engine === 'gemini'
          ? `AI: ${AI_PROVIDER_DEFAULTS[aiConfig?.provider || 'gemini'].label}`
          : 'Tesseract offline';

  const engineIcon =
    engine === 'ocr4ai' ? (
      <Sparkles size={11} className="text-amber-500" />
    ) : engine === 'cloud' ? (
      <Cloud size={11} />
    ) : engine === 'gemini' ? (
      <Bot size={11} />
    ) : (
      <Cpu size={11} />
    );

  const engineConfigured =
    engine === 'ocr4ai'
      ? Boolean(ocr4aiConfig?.apiKey)
      : engine === 'cloud'
        ? true
        : engine === 'gemini'
          ? Boolean(aiConfig?.apiKey)
          : true;

  const drawerWidthClass =
    drawerSize === 'full'
      ? 'w-full max-w-[100vw]'
      : drawerSize === 'xl'
        ? 'w-full sm:w-[94vw] lg:w-[90rem] max-w-[96vw]'
        : 'w-full sm:w-[90vw] lg:w-[76rem] max-w-[94vw]';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`bg-card ${drawerWidthClass} h-full border-l border-border shadow-2xl flex flex-col overflow-hidden text-xs transition-all duration-200 animate-in slide-in-from-right`}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Camera size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>Đọc ảnh ra đơn hàng NCC</span>
                <button
                  type="button"
                  onClick={() => setIsAiSettingsOpen((v) => !v)}
                  title="Cấu hình engine đọc ảnh & API key"
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 transition-colors ${
                    engineConfigured
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                  }`}
                >
                  {engineIcon}
                  {engineLabel}
                </button>
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Chụp hoặc dán ảnh hóa đơn / phiếu Zalo nhà vườn → tự bóc tách tên hoa và số lượng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Chuyển đổi độ rộng drawer */}
            <div className="hidden sm:flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-lg border border-border/60">
              <button
                type="button"
                onClick={() => setDrawerSize('lg')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                  drawerSize === 'lg'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Kích thước Vừa (76rem)"
              >
                Vừa (76rem)
              </button>
              <button
                type="button"
                onClick={() => setDrawerSize('xl')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                  drawerSize === 'xl'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Kích thước Rộng (90rem) - Nhìn ảnh và bảng đối soát rõ nhất"
              >
                Rộng (90rem)
              </button>
              <button
                type="button"
                onClick={() => setDrawerSize((prev) => (prev === 'full' ? 'xl' : 'full'))}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors flex items-center gap-1 ${
                  drawerSize === 'full'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Kích thước Toàn màn hình"
              >
                {drawerSize === 'full' ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
                <span>{drawerSize === 'full' ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Đóng cửa sổ"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
          {/* Cấu hình API AI Vision */}
          {isAiSettingsOpen && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-3 animate-in fade-in">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-foreground flex items-center gap-1.5">
                    <Settings2 size={14} className="text-primary" /> Cấu hình engine đọc ảnh
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Key chỉ lưu trong trình duyệt của máy này và chỉ gửi tới nhà cung cấp bạn chọn.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAiSettingsOpen(false)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Ocr4AI (https://ocr.laychu.com/api-docs#models) */}
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500" />
                    <p className="font-bold text-foreground">Ocr4AI (ocr.laychu.com)</p>
                    <span
                      className={`px-1.5 py-px rounded text-[9px] font-bold border ${
                        ocr4aiConfig?.apiKey
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {ocr4aiConfig?.apiKey ? 'Đã kích hoạt' : 'Chuyên hóa đơn tiếng Việt · Siêu tốc'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <a
                      href={OCR4AI_DOCS_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      Tài liệu API ↗
                    </a>
                    <a
                      href={OCR4AI_REGISTER_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      Lấy API key ↗
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      API Key (từ tài khoản Ocr4AI)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type={showOcr4aiKey ? 'text' : 'password'}
                        value={ocr4aiDraft.apiKey}
                        onChange={(e) => setOcr4aiDraft((prev) => ({ ...prev, apiKey: e.target.value }))}
                        placeholder="Nhập API key từ ocr.laychu.com..."
                        autoComplete="off"
                        className="flex-1 h-8 px-2 rounded-lg border border-border bg-background text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOcr4aiKey((v) => !v)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title={showOcr4aiKey ? 'Ẩn key' : 'Hiện key'}
                      >
                        {showOcr4aiKey ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      Định dạng OCR
                    </span>
                    <select
                      value={ocr4aiDraft.ocrFormat}
                      onChange={(e) =>
                        setOcr4aiDraft((prev) => ({
                          ...prev,
                          ocrFormat: e.target.value as 'markdown' | 'text',
                        }))
                      }
                      className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary"
                    >
                      <option value="markdown">Bảng Markdown (khuyên dùng)</option>
                      <option value="text">Văn bản thuần (Text)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Model</span>
                    <input
                      value={ocr4aiDraft.model}
                      onChange={(e) => setOcr4aiDraft((prev) => ({ ...prev, model: e.target.value }))}
                      placeholder={OCR4AI_DEFAULT_MODEL}
                      className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      Base URL
                    </span>
                    <input
                      value={ocr4aiDraft.baseUrl}
                      onChange={(e) => setOcr4aiDraft((prev) => ({ ...prev, baseUrl: e.target.value }))}
                      placeholder={OCR4AI_DEFAULT_BASE_URL}
                      className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40">
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Xử lý ảnh siêu tốc 300–600ms, tự dựng bảng Markdown và bóc tách cột hàng hóa tiếng Việt.
                  </p>
                  <div className="flex items-center gap-2">
                    {ocr4aiConfig?.apiKey && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleClearOcr4aiConfig}
                        className="h-7 text-[11px]"
                      >
                        Xoá key
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={handleSaveOcr4aiConfig}
                      className="h-7 text-[11px] gap-1 bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      <Check size={12} className="stroke-[3px]" /> Lưu key Ocr4AI
                    </Button>
                  </div>
                </div>
              </div>

              {/* OCR Cloud (OCR.space) */}
              <div className="rounded-lg border border-border bg-background/70 p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold text-foreground flex items-center gap-1.5">
                    <Zap size={13} className="text-amber-500" /> OCR Cloud (OCR.space)
                    <span
                      className={`px-1.5 py-px rounded text-[9px] font-bold border ${
                        cloudKey
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-muted text-muted-foreground border-border'
                      }`}
                    >
                      {cloudKey ? 'Key riêng' : 'Key dùng thử'}
                    </span>
                  </p>
                  <a
                    href={OCR_SPACE_KEY_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-primary hover:underline"
                  >
                    Lấy key miễn phí ↗
                  </a>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-1">
                    <input
                      type={showCloudKey ? 'text' : 'password'}
                      value={cloudKeyDraft}
                      onChange={(e) => setCloudKeyDraft(e.target.value)}
                      placeholder="API key OCR.space..."
                      autoComplete="off"
                      className="flex-1 h-8 px-2 rounded-lg border border-border bg-background text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCloudKey((v) => !v)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title={showCloudKey ? 'Ẩn key' : 'Hiện key'}
                    >
                      {showCloudKey ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleUseTestCloudKey}
                      className="h-8 text-[11px] flex-1 sm:flex-none"
                    >
                      Dùng key test
                    </Button>
                    <Button size="sm" onClick={handleSaveCloudKey} className="h-8 text-[11px] gap-1 flex-1 sm:flex-none">
                      <Check size={12} className="stroke-[3px]" /> Lưu key
                    </Button>
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Engine 2 đọc tiếng Việt tự động, tách hàng theo dòng bảng. Miễn phí 500 lượt/ngày, ảnh tối đa 1MB.
                  {!cloudKey && ' Đang dùng key dùng thử chung nên có thể hết lượt bất cứ lúc nào.'}
                </p>
              </div>

              {/* AI Vision (Gemini / OpenAI) */}
              <div className="pt-0.5">
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  <Bot size={13} className="text-primary" /> AI Vision (Gemini / OpenAI)
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  AI đọc thẳng nội dung ảnh, tốt nhất với ảnh mờ / nghiêng / nhiều cột.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Nhà cung cấp</span>
                  <select
                    value={aiDraft.provider}
                    onChange={(e) => handleChangeAiProvider(e.target.value as AiProvider)}
                    className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary"
                  >
                    <option value="gemini">Google Gemini (có gói miễn phí)</option>
                    <option value="openai">OpenAI / tương thích (OpenRouter, Groq, Ollama...)</option>
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">API key</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={aiDraft.apiKey}
                      onChange={(e) => setAiDraft((prev) => ({ ...prev, apiKey: e.target.value }))}
                      placeholder={aiDraft.provider === 'gemini' ? 'AIza...' : 'sk-...'}
                      autoComplete="off"
                      className="flex-1 h-8 px-2 rounded-lg border border-border bg-background text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey((v) => !v)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title={showApiKey ? 'Ẩn key' : 'Hiện key'}
                    >
                      {showApiKey ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </label>

                <label className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Model</span>
                  <input
                    value={aiDraft.model}
                    onChange={(e) => setAiDraft((prev) => ({ ...prev, model: e.target.value }))}
                    placeholder={AI_PROVIDER_DEFAULTS[aiDraft.provider].model}
                    className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Base URL</span>
                  <input
                    value={aiDraft.baseUrl}
                    onChange={(e) => setAiDraft((prev) => ({ ...prev, baseUrl: e.target.value }))}
                    placeholder={AI_PROVIDER_DEFAULTS[aiDraft.provider].baseUrl}
                    className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <a
                  href={AI_PROVIDER_DEFAULTS[aiDraft.provider].keyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-primary hover:underline"
                >
                  Lấy API key {AI_PROVIDER_DEFAULTS[aiDraft.provider].label} ↗
                </a>
                <div className="flex items-center gap-2">
                  {aiConfig && (
                    <Button size="sm" variant="outline" onClick={handleClearAiConfig} className="h-7 text-[11px]">
                      Xoá key
                    </Button>
                  )}
                  <Button size="sm" onClick={handleSaveAiConfig} className="h-7 text-[11px] gap-1">
                    <Check size={12} className="stroke-[3px]" /> Lưu cấu hình
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Chọn engine đọc ảnh */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Đọc bằng:</span>

              <button
                type="button"
                onClick={() => setEngine('ocr4ai')}
                title="Ocr4AI (ocr.laychu.com) - Chuyên hóa đơn & tiếng Việt siêu tốc (300-600ms)"
                className={`relative flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                  engine === 'ocr4ai'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted/60'
                }`}
              >
                <Sparkles size={13} className={engine === 'ocr4ai' ? 'text-amber-200' : 'text-amber-500'} />
                <span>Ocr4AI (laychu.com)</span>
                {!ocr4aiConfig?.apiKey && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Chưa có API key" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setEngine('cloud')}
                title="OCR.space - đọc tiếng Việt, tách bảng theo dòng (cần mạng)"
                className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                  engine === 'cloud'
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted/60'
                }`}
              >
                <Zap size={13} /> OCR Cloud
              </button>

              <button
                type="button"
                onClick={() => setEngine('gemini')}
                title="AI Vision (Gemini / OpenAI) - đọc ảnh trực tiếp, cần API key"
                className={`relative flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                  engine === 'gemini'
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted/60'
                }`}
              >
                <Bot size={13} /> AI Gemini
                {!aiConfig?.apiKey && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Chưa có API key" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setEngine('tesseract')}
                title="Tesseract - chạy trên máy, không cần mạng hay API key"
                className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                  engine === 'tesseract'
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted/60'
                }`}
              >
                <Cpu size={13} /> Tesseract
              </button>
            </div>

            <p className="text-[10px] text-muted-foreground">
              {engine === 'ocr4ai' &&
                (ocr4aiConfig?.apiKey
                  ? `Ocr4AI (${ocr4aiConfig.model}) · Tốc độ 300-600ms · Tách bảng ${ocr4aiConfig.ocrFormat === 'markdown' ? 'Markdown' : 'Text'} tiếng Việt chuẩn xác.`
                  : 'Chưa có API key Ocr4AI. Bấm "Cấu hình" để nhập key từ ocr.laychu.com.')}
              {engine === 'cloud' &&
                (cloudKey
                  ? 'OCR.space Engine 2 · tự nhận diện tiếng Việt · tách bảng theo dòng.'
                  : 'Đang dùng key dùng thử của OCR.space (giới hạn lượt) — nhập key riêng trong "Cấu hình" để ổn định.')}
              {engine === 'gemini' &&
                (aiConfig
                  ? `${AI_PROVIDER_DEFAULTS[aiConfig.provider].label} · model ${aiConfig.model} · chỉ lấy tên hàng + số lượng.`
                  : 'Chưa có API key. Bấm "Cấu hình" để nhập key Gemini/OpenAI.')}
              {engine === 'tesseract' && 'Chạy ngay trên máy: không cần mạng, không cần API key, ảnh được làm nét trước khi đọc.'}
            </p>
          </div>

          {/* Top Tool buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/20 p-2.5 rounded-xl border border-border/60">
            <div className="flex items-center gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5 text-xs h-8"
              >
                <Upload size={13} />
                <span>Chọn ảnh từ máy</span>
              </Button>

              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                hoặc nhấn <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">Ctrl+V</kbd> để dán ảnh Zalo
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAiSettingsOpen((v) => !v)}
                className="gap-1.5 text-xs h-8"
              >
                <Settings2 size={13} />
                <span className="hidden sm:inline">Cấu hình</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${engineConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`}
                />
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleLoadSample}
                className="gap-1.5 text-xs h-8 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50"
              >
                <Sparkles size={13} />
                <span>Dùng hóa đơn mẫu (Hiệp Lĩnh)</span>
              </Button>

              {imageSrc && (
                <Button
                  size="sm"
                  onClick={handleRunOCR}
                  disabled={isProcessing}
                  className="gap-1.5 text-xs h-8 bg-primary text-primary-foreground font-bold shadow-sm"
                >
                  {isProcessing ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : engine === 'cloud' ? (
                    <Zap size={13} />
                  ) : engine === 'gemini' ? (
                    <Bot size={13} />
                  ) : (
                    <RefreshCw size={13} />
                  )}
                  <span>
                    {isProcessing
                      ? 'Đang đọc...'
                      : engine === 'cloud'
                        ? 'Đọc ảnh (OCR Cloud)'
                        : engine === 'gemini'
                          ? 'Đọc ảnh (AI Gemini)'
                          : 'Đọc ảnh (Tesseract)'}
                  </span>
                </Button>
              )}
            </div>
          </div>

          {/* Progress bar khi đang nhận diện */}
          {isProcessing && (
            <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-semibold text-primary">
                <span className="flex items-center gap-1.5">
                  <Loader2 size={14} className="animate-spin" />
                  {progressStatus}
                </span>
                <span className="font-mono">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-200 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Khung tải ảnh / Xem ảnh & Kết quả 2 cột */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Cột trái: Ảnh gốc */}
            <div className="lg:col-span-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <FileImage size={13} className="text-primary" /> Ảnh hóa đơn / phiếu hoa
                </span>
                {imageSrc && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageSrc(null);
                      setZoom(1);
                      setPan({ x: 0, y: 0 });
                      setParsedItems([]);
                      setRawText('');
                    }}
                    className="text-[10px] text-rose-500 hover:underline font-medium"
                  >
                    Xóa ảnh
                  </button>
                )}
              </div>

              {imageSrc ? (
                <div className="space-y-2">
                  {/* Thanh công cụ Thu phóng & Di chuyển ảnh */}
                  <div className="flex items-center justify-between bg-muted/40 px-3 py-1.5 rounded-lg border border-border text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleZoomChange(-0.25)}
                        disabled={zoom <= 0.5}
                        className="h-7 w-7 flex items-center justify-center rounded-md border border-border/80 bg-background hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                        title="Thu nhỏ ảnh (-)"
                      >
                        <ZoomOut size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setZoom(1);
                          setPan({ x: 0, y: 0 });
                        }}
                        className="h-7 px-2 flex items-center justify-center rounded-md border border-border/80 bg-background hover:bg-muted font-mono font-bold text-[11px] text-foreground transition-colors"
                        title="Bấm để đặt lại về 100%"
                      >
                        {Math.round(zoom * 100)}%
                      </button>
                      <button
                        type="button"
                        onClick={() => handleZoomChange(0.25)}
                        disabled={zoom >= 4}
                        className="h-7 w-7 flex items-center justify-center rounded-md border border-border/80 bg-background hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                        title="Phóng to ảnh (+)"
                      >
                        <ZoomIn size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setZoom(1);
                          setPan({ x: 0, y: 0 });
                        }}
                        className="h-7 px-2 flex items-center gap-1 rounded-md border border-border/80 bg-background hover:bg-muted text-muted-foreground hover:text-foreground text-[10px] transition-colors"
                        title="Đặt lại kích thước ban đầu"
                      >
                        <RotateCcw size={12} />
                        <span>Đặt lại</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Move size={11} /> Lăn chuột zoom · Kéo để dịch
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsFullscreenImage(true)}
                        className="h-7 px-2 flex items-center gap-1 rounded-md border border-border/80 bg-background hover:bg-muted text-foreground font-medium text-[11px] transition-colors"
                        title="Mở toàn màn hình để soi chi tiết"
                      >
                        <Maximize2 size={12} />
                        <span className="hidden sm:inline">Toàn màn hình</span>
                      </button>
                    </div>
                  </div>

                  {/* Vùng xem ảnh có tương tác Phóng to / Thu nhỏ & Kéo di chuyển */}
                  <div
                    ref={imageContainerRef}
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="relative rounded-xl border border-border overflow-hidden bg-muted/40 h-[480px] sm:h-[580px] flex items-center justify-center select-none"
                    style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
                  >
                    <img
                      src={imageSrc}
                      alt="Hóa đơn hoa nhà vườn"
                      draggable={false}
                      onDoubleClick={() => {
                        if (zoom > 1) {
                          setZoom(1);
                          setPan({ x: 0, y: 0 });
                        } else {
                          setZoom(2);
                        }
                      }}
                      style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transition: isDragging ? 'none' : 'transform 100ms ease-out',
                        transformOrigin: 'center center',
                      }}
                      className="max-w-full max-h-full object-contain pointer-events-auto"
                    />

                    {/* Nút đọc lại nhanh ở góc phải */}
                    <div className="absolute bottom-2.5 right-2.5 flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handleRunOCR}
                        disabled={isProcessing}
                        className="gap-1 text-[11px] h-7 bg-black/70 hover:bg-black/90 text-white backdrop-blur-xs border border-white/20 shadow-md"
                      >
                        <RefreshCw size={11} /> Đọc lại
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl border-2 border-dashed border-border hover:border-primary/60 bg-muted/20 hover:bg-muted/40 h-[480px] sm:h-[580px] flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all group"
                >
                  <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Upload size={24} />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Bấm để chọn ảnh hóa đơn / phiếu hoa</p>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-[260px]">
                    Hoặc chụp màn hình hóa đơn rồi bấm <strong>Ctrl+V</strong> vào cửa sổ này
                  </p>
                </div>
              )}

              {/* Toggle xem văn bản gốc đã OCR */}
              {rawText && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowRawText(!showRawText)}
                    className="text-[11px] text-primary hover:underline font-medium flex items-center gap-1"
                  >
                    <span>{showRawText ? '▲ Thu gọn văn bản bóc tách' : '▼ Xem & sửa văn bản nhận diện'}</span>
                  </button>

                  {showRawText && (
                    <div className="mt-2 space-y-1">
                      <textarea
                        value={rawText}
                        onChange={(e) => applyParsedText(e.target.value)}
                        rows={7}
                        placeholder="Văn bản nhận diện từ ảnh..."
                        className="w-full p-2.5 rounded-lg border border-border bg-card text-foreground font-mono text-[11px] focus:ring-1 focus:ring-primary custom-scrollbar"
                      />
                      <span className="text-[10px] text-muted-foreground italic block">
                        * Có thể sửa trực tiếp văn bản, kết quả bên phải sẽ tự cập nhật.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cột phải: Bảng kết quả bóc tách Tên hoa & Số lượng */}
            <div className="lg:col-span-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Flower2 size={13} className="text-primary" /> Kết quả trích xuất: Tên hàng & Số lượng
                </span>
                <span className="font-mono text-[11px] font-bold text-primary">{parsedItems.length} mặt hàng</span>
              </div>

              {parsedItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/10 h-[480px] sm:h-[580px] flex flex-col items-center justify-center p-8 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                    <Flower2 size={24} />
                  </div>
                  <p className="text-sm font-medium text-foreground">Chưa có kết quả trích xuất nào</p>
                  <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                    Tải ảnh hóa đơn lên và bấm "Đọc hóa đơn ({engineLabel})",
                    hoặc bấm "Dùng hóa đơn mẫu" để xem thử.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden bg-card flex flex-col h-[480px] sm:h-[580px]">
                  <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-muted/70 text-muted-foreground font-semibold sticky top-0 border-b border-border z-10">
                        <tr>
                          <th className="py-2 px-2.5 w-8 text-center">#</th>
                          <th className="py-2 px-2.5 min-w-[170px]">Mặt hàng hoa nhận diện</th>
                          <th className="py-2 px-2.5 min-w-[105px] text-right">Số lượng</th>
                          <th className="py-2 px-2 w-8 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {parsedItems.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                            <td className="py-2 px-2.5 text-center text-muted-foreground font-mono">{idx + 1}</td>
                            <td className="py-2 px-2.5">
                              <div className="space-y-1">
                                <select
                                  value={item.matchedFlowerId || ''}
                                  onChange={(e) => handleSelectFlower(item.id, e.target.value)}
                                  className="w-full h-7 px-2 rounded border border-border bg-background text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary"
                                >
                                  {item.matchedFlowerId ? null : (
                                    <option value="">-- Chưa khớp: {item.flowerName} --</option>
                                  )}
                                  {flowers.map((fl) => (
                                    <option key={fl.id} value={fl.id}>
                                      {fl.code} - {fl.name} {fl.customName ? `(${fl.customName})` : ''}
                                    </option>
                                  ))}
                                </select>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
                                  {item.matchedFlowerId ? (
                                    <span className="font-mono">{item.flowerCode}</span>
                                  ) : (
                                    <span className="text-amber-600 dark:text-amber-400 font-medium">Chưa có trong danh mục</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-2 px-2.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <input
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateItemQuantity(item.id, parseInt(e.target.value, 10) || 0)}
                                  className="w-20 h-7 px-2 text-right font-mono font-bold text-foreground rounded border border-border bg-background focus:ring-1 focus:ring-primary text-xs"
                                />
                                <span className="text-[10px] text-muted-foreground select-none">{item.unit}</span>
                              </div>
                            </td>
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1 rounded text-muted-foreground hover:text-rose-600 transition-colors"
                                title="Xóa dòng hoa này"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary footer */}
                  <div className="p-3 bg-muted/40 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Tổng số lượng:{' '}
                      <strong className="text-primary font-mono">
                        {parsedItems.reduce((s, i) => s + i.quantity, 0).toLocaleString('vi-VN')}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleAddRow}
                      className="text-primary hover:underline font-semibold flex items-center gap-1 text-[11px]"
                    >
                      <Plus size={12} /> Thêm dòng hoa
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-muted-foreground">
            {parsedItems.length > 0 && (
              <span>
                Đã sẵn sàng đưa <strong>{parsedItems.length} mặt hàng</strong> vào đơn hàng NCC
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onClose} className="h-8 text-xs">
              Đóng
            </Button>
            <Button
              size="sm"
              disabled={parsedItems.length === 0}
              onClick={handleConfirmAndApply}
              className="gap-1.5 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
            >
              <Check size={14} className="stroke-[3px]" />
              <span>Đưa vào đơn hàng NCC ({parsedItems.length})</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Lightbox Modal: Xem ảnh phóng to toàn màn hình */}
      {isFullscreenImage && imageSrc && (
        <div className="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex flex-col animate-in fade-in duration-150">
          <div className="px-5 py-3 bg-black/70 border-b border-white/10 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs flex items-center gap-1.5">
                <FileImage size={15} className="text-amber-400" />
                <span>Chi tiết ảnh hóa đơn nhà vườn</span>
              </span>
              <span className="text-[11px] text-white/60 hidden sm:inline">
                · Lăn chuột hoặc dùng nút zoom (đến 400%), kéo chuột để dịch chuyển
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white/10 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => handleZoomChange(-0.25)}
                  disabled={zoom <= 0.5}
                  className="p-1 rounded hover:bg-white/20 text-white disabled:opacity-40 transition-colors"
                  title="Thu nhỏ (-)"
                >
                  <ZoomOut size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                  }}
                  className="px-2 py-0.5 rounded font-mono font-bold text-xs hover:bg-white/20 transition-colors"
                  title="Đặt lại 100%"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  type="button"
                  onClick={() => handleZoomChange(0.25)}
                  disabled={zoom >= 4}
                  className="p-1 rounded hover:bg-white/20 text-white disabled:opacity-40 transition-colors"
                  title="Phóng to (+)"
                >
                  <ZoomIn size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                  }}
                  className="px-2 py-0.5 rounded hover:bg-white/20 text-[11px] flex items-center gap-1 transition-colors"
                  title="Đặt lại kích thước ban đầu"
                >
                  <RotateCcw size={12} />
                  <span>Đặt lại</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsFullscreenImage(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white ml-2 transition-colors"
                title="Đóng chế độ phóng to toàn màn hình"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="flex-1 overflow-hidden flex items-center justify-center p-4 select-none"
            style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
          >
            <img
              src={imageSrc}
              alt="Hóa đơn hoa chi tiết"
              draggable={false}
              onDoubleClick={() => {
                if (zoom > 1) {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                } else {
                  setZoom(2.5);
                }
              }}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transition: isDragging ? 'none' : 'transform 100ms ease-out',
                transformOrigin: 'center center',
              }}
              className="max-w-full max-h-full object-contain pointer-events-auto shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
