const escapeHtml = (value = "") => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const inline = (value: string) => escapeHtml(value)
  .replace(/`([^`]+)`/g, "<code>$1</code>")
  .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  .replace(/\*([^*]+)\*/g, "<em>$1</em>")
  .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
const slug = (value: string, index: number) => `${value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section"}-${index}`;

export const markdownToHtml = (text: string) => {
  const output: string[] = [];
  let list = "";
  let code = false;
  let codeLines: string[] = [];
  let headingIndex = 0;
  const closeList = () => { if (list) output.push(`</${list}>`); list = ""; };
  for (const raw of text.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trimEnd();
    if (line.trim().startsWith("```")) {
      closeList();
      if (code) { output.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`); codeLines = []; }
      code = !code;
      continue;
    }
    if (code) { codeLines.push(raw); continue; }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    const unordered = line.match(/^\s*[-*]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (heading) {
      closeList(); headingIndex += 1; const level = heading[1].length;
      output.push(`<h${level} id="${slug(heading[2], headingIndex)}">${inline(heading[2])}</h${level}>`);
    } else if (unordered || ordered) {
      const type = unordered ? "ul" : "ol";
      if (list !== type) { closeList(); list = type; output.push(`<${type}>`); }
      output.push(`<li>${inline((unordered || ordered)![1])}</li>`);
    } else if (/^\s*>\s?/.test(line)) {
      closeList(); output.push(`<blockquote>${inline(line.replace(/^\s*>\s?/, ""))}</blockquote>`);
    } else if (/^\s*([-*_])\1\1+\s*$/.test(line)) {
      closeList(); output.push("<hr>");
    } else if (line.trim()) {
      closeList(); output.push(`<p>${inline(line.trim())}</p>`);
    } else closeList();
  }
  closeList();
  if (codeLines.length) output.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
  return output.join("\n");
};
