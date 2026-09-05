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

### 방법 2. `docs` 폴더 이용 배포 (ZIP 다운로드 시 가장 간편!)
프로젝트에 빌드된 **`docs/`** 폴더(HTML 및 에셋 파일 포함)가 생성되어 있습니다.

1. GitHub 저장소의 **Settings > Pages**로 이동합니다.
2. **Build and deployment > Source**를 **`Deploy from a branch`**로 선택합니다.
3. Branch를 **`main`**, 폴더를 **`/docs`**로 선택한 후 **Save**를 누릅니다.
4. 별도의 빌드 과정 없이 즉시 `https://<사용자이름>.github.io/<저장소이름>/`로 사이트가 열립니다!

---

### 방법 3. 내 컴퓨터에서 직접 열기
다운로드한 파일 중 **`docs/index.html`**을 더블 클릭하거나 로컬 웹 서버(VSCode Live Server 등)로 열면 바로 실행됩니다.
