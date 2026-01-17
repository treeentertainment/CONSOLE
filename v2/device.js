// 기기별 배너/상태 저장
async function saveDeviceInfo(id, banners, status) {
  const { data: device, error } = await supabaseClient
    .from("devices")
    .select("data")
    .eq("id", id)
    .single();
  if (error) {
    alert("기기 정보 조회 실패: " + error.message);
    return;
  }
  const newData = {
    ...device.data,
    banner: banners,
    status: status,
  };
  const { error: updateError } = await supabaseClient
    .from("devices")
    .update({ data: newData })
    .eq("id", id);
  if (updateError) {
    alert("기기 배너/상태 저장 실패: " + updateError.message);
  }
}

// 기기별 배너/상태 불러오기
async function loadDeviceInfo(id) {
  const { data: device, error } = await supabaseClient
    .from("devices")
    .select("data")
    .eq("id", id)
    .single();
  if (error) {
    alert("기기 정보 조회 실패: " + error.message);
    return null;
  }
  return device.data
    ? { banner: device.data.banner, status: device.data.status }
    : null;
}
// 매장 배너/상태 관리 UI 이벤트(main.html 연동)
// Prevent duplicate event bindings
$(document)
  .off("click", "#save-banner-status")
  .on("click", "#save-banner-status", function () {
    const banners = $("#banner-input")
      .val()
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const img = $("#status-img-input").val().trim();
    const reason = $("#status-reason-input").val().trim();
    saveStoreInfo(banners, { img, reason });
    alert("✅ 매장 배너/상태가 저장되었습니다!");
  });

// (load-banner-status 버튼 및 이벤트 완전 제거됨)
// 매장 배너/상태 JSON 관리 함수
// 예시 데이터:
// {
//   "banner": ["https://ik.imagekit.io/treeentertainment/logo/logo500.png", ...],
//   "status": { "img": "...", "reason": "..." }
// }

// 매장 배너/상태 정보 localStorage 관리
function loadStoreInfo() {
  try {
    const raw = localStorage.getItem("storeBannerStatus");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.banner && typeof parsed.banner === "string") {
      try {
        parsed.banner = JSON.parse(parsed.banner);
      } catch (e) {
        parsed.banner = [parsed.banner];
      }
    }
    return parsed;
  } catch (e) {
    console.error("배너/상태 정보 파싱 오류", e);
    return null;
  }
}

function saveStoreInfo(banners, status) {
  // 기존 값 유지, 입력된 값만 갱신
  let prev = loadStoreInfo() || {};
  const data = {
    ...prev,
    banner: banners,
    status: {
      ...((prev && prev.status) || {}),
      ...status,
    },
  };
  localStorage.setItem("storeBannerStatus", JSON.stringify(data));
}

// 사용 예시:
// setStoreBannerStatus([
//   "https://ik.imagekit.io/treeentertainment/logo/logo500.png",
//   "https://ik.imagekit.io/treeentertainment/logo/logo500.png"
// ], {
//   img: "https://ik.imagekit.io/treeentertainment/logo/logo500.png",
//   reason: "매장 준비중입니다"
// });
// const info = getStoreBannerStatus();
// device.js
// Supabase 연동: 기기별 상태 변경, 일괄 적용, blocked 시 reason/image 변경

// devices 목록 불러오기
async function getDevices(storeNum) {
  $("#device-table tbody").html(
    '<tr><td colspan="5" style="text-align:center;">🔄 기기 목록을 불러오는 중...</td></tr>',
  );
  const { data, error } = await supabaseClient
    .from("devices")
    .select("*")
    .eq("store_number", storeNum);
  if (error) {
    alert(
      "⚠️ 기기 목록 불러오기 실패: " +
        error.message +
        "\n잠시 후 다시 시도해 주세요.",
    );
    return [];
  }
  return data;
}

// 개별 기기 상태 변경
async function updateDeviceStatus(id, status, reason = "", image = "", cb) {
  // 항상 data.status = { img, reason } 구조로 저장
  const { data: device, error: fetchError } = await supabaseClient
    .from("devices")
    .select("data")
    .eq("id", id)
    .single();
  if (fetchError) {
    alert("기기 정보 조회 실패: " + fetchError.message);
    return;
  }
  let newData = { ...device.data };
  newData.status = { img: image, reason: reason };
  // reason/image 최상위 키가 있으면 제거
  if (newData.hasOwnProperty("reason")) delete newData.reason;
  if (newData.hasOwnProperty("image")) delete newData.image;
  const { error } = await supabaseClient
    .from("devices")
    .update({ status, data: newData })
    .eq("id", id);
  if (error) {
    alert(
      "⚠️ 상태 변경 실패: " + error.message + "\n잠시 후 다시 시도해 주세요.",
    );
    return;
  }
  if (cb) cb(id, status, reason, image);
  else alert("✅ 기기 상태가 성공적으로 변경되었습니다.");
}

// 일괄 상태 변경
async function updateAllDeviceStatus(
  storeNum,
  status,
  reason = "",
  image = "",
  cb,
) {
  // 모든 기기에 대해 status만 일괄 변경, data.status(사유/이미지)는 그대로 둔다
  const { data: devices, error: fetchError } = await supabaseClient
    .from("devices")
    .select("id, data")
    .eq("store_number", storeNum);
  if (fetchError) {
    alert("기기 목록 조회 실패: " + fetchError.message);
    return;
  }
  for (const device of devices) {
    let newData = { ...device.data };
    // 기존 data.status(사유/이미지)는 그대로 두고, status 필드만 변경
    const { error: updateError } = await supabaseClient
      .from("devices")
      .update({ status, data: newData })
      .eq("id", device.id);
    if (updateError) {
      alert("⚠️ 일부 기기 상태 변경 실패: " + updateError.message);
    }
  }
  if (cb) cb(status, reason, image);
  else alert("✅ 전체 기기 상태가 성공적으로 변경되었습니다.");
}

// UI 갱신 함수 예시 (콜백에서 사용)
// function updateDeviceRow(deviceId, status, reason, image) { ... }
// function updateAllDeviceRows(status, reason, image) { ... }

// 기기 목록 렌더링
async function drawDeviceTable() {
  const devices = await getDevices(number);
  const $tbody = $("#device-table tbody");
  $tbody.empty();
  if (!devices.length) {
    $tbody.append(
      '<tr><td colspan="5" style="text-align:center; color:#888;">등록된 기기가 없습니다.</td></tr>',
    );
    return;
  }
  devices.forEach((d) => {
    const status = d.status;
    const reason = d.data?.status?.reason || "";
    const image = d.data?.status?.img || "";
    let createdAt = d.created_at;
    if (createdAt) {
      const dt = new Date(createdAt);
      createdAt = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")} ${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}:${String(dt.getSeconds()).padStart(2, "0")}`;
    } else {
      createdAt = "";
    }
    const bannerPrev =
      d.data?.banner && d.data.banner.length
        ? `<span style='font-size:11px;color:#888;' title='배너 이미지 미리보기'>배너: ${d.data.banner.join(", ")}</span><br>`
        : "";
    const statusPrev =
      d.data?.status && (d.data.status.img || d.data.status.reason)
        ? `<span style='font-size:11px;color:#888;' title='상태 이미지/메시지 미리보기'>상태: 이미지: ${d.data.status.img || ""} <br> 메시지: ${d.data.status.reason || ""}</span><br>`
        : "";
    // 이름과 코드 모두 표시
    const nameCode = `<strong>${d.device_name || ""}</strong><br><span style='font-size:11px;color:#888;'>${d.device_code || ""}</span>`;
    $tbody.append(`
      <tr data-id="${d.id}">
        <td>${nameCode}</td>
        <td>          
        <select class="device-status" title="기기 상태를 선택하세요">
            <option value="wait" ${status === "wait" ? "selected" : ""}>대기(wait)</option>
            <option value="ready" ${status === "ready" ? "selected" : ""}>준비(ready)</option>
            <option value="blocked" ${status === "blocked" ? "selected" : ""}>차단(blocked)</option>
          </select></td>
        <td>
          <input type="text" class="device-reason" value="${reason}" placeholder="사유" style="margin:2px 0;">
          <br>
          <input type="text" class="device-image" value="${image}" placeholder="이미지 URL" style="margin:2px 0;">
          <br>
          <button class="button tiny update-device" title="변경사항 적용">적용</button>
          <button class="button tiny edit-device-banner-status" title="배너/상태 편집">배너/상태 편집</button>
          <button class="button alert tiny delete-device" title="기기 삭제">삭제</button>
        </td>
      </tr>
    `);
  });

  // Prevent duplicate event bindings
  $(document)
    .off("click", ".edit-device-banner-status")
    .on("click", ".edit-device-banner-status", async function () {
      const $tr = $(this).closest("tr");
      const id = $tr.data("id");
      $("#modal-device-id").val(id);
      $("#modal-device-banner-input").val("");
      $("#modal-device-status-img-input").val("");
      $("#modal-device-status-reason-input").val("");
      $("#modal-save-device-banner-status")
        .prop("disabled", true)
        .text("불러오는 중...");
      const info = await loadDeviceInfo(id);
      $("#modal-device-banner-input").val(
        info && info.banner ? info.banner.join(", ") : "",
      );
      $("#modal-device-status-img-input").val(
        info && info.status?.img ? info.status.img : "",
      );
      $("#modal-device-status-reason-input").val(
        info && info.status?.reason ? info.status.reason : "",
      );
      $("#modal-save-device-banner-status")
        .prop("disabled", false)
        .text("저장");
      $("#device-banner-status-modal").foundation("open");
    });

  $(document)
    .off("click", "#modal-save-device-banner-status")
    .on("click", "#modal-save-device-banner-status", async function () {
      const id = $("#modal-device-id").val();
      const bannersRaw = $("#modal-device-banner-input").val() || "";
      const banners = bannersRaw
        .split(",")
        .map((s) => (s ? s.trim() : ""))
        .filter(Boolean);
      const img = ($("#modal-device-status-img-input").val() || "").trim();
      const reason = (
        $("#modal-device-status-reason-input").val() || ""
      ).trim();
      $(this).prop("disabled", true).text("저장 중...");
      await saveDeviceInfo(id, banners, { img, reason });
      // 미리보기 즉시 갱신
      const $tr = $(`#device-table tr[data-id='${id}']`);
      let bannerPrev = banners.length
        ? `<span style='font-size:11px;color:#888;'>배너: ${banners.join(", ")}</span><br>`
        : "";
      let statusPrev =
        img || reason
          ? `<span style='font-size:11px;color:#888;'>상태: ${img || ""} ${reason || ""}</span><br>`
          : "";
      const $td = $tr.find("td").last();
      $td.find("span").remove();
      $td.prepend(bannerPrev + statusPrev);
      $(this).prop("disabled", false).text("저장");
      alert("✅ 기기별 배너/상태가 저장되었습니다!");
    });

  // 기기 삭제 기능
  $(document)
    .off("click", ".delete-device")
    .on("click", ".delete-device", async function () {
      const $tr = $(this).closest("tr");
      const id = $tr.data("id");
      if (
        !confirm(
          "❗ 정말로 이 기기를 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.",
        )
      )
        return;
      $tr.find("button").prop("disabled", true);
      const { error } = await supabaseClient
        .from("devices")
        .delete()
        .eq("id", id);
      if (error) {
        alert(
          "⚠️ 기기 삭제에 실패했습니다: " +
            error.message +
            "\n잠시 후 다시 시도해 주세요.",
        );
        $tr.find("button").prop("disabled", false);
      } else {
        $tr.remove();
        alert("✅ 기기가 삭제되었습니다.");
      }
    });
}

// 개별 기기 상태 변경
$(document)
  .off("change", ".device-status")
  .on("change", ".device-status", function () {
    const $tr = $(this).closest("tr");
    const status = $(this).val();
    $tr
      .find(".device-reason, .device-image")
      .prop("disabled", status !== "blocked");
  });

$(document)
  .off("click", ".update-device")
  .on("click", ".update-device", async function () {
    const $tr = $(this).closest("tr");
    const id = $tr.data("id");
    const status = $tr.find(".device-status").val();
    const reason = $tr.find(".device-reason").val();
    const image = $tr.find(".device-image").val();
    $(this).prop("disabled", true).text("적용 중...");
    await updateDeviceStatus(id, status, reason, image, drawDeviceTable);
    $(this).prop("disabled", false).text("적용");
  });

// 일괄 상태 변경 버튼
$("#all-wait")
  .off("click")
  .on("click", async function () {
    if (!confirm("모든 기기를 '대기(wait)' 상태로 변경하시겠습니까?")) return;
    $(this).prop("disabled", true).text("변경 중...");
    await updateAllDeviceStatus(number, "wait", "", "", drawDeviceTable);
    $(this).prop("disabled", false).text("전체 대기(wait)");
  });
$("#all-ready")
  .off("click")
  .on("click", async function () {
    if (!confirm("모든 기기를 '준비(ready)' 상태로 변경하시겠습니까?")) return;
    $(this).prop("disabled", true).text("변경 중...");
    await updateAllDeviceStatus(number, "ready", "", "", drawDeviceTable);
    $(this).prop("disabled", false).text("전체 준비(ready)");
  });
$("#all-blocked")
  .off("click")
  .on("click", async function () {
    const reason = prompt(
      "모든 기기를 '차단(blocked)' 상태로 변경합니다.\n차단 사유를 입력해 주세요:",
      "점검중",
    );
    if (reason === null) return;
    const image = prompt("차단 이미지 URL을 입력해 주세요 (선택):", "");
    if (image === null) return;
    $(this).prop("disabled", true).text("변경 중...");
    await updateAllDeviceStatus(
      number,
      "blocked",
      reason,
      image,
      drawDeviceTable,
    );
    $(this).prop("disabled", false).text("전체 차단(blocked)");
  });

// 매장 배너/상태 자동 업데이트
async function autoUpdateStoreInfo() {
  const { data, error } = await supabaseClient
    .from("stores")
    .select("default_banners, default_status")
    .eq("store_number", number)
    .single();
  if (error || !data) {
    $("#banner-input").val("");
    $("#status-img-input").val("");
    $("#status-reason-input").val("");
    return;
  }
  let banners = data.default_banners;
  if (typeof banners === "string") {
    try {
      banners = JSON.parse(banners);
    } catch (e) {
      banners = [banners];
    }
  }
  let status = data.default_status;
  if (typeof status === "string") {
    try {
      status = JSON.parse(status);
    } catch (e) {
      status = { img: "", reason: "" };
    }
  }
  saveStoreInfo(banners, status);
  $("#banner-input").val(Array.isArray(banners) ? banners.join(", ") : "");
  $("#status-img-input").val(status?.img || "");
  $("#status-reason-input").val(status?.reason || "");
}

// #devices 탭 진입 시 자동 업데이트 및 테이블 렌더링 + realtime 구독 시작
let deviceRealtimeSub = null;
$(document)
  .off("click", 'a[href="#devices"]')
  .on("click", 'a[href="#devices"]', async function () {
    await autoUpdateStoreInfo();
    drawDeviceTable();
    // 기존 구독 해제
    if (deviceRealtimeSub) {
      supabaseClient.removeChannel(deviceRealtimeSub);
      deviceRealtimeSub = null;
    }
    // realtime 구독 시작 (store_number별)
    deviceRealtimeSub = supabaseClient
      .channel("devices-changes-" + number)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "devices",
          filter: "store_number=eq." + number,
        },
        (payload) => {
          // 변경 발생 시 테이블 자동 갱신
          drawDeviceTable();
        },
      )
      .subscribe();
  });
