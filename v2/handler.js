function handleError(e) {
  console.error(e);
}

function getMenuData() {
  try {
    const raw = localStorage.getItem("menus");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    handleError(e);
    return null;
  }
}

function getlist() {
  return JSON.parse(window.localStorage.getItem("itemlist")) || [];
}

// ---------------------
// 메뉴 렌더링
// ---------------------
function editmenu() {
  try {
    const data = getMenuData();
    const menupan = document.getElementById("menupan");
    const oldTbody = menupan.querySelector("tbody");
    if (oldTbody) menupan.removeChild(oldTbody);

    const tbody = document.createElement("tbody");

    if (data && Array.isArray(data)) {
      const uniqueData = data.filter(
        (item, index, self) =>
          self.findIndex((i) => i.id === item.id) === index,
      );

      const menusByCategory = uniqueData.reduce((acc, menu) => {
        if (!acc[menu.category]) acc[menu.category] = [];
        acc[menu.category].push(menu);
        return acc;
      }, {});

      for (const category in menusByCategory) {
        const items = menusByCategory[category];
        items.forEach((item) => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td><img src="${item.image}" class="menupan-img"></td>
            <td>
              <input class="form-input" type="text" value="${item.name}" 
                id="${item.id}-name" onchange="finishEdit('${item.id}', 'name', this.value)">
            </td>
            <td>
              <input class="form-input" type="number" value="${item.price}" 
                id="${item.id}-price" onchange="finishEdit('${item.id}', 'price', this.value)">
            </td>
            <td>
              <input class="form-input" type="number" value="${item.max}" 
                id="${item.id}-max" onchange="finishEdit('${item.id}', 'max', this.value)">
            </td>
            <td>
              <div class="switch">
                <input class="switch-input" id="${item.id}-status" type="checkbox"
                  ${item.status ? "checked" : ""} 
                  onchange="finishEdit('${item.id}', 'status', this.checked)">
                <label class="switch-paddle" for="${item.id}-status">
                  <span class="show-for-sr">판매 상태</span>
                </label>
              </div>
            </td>
            <td>
              <button class="alert button hollow" onclick="deletecheck('${item.name}', '${item.id}')">
                <i class="fa-solid fa-trash"></i>
              </button>
            </td>
          `;
          tbody.appendChild(row);
        });
      }
    }

    menupan.appendChild(tbody);
  } catch (e) {
    handleError(e);
  }
}

// ---------------------
// 메뉴 수정
// ---------------------
async function finishEdit(menuId, field, value) {
  let newValue = value;
  if (field === "price" || field === "max") newValue = parseInt(value, 10);

  const { error } = await supabaseClient
    .from("menus")
    .update({ [field]: newValue })
    .eq("id", menuId);

  if (error) handleError(error);
  else console.log("Menu item updated:", menuId, field, newValue);
}

// ---------------------
// 메뉴 삭제
// ---------------------
function deletecheck(name, menuId) {
  const alertTitle = document.getElementById("modal-title");
  alertTitle.innerHTML = "메뉴 삭제 확인";
  const alertbox = document.getElementById("modal-content");
  alertbox.innerHTML = `'${name}'을(를) 삭제 하시겠습니까? 이 작업은 되돌릴 수 없습니다.`;
  $("#modal").foundation("open");

  const okButton = document.getElementById("okmodal");
  const newOkButton = okButton.cloneNode(true);
  okButton.parentNode.replaceChild(newOkButton, okButton);

  newOkButton.addEventListener(
    "click",
    async function handler() {
      const { error } = await supabaseClient
        .from("menus")
        .delete()
        .eq("id", menuId);
      if (error) {
        handleError(error);
        alert(`오류 발생: ${error.message}`);
      } else {
        $("#modal").foundation("close");
        editmenu();
      }
    },
    { once: true },
  );
}

// ---------------------
// fetch menus
// ---------------------
async function fetchMenus() {
  if (!number) return;

  const { data, error } = await supabaseClient
    .from("menus")
    .select("*")
    .eq("store_number", number);

  if (error) return handleError(error);

  localStorage.setItem("menus", JSON.stringify(data));
  editmenu();
}

// ---------------------
// fetch orders
// ---------------------
async function fetchAndRenderOrders() {
  if (!number) return;

  const { data: orders, error } = await supabaseClient
    .from("orders")
    .select("*")
    .eq("store_number", number)
    .order("order_number", { ascending: true });

  if (error) return handleError(error);

  const tableBody = document.getElementById("order-table");
  tableBody.innerHTML = "";
  orders.forEach((order) => neworder(order.id, order));
}

// ---------------------
// DOMContentLoaded
// ---------------------
document.addEventListener("DOMContentLoaded", async () => {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = "index.html";
    return;
  }

  number = JSON.parse(localStorage.getItem("number"));
  if (!number) {
    await supabaseClient.auth.signOut();
    window.location.href = "index.html";
    return;
  }

  await fetchMenus();
  await fetchAndRenderOrders();

  // Realtime 채널 등록
  supabaseClient
    .channel("menus-channel")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "menus",
        filter: `store_number=eq.${number}`,
      },
      () => fetchMenus(),
    )
    .subscribe();

  supabaseClient
    .channel("orders-channel")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders",
        filter: `store_number=eq.${number}`,
      },
      (payload) => {
        if (payload.eventType === "INSERT")
          neworder(payload.new.id, payload.new);
        if (payload.eventType === "UPDATE")
          updateorder(payload.new.id, payload.new);
        if (payload.eventType === "DELETE")
          deleteorder(payload.old.id, payload.old);
      },
    )
    .subscribe();
});

// visibilitychange
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") fetchMenus();
});
