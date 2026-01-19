import React, { useState, useEffect } from 'react';
import WorksheetForm from './components/WorksheetForm';
import WorksheetDisplay from './components/WorksheetDisplay';
import { generateWorksheet, validateApiKey } from './services/geminiService';
import { WorksheetRequest } from './types';
import { BookOpenCheck, Key, ExternalLink, Save, CheckCircle2, AlertCircle } from 'lucide-react';

function App() {
  const [worksheetContent, setWorksheetContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);
  const [isCheckingKey, setIsCheckingKey] = useState<boolean>(false);

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    } else {
      setShowApiKeyInput(true);
    }
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;

    setIsCheckingKey(true);
    setError(null);

    try {
      const isValid = await validateApiKey(apiKey.trim());
      
      if (isValid) {
        localStorage.setItem('gemini_api_key', apiKey.trim());
        setShowApiKeyInput(false);
        setError(null);
      } else {
        setError("API Key không hợp lệ hoặc không có quyền truy cập. Vui lòng kiểm tra lại.");
      }
    } catch (err) {
      setError("Đã xảy ra lỗi khi kiểm tra API Key.");
    } finally {
      setIsCheckingKey(false);
    }
  };

  const handleGenerate = async (request: WorksheetRequest) => {
    if (!apiKey) {
      setError("Vui lòng nhập API Key để sử dụng.");
      setShowApiKeyInput(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setWorksheetContent('');

    try {
      const stream = await generateWorksheet(request, apiKey);
      const reader = stream.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setWorksheetContent((prev) => prev + value);
      }
    } catch (err: any) {
      console.error(err);
      setError("Đã xảy ra lỗi. Vui lòng kiểm tra lại API Key hoặc thử lại sau.");
      if (err.toString().includes("API Key")) {
        setShowApiKeyInput(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setWorksheetContent('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans">
        {/* Background Decorative Elements - Soft Teal & Blue */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <header className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm mb-4 border border-teal-100">
             <BookOpenCheck className="w-8 h-8 text-teal-600" />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-800 mb-3 tracking-tight">
            Trợ Lý Học Tập <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">Tiểu Học</span>
          </h1>
          <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-6">
            Hỗ trợ giáo viên và phụ huynh tạo phiếu bài tập chuẩn chương trình GDPT 2018 <br className="hidden md:block" />
            <span className="font-semibold text-teal-700">Trường PTDTBT Tiểu học Giàng Chu Phìn</span>.
          </p>

          {/* API Key Management */}
          <div className="max-w-xl mx-auto">
            {!showApiKeyInput && apiKey ? (
              <button 
                onClick={() => setShowApiKeyInput(true)}
                className="text-xs text-slate-400 hover:text-teal-600 flex items-center justify-center gap-1 mx-auto"
              >
                <Key className="w-3 h-3" /> Đổi API Key
              </button>
            ) : (
              <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200 animate-fade-in">
                <label className="block text-sm font-bold text-slate-700 mb-2 text-left">
                  Nhập Google Gemini API Key
                </label>
                <div className="flex gap-2">
                  <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Paste key vào đây (bắt đầu bằng AIza...)"
                    className="flex-1 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    disabled={isCheckingKey}
                  />
                  <button 
                    onClick={handleSaveApiKey}
                    disabled={isCheckingKey || !apiKey}
                    className={`text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 min-w-[140px] justify-center transition-all ${
                        isCheckingKey || !apiKey 
                        ? 'bg-slate-400 cursor-not-allowed' 
                        : 'bg-teal-600 hover:bg-teal-700'
                    }`}
                  >
                    {isCheckingKey ? (
                        <>
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Kiểm tra...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-4 h-4" /> Kiểm tra & Lưu
                        </>
                    )}
                  </button>
                </div>
                <div className="text-left mt-2 text-xs text-slate-500 flex items-center gap-1">
                   Chưa có Key? 
                   <a 
                     href="https://aistudio.google.com/app/apikey" 
                     target="_blank" 
                     rel="noreferrer"
                     className="text-teal-600 font-bold hover:underline flex items-center"
                   >
                     Lấy miễn phí tại Google AI Studio <ExternalLink className="w-3 h-3 ml-0.5"/>
                   </a>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="max-w-4xl mx-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl shadow-sm flex items-center justify-between animate-fade-in">
              <span className="flex items-center gap-2"><AlertCircle className="w-5 h-5"/> {error}</span>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold px-2">✕</button>
            </div>
          )}

          {!worksheetContent && !isLoading && !error && (
            <div className="animate-fade-in space-y-12">
                 <WorksheetForm onSubmit={handleGenerate} isLoading={isLoading} />
                 
                 {/* Quick Tips Section */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-2xl mb-4 text-blue-500">📚</div>
                        <h3 className="font-bold text-slate-800 text-lg mb-2">Bám Sát SGK</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">Nội dung được trích xuất chuẩn xác từ bộ sách "Kết nối tri thức với cuộc sống".</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-2xl mb-4 text-emerald-500">📊</div>
                        <h3 className="font-bold text-slate-800 text-lg mb-2">Chuẩn Ma Trận</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">Cấu trúc đề theo Thông tư 27: 40% Biết - 30% Hiểu - 30% Vận dụng.</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-2xl mb-4 text-amber-500">⚡</div>
                        <h3 className="font-bold text-slate-800 text-lg mb-2">Tạo Nhanh Chóng</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">Chỉ cần nhập tên bài, hệ thống sẽ tự động soạn đề trong vài giây.</p>
                    </div>
                 </div>
            </div>
          )}

          {(isLoading || worksheetContent) && (
            <div className="w-full">
                {isLoading && !worksheetContent ? (
                    <div className="text-center py-20 animate-pulse">
                         <div className="inline-block p-6 bg-white rounded-full shadow-lg border border-teal-50 mb-6">
                            <SparklesLoading />
                         </div>
                         <h3 className="text-xl font-semibold text-slate-800">Đang soạn giáo án...</h3>
                         <p className="mt-2 text-slate-500">Vui lòng đợi trong giây lát</p>
                    </div>
                ) : (
                    <WorksheetDisplay content={worksheetContent} onReset={handleReset} />
                )}
            </div>
          )}
        </main>

        <footer className="text-center mt-20 pb-8 text-slate-400 text-xs font-medium tracking-wide">
          <p>© {new Date().getFullYear()} LƯU HÀNH NỘI BỘ</p>
        </footer>
      </div>
    </div>
  );
}

const SparklesLoading = () => (
    <svg className="w-10 h-10 text-teal-500 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
)

export default App;