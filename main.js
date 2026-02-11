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
        modelViewer.setAttribute("src", models[mode].src);

        // モデル切り替え
        modelViewer.setAttribute("src", models[mode].src);

        // すべてのホットスポット非表示
        hotspots.forEach(h => (h.style.display = "none"));

        // 該当モードのホットスポットのみ表示
        models[mode].hotspots.forEach(h => (h.style.display = "block"));
    }

    // ===== 「詳しく見る」ボタン =====
    ctaBtn.addEventListener("click", () => {
        Object.values(audioElements).forEach(audio => {
            if (audio) {
                // 一瞬再生してすぐ停止（これでモバイルの制限が解除される）
                audio.play().then(() => {
                    audio.pause();
                    audio.currentTime = 0;
                }).catch(e => console.log("Unlock failed", e));
            }
        });
        if (audioEngineStart) {
            audioEngineStart.play().catch(e => console.log("Audio play blocked", e));
        }
        introOverlay.classList.add("fade-out");
        setTimeout(() => {
            introOverlay.style.display = "none";
            infoPanel.style.display = "block";
            syncAll();
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

    function syncAll() {
            if (infoPanel.style.display === "none") return;

            // 現在の角度を取得
            const orbit = modelViewer.getCameraOrbit();
            let thetaDeg = orbit.theta * (180 / Math.PI);
            thetaDeg = ((thetaDeg % 360) + 360) % 360;

            // A. BGMとパネルの更新
            for (const view of views) {
                if (inRange(thetaDeg, view.range[0], view.range[1])) {
                    document.getElementById("info-title").textContent = view.title;
                    document.getElementById("info-text").textContent = view.text;
                    
                    // BGMの切り替え
                    if (currentAudioId !== view.audioId) {
                        console.log("Switching audio to:", view.audioId);//for debug
                        Object.values(audioElements).forEach(audio => { 
                            if(audio){
                                audio.pause(); //audio.currentTime = 0; //
                            } 
                        });
                        if (audioElements[view.audioId]) {
                            audioElements[view.audioId].play().catch(() => {});
                            currentAudioId = view.audioId;
                        }
                    }
                    break;
                }
            }

            // B. ホットスポットの表示更新
            hotspots.forEach(btn => {
                const isActiveMode = Array.from(models[currentMode].hotspots).includes(btn);

                    if (!isActiveMode) {
                        btn.style.display = "none";
                        return;
                    }
                // 角度チェック
                const min = parseFloat(btn.dataset.minAngle);
                const max = parseFloat(btn.dataset.maxAngle);
                btn.style.display = inRange(thetaDeg, min, max) ? "block" : "none";
            });
        }

    // ===== 更新 =====
    modelViewer.addEventListener("camera-change", syncAll);
    setInterval(syncAll, 150)

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
