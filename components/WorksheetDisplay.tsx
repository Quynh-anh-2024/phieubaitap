import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { RefreshCcw, CheckCircle, FileText, Users } from 'lucide-react';
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
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

type ExportMode = 'teacher' | 'student_parent';

type DocxBlock = Paragraph | Table;

const FONT_FAMILY = 'Times New Roman';
const STANDARD_FONT_SIZE = 26; // 13pt
const TITLE_FONT_SIZE = 32; // 16pt
const TABLE_BORDER = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: '000000',
};

const removeMarkdownHeadingPrefix = (line: string): string =>
  line.replace(/^#{1,6}\s+/, '').trim();

const normalizeMathAndSymbols = (text: string): string => {
  let result = text || '';

  result = result
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\$\$([\s\S]*?)\$\$/g, '$1')
    .replace(/\$([^$]*)\$/g, '$1')
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1/$2')
    .replace(/\\dfrac\{([^{}]+)\}\{([^{}]+)\}/g, '$1/$2')
    .replace(/\\text\{([^{}]*)\}/g, '$1')
    .replace(/\\mathrm\{([^{}]*)\}/g, '$1')
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
    .replace(/\s+/g, ' ')
    .trim();

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
    alignment: options?.alignment || AlignmentType.JUSTIFIED,
    heading: options?.heading,
    bullet: options?.bullet ? { level: 0 } : undefined,
    spacing: {
      before: options?.spacingBefore ?? 0,
      after: options?.spacingAfter ?? 120,
      line: 276,
    },
  });
};

const createTitleParagraph = (text: string): Paragraph =>
  createParagraph(cleanPlainText(removeMarkdownHeadingPrefix(text)).toUpperCase(), {
    bold: true,
    alignment: AlignmentType.CENTER,
    heading: HeadingLevel.HEADING_1,
    spacingBefore: 120,
    spacingAfter: 240,
    size: TITLE_FONT_SIZE,
  });

const createSectionHeading = (text: string): Paragraph =>
  createParagraph(cleanPlainText(removeMarkdownHeadingPrefix(text)), {
    bold: true,
    alignment: AlignmentType.LEFT,
    heading: HeadingLevel.HEADING_2,
    spacingBefore: 240,
    spacingAfter: 120,
  });

const createSubHeading = (text: string): Paragraph =>
  createParagraph(cleanPlainText(removeMarkdownHeadingPrefix(text)), {
    bold: true,
    italics: true,
    alignment: AlignmentType.LEFT,
    heading: HeadingLevel.HEADING_3,
    spacingBefore: 160,
    spacingAfter: 100,
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
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
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
  for (let i = startAt; i < lines.length; i += 1) {
    const plain = cleanPlainText(removeMarkdownHeadingPrefix(lines[i])).toUpperCase();
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

const buildStudentParentContent = (text: string): string => {
  const title = getTitleFromContent(text);
  const objectives = removeLeadingSectionHeading(
    extractBetweenKeywords(text, ['MỤC TIÊU'], ['MA TRẬN', 'ĐỀ BÀI', 'ĐỌC HIỂU'])
  );

  const answerIndexContent = extractBetweenKeywords(text, ['ĐÁP ÁN'], ['GỢI Ý SỬ DỤNG CHO GIÁO VIÊN', 'HỌC SINH TỰ ĐÁNH GIÁ']);
  const answer = removeLeadingSectionHeading(answerIndexContent);

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

  const objectivesText = objectives || '- Ôn lại kiến thức trọng tâm của bài/chủ đề.\n- Luyện tập các dạng bài từ cơ bản đến vận dụng.\n- Tự kiểm tra kết quả sau khi hoàn thành.';
  const answerText = answer || 'Giáo viên cần kiểm tra lại đáp án trong bản giáo viên trước khi gửi cho phụ huynh.';

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

## V. PHỤ HUYNH THEO DÕI KẾT QUẢ
Số câu con làm đúng: ........../.......... câu
Những câu con làm tốt: ................................................................................
Những câu con cần ôn lại: ..............................................................................
Nhận xét của phụ huynh: ................................................................................
Chữ ký phụ huynh: ........................................

## VI. ĐÁP ÁN DÀNH CHO PHỤ HUYNH
Phụ huynh chỉ đối chiếu đáp án sau khi học sinh đã tự hoàn thành bài làm.
${answerText}

## VII. GỢI Ý PHỤ HUYNH HỖ TRỢ CON
- Không làm thay bài cho con; chỉ gợi ý để con tự sửa.
- Nếu con sai nhiều câu cơ bản, cho con ôn lại kiến thức trọng tâm trong 5-10 phút.
- Nếu con sai câu vận dụng, hỏi con: “Đề bài cho biết gì?”, “Đề bài hỏi gì?”, “Con cần làm bước nào trước?”.
- Ghi lại câu con còn khó để trao đổi thêm với giáo viên khi cần.
`;
};

const parseContentToDocxBlocks = (text: string, options?: { addPageBreakBeforeAnswers?: boolean }): DocxBlock[] => {
  const lines = text.split(/\r?\n/);
  const blocks: DocxBlock[] = [];
  let currentSectionTitle = '';
  let answerPageBreakAdded = false;

  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed || isOnlySeparator(trimmed)) {
      if (blocks.length && !(blocks[blocks.length - 1] instanceof Table)) {
        blocks.push(createParagraph('', { spacingAfter: 60 }));
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
        blocks.push(createParagraph('', { spacingAfter: 80 }));
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

    if (/^[-•●]\s+/.test(trimmed) || /^\*\s+/.test(trimmed)) {
      const bulletText = trimmed.replace(/^[-•●]\s+/, '').replace(/^\*\s+/, '');
      blocks.push(createParagraph(bulletText, { bullet: true, spacingAfter: 80 }));
      continue;
    }

    blocks.push(createParagraph(trimmed));
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
            spacing: { line: 276, before: 0, after: 0 },
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

const WorksheetDisplay: React.FC<WorksheetDisplayProps> = ({ content, onReset }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    alert('Đã sao chép nội dung vào bộ nhớ đệm!');
  };

  const handleDownloadWord = async (mode: ExportMode) => {
    const exportContent = mode === 'student_parent' ? buildStudentParentContent(content) : content;
    const blocks = parseContentToDocxBlocks(exportContent, { addPageBreakBeforeAnswers: true });
    const doc = createWordDocument(blocks);
    const filename = mode === 'student_parent' ? 'PhieuBaiTap_HocSinh_PHHS.docx' : 'PhieuBaiTap_GiaoVien.docx';
    await saveBlobAsWord(doc, filename);
  };

  return (
    <div className="animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-teal-800 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-teal-600 flex-shrink-0" />
            Phiếu Bài Tập Hoàn Chỉnh
          </h2>
          <p className="text-slate-500 text-sm mt-1 ml-8 md:ml-0">Đã sẵn sàng để tải xuống</p>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={handleCopy}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:text-teal-700 hover:border-teal-200 font-medium shadow-sm transition-all text-sm whitespace-nowrap"
            title="Sao chép văn bản"
          >
            <FileText className="w-4 h-4" /> <span className="hidden sm:inline">Sao chép</span>
          </button>
          <button
            onClick={() => handleDownloadWord('teacher')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white border border-blue-600 rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-all text-sm whitespace-nowrap"
            title="Tải bản giáo viên: có mục tiêu, ma trận, đề bài, đáp án, hướng dẫn"
          >
            <FileText className="w-4 h-4" /> <span className="hidden sm:inline">Bản GV</span>
          </button>
          <button
            onClick={() => handleDownloadWord('student_parent')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white border border-emerald-600 rounded-lg hover:bg-emerald-700 font-medium shadow-sm transition-all text-sm whitespace-nowrap"
            title="Tải bản học sinh + phụ huynh: có đề, tự đánh giá, phụ huynh theo dõi, đáp án ở cuối"
          >
            <Users className="w-4 h-4" /> <span className="hidden sm:inline">HS + PHHS</span>
          </button>
          <button
            onClick={onReset}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium shadow-md transition-all active:scale-95 text-sm whitespace-nowrap"
          >
            <RefreshCcw className="w-4 h-4" /> Tạo Mới
          </button>
        </div>
      </div>

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
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {content}
          </ReactMarkdown>
        </article>
      </div>

      <div className="text-center mt-6 text-slate-400 text-xs md:text-sm italic">
        * Nội dung được tạo tự động bởi AI. Giáo viên vui lòng kiểm tra lại trước khi sử dụng.
      </div>
    </div>
  );
};

export default WorksheetDisplay;
