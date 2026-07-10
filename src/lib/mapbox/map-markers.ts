export function createJackpotMarkerElement(selected = false) {
  const element = document.createElement("div");
  element.className = `h-4 w-4 rounded-full border-2 border-white shadow-md ${
    selected ? "bg-amber-400 ring-4 ring-amber-200" : "bg-amber-500"
  }`;
  return element;
}

export function createRodeoMarkerElement(levelBadge: string, selected = false) {
  const element = document.createElement("div");
  element.className = "relative";

  const pin = document.createElement("div");
  pin.className = `h-5 w-5 rounded-full border-2 border-white shadow-md ${
    selected ? "bg-blue-700 ring-4 ring-blue-200" : "bg-blue-900"
  }`;
  element.appendChild(pin);

  if (levelBadge) {
    const badge = document.createElement("span");
    badge.className =
      "absolute -right-2 -top-2 min-w-[18px] rounded-full bg-white px-1 text-center text-[10px] font-bold leading-4 text-blue-900 shadow";
    badge.textContent = levelBadge;
    element.appendChild(badge);
  }

  return element;
}

export function createProRodeoMarkerElement(selected = false) {
  const element = document.createElement("div");
  element.className = `flex h-7 w-7 items-center justify-center text-lg ${
    selected ? "scale-125" : ""
  }`;
  element.textContent = "★";
  element.style.color = "#ca8a04";
  element.style.textShadow = "0 1px 3px rgba(0,0,0,0.45)";
  element.style.filter = selected ? "drop-shadow(0 0 6px #facc15)" : "";
  return element;
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
