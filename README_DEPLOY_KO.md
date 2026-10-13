# GMI v6 · 국가 주요 지도부 + 거시경제 API 안정화

## 이번 업데이트
- 지도부: 국가별로 대통령·부통령, 국가주석·국무원 총리, 총리·국왕 등 **서로 다른 공식 직책 두 개**를 표시합니다. 화면에는 임의의 '서열'이나 '순위'를 표시하지 않습니다.
- 2026-10-13 기준 정부 공식 출처를 확인한 **미국·중국·한국·일본·영국·러시아**의 빠른 기본 명단을 내장합니다. 나머지 국가에서는 기존 Wikidata 조회를 이용하며, 사실 확인이 어려우면 1명만 표시할 수 있습니다.
- 지도부 API `/api/leadership?country=CHN`: 빠른 기본 명단과 정부 출처를 반환합니다. 외부 Wikidata가 느려도 위 6개국은 대기하지 않습니다.
- 국가 비교 API `/api/macro-compare?countries=USA,CHN,JPN,KOR&indicator=NY.GDP.MKTP.KD.ZG` 신규 추가. 선택한 최대 4개 국가를 세계은행에 한 번에 요청하고, 실패 시 저장된 과거 성공 응답을 이용합니다.
- `/api/macro-bundle?country=CHN`: 여러 지표 한 번에 요청 → 실패 시 각 지표를 별도로 병렬 재시도 → 마지막 성공 데이터 활용. 빈 결과를 오래 캐시하지 않습니다.
- 초기 로딩과 외부 자료 장애를 구분하고, 재시도 버튼을 제공합니다. 캐시 정보는 '이전 조회 자료'로 표시합니다.
- v5의 어두운 테두리 카드 스타일은 그대로 유지합니다.

## GitHub / Railway 업데이트 순서
1. 배포하기 전 현재 GitHub 저장소를 별도 ZIP으로 내려받아 백업합니다.
2. 이 배포 ZIP을 압축 해제합니다. **폴더 안의 파일들을 저장소 최상위**(`Dockerfile`이 있는 곳)에 업로드합니다.
3. GitHub에서 Commit changes 합니다.
4. Railway → Deployments에서 최신 배포가 ACTIVE인지 확인합니다.
5. 기존 사이트에서 Ctrl+Shift+R을 누릅니다. 기존 Railway 도메인을 재발급할 필요는 없습니다.

## 데이터가 여전히 안 뜰 때 빠른 확인
- `https://<내-도메인>/api/health` → status가 `ok`인지 확인
- `https://<내-도메인>/api/leadership?country=CHN` → `people` 배열에 시진핑/리창 두 인물이 있는지 확인
- `https://<내-도메인>/api/macro-compare?countries=USA,CHN&indicator=NY.GDP.MKTP.KD.ZG` → `indicators` 항목에 두 나라 시계열이 포함되는지 확인
- `https://<내-도메인>/api/macro-bundle?country=USA` → `indicators`에 6개 시계열 항목이 있는지 확인

응답에 `error: source_temporarily_unavailable`가 나오면 세계은행 응답 지연/네트워크 문제일 수 있습니다. 처음 배포한 사이트에 캐시가 없다면 자료가 일시적으로 비어 보일 수 있습니다. Railway의 **Deploy Logs**에서 통신 오류를 확인하세요.

### 데이터 영구 저장
Railway Volume을 `/data`에 마운트하세요. Python 서버는 `GMI_DB_PATH=/data/gmi_intelligence.sqlite3`에 자동 인텔리전스 데이터를 보관하고, 새 거시경제 캐시도 같은 폴더에서 저장합니다. Volume이 없다면 재배포할 때 캐시가 소실될 수 있습니다.

### 검증 범위
- Python 소스 컴파일 및 JS 구문 검사
- 로컬 API를 통한 중국 주요 지도부 2명 반환
- 모의 세계은행 데이터를 이용한 차트 렌더링 및 캐시 오류 복원 테스트
- 실제 Chrome 렌더링 확인(외부 인터넷은 제한돼 있어 TradingView 및 World Bank의 실시간 응답은 확인하지 못함)

### 중요
- 인물 명단은 검증 시점(2026-10-13)의 공식 발표에 기반한 스냅샷으로, 인사 교체를 실시간 검증했다는 의미는 아닙니다.
- 이미 저장된 이전 성공 데이터가 없고 World Bank 접속도 실패한 경우에는 수치를 만들어 채우지 않습니다.
- 일부 국가의 정치 구조에는 대통령과 총리 같은 구분이 없거나 동일인이 겸직합니다. 서로 다른 인물이 확인되지 않으면 임의의 두 번째 인물을 만들지 않습니다.
- 업로드 전 `.env`, API 키, SQLite DB 파일을 GitHub에 올리지 마세요.
