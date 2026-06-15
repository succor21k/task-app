"use client";

import { useState, useEffect } from "react";
import "./page.css";

interface TaskItem {
  id: number;
  title: string;
  desc: string;
  warning?: string;
  imageUrl?: string;
}

interface WorkOrder {
  id: string;
  productName: string;
  quantity: string;
  deliveryDate: string;
  notice: string;
  createdAt: string;
  tasks: TaskItem[];
}

export default function Home() {
  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState<number[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setOrder(data[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggle = (id: number) => {
    setCompleted((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
    if (navigator.vibrate) navigator.vibrate(40);
  };

  const share = () => {
    if (navigator.share) {
      navigator.share({ title: `작업지시서 - ${order?.productName}`, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("링크가 복사되었습니다!");
    }
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p>작업지시서 불러오는 중...</p>
    </div>
  );

  if (!order) return (
    <div className="empty-screen">
      <div className="empty-icon">📋</div>
      <h2>등록된 작업지시서가 없습니다</h2>
      <p>관리자 페이지에서 지시서를 먼저 등록해 주세요.</p>
      <a href="/admin" className="go-admin-btn">관리자 페이지로 이동</a>
    </div>
  );

  const total = order.tasks.length;
  const done = completed.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <>
      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="샘플 이미지" />
          <button className="lightbox-close">✕</button>
        </div>
      )}

      <div className="viewer">
        {/* Header */}
        <header className="viewer-header">
          <div className="viewer-header-left">
            <span className="badge-date">
              {new Date(order.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
            </span>
            <h1 className="product-title">{order.productName}</h1>
          </div>
          <button className="share-btn" onClick={share}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
            </svg>
            공유
          </button>
        </header>

        {/* Progress Bar */}
        <div className="progress-section">
          <div className="progress-info">
            <span>진행률</span>
            <span className="progress-count">{done} / {total} 완료 ({pct}%)</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Info Card */}
        <div className="info-card">
          <div className="info-row">
            <div className="info-cell">
              <span className="info-label">수량</span>
              <span className="info-value">{order.quantity}</span>
            </div>
            <div className="info-cell">
              <span className="info-label">납품일</span>
              <span className="info-value">{order.deliveryDate}</span>
            </div>
          </div>
        </div>

        {/* Notice */}
        {order.notice && (
          <div className="notice-card">
            <div className="notice-title">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              중요 안내사항
            </div>
            <p className="notice-text">{order.notice}</p>
          </div>
        )}

        {/* Task List */}
        <div className="task-section-title">세부 작업 지시사항</div>
        <div className="task-list">
          {order.tasks.map((task, i) => (
            <div
              key={task.id}
              className={`task-card ${completed.includes(task.id) ? "done" : ""}`}
              style={{ animationDelay: `${i * 0.06}s` }}
              onClick={() => toggle(task.id)}
            >
              <div className="task-num">{task.id}</div>
              <div className="task-body">
                <div className="task-title">{task.title}</div>
                {task.desc && <div className="task-desc">{task.desc}</div>}
                {task.warning && <div className="task-warning">{task.warning}</div>}
                {task.imageUrl && (
                  <button
                    className="img-btn"
                    onClick={(e) => { e.stopPropagation(); setLightbox(task.imageUrl!); }}
                  >
                    📷 샘플 사진 확대 보기
                  </button>
                )}
              </div>
              <div className="task-check">
                {completed.includes(task.id) && (
                  <svg width="16" height="16" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>

        {done === total && total > 0 && (
          <div className="complete-banner">🎉 모든 작업이 완료되었습니다!</div>
        )}
      </div>
    </>
  );
}
