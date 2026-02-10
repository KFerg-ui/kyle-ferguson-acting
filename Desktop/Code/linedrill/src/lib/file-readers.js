/**
 * File Readers
 *
 * Extract raw text from PDF, DOCX, and TXT files.
 * PDF reader preserves line breaks by tracking y-position changes.
 */

function readAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read file. It may have been moved or is inaccessible."));
    reader.readAsArrayBuffer(file);
  });
}

export async function readPDF(file) {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

  const buffer = await readAsArrayBuffer(file);
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("PDF loading timed out after 30s")), 30000)
  );
  const pdf = await Promise.race([loadingTask.promise, timeout]);

  let text = "";
  let totalItems = 0;
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    totalItems += content.items.length;

    let lastY = null;
    for (const item of content.items) {
      if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
        text += "\n";
      }
      text += item.str;
      lastY = item.transform[5];
    }
    text += "\n\n";
  }

  if (!text.trim()) {
    throw new Error(
      `PDF has ${pdf.numPages} page${pdf.numPages !== 1 ? "s" : ""} but no extractable text (${totalItems} text items). It may be scanned images — try a text-based PDF or DOCX.`
    );
  }

  // Strip page numbers — bare numbers, "Page N", "- N -", etc.
  // These are PDF rendering artifacts that pollute dialogue lines.
  const cleaned = text.split("\n").filter(line => {
    const t = line.trim();
    if (!t) return true;
    if (/^\d{1,4}$/.test(t)) return false;
    if (/^page\s+\d+/i.test(t)) return false;
    if (/^-\s*\d{1,4}\s*-$/.test(t)) return false;
    return true;
  }).join("\n");

  return cleaned;
}

export async function readDOCX(file) {
  const mammoth = await import("mammoth");
  const buffer = await readAsArrayBuffer(file);
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
}

export async function readTXT(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read text file."));
    reader.readAsText(file);
  });
}

/**
 * Read any supported file based on extension.
 */
export async function readScriptFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();

  switch (ext) {
    case "pdf":
      return readPDF(file);
    case "docx":
    case "doc":
      return readDOCX(file);
    case "txt":
    default:
      return readTXT(file);
  }
}
