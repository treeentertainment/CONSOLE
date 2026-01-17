function editmenu() {
  try {
    const data = getMenuData();
    const menupan = document.getElementById("menupan");
    const oldTbody = menupan.querySelector("tbody");
    if (oldTbody) menupan.removeChild(oldTbody);

    const tbody = document.createElement("tbody");

    const renderItems = (items, type, category) => {
      items.forEach((item, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><img src="${item.image}" class="menupan-img"></td>

            <td>
              <input class="form-input" type="text"
                value="${item.name}"
                id="${index}-${type}-name"
                onchange="finishEdit('${index}', '${type}', 'name', '${category}')">
            </td>

            <td>
              <input class="form-input" type="text"
                value="${item.price}"
                id="${index}-${type}-price"
                onchange="finishEdit('${index}', '${type}', 'price', '${category}')">
            </td>

            <td>
              <input class="form-input" type="text"
                value="${item.max}"
                id="${index}-${type}-max"
                onchange="finishEdit('${index}', '${type}', 'max', '${category}')">
            </td>

            <td>
              <div class="switch">
                <input
                  class="switch-input"
                  id="${index}-${type}-status"
                  type="checkbox"
                  ${item.status ? "checked" : ""}
                  onchange="finishEdit('${index}', '${type}', 'status', '${category}')"
                >
                <label class="switch-paddle" for="${index}-${type}-status">
                  <span class="show-for-sr">판매 상태</span>
                </label>
              </div>
            </td>

            <td>
              <button class="alert button hollow"
                onclick="deletecheck('${
                  item.name
                }', '${category}', '${type}', '${index}')">
                <i class="fa-solid fa-trash"></i>
              </button>
            </td>
          `;
        tbody.appendChild(row);
      });
    };

    if (Array.isArray(data.category)) {
      data.category.forEach((category) => {
        if (!category) return;

        const items = data.menu?.[category] ?? [];

        const safeItems = items.filter((item) => item !== null);

        console.log(safeItems);
        renderItems(safeItems, category, category);
      });
    }

    menupan.appendChild(tbody);
  } catch (e) {
    handleError(e);
  }
}

function finishEdit(key, type, field, category) {
  const element = document.getElementById(`${key}-${type}-${field}`);
  const newValue = field === "status" ? element.checked : element.value;
  const updates = {};
  updates[`people/data/${number}/menu/v5/menu/${category}/${key}/${field}`] =
    newValue;

  firebase
    .database()
    .ref()
    .update(updates)
    .then(() => {
      console.log("Menu item updated successfully.");
    })
    .catch((e) => {
      handleError(e);
    });
}

function deletecheck(name, category, type, index) {
  const alertTitle = document.getElementById("modal-title");
  alertTitle.innerHTML = "메뉴 삭제 확인";
  const alertbox = document.getElementById("modal-content");
  alertbox.innerHTML = `${name}을 삭제 하시겠습니까?`;
  $("#modal").foundation("open");

  document.getElementById("okmodal").addEventListener(
    "click",
    function handler() {
      firebase
        .database()
        .ref(`people/data/${number}/menu/v5/menu/${category}/${index}/`)
        .remove()
        .then(() => {
          $("#modal").foundation("close");
        })
        .catch((error) => {
          handleError(error);
          alertbox.innerHTML = `오류 발생, 관리자에게 다음 메시지를 전달해주십시오: ${error}`;
        });
    },
    { once: true },
  );
}
