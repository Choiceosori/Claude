# 🎵 MusicRecord — 학생 악기 연주 녹화 및 제출 웹앱

학교장 인증제 1인 1악기 활동을 위한 웹앱입니다. 학생은 브라우저에서 바로 연주 영상을
녹화해 제출하고, 교사는 영상에 타임스탬프 피드백과 점수를 남기며 학생별 성취(배지)를
관리할 수 있습니다.

## 주요 기능

- **학생**: 학년별 과제곡 확인 → 자세 가이드 오버레이를 보며 카메라 프레이밍 →
  녹화 시작 시 악보 화면으로 전환 → 녹화/재녹화/제출 → 교사 피드백 확인.
  로그인 없이 학년/반/번호/이름으로 본인을 식별합니다(브라우저 `localStorage`에 저장).
- **교사**: 아이디/비밀번호 로그인 → 과제(악기·대상 학년·기한·악보) 생성 →
  제출물 목록 확인 → 영상 재생 중 타임스탬프 코멘트 작성 → 통과/연습 필요 상태 및
  점수 부여 → 학생별 통과곡 수·배지·제출 현황 통계.
- **배지 제도**: 3곡 통과 시 동장 🥉, 5곡 은장 🥈, 8곡 금장 🥇.

## 기술 스택

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Prisma 7 (SQLite, `@prisma/adapter-better-sqlite3`) — 별도 클라우드 DB 없이 학교 자체
  서버에 설치해 운영할 수 있습니다.
- 브라우저 `MediaRecorder` / `getUserMedia` API로 영상·음성 녹화
- 업로드된 영상/악보는 로컬 디스크(`storage/uploads`)에 저장되고, Range 요청을 지원하는
  자체 미디어 API로 서빙됩니다.

## 시작하기

```bash
npm install
cp .env.example .env   # 필요시 SESSION_SECRET 등 값 수정
npx prisma migrate dev # DB 생성 + 마이그레이션 (seed 자동 실행)
npm run dev
```

기본 교사 계정 (seed 데이터): `teacher` / `teacher1234` — **운영 환경에서는 반드시
비밀번호를 변경하세요.**

- 학생 페이지: [http://localhost:3000/student](http://localhost:3000/student)
- 교사 페이지: [http://localhost:3000/teacher](http://localhost:3000/teacher)

## 프로젝트 구조

```
app/
  student/                학생용 페이지 (대시보드, 녹화, 제출물 보기)
  teacher/                교사용 페이지 (로그인, 대시보드, 과제 관리, 평가)
  api/                    REST 스타일 API 라우트
components/               카메라 녹화기, 자세 가이드 오버레이, 영상+피드백 플레이어 등
lib/                      prisma client, 인증, 배지 계산, 파일 저장, 악기별 가이드 정보
prisma/                   schema, migrations, seed
storage/uploads/          업로드된 영상·악보 (git에는 포함되지 않음)
```

## 참고 사항 / 향후 로드맵

- 개인정보 보호: 학생은 비밀번호 없이 학년/반/번호/이름으로 식별되며, 영상은 본인 또는
  교사만 조회할 수 있도록 서버에서 접근을 제한합니다. 실제 학교 운영 시에는 HTTPS 배포와
  주기적 데이터 정리가 필요합니다.
- Phase 3(로드맵)로 제안되었던 MediaPipe 기반 자동 자세 분석, 음높이/박자 자동 채점은
  아직 포함되어 있지 않습니다.
