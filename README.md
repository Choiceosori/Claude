# 🎵 MusicRecord — 학생 악기 연주 녹화 및 제출 웹앱

학교장 인증제 1인 1악기 활동을 위한 웹앱입니다. 학생은 브라우저에서 바로 연주 영상을
녹화해 제출하고, 교사는 영상에 타임스탬프 피드백과 점수를 남기며 학생별 성취(배지)를
관리할 수 있습니다.

## 주요 기능

- **학생**: 학년별 과제곡 확인 → 자세 가이드 오버레이를 보며 카메라 프레이밍 →
  녹화 시작 시 악보 화면으로 전환 → 녹화/재녹화/제출 → 교사 피드백 확인.
  비밀번호 없이 학년/반/번호/이름으로 본인을 식별하며, 서버가 발급하는 세션 쿠키로
  본인 확인을 하고 실제 데이터는 모두 데이터베이스에 남습니다.
- **교사**: 아이디/비밀번호 로그인 → 과제(악기·대상 학년·기한·악보) 생성·수정 →
  제출물 목록 확인 → 영상 재생 중 타임스탬프 코멘트 작성 → 통과/연습 필요 상태 및
  점수 부여 → 학생별 통과곡 수·배지·제출 현황 통계 → 학생 정보 추가/수정/삭제
  ("학생 관리" 페이지).
- **관리자(전체 관리자)**: 계정은 하나만 존재하며, 교사 계정을 생성·삭제할 수 있는
  "계정 관리" 페이지(`/teacher/admin`)에 접근할 수 있습니다. 일반 교사는 이 페이지에
  접근할 수 없습니다.
- **배지 제도**: 3곡 통과 시 동장 🥉, 5곡 은장 🥈, 8곡 금장 🥇.

## 기술 스택

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4, Vercel 배포 기준으로 구성
- Prisma 5.22 + PostgreSQL (Neon / Supabase / Vercel Postgres 등 아무 Postgres나 가능)
- Vercel Blob — 녹화 영상·악보 파일 저장소. 모두 `access: "private"`로 업로드되어
  Blob의 원본 URL은 클라이언트에 절대 노출되지 않고, 우리 서버가 매번 "교사 본인이거나
  제출자 본인인지" 확인한 뒤에만 `/api/media/...` 라우트를 통해 스트리밍해 줍니다.
- 브라우저 `MediaRecorder` / `getUserMedia` API로 영상·음성 녹화
- **업로드는 브라우저 → Vercel Blob 직접 업로드** 방식입니다. Vercel 서버리스 함수는
  요청 본문이 4.5MB를 넘으면 거부하기 때문에(영상 녹화 파일은 보통 이보다 훨씬 큼),
  우리 서버(`/api/blob/upload`)는 짧은 업로드 토큰만 발급하고, 실제 파일 바이트는
  브라우저가 Blob에 직접 올립니다. 업로드가 끝나면 브라우저가 결과 경로를 우리 서버에
  알려줘서 DB에 제출/악보 레코드를 기록합니다.

## 시작하기

```bash
npm install
cp .env.example .env   # DATABASE_URL, BLOB_READ_WRITE_TOKEN, SESSION_SECRET 값 채우기
npx prisma migrate dev # DB 테이블 생성 + 마이그레이션 (seed 자동 실행)
npm run dev
```

기본 관리자 계정 (seed 데이터): `teacher` / `teacher1234` — 이 계정이 유일한 전체 관리자이며,
`/teacher/admin`에서 교사 계정을 추가로 만들 수 있습니다. `npm run build`가 실행될 때마다
seed가 자동으로 다시 실행되어 이 관리자 계정의 비밀번호·권한을 항상 환경변수 값으로 맞춰
둡니다(로그인이 안 될 때 복구 수단이기도 합니다). **운영 환경에서는 `ADMIN_USERNAME`
/ `ADMIN_PASSWORD` 환경변수로 반드시 기본값 대신 직접 지정하세요.**

- 학생 페이지: [http://localhost:3000/student](http://localhost:3000/student)
- 교사 페이지: [http://localhost:3000/teacher](http://localhost:3000/teacher)

## Vercel로 배포하기

1. **Postgres 준비**: 이미 쓰는 Postgres(Neon/Supabase 등)가 있다면 연결 문자열을
   준비하세요. 없다면 Vercel 대시보드 → Storage 탭 → Create Database → Postgres로
   몇 번의 클릭만으로 만들 수 있고, 프로젝트에 연결하면 `DATABASE_URL`이 환경변수에
   자동으로 채워집니다.
2. **Vercel Blob 준비**: Vercel 대시보드 → Storage 탭 → Create Database → Blob으로
   스토어를 만들고 프로젝트에 연결하면 `BLOB_READ_WRITE_TOKEN`이 자동으로 채워집니다.
3. [vercel.com](https://vercel.com)에서 **Add New → Project** → 이 저장소
   (`Choiceosori/Claude`)를 가져옵니다. Next.js 프로젝트라 빌드 설정은 자동 인식됩니다.
4. Project Settings → **Environment Variables**에 아래 값을 추가합니다 (Postgres/Blob을
   위 1~2번에서 Vercel 대시보드로 연결했다면 `DATABASE_URL`/`BLOB_READ_WRITE_TOKEN`은
   이미 채워져 있을 수 있어요 — 없으면 직접 추가).
   ```
   DATABASE_URL=<Postgres 연결 문자열>
   BLOB_READ_WRITE_TOKEN=<Vercel Blob 토큰>
   SESSION_SECRET=<openssl rand -hex 32 등으로 생성한 긴 랜덤 문자열>
   ADMIN_USERNAME=<원하는 관리자 아이디>
   ADMIN_PASSWORD=<원하는 관리자 비밀번호, 8자 이상>
   ```
   `ADMIN_USERNAME`/`ADMIN_PASSWORD`는 실제 운영할 값으로 반드시 바꿔서 넣으세요 —
   기본값(`teacher`/`teacher1234`)을 그대로 두면 초기 로그인 정보가 이 README에
   공개된 것과 같아집니다.
5. **Deploy**를 누르면 Vercel이 `npm install` → `npm run build`를 실행합니다. 빌드
   스크립트 안에서 `prisma generate` → `prisma migrate deploy`(스키마 적용) →
   `prisma db seed`(관리자 계정 동기화) → `next build` 순서로 전부 자동 처리되므로,
   별도 CLI 설치나 수동 마이그레이션이 필요 없습니다. 로그인이 안 될 때도
   `ADMIN_PASSWORD`를 바꾸고 재배포(Redeploy)하면 복구됩니다.
6. 배포가 끝나면 Vercel이 자동으로 `https://<project>.vercel.app` 링크를 만들어
   줍니다 — Project 대시보드 상단에 바로 뜹니다. 이 링크가 실제로 접속 가능한 웹앱
   주소입니다.
7. 관리자로 로그인한 뒤 `/teacher/admin`(헤더의 "계정 관리")에서 실제 사용할 교사 계정을
   따로 만들어 나눠 주세요.

> **참고**: git push마다(프리뷰 배포 포함) `prisma migrate deploy`가 실행됩니다. 운영
> 중인 메인 브랜치 배포와 별개로 프리뷰 배포를 자주 만드는 경우, 같은 프로덕션 DB에
> 스키마 변경이 함께 적용된다는 점을 참고하세요 — 이 프로젝트 규모에서는 문제되지
> 않지만, DB를 환경별로 분리하고 싶다면 Vercel의 Preview/Production 환경변수를
> 다르게 설정하면 됩니다.

## 프로젝트 구조

```
app/
  student/                학생용 페이지 (대시보드, 녹화, 제출물 보기)
  teacher/                교사용 페이지 (로그인, 대시보드, 과제 관리, 학생 관리, 계정 관리, 평가)
  api/                    REST 스타일 API 라우트
  api/blob/upload/        브라우저 → Vercel Blob 직접 업로드용 토큰 발급 라우트
components/               카메라 녹화기, 자세 가이드 오버레이, 영상+피드백 플레이어 등
lib/                      prisma client, 인증, 배지 계산, Blob 삭제/업로드 헬퍼, 악기별 가이드 정보
prisma/                   schema, migrations, seed
```

## 참고 사항 / 향후 로드맵

- 개인정보 보호: 학생은 비밀번호 없이 학년/반/번호/이름으로 식별되며, 영상·악보는
  Vercel Blob에 비공개(`private`)로 저장되어 우리 서버가 매 요청마다 본인/교사 여부를
  확인한 뒤에만 스트리밍합니다. 과제나 학생 레코드를 삭제하면 연결된 Blob 파일도
  함께 정리됩니다(최선 노력 기준— DB 삭제 자체는 영향받지 않습니다).
- Phase 3(로드맵)로 제안되었던 MediaPipe 기반 자동 자세 분석, 음높이/박자 자동 채점은
  아직 포함되어 있지 않습니다.
