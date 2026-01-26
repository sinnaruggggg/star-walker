# Solar Explorer - Claude 세션 가이드

## ⚠️ 절대 건드리지 말 것

### Google 로그인 redirectTo (js/multiplayer.js)
```javascript
// ★★★ 절대 변경 금지 ★★★
const siteUrl = 'https://star-strider-seven.vercel.app';
redirectTo: siteUrl
```
- **절대로** `window.location.origin` 사용 금지
- 이 값 바꾸면 500 에러 발생
- 이미 여러 번 이 문제로 시간 낭비함

---

## 프로젝트 구조 (2026-01-26 분리 완료)

```
index.html          - 3,524줄 (HTML + 셰이더)
css/main.css        - 5,156줄 (모든 CSS)
js/main.js          - 20,119줄 (메인 게임 로직, ES Module)
js/multiplayer.js   - 2,235줄 (멀티플레이어 + 오디오)
js/systems.js       - 2,518줄 (광고, 보상 시스템)
js/mission.js       - 274줄 (미션 시스템)
js/cockpit-buttons.js - 60줄 (조종석 버튼 초기화)
```

## 배포

- URL: https://star-strider-seven.vercel.app
- **배포 방법: `git push origin main` (자동 배포)**
- ⚠️ `vercel --prod --yes` 사용 금지 (잘못된 프로젝트에 배포됨)
- Vercel 프로젝트명: `star-strider` (star-strider-seven 아님!)

## 주요 파일 설명

### js/main.js (ES Module)
- Three.js 임포트 및 초기화
- 우주선, 행성, 카메라 제어
- 조종석 렌더링

### js/multiplayer.js
- Supabase Realtime 연동
- 다른 플레이어 동기화
- SpaceAudio 시스템

### js/systems.js
- 광고 보상 시스템
- Google 로그인
- 인증 UI

### js/mission.js
- 미션 데이터 (다국어)
- 미션 진행 로직

## 수정 시 주의사항

1. **js/main.js**: ES Module이므로 `import/export` 구문 유지
2. **로드 순서**: index.html에서 스크립트 순서 중요
3. **전역 변수**: 파일 간 공유되는 전역 변수 주의
4. **셰이더**: index.html에 인라인으로 유지 (ID로 참조)

## 백업 브랜치

- `backup-before-split`: 분리 작업 전 상태

## Google OAuth 설정

### Supabase 프로젝트
- URL: `https://sfirzuqngdbpwvdoyero.supabase.co`
- Callback URI: `https://sfirzuqngdbpwvdoyero.supabase.co/auth/v1/callback`

### Google Cloud Console 설정 필요
1. **OAuth 2.0 클라이언트 ID** 생성
2. **승인된 리디렉션 URI**에 추가:
   ```
   https://sfirzuqngdbpwvdoyero.supabase.co/auth/v1/callback
   ```
3. Client ID와 Client Secret을 **Supabase 대시보드** → Authentication → Providers → Google에 입력

### Site URL 설정
- Supabase Authentication → URL Configuration → Site URL:
  ```
  https://star-strider-seven.vercel.app
  ```

### 코드 주의사항 (500 에러 원인)
- `googleLogin()` 함수의 `redirectTo`는 **반드시** Site URL과 정확히 일치해야 함
- 파일: `js/multiplayer.js` 라인 1506
- **잘못된 예**: `window.location.origin + window.location.pathname` (경로가 붙으면 안됨)
- **올바른 예**: `'https://star-strider-seven.vercel.app'` (슬래시 없이)
- 이 값이 틀리면 Supabase 콜백에서 500 에러 발생함
