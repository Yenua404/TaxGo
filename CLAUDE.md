# TaxGo 유지보수 안내

일본 면세 환급 절차와 여행 시점에 맞춘 준비를 안내하는 모바일 웹앱입니다. 브라우저에서 `src/index.html`을 열어 개발 화면을 확인하고, `python build.py`로 배포용 `dist/index.html`을 생성합니다.

## 소스 지도

| 파일 | 역할 |
| --- | --- |
| `src/index.html` | 화면 셸, 대화상자, 아이콘과 마스코트 SVG |
| `src/style.css`, `src/theme.css` | 기본 스타일, 라이트·다크와 화면별 레이아웃 |
| `src/data.js` | 공항·항구, 안내, 앱 규칙과 공식 출처 |
| `src/logic.js`, `src/reminders.js` | 세금·기한·도착 목표·알림 일정과 `.ics` 계산 |
| `src/locales.js`, `src/detail-locales.js` | 공통 UI, 공항·체크리스트·알림 번역 |
| `src/pick-data.js`, `src/pick-art.js`, `src/pick-scene.js` | 면세품 PICK의 카탈로그, 상품 그림과 거리 배경 |
| `src/quiz-data.js`, `src/quiz-art.js` | OX 문항·해설·공식 출처, 공항과 캐리어 연출 |
| `src/app.js` | 저장과 화면 상태, 렌더링과 이벤트 연결 |
| `build.py` | 스타일과 스크립트를 배포용 HTML에 삽입 |

## 상태와 호환성

- 여행·영수증·체크리스트는 `taxgo-v1`에 저장합니다. `load()`는 기존 `mygo-taxfree-v1`의 개인 여행을 읽을 수 있고, `cleanState()`가 저장 형식을 정리합니다. `MYGO_DATA`, `MYGO_LOGIC`, `MYGO_APP`은 기존 이름을 사용합니다.
- 신규 영수증은 물품별로 등록합니다. 예전에 저장한 합계형 영수증은 `mode: 'total'`로 조회할 수 있고, 편집 화면에서는 기존 금액을 물품 행으로 불러옵니다. 물품형의 합계는 물품 금액의 합이며 소비 상태는 물품마다 기록합니다.
- `trip.lead`는 출발 몇 시간 전을 도착 목표로 저장할지 나타냅니다. `0`은 자동이며, 권장 시각을 적용하면 `arrivalReviewed`에 완료 여부를 기록합니다.
- 계산에서 쓰는 출국 전 권장 시각은 `data.js`의 `rules.arrive`와 `logic.js`의 `arrivalPlan()`으로 관리합니다. 연휴 범위와 공항 운영 정보는 앱에 들어 있는 참고 데이터입니다.
- 브라우저 저장 키와 QR·알림 사용 범위는 [README](README.md)를 참조합니다.

## 변경과 검증

- 사용자 입력을 HTML 문자열에 넣을 때는 `esc()`를 거칩니다. 버튼은 `data-act`와 `ACT`, 선택 입력은 `data-change`, 화면 갱신 뒤 포커스를 복원할 요소는 `data-key`를 사용합니다.
- 공항 안내의 괄호와 덧붙임 문장은 `splitInfo()`가 표시용으로 나눕니다. 영어와 일본어 도움말을 수정할 때 번역 데이터도 함께 확인합니다.
- 계산을 변경하면 `node test/logic.test.js`와 `node test/reminders.test.js`를 실행합니다. 최종 UI는 `python test/qa_final.py`로 점검합니다. 게임 화면은 다국어 모바일 크기, 다시 시작과 되돌아가기, 동작 줄이기를 확인합니다.
- 브라우저 콘솔에서 실행할 수 있는 기존 양식 입력 진입점은 `window.MYGO_APP.fillReceiptForm({ store, date, total, tax, items: [{ name, price }] })`입니다.
