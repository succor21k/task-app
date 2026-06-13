"use client";

import { useState } from 'react';
import { db, storage } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './admin.css';

export default function AdminPage() {
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notice, setNotice] = useState('');
  const [tasks, setTasks] = useState([
    { title: '상깍지 테이프 작업', desc: '흰테이프 사용해서 한줄로 앞뒤 돌리기', file: null as File | null },
    { title: '상깍지 사용', desc: '상깍지 2개 사용 (1개는 테이프 작업, 1개는 그냥 사용)', file: null },
    { title: '손잡이 글루건 작업', desc: '손잡이 글루건 작업 진행', file: null },
    { title: '옆선 테이프 작업', desc: '흰테이프 사용 / 선에서 5미리', file: null },
    { title: '옆구리 붙이기 작업', desc: '선에서 2미리', file: null },
    { title: '바닥 테이프 작업 (위쪽)', desc: '흰테이프 사용 / 일자(ㅡ) 모양', file: null },
    { title: '바닥 테이프 작업 (아래쪽)', desc: '흰테이프 사용 / 돌리기', file: null },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTaskChange = (index: number, field: string, value: any) => {
    const newTasks = [...tasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    setTasks(newTasks);
  };

  const addTask = () => {
    setTasks([...tasks, { title: '', desc: '', file: null }]);
  };

  const removeTask = (index: number) => {
    const newTasks = tasks.filter((_, i) => i !== index);
    setTasks(newTasks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // 1. Upload files to Firebase Storage and get URLs
      const uploadedTasks = await Promise.all(tasks.map(async (task, idx) => {
        let mediaUrl = null;
        let mediaType = null;
        
        if (task.file) {
          const fileRef = ref(storage, `tasks/${Date.now()}_${task.file.name}`);
          await uploadBytes(fileRef, task.file);
          mediaUrl = await getDownloadURL(fileRef);
          mediaType = task.file.type.startsWith('video') ? 'video' : 'image';
        }

        return {
          id: idx + 1,
          title: task.title,
          desc: task.desc,
          mediaUrl,
          mediaType
        };
      }));

      // 2. Save data to Firestore
      await addDoc(collection(db, "work_orders"), {
        productName,
        quantity,
        deliveryDate,
        notice,
        tasks: uploadedTasks,
        createdAt: new Date().toISOString(),
      });

      alert('작업지시서가 성공적으로 등록되었습니다!');
      // Reset form (기본 항목들은 남겨둡니다)
      setProductName(''); setQuantity(''); setDeliveryDate(''); setNotice('');
      setTasks([
        { title: '상깍지 테이프 작업', desc: '흰테이프 사용해서 한줄로 앞뒤 돌리기', file: null as File | null },
        { title: '상깍지 사용', desc: '상깍지 2개 사용 (1개는 테이프 작업, 1개는 그냥 사용)', file: null },
        { title: '손잡이 글루건 작업', desc: '손잡이 글루건 작업 진행', file: null },
        { title: '옆선 테이프 작업', desc: '흰테이프 사용 / 선에서 5미리', file: null },
        { title: '옆구리 붙이기 작업', desc: '선에서 2미리', file: null },
        { title: '바닥 테이프 작업 (위쪽)', desc: '흰테이프 사용 / 일자(ㅡ) 모양', file: null },
        { title: '바닥 테이프 작업 (아래쪽)', desc: '흰테이프 사용 / 돌리기', file: null },
      ]);

    } catch (error) {
      console.error("Error adding document: ", error);
      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>작업지시서 신규 등록</h1>
        <p>현장 작업자들에게 전달할 지시서를 작성하고 샘플 미디어를 업로드하세요.</p>
      </header>

      <form onSubmit={handleSubmit} className="admin-form">
        <section className="form-section">
          <h2>1. 기본 정보</h2>
          <div className="input-group">
            <label>제품명 (예: LEBEIGE)</label>
            <input type="text" required value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="제품명을 입력하세요" />
          </div>
          <div className="form-row">
            <div className="input-group">
              <label>수량 (예: 2,000개)</label>
              <input type="text" required value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="작업 수량" />
            </div>
            <div className="input-group">
              <label>납품일</label>
              <input type="text" required value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} placeholder="납품일정 기재" />
            </div>
          </div>
          <div className="input-group">
            <label>중요 안내사항 및 비고</label>
            <textarea value={notice} onChange={(e) => setNotice(e.target.value)} placeholder="예: 500개 먼저 작업 요망 / 한 줄 두 줄 섞이지 않게 주의"></textarea>
          </div>
        </section>

        <section className="form-section">
          <h2>2. 세부 지시사항</h2>
          {tasks.map((task, index) => (
            <div key={index} className="task-input-card">
              <div className="task-header">
                <h3>작업 항목 {index + 1}</h3>
                {index >= 7 && (
                  <button type="button" className="btn-remove" onClick={() => removeTask(index)}>삭제</button>
                )}
              </div>
              <div className="input-group">
                <label>작업 제목 {index < 7 ? '(고정항목)' : ''}</label>
                <input type="text" required value={task.title} onChange={(e) => handleTaskChange(index, 'title', e.target.value)} readOnly={index < 7} />
              </div>
              <div className="input-group">
                <label>작업 설명</label>
                <input type="text" value={task.desc} onChange={(e) => handleTaskChange(index, 'desc', e.target.value)} placeholder="작업 상세 내용 (예: 흰테이프 사용해서 한줄로 앞뒤 돌리기)" />
              </div>
              <div className="input-group file-group">
                <label>카메라 촬영 / 샘플 사진 업로드 (선택사항)</label>
                <input type="file" accept="image/*,video/*" capture="environment" onChange={(e) => handleTaskChange(index, 'file', e.target.files?.[0] || null)} />
              </div>
            </div>
          ))}
          <button type="button" className="btn-add" onClick={addTask}>+ 작업 항목 추가하기</button>
        </section>

        <button type="submit" className="btn-submit" disabled={isSubmitting}>
          {isSubmitting ? '데이터 및 파일 업로드 중...' : '작업지시서 등록 및 배포하기'}
        </button>
      </form>
    </div>
  );
}
