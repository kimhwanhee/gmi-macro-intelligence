# GMI v10 — 국가별 시가총액 상위 3개 기업

이번 버전은 기존 v9 서버 복구 버전을 기반으로 합니다. 기존 금융시장 탭의 대표 지수와 TradingView 차트를 **삭제**하고, 국가별 기업 재무 비교 화면으로 대체합니다. 지도·외교·정치·거시경제·뉴스의 기존 기능은 유지합니다.

## 금융시장 탭에 표시되는 항목

- 해당 국가에 **본사를 둔** 상장기업의 데이터 제공처 시가총액 상위 최대 3개
- 기업 이름·티커·섹터·시가총액
- 최근 5개 회계연도의 **매출 성장률(CAGR)**: 비교 가능한 연도 기준 5년 간격의 연간 매출로 계산
- **ROE (TTM)**: 최근 12개월 자기자본이익률
- 발표된 기간·데이터 확인일·출처
- 한국어 / 영어 / 중국어 UI 및 섹터 이름 번역

**주의:** 이는 국가 증권거래소에 상장된 3대 기업이 아니라 *본사 소재 국가 기준*입니다. 일부 국가·지역은 데이터 제공처의 커버리지, API 사용 권한 또는 상장기업 부재로 결과가 없을 수 있습니다. 시가총액 통화는 데이터 제공처에서 확인해야 합니다. 5년 간격의 매출이 없으면 CAGR을 임의로 만들지 않고 미제공으로 표시합니다. 은행·지주회사에는 매출 CAGR이 일반 기업과 동일하게 해석되지 않을 수 있습니다.

## Railway 설정 (중요)

글로벌 주식·재무정보는 **Financial Modeling Prep (FMP)**의 별도 API 서비스를 이용합니다. ChatGPT 구독과는 별도이며 FMP 요금제에 따라 해외 기업/과거 재무자료를 이용할 수 없을 수 있습니다.

1. FMP에서 계정을 만들고 해당 요금제의 글로벌 스크리너·연간 손익계산서·TTM key metrics 사용 권한을 확인합니다: <https://site.financialmodelingprep.com/developer/docs/stable/search-company-screener>
2. Railway의 기존 `humorous-vibrancy` 서비스 → **Variables**에서 새 변수 추가
   - 이름: `FMP_API_KEY`
   - 값: 사용자 본인의 FMP API 키
3. 변수 적용 뒤 자동 재배포 또는 Redeploy를 수행합니다.
4. 예시 확인: `https://<실제-도메인>/api/top-companies?country=JPN` (실제 도메인을 넣기)
5. 응답의 `status`가 `loading`이면 새 데이터가 수집 중이며, 화면은 자동으로 재조회합니다. `ok`면 결과가 준비된 것입니다.

**절대로 `.env`, API 키, 결제 정보를 GitHub 저장소에 올리지 마세요.** FMP 키는 서버에서만 사용합니다. 키가 없으면 가짜 기업 데이터를 표시하지 않고 연결 설정 안내를 표시합니다.

## 기존 GitHub + Railway 업데이트 방법

1. ZIP을 압축 해제합니다.
2. 저장소 <https://github.com/kimhwanhee/gmi-macro-intelligence>의 루트에서 **Add file → Upload files**를 누릅니다.
3. 폴더 자체가 아니라 **폴더 안의 모든 배포 파일**을 업로드하고 Commit changes를 누릅니다.
4. Railway Deployments에서 최신 배포가 **Active** 상태인지 확인합니다.
5. 기존 사이트에서 **Ctrl+Shift+R** 새로고침 후 국가를 클릭하고 금융시장 탭을 확인합니다.

새 프로젝트나 새 도메인을 만들 필요는 없습니다. Railway 앱은 기존 서버가 정상적으로 시작되어야 작동합니다.

## 테스트 내용과 한계

- 백엔드 단위 테스트: 기업 정보 없는 상태, 가상의 역순 스크리너 결과 정렬, ETF 제외, CAGR 계산, ROE 변환 통과
- Python 컴파일 및 JavaScript 구문 검사 통과
- 공개 모드에서 `/api/health` 및 `/api/top-companies?country=JPN`의 HTTP 응답 확인
- 내부 `companies_data.py`에 대한 URL 접근 차단 확인
- 브라우저의 모의 응답 테스트: 기업 3개 카드 표시, 다국어 제목, TradingView iframe 0개, JS 오류 0개
- **실제 FMP API 키 없이 최신 기업별 실데이터 호출은 검증하지 못했습니다.** FMP API 구독 권한과 시장·기업별 커버리지는 별도로 검증해야 합니다.

## 참고 데이터 정의

- 시가총액: 제공처 `company-screener`의 `marketCap`
- 기업 분류: 제공처의 `sector` / `industry`
- 5년 매출 CAGR: `((마지막 FY revenue / 5년 전 FY revenue)^(1/5) - 1) × 100`. 양 끝 두 연도에 매출액이 있어야 계산합니다.
- ROE: `key-metrics-ttm`의 `returnOnEquityTTM × 100`
- 서버 캐시: 조회 성공 시 12시간 기준, 실패 시 이전 데이터(있을 때) 유지
