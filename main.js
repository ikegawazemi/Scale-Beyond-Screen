document.addEventListener("DOMContentLoaded", () => {
    // ===== DOM取得 =====
    const introOverlay = document.querySelector(".overlay");
    const ctaBtn = document.querySelector(".cta-btn");
    const hotspots = document.querySelectorAll(".hotspot");
    const infoPanel = document.getElementById("info-panel");

    const hotspotOverlay = document.getElementById("hotspot-overlay");
    const overlayTitle = document.getElementById("overlay-title");
    const overlayText = document.getElementById("overlay-text");
    const overlayClose = document.getElementById("overlay-close");

    const modelViewer = document.getElementById("car-model");
    const infoTitle = document.getElementById("info-title");
    const infoText = document.getElementById("info-text");
    const arButton = document.querySelector("#ar-button");

    const navLinks = document.querySelectorAll("nav a");

    const audioEngineStart = document.getElementById("audio-engine-start");

    const audioElements = {
        "bgm-front": document.getElementById("bgm-front"),
        "bgm-side-r": document.getElementById("bgm-side-r"),
        "bgm-rear": document.getElementById("bgm-rear"),
        "bgm-side-l": document.getElementById("bgm-side-l")
    };

    // ===== 初期状態 =====
    hotspots.forEach(btn => btn.style.display = "none");
    infoPanel.style.display = "none";
    hotspotOverlay.classList.add("hidden");

    let currentMode = "normal"; // 初期モード
    const models = {
        normal: {
            src: "./assets/mazda3.glb",
            hotspots: document.querySelectorAll(".hotspot-main") // normal用hotspot
        },
        safety: {
            src: "./assets/mazda3safety.glb",
            hotspots: document.querySelectorAll(".hotspot-safety") // safety用hotspot
        }
    };

    // ===== モデル切替関数 =====
    function switchModel(mode) {
        if (mode === currentMode) return;
        currentMode = mode;

        // モデル切り替え
        modelViewer.setAttribute("src", models[mode].src);

        // すべてのホットスポット非表示
        hotspots.forEach(h => (h.style.display = "none"));

        // 該当モードのホットスポットのみ表示
        models[mode].hotspots.forEach(h => (h.style.display = "block"));
    }

    // ===== 「詳しく見る」ボタン =====
    ctaBtn.addEventListener("click", () => {
        if (audioEngineStart) {
            audioEngineStart.play().catch(e => console.log("Audio play blocked", e));
        }
        introOverlay.classList.add("fade-out");
        setTimeout(() => {
            introOverlay.style.display = "none";
            infoPanel.style.display = "block";
            updateHotspots();
        }, 600);
    });

    // ===== ホットスポットクリック =====
    hotspots.forEach(btn => {
        btn.addEventListener("click", () => {
            const info = btn.dataset.info || "詳細情報がありません。";
            const isSafety = btn.classList.contains("hotspot-safety");

            overlayTitle.textContent = isSafety ? "安全装備" : "デザイン特徴";
            overlayText.textContent = info;
            overlayText.innerHTML = btn.dataset.info;

            // オーバーレイを左からスライド表示
            hotspotOverlay.classList.remove("hidden");
            hotspotOverlay.classList.add("active");
        });
    });

    // ===== 詳細オーバーレイ閉じる =====
    overlayClose.addEventListener("click", () => {
        hotspotOverlay.classList.remove("active");
        setTimeout(() => {
            hotspotOverlay.classList.add("hidden");
        }, 300); // アニメーション時間と同期
    });

    // ===== カメラ角度による info-panel 更新 =====
    const views = [
        { range: [315, 45], title: "サイドビュー", text: "全長: 4460mm", audioId: "bgm-side-r"},
        { range: [45, 135], title: "リアビュー", text: "全幅: 1795mm", audioId: "bgm-front"},
        { range: [135, 225], title: "サイドビュー", text: "全長: 4460mm", audioId: "bgm-side-l"},
        { range: [225, 315], title: "フロントビュー", text: "全幅: 1795mm", audioId: "bgm-rear"}
    ];
    let currentAudioId = null;


    function inRange(thetaDeg, start, end) {
        const margin = 1;
        start = (start + 360) % 360;
        end = (end + 360) % 360;
        thetaDeg = (thetaDeg + 360) % 360;
        if (start < end) {
            return thetaDeg >= (start - margin) && thetaDeg < (end + margin);
        } else {
            return thetaDeg >= (start - margin) || thetaDeg < (end + margin);
        }
    }

    function updateInfoPanel() {
        if (infoPanel.style.display === "none") return;
        let thetaDeg = modelViewer.getCameraOrbit().theta * (180 / Math.PI);
        thetaDeg = ((thetaDeg % 360) + 360) % 360;
        for (const view of views) {
            const [start, end] = view.range;
            if (inRange(thetaDeg, start, end)) {
                infoTitle.textContent = view.title;
                infoText.textContent = view.text;
                updateBGM(view.audioId);
                break;
            }
        }
    }

    // ===== ホットスポットの表示/非表示更新 =====
    function updateHotspots() {
        if (infoPanel.style.display === "none") return;
        let thetaDeg = modelViewer.getCameraOrbit().theta * (180 / Math.PI);
        thetaDeg = ((thetaDeg % 360) + 360) % 360;
        models[currentMode].hotspots.forEach(btn => {
            let minAngle = parseFloat(btn.dataset.minAngle);
            let maxAngle = parseFloat(btn.dataset.maxAngle);
            minAngle = ((minAngle % 360) + 360) % 360;
            maxAngle = ((maxAngle % 360) + 360) % 360;
            if (minAngle < maxAngle) {
                btn.style.display = (thetaDeg >= minAngle && thetaDeg <= maxAngle) ? "block" : "none";
            } else {
                btn.style.display = (thetaDeg >= minAngle || thetaDeg <= maxAngle) ? "block" : "none";
            }
        });
    }

    // ==== BGM切り替え関数 ====
    function updateBGM(targetAudioId) {
        // 1. 既に再生中のBGMと同じ、またはIDが未定義なら何もしない
        if (!targetAudioId || currentAudioId === targetAudioId) return;

        // 2. すべてのBGMを停止（bgmsオブジェクトが定義されている前提）
        Object.values(audioElements).forEach(audio => {
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
        });

        // 3. 対象のBGMを再生
        const targetAudio = audioElements[targetAudioId];
        if (targetAudio) {
            targetAudio.play().catch(e => {
                // 自動再生ブロック対策：ユーザー操作前はコンソール出力のみ
                console.warn("Audio play blocked until user interaction.");
            });
            currentAudioId = targetAudioId;
        }
    }

    // ===== 定期更新 =====
    setInterval(() => {
        updateInfoPanel();
        updateHotspots();
    }, 50);

    // ===== ナビバー切り替え =====
    navLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const text = e.target.textContent.trim();
            if (text.includes("Overview")) {
                switchModel("normal");
            } else if (text.includes("安全装備")) {
                switchModel("safety");
            }
        });
    });

    // ===== ARボタン =====
    arButton.addEventListener("click", () => {
        modelViewer.activateAR();
    });

    // ===== 初期状態 =====
    switchModel("normal");
});
