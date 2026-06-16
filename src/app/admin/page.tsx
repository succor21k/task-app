"use client";

import { useState, useRef } from "react";
import "./admin.css";

interface TaskItem {
  title: string;
  desc: string;
  warning: string;
  imageFile: File | null;
  imagePreview: string | null;
}

const DEFAULT_TASKS: TaskItem[] = [
  { title: "상깍지 테이프 작업", desc: "흰테이프 사용해서 한줄로 앞뒤 돌리기", warning: "※ 상깍지 붙이기 작업 전에 샘플 확인", imageFile: null, imagePreview: null },
  { title: "상깍지 사용", desc: "상깍지 2개 사용 (1개는 테이프 작업, 1개는 그냥 사용)", warning: "※ 샘플 확인 필수", imageFile: null, imagePreview: null },
  { title: "손잡이 글루건 작업", desc: "손잡이 글루건 작업 진행", warning: "※ 글루건 작업 전 샘플 확인", imageFile: null, imagePreview: null },
  { title: "옆선 테이프 작업", desc: "흰테이프 사용 / 선에서 5미리", warning: "", imageFile: null, imagePreview: null },
  { title: "옆구리 붙이기 작업", desc: "선에서 2미리", warning: "", imageFile: null, imagePreview: null },
  { title: "바닥 테이프 작업 (위쪽)", desc: "흰테이프 사용 / 일자(ㅡ) 모양", warning: "", imageFile: null, imagePreview: null },
  { title: "바닥 테이프 작업 (아래쪽)", desc: "흰테이프 사용 / 돌리기", warning: "", imageFile: null, imagePreview: null },
];

export default function AdminPage() {
  const [productName, setProductName] = useState("LEBEIGE");
  const [quantity, setQuantity] = useState("2,000개 (4,000매)");
  const [deliveryDate, setDeliveryDate] = useState("완료되는 대로 납품");
  const [notice, setNotice] = useState("500개 먼저 작업 요망\n한 줄, 두 줄 섞이지 않게 주의");
  const [tasks, setTasks] = useState<TaskItem[]>(DEFAULT_TASKS.map(t => ({ ...t })));
  const [status, setStatus] = useState<"idle" | "uploading" | "saving" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);

  // 작업 항목 필드 수정
  const updateTask = (idx: number, field: keyof TaskItem, value: any) => {
    setTasks(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  // 이미지 선택 핸들러
  const handleImage = (idx: number, file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setTasks(prev => prev.map((t, i) =>
        i === idx ? { ...t, imageFile: file, imagePreview: e.target?.result as string } : t
      ));
    };
    reader.readAsDataURL(file);
  };

  // 이미지 삭제
  const removeImage = (idx: number) => {
    setTasks(prev => prev.map((t, i) =>
      i === idx ? { ...t, imageFile: null, imagePreview: null } : t
    ));
  };

  // 항목 추가
  const addTask = () => {
    setTasks(prev => [...prev, { title: "", desc: "", warning: "", imageFile: null, imagePreview: null }]);
  };

  // 항목 삭제
  const removeTask = (idx: number) => {
    if (tasks.length <= 1) return;
    setTasks(prev => prev.filter((_, i) => i !== idx));
  };

  // 항목 순서 이동
  const moveTask = (idx: number, dir: -1 | 1) => {
    const newTasks = [...tasks];
    const swap = idx + dir;
    if (swap < 0 || swap >= newTasks.length) return;
    [newTasks[idx], newTasks[swap]] = [newTasks[swap], newTasks[idx]];
    setTasks(newTasks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("uploading");
    setErrorMsg("");

    try {
      // 이미지 업로드
      const imageUrls: (string | null)[] = [];
      for (const task of tasks) {
        if (task.imageFile) {
          const fd = new FormData();
          fd.append("file", task.imageFile);
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "이미지 업로드 실패");
          imageUrls.push(data.url);
        } else {
          imageUrls.push(null);
        }
      }

      setStatus("saving");

      const orderTasks = tasks.map((t, i) => ({
        id: i + 1,
        title: t.title,
        desc: t.desc,
        warning: t.warning,
        imageUrl: imageUrls[i] || null,
      }));

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, quantity, deliveryDate, notice, tasks: orderTasks }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "저장 실패");

      setStatus("done");
      // 이미지 프리뷰만 초기화
      setTasks(prev => prev.map(t => ({ ...t, imageFile: null, imagePreview: null })));
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  };

  return (
    <>
      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="미리보기" />
          <button className="lightbox-close">✕</button>
        </div>
      )}

      <div className="admin-wrap">
        <header className="admin-header">
          <h1>✏️ 작업지시서 등록</h1>
          <p>작업 항목을 자유롭게 추가·수정·삭제할 수 있습니다.</p>
        </header>

        {status === "done" && (
          <div className="success-banner">
            ✅ 작업지시서가 성공적으로 등록되었습니다!
            <a href="/" className="view-link">작업자 화면 보기 →</a>
          </div>
        )}
        {status === "error" && (
          <div className="error-banner">❌ 오류: {errorMsg}</div>
        )}

        <form onSubmit={handleSubmit} className="admin-form">
          {/* 기본 정보 */}
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

          {/* 작업 항목 */}
          <section className="form-section">
            <h2>세부 작업 지시사항</h2>
            <p className="section-desc">항목을 추가·삭제하거나 내용을 직접 수정할 수 있습니다.</p>

            {tasks.map((task, i) => (
              <div key={i} className="task-input-card">
                {/* 카드 헤더 */}
                <div className="task-card-header">
                  <span className="task-num-badge">{i + 1}</span>
                  <div className="task-card-actions">
                    <button type="button" className="btn-move" onClick={() => moveTask(i, -1)} disabled={i === 0} title="위로">▲</button>
                    <button type="button" className="btn-move" onClick={() => moveTask(i, 1)} disabled={i === tasks.length - 1} title="아래로">▼</button>
                    <button type="button" className="btn-remove" onClick={() => removeTask(i)} title="삭제">✕ 삭제</button>
                  </div>
                </div>

                {/* 편집 필드 */}
                <div className="task-fields">
                  <div className="input-group">
                    <label>작업 제목 *</label>
                    <input
                      type="text" required
                      value={task.title}
                      placeholder="예: 상깍지 테이프 작업"
                      onChange={e => updateTask(i, "title", e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>작업 설명</label>
                    <input
                      type="text"
                      value={task.desc}
                      placeholder="예: 흰테이프 사용해서 한줄로 앞뒤 돌리기"
                      onChange={e => updateTask(i, "desc", e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>주의사항 (선택)</label>
                    <input
                      type="text"
                      value={task.warning}
                      placeholder="예: ※ 샘플 확인 필수"
                      onChange={e => updateTask(i, "warning", e.target.value)}
                    />
                  </div>

                  {/* 이미지 업로드 + 미리보기 */}
                  <div className="image-upload-area">
                    {task.imagePreview ? (
                      <div className="image-preview-wrap">
                        <img
                          src={task.imagePreview}
                          alt="미리보기"
                          className="image-preview"
                          onClick={() => setLightbox(task.imagePreview!)}
                        />
                        <div className="image-preview-actions">
                          <button type="button" className="btn-preview-view" onClick={() => setLightbox(task.imagePreview!)}>
                            🔍 크게 보기
                          </button>
                          <button type="button" className="btn-preview-remove" onClick={() => removeImage(i)}>
                            🗑 사진 삭제
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="file-label">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={e => handleImage(i, e.target.files?.[0] || null)}
                        />
                        <span className="file-label-text">
                          📷 사진 촬영 / 업로드 (선택)
                        </span>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <button type="button" className="btn-add-task" onClick={addTask}>
              + 작업 항목 추가하기
            </button>
          </section>

          <button
            type="submit"
            className="submit-btn"
            disabled={status === "uploading" || status === "saving"}
          >
            {status === "uploading" && "📤 사진 업로드 중..."}
            {status === "saving" && "💾 저장 중..."}
            {(status === "idle" || status === "done" || status === "error") && "✅ 작업지시서 등록하기"}
          </button>
        </form>
      </div>
    </>
  );
}
