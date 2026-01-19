import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Copy, Download, RefreshCcw, CheckCircle, FileText } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak, AlignmentType } from 'docx';
import FileSaver from 'file-saver';

interface WorksheetDisplayProps {
  content: string;
  onReset: () => void;
}

const WorksheetDisplay: React.FC<WorksheetDisplayProps> = ({ content, onReset }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    alert('Đã sao chép nội dung vào bộ nhớ đệm!');
  };

  /**
   * Cleans LaTeX strings for plain text/Word readability
   */
  const cleanLatex = (text: string): string => {
    return text
      .replace(/\$([^$]+)\$/g, '$1') // Remove $ symbols
      .replace(/\\text\{([^}]+)\}/g, '$1') // Remove \text{}
      .replace(/\\times/g, ' × ')
      .replace(/\\div/g, ' ÷ ')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, ' $1/$2 ') // Simple fraction fallback
      .replace(/\^\{?([^}]+)\}?/g, '$1') // Power to plain text (simple)
      .replace(/\\dots/g, '...')
      .replace(/\\quad/g, '  ')
      .replace(/\\, /g, ' ');
  };

  const parseMarkdownToDocxParagraphs = (text: string): Paragraph[] => {
    const lines = text.split('\n');
    const paragraphs: Paragraph[] = [];

    // Decree 30 standard font size: 13-14pt. Using 13pt (26 half-points)
    const STANDARD_FONT_SIZE = 26; 
    const FONT_FAMILY = "Times New Roman";

    lines.forEach((line) => {
      let trimmedLine = line.trim();
      if (!trimmedLine) {
        paragraphs.push(new Paragraph({ text: "", spacing: { after: 100 } }));
        return;
      }

      // Heading 1 (#)
      if (trimmedLine.startsWith('# ')) {
        paragraphs.push(
          new Paragraph({
            text: cleanLatex(trimmedLine.replace('# ', '').toUpperCase()),
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 240, after: 240 },
            run: {
              font: FONT_FAMILY,
              size: STANDARD_FONT_SIZE,
              bold: true,
            },
          })
        );
        return;
      }

      // Heading 2 (##)
      if (trimmedLine.startsWith('## ')) {
        const headingText = trimmedLine.replace('## ', '');
        const isAnswerSection = headingText.toUpperCase().includes('ĐÁP ÁN') || headingText.toUpperCase().includes('PHẦN 2');

        if (isAnswerSection) {
            paragraphs.push(new Paragraph({ children: [new PageBreak()] }));
        }

        paragraphs.push(
          new Paragraph({
            text: cleanLatex(headingText),
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.LEFT,
            spacing: { before: 240, after: 120 },
            run: {
              font: FONT_FAMILY,
              size: STANDARD_FONT_SIZE,
              bold: true,
            },
          })
        );
        return;
      }

      // Heading 3 (###)
      if (trimmedLine.startsWith('### ')) {
        paragraphs.push(
          new Paragraph({
            text: cleanLatex(trimmedLine.replace('### ', '')),
            heading: HeadingLevel.HEADING_3,
            alignment: AlignmentType.LEFT,
            spacing: { before: 120, after: 120 },
            run: {
              font: FONT_FAMILY,
              size: STANDARD_FONT_SIZE,
              bold: true,
              italics: true,
            },
          })
        );
        return;
      }

      // Bullet points (* )
      if (trimmedLine.startsWith('* ')) {
        const textContent = cleanLatex(trimmedLine.replace('* ', ''));
        const parts = textContent.split('**');
        const children = parts.map((part, index) => {
            return new TextRun({
                text: part,
                bold: index % 2 !== 0,
                font: FONT_FAMILY,
                size: STANDARD_FONT_SIZE,
            });
        });

        paragraphs.push(
          new Paragraph({
            children: children,
            bullet: { level: 0 },
            spacing: { after: 100 },
          })
        );
        return;
      }

      // Regular paragraph
      const cleanLine = cleanLatex(trimmedLine);
      const parts = cleanLine.split('**');
      const children = parts.map((part, index) => {
          return new TextRun({
              text: part,
              bold: index % 2 !== 0,
              font: FONT_FAMILY,
              size: STANDARD_FONT_SIZE,
          });
      });

      paragraphs.push(
        new Paragraph({
          children: children,
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120, line: 276 },
        })
      );
    });

    return paragraphs;
  };

  const handleDownloadWord = async () => {
    const docParagraphs = parseMarkdownToDocxParagraphs(content);
    
    const doc = new Document({
      styles: {
        paragraphStyles: [
            {
                id: "Normal",
                name: "Normal",
                run: {
                    font: "Times New Roman",
                    size: 26, 
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
                    top: 1134, // 2cm
                    bottom: 1134, // 2cm
                    left: 1700, // 3cm
                    right: 850, // 1.5cm
                }
            }
          },
          children: docParagraphs,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const saveAs = (FileSaver as any).saveAs || FileSaver;
    saveAs(blob, "PhieuBaiTap.docx");
  };

  return (
    <div className="animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center mb-6 gap-4 border-b border-slate-200 pb-4">
        <div>
             <h2 className="text-2xl font-bold text-teal-800 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-teal-600" />
                Phiếu Bài Tập Hoàn Chỉnh
             </h2>
             <p className="text-slate-500 text-sm mt-1">Đã sẵn sàng để tải xuống</p>
        </div>
        
        <div className="flex gap-2">
            <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:text-teal-700 hover:border-teal-200 font-medium shadow-sm transition-all text-sm"
                title="Sao chép văn bản"
            >
                <Copy className="w-4 h-4" /> <span className="hidden sm:inline">Sao chép</span>
            </button>
            <button
                onClick={handleDownloadWord}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white border border-blue-600 rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-all text-sm"
                title="Tải xuống định dạng .docx (Word)"
            >
                <FileText className="w-4 h-4" /> <span className="hidden sm:inline">Tải Word</span>
            </button>
            <button
                onClick={onReset}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium shadow-md transition-all active:scale-95 text-sm"
            >
                <RefreshCcw className="w-4 h-4" /> Tạo Mới
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-8 md:p-12 min-h-[60vh] max-h-[80vh] overflow-y-auto custom-scrollbar">
        <article id="markdown-content" className="prose prose-slate prose-lg max-w-none 
            prose-headings:text-teal-900 prose-headings:font-bold 
            prose-h1:text-center prose-h1:text-3xl prose-h1:mb-8
            prose-h2:text-xl prose-h2:border-b-2 prose-h2:border-teal-100 prose-h2:pb-2 prose-h2:mt-8
            prose-h3:text-lg prose-h3:text-teal-700 prose-h3:italic
            prose-p:text-slate-700 prose-p:leading-relaxed
            prose-li:text-slate-700 prose-li:my-1
            prose-strong:text-slate-900 prose-strong:font-bold
            marker:text-teal-500">
          <ReactMarkdown 
            remarkPlugins={[remarkMath]} 
            rehypePlugins={[rehypeKatex]}
          >
            {content}
          </ReactMarkdown>
        </article>
      </div>
      
      <div className="text-center mt-6 text-slate-400 text-sm italic">
        * Nội dung được tạo tự động bởi AI. Giáo viên vui lòng kiểm tra lại trước khi sử dụng.
      </div>
    </div>
  );
};

export default WorksheetDisplay;