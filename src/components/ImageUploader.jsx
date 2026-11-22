import React, { useState, useRef } from "react";
import { FiUploadCloud, FiTrash2, FiSend, FiLoader } from "react-icons/fi";

// Lấy màu chủ đạo của ảnh (ưu tiên vùng có màu sắc rõ), trả về "r g b"
function extractDominantColor(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const size = 24;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;
        let r = 0, g = 0, b = 0, total = 0;
        for (let i = 0; i < data.length; i += 4) {
          const R = data[i], G = data[i + 1], B = data[i + 2];
          const max = Math.max(R, G, B);
          const min = Math.min(R, G, B);
          const sat = (max - min) / 255;
          const weight = 0.05 + sat * sat;
          r += R * weight; g += G * weight; b += B * weight; total += weight;
        }
        resolve(`${Math.round(r / total)} ${Math.round(g / total)} ${Math.round(b / total)}`);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function ImageUploader({ isLoading, onImageRemove, onSuggestionComplete, onColorExtract, setIsLoading, setError }) {
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const fileInputRef = useRef(null);

  const urlToFile = async (url, filename, mimeType) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], filename, { type: mimeType });
  };

  const processFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setImage(file);
      setPreviewUrl(url);
      setError('');
      extractDominantColor(url).then((color) => onColorExtract?.(color));
    }
  };

  const handleFileChange = (event) => {
    processFile(event.target.files[0]);
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      processFile(event.dataTransfer.files[0]);
      return;
    }
    const html = event.dataTransfer.getData('text/html');
    if (html) {
      const match = html.match(/<img src="([^"]+)"/);
      const url = match && match[1];
      if (url) {
        setIsFetchingUrl(true);
        setError('');
        try {
          const file = await urlToFile(url, 'image-from-web.jpg', 'image/jpeg');
          processFile(file);
        } catch (err) {
          setError('Không thể tải ảnh từ trang web này. Vui lòng thử ảnh khác.');
          console.error("Lỗi khi tải ảnh từ URL:", err);
        } finally {
          setIsFetchingUrl(false);
        }
        return;
      }
    }
    setError('Không thể xử lý đối tượng được kéo vào. Vui lòng thử lại với file ảnh.');
  };

  const handleRemoveImage = () => {
    setImage(null);
    setPreviewUrl('');
    onColorExtract?.(null);
    if (onImageRemove) onImageRemove();
  };

  const handleSelectFile = () => { fileInputRef.current.click(); };
  const handleDragOver = (event) => { event.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (event) => { event.preventDefault(); setIsDragging(false); };

  const handleSubmit = async () => {
    if (!image) return;
    setIsLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', image);
    try {
      const response = await fetch('http://127.0.0.1:5001/suggest', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Server không thể xử lý ảnh này. Vui lòng thử lại.');
      }
      const data = await response.json();
      onSuggestionComplete(data, { url: previewUrl, name: image.name });
    } catch (err) {
      setError(err.message || 'Không thể kết nối đến server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl">
      {!previewUrl ? (
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelectFile()}
          className={`flex h-72 sm:h-80 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors
            ${isDragging ? 'border-accent-text bg-accent/10' : 'border-fg/25 bg-surface/60 hover:border-accent-text'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleSelectFile}
        >
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" ref={fileInputRef} />
          {isFetchingUrl ? (
            <>
              <FiLoader className="mb-4 text-4xl text-accent-text animate-spin" />
              <p className="text-muted">Đang tải ảnh từ web...</p>
            </>
          ) : (
            <>
              <span className="mb-5 grid h-16 w-16 place-items-center rounded-full bg-accent text-accent-fg">
                <FiUploadCloud className="text-3xl" />
              </span>
              <p className="font-display text-xl font-bold">Kéo và thả ảnh vào đây</p>
              <p className="mt-1 text-sm text-muted">hoặc</p>
              <p className="mt-1 font-semibold text-accent-text underline underline-offset-4">Nhấn để chọn ảnh</p>
            </>
          )}
        </div>
      ) : (
        <div>
          <div
            className="relative -rotate-1 rounded-sm bg-white p-3 pb-12 shadow-[0_22px_44px_-18px_rgba(0,0,0,0.55)]"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <img src={previewUrl} alt="Ảnh bạn đã chọn" className="max-h-[50vh] w-full bg-neutral-100 object-contain" />
            <p className="absolute bottom-3 left-4 right-4 truncate font-display text-sm font-semibold text-neutral-500">
              {image?.name}
            </p>

            {isDragging && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 pointer-events-none">
                <FiUploadCloud className="mb-3 text-5xl text-white" />
                <p className="font-semibold text-white">Thả ảnh mới để thay thế</p>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleRemoveImage}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-fg px-6 py-3 font-semibold transition-colors hover:bg-fg hover:text-page sm:w-auto"
            >
              <FiTrash2 /> Bỏ chọn
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex w-full flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-accent px-7 py-3 font-bold text-accent-fg transition hover:scale-[1.03] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 sm:flex-none"
            >
              {isLoading ? <FiLoader className="animate-spin" /> : <FiSend />} Xác nhận
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageUploader;
