# LigOS

<p align="center">
  <img src="assets/logo.svg" width="150" alt="LigOS Logo">
</p>

<h3 align="center">A lightweight, web-based operating system built entirely with front-end technologies.</h3>

<p align="center">
  LigOS는 브라우저 내에서 완벽하게 작동하는 데스크톱 환경을 시뮬레이션합니다. HTML, CSS, JavaScript만을 사용하여 만들어졌으며, 빌드 과정 없이 바로 실행할 수 있습니다.
</p>

---

## ✨ 주요 기능

*   **현대적인 데스크톱 UI**: 사용자가 제공한 디자인 시안에 기반한 미려하고 직관적인 인터페이스.
*   **창 관리 시스템**: 애플리케이션 창을 드래그, 리사이즈, 최소화, 최대화, 그리고 닫을 수 있습니다.
*   **사이드바**: 로고(앱 실행기), 시계, 그리고 자주 사용하는 앱을 고정할 수 있는 바로가기 기능을 제공합니다.
*   **'모든 프로그램' 런처**: 설치된 모든 애플리케이션을 확인하고 실행할 수 있습니다.
*   **패키지 관리자**: 터미널에서 `lig install <URL>` 명령어를 사용하여 웹사이트를 애플리케이션으로 설치할 수 있습니다.
*   **가상 파일 시스템**: `localStorage`를 활용하여 파일과 디렉터리를 생성하고 관리하는 `LigFS`가 내장되어 있습니다.
*   **기본 애플리케이션**:
    *   **터미널**: `ls`, `cat`, `mkdir` 등 기본적인 파일 시스템 명령어와 앱 설치 기능을 제공합니다.
    *   **파일 관리자**: GUI를 통해 가상 파일 시스템을 탐색하고 관리합니다.
    *   **설정**: OS의 배경색을 바꾸거나 시스템 전체를 초기화할 수 있습니다.
*   **부드러운 애니메이션**: 창과 메뉴가 나타나고 사라질 때 자연스러운 전환 효과가 적용됩니다.

## 🚀 시작하기

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

##  filosofia 개발 철학

LigOS의 핵심 철학은 **느슨한 결합(Loose Coupling)**입니다.

모든 애플리케이션은 OS와 독립된 웹 페이지로 취급되며, `iframe` 내의 샌드박스 환경에서 실행됩니다. 이는 OS의 안정성을 해치지 않으면서 앱 개발의 자율성을 극대화합니다.

앱과 OS 간의 모든 상호작용은 표준 `window.postMessage` API를 통해 비동기적으로 이루어집니다. 이 덕분에 개발자들은 자신이 선호하는 어떤 웹 기술(React, Vue, Svelte 등)을 사용하더라도 LigOS용 앱을 쉽게 만들 수 있습니다.

자세한 앱 개발 방법은 [TUTORIAL.md](TUTORIAL.md) 파일을 참고하세요.

## 📁 프로젝트 구조

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