// PeerJS is loaded on demand. Solo play never contacts the signaling service.
window.ONLINE_CONNECTION = (() => {
  let library;
  function load() {
    if (window.Peer) return Promise.resolve(window.Peer);
    if (library) return library;
    library = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      const timeout = window.setTimeout(() => finish(new Error("通信機能を読み込めませんでした")), 15000);
      function finish(error) {
        window.clearTimeout(timeout);
        script.onload = script.onerror = null;
        if (error) { script.remove(); library = null; reject(error); }
        else resolve(window.Peer);
      }
      script.src = "src/vendor/peerjs/peerjs.min.js";
      script.onload = () => finish(window.Peer ? null : new Error("通信機能を読み込めませんでした"));
      script.onerror = () => finish(new Error("通信機能を読み込めませんでした"));
      document.head.appendChild(script);
    });
    return library;
  }
  function randomHex(bytes = 12) {
    return Array.from(window.crypto.getRandomValues(new Uint8Array(bytes)), value => value.toString(16).padStart(2, "0")).join("");
  }
  function roomNumber() {
    return String(10000000 + window.crypto.getRandomValues(new Uint32Array(1))[0] % 90000000);
  }
  const messages = {
    "peer-unavailable": "部屋が見つかりません。部屋番号を確認してください。",
    "unavailable-id": "部屋番号が重複しました。もう一度部屋を作ってください。",
    "browser-incompatible": "このブラウザーでは対戦できません。最新版をお試しください。",
    "network": "通信できません。接続を確認してもう一度お試しください。",
    "server-error": "対戦サーバーに接続できません。時間をおいてお試しください。",
  };
  function errorText(error) { return messages[error?.type] || "接続できませんでした。通信環境を確認してもう一度お試しください。"; }
  // The TURN hosts bundled by PeerJS 1.5.5 were retired by its operator.
  // Configure only the supported public STUN endpoint until a dedicated relay is provisioned.
  const peerOptions = { secure: true, debug: 0, config: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] } };
  return { load, randomHex, roomNumber, errorText, peerOptions, prefix: "into-the-typing-v1-" };
})();
