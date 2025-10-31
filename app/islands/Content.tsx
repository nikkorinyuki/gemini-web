import { useEffect, useRef, useState } from "hono/jsx";

export default function Content() {
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; text: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [transcriptPreview, setTranscriptPreview] = useState("");
  const [textInput, setTextInput] = useState("");
  const recognitionRef = useRef<any>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
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
      let isFinal = true;
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (!result.isFinal) isFinal = false;
        text += event.results[i][0].transcript;
      }
      if (text === "") return;
      if (isFinal) {
        setTextInput((prev) => (prev + text + "。"));
        setTranscriptPreview("");
      } else {
        setTranscriptPreview(text);
      }
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

  async function sendPrompt(prompt: string) {
    setLoading(true);
    setTextInput("");
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
        outputRef.current?.scrollTo(0, outputRef.current.scrollHeight);

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
    <div className="flex flex-col h-screen bg-gray-50 text-gray-800">
      <div className="flex items-center mb-1">
        <button
          onClick={() => setMessages([])}
          className="px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm m-1 cursor-pointer"
        >会話履歴を削除</button>

      </div>

      {/* 出力欄 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={outputRef}>
        {messages.length === 0 ? (
          <div className="text-center text-gray-400">ここにメッセージが表示されます</div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-3 shadow-sm border border-gray-200 w-full"
            >
              <b>{msg.role === "user" ? "👤 You" : "🤖 Gemini"}:</b>{" "}
              <span className="whitespace-pre-wrap">{msg.text}</span>
            </div>
          ))
        )}
      </div>

      {/* 状態表示 */}
      <div className="border-t border-gray-200 bg-gray-100 text-sm text-gray-600">
        {loading && (
          <div className="text-blue-500 font-medium">Thinking...</div>
        )}
        {error && (
          <div className="text-red-500 font-medium">{error}</div>
        )}
      </div>

      {/* 下部 入力欄 */}
      <div className="border-t border-gray-200 p-3 bg-white flex items-center gap-2">
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput((e.target! as HTMLInputElement).value)}
          placeholder="メッセージを入力..."
          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={listening ? stopListening : startListening}
          className={`px-3 py-2 rounded-lg text-sm cursor-pointer ${listening
            ? "bg-red-500 hover:bg-red-600 text-white"
            : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
        >
          {listening ? "音声停止" : "音声開始"}
        </button>
        <button
          onClick={() => sendPrompt(textInput)}
          className="px-3 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={loading || textInput.trim() === ""}
        >
          送信
        </button>
      </div>

      {/* 音声プレビュー */}
      <div className="border-t border-gray-200 bg-gray-100 p-2 text-sm text-gray-600">
        <span className="font-semibold">音声認識プレビュー：</span> {transcriptPreview}
      </div>
    </div>
  );
}
