"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import "./admin.css";

interface TaskItem {
  title: string;
  desc: string;
  warning: string;
  imageFile: File | null;
  imagePreview: string | null;
}

interface WorkOrder {
  id: string;
  productName: string;
  quantity: string;
  deliveryDate: string;
  notice: string;
  createdAt: string;
  tasks: { id: number; title: string; desc: string; warning: string; imageUrl?: string }[];
  actualDeliveryDate?: string;
  actualDeliveryQuantity?: string;
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
  // ── 등록 폼 상태 ──
  const [productName, setProductName] = useState("LEBEIGE");
  const [quantity, setQuantity] = useState("2,000개 (4,000매)");
  const [deliveryDate, setDeliveryDate] = useState("완료되는 대로 납품");
  const [notice, setNotice] = useState("500개 먼저 작업 요망\n한 줄, 두 줄 섞이지 않게 주의");
  const [tasks, setTasks] = useState<TaskItem[]>(DEFAULT_TASKS.map(t => ({ ...t })));
  const [status, setStatus] = useState<"idle" | "uploading" | "saving" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);

  // ── 실제 납품 정보 상태 ──
  const [currentOrder, setCurrentOrder] = useState<WorkOrder | null>(null);
  const [allOrders, setAllOrders] = useState<WorkOrder[]>([]);
  const [actualDate, setActualDate] = useState("");
  const [actualQty, setActualQty] = useState("");
  const [actualSaving, setActualSaving] = useState(false);
  const [actualMsg, setActualMsg] = useState("");

  // 현재 등록된 작업지시서 불러오기
  useEffect(() => {
    fetch("/api/orders")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAllOrders(data);
          if (data.length > 0) {
            const o = data[0];
            setCurrentOrder(o);
            setActualDate(o.actualDeliveryDate || "");
            setActualQty(o.actualDeliveryQuantity || "");
          }
        }
      })
      .catch(() => {});
  }, [status]); // 새 지시서 등록 후 갱신

  // 작업 항목 수정
  const updateTask = (idx: number, field: keyof TaskItem, value: any) => {
    setTasks(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  // 이미지 선택
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

  const removeImage = (idx: number) => {
    setTasks(prev => prev.map((t, i) =>
      i === idx ? { ...t, imageFile: null, imagePreview: null } : t
    ));
  };

  const addTask = () => {
    setTasks(prev => [...prev, { title: "", desc: "", warning: "", imageFile: null, imagePreview: null }]);
  };

  const removeTask = (idx: number) => {
    if (tasks.length <= 1) return;
    setTasks(prev => prev.filter((_, i) => i !== idx));
  };

  const moveTask = (idx: number, dir: -1 | 1) => {
    const newTasks = [...tasks];
    const swap = idx + dir;
    if (swap < 0 || swap >= newTasks.length) return;
    [newTasks[idx], newTasks[swap]] = [newTasks[swap], newTasks[idx]];
    setTasks(newTasks);
  };

  // 작업지시서 등록
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("uploading");
    setErrorMsg("");
    try {
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
        id: i + 1, title: t.title, desc: t.desc, warning: t.warning,
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
      setTasks(prev => prev.map(t => ({ ...t, imageFile: null, imagePreview: null })));
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  };

  // 실제 납품 정보 저장
  const saveActual = async () => {
    if (!currentOrder) return;
    setActualSaving(true);
    setActualMsg("");
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentOrder.id, actualDeliveryDate: actualDate, actualDeliveryQuantity: actualQty }),
      });
      if (res.ok) {
        setActualMsg("✅ 저장되었습니다!");
        setCurrentOrder(prev => prev ? { ...prev, actualDeliveryDate: actualDate, actualDeliveryQuantity: actualQty } : prev);
      } else {
        setActualMsg("❌ 저장 실패");
      }
    } catch {
      setActualMsg("❌ 저장 실패");
    } finally {
      setActualSaving(false);
      setTimeout(() => setActualMsg(""), 3000);
    }
  };

  // 엑셀 저장 (월별 시트 분리)
  const downloadExcel = () => {
    if (allOrders.length === 0) {
      alert("등록된 작업지시서가 없습니다.");
      return;
    }

    const wb = XLSX.utils.book_new();

    // 월별 분리: "2026-06"
    const grouped: Record<string, WorkOrder[]> = {};
    allOrders.forEach(o => {
      const date = new Date(o.createdAt);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(o);
    });

    for (const monthKey of Object.keys(grouped).sort()) {
      const monthOrders = grouped[monthKey];
      // 오래된 순으로 정렬 (위에서부터 차례대로 쌓이도록)
      monthOrders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      const rows: any[][] = [];
      rows.push(["작업지시서"]);
      rows.push([]);

      let monthlyTotalQty = 0;

      monthOrders.forEach(o => {
        const createDateStr = new Date(o.createdAt).toLocaleDateString("ko-KR");
        
        // 작성일
        rows.push(["작성일", createDateStr, "", "", "중요 안내사항"]);
        
        // 제품명 & 중요안내사항
        rows.push(["제품명", o.productName, "", "", o.notice || ""]);
        
        // 예정 납품일 & 실제 납품일자
        const isCurrent = o.id === currentOrder?.id;
        const actDate = isCurrent ? (actualDate || o.actualDeliveryDate || "") : (o.actualDeliveryDate || "");
        rows.push(["예정 납품일", o.deliveryDate, "실제 납품일자", actDate]);
        
        // 예정 수량 & 실제 납품수량
        const actQty = isCurrent ? (actualQty || o.actualDeliveryQuantity || "") : (o.actualDeliveryQuantity || "");
        rows.push(["예정 수량", o.quantity, "실제 납품수량", actQty]);
        
        // 숫자만 추출해서 합계 계산
        const parsedQty = parseInt(actQty.replace(/[^0-9]/g, ""), 10);
        if (!isNaN(parsedQty)) {
          monthlyTotalQty += parsedQty;
        }

        rows.push([]); // 한 줄 띄우기
      });

      // 월 총합계 행 추가
      rows.push(["", "", "월 총 납품수량", `${monthlyTotalQty.toLocaleString()}개`]);
      rows.push([]);

      const ws = XLSX.utils.aoa_to_sheet(rows);
      // 컬럼 너비 설정
      ws["!cols"] = [{ wch: 12 }, { wch: 22 }, { wch: 15 }, { wch: 18 }, { wch: 45 }];
      XLSX.utils.book_append_sheet(wb, ws, monthKey);
    }

    const today = new Date().toLocaleDateString("ko-KR").replace(/\. /g, "-").replace(".", "");
    XLSX.writeFile(wb, `발주_및_납품현황_${today}.xlsx`);
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
          <h1>✏️ 작업지시서 관리</h1>
          <p>작업 항목을 자유롭게 추가·수정·삭제할 수 있습니다.</p>
        </header>

        {/* ── 실제 납품 정보 섹션 ── */}
        <section className="actual-section">
          <h2 style={{ display: "block", marginBottom: "16px" }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ display: "inline-block", verticalAlign: "middle", marginRight: "6px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span style={{ verticalAlign: "middle" }}>실제 납품 정보</span>
          </h2>
          {currentOrder && (
            <div className="input-group" style={{ marginBottom: "20px" }}>
              <label>대상 제품명 (등록된 지시서 선택)</label>
              <select className="current-order-name" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "1rem", background: "#f8fafc", cursor: "pointer", outline: "none", color: "#333", fontWeight: "bold", textAlign: "left" }} value={currentOrder.id} onChange={e => {
                const o = allOrders.find(x => x.id === e.target.value);
                if(o) {
                  setCurrentOrder(o);
                  setActualDate(o.actualDeliveryDate || "");
                  setActualQty(o.actualDeliveryQuantity || "");
                }
              }}>
                {allOrders.map(o => (
                  <option key={o.id} value={o.id}>{o.productName}</option>
                ))}
              </select>
            </div>
          )}
          {!currentOrder ? (
            <p className="no-order-msg">📋 먼저 아래에서 작업지시서를 등록해 주세요.</p>
          ) : (
            <>
              <div className="actual-fields">
                <div className="input-group">
                  <label>실제 납품일자</label>
                  <input type="date" value={actualDate} onChange={e => setActualDate(e.target.value)} onClick={(e) => e.currentTarget.showPicker && e.currentTarget.showPicker()} />
                </div>
                <div className="input-group">
                  <label>실제 납품수량</label>
                  <input type="text" inputMode="numeric" pattern="[0-9]*" value={actualQty} onChange={e => setActualQty(e.target.value)} placeholder="예: 1500" />
                </div>
              </div>
              <div className="actual-actions">
                <button className="btn-save-actual" onClick={saveActual} disabled={actualSaving}>
                  {actualSaving ? "저장 중..." : "💾 납품 정보 저장"}
                </button>
                <button className="btn-excel" onClick={downloadExcel}>
                  📊 엑셀로 저장
                </button>
              </div>
              {actualMsg && <div className="actual-msg">{actualMsg}</div>}
            </>
          )}
        </section>

        {status === "done" && (
          <div className="success-banner">
            ✅ 작업지시서가 성공적으로 등록되었습니다!
            <a href="/" className="view-link">작업자 화면 보기 →</a>
          </div>
        )}
        {status === "error" && (
          <div className="error-banner">❌ 오류: {errorMsg}</div>
        )}

        {/* ── 등록 폼 ── */}
        <form onSubmit={handleSubmit} className="admin-form">
          <section className="form-section">
            <h2>기본 정보</h2>
            <div className="input-group" style={{ marginBottom: "12px" }}>
              <label>제품명</label>
              <input type="text" list="product-list" required value={productName} onChange={e => {
                setProductName(e.target.value);
                const matched = allOrders.find(o => o.productName === e.target.value);
                if (matched) {
                  setCurrentOrder(matched);
                  setActualDate(matched.actualDeliveryDate || "");
                  setActualQty(matched.actualDeliveryQuantity || "");
                }
              }} />
              <datalist id="product-list">
                {Array.from(new Set(allOrders.map(o => o.productName))).map(p => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
            <div className="input-group" style={{ marginBottom: "12px" }}>
              <label>수량</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" required value={quantity} onChange={e => setQuantity(e.target.value)} />
            </div>
            <div className="input-group" style={{ marginBottom: "12px" }}>
              <label>납품 요구일</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type={deliveryDate === "완료되는 대로" ? "text" : "date"} 
                    required 
                    value={deliveryDate === "완료되는 대로" ? "" : deliveryDate} 
                    onChange={e => setDeliveryDate(e.target.value)} 
                    onClick={(e) => e.currentTarget.showPicker && e.currentTarget.showPicker()}
                    style={{ flex: 1 }}
                    placeholder={deliveryDate === "완료되는 대로" ? "완료되는 대로" : ""}
                    disabled={deliveryDate === "완료되는 대로"}
                  />
                  <button 
                    type="button" 
                    onClick={() => setDeliveryDate(prev => prev === "완료되는 대로" ? "" : "완료되는 대로")}
                    style={{
                      padding: '10px 14px', 
                      fontSize: '0.9rem', 
                      background: deliveryDate === "완료되는 대로" ? '#15803d' : '#f1f5f9',
                      color: deliveryDate === "완료되는 대로" ? '#fff' : '#475569',
                      border: '1px solid',
                      borderColor: deliveryDate === "완료되는 대로" ? '#15803d' : '#cbd5e1',
                      borderRadius: '8px',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    완료되는 대로
                  </button>
                </div>
                {deliveryDate === "완료되는 대로" && (
                  <div style={{ fontSize: '0.8rem', color: '#15803d', marginTop: '6px' }}>
                    ✔ '완료되는 대로'로 지정됨 (버튼을 다시 누르면 취소)
                  </div>
                )}
              </div>
            <div className="input-group" style={{ marginBottom: "12px" }}>
              <label>중요 안내사항 / 비고</label>
              <textarea value={notice} onChange={e => setNotice(e.target.value)} rows={3} />
            </div>
          </section>

          <section className="form-section">
            <h2>세부 작업 지시사항</h2>
            <p className="section-desc">항목을 추가·삭제하거나 내용을 직접 수정할 수 있습니다.</p>
            {tasks.map((task, i) => (
              <div key={i} className="task-input-card">
                <div className="task-card-header">
                  <span className="task-num-badge">{i + 1}</span>
                  <div className="task-card-actions">
                    <button type="button" className="btn-move" onClick={() => moveTask(i, -1)} disabled={i === 0}>▲</button>
                    <button type="button" className="btn-move" onClick={() => moveTask(i, 1)} disabled={i === tasks.length - 1}>▼</button>
                    <button type="button" className="btn-remove" onClick={() => removeTask(i)}>✕ 삭제</button>
                  </div>
                </div>
                <div className="task-fields">
                  <div className="input-group">
                    <label>작업 제목 *</label>
                    <input type="text" required value={task.title} placeholder="예: 상깍지 테이프 작업" onChange={e => updateTask(i, "title", e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>작업 설명</label>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <select 
                        value="" 
                        onChange={e => {
                          if (e.target.value) updateTask(i, "desc", e.target.value);
                        }}
                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}
                      >
                        <option value="">-- 자주 쓰는 설명 선택 (선택 시 자동 입력) --</option>
                        <optgroup label="상깍지 테이프 작업">
                          <option value="흰테이프를 사용해서 한 줄로 앞뒤로 돌리기">흰테이프 한 줄 앞뒤 돌리기</option>
                          <option value="흰테이프를 사용해서 세로로 가운데 한줄(돌돌이)">흰테이프 세로 가운데 한줄(돌돌이)</option>
                          <option value="흰테이프를 사용해서 두 줄 앞뒤로 돌리기">흰테이프 두 줄 앞뒤 돌리기</option>
                        </optgroup>
                        <optgroup label="상깍지 사용">
                          <option value="상깍지 2개 사용(1개는 테이프 작업, 1개는 그냥 사용)">상깍지 2개 사용 (1개 테이프, 1개 그냥)</option>
                          <option value="1개 사용">상깍지 1개 사용</option>
                        </optgroup>
                        <optgroup label="바닥 테이프 작업(위쪽)">
                          <option value="흰테이프 사용 / 일자(ㅡ)모양">흰테이프 사용 / 일자(ㅡ)모양</option>
                          <option value="흰테이프 사용 / 팔자(八)모양">흰테이프 사용 / 팔자(八)모양</option>
                        </optgroup>
                      </select>
                    </div>
                    <input type="text" value={task.desc} placeholder="작업 설명 직접 입력 (또는 위에서 선택)" onChange={e => updateTask(i, "desc", e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>주의사항 (선택)</label>
                    <input type="text" value={task.warning} placeholder="예: ※ 샘플 확인 필수" onChange={e => updateTask(i, "warning", e.target.value)} />
                  </div>
                  <div className="image-upload-area">
                    {task.imagePreview ? (
                      <div className="image-preview-wrap">
                        <img src={task.imagePreview} alt="미리보기" className="image-preview" onClick={() => setLightbox(task.imagePreview!)} />
                        <div className="image-preview-actions">
                          <button type="button" className="btn-preview-view" onClick={() => setLightbox(task.imagePreview!)}>🔍 크게 보기</button>
                          <button type="button" className="btn-preview-remove" onClick={() => removeImage(i)}>🗑 삭제</button>
                        </div>
                      </div>
                    ) : (
                      <label className="file-label">
                        <input type="file" accept="image/*" capture="environment" onChange={e => handleImage(i, e.target.files?.[0] || null)} />
                        <span className="file-label-text">📷 사진 촬영 / 업로드 (선택)</span>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <button type="button" className="btn-add-task" onClick={addTask}>+ 작업 항목 추가하기</button>
          </section>

          <button type="submit" className="submit-btn" disabled={status === "uploading" || status === "saving"}>
            {status === "uploading" && "📤 사진 업로드 중..."}
            {status === "saving" && "💾 저장 중..."}
            {(status === "idle" || status === "done" || status === "error") && "✅ 작업지시서 등록하기"}
          </button>
        </form>
      </div>
    </>
  );
}
