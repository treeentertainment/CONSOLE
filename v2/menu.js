function editmenu() {
  try {
    const data = getMenuData();
    const menupan = document.getElementById("menupan");
    const oldTbody = menupan.querySelector("tbody");
    if (oldTbody) menupan.removeChild(oldTbody);

    const tbody = document.createElement("tbody");

    if (data && Array.isArray(data)) {
      // Remove duplicates based on id
      const uniqueData = data.filter(
        (item, index, self) =>
          self.findIndex((i) => i.id === item.id) === index,
      );

      // Group menus by category
      const menusByCategory = uniqueData.reduce((acc, menu) => {
        if (!acc[menu.category]) {
          acc[menu.category] = [];
        }
        acc[menu.category].push(menu);
        return acc;
      }, {});

      // Render items for each category
      for (const category in menusByCategory) {
        const items = menusByCategory[category];
        items.forEach((item) => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td><img src="${item.image}" class="menupan-img"></td>
            <td>
              <input class="form-input" type="text"
                value="${item.name}"
                id="${item.id}-name"
                onchange="finishEdit('${item.id}', 'name', this.value)">
            </td>
            <td>
              <input class="form-input" type="number"
                value="${item.price}"
                id="${item.id}-price"
                onchange="finishEdit('${item.id}', 'price', this.value)">
            </td>
            <td>
              <input class="form-input" type="number"
                value="${item.max}"
                id="${item.id}-max"
                onchange="finishEdit('${item.id}', 'max', this.value)">
            </td>
            <td>
              <div class="switch">
                <input
                  class="switch-input"
                  id="${item.id}-status"
                  type="checkbox"
                  ${item.status ? "checked" : ""}
                  onchange="finishEdit('${item.id}', 'status', this.checked)"
                >
                <label class="switch-paddle" for="${item.id}-status">
                  <span class="show-for-sr">판매 상태</span>
                </label>
              </div>
            </td>
            <td>
              <button class="alert button hollow"
                onclick="deletecheck('${item.name}', '${item.id}')">
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

async function finishEdit(menuId, field, value) {
  // Type conversion for numeric fields
  let newValue = value;
  if (field === "price" || field === "max") {
    newValue = parseInt(value, 10);
  }

  const { error } = await supabaseClient
    .from("menus")
    .update({ [field]: newValue })
    .eq("id", menuId);

  if (error) {
    handleError(error);
    alert("메뉴 업데이트에 실패했습니다: " + error.message);
  } else {
    console.log("Menu item updated successfully.");
    // No need to manually refresh, realtime should handle it
  }
}

function deletecheck(name, menuId) {
  const alertTitle = document.getElementById("modal-title");
  alertTitle.innerHTML = "메뉴 삭제 확인";
  const alertbox = document.getElementById("modal-content");
  alertbox.innerHTML = `'${name}'을(를) 삭제 하시겠습니까? 이 작업은 되돌릴 수 없습니다.`;
  $("#modal").foundation("open");

  const okButton = document.getElementById("okmodal");

  // Clone and replace the button to remove old event listeners
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
        alertbox.innerHTML = `오류 발생, 관리자에게 다음 메시지를 전달해주십시오: ${error.message}`;
      } else {
        console.log("Menu item deleted successfully.");
        $("#modal").foundation("close");
        editmenu(); // UI 갱신
      }
    },
    { once: true },
  );
}
