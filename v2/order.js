async function neworder(key, orderData) {
  if (!orderData.id) return;

  const list = getlist();
  const menuData = getMenuData();
  const templist = [];
  const phonenumber = orderData.phone_number;

  const tr = document.createElement("tr");
  tr.id = orderData.id; // Use Supabase row ID
  console.log("[neworder] tr.id:", tr.id, ", orderData.id:", orderData.id);
  const tdIndex = createTd(orderData.order_number); // Display order_number
  tr.appendChild(tdIndex);

  const tdContent = document.createElement("td");
  tdContent.id = `content-${orderData.id}`;
  renderOrderMenu(tdContent, orderData, menuData, templist);
  tr.appendChild(tdContent);

  const tdPhone = createTd(phonenumber);
  tr.appendChild(tdPhone);

  const editor = document.createElement("td");

  editor.appendChild(
    createIconButton(["secondary", "button", "hollow"], "fa-solid fa-pen", () =>
      edit(templist, orderData.id),
    ),
  );

  editor.appendChild(
    createIconButton(["success", "button", "hollow"], "fa-solid fa-phone", () =>
      readymenu(orderData.id, phonenumber),
    ),
  );

  editor.appendChild(
    createIconButton(["alert", "button", "hollow"], "fa-solid fa-trash", () =>
      deletemenu(orderData.id, phonenumber),
    ),
  );

  editor.appendChild(
    createIconButton(
      ["warning", "button", "hollow"],
      "fa-solid fa-rotate-left",
      () => areyoureturn(orderData.id, phonenumber),
    ),
  );

  editor.appendChild(
    createIconButton(["alert", "button", "hollow"], "fa-solid fa-check", () =>
      applycontent(orderData.id, "completed"),
    ),
  );

  editor.appendChild(
    createIconButton(
      ["secondary", "button", "hollow"],
      "fa-regular fa-credit-card",
      () =>
        paycontent(
          orderData.total_price,
          orderData.total_paid || 0,
          orderData.id,
          phonenumber,
        ),
    ),
  );

  tr.appendChild(editor);

  applyOrderStatusStyle(tr, orderData.status);

  // tbody(order-table)가 없으면 생성
  let orderTable = document.getElementById("order-table");
  if (!orderTable) {
    // 혹시 table만 있고 tbody가 없는 경우를 대비
    const table = document.querySelector("table.hover");
    if (table) {
      orderTable = document.createElement("tbody");
      orderTable.id = "order-table";
      table.appendChild(orderTable);
    }
  }
  if (orderTable) {
    orderTable.appendChild(tr);
  }

  list.push({ phonenumber, itemlist: templist });
  localStorage.setItem("itemlist", JSON.stringify(list));

  if (orderData.status === "new") {
    await applycontent(orderData.id, "preparing");
  }
}

function updateorder(key, orderData) {
  if (!orderData.id) return;

  const menuData = getMenuData();
  let tdContent = document.getElementById(`content-${orderData.id}`);
  const tr = document.getElementById(orderData.id);
  if (!tr) return;

  // tdContent가 없으면 새로 생성해서 tr에 추가
  if (!tdContent) {
    tdContent = document.createElement("td");
    tdContent.id = `content-${orderData.id}`;
    // 두 번째 칸(주문 내용)에 삽입
    if (tr.children.length >= 2) {
      tr.replaceChild(tdContent, tr.children[1]);
    } else {
      tr.appendChild(tdContent);
    }
  }

  const templist = [];
  renderOrderMenu(tdContent, orderData, menuData, templist);

  applyOrderStatusStyle(tr, orderData.status);
}

function getCategoryByItemId(itemId, menu) {
  if (!menu || !Array.isArray(menu)) return null;

  for (const item of menu) {
    if (item && item.id === itemId) {
      return item.category;
    }
  }
  return null;
}

async function edit(templist, orderId) {
  const editor = document.getElementById("modal-content");
  editor.innerHTML = "";

  templist.forEach((item, index) => {
    editor.innerHTML += `
      <div class="grid-x grid-padding-x">
        <div class="cell small-12">
          <label>
            수량 - ${item.name}
            <input 
              type="number"
              id="key-${orderId}-item-${index}"
              value="${item.quantity}"
              required
            >
          </label>
        </div>
      </div>
    `;
  });

  document.getElementById("modal-title").textContent = `주문 수정`;

  const okButton = document.getElementById("okmodal");
  const newOkButton = okButton.cloneNode(true);
  okButton.parentNode.replaceChild(newOkButton, okButton);

  newOkButton.addEventListener(
    "click",
    async function handler() {
      const { data: currentOrder, error: fetchError } = await supabaseClient
        .from("orders")
        .select("menu")
        .eq("id", orderId)
        .single();

      if (fetchError) {
        alert("주문 정보를 가져오는데 실패했습니다.");
        return;
      }

      // menu의 각 항목을 id로 찾아서 수량만 업데이트
      const newMenu = currentOrder.menu.map((menuItem) => {
        const idx = templist.findIndex((item) => item.id === menuItem.id);
        if (idx !== -1) {
          const inputElement = document.getElementById(
            `key-${orderId}-item-${idx}`,
          );
          if (inputElement) {
            const newQuantity = Number(inputElement.value);
            if (menuItem.quantity !== newQuantity) {
              return { ...menuItem, quantity: newQuantity };
            }
          }
        }
        return menuItem;
      });

      // 변경사항이 있는지 확인
      const hasChanged =
        JSON.stringify(currentOrder.menu) !== JSON.stringify(newMenu);

      if (hasChanged) {
        const { error: updateError } = await supabaseClient
          .from("orders")
          .update({ menu: newMenu })
          .eq("id", orderId);

        if (updateError) {
          alert("주문 업데이트에 실패했습니다.");
        } else {
          // UI 강제 갱신: 전체 order row를 다시 불러와서 updateorder에 전달
          const { data: updatedOrder, error: fetchUpdatedError } =
            await supabaseClient
              .from("orders")
              .select("*")
              .eq("id", orderId)
              .single();
          if (!fetchUpdatedError && updatedOrder) {
            updateorder(orderId, updatedOrder);
          }
        }
      }

      editor.innerHTML = "";
      $("#modal").foundation("close");
    },
    { once: true },
  );

  $("#modal").foundation("open");
}

async function applycontent(orderId, status) {
  const { error } = await supabaseClient
    .from("orders")
    .update({ status: status })
    .eq("id", orderId);

  if (error) {
    console.error("Error updating order status:", error);
  }
}

function deleteorder(key, orderData) {
  if (!key) return;
  // UI에서 해당 주문 row 완전히 제거
  const tr = document.getElementById(key);
  if (tr && tr.parentNode) tr.parentNode.removeChild(tr);

  // localStorage에서도 제거
  const list = getlist();
  const newList = list.filter(
    (item) => item.id !== key && item.orderId !== key,
  );
  localStorage.setItem("itemlist", JSON.stringify(newList));
}

async function deletemenu(orderId, phonenumber) {
  if (confirm(`${phonenumber}님의 주문을 삭제하시겠습니까?`)) {
    const { error } = await supabaseClient
      .from("orders")
      .delete()
      .eq("id", orderId);

    if (error) {
      console.error(`Error deleting order ${orderId}:`, error);
      alert("주문 삭제에 실패했습니다.");
    } else {
      console.log(`Order ${orderId} deleted successfully.`);
      // UI에서 즉시 제거
      deleteorder(orderId);
    }
  }
}

function readymenu(orderId, phonenumber) {
  document.getElementById("modal-content").innerHTML = "";
  document.getElementById("modal-title").textContent =
    `${phonenumber} 을 콜 하시겠습니까?`;

  const okButton = document.getElementById("okmodal");
  const newOkButton = okButton.cloneNode(true);
  okButton.parentNode.replaceChild(newOkButton, okButton);

  newOkButton.addEventListener(
    "click",
    function handler() {
      applycontent(orderId, "call");
      document.getElementById("modal-title").textContent = "";
      $("#modal").foundation("close");
    },
    { once: true },
  );

  $("#modal").foundation("open");
}

function areyoureturn(orderId, phonenumber) {
  document.getElementById("modal-content").innerHTML = "";
  document.getElementById("modal-title").textContent =
    `${phonenumber} 을 준비중으로 바꾸시겠습니까?`;

  const okButton = document.getElementById("okmodal");
  const newOkButton = okButton.cloneNode(true);
  okButton.parentNode.replaceChild(newOkButton, okButton);

  newOkButton.addEventListener(
    "click",
    function handler() {
      applycontent(orderId, "preparing");
      document.getElementById("modal-title").textContent = "";
      $("#modal").foundation("close");
    },
    { once: true },
  );

  $("#modal").foundation("open");
}

async function paycontent(total, paid, orderId, phonenumber) {
  const totalPrice = Number(total);
  const paidPrice = Number.isFinite(Number(paid)) ? Number(paid) : 0;
  const remainPrice = totalPrice - paidPrice;

  document.getElementById("modal-content").innerHTML = `
    <table class="hover stack">
      <thead>
        <tr>
          <th>항목</th>
          <th class="text-right">금액</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>전체 금액</td>
          <td class="text-right">${totalPrice}</td>
        </tr>
        <tr>
          <td>결제 한 금액</td>
          <td class="text-right">${paidPrice}</td>
        </tr>
        <tr>
          <td>남은 금액</td>
          <td class="text-right">${remainPrice}</td>
        </tr>
      </tbody>
    </table>

    <div class="input-group">
      <span class="input-group-label">지불한 돈</span>
      <input
        class="input-group-field"
        id="thepaidmoney"
        type="number"
        placeholder="예: 5000 또는 -5000"
      />
      <div class="input-group-button">
        <button class="button success" id="payit">결제</button>
      </div>
    </div>
  `;

  document.getElementById("modal-title").textContent = `${phonenumber} 결제 중`;

  const payButton = document.getElementById("payit");
  const input = document.getElementById("thepaidmoney");

  const newPayButton = payButton.cloneNode(true);
  payButton.parentNode.replaceChild(newPayButton, payButton);

  newPayButton.addEventListener("click", async () => {
    const payAmount = Number(input.value);

    if (isNaN(payAmount) || payAmount === 0) {
      alert("결제 금액을 입력해주세요.");
      return;
    }

    const { data: currentOrder, error: fetchError } = await supabaseClient
      .from("orders")
      .select("total_price, total_paid")
      .eq("id", orderId)
      .single();

    if (fetchError) {
      alert("결제 정보를 가져오는데 실패했습니다.");
      return;
    }

    // total_paid가 없으면 0으로 생성
    let currentPaid = 0;
    if (typeof currentOrder.total_paid === "number") {
      currentPaid = currentOrder.total_paid;
    } else if (
      currentOrder.total_paid === undefined ||
      currentOrder.total_paid === null
    ) {
      // DB에 total_paid가 없으면 0으로 업데이트
      const { error: createPaidError } = await supabaseClient
        .from("orders")
        .update({ total_paid: 0 })
        .eq("id", orderId);
      if (createPaidError) {
        console.error("total_paid 생성 오류:", createPaidError);
        alert("total_paid 필드를 생성하는데 실패했습니다.");
        return;
      }
      currentPaid = 0;
    }
    let newPaid = currentPaid + payAmount;

    const { error: updateError } = await supabaseClient
      .from("orders")
      .update({ total_paid: newPaid })
      .eq("id", orderId);

    if (updateError) {
      console.error("결제 오류:", updateError);
      alert("결제 중 오류가 발생했습니다.");
    } else {
      // UI is updated by realtime, but we can re-render the modal content
      paycontent(totalPrice, newPaid, orderId, phonenumber);
    }
  });

  const okButton = document.getElementById("okmodal");
  const newOkButton = okButton.cloneNode(true);
  okButton.parentNode.replaceChild(newOkButton, okButton);

  newOkButton.addEventListener(
    "click",
    () => {
      $("#modal").foundation("close");
    },
    { once: true },
  );

  $("#modal").foundation("open");
}

function createTd(text) {
  const td = document.createElement("td");
  td.textContent = text;
  return td;
}

function createContentDiv(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div;
}

function createIconButton(classList, icon, onClick) {
  const btn = document.createElement("button");
  btn.classList.add(...classList);
  btn.style.marginRight = "5px";
  btn.innerHTML = `<i class="${icon}"></i>`;
  btn.onclick = onClick;
  return btn;
}

function renderOrderMenu(tdContent, orderData, menuData, templist) {
  tdContent.innerHTML = "";

  (orderData.menu || []).forEach((currentItem) => {
    if (!currentItem || !currentItem.name || !currentItem.quantity) return;

    tdContent.appendChild(createContentDiv(`이름: ${currentItem.name}`));
    tdContent.appendChild(createContentDiv(`수량: ${currentItem.quantity}`));
    tdContent.appendChild(createContentDiv("옵션:"));

    if (Array.isArray(currentItem.options)) {
      currentItem.options.forEach((option) => {
        const unit = option.unit || "";
        tdContent.appendChild(
          createContentDiv(`${option.name} - ${option.choice}${unit}`),
        );
      });
    }

    tdContent.appendChild(document.createElement("br"));
    if (templist) templist.push(currentItem);
  });
}

function applyOrderStatusStyle(tr, status) {
  if (!tr) return;

  const enableButtons = () =>
    tr
      .querySelectorAll("button")
      .forEach((btn) => (btn.style.pointerEvents = "auto"));

  switch (status) {
    case "call":
      tr.style.backgroundColor = "khaki";
      tr.style.pointerEvents = "none";
      tr.style.filter = "brightness(90%)";
      tr.style.display = "table-row";
      enableButtons();
      break;

    case "called":
      tr.style.backgroundColor = "LightCoral";
      tr.style.filter = "brightness(70%)";
      tr.style.display = "table-row";
      enableButtons();
      break;

    case "completed": // Changed from "finished" to match schema
      tr.style.display = "none";
      break;

    default: // 'new', 'preparing'
      tr.style.display = "table-row";
      tr.style.backgroundColor = "white";
      tr.style.pointerEvents = "auto";
      tr.style.filter = "brightness(100%)";
  }
}
