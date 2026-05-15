import { useRef, useState } from 'react';
import { FileImage, Trash2, Upload, Video } from 'lucide-react';
import { Button } from './ui/button';

export interface AttachmentData {
  id?: string;
  nome: string;
  tipo: string;
  tamanho: number;
  conteudo: string;
  criadoEm?: string;
}

interface AttachmentInputProps {
  value: AttachmentData[];
  onChange: (attachments: AttachmentData[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  maxFileSizeMb?: number;
  maxTotalSizeMb?: number;
  accept?: string;
  allowedKinds?: Array<'image' | 'video'>;
  buttonLabel?: string;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  });

export function AttachmentInput({
  value,
  onChange,
  disabled = false,
  maxFiles = 6,
  maxFileSizeMb = 5,
  maxTotalSizeMb = 10,
  accept = 'image/*,video/*',
  allowedKinds = ['image', 'video'],
  buttonLabel = 'Adicionar imagem ou vídeo',
}: AttachmentInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;

    const remainingSlots = maxFiles - value.length;
    if (remainingSlots <= 0) {
      alert(`Limite de ${maxFiles} anexos atingido`);
      return;
    }

    const selectedFiles = Array.from(files).slice(0, remainingSlots);
    const maxBytes = maxFileSizeMb * 1024 * 1024;
    const maxTotalBytes = maxTotalSizeMb * 1024 * 1024;
    const currentTotal = value.reduce((sum, attachment) => sum + attachment.tamanho, 0);
    const selectedTotal = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    const invalidFile = selectedFiles.find(
      (file) => !allowedKinds.some((kind) => file.type.startsWith(`${kind}/`))
    );
    const oversizedFile = selectedFiles.find((file) => file.size > maxBytes);

    if (invalidFile) {
      alert(allowedKinds.length === 1 && allowedKinds[0] === 'image' ? 'Selecione apenas imagens' : 'Selecione apenas imagens ou vídeos');
      return;
    }

    if (currentTotal + selectedTotal > maxTotalBytes) {
      alert(`O total de anexos não pode passar de ${maxTotalSizeMb} MB`);
      return;
    }

    if (oversizedFile) {
      alert(`O arquivo "${oversizedFile.name}" passa de ${maxFileSizeMb} MB`);
      return;
    }

    try {
      setLoading(true);
      const attachments = await Promise.all(
        selectedFiles.map(async (file) => ({
          nome: file.name,
          tipo: file.type,
          tamanho: file.size,
          conteudo: await fileToDataUrl(file),
          criadoEm: new Date().toISOString(),
        }))
      );

      onChange([...value, ...attachments]);
    } catch (error) {
      console.error(error);
      alert('Erro ao carregar anexo');
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    onChange(value.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
        disabled={disabled || loading}
      />

      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || loading || value.length >= maxFiles}
      >
        <Upload className="h-4 w-4" />
        {loading ? 'Carregando...' : buttonLabel}
      </Button>

      <p className="text-xs text-gray-500">
        Até {maxFiles} arquivos, com {maxFileSizeMb} MB por arquivo e {maxTotalSizeMb} MB no total.
      </p>

      {value.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {value.map((attachment, index) => {
            const isVideo = attachment.tipo.startsWith('video/');
            return (
              <div key={`${attachment.nome}-${index}`} className="rounded-md border bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    {isVideo ? (
                      <Video className="h-4 w-4 text-blue-600" />
                    ) : (
                      <FileImage className="h-4 w-4 text-emerald-600" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{attachment.nome}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(attachment.tamanho)}</p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeAttachment(index)}
                    disabled={disabled || loading}
                    aria-label="Remover anexo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-3 overflow-hidden rounded-md bg-gray-100">
                  {isVideo ? (
                    <video src={attachment.conteudo} controls className="h-36 w-full object-cover" />
                  ) : (
                    <img src={attachment.conteudo} alt={attachment.nome} className="h-36 w-full object-cover" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
