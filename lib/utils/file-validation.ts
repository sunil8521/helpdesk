/**
 * Utility for verifying file signatures (magic bytes).
 * Ensures that a file hasn't been maliciously renamed (e.g. image.exe -> document.pdf)
 */
export async function validateFileSignature(file: File): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      const view = new Uint8Array(buffer);
      
      // Convert bytes to hex string
      const hex = Array.from(view)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();

      const fileName = file.name.toLowerCase();
      
      // Check PDF magic bytes (%PDF) -> 25 50 44 46
      if (fileName.endsWith('.pdf')) {
        if (!hex.startsWith('25504446')) {
          reject(new Error("Security Error: This file has been tampered with. It is not a real PDF."));
          return;
        }
      }
      
      // Check DOCX magic bytes (ZIP archive) -> 50 4B 03 04
      if (fileName.endsWith('.docx')) {
        if (!hex.startsWith('504B0304')) {
          reject(new Error("Security Error: This file has been tampered with. It is not a real DOCX."));
          return;
        }
      }
      
      // Note: TXT and MD files don't have reliable magic bytes, so we allow them through.
      
      resolve(true);
    };
    
    reader.onerror = () => reject(new Error("Failed to read file signature"));
    
    // We only need the first 4 bytes to verify the magic number
    reader.readAsArrayBuffer(file.slice(0, 4));
  });
}
