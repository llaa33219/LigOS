# LigOS 애플리케이션 개발 튜토리얼

LigOS는 웹 기술로 만들어진 웹 운영체제입니다. 모든 애플리케이션은 `iframe` 내에서 독립적인 웹 페이지로 실행됩니다. 이 문서는 LigOS용 앱을 개발하고 OS의 핵심 기능과 상호작용하는 방법을 안내합니다.

## 기본 구조

LigOS 앱은 기본적으로 하나의 HTML 파일과 관련 CSS, JavaScript 파일로 구성된 간단한 웹 페이지입니다. 사용자가 앱을 실행하면, LigOS는 지정된 URL을 `iframe`으로 로드하여 창 안에 표시합니다.

## OS와 상호작용하기

앱(`iframe`)은 보안상의 이유로 부모 창(LigOS)의 JavaScript 객체나 함수에 직접 접근할 수 없습니다. 따라서 모든 상호작용은 `window.parent.postMessage()`를 통해 비동기적으로 이루어져야 합니다.

### API 명세

LigOS는 `message` 이벤트를 수신하여 특정 형식의 요청을 처리합니다.

**요청 형식:**
앱은 항상 다음 구조를 가진 객체를 부모 창으로 전송해야 합니다.

```javascript
window.parent.postMessage({
    source: 'ligos-app',
    type: 'COMMAND_TYPE',
    payload: { ... },
    reqId: 'optional-request-id' // 응답을 받아야 하는 경우
}, '*');
```

- `source`: 항상 `'ligos-app'`으로 설정하여 LigOS가 앱으로부터 온 메시지임을 식별하게 합니다.
- `type`: 요청하려는 작업의 종류 (예: `fs:readFile`).
- `payload`: 명령어에 필요한 데이터.
- `reqId`: 요청을 식별하는 고유 ID. OS로부터 응답을 받을 때 이 ID를 사용하여 원래 요청을 식별할 수 있습니다.

---

### 지원되는 명령어

#### 1. 파일 시스템 (LigFS)

`LigFS`는 LigOS의 `localStorage` 기반 가상 파일 시스템입니다.

##### `fs:list` - 디렉터리 내용 읽기
- **Type:** `fs:list`
- **Payload:** `{ path: '/path/to/directory' }`
- **응답 Payload:** `{ success: true, data: { 'file1.txt': { type: 'file', ... }, 'subdir': { type: 'directory', ... } } }`

##### `fs:readFile` - 파일 읽기
- **Type:** `fs:readFile`
- **Payload:** `{ path: '/path/to/file.txt' }`
- **응답 Payload:** `{ success: true, data: 'file content' }`

##### `fs:writeFile` - 파일 쓰기
- **Type:** `fs:writeFile`
- **Payload:** `{ path: '/path/to/file.txt', content: 'new content' }`
- **응답 Payload:** `{ success: true }`

##### `fs:createDirectory` - 디렉터리 생성
- **Type:** `fs:createDirectory`
- **Payload:** `{ path: '/path/to/new-dir' }`
- **응답 Payload:** `{ success: true }`

##### `fs:delete` - 파일 또는 디렉터리 삭제
- **Type:** `fs:delete`
- **Payload:** `{ path: '/path/to/delete' }`
- **응답 Payload:** `{ success: true }`

##### `fs:rename` - 파일 또는 디렉터리 이름 변경
- **Type:** `fs:rename`
- **Payload:** `{ oldPath: '/path/to/old-name', newPath: '/path/to/new-name' }`
- **응답 Payload:** `{ success: true }`

#### 2. OS 및 앱 관리

OS의 설정을 변경하거나 설치된 앱을 관리합니다.

##### `os:setConfig` - OS 설정 변경
- **Type:** `os:setConfig`
- **Payload:** `{ key: 'setting-key', value: 'new-value' }`
- **지원되는 key:** `backgroundColor`
- **응답 없음**

##### `os:getConfig` - OS 설정 조회
- **Type:** `os:getConfig`
- **Payload:** `{ key: 'setting-key' }`
- **응답 Payload:** `{ success: true, data: 'current-value' }`

##### `app:refresh` - 프로그램 목록 새로고침
새로운 앱을 설치/제거한 후 '모든 프로그램' 창과 사이드바를 새로고침하도록 OS에 알립니다.
- **Type:** `app:refresh`
- **Payload:** `null`
- **응답 없음**

##### `app:getPrograms` - 설치된 모든 앱 목록 조회
- **Type:** `app:getPrograms`
- **Payload:** `null`
- **응답 Payload:** `{ success: true, data: [ { name: 'App1', url: '...', icon: '...' }, ... ] }`

##### `app:getPinned` - 고정된 앱 목록 조회
- **Type:** `app:getPinned`
- **Payload:** `null`
- **응답 Payload:** `{ success: true, data: [ { name: 'App1', url: '...', icon: '...' }, ... ] }`

##### `app:pin` / `app:unpin` - 앱 고정/고정 해제
- **Type:** `app:pin` 또는 `app.unpin`
- **Payload:** `{ name: 'AppName' }`
- **응답 Payload:** `{ success: true }`

##### `app:uninstall` - 앱 제거
- **Type:** `app:uninstall`
- **Payload:** `{ name: 'AppName' }`
- **응답 Payload:** `{ success: true }`

### 응답 처리

응답이 필요한 요청을 보낸 후, 앱은 `message` 이벤트를 수신하여 OS로부터 오는 응답을 처리해야 합니다.

```javascript
window.addEventListener('message', (event) => {
    // 보안을 위해 event.origin을 확인하는 것이 좋지만, 여기서는 생략합니다.
    const response = event.data;

    if (response.source !== 'ligos-os' || !response.reqId) {
        return; // LigOS로부터 온 응답이 아님
    }

    // reqId를 사용하여 어떤 요청에 대한 응답인지 처리
    console.log(`Response for request ${response.reqId}:`, response);
});
```

---

## "Hello, World!" 예제

다음은 LigOS에서 실행될 수 있는 가장 간단한 형태의 앱입니다.

**`index.html`**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Hello App</title>
</head>
<body>
    <h1>Hello, LigOS!</h1>
    <p>This is a simple application running on LigOS.</p>
</body>
</html>
```

이 파일을 웹에 호스팅하고, LigOS 터미널에서 `lig install [URL]`을 실행하면 이 앱이 설치됩니다.

## 철학

LigOS의 핵심 철학은 **느슨한 결합(loose coupling)**입니다. 각 앱은 독립적인 웹사이트처럼 작동하며, OS와는 표준화된 `postMessage` API를 통해서만 통신합니다. 이는 앱 개발의 자율성을 보장하고 OS의 안정성을 높입니다. 기본 프로그램조차도 이 철학에 따라 외부 앱처럼 취급됩니다. 