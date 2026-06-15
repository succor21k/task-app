"use client";

import { useState } from "react";
import "./admin.css";

const FIXED_TASKS = [
  { title: "상깍지 테이프 작업", desc: "흰테이프 사용해서 한줄로 앞뒤 돌리기", warning: "※ 상깍지 붙이기 작업 전에 샘플 확인" },
  { title: "상깍지 사용", desc: "상깍지 2개 사용 (1개는 테이프 작업, 1개는 그냥 사용)", warning: "※ 샘플 확인 필수" },
  { title: "손잡이 글루건 작업", desc: "손잡이 글루건 작업 진행", warning: "※ 글루건 작업 전 샘플 확인" },
  { title: "옆선 테이프 작업", desc: "흰테이프 사용 / 선에서 5미리", warning: "" },
  { title: "옆구리 붙이기 작업", desc: "선에서 2미리", warning: "" },
  { title: "바닥 테이프 작업 (위쪽)", desc: "흰테이프 사용 / 일자(ㅡ) 모양", warning: "" },
  { title: "바닥 테이프 작업 (아래쪽)", desc: "흰테이프 사용 / 돌리기", warning: "" },
];

export default function AdminPage() {
  const [productName, setProductName] = useState("LEBEIGE");
  const [quantity, setQuantity] = useState("2,000개 (4,000매)");
  const [deliveryDate, setDeliveryDate] = useState("완료되는 대로 납품");
  const [notice, setNotice] = useState("500개 먼저 작업 요망\n한 줄, 두 줄 섞이지 않게 주의");
  const [taskImages, setTaskImages] = useState<(File | null)[]>(Array(7).fill(null));
  const [status, setStatus] = useState<"idle" | "uploading" | "saving" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleImageChange = (idx: number, file: File | null) => {
    setTaskImages(prev => { const n = [...prev]; n[idx] = file; return n; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("uploading");
    setErrorMsg("");

    try {
      // 이미지 업로드
      const imageUrls: (string | null)[] = [];
      for (let i = 0; i < taskImages.length; i++) {
        const file = taskImages[i];
        if (file) {
          const fd = new FormData();
          fd.append("file", file);
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "이미지 업로드 실패");
          imageUrls.push(data.url);
        } else {
          imageUrls.push(null);
        }
      }

      setStatus("saving");

      // 작업지시서 저장
      const tasks = FIXED_TASKS.map((t, i) => ({
        id: i + 1,
        title: t.title,
        desc: t.desc,
        warning: t.warning,
        imageUrl: imageUrls[i] || null,
      }));

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, quantity, deliveryDate, notice, tasks }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "저장 실패");

      setStatus("done");
      setTaskImages(Array(7).fill(null));
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="admin-wrap">
      <header className="admin-header">
        <h1>작업지시서 등록</h1>
        <p>새로운 작업지시서를 등록하고 작업자들과 공유하세요.</p>
      </header>

      {status === "done" && (
        <div className="success-banner">
          ✅ 작업지시서가 성공적으로 등록되었습니다!
          <a href="/" className="view-link">작업자 화면 보기 →</a>
        </div>
      )}
      {status === "error" && (
        <div className="error-banner">❌ 오류 발생: {errorMsg}</div>
      )}

      <form onSubmit={handleSubmit} className="admin-form">
        <section className="form-section">
          <h2>기본 정보</h2>
          <div className="input-group">
            <label>제품명</label>
            <input type="text" required value={productName} onChange={e => setProductName(e.target.value)} />
          </div>
          <div className="form-row">
            <div className="input-group">
              <label>수량</label>
              <input type="text" required value={quantity} onChange={e => setQuantity(e.target.value)} />
            </div>
            <div className="input-group">
              <label>납품일</label>
              <input type="text" required value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
            </div>
          </div>
          <div className="input-group">
            <label>중요 안내사항 / 비고</label>
            <textarea value={notice} onChange={e => setNotice(e.target.value)} rows={3} />
          </div>
        </section>

        <section className="form-section">
          <h2>세부 작업 지시사항 (고정 항목)</h2>
          <p className="section-desc">작업 제목과 설명은 고정되어 있습니다. 샘플 사진만 추가해 주세요.</p>
          {FIXED_TASKS.map((task, i) => (
            <div key={i} className="task-input-card">
              <div className="task-num-badge">{i + 1}</div>
              <div className="task-fixed-content">
                <div className="task-fixed-title">{task.title}</div>
                <div className="task-fixed-desc">{task.desc}</div>
                {task.warning && <div className="task-fixed-warning">{task.warning}</div>}
                <label className="file-label">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={e => handleImageChange(i, e.target.files?.[0] || null)}
                  />
                  <span className="file-label-text">
                    {taskImages[i] ? `📷 ${taskImages[i]!.name}` : "📷 사진 촬영 / 업로드 (선택)"}
                  </span>
                </label>
              </div>
            </div>
          ))}
        </section>

        <button
          type="submit"
          className="submit-btn"
          disabled={status === "uploading" || status === "saving"}
        >
          {status === "uploading" && "📤 사진 업로드 중..."}
          {status === "saving" && "💾 저장 중..."}
          {(status === "idle" || status === "done" || status === "error") && "작업지시서 등록하기"}
        </button>
      </form>
    </div>
  );
}
