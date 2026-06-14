Storage 없이 완전 무료 PWA 작업지시서 설치 방법

1. Firestore 규칙 설정
Firebase 콘솔 > Firestore Database > 규칙에 아래 내용을 그대로 넣고 [게시]하세요.

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /workOrders/{document=**} {
      allow read, write: if true;
    }
  }
}

주의: rules_version 줄은 한 번만 있어야 합니다.

2. firebase-config.js 수정
Firebase 콘솔 > 프로젝트 설정 > 내 앱(task-web) > SDK 설정 및 구성에서 firebaseConfig 값을 복사합니다.
이 폴더의 firebase-config.js 파일을 열어 PASTE_YOUR_API_KEY, PASTE_YOUR_SENDER_ID, PASTE_YOUR_APP_ID를 실제 값으로 교체합니다.
Storage 관련 설정은 필요 없습니다.

3. 사진/동영상 사용 방법
사진/동영상 파일은 Firebase Storage에 올리지 않습니다.
Google Drive에 업로드한 뒤 공유 설정을 '링크가 있는 모든 사용자 보기 가능'으로 바꾸고, 그 링크를 작업 항목의 사진링크/영상링크 칸에 붙여넣습니다.
YouTube 동영상 링크도 사용 가능합니다.

4. Firebase Hosting 배포
이 폴더에서 터미널을 열고 아래 명령을 실행합니다.

npm install -g firebase-tools
firebase login
firebase deploy

firebase init hosting을 다시 할 필요 없이 firebase.json과 .firebaserc가 포함되어 있습니다.
프로젝트 ID가 다르면 .firebaserc의 work-order-ca2c2를 본인 프로젝트 ID로 바꾸세요.

5. 휴대폰 설치
배포된 Hosting 주소를 휴대폰 Chrome에서 엽니다.
오른쪽 위 메뉴 > 홈 화면에 추가를 누르면 앱처럼 설치됩니다.

6. 테스트
Firebase 설정 전에도 같은 휴대폰/브라우저에서는 임시 저장(localStorage)으로 테스트됩니다.
여러 휴대폰에서 같이 보려면 Firestore 설정과 firebase-config.js 설정 후 Hosting에 배포해야 합니다.
