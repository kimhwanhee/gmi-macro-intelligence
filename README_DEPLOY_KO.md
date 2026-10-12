# GMI 인터넷 배포 — Railway 가이드

## 구성
- `Dockerfile`: Railway가 Python 3.12 애플리케이션을 실행하는 설정
- `server.py`: 공개 서비스용 HTTP/API 서버 (`PORT`, `0.0.0.0` 지원)
- `auto_intel.py`: 외교·국방·통상 뉴스/공식 피드를 기본 60분 간격으로 수집
- `index.html`, `app.js`, `styles.css`, `country-catalog.js`: 지도/국가 인터페이스
- `country-catalog.json`: 250개 국가·지역 기본 정보

## 1. GitHub에 업로드
1. [GitHub](https://github.com)에 로그인 → **New repository** → 이름 `gmi-macro-intelligence` (공개 또는 비공개).
2. 생성한 저장소의 **Add file → Upload files**를 눌러 이 폴더 안의 모든 배포 파일을 업로드합니다. ZIP 자체만 업로드하면 서버가 실행되지 않습니다.
3. **Commit changes**를 누릅니다.

## 2. Railway에 배포
1. [Railway](https://railway.com) 로그인 → **New Project → Deploy from GitHub repo**.
2. 위에서 만든 `gmi-macro-intelligence` 저장소 선택 → 배포.
3. 프로젝트 서비스 **Settings → Networking → Generate Domain**에서 외부 접속 URL을 생성.
4. **Settings → Healthcheck Path**가 설정 가능한 경우 `/api/health`를 입력.
5. **Settings → Deploy**에서 Start Command는 비워 두어 Dockerfile의 `CMD`가 사용되도록 합니다.

## 3. 데이터 영구 보관 — 반드시 설정
Railway 서비스에서 **Volumes → Add Volume**, mount path를 정확히 `/data`로 지정합니다.
이것을 누락하면 뉴스 자동 수집 데이터베이스(SQLite)가 재배포·서버 재시작 시 초기화될 수 있습니다.
이 앱은 **1개 복제본**으로 운영하세요. 여러 복제본으로 늘리면 뉴스 수집이 중복 실행될 수 있습니다.

## 4. Environment Variables (Railway 서비스 → Variables)
필수는 Dockerfile에 기본값으로 제공됩니다. 다음은 필요에 따라 설정하세요.

```
GMI_PUBLIC_MODE=1
GMI_DB_PATH=/data/gmi_intelligence.sqlite3
GMI_REFRESH_MINUTES=60
GMI_AI_MAX_PER_RUN=12
```

- `OPENAI_API_KEY`: 선택. 유효한 OpenAI API 키가 있으면 일부 새 기사에 대해 AI 분류; 없으면 키워드 분류만 합니다. **절대 GitHub 파일이나 브라우저 코드에 넣지 마세요.**
- `GMI_ADMIN_TOKEN`: 선택. 충분히 긴 비밀 임의 문자열을 Railway Variables에 설정하면 관리자만 `POST /api/intel/refresh`를 수동 실행할 수 있습니다. 일반 사용자의 수동 수집 요청은 차단됩니다.
- 기본 설정에서는 자동 수집 자체에 OpenAI API 비용이 들지 않습니다. OpenAI API 키를 설정할 경우 API 비용이 발생할 수 있습니다.
- `PORT`는 Railway가 자동 부여하며 따로 지정하지 않아도 됩니다.

## 5. 웹사이트 확인
- `https://발급된도메인/` : 지도 및 국가별 페이지
- `https://발급된도메인/api/health` : 서버 연결 확인
- `https://발급된도메인/api/intel/status` : 자동 수집 상태
- `https://발급된도메인/api/intel/events` : 저장된 뉴스 사건

최초 수집은 여러 외부 뉴스 API를 순차적으로 호출하므로 시간이 걸릴 수 있습니다. 앱은 수집 결과가 비어도 지도 UI가 동작합니다.

## 6. 관리자 수동 갱신 (선택)
`GMI_ADMIN_TOKEN`을 설정했다면 터미널에서만 아래 예시처럼 실행합니다. 토큰은 실제 값으로 교체하세요.

```
curl -X POST -H "X-GMI-Admin-Token: YOUR_SECRET_TOKEN" https://YOUR_DOMAIN/api/intel/refresh
```

**브라우저 JavaScript 또는 소스코드에 토큰을 넣지 마세요.** Railway 로그나 스크린샷에도 공개하지 마세요.

## 공개 운영 주의
- 공개 배포판은 기본 시연 사건 24건을 **표시하지 않습니다**. 서버에서 자동 수집된 사건만 자동으로 나타납니다. 수집 전에는 지도 사건 마커가 비어 있을 수 있습니다.
- 기사 분류는 확인된 사실/방문 일정 확정이 아니라 미검증 보도입니다.
- 뉴스 데이터 출처(GDELT, RSS)의 사용 조건, 호출 제한 및 링크 처리 정책을 확인하세요.
- 국가별 주식 시세 실시간 제공·공식 방문 일정 자동 확정은 구현되어 있지 않습니다.
- 브라우저에서 직접 등록한 사건/일정은 **그 사용자의 브라우저 로컬 저장소에만** 저장됩니다. 공개 사용자 모두가 공유하는 데이터베이스로 업로드되지는 않습니다.
- 로컬 PC의 사건/일정 역시 도메인이 바뀌면 자동으로 새 사이트로 이관되지 않습니다.
- 기본 내장 SimpleHTTPRequestHandler는 개인용 시험·소규모 데모에 초점을 맞췄습니다. 접속자가 늘어날 경우 로그인, rate limiting, 역방향 프록시, 데이터 사용량 모니터링을 별도로 보강해야 합니다.
- 인프라와 API 과금은 Railway/OpenAI 계약 및 사용량에 따릅니다.

## 로컬 테스트
`start_local.bat`을 실행하거나 `python server.py`를 실행한 후 http://localhost:8765 에 접속하세요.
