supabaseClient.auth.onAuthStateChange((event, session) => {
  if (session && session.user) {
    handleResult(session.user);
  } else {
    window.localStorage.removeItem("email");
    window.localStorage.removeItem("name");
    window.localStorage.removeItem("number");
    window.location.href = "index.html";
  }
});

async function handleResult(user) {
  const email = user.email;
  window.localStorage.setItem("email", JSON.stringify(email));

  try {
    const { data: adminData, error: adminError } = await supabaseClient
      .from("admins")
      .select("store")
      .eq("user_id", user.id)
      .single();

    if (adminError || !adminData) {
      alert("관리자 정보를 찾을 수 없습니다. 잠시후 로그아웃 됩니다.");
      await supabaseClient.auth.signOut();
      window.location.href = "index.html";

      return;
    }

    const { data: storeData, error: storeError } = await supabaseClient
      .from("stores")
      .select("email")
      .eq("store_number", adminData.store)
      .single();

    if (storeError || !storeData) {
      alert("매장 정보를 찾을 수 없습니다. 잠시후 로그아웃 됩니다.");
      await supabaseClient.auth.signOut();
      window.location.href = "index.html";

      return;
    }

    if (storeData.email === email) {
      window.localStorage.setItem("number", JSON.stringify(adminData.store));
      window.localStorage.setItem("name", JSON.stringify(storeData.name));
    } else {
      alert(
        "올바른 데이터가 아니거나 관리자가 아닙니다. 잠시후 로그아웃 됩니다.",
      );
      await supabaseClient.auth.signOut();
      window.location.href = "index.html";
    }
  } catch (error) {
    console.error("Error handling result:", error);
    alert(`에러 발생: ${error.message}`);
    await supabaseClient.auth.signOut();
  }
}
