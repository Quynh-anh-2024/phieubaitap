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
    <div className="min-h-screen relative overflow-hidden">
        {/* Background Decorative Blobs - More Vibrant */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{animationDelay: '4s'}}></div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <header className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-white rounded-3xl shadow-lg mb-4 border-4 border-teal-100 transform hover:scale-110 transition-transform duration-300">
             <BookOpenCheck className="w-10 h-10 text-teal-500" />
          </div>
          <h1 className="text-3xl md:text-6xl font-extrabold text-slate-800 mb-3 tracking-tight drop-shadow-sm font-display">
            Trợ Lý <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-500">Tiểu Học</span>
          </h1>
          <p className="text-base md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8 font-medium">
            Hỗ trợ giáo viên & phụ huynh tạo phiếu bài tập <br className="hidden md:block" />
            <span className="inline-block bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-bold mt-2">PTDTBT Tiểu học Giàng Chu Phìn</span>
          </p>

          {/* API Key Management */}
          <div className="max-w-xl mx-auto">
            {!showApiKeyInput && apiKey ? (
              <button 
                onClick={() => setShowApiKeyInput(true)}
                className="text-sm font-bold text-slate-400 hover:text-teal-600 flex items-center justify-center gap-2 mx-auto bg-white/50 px-4 py-2 rounded-full border border-slate-200 hover:bg-white transition-all"
              >
                <Key className="w-4 h-4" /> Đổi API Key
              </button>
            ) : (
              <div className="glass-panel p-6 animate-fade-in">
                <label className="block text-base font-bold text-slate-700 mb-3 text-left font-display">
                  🔑 Nhập Google Gemini API Key
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Paste key vào đây (bắt đầu bằng AIza...)"
                    className="flex-1 p-4 border-2 border-slate-200 rounded-2xl text-base focus:ring-4 focus:ring-teal-100 focus:border-teal-400 outline-none transition-all shadow-inner bg-white/80 backdrop-blur-sm"
                    disabled={isCheckingKey}
                  />
                  <button 
                    onClick={handleSaveApiKey}
                    disabled={isCheckingKey || !apiKey}
                    className={`text-white px-6 py-3 rounded-2xl text-base font-bold flex items-center gap-2 justify-center transition-all shadow-lg hover:shadow-xl active:scale-95 ${
                        isCheckingKey || !apiKey 
                        ? 'bg-slate-300 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600'
                    }`}
                  >
                    {isCheckingKey ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-5 h-5" /> Lưu
                        </>
                    )}
                  </button>
                </div>
                <div className="text-left mt-3 text-sm text-slate-500 flex items-center gap-1 flex-wrap">
                   Chưa có Key? 
                   <a 
                     href="https://aistudio.google.com/app/apikey" 
                     target="_blank" 
                     rel="noreferrer"
                     className="text-teal-600 font-bold hover:underline flex items-center bg-teal-50 px-2 py-0.5 rounded-lg"
                   >
                     Lấy miễn phí tại đây <ExternalLink className="w-3 h-3 ml-1"/>
                   </a>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="max-w-4xl mx-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-100/80 border-2 border-red-200 text-red-700 rounded-2xl shadow-sm flex items-center justify-between animate-fade-in backdrop-blur-md">
              <span className="flex items-center gap-3 font-bold"><AlertCircle className="w-6 h-6 flex-shrink-0"/> {error}</span>
              <button onClick={() => setError(null)} className="bg-white/50 w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-white hover:text-red-700 font-bold transition-all">✕</button>
            </div>
          )}

          {!worksheetContent && !isLoading && !error && (
            <div className="animate-fade-in space-y-8 md:space-y-12">
                 <WorksheetForm onSubmit={handleGenerate} isLoading={isLoading} />
                 
                 {/* Quick Tips Section - Glass Cards */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <div className="glass-panel p-6 hover:-translate-y-2 transition-transform duration-300">
                        <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl mb-4 text-blue-500 shadow-sm transform -rotate-3">📚</div>
                        <h3 className="font-bold text-slate-800 text-xl mb-2 font-display">Bám Sát SGK</h3>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">Nội dung chuẩn xác từ bộ sách "Kết nối tri thức".</p>
                    </div>
                    <div className="glass-panel p-6 hover:-translate-y-2 transition-transform duration-300">
                        <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-3xl mb-4 text-emerald-500 shadow-sm transform rotate-3">📊</div>
                        <h3 className="font-bold text-slate-800 text-xl mb-2 font-display">Chuẩn Ma Trận</h3>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">Theo Thông tư 27: 40% Biết - 30% Hiểu - 30% Vận dụng.</p>
                    </div>
                    <div className="glass-panel p-6 hover:-translate-y-2 transition-transform duration-300">
                        <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-3xl mb-4 text-amber-500 shadow-sm transform -rotate-2">⚡</div>
                        <h3 className="font-bold text-slate-800 text-xl mb-2 font-display">Tạo Siêu Tốc</h3>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">Nhập tên bài, có ngay phiếu bài tập trong 5 giây.</p>
                    </div>
                 </div>
            </div>
          )}

          {(isLoading || worksheetContent) && (
            <div className="w-full">
                {isLoading && !worksheetContent ? (
                    <div className="text-center py-20 animate-pulse glass-panel">
                         <div className="inline-block p-6 bg-white rounded-full shadow-lg border-4 border-teal-50 mb-6">
                            <SparklesLoading />
                         </div>
                         <h3 className="text-2xl font-bold text-slate-800 font-display">Đang biên soạn phiếu bài tập...</h3>
                         <p className="mt-2 text-slate-500 font-medium">Thầy/Cô đợi một chút nhé!</p>
                    </div>
                ) : (
                    <WorksheetDisplay content={worksheetContent} onReset={handleReset} />
                )}
            </div>
          )}
        </main>

        <footer className="text-center mt-12 md:mt-20 pb-8 text-slate-400 text-sm font-semibold tracking-wide">
          <p>© {new Date().getFullYear()} PTDTBT Tiểu học Giàng Chu Phìn</p>
        </footer>
      </div>
    </div>
  );
}

const SparklesLoading = () => (
    <svg className="w-12 h-12 text-teal-500 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
)

export default App;