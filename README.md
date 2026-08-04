# 🎵 MusicRecord — 학생 악기 연주 녹화 및 제출 웹앱

학교장 인증제 1인 1악기 활동을 위한 웹앱입니다. 학생은 브라우저에서 바로 연주 영상을
녹화해 제출하고, 교사는 영상에 타임스탬프 피드백과 점수를 남기며 학생별 성취(배지)를
관리할 수 있습니다.

## 주요 기능

- **학생**: 학년별 과제곡 확인 → 자세 가이드 오버레이를 보며 카메라 프레이밍 →
  녹화 시작 시 악보 화면으로 전환 → 녹화/재녹화/제출 → 교사 피드백 확인.
  비밀번호 없이 학년/반/번호/이름으로 본인을 식별하며, 서버가 발급하는 세션 쿠키로
  본인 확인을 하고 실제 데이터는 모두 데이터베이스에 남습니다.
- **교사**: 아이디/비밀번호 로그인 → 과제(악기·대상 학년·기한·악보) 생성 →
  제출물 목록 확인 → 영상 재생 중 타임스탬프 코멘트 작성 → 통과/연습 필요 상태 및
  점수 부여 → 학생별 통과곡 수·배지·제출 현황 통계.
- **배지 제도**: 3곡 통과 시 동장 🥉, 5곡 은장 🥈, 8곡 금장 🥇.

## 기술 스택

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Prisma 5.22 (SQLite) — 별도 클라우드 DB 없이 학교 자체 서버에 설치해 운영할 수 있습니다.
  Node 22.12 이상을 요구하는 최신 Prisma 대신 5.x를 사용해 Node 22.11에서도 동작합니다.
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

## Railway로 배포하기

SQLite 파일과 업로드된 영상은 로컬 디스크에 저장되므로, 재배포해도 데이터가 남으려면
**Volume(영구 디스크)이 붙은 서비스**가 필요합니다. Railway는 이를 지원합니다.

1. [railway.app](https://railway.app)에 로그인 → **New Project** → **Deploy from GitHub repo**
   선택 → 이 저장소(`Choiceosori/Claude`)를 연결합니다.
2. 프로젝트가 생성되면 서비스에 **Volume**을 추가하고 마운트 경로를 `/data`로 지정합니다
   (Service → Settings → Volumes → Add Volume → Mount path `/data`).
3. 서비스 **Variables**에 아래 환경변수를 추가합니다.
   ```
   DATABASE_URL=file:/data/dev.db
   SESSION_SECRET=<openssl rand -hex 32 등으로 생성한 긴 랜덤 문자열>
   UPLOAD_DIR=/data/uploads
   ```
4. Deploy를 실행하면 Railway(Nixpacks)가 자동으로 `npm install` → `npm run build`
   (`prisma generate` + `next build`) → `npm run start` (`prisma migrate deploy` + `next start`)
   순서로 빌드·기동합니다. 포트는 Railway가 주입하는 `PORT` 값을 Next.js가 자동으로 사용합니다.
5. Service → Settings → Networking → **Generate Domain**을 누르면 `*.up.railway.app`
   형태의 공개 링크가 생성됩니다. 이 링크가 실제로 접속 가능한 웹앱 주소입니다.
6. 최초 배포 후 교사 계정을 만들어야 합니다. seed 스크립트는 로컬 개발용 기본 계정
   (`teacher`/`teacher1234`)을 만드는 용도이므로, 운영 환경에서는 Railway CLI로 한 번
   실행해 초기 계정을 만들고 **반드시 비밀번호를 바꾸세요**.
   ```bash
   npm install -g @railway/cli
   railway login
   railway link            # 이 프로젝트와 연결
   railway run npx tsx prisma/seed.ts
   ```

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
