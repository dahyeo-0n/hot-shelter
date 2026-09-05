# 폭염 무더위 쉼터 길안내 서비스

현위치 기반으로 가장 가까운 무더위 쉼터를 색상별(🔵 파랑 1순위 / 🟡 노랑 2순위 / 🔴 빨강 3순위)로 확인하고 실시간 도보 길안내를 제공하는 웹 애플리케이션입니다.

---

## 🚀 GitHub Pages 배포 방법

GitHub Pages에 배포하는 2가지 방법 중 편한 방식을 선택하실 수 있습니다.

### 방법 1. GitHub Actions 자동 배포 (가장 추천)
저장소에 `.github/workflows/deploy.yml` 파일이 이미 포함되어 있습니다.

1. 이 프로젝트 코드를 GitHub 저장소에 Push합니다.
2. GitHub 저장소 페이지의 **Settings (설정)** 탭으로 이동합니다.
3. 좌측 메뉴에서 **Pages**를 클릭합니다.
4. **Build and deployment > Source** 항목에서 **`GitHub Actions`**를 선택합니다.
5. `main` 브랜치에 코드가 푸시되면 자동으로 빌드되어 `https://<사용자이름>.github.io/<저장소이름>/` 주소로 배포가 완료됩니다!

---

### 방법 2. `dist` 빌드 폴더 직접 배포 (또는 gh-pages 브랜치)
프로젝트 내 `vite.config.ts`에 `base: './'` 설정이 적용되어 있어 빌드된 결과물이 상대 경로로 동작합니다.

1. 로컬 터미널에서 빌드를 실행합니다:
   ```bash
   npm run build
   ```
2. 생성된 `dist` 폴더 내의 파일들을 확인합니다:
   - `index.html` (메인 실행 파일)
   - `assets/` (자바스크립트 및 스타일 파일)
3. `dist` 폴더의 내용물을 저장소의 `gh-pages` 브랜치 또는 `docs/` 폴더에 업로드하거나 `gh-pages` 패키지를 통해 배포할 수 있습니다.
   ```bash
   # gh-pages 패키지 이용 시
   npx gh-pages -d dist
   ```
