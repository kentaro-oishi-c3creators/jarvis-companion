(() => {
  "use strict";
  const key = "jarvis-origami-note-v1";
  const root = document.querySelector("[data-fold-note]");
  if (!root) return;
  const find = (selector) => root.querySelector(selector);
  const form = find("form");
  const names = ["fact", "hypothesis", "next", "reason"];
  const log = find(".fold-log");
  const confirmation = find(".fold-confirm");
  const status = find(".fold-status");
  const labels = { fact: "観測した事実", hypothesis: "いまの仮説", next: "次に試すこと", reason: "結果・見直した理由" };
  let entries = [];

  function draft() {
    return Object.fromEntries([...names, "decision"].map(name => [name, form.elements[name].value]));
  }

  function valid(record) {
    return record && ["hold", "try"].includes(record.decision) &&
      names.every(name => typeof record[name] === "string" && record[name].length <= 2000);
  }

  function renderFields() {
    const trying = form.elements.decision.value === "try";
    find("[data-fold-next]").hidden = !trying;
    form.elements.next.required = trying;
    find("[data-fold-review]").hidden = entries.length === 0;
    form.elements.reason.required = entries.length > 0;
    find("[data-fold-submit]").textContent = entries.length ? "見直した判断を追記" : "判断を記録";
  }

  function element(tag, content) {
    const node = document.createElement(tag);
    node.textContent = content;
    return node;
  }

  function decisionLabel(entry) {
    return entry.decision === "try" ? "小さく試す" : "保留";
  }

  function renderHistory() {
    renderFields();
    const list = log.querySelector("ol");
    list.replaceChildren();
    log.hidden = !entries.length;
    for (const [index, entry] of entries.entries()) {
      const details = document.createElement("details");
      details.open = index === entries.length - 1;
      const date = new Date(entry.time).toLocaleString("ja-JP");
      details.append(element("summary", date + " · " + decisionLabel(entry)));
      const values = document.createElement("dl");
      for (const name of names) {
        if (entry[name]) values.append(element("dt", labels[name]), element("dd", entry[name]));
      }
      details.append(values);
      const item = document.createElement("li");
      item.append(details);
      list.append(item);
    }
  }

  function restore() {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!valid(saved.draft) || !Array.isArray(saved.entries) ||
          !saved.entries.every(entry => valid(entry) && Number.isFinite(Date.parse(entry.time)))) {
        throw new Error("invalid data");
      }
      entries = saved.entries;
      for (const name of [...names, "decision"]) form.elements[name].value = saved.draft[name];
      status.textContent = "端末に保存したノートを開きました。";
    } catch {
      status.textContent = "端末の保存内容を読み込めませんでした。";
    }
  }

  form.addEventListener("change", renderFields);
  form.addEventListener("input", () => {
    status.textContent = "";
    for (const name of names) form.elements[name].setCustomValidity("");
  });
  form.addEventListener("submit", event => {
    event.preventDefault();
    const entry = draft();
    for (const name of names) entry[name] = entry[name].trim();
    if (entry.decision === "hold") entry.next = "";
    const missing = !entry.fact && !entry.hypothesis ? "fact" :
      entry.decision === "try" && !entry.next ? "next" :
      entries.length && !entry.reason ? "reason" : "";
    if (missing) {
      const field = form.elements[missing];
      const prompt = missing === "fact" ? "事実か仮説を一つ入力してください。" : "内容を入力してください。";
      field.setCustomValidity(prompt);
      field.reportValidity();
      return;
    }
    entries.push({ ...entry, time: new Date().toISOString() });
    form.elements.reason.value = "";
    status.textContent = "判断を履歴に追加しました。端末に残すには保存してください。";
    renderHistory();
  });
  find("[data-fold-save]").addEventListener("click", () => {
    try {
      localStorage.setItem(key, JSON.stringify({ draft: draft(), entries }));
      status.textContent = "現在の入力と履歴をこの端末に保存しました。";
    } catch {
      status.textContent = "端末に保存できませんでした。入力と履歴はこの画面に残っています。";
    }
  });
  find("[data-fold-clear]").addEventListener("click", () => {
    confirmation.hidden = false;
    find("[data-fold-cancel]").focus();
  });
  find("[data-fold-cancel]").addEventListener("click", () => {
    confirmation.hidden = true;
    find("[data-fold-clear]").focus();
  });
  find("[data-fold-delete]").addEventListener("click", () => {
    try {
      localStorage.removeItem(key);
      status.textContent = "端末の保存内容と画面のノートを消去しました。";
    } catch {
      status.textContent = "画面のノートを消去しました。端末に残る保存内容は確認できません。";
    }
    entries = [];
    form.reset();
    for (const name of names) form.elements[name].setCustomValidity("");
    confirmation.hidden = true;
    renderHistory();
    form.elements.fact.focus();
  });
  find("[data-fold-chat]").addEventListener("click", () => {
    const target = document.querySelector("#message");
    if (!target || typeof target.value !== "string") {
      status.textContent = "会話の入力欄を開けませんでした。";
      return;
    }
    const entry = entries.at(-1);
    const lines = ["判断ノート（" + decisionLabel(entry) + "）"];
    for (const name of names) if (entry[name]) lines.push(labels[name] + "：" + entry[name]);
    const text = lines.join("\n");
    target.value += (target.value ? "\n\n" : "") + text;
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.focus();
    status.textContent = "会話の入力欄に追記しました。内容を確認して送信してください。";
  });
  restore();
  renderHistory();
})();
