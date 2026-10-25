# Somnium UI 디자인 시스템 v1.0 — SUIT Variable

기준: 2026-10-22 · Windows Chrome/Edge 검증 대상 · PR #18

## 확정
- 기본 서체: **SUIT Variable**. 공식 SUIT v2 Variable WOFF2 CSS를 사용하고 Windows 맑은 고딕을 폴백으로 둔다. 고정폭 숫자(tnum) 적용.
- 사이트는 기존 라이트 8개 테마를 유지. 새 UI 의미 토큰은 `--theme-primary`·`--theme-surface`·`--theme-hover`·`--theme-focus`에서 계산한다.
- 버튼: 테마 기반 Primary, Secondary, 고정 위험 빨강 Destructive, Icon. 버리기 진입 버튼은 짙은 테마색 + 흰 글씨(그림자 기반 음각 표현 사용하지 않음).
- 메인 헤더 버튼은 저장 관리자가 왼쪽, 설정이 가장 오른쪽. 두 아이콘 버튼의 크기/반응 동일.
- 인벤토리: 체크박스는 버리기 모드에서만 표시. 전체 선택 없음. 마우스 hover 또는 선택 시 아이템 행 **전체** 배경이 함께 변화. 자식 버튼/레이블 배경은 투명.
- 폼: 체크박스 19px, 입력 높이 약 38px, 네이티브 select 기능은 보존하고 외관만 일관화. 키보드 focus-visible은 별도 윤곽선 표시.
- 저장 관리자: 패딩 24px, 큰 그룹 간 간격 24px, 자동 저장 필드/설정 체크/버튼을 세로로 구분. 구분선 다음 저장 슬롯 섹션 20px. 버튼 높이 38px.

## 코드
- `src/v9.css`: 기존 v8 계층을 불러온 뒤 역할 기반 토큰/컨트롤 CSS를 선언.
- `src/v3.js`: 저장·설정 헤더 순서 교정, 저장 관리자 섹션/필드 레이블 구조 개선, 슬롯 없음 안내.
- `index.html`: v9 진입 CSS로 변경.
- `tests/ui-design-system-v1.test.mjs`: 새 UI 계약의 정적 회귀 검사.

## 주의
공식 SUIT CDN CSS를 사용하므로 **인터넷이 완전히 차단된 환경에서 SUIT 글꼴이 로드되지 않을 수 있다**. 그때는 맑은 고딕으로 대체된다. 웹폰트를 로컬 WOFF2로 포함하고 SIL OFL 라이선스 고지를 배포하는 일은 배포 패키징 작업으로 남긴다. 이번 PR에는 폰트 바이너리를 추가하지 않았다.

## Windows PowerShell 테스트
```powershell
git fetch origin
git switch feat/ui-design-system-suit-v1
git pull --ff-only
npm install
npm run check
py -m http.server 8000
```
브라우저 주소: `http://localhost:8000/`. Python 런처가 없다면 `python -m http.server 8000`.

Windows Chrome과 Edge에서 두 화면 폭(예: 1440px, 800px)과 8개 라이트 테마 확인:
1. 최상단 오른쪽에 **저장 → 설정** 순서.
2. 인벤토리 일반 상태: 체크박스 없음. 버리기 클릭: 체크박스 표시. 호버/선택 시 **행 전체** 강조. 전체 선택 없음.
3. 각 테마에서 버리기 짙은 배경·흰 글씨, 최종 영구 삭제는 진홍색 hover.
4. 저장 관리자: 자동 저장 제목 → 위쪽 레이블/숫자 → 다음 줄 체크박스 → 오른쪽 설정 적용. 구분선과 저장 슬롯 헤더 간격. 빈 상태 버튼 위치.
5. 입력 필드·드롭다운·체크박스의 hover, Tab/Shift+Tab 키보드 포커스.
6. 모달 Enter/Escape, 저장/복구 승인, Windows 글꼴 크기 125%에서 레이아웃 깨짐 확인.

## 참고
- SUIT 공식 프로젝트: https://github.com/sun-typeface/SUIT
- Fluent 2 Layout: https://fluent2.microsoft.design/layout
- Windows Forms guidance: https://learn.microsoft.com/en-us/windows/apps/design/controls/forms
- Adobe Spectrum 2 States: https://spectrum.adobe.com/foundations/behavior/states
