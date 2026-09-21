/**
 * [data-typed] 터미널 블록이 화면에 들어오면 한 줄씩 쳐 보입니다.
 * "$ "로 시작하는 줄은 글자 단위로 타이핑하고, 나머지는 출력처럼 한 줄씩 찍습니다.
 * 스크립트가 없거나 '동작 줄이기' 환경에서는 원래 텍스트가 그대로 보입니다.
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function play(el: HTMLElement, lines: string[]) {
  const cursor = document.createElement("span");
  cursor.className = "typed-cursor";
  let done = "";
  const show = (partial: string) => {
    el.textContent = done + partial;
    el.append(cursor);
  };
  for (const [index, line] of lines.entries()) {
    if (!el.isConnected) return;
    if (line.startsWith("$ ")) {
      show("$ ");
      await sleep(index === 0 ? 350 : 420);
      for (let n = 3; n <= line.length; n++) {
        show(line.slice(0, n));
        await sleep(22 + Math.random() * 38);
      }
      await sleep(320);
    } else {
      show(line);
      await sleep(line ? 150 : 70);
    }
    done += line + (index < lines.length - 1 ? "\n" : "");
  }
  show("");
}

export function mountTerminals() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      const el = entry.target as HTMLElement;
      void play(el, (el.dataset.typed ?? "").split("\n"));
    }),
    { threshold: 0.55 },
  );
  for (const el of document.querySelectorAll<HTMLElement>("[data-typed]:not([data-typed-ready])")) {
    // 다 쳐졌을 때의 높이를 미리 잡아 두어 레이아웃이 밀리지 않게 합니다.
    el.dataset.typed = el.textContent ?? "";
    el.dataset.typedReady = "";
    el.style.minHeight = `${el.offsetHeight}px`;
    el.textContent = "";
    observer.observe(el);
  }
}
