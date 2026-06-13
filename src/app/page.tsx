"use client";

import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import './page.css';

export default function Home() {
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestOrder = async () => {
      try {
        const q = query(collection(db, "work_orders"), orderBy("createdAt", "desc"), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setWorkOrder(querySnapshot.docs[0].data());
        }
      } catch (e) {
        console.error("데이터 불러오기 에러:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchLatestOrder();
  }, []);

  const toggleTask = (id: number) => {
    setCompletedTasks(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  if (loading) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h2>데이터를 불러오는 중입니다...</h2>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>등록된 작업지시서가 없습니다.</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>관리자 페이지(/admin)에서 먼저 지시서를 등록해 주세요.</p>
        </div>
      </div>
    );
  }

  const tasks = workOrder.tasks || [];
  const totalTasks = tasks.length;

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-title">작업지시서 (모바일 뷰어)</div>
        <button className="share-btn" onClick={() => alert('카카오톡 공유 API가 호출됩니다.')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3c-5.523 0-10 3.582-10 8 0 2.865 1.83 5.373 4.545 6.723l-1.156 4.316c-.085.316.27.568.536.402l4.87-3.238c.383.056.776.086 1.176.086 5.523 0 10-3.582 10-8s-4.477-8-10-8z"/>
          </svg>
          공유
        </button>
      </header>

      <div className="content">
        <div className="info-card">
          <div className="date-badge">
            {new Date(workOrder.createdAt).toLocaleDateString('ko-KR')}
          </div>
          <div className="product-name">{workOrder.productName}</div>
          {workOrder.notice && (
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '8px', whiteSpace: 'pre-wrap' }}>
              {workOrder.notice}
            </div>
          )}
          <div className="info-grid">
            <div className="info-item">
              <div className="label">수량</div>
              <div className="value">{workOrder.quantity}</div>
            </div>
            <div className="info-item">
              <div className="label">납품일</div>
              <div className="value">{workOrder.deliveryDate}</div>
            </div>
          </div>
        </div>

        <div className="section-title">
          세부 지시사항
          <span className="progress-text">{completedTasks.length} / {totalTasks} 완료</span>
        </div>

        <div className="task-list">
          {tasks.map((task: any) => (
            <div 
              key={task.id} 
              className={`task-item ${completedTasks.includes(task.id) ? 'completed' : ''}`}
              onClick={() => toggleTask(task.id)}
            >
              <div className="task-number">{task.id}</div>
              <div className="task-content">
                <div className="task-title">{task.title}</div>
                <div className="task-desc" style={{ whiteSpace: 'pre-wrap' }}>
                  {task.desc}
                </div>
                {task.mediaUrl && (
                  <button 
                    className="media-btn" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      window.open(task.mediaUrl, '_blank'); 
                    }}
                  >
                    {task.mediaType === 'video' ? '🎥 영상 보기' : '📷 사진 보기'}
                  </button>
                )}
              </div>
              <div className="check-circle"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
