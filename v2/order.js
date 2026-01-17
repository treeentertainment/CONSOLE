function neworder(key, orderData) {
  if (isNaN(Number(key))) return;

  const list = getlist();
  const menuData = getMenuData();
  const templist = [];
  const phonenumber = orderData.number;

  const tr = document.createElement("tr");
  tr.id = key;
  const tdIndex = createTd(key);
  tr.appendChild(tdIndex);

  const tdContent = document.createElement("td");
  tdContent.id = `content-${key}`;
  renderOrderMenu(tdContent, orderData, menuData, templist);
  tr.appendChild(tdContent);

  const tdPhone = createTd(phonenumber);
  tr.appendChild(tdPhone);

  const editor = document.createElement("td");

  editor.appendChild(
    createIconButton(["secondary", "button", "hollow"], "fa-solid fa-pen", () =>
      edit(templist, key)
    )
  );

  editor.appendChild(
    createIconButton(["success", "button", "hollow"], "fa-solid fa-phone", () =>
      readymenu(key, phonenumber)
    )
  );

  editor.appendChild(
    createIconButton(["alert", "button", "hollow"], "fa-solid fa-trash", () =>
      deletemenu(key, phonenumber)
    )
  );

  editor.appendChild(
    createIconButton(
      ["warning", "button", "hollow"],
      "fa-solid fa-rotate-left",
      () => areyoureturn(key, phonenumber)
    )
  );

  editor.appendChild(
    createIconButton(["alert", "button", "hollow"], "fa-solid fa-check", () =>
      applycontent(key, "finished")
    )
  );

  editor.appendChild(
    createIconButton(
      ["secondary", "button", "hollow"],
      "fa-regular fa-credit-card",
      () =>
        paycontent(orderData.totalPrice, orderData.totalPaid, key, phonenumber)
    )
  );

  tr.appendChild(editor);

  applyOrderStatusStyle(tr, orderData.status);

  document.getElementById("order-table").appendChild(tr);

  list.push({ phonenumber, itemlist: templist });
  localStorage.setItem("itemlist", JSON.stringify(list));

  if (orderData.status === "new") {
    firebase
      .database()
      .ref()
      .update({
        [`people/data/${number}/order/${key}/status`]: "preparing",
      });
  }
}

function updateorder(key, orderData) {
  if (isNaN(Number(key))) return;

  const menuData = getMenuData();
  const tdContent = document.getElementById(`content-${key}`);
  if (!tdContent) return;

  renderOrderMenu(tdContent, orderData, menuData);

  const tr = document.getElementById(key);
  applyOrderStatusStyle(tr, orderData.status);
}

function getCategoryByItemId(itemId, menu) {
  if (!menu || typeof menu !== "object") return null;

  for (const categoryName of Object.keys(menu)) {
    const items = menu[categoryName];
    if (!Array.isArray(items)) continue;

    for (const item of items) {
      if (item && item.key === itemId) return categoryName;
    }
  }
  return null;
}

function edit(templist, key) {
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
              id="key-${key}-item-${index}"
              value="${item.quantity}"
              required
            >
          </label>
        </div>
      </div>
    `;
  });

  document.getElementById("modal-title").textContent = `${key}번 주문 수정`;

  document.getElementById("okmodal").addEventListener(
    "click",
    function handler() {
      const updates = {};
      templist.forEach((item, idx) => {
        const newQuantity = Number(
          document.getElementById(`key-${key}-item-${idx}`).value
        );
        updates[`people/data/${number}/order/${key}/menu/${idx}/quantity`] =
          newQuantity;
      });
      firebase.database().ref().update(updates);

      editor.innerHTML = "";
      $("#modal").foundation("close");
    },
    { once: true }
  );

  $("#modal").foundation("open");
}

function applycontent(key, words) {
  var updates = {};
  updates[`people/data/${number}/order/${key}/status`] = words;
  firebase.database().ref().update(updates);
}

function deleteorder(key, orderData) {
  if (isNaN(Number(key))) return;
  const element = document.getElementById(key);
  if (element) element.remove();

  const list = getlist().filter((item) => item.phonenumber !== orderData[0]);
  window.localStorage.setItem("itemlist", JSON.stringify(list));
}

function deletemenu(key, phonenumber) {
  if (confirm(`${phonenumber}님의 주문을 삭제하시겠습니까?`)) {
    firebase
      .database()
      .ref(`people/data/${number}/order/${key}`)
      .remove()
      .then(() => {
        console.log(`Order ${key} deleted successfully.`);
      })
      .catch((error) => {
        console.error(`Error deleting order ${key}:`, error);
      });
  }
}

function readymenu(key, phonenumber) {
  document.getElementById("modal-content").innerHTML = "";
  document.getElementById(
    "modal-title"
  ).textContent = `${phonenumber} 을 콜 하시겠습니까?`;
  document.getElementById("okmodal").addEventListener(
    "click",
    function handler() {
      applycontent(key, "call");
      document.getElementById("modal-title").textContent = "";
      $("#modal").foundation("close");
    },
    { once: true }
  );

  $("#modal").foundation("open");
}

function areyoureturn(key, phonenumber) {
  document.getElementById("modal-content").innerHTML = "";
  document.getElementById(
    "modal-title"
  ).textContent = `${phonenumber} 을 준비중으로 바꾸시겠습니까?`;

  document.getElementById("okmodal").addEventListener(
    "click",
    function handler() {
      applycontent(key, "preparing");
      document.getElementById("modal-title").textContent = "";
      $("#modal").foundation("close");
    },
    { once: true }
  );

  $("#modal").foundation("open");
}

function paycontent(total, paid, key, phonenumber) {
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

  payButton.addEventListener(
    "click",
    async () => {
      const payAmount = Number(input.value);

      if (isNaN(payAmount) || payAmount === 0) {
        alert("결제 금액을 입력해주세요.");
        return;
      }

      try {
        const orderRef = firebase
          .database()
          .ref(`/people/data/${number}/order/${key}`);

        const result = await orderRef.transaction((order) => {
          if (!order) return order;

          const currentPaid = Number.isFinite(Number(order.totalPaid))
            ? Number(order.totalPaid)
            : 0;

          const currentTotal = Number.isFinite(Number(order.totalPrice))
            ? Number(order.totalPrice)
            : 0;

          const payAmountNum = Number(payAmount);
          if (!Number.isFinite(payAmountNum) || payAmountNum === 0) {
            return order;
          }

          let nextPaid = currentPaid + payAmountNum;
          let nextTotal = currentTotal;

          // 🔥 환불(음수)일 경우 → totalPrice 증가
          if (payAmountNum < 0) {
            nextTotal = currentTotal + Math.abs(payAmountNum);

            // totalPaid가 음수가 되지 않게 (선택)
            if (nextPaid < 0) nextPaid = 0;
          }

          order.totalPaid = nextPaid;
          order.totalPrice = nextTotal;

          return order;
        });

        if (!result.committed) {
          throw new Error("결제 처리 실패");
        }

        // UI 즉시 갱신
        paycontent(
          result.snapshot.val().totalPrice,
          result.snapshot.val().totalPaid,
          key,
          phonenumber
        );
      } catch (error) {
        console.error("결제 오류:", error);
        alert("결제 중 오류가 발생했습니다.");
      }
    },
    { once: true }
  );

  document.getElementById("okmodal").addEventListener(
    "click",
    () => {
      $("#modal").foundation("close");
    },
    { once: true }
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

  Object.keys(orderData.menu || {}).forEach((k) => {
    if (isNaN(Number(k))) return;

    const currentItem = orderData.menu[k];
    if (!currentItem || !currentItem.name || !currentItem.quantity) return;

    tdContent.appendChild(createContentDiv(`이름: ${currentItem.name}`));
    tdContent.appendChild(createContentDiv(`수량: ${currentItem.quantity}`));
    tdContent.appendChild(createContentDiv("옵션:"));

    if (Array.isArray(currentItem.options)) {
      const categoryName = getCategoryByItemId(currentItem.id, menuData.menu);
      if (!categoryName) return;

      const menuItem = menuData.menu?.[categoryName].find(
        (m) => m && m.key === currentItem.id
      );

      currentItem.options.forEach((option, i) => {
        const unit = menuItem?.option?.[i]?.unit ?? "";
        tdContent.appendChild(
          createContentDiv(`${option.name} - ${option.choice}${unit}`)
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

    case "finished":
      tr.style.display = "none";
      break;

    default:
      tr.style.display = "table-row";
      tr.style.backgroundColor = "white";
      tr.style.pointerEvents = "auto";
      tr.style.filter = "brightness(100%)";
  }
}
