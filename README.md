# LigOS

<p align="center">
  <img src="assets/logo.svg" width="150" alt="LigOS Logo">
</p>

<h3 align="center">A lightweight, modern web-based operating system built entirely with front-end technologies.</h3>

<p align="center">
  <strong>LigOS는 브라우저 내에서 완벽하게 작동하는 데스크톱 환경을 시뮬레이션합니다.</strong><br>
  HTML, CSS, JavaScript만을 사용하여 만들어졌으며, 별도의 빌드 과정 없이 바로 실행할 수 있습니다.
</p>

---

## ✨ 주요 기능 (Key Features)

*   **모던 데스크톱 UI**: 미려하고 직관적인 데스크톱 인터페이스.
*   **다중 창 관리 시스템**: 애플리케이션 창을 자유롭게 드래그, 리사이즈, 최소화, 최대화 및 종료할 수 있습니다.
*   **동적 사이드바 및 앱 런처**: 자주 사용하는 앱을 고정하고, 설치된 모든 애플리케이션을 쉽게 찾아 실행할 수 있습니다.
*   **패키지 관리자**: 터미널에서 `lig install <URL>` 명령어로 웹사이트를 앱으로 설치합니다.
*   **가상 파일 시스템 (LigFS)**: `localStorage`를 활용하여 파일과 디렉터리를 관리합니다.
*   **고급 내장 애플리케이션**:
    *   **터미널**: 기본적인 파일 시스템 명령어와 앱 설치/제거 기능을 제공합니다.
    *   **파일 관리자**: GUI를 통해 파일을 탐색하고, 컨텍스트 메뉴, 인라인 이름 변경, 텍스트 파일 편집기 등 고급 기능을 지원합니다.
    *   **설정**: 배경화면 색상 변경, 테마(라이트/다크) 전환, 설치된 앱 관리(고정/제거) 등 시스템 전반을 제어합니다.

## 🚀 시작하기 (Getting Started)

LigOS는 별도의 빌드 과정이나 복잡한 설정이 필요 없습니다.

1.  이 프로젝트를 로컬 머신에 클론하거나 다운로드합니다.
2.  프로젝트의 루트 디렉터리에서 라이브 서버를 실행합니다.
    *   만약 Node.js가 설치되어 있다면, `live-server` 패키지를 사용하는 것을 추천합니다.
    ```bash
    # live-server가 없다면 전역으로 설치합니다.
    npm install -g live-server

    # 프로젝트 루트 디렉터리에서 실행합니다.
    live-server
    ```
3.  브라우저에서 라이브 서버가 지정한 주소(예: `http://127.0.0.1:8080`)로 접속하면 LigOS가 실행됩니다.

## 💻 개발자 정보 (For Developers)

LigOS 프로젝트에 기여하거나 자신만의 앱을 개발하고 싶으신가요? 아래 문서들을 확인해보세요.

*   **[DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)**: 프로젝트의 기술 스택, 아키텍처, 기여 방법 등 개발에 필요한 모든 정보를 담고 있습니다.
*   **[API_REFERENCE.md](API_REFERENCE.md)**: LigOS 앱과 OS 간의 통신에 사용되는 `postMessage` API에 대한 상세 명세입니다.

## 🗺️ 향후 로드맵 (Future Roadmap)

-   [ ] 드래그 앤 드롭 파일 업로드 기능
-   [ ] 이미지 뷰어, 계산기 등 더 다양한 기본 앱 추가
-   [ ] 창과 UI 요소에 대한 테마 시스템 확장
-   [ ] 사용자 계정 및 원격 스토리지 연동 (장기 목표)

## 📁 프로젝트 구조 (Project Structure)

```
/
├── assets/
│   ├── logo.svg
│   └── default-icon.svg
├── css/
│   └── style.css
├── js/
│   ├── fs.js               # 가상 파일 시스템 로직
│   ├── main.js             # OS 핵심 로직 (창 관리, 렌더링 등)
│   └── package_manager.js  # 앱 설치 및 관리
├── programs/
│   ├── terminal/           # 터미널 앱
│   ├── settings/           # 설정 앱
│   └── file-manager/       # 파일 관리자 앱
├── index.html              # OS의 진입점 (데스크톱)
├── README.md               # 프로젝트 안내서
└── TUTORIAL.md             # 앱 개발자용 튜토리얼
``` 