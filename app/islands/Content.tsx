import { useEffect, useRef, useState } from "hono/jsx";
import SpeechRecognition from "react-speech-recognition";

export default function Content() {
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; text: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
  
    const SpeechRecognition =
      window.SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("このブラウザは音声認識に対応していません。");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        text += event.results[i][0].transcript;
      }
      if (text === "") return;
      setTranscript(text);
    };

    recognition.onerror = (e: any) => {
      console.error(e);
      setError("音声認識中にエラーが発生しました。");
    };

    recognitionRef.current = recognition;
  }, []);

  function startListening() {
    recognitionRef.current?.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
  }

  function resetTranscript() {
    setTranscript("");
  }

  async function sendPrompt(prompt: string) {
    setLoading(true);
    setError(null);
    setMessages((m) => [...m, { role: "user", text: prompt }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok || !res.body) throw new Error("Upstream error");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        assistantText += chunk;

        setMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last && last.role === "assistant") {
            copy[copy.length - 1] = {
              role: "assistant",
              text: assistantText,
            };
          } else {
            copy.push({ role: "assistant", text: assistantText });
          }
          return copy;
        });
      }
    } catch (e) {
      console.error(e);
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div class="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div class="w-full bg-white shadow-xl rounded-2xl p-6 border border-slate-200">
        <h1 class="text-2xl font-bold text-center text-slate-800 mb-4">
          🎤 Gemini Voice Chat
        </h1>

        {/* 音声操作ボタン */}
        <div class="flex justify-center gap-3 mb-4">
          <button
            onClick={startListening}
            disabled={listening}
            class={`px-4 py-2 rounded-xl font-medium transition ${listening
              ? "bg-slate-300 text-white cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow"
              }`}
          >
            🎙 Start
          </button>
          <button
            onClick={stopListening}
            disabled={!listening}
            class={`px-4 py-2 rounded-xl font-medium transition ${!listening
              ? "bg-slate-300 text-white cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700 text-white shadow"
              }`}
          >
            ⏹ Stop
          </button>
          <button
            onClick={resetTranscript}
            class="px-4 py-2 rounded-xl font-medium bg-gray-200 hover:bg-gray-300 text-slate-800 transition"
          >
            🔁 Reset
          </button>
        </div>

        {/* テキストと送信 */}
        <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
          <p class="text-sm text-slate-500 mb-2">認識中のテキスト：</p>
          <textarea class="min-h-[2rem] w-full border-2 text-slate-800 font-medium mb-3 break-words" value={transcript} onChange={(e) => setTranscript((e.target as HTMLInputElement).value)} />
          <button
            onClick={() => sendPrompt(transcript)}
            disabled={!transcript || loading}
            class={`w-full py-2 rounded-xl font-medium transition ${!transcript || loading
              ? "bg-slate-300 text-white cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white shadow"
              }`}
          >
            🚀 Send
          </button>
        </div>

        {/* チャット履歴 */}
        <div class="h-64 overflow-y-auto border border-slate-200 rounded-xl p-4 bg-slate-50 mb-3">
          <h2 class="text-slate-700 font-semibold mb-2">💬 Chat Log</h2>
          {messages.length === 0 && (
            <p class="text-slate-400 text-sm">まだ会話はありません。</p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              class={`mb-3 p-3 rounded-xl ${m.role === "user"
                ? "bg-blue-100 text-blue-900 self-end"
                : "bg-gray-100 text-gray-800"
                }`}
            >
              <b>{m.role === "user" ? "👤 You" : "🤖 Gemini"}:</b>{" "}
              <span class="whitespace-pre-wrap">{m.text}</span>
            </div>
          ))}
        </div>

        {/* 状態表示 */}
        {loading && (
          <div class="text-center text-blue-500 font-medium">Thinking...</div>
        )}
        {error && (
          <div class="text-center text-red-500 font-medium mt-2">{error}</div>
        )}

        {listening && (
          <div class="text-center text-green-600 font-semibold mt-2">
            🎧 音声認識中...
          </div>
        )}
      </div>
    </div>
  );
}
