/* ═══ TasteKey · Agent 推理轨迹层（纯实时模式） ═══════════════════
 *  · 五步工作流 S1-S5：步间隔 500-700ms、步内打字机；当前步高亮，已完成步可回看
 *  · 左侧方案卡随步骤逐块点亮（.v2dim 逐组解除）
 *  · 步骤数据全部来自 RuntimePlan.toSteps（实时 Qloo 真值），本层只负责播放
 *  · #goBtn 运行期置灰显示「Agent 工作中…」，跑完恢复
 * ═════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var STEP_GAP_MS = 620;    // 步间隔（指令带 500-700ms）
  var FIRST_GAP_MS = 350;   // S1 前的起手间隔
  var TYPE_MS = 8;          // 打字机字符间隔
  var runLabel = function () { return (typeof I18N !== "undefined" && I18N.t) ? I18N.t("runLabel") : "Agent 工作中…"; };
  var defaultLabel = function () { return (typeof I18N !== "undefined" && I18N.t) ? I18N.t("runtimeBtn") : "② Analyze this location live"; };
  var tKey = function (k) { return (typeof I18N !== "undefined" && I18N.t) ? I18N.t(k) : k; };

  var qs = function (s) { return document.querySelector(s); };
  var esc = function (t) {
    return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  };
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  var running = false;
  var runToken = 0;         // 取消令牌：reset() 自增即可中断播放

  /* ── 渲染 ── */

  function fmtArgs(args) {
    return Object.keys(args || {}).map(function (k) {
      var v = args[k];
      if (Array.isArray(v)) return k + "=[" + v.join(", ") + "]";
      return k + "=" + v;
    }).join(", ");
  }

  function resultLines(result) {
    var lines = [];
    Object.keys(result || {}).forEach(function (k) {
      var v = result[k];
      if (Array.isArray(v)) {
        v.forEach(function (it) { lines.push(String(it)); });
      } else {
        lines.push(k + " · " + v);
      }
    });
    return lines;
  }

  function typeInto(el, text, token) {
    return new Promise(function (resolve) {
      if (!text) { resolve(); return; }
      var caret = document.createElement("span");
      caret.className = "tr-caret";
      el.appendChild(caret);
      var i = 0;
      var timer = setInterval(function () {
        if (token !== runToken) { clearInterval(timer); caret.remove(); resolve(); return; }
        var ch = text[i++];
        if (ch === undefined) { clearInterval(timer); caret.remove(); resolve(); return; }
        caret.insertAdjacentText("beforebegin", ch);
      }, TYPE_MS);
    });
  }

  function runStep(idx, step, token) {
    return new Promise(function (resolve) {
      var node = document.createElement("div");
      node.className = "tr-step on";
      node.innerHTML =
        '<div class="no">S' + (idx + 1) + " " + esc(step.id) + " — " + esc(step.label) + "</div>" +
        '<div class="args"></div>' +
        '<div class="res"></div>' +
        '<div class="why"></div>';
      var stepsEl = qs("#trSteps");
      if (!stepsEl) { resolve(); return; }
      // 当前步高亮：新步开启前，先撤掉已完成步的 .on（可回看，但退色）
      Array.prototype.forEach.call(stepsEl.querySelectorAll(".tr-step.on"), function (x) {
        x.classList.remove("on");
      });
      stepsEl.appendChild(node);

      var argsEl = node.querySelector(".args");
      var resEl = node.querySelector(".res");
      var whyEl = node.querySelector(".why");

      var chain = Promise.resolve();
      chain = chain.then(function () { return typeInto(argsEl, fmtArgs(step.args) || tKey("trNoArgs"), token); });
      resultLines(step.result).forEach(function (ln) {
        chain = chain.then(function () {
          var line = document.createElement("div");
          line.className = "pair";
          line.style.marginTop = "4px";
          resEl.appendChild(line);
          return typeInto(line, ln, token);
        });
      });
      chain = chain.then(function () {
        whyEl.textContent = tKey("trWhyLabel") + step.reason;
        whyEl.classList.add("v2show");
      });
      chain.then(resolve);
    });
  }

  function dimPlan() {
    var plan = qs("#plan");
    if (!plan) return;
    plan.classList.add("show");
    Array.prototype.forEach.call(plan.children, function (el) { el.classList.add("v2dim"); });
  }

  function lightStepGroup(stepIdx) {
    var plan = qs("#plan");
    if (!plan || !plan.children.length) return;
    var kids = Array.prototype.slice.call(plan.children);
    var group;
    if (stepIdx === 1) group = [0];          // S2 → 客群画像（planhead）
    else if (stepIdx === 2) group = [1, 2];  // S3 → minibar ＋ 歌单
    else if (stepIdx === 3) group = [3, 4];  // S4 → 欢迎礼遇 ＋ 周边
    else if (stepIdx === 4) group = kids.map(function (_, k) { return k; }).slice(5); // S5 → 氛围/体验/文案
    else group = [];                         // S1 → 仅定位，方案保持全暗
    group.forEach(function (k) {
      var el = kids[k];
      if (el) el.classList.remove("v2dim");
    });
  }

  function revealAll() {
    Array.prototype.forEach.call(qs("#plan").children, function (el) {
      el.classList.remove("v2dim");
    });
  }

  function setBadgeLive() {
    var badge = qs("#trBadge");
    if (!badge) return;
    badge.textContent = window.I18N ? I18N.t("runtimeBadge") : "LIVE · Realtime";
    badge.classList.add("live");
  }

  function finishRun(prevLabel) {
    running = false;
    var goBtn = qs("#goBtn");
    if (goBtn) { goBtn.disabled = false; goBtn.textContent = prevLabel || defaultLabel(); }
    var views = qs("#views");
    if (views) views.style.display = "flex";
    if (typeof setView === "function") setView("plan");
  }

  /* ── 运行时模式：任意地址实时分析（steps 由 RuntimePlan.toSteps 生成） ── */
  async function runRuntime(ctx) {
    if (running) return;
    running = true;
    var token = ++runToken;
    var goBtn = qs("#goBtn");
    var prevLabel = goBtn ? goBtn.textContent : defaultLabel();
    if (goBtn) { goBtn.disabled = true; goBtn.textContent = runLabel(); }
    var views = qs("#views");
    if (views) views.style.display = "none";
    var stepsEl = qs("#trSteps");
    if (stepsEl) stepsEl.innerHTML = "";
    try {
      setBadgeLive();
      dimPlan();
      var steps = (ctx && ctx.steps) || [];
      for (var i = 0; i < steps.length; i++) {
        if (token !== runToken) return;
        await sleep(i === 0 ? FIRST_GAP_MS : STEP_GAP_MS);
        if (token !== runToken) return;
        await runStep(i, steps[i], token);
        if (token !== runToken) return;
        lightStepGroup(i);
      }
      finishRun(prevLabel);
    } catch (e) {
      revealAll();
      finishRun(prevLabel);
    }
  }

  function reset() {
    runToken += 1;
    running = false;
    var goBtn = qs("#goBtn");
    if (goBtn && goBtn.disabled) {
      goBtn.disabled = false;
      goBtn.textContent = defaultLabel();
    }
    var wz = qs("#workzone");
    if (wz) wz.classList.remove("show");
    var stepsEl = qs("#trSteps");
    if (stepsEl) stepsEl.innerHTML = "";
    var badge = qs("#trBadge");
    if (badge) { badge.textContent = "—"; badge.classList.remove("live"); }
    var plan = qs("#plan");
    if (plan) Array.prototype.forEach.call(plan.children, function (el) { el.classList.remove("v2dim"); });
  }

  window.AgentTrace = { runRuntime: runRuntime, reset: reset };
})();
