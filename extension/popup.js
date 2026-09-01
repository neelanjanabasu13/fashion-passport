const key = "fashion-passport:connected-once";
const status = document.getElementById("status");
const disconnect = document.getElementById("disconnect");

const renderStatus = (connected, checking = false) => {
  status.classList.toggle("ready", connected);
  status.querySelector("strong").textContent = checking ? "Checking your Passport connection…" : connected ? "Passport connected once" : "Connect on the Passport site or first store";
  status.querySelector("span").textContent = checking ? "Looking for an open Passport tab" : connected ? "Ready across compatible Shopify stores" : "You will be asked only once";
  disconnect.hidden = !connected;
};

const recoverConnectionFromOpenTabs = async () => {
  const saved = await chrome.storage.local.get([key]);
  if (saved[key] === true) return true;

  renderStatus(false, true);
  const tabs = await chrome.tabs.query({ url: ["https://*/*"] });
  const checks = await Promise.allSettled(tabs.filter((tab) => tab.id).map((tab) => chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => Boolean(
      document.querySelector('meta[name="fashion-passport-app"]') &&
      localStorage.getItem("fashion-passport:connected") === "true"
    ),
  })));
  const connected = checks.some((check) => check.status === "fulfilled" && check.value?.[0]?.result === true);
  if (connected) await chrome.storage.local.set({ [key]: true });
  return connected;
};

recoverConnectionFromOpenTabs().then((connected) => renderStatus(connected)).catch(async () => {
  const saved = await chrome.storage.local.get([key]);
  renderStatus(saved[key] === true);
});

document.querySelectorAll("[data-url]").forEach((button) => button.addEventListener("click", () => chrome.tabs.create({ url: button.dataset.url })));
disconnect.addEventListener("click", async () => { await chrome.storage.local.set({ [key]: false }); window.close(); });
