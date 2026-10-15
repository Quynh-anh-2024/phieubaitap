import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import {
  RefreshCcw,
  CheckCircle,
  FileText,
  Users,
  ImagePlus,
  Trash2,
  Upload,
  ClipboardPaste,
} from 'lucide-react';
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  PageBreak,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';
import FileSaver from 'file-saver';

interface WorksheetDisplayProps {
  content: string;
  onReset: () => void;
}

type ExportMode = 'teacher' | 'student';
type ImageSize = 'sm' | 'md' | 'lg';
type DocxBlock = Paragraph | Table;
type NullableInput = HTMLInputElement | null;
type NullableReplaceTarget = { type: 'svg' | 'image'; id: string } | null;
type RenderedPng = { data: Uint8Array; width: number; height: number } | null;

interface WorksheetImageMeta {
  id: string;
  size: ImageSize;
  alt?: string;
}

interface QuestionAnchor {
  index: number;
  lineIndex: number;
  insertAfterLine: number;
  label: string;
}

const FONT_FAMILY = 'Times New Roman';
const STANDARD_FONT_SIZE = 26; // 13pt
const TITLE_FONT_SIZE = 32; // 16pt
const TABLE_BORDER = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: '000000',
};

const SIZE_HEIGHT_CLASSES: Record<ImageSize, string> = {
  sm: 'max-h-28',
  md: 'max-h-44',
  lg: 'max-h-64',
};

const SIZE_DOCX_WIDTH: Record<ImageSize, number> = {
  sm: 170,
  md: 260,
  lg: 380,
};

const normalizeSvgBlocksInMarkdown = (raw: string): string => {
  if (!raw) return '';
  let svgCounter = 0;

  const wrapped = raw.replace(
    /(?:```[a-zA-Z]*\s*\r?\n)?(<svg[\s\S]*?<\/svg>)(?:\s*\r?\n```)?/gi,
    (_match, svgBody: string) => {
      svgCounter += 1;
      let updatedSvg = svgBody.trim();
      if (!/\bdata-svg-id=/i.test(updatedSvg)) {
        updatedSvg = updatedSvg.replace(/^<svg/i, `<svg data-svg-id="svg_${svgCounter}"`);
      }
      if (!/\bdata-size=/i.test(updatedSvg)) {
        updatedSvg = updatedSvg.replace(/^<svg/i, `<svg data-size="md"`);
      }
      return `\n\n\`\`\`svg\n${updatedSvg}\n\`\`\`\n\n`;
    }
  );

  return wrapped.replace(/\n{3,}/g, '\n\n');
};

const extractSvgAttribute = (svgText: string, attr: string): string => {
  const match = svgText.match(new RegExp(`${attr}=["']([^"']+)["']`, 'i'));
  return match ? match[1] : '';
};

const renderVisualToPngBuffer = async (
  source: string,
  isSvg: boolean,
  size: ImageSize = 'md'
): Promise<RenderedPng> => {
  return new Promise((resolve) => {
    try {
      let imageSrc = source;
      if (isSvg) {
        let cleanSvg = source.trim();
        const openTagMatch = cleanSvg.match(/^<svg[^>]*>/i);
        if (openTagMatch) {
          let openTag = openTagMatch[0];
          if (!/\bxmlns=/i.test(openTag)) {
            openTag = openTag.replace(/^<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
          }
          const vbMatch = openTag.match(/viewBox=["']([^"']+)["']/i);
          const vbParts = vbMatch ? vbMatch[1].trim().split(/[\s,]+/) : [];
          const w = vbParts.length === 4 ? vbParts[2] : '360';
          const h = vbParts.length === 4 ? vbParts[3] : '160';

          if (!/\swidth=/i.test(openTag)) {
            openTag = openTag.replace(/^<svg/i, `<svg width="${w}"`);
          }
          if (!/\sheight=/i.test(openTag)) {
            openTag = openTag.replace(/^<svg/i, `<svg height="${h}"`);
          }
          cleanSvg = cleanSvg.replace(/^<svg[^>]*>/i, openTag);
        }
        imageSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cleanSvg)}`;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const naturalW = img.naturalWidth || 360;
        const naturalH = img.naturalHeight || 160;
        const aspect = naturalW / Math.max(naturalH, 1);

        const targetWidth = SIZE_DOCX_WIDTH[size] || SIZE_DOCX_WIDTH.md;
        const targetHeight = Math.max(60, Math.round(targetWidth / aspect));

        const scale = 2;
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth * scale;
        canvas.height = targetHeight * scale;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          blob
            .arrayBuffer()
            .then((buffer) => {
              resolve({
                data: new Uint8Array(buffer),
                width: targetWidth,
                height: targetHeight,
              });
            })
            .catch(() => resolve(null));
        }, 'image/png');
      };
      img.onerror = () => resolve(null);
      img.src = imageSrc;
    } catch {
      resolve(null);
    }
  });
};

const removeMarkdownHeadingPrefix = (line: string): string =>
  line.replace(/^#{1,6}\s+/, '').trim();

const normalizeMathAndSymbols = (text: string): string => {
  let result = text || '';

  result = result
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\$\$([\s\S]*?)\$\$/g, '$1') .replace(/\$([^$]*)\$/g, '$1') .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1/$2') .replace(/\\dfrac\{([^{}]+)\}\{([^{}]+)\}/g, '$1/$2')
    .replace(/\\text\{([^{}]*)\}/g, '$1') .replace(/\\mathrm\{([^{}]*)\}/g, '$1')
    .replace(/\\times/g, '×')
    .replace(/\\cdot/g, '×')
    .replace(/\\div/g, ':')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\dots/g, '...')
    .replace(/\\ldots/g, '...')
    .replace(/\\quad/g, '  ')
    .replace(/\\left/g, '')
    .replace(/\\right/g, '')
    .replace(/\^\{2\}/g, '²')
    .replace(/\^2/g, '²')
    .replace(/\^\{3\}/g, '³')
    .replace(/\^3/g, '³')
    .replace(/\^\{([^{}]+)\}/g, '$1')
    .replace(/\\,/g, ' ')
    .replace(/\\/g, '')
    .replace(/\$/g, '')
    .replace(/:?-{3,}:?/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return result;
};

const cleanPlainText = (text: string): string =>
  normalizeMathAndSymbols(text)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\|/g, ' ')
    .replace(/:\s*(?=[A-Za-zÀ-ỹ])/g, ': ')
    .replace(/\)\s*:\s*(?=[A-Za-zÀ-ỹ])/g, '): ')
    .replace(/\s+/g, ' ')
    .trim();

const DOT_LINE = '........................................................................................';

const isDottedAnswerLine = (line: string): boolean => {
  const plain = cleanPlainText(line);
  const dotCount = (plain.match(/\./g) || []).length;
  return dotCount >= 12 && dotCount >= Math.max(12, Math.floor(plain.length * 0.55));
};

const createDottedParagraph = (): Paragraph =>
  createParagraph(DOT_LINE, { alignment: AlignmentType.LEFT, spacingAfter: 50 });

const ERROR_FIX_LABELS = [
  'lỗi sai',
  'sửa lại',
  'cách sửa',
  'bài giải',
  'đáp án',
  'giải thích',
  'gợi ý phhs',
  'lỗi học sinh thường gặp',
];

const normalizeLabelSpacing = (text: string): string =>
  cleanPlainText(text)
    .replace(/\bLỗi\s+sai\s*:/gi, 'Lỗi sai:')
    .replace(/\bSửa\s+lại\s*:/gi, 'Sửa lại:')
    .replace(/\bCách\s+sửa\s*:/gi, 'Cách sửa:')
    .replace(/\bBài\s+giải\s*:/gi, 'Bài giải:')
    .replace(/\bĐáp\s+án\s*:/gi, 'Đáp án:')
    .replace(/\bGiải\s+thích\s*:/gi, 'Giải thích:')
    .replace(/\s+/g, ' ')
    .trim();

const stripListMarker = (line: string): string =>
  line.trim().replace(/^[-•●]\s+/, '').replace(/^\*\s+/, '').trim();

const isSpecialShortLabel = (line: string): boolean => {
  const normalized = normalizeLabelSpacing(stripListMarker(line)).toLowerCase();
  return ERROR_FIX_LABELS.some((label) => normalized === `${label}:` || normalized.startsWith(`${label}: `));
};

const isOnlySeparator = (line: string): boolean => /^\s*[-–—]{3,}\s*$/.test(line.trim());

const isTableLikeLine = (line: string): boolean => {
  const pipeCount = (line.match(/\|/g) || []).length;
  return pipeCount >= 2;
};

const parseTableRow = (line: string): string[] => {
  let row = line.trim();
  if (row.startsWith('|')) row = row.slice(1);
  if (row.endsWith('|')) row = row.slice(0, -1);

  return row
    .split('|')
    .map((cell) => cleanPlainText(cell))
    .filter((cell, index, arr) => !(index === arr.length - 1 && cell === ''));
};

const isMarkdownSeparatorRow = (cells: string[]): boolean => {
  if (!cells.length) return true;
  return cells.every((cell) => /^:?-{2,}:?$/.test(cell.replace(/\s/g, '')) || cell === '');
};

const createRuns = (text: string, options?: { bold?: boolean; italics?: boolean; size?: number }): TextRun[] => {
  const raw = normalizeMathAndSymbols(text);
  const tokens = raw.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);

  if (!tokens.length) {
    return [
      new TextRun({
        text: '',
        font: FONT_FAMILY,
        size: options?.size || STANDARD_FONT_SIZE,
        bold: options?.bold,
        italics: options?.italics,
      }),
    ];
  }

  return tokens.map((token) => {
    const isBold = /^\*\*[^*]+\*\*$/.test(token);
    const isItalic = /^\*[^*]+\*$/.test(token) && !isBold;
    const textContent = token.replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/^\*/, '').replace(/\*$/, '');

    return new TextRun({
      text: cleanPlainText(textContent),
      font: FONT_FAMILY,
      size: options?.size || STANDARD_FONT_SIZE,
      bold: options?.bold || isBold,
      italics: options?.italics || isItalic,
    });
  });
};

const createParagraph = (
  text: string,
  options?: {
    bold?: boolean;
    italics?: boolean;
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel];
    bullet?: boolean;
    spacingBefore?: number;
    spacingAfter?: number;
    size?: number;
  }
): Paragraph => {
  return new Paragraph({
    children: createRuns(text, { bold: options?.bold, italics: options?.italics, size: options?.size }),
    alignment: options?.alignment || AlignmentType.LEFT,
    heading: options?.heading,
    bullet: options?.bullet ? { level: 0 } : undefined,
    spacing: {
      before: options?.spacingBefore ?? 0,
      after: options?.spacingAfter ?? 60, // Đã thu gọn khoảng cách sau đoạn văn bản
      line: 240, // Chuẩn hóa chiều cao dòng gọn gàng, tránh bị thưa
    },
  });
};

const createTitleParagraph = (text: string): Paragraph =>
  createParagraph(cleanPlainText(removeMarkdownHeadingPrefix(text)).toUpperCase(), {
    bold: true,
    alignment: AlignmentType.CENTER,
    heading: HeadingLevel.HEADING_1,
    spacingBefore: 40,
    spacingAfter: 120, // Thu gọn khoảng cách dưới tiêu đề chính
    size: TITLE_FONT_SIZE,
  });

const createSectionHeading = (text: string): Paragraph =>
  createParagraph(cleanPlainText(removeMarkdownHeadingPrefix(text)), {
    bold: true,
    alignment: AlignmentType.LEFT,
    heading: HeadingLevel.HEADING_2,
    spacingBefore: 120, // Thu gọn khoảng cách trước các phần I, II, III
    spacingAfter: 50,
  });

const createSubHeading = (text: string): Paragraph =>
  createParagraph(cleanPlainText(removeMarkdownHeadingPrefix(text)), {
    bold: true,
    italics: true,
    alignment: AlignmentType.LEFT,
    heading: HeadingLevel.HEADING_3,
    spacingBefore: 80,
    spacingAfter: 40,
  });

const createDocxTable = (rawRows: string[][], currentSectionTitle = ''): Table | null => {
  const rows = rawRows.filter((row) => row.length && !isMarkdownSeparatorRow(row));
  if (rows.length < 2) return null;

  const header = rows[0].map((cell) => cell.toLowerCase());
  const isAnswerSection = currentSectionTitle.toUpperCase().includes('ĐÁP ÁN');
  const isMatchingTable =
    !isAnswerSection &&
    rows[0].length === 2 &&
    header.some((cell) => cell.includes('cột a')) &&
    header.some((cell) => cell.includes('cột b'));

  const normalizedRows = isMatchingTable
    ? rows.map((row, rowIndex) => {
        if (rowIndex === 0) return [...row, 'Trả lời'];
        return [...row, `${rowIndex} - ....`];
      })
    : rows;

  const columnCount = Math.max(...normalizedRows.map((row) => row.length));
  const columnWidth = Math.floor(100 / Math.max(columnCount, 1));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: TABLE_BORDER,
      bottom: TABLE_BORDER,
      left: TABLE_BORDER,
      right: TABLE_BORDER,
      insideHorizontal: TABLE_BORDER,
      insideVertical: TABLE_BORDER,
    },
    rows: normalizedRows.map((row, rowIndex) => {
      const paddedRow = [...row];
      while (paddedRow.length < columnCount) paddedRow.push('');

      return new TableRow({
        children: paddedRow.map((cell) =>
          new TableCell({
            width: { size: columnWidth, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 60, bottom: 60, left: 80, right: 80 }, // Thu gọn padding trong bảng cho gọn
            children: [
              createParagraph(cell, {
                bold: rowIndex === 0,
                alignment: rowIndex === 0 ? AlignmentType.CENTER : AlignmentType.LEFT,
                spacingAfter: 0,
              }),
            ],
          })
        ),
      });
    }),
  });
};

const findHeadingLineIndex = (lines: string[], keywords: string[], startAt = 0): number => {
  let inCodeBlock = false;
  for (let i = startAt; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const isHeadingLine =
      trimmed.startsWith('#') || /^(I|II|III|IV|V|VI|VII|VIII|IX|X)\.\s+/i.test(cleanPlainText(trimmed));
    if (!isHeadingLine) continue;

    const plain = cleanPlainText(removeMarkdownHeadingPrefix(trimmed)).toUpperCase();
    if (keywords.some((keyword) => plain.includes(keyword.toUpperCase()))) {
      return i;
    }
  }
  return -1;
};

const extractBetweenKeywords = (text: string, startKeywords: string[], endKeywords: string[]): string => {
  const lines = text.split(/\r?\n/);
  const start = findHeadingLineIndex(lines, startKeywords);
  if (start === -1) return '';

  let end = lines.length;
  for (const keyword of endKeywords) {
    const index = findHeadingLineIndex(lines, [keyword], start + 1);
    if (index !== -1) end = Math.min(end, index);
  }

  return lines.slice(start, end).join('\n').trim();
};

const removeLeadingSectionHeading = (section: string): string => {
  const lines = section.split(/\r?\n/);
  if (!lines.length) return section;
  const first = cleanPlainText(removeMarkdownHeadingPrefix(lines[0])).toUpperCase();
  if (/^(I|II|III|IV|V|VI|VII|VIII|IX|X)\./.test(first) || first.includes('ĐỀ BÀI') || first.includes('ĐÁP ÁN')) {
    return lines.slice(1).join('\n').trim();
  }
  return section;
};

const getTitleFromContent = (text: string): string => {
  const firstLine = text.split(/\r?\n/).find((line) => cleanPlainText(line));
  if (!firstLine) return 'PHIẾU BÀI TẬP';
  return cleanPlainText(removeMarkdownHeadingPrefix(firstLine));
};

const buildStudentContent = (text: string): string => {
  const title = getTitleFromContent(text);
  const objectives = removeLeadingSectionHeading(
    extractBetweenKeywords(text, ['MỤC TIÊU'], ['MA TRẬN', 'ĐỀ BÀI', 'ĐỌC HIỂU'])
  );

  let questionSection = extractBetweenKeywords(text, ['ĐỀ BÀI'], ['ĐÁP ÁN', 'GỢI Ý SỬ DỤNG CHO GIÁO VIÊN']);
  if (!questionSection) {
    questionSection = extractBetweenKeywords(text, ['ĐỌC HIỂU'], ['ĐÁP ÁN', 'GỢI Ý SỬ DỤNG']);
  }
  if (!questionSection) {
    const lines = text.split(/\r?\n/);
    const answerStart = findHeadingLineIndex(lines, ['ĐÁP ÁN']);
    questionSection = lines.slice(0, answerStart === -1 ? lines.length : answerStart).join('\n');
  }
  const questions = removeLeadingSectionHeading(questionSection);

  const objectivesText =
    objectives ||
    '- Ôn lại kiến thức trọng tâm của bài/chủ đề.\n- Luyện tập các dạng bài từ cơ bản đến vận dụng.\n- Tự kiểm tra kết quả sau khi hoàn thành.';
  return `# ${title}

Họ và tên: ............................................................    Lớp: ............
Ngày làm bài: ....../....../......        Thời gian hoàn thành: ........ phút

## I. CON CẦN ÔN NHỮNG GÌ?
${objectivesText}

## II. HƯỚNG DẪN LÀM BÀI
- Con đọc kĩ yêu cầu trước khi làm.
- Với câu trắc nghiệm, khoanh vào chữ cái trước đáp án đúng.
- Với câu Đúng/Sai, ghi Đ hoặc S vào ô trống.
- Với câu nối cột, ghi kết quả vào cột Trả lời theo mẫu 1 - A, 2 - B.
- Với câu tự luận, con trình bày bài làm rõ ràng vào phần để trống.

## III. ĐỀ BÀI
${questions}

## IV. CON TỰ ĐÁNH GIÁ SAU KHI LÀM BÀI
□ Con làm tốt hầu hết các câu.
□ Con còn khó ở một số câu.
□ Con cần thầy/cô hướng dẫn thêm.
Câu con muốn hỏi lại thầy/cô: ........................................................................

## V. NHẬN XÉT CỦA GIÁO VIÊN
........................................................................................................
........................................................................................................
`;
};

const parseContentToDocxBlocks = async (
  text: string,
  uploadedImages: Record<string, string>,
  options?: { addPageBreakBeforeAnswers?: boolean }
): Promise<DocxBlock[]> => {
  const lines = text.split(/\r?\n/);
  const blocks: DocxBlock[] = [];
  let currentSectionTitle = '';
  let answerPageBreakAdded = false;

  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed || isOnlySeparator(trimmed)) {
      if (blocks.length && !(blocks[blocks.length - 1] instanceof Table)) {
        blocks.push(createParagraph('', { spacingAfter: 40 }));
      }
      continue;
    }

    if (trimmed.startsWith('```svg') || trimmed.startsWith('```worksheet-image')) {
      const isSvgBlock = trimmed.startsWith('```svg');
      const innerLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        innerLines.push(lines[i]);
        i += 1;
      }
      const blockBody = innerLines.join('\n').trim();

      if (isSvgBlock && blockBody.includes('<svg')) {
        const sizeAttr = (extractSvgAttribute(blockBody, 'data-size') as ImageSize) || 'md';
        const rendered = await renderVisualToPngBuffer(blockBody, true, sizeAttr);
        if (rendered) {
          blocks.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 40, after: 60 }, // Thu gọn khoảng cách trống trên/dưới hình ảnh SVG
              children: [
                new ImageRun({
                  data: rendered.data,
                  transformation: { width: rendered.width, height: rendered.height },
                  type: 'png',
                } as any),
              ],
            })
          );
        }
      } else if (!isSvgBlock) {
        try {
          const meta: WorksheetImageMeta = JSON.parse(blockBody);
          const dataUrl = uploadedImages[meta.id];
          if (dataUrl) {
            const rendered = await renderVisualToPngBuffer(dataUrl, false, meta.size || 'md');
            if (rendered) {
              blocks.push(
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 40, after: 60 }, // Thu gọn khoảng cách trống trên/dưới hình ảnh chèn
                  children: [
                    new ImageRun({
                      data: rendered.data,
                      transformation: { width: rendered.width, height: rendered.height },
                      type: 'png',
                    } as any),
                  ],
                })
              );
            }
          }
        } catch {
          // Bỏ qua nếu JSON lỗi
        }
      }
      continue;
    }

    if (isTableLikeLine(trimmed)) {
      const tableLines: string[] = [];
      while (i < lines.length && isTableLikeLine(lines[i].trim())) {
        tableLines.push(lines[i]);
        i += 1;
      }
      i -= 1;

      const rows = tableLines.map(parseTableRow).filter((row) => row.length > 0 && !isMarkdownSeparatorRow(row));
      const table = createDocxTable(rows, currentSectionTitle);
      if (table) {
        blocks.push(table);
        blocks.push(createParagraph('', { spacingAfter: 50 }));
      } else {
        rows.flat().forEach((cell) => {
          if (cell) blocks.push(createParagraph(cell));
        });
      }
      continue;
    }

    const plainLine = cleanPlainText(removeMarkdownHeadingPrefix(trimmed));
    const upperLine = plainLine.toUpperCase();

    if (trimmed.startsWith('# ')) {
      currentSectionTitle = upperLine;
      blocks.push(createTitleParagraph(trimmed));
      continue;
    }

    if (trimmed.startsWith('## ') || /^(I|II|III|IV|V|VI|VII|VIII|IX|X)\.\s+/.test(upperLine)) {
      currentSectionTitle = upperLine;
      if (
        options?.addPageBreakBeforeAnswers &&
        upperLine.includes('ĐÁP ÁN') &&
        !answerPageBreakAdded &&
        blocks.length > 0
      ) {
        blocks.push(new Paragraph({ children: [new PageBreak()] }));
        answerPageBreakAdded = true;
      }
      blocks.push(createSectionHeading(plainLine));
      continue;
    }

    if (trimmed.startsWith('### ') || /^[A-D]\.\s+/.test(upperLine)) {
      currentSectionTitle = upperLine;
      blocks.push(createSubHeading(plainLine));
      continue;
    }

    if (isDottedAnswerLine(trimmed)) {
      blocks.push(createDottedParagraph());
      continue;
    }

    if (isSpecialShortLabel(trimmed)) {
      blocks.push(
        createParagraph(normalizeLabelSpacing(stripListMarker(trimmed)), {
          bold: true,
          alignment: AlignmentType.LEFT,
          spacingBefore: 50,
          spacingAfter: 30,
        })
      );
      continue;
    }

    if (/^[-•●]\s+/.test(trimmed) || /^\*\s+/.test(trimmed)) {
      const bulletText = normalizeLabelSpacing(stripListMarker(trimmed));
      blocks.push(createParagraph(bulletText, { bullet: true, alignment: AlignmentType.LEFT, spacingAfter: 50 }));
      continue;
    }

    blocks.push(createParagraph(normalizeLabelSpacing(trimmed), { alignment: AlignmentType.LEFT }));
  }

  return blocks;
};

const createWordDocument = (blocks: DocxBlock[]): Document => {
  return new Document({
    styles: {
      paragraphStyles: [
        {
          id: 'Normal',
          name: 'Normal',
          run: {
            font: FONT_FAMILY,
            size: STANDARD_FONT_SIZE,
          },
          paragraph: {
            spacing: { line: 240, before: 0, after: 60 },
          },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1134,
              bottom: 1134,
              left: 1700,
              right: 1134,
            },
          },
        },
        children: blocks,
      },
    ],
  });
};

const saveBlobAsWord = async (doc: Document, filename: string) => {
  const blob = await Packer.toBlob(doc);
  const saveAs = (FileSaver as any).saveAs || FileSaver;
  saveAs(blob, filename);
};

const extractQuestionAnchors = (markdown: string): QuestionAnchor[] => {
  const lines = markdown.split(/\r?\n/);
  const answerStart = findHeadingLineIndex(lines, ['ĐÁP ÁN', 'GỢI Ý SỬ DỤNG CHO GIÁO VIÊN']);
  const maxLine = answerStart === -1 ? lines.length : answerStart;
  const anchors: QuestionAnchor[] = [];
  let inCodeBlock = false;

  for (let i = 0; i < maxLine; i += 1) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const plain = cleanPlainText(removeMarkdownHeadingPrefix(trimmed));
    if (/^(?:Câu|Bài)\s+\d+\b/i.test(plain)) {
      anchors.push({
        index: anchors.length,
        lineIndex: i,
        insertAfterLine: i,
        label: plain.length > 75 ? `${plain.slice(0, 75)}...` : plain,
      });
    }
  }

  return anchors;
};

const WorksheetDisplay: React.FC<WorksheetDisplayProps> = ({ content, onReset }) => {
  const [editableContent, setEditableContent] = useState<string>(() => normalizeSvgBlocksInMarkdown(content));
  const [uploadedImages, setUploadedImages] = useState<Record<string, string>>({});
  const [showImageManager, setShowImageManager] = useState<boolean>(false);
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState<number>(0);
  const [selectedNewSize, setSelectedNewSize] = useState<ImageSize>('md');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const fileInputRef = useRef<NullableInput>(null);
  const replaceFileInputRef = useRef<NullableInput>(null);
  const replaceTargetRef = useRef<NullableReplaceTarget>(null);

  useEffect(() => {
    setEditableContent(normalizeSvgBlocksInMarkdown(content));
  }, [content]);

  const questionAnchors = useMemo(() => extractQuestionAnchors(editableContent), [editableContent]);

  useEffect(() => {
    if (selectedQuestionIdx >= questionAnchors.length) {
      setSelectedQuestionIdx(0);
    }
  }, [questionAnchors.length, selectedQuestionIdx]);

  const insertImageBlockAtQuestion = (dataUrl: string, anchorIdx: number, size: ImageSize) => {
    const id = `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setUploadedImages((prev) => ({ ...prev, [id]: dataUrl }));

    const meta: WorksheetImageMeta = { id, size, alt: 'Hình minh họa bài tập' };
    const blockString = `\n\`\`\`worksheet-image\n${JSON.stringify(meta)}\n\`\`\`\n`;

    const lines = editableContent.split(/\r?\n/);
    const targetAnchor = questionAnchors[anchorIdx];
    const insertLine = targetAnchor ? targetAnchor.insertAfterLine + 1 : lines.length;

    lines.splice(insertLine, 0, blockString);
    setEditableContent(lines.join('\n'));
  };

  const handleFileUploadForQuestion = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        insertImageBlockAtQuestion(reader.result, selectedQuestionIdx, selectedNewSize);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePasteImage = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i += 1) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              insertImageBlockAtQuestion(reader.result, selectedQuestionIdx, selectedNewSize);
            }
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    }
  };

  const updateSvgSize = (svgId: string, newSize: ImageSize) => {
    setEditableContent((prev) =>
      prev.replace(/```svg\s*\r?\n([\s\S]*?)\r?\n```/gi, (fullMatch, svgBody: string) => {
        if (extractSvgAttribute(svgBody, 'data-svg-id') !== svgId) return fullMatch;
        const updated = svgBody.replace(/data-size=["'][^"']*["']/i, `data-size="${newSize}"`);
        return `\`\`\`svg\n${updated}\n\`\`\``;
      })
    );
  };

  const removeSvgBlock = (svgId: string) => {
    setEditableContent((prev) =>
      prev.replace(/```svg\s*\r?\n([\s\S]*?)\r?\n```\r?\n?/gi, (fullMatch, svgBody: string) => {
        if (extractSvgAttribute(svgBody, 'data-svg-id') === svgId) return '';
        return fullMatch;
      })
    );
  };

  const updateUploadedImageSize = (imageId: string, newSize: ImageSize) => {
    setEditableContent((prev) =>
      prev.replace(/```worksheet-image\s*\r?\n([\s\S]*?)\r?\n```/gi, (fullMatch, jsonStr: string) => {
        try {
          const meta: WorksheetImageMeta = JSON.parse(jsonStr.trim());
          if (meta.id !== imageId) return fullMatch;
          return `\`\`\`worksheet-image\n${JSON.stringify({ ...meta, size: newSize })}\n\`\`\``;
        } catch {
          return fullMatch;
        }
      })
    );
  };

  const removeUploadedImageBlock = (imageId: string) => {
    setEditableContent((prev) =>
      prev.replace(/```worksheet-image\s*\r?\n([\s\S]*?)\r?\n```\r?\n?/gi, (fullMatch, jsonStr: string) => {
        try {
          const meta: WorksheetImageMeta = JSON.parse(jsonStr.trim());
          if (meta.id === imageId) return '';
          return fullMatch;
        } catch {
          return fullMatch;
        }
      })
    );
  };

  const triggerReplaceVisual = (type: 'svg' | 'image', id: string) => {
    replaceTargetRef.current = { type, id };
    replaceFileInputRef.current?.click();
  };

  const handleReplaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const target = replaceTargetRef.current;
    if (!file || !target) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== 'string') return;

      if (target.type === 'image') {
        setUploadedImages((prev) => ({ ...prev, [target.id]: dataUrl }));
      } else {
        const newId = `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        setUploadedImages((prev) => ({ ...prev, [newId]: dataUrl }));
        const newMeta: WorksheetImageMeta = { id: newId, size: 'md', alt: 'Hình minh họa thay thế' };

        setEditableContent((prev) =>
          prev.replace(/```svg\s*\r?\n([\s\S]*?)\r?\n```/gi, (fullMatch, svgBody: string) => {
            if (extractSvgAttribute(svgBody, 'data-svg-id') !== target.id) return fullMatch;
            return `\n\`\`\`worksheet-image\n${JSON.stringify(newMeta)}\n\`\`\`\n`;
          })
        );
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCopy = () => {
    const cleanCopy = editableContent
      .replace(/```worksheet-image[\s\S]*?```/g, '[Hình minh họa]')
      .replace(/```svg[\s\S]*?```/g, '[Hình minh họa]');
    navigator.clipboard.writeText(cleanCopy);
    alert('Đã sao chép nội dung vào bộ nhớ đệm!');
  };

  const handleDownloadWord = async (mode: ExportMode) => {
    try {
      setIsExporting(true);
      const exportContent = mode === 'student' ? buildStudentContent(editableContent) : editableContent;
      const blocks = await parseContentToDocxBlocks(exportContent, uploadedImages, {
        addPageBreakBeforeAnswers: true,
      });
      const doc = createWordDocument(blocks);
      const filename = mode === 'student' ? 'PhieuBaiTap_BanLamBai.docx' : 'PhieuBaiTap_DapAn.docx';
      await saveBlobAsWord(doc, filename);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <input
        ref={replaceFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleReplaceFileChange}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-teal-800 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-teal-600 flex-shrink-0" />
            Phiếu Bài Tập Hoàn Chỉnh
          </h2>
          <p className="text-slate-500 text-sm mt-1 ml-8 md:ml-0">
            Có thể thêm/đổi ảnh minh họa cho từng câu trước khi xuất file Word
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setShowImageManager((prev) => !prev)}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 border rounded-lg font-medium shadow-sm transition-all text-sm whitespace-nowrap ${
              showImageManager
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
            }`}
            title="Chèn thêm hoặc dán ảnh minh họa vào từng câu hỏi"
          >
            <ImagePlus className="w-4 h-4" />
            <span>Chèn ảnh vào câu</span>
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:text-teal-700 hover:border-teal-200 font-medium shadow-sm transition-all text-sm whitespace-nowrap"
            title="Sao chép văn bản"
          >
            <FileText className="w-4 h-4" /> <span className="hidden sm:inline">Sao chép</span>
          </button>
          <button
            type="button"
            disabled={isExporting}
            onClick={() => handleDownloadWord('teacher')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white border border-blue-600 rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-all text-sm whitespace-nowrap disabled:opacity-60"
            title="Tải bản đáp án: có đề bài, hình ảnh, đáp án và hướng dẫn giáo viên"
          >
            <FileText className="w-4 h-4" /> <span className="hidden sm:inline">Bản đáp án</span>
          </button>
          <button
            type="button"
            disabled={isExporting}
            onClick={() => handleDownloadWord('student')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white border border-emerald-600 rounded-lg hover:bg-emerald-700 font-medium shadow-sm transition-all text-sm whitespace-nowrap disabled:opacity-60"
            title="Tải bản làm bài cho học sinh (giữ nguyên hình ảnh minh họa, ẩn đáp án)"
          >
            <Users className="w-4 h-4" /> <span className="hidden sm:inline">Bản làm bài</span>
          </button>
          <button
            type="button"
            onClick={onReset}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium shadow-md transition-all active:scale-95 text-sm whitespace-nowrap"
          >
            <RefreshCcw className="w-4 h-4" /> Tạo Mới
          </button>
        </div>
      </div>

      {showImageManager && (
        <div
          onPaste={handlePasteImage}
          className="mb-5 rounded-2xl border-2 border-amber-200 bg-amber-50/80 p-4 shadow-sm transition-all"
        >
          <div className="flex flex-col md:flex-row md:items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-extrabold uppercase tracking-wide text-amber-900 mb-1.5">
                1. Chọn câu hỏi cần chèn hình minh họa
              </label>
              <select
                value={selectedQuestionIdx}
                onChange={(e) => setSelectedQuestionIdx(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-white border border-amber-300 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-amber-300"
              >
                {questionAnchors.length === 0 ? (
                  <option value={0}>Chèn vào cuối phiếu bài tập</option>
                ) : (
                  questionAnchors.map((q) => (
                    <option key={q.index} value={q.index}>
                      {q.label}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wide text-amber-900 mb-1.5">
                2. Cỡ ảnh khi in
              </label>
              <select
                value={selectedNewSize}
                onChange={(e) => setSelectedNewSize(e.target.value as ImageSize)}
                className="w-full md:w-36 px-3 py-2.5 bg-white border border-amber-300 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-amber-300"
              >
                <option value="sm">Nhỏ (Gọn)</option>
                <option value="md">Vừa (Chuẩn A4)</option>
                <option value="lg">Lớn (Sơ đồ rộng)</option>
              </select>
            </div>

            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUploadForQuestion}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl shadow-sm transition-all"
              >
                <Upload className="w-4 h-4" />
                Chọn ảnh từ máy
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-amber-800 bg-white/70 border border-dashed border-amber-300 rounded-xl px-3 py-2">
            <ClipboardPaste className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Mẹo nhanh:</strong> Thầy/cô có thể chụp màn hình SGK hoặc phần mềm (phím{' '}
              <code className="px-1 py-0.5 bg-amber-100 rounded">Win + Shift + S</code>), sau đó nhấp vào khung màu vàng
              này và bấm <code className="px-1 py-0.5 bg-amber-100 rounded">Ctrl + V</code> để dán thẳng ảnh vào câu đã
              chọn.
            </span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-4 md:p-12 min-h-[60vh] max-h-[80vh] overflow-y-auto custom-scrollbar">
        <article
          id="markdown-content"
          className="prose prose-slate prose-base md:prose-lg max-w-none
            prose-headings:text-teal-900 prose-headings:font-bold
            prose-h1:text-center prose-h1:text-2xl md:prose-h1:text-3xl prose-h1:mb-6 md:prose-h1:mb-8
            prose-h2:text-lg md:prose-h2:text-xl prose-h2:border-b-2 prose-h2:border-teal-100 prose-h2:pb-2 prose-h2:mt-6 md:prose-h2:mt-8
            prose-h3:text-base md:prose-h3:text-lg prose-h3:text-teal-700 prose-h3:italic
            prose-p:text-slate-700 prose-p:leading-relaxed
            prose-li:text-slate-700 prose-li:my-1
            prose-strong:text-slate-900 prose-strong:font-bold
            marker:text-teal-500"
        >
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              pre: ({ children }) => <div className="not-prose my-3">{children}</div>,
              code: ({ className, children, ...props }) => {
                const rawText = String(children).trim();

                if (className?.includes('language-svg') && rawText.startsWith('<svg')) {
                  const svgId = extractSvgAttribute(rawText, 'data-svg-id') || 'svg_default';
                  const currentSize = (extractSvgAttribute(rawText, 'data-size') as ImageSize) || 'md';
                  const encodedSvg = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(rawText)}`;

                  return (
                    <div className="my-3 flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
                      <img
                        src={encodedSvg}
                        alt="Hình minh họa AI"
                        className={`${SIZE_HEIGHT_CLASSES[currentSize]} w-auto object-contain rounded-lg bg-white p-2 shadow-sm`}
                      />
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs print:hidden">
                        {(['sm', 'md', 'lg'] as ImageSize[]).map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => updateSvgSize(svgId, sz)}
                            className={`px-2 py-1 rounded-md font-semibold transition-all ${
                              currentSize === sz
                                ? 'bg-teal-600 text-white'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {sz === 'sm' ? 'Nhỏ' : sz === 'md' ? 'Vừa' : 'Lớn'}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => triggerReplaceVisual('svg', svgId)}
                          className="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 font-semibold flex items-center gap-1"
                        >
                          <Upload className="w-3 h-3" /> Đổi ảnh
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSvgBlock(svgId)}
                          className="px-2 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Xóa
                        </button>
                      </div>
                    </div>
                  );
                }

                if (className?.includes('language-worksheet-image')) {
                  try {
                    const meta: WorksheetImageMeta = JSON.parse(rawText);
                    const dataUrl = uploadedImages[meta.id];
                    if (!dataUrl) return null;
                    const currentSize = meta.size || 'md';

                    return (
                      <div className="my-3 flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
                        <img
                          src={dataUrl}
                          alt={meta.alt || 'Hình minh họa'}
                          className={`${SIZE_HEIGHT_CLASSES[currentSize]} w-auto object-contain rounded-lg bg-white p-1.5 shadow-sm`}
                        />
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs print:hidden">
                          {(['sm', 'md', 'lg'] as ImageSize[]).map((sz) => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => updateUploadedImageSize(meta.id, sz)}
                              className={`px-2 py-1 rounded-md font-semibold transition-all ${
                                currentSize === sz
                                  ? 'bg-teal-600 text-white'
                                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {sz === 'sm' ? 'Nhỏ' : sz === 'md' ? 'Vừa' : 'Lớn'}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => triggerReplaceVisual('image', meta.id)}
                            className="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 font-semibold flex items-center gap-1"
                          >
                            <Upload className="w-3 h-3" /> Đổi ảnh
                          </button>
                          <button
                            type="button"
                            onClick={() => removeUploadedImageBlock(meta.id)}
                            className="px-2 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-semibold flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Xóa
                          </button>
                        </div>
                      </div>
                    );
                  } catch {
                    return null;
                  }
                }

                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {editableContent}
          </ReactMarkdown>
        </article>
      </div>

      <div className="text-center mt-6 text-slate-400 text-xs md:text-sm italic">
        * Nội dung và hình vẽ được tạo tự động bởi AI. Giáo viên có thể bấm "Chèn ảnh vào câu" để thêm hoặc thay thế hình minh họa trước khi tải file Word.
      </div>
    </div>
  );
};

export default WorksheetDisplay;