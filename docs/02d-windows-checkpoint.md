# 02-D — Windows 검증 지침 및 체크포인트

2026-10-22. Windows 10/11 PowerShell 기준. 기준 브랜치: `feat/02d-checkpoint-windows`.

## 준비
PowerShell에서 저장소 폴더를 열고:
```powershell
git fetch origin
git switch feat/02d-checkpoint-windows
git pull --ff-only
npm install
npm run check
py -m http.server 8000
```
Windows에 `py` 명령이 없으면 설치된 Python에 따라 `python -m http.server 8000`을 사용한다. Windows에서 `node`, `npm` 명령이 인식되지 않으면 Node.js LTS 설치 및 PATH부터 확인한다.

브라우저에서 `http://localhost:8000/` 접속. **이전 Mac 브라우저에 저장된 IndexedDB는 Windows로 자동 복사되지 않는다.** 필요한 진행 데이터는 Mac에서 JSON 백업 후 Windows 저장 관리자의 JSON 가져오기로 수동 복원해야 한다. 파일 가져오기 후 실제 게임 상태 교체는 사용자 확인을 거친다.

## 이번 변경
- 메인 UI의 로그(최대 500건)와 방문 지역 목록용 체크포인트를 v2의 `world.runtime.journal`에 저장. `mainV2.captureCheckpoint` / `mainV2.checkpoint`로 다루며 상태 사본을 반환.
- F5와 수동 저장 시 게임 기록을 캡처하고, 승인된 불러오기에서 게임 기록을 복원한다.
- 새로운 브라우저 세션에서 F5가 기존 정상 퀵세이브 revision을 이어받을 수 있도록 조정. 손상된 최신 슬롯은 자동 덮어쓰지 않는다.
- 기존 v1/localStorage 게임 기록은 자동 변환하지 않는다.
- 아이템 무게·과적 시스템은 도입하지 않는다.

## Windows 수동 테스트
1. 수동 저장 슬롯 2개 생성 → 저장 관리자에서 별개로 확인.
2. 지역 이동 및 생활 행동 여러 번 수행 → F5 → 브라우저 새로고침 → F9 → 승인 → 지역/턴/로그/인벤토리 확인.
3. 같은 브라우저를 다시 새로고침하고 F5를 눌러 퀵세이브 revision이 증가하는지 확인.
4. JSON 백업을 내려받아 복사본 보관 → 다시 가져오기 → 승인 전 상태 불변 확인.
5. 자동 저장 간격을 2로 설정해 행동 2회 수행 → 자동 슬롯 생성 확인.
6. 잘못된 JSON 파일 가져오기 시 게임 상태 유지.
7. 저장 관리자 내 이전 정상 revision 선택 후 복원할 때 실제 확인 팝업 표시.

## 주의
- 문서의 체크포인트는 이벤트 기록·방문 지역용 최소 계약이다. 현행 UI에서 방문 지역 배열을 아직 수집하지 않으므로 해당 필드는 빈 배열일 수 있다.
- UI 테마, 패널 높이 등 장치별 표시 환경은 세이브가 아닌 브라우저 설정으로 유지한다.
- 실제 도감·퀘스트·생활 성장 상태 전체는 아직 게임 시스템과의 모델 연결이 필요.
- IndexedDB는 저장된 파일을 OS와 브라우저 사이에서 자동으로 이식하지 않는다. 브라우저가 정리하거나 크래시로 데이터를 잃을 수 있어 JSON 파일 외부 백업이 필요하다. 참조: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB

Mac용 `python3`와 달리 Windows PowerShell의 기본 예시는 `py -m http.server 8000`이다.
