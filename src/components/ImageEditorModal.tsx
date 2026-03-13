import { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crop as CropIcon, Type, RotateCcw, X } from "lucide-react";

interface Annotation {
  id: string;
  x: number; // percentage of image width
  y: number; // percentage of image height
  text: string;
}

interface ImageEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageFile: File | null;
  onConfirm: (editedFile: File) => void;
}

type Tool = "crop" | "annotate";

export function ImageEditorModal({ open, onOpenChange, imageFile, onConfirm }: ImageEditorModalProps) {
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [tool, setTool] = useState<Tool>("crop");
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load image when file changes
  useEffect(() => {
    if (!imageFile) { setImgSrc(""); return; }
    const reader = new FileReader();
    reader.onload = () => setImgSrc(reader.result as string);
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setCrop(undefined);
      setCompletedCrop(undefined);
      setAnnotations([]);
      setEditingId(null);
      setTool("crop");
    }
  }, [open]);

  const handleReset = () => {
    setCrop(undefined);
    setCompletedCrop(undefined);
    setAnnotations([]);
    setEditingId(null);
  };

  const handleImageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (tool !== "annotate" || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const id = crypto.randomUUID();
    setAnnotations((prev) => [...prev, { id, x, y, text: "" }]);
    setEditingId(id);
  }, [tool]);

  const updateAnnotation = (id: string, text: string) => {
    setAnnotations((prev) => prev.map((a) => a.id === id ? { ...a, text } : a));
  };

  const removeAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const finishEditing = (id: string) => {
    const ann = annotations.find((a) => a.id === id);
    if (ann && !ann.text.trim()) {
      removeAnnotation(id);
    } else {
      setEditingId(null);
    }
  };

  const handleConfirm = useCallback(async () => {
    if (!imgRef.current) return;

    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    let sx = 0, sy = 0, sw = image.naturalWidth, sh = image.naturalHeight;

    if (completedCrop) {
      sx = completedCrop.x * scaleX;
      sy = completedCrop.y * scaleY;
      sw = completedCrop.width * scaleX;
      sh = completedCrop.height * scaleY;
    }

    canvas.width = sw;
    canvas.height = sh;
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);

    // Draw annotations
    annotations.forEach((ann) => {
      if (!ann.text.trim()) return;
      // Convert percentage to crop-relative pixels
      const absX = (ann.x / 100) * image.naturalWidth - sx;
      const absY = (ann.y / 100) * image.naturalHeight - sy;
      if (absX < 0 || absY < 0 || absX > sw || absY > sh) return;

      const fontSize = Math.max(14, Math.round(sw * 0.018));
      ctx.font = `500 ${fontSize}px system-ui, sans-serif`;
      const metrics = ctx.measureText(ann.text);
      const pad = fontSize * 0.5;
      const boxW = metrics.width + pad * 2;
      const boxH = fontSize + pad * 2;

      // Background
      ctx.fillStyle = "#FFF8E7";
      ctx.strokeStyle = "#F5A623";
      ctx.lineWidth = 2;
      const rx = absX - pad;
      const ry = absY - boxH / 2;
      ctx.beginPath();
      ctx.roundRect(rx, ry, boxW, boxH, 6);
      ctx.fill();
      ctx.stroke();

      // Text
      ctx.fillStyle = "#1A1A1A";
      ctx.textBaseline = "middle";
      ctx.fillText(ann.text, absX, absY);
    });

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], imageFile?.name || "receipt.jpg", { type: "image/jpeg" });
      onConfirm(file);
      onOpenChange(false);
    }, "image/jpeg", 0.88);
  }, [completedCrop, annotations, imageFile, onConfirm, onOpenChange]);

  if (!imgSrc) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-h3">Edit receipt</DialogTitle>
          <p className="text-small text-foreground-muted">
            Crop to remove sensitive info, then add labels if needed
          </p>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Button
            size="sm"
            variant={tool === "crop" ? "default" : "outline"}
            onClick={() => setTool("crop")}
          >
            <CropIcon className="h-3.5 w-3.5 mr-1" /> Crop
          </Button>
          <Button
            size="sm"
            variant={tool === "annotate" ? "default" : "outline"}
            onClick={() => setTool("annotate")}
          >
            <Type className="h-3.5 w-3.5 mr-1" /> Annotate
          </Button>
          <div className="flex-1" />
          <Button size="sm" variant="ghost" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
          </Button>
          <Button size="sm" onClick={handleConfirm}>
            Confirm →
          </Button>
        </div>

        {/* Canvas area */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto p-4 flex items-center justify-center bg-background-secondary min-h-[300px] relative"
          onClick={tool === "annotate" ? handleImageClick : undefined}
        >
          {tool === "crop" ? (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
            >
              <img
                ref={imgRef}
                src={imgSrc}
                alt="Receipt"
                className="max-h-[60vh] max-w-full object-contain"
                crossOrigin="anonymous"
              />
            </ReactCrop>
          ) : (
            <div className="relative inline-block">
              <img
                ref={imgRef}
                src={imgSrc}
                alt="Receipt"
                className="max-h-[60vh] max-w-full object-contain"
                crossOrigin="anonymous"
              />
              {/* Annotation overlays */}
              {annotations.map((ann) => (
                <div
                  key={ann.id}
                  className="absolute"
                  style={{
                    left: `${ann.x}%`,
                    top: `${ann.y}%`,
                    transform: "translate(-4px, -50%)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {editingId === ann.id ? (
                    <Input
                      autoFocus
                      value={ann.text}
                      onChange={(e) => updateAnnotation(ann.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") finishEditing(ann.id);
                      }}
                      onBlur={() => finishEditing(ann.id)}
                      placeholder="Add a note here..."
                      className="min-w-[140px] h-8 text-xs border-accent bg-background"
                    />
                  ) : (
                    <div className="flex items-center gap-1">
                      <span
                        className="text-xs font-medium px-2 py-1 rounded bg-accent-light border border-accent/30 text-foreground cursor-pointer whitespace-nowrap"
                        onClick={() => setEditingId(ann.id)}
                      >
                        {ann.text}
                      </span>
                      <button
                        onClick={() => removeAnnotation(ann.id)}
                        className="h-4 w-4 flex items-center justify-center rounded-full bg-background border border-border text-foreground-muted hover:text-destructive"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom hint */}
        <div className="px-4 py-2 border-t border-border">
          <p className="text-small text-foreground-muted">
            Tip: Use crop to hide your account balance. Use annotations to label what each amount represents.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
