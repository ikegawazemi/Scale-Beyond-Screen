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
    const arButton = document.querySelector('#ar-button');

    // ===== 初期状態 =====
    hotspots.forEach(btn => btn.style.display = "none");
    infoPanel.style.display = "none";
    hotspotOverlay.classList.add("hidden");

    // ===== 「詳しく見る」ボタン =====
    ctaBtn.addEventListener("click", () => {
        introOverlay.classList.add("fade-out");
        setTimeout(() => {
            introOverlay.style.display = "none";

            // info-panel表示
            infoPanel.style.display = "block";

            // 初回ホットスポット表示更新
            updateHotspots();
        }, 600); // CSS transitionに合わせる
    });

    // ===== ホットスポットクリックで詳細オーバーレイ表示 =====
    hotspots.forEach(btn => {
        btn.addEventListener("click", () => {
            overlayTitle.textContent = "詳細情報";
            overlayText.textContent = btn.dataset.info;
            hotspotOverlay.classList.remove("hidden");
        });
    });

    // ===== 詳細オーバーレイ閉じるボタン =====
    overlayClose.addEventListener("click", () => {
        hotspotOverlay.classList.add("hidden");
    });

    // ===== カメラ角度による info-panel 更新 =====
    const views = [
        { range: [315, 45], title: "サイドビュー", text: "全長: 4460mm" },
        { range: [45, 135], title: "リアビュー", text: "全幅: 1795mm" },
        { range: [135, 225], title: "サイドビュー", text: "全長: 4460mm" },
        { range: [225, 315], title: "フロントビュー", text: "全幅: 1795mm" }
    ];

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
        thetaDeg = ((thetaDeg % 360) + 360) % 360; // 0～360°正規化

        for (const view of views) {
            const [start, end] = view.range;
            if (inRange(thetaDeg, start, end)) {
                infoTitle.textContent = view.title;
                infoText.textContent = view.text;
                break;
            }
        }
    }

    // ===== ホットスポットの表示/非表示更新 =====
    function updateHotspots() {
        if (infoPanel.style.display === "none") return; // 「詳しく見る」前は非表示

        let thetaDeg = modelViewer.getCameraOrbit().theta * (180 / Math.PI);
        thetaDeg = ((thetaDeg % 360) + 360) % 360;

        hotspots.forEach(btn => {
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

    // ===== 定期更新 =====
    setInterval(() => {
        updateInfoPanel();
        updateHotspots();
    }, 50);

    // ===== ARボタン =====
    arButton.addEventListener('click', () => {
        modelViewer.activateAR();
    });
});
