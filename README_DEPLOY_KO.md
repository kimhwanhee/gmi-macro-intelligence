# GMI v8 — 정치 지도부·고위급 일정·거시경제 비교 업데이트

## 변경 사항

1. CIA World Leaders의 국가별 각료 명단 수집 규칙을 수정했습니다. 국가마다 다른 장관 명칭(미국의 Secretary, 케냐의 Cabinet Secretary, 남아공의 International Relations, 멕시코의 External Relations 등)을 **외교 / 국방 / 통상·경제 / 재무** 카테고리로 자동 정리합니다. 조회 결과에는 원어 직책·원문 링크·자료 기준일을 함께 표시합니다.
2. 아프리카 **남아공·나이지리아·케냐·가나**, 미주 **멕시코·브라질·콜롬비아**의 출처 날짜가 명시된 명단을 초기 화면에 포함했습니다. 기존 약 37개 국가의 명단도 유지됩니다. 250개 지역 전체는 국가별 조회 페이지를 유지하지만 실제 현직자 검증 범위는 다릅니다. 정부 인사 변동과 수집 대상 출처의 발표 지연에 유의하십시오.
3. 새 `v8-intelligence.js`는 정치·권력구조 탭에서 장관 4개 유형을 우선 보여줍니다. **해당 국가의 헌정·제도적 직책**을 보여주는 것이지 정치인 서열을 평가하지 않습니다.
4. 외교·안보·통상 탭에서는 최고위 지도부, 외교·국방·통상·재무 담당자의 **이름 / 직책 / 예정된 방문일·회담일**을 구분한 행을 제공합니다. 기사 제목 또는 공식 발표에서 실제 **방문일을 확인하지 못하면 예정 일정으로 등록하지 않습니다**. 보도 자체는 별도의 '관련 보도' 영역에 표시합니다. `OPENAI_API_KEY`가 등록되면 기존 기사 제목 AI 구조화 기능을 사용할 수 있지만 뉴스 제목만으로는 공식 확정으로 처리하지 않습니다.
5. 거시경제 6개 지표(실질 GDP 성장률, 소비자물가상승률, 실업률, 무역/GDP, 경상계정, 금융계정) 유지. **비율은 %를 유지**, 경상·금융계정의 금액 지표만 선택 언어에 따라 한국어 KRW, 중국어 CNY, 영어 USD로 자동 변환합니다. Frankfurter에서 실제 환율을 가져오고 환율 기준일을 표시하며, **현재 환율로 환산한 참고값**이지 당시 연도의 역사적 환율로 환산한 통계가 아닙니다. 환율 소스가 응답하지 않으면 원래 USD를 유지하며 임의 환율을 쓰지 않습니다.
6. `/api/macro-compare` 및 `/api/macro-bundle`의 World Bank 국가·지역 코드 처리, 응답 오류 분리, 자료 미제공 상태 처리를 개선했습니다. 해당 국가에 통계가 제공되지 않으면 지표 없음으로 표시합니다. 여전히 World Bank의 통계 미수록 지역은 존재합니다.
7. **국가 비교에서 '데이터 CSV 다운로드' 버튼을 즉시 사용 가능**하게 만들었습니다. CSV에는 개별 국가·연도·원래 지표·원 단위·선택 언어의 환산값·사용 환율 및 날짜·데이터 상태가 포함됩니다. 원격 데이터가 없는 경우 상태를 표시합니다.
8. 서버에 `/api/fx`(기본 통화 USD, KRW/CNY 환산율) 엔드포인트를 추가했습니다.

## 배포

기존 GitHub 저장소 `kimhwanhee/gmi-macro-intelligence`에서 `Add file → Upload files`를 눌러 이 ZIP의 **최상위 파일 전체**를 업로드하고 `Commit changes`를 누르세요. 특히 `Dockerfile`, `server.py`, `political_data.py`, `political-snapshots.json`, `macro_data.py`, `fx_data.py`, `index.html`, `v8-intelligence.js`, `v8-intelligence.css`가 최상위에 있어야 합니다. Railway가 `Active`로 바뀌면 `Ctrl + Shift + R`로 새로고침하세요.

Railway에서 `/data` 경로의 Volume이 연결되어 있으면 지도부·거시경제·환율 캐시가 재배포 후에도 보존됩니다. `OPENAI_API_KEY`는 Railway > Variables에만 보관하며 GitHub에는 올리지 마세요.

## 점검용 주소

- `/api/health`
- `/api/politics?country=ZAF` (남아공)
- `/api/politics?country=NGA` (나이지리아)
- `/api/politics?country=BRA` (브라질)
- `/api/politics?country=MEX` (멕시코)
- `/api/macro-bundle?country=GHA`
- `/api/macro-compare?countries=USA,KOR,CHN,JPN&indicator=NY.GDP.MKTP.KD.ZG`
- `/api/fx`

`/api/politics` 첫 요청은 날짜가 있는 기본 인물을 먼저 보여주고, 내각·의회 최신 조회는 백그라운드에서 진행합니다. 최신 자료를 내려받지 못했거나 발표가 없다면 그 상태를 정직하게 유지합니다.

## 시험 및 한계

- Python 모듈 구문 및 주요 단위 테스트, JavaScript 구문 검사 통과.
- API 첫 응답과 기본 명단·직책 분류는 로컬 서버로 확인했습니다.
- 실제 외부 World Bank/CIA/Frankfurter 요청과 Chromium 자동 브라우저 접속은 본 환경의 외부 연결/접속 정책으로 검증되지 않았습니다. Railway에 적용한 후 실제 응답을 점검해야 합니다.
- 전 세계 모든 250개 국가·지역의 최고위 인물 3명, 모든 장관, 모든 방문 일정을 실시간으로 제공한다고 보장하지 않습니다.

## 출처

- CIA World Leaders: https://www.cia.gov/resources/world-leaders/
- IPU Parline: https://data.ipu.org/
- World Bank WDI: https://data.worldbank.org/
- Frankfurter: https://frankfurter.dev/
