import imageCompression from 'browser-image-compression';

interface ImageProcessingOptions {
  maxWidthOrHeight: number;
  maxSizeMB: number;
  initialQuality?: number;
}

/**
 * Processa e comprime uma imagem antes do upload.
 * @param imageFile - O arquivo de imagem a ser processado.
 * @param options - As opções de compressão e redimensionamento.
 * @returns O arquivo de imagem processado.
 */
export const processImage = async (
  imageFile: File,
  options: ImageProcessingOptions
): Promise<File> => {
  console.log(`Tamanho original da imagem: ${(imageFile.size / 1024 / 1024).toFixed(2)} MB`);

  const compressionOptions = {
    maxSizeMB: options.maxSizeMB,
    maxWidthOrHeight: options.maxWidthOrHeight,
    useWebWorker: true,
    initialQuality: options.initialQuality || 0.8,
  };

  try {
    const compressedFile = await imageCompression(imageFile, compressionOptions);
    console.log(`Tamanho da imagem comprimida: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
    return compressedFile;
  } catch (error) {
    console.error('Erro ao comprimir a imagem:', error);
    // Se a compressão falhar, retorna o arquivo original para não quebrar o fluxo.
    return imageFile;
  }
};
