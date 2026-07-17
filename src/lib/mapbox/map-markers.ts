const PIN_BORDER = "2px solid #ffffff";
const PIN_SHADOW = "0 1px 3px rgba(0,0,0,0.35)";

function applyPinBaseStyles(element: HTMLElement, color: string, diameterPx: number) {
  element.style.width = `${diameterPx}px`;
  element.style.height = `${diameterPx}px`;
  element.style.borderRadius = "9999px";
  element.style.border = PIN_BORDER;
  element.style.boxShadow = PIN_SHADOW;
  element.style.backgroundColor = color;
  element.style.transition = "transform 150ms ease, box-shadow 150ms ease";
}

function applySelectedStyles(element: HTMLElement, color: string, selected: boolean) {
  if (selected) {
    element.style.transform = "scale(1.25)";
    element.style.boxShadow = `0 0 0 4px ${color}55, ${PIN_SHADOW}`;
    return;
  }

  element.style.transform = "";
  element.style.boxShadow = PIN_SHADOW;
}

export function createJackpotMarkerElement(color: string, selected = false) {
  const element = document.createElement("div");
  applyPinBaseStyles(element, color, 16);
  applySelectedStyles(element, color, selected);
  return element;
}

export function createRodeoMarkerElement(color: string, levelBadge: string, selected = false) {
  const element = document.createElement("div");
  element.className = "relative";
  element.style.width = "20px";
  element.style.height = "20px";

  const pin = document.createElement("div");
  applyPinBaseStyles(pin, color, 20);
  applySelectedStyles(pin, color, selected);
  element.appendChild(pin);

  if (levelBadge) {
    const badge = document.createElement("span");
    badge.className =
      "absolute -right-2 -top-2 min-w-[18px] rounded-full bg-white px-1 text-center text-[10px] font-bold leading-4 shadow";
    badge.style.color = color;
    badge.textContent = levelBadge;
    element.appendChild(badge);
  }

  return element;
}

export function createProRodeoMarkerElement(color: string, selected = false) {
  return createRodeoMarkerElement(color, "Pro", selected);
}

export function createStateClusterElement(
  stateCode: string,
  stateName: string,
  count: number,
  selected = false,
) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = `rounded-full px-4 py-2 text-center text-xs font-bold text-white shadow-lg transition-transform ${
    selected ? "scale-110 bg-amber-600 ring-4 ring-amber-200" : "bg-amber-800 hover:bg-amber-700"
  }`;
  element.innerHTML = `${stateName}<br /><span class="text-[11px] font-semibold">${count} event${
    count === 1 ? "" : "s"
  }</span>`;
  element.setAttribute("aria-label", `${stateName}, ${count} events`);
  return element;
}
