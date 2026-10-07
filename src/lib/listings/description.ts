// The description arrives as HTML from the editor in the listing form and is later put on the
// product page as it is, so it is rebuilt here from scratch: only the few tags the editor can
// produce are written back, each with attributes generated from checked values. Whatever else the
// request contained (scripts, links, event handlers, styles) is left out.

const FONT_SIZES = ["12", "14", "16", "18", "20", "24", "28"];
const BULLET_KINDS = ["disc", "check", "dash"];

const attribute = (tag: string, name: string) =>
  new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, "i").exec(tag)?.[1] ?? "";

// The opening tag to write for each allowed element.
const openers: Record<string, (tag: string) => string> = {
  p: (tag) => {
    const indent = attribute(tag, "data-indent");
    return /^[1-4]$/.test(indent) ? `<p data-indent="${indent}">` : "<p>";
  },
  ul: (tag) => {
    const kind = attribute(tag, "data-kind");
    return `<ul data-kind="${BULLET_KINDS.includes(kind) ? kind : "disc"}">`;
  },
  ol: (tag) => {
    const start = attribute(tag, "start");
    return /^\d{1,4}$/.test(start) ? `<ol start="${start}">` : "<ol>";
  },
  span: (tag) => {
    const size = /font-size:\s*(\d+)px/i.exec(attribute(tag, "style"))?.[1] ?? "";
    return FONT_SIZES.includes(size) ? `<span style="font-size: ${size}px">` : "<span>";
  },
  li: () => "<li>",
  strong: () => "<strong>",
  em: () => "<em>",
  u: () => "<u>",
};

const escapeText = (text: string) =>
  text
    // Entities the editor wrote stay as they are; a bare "&" becomes one.
    .replace(/&(?!(?:[a-z]+|#\d+|#x[\da-f]+);)/gi, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export function sanitizeDescription(html: string) {
  let output = "";
  const open: string[] = [];
  let position = 0;

  for (const match of html.matchAll(/<(\/?)([a-z][a-z0-9]*)\b[^>]*>/gi)) {
    output += escapeText(html.slice(position, match.index));
    position = match.index + match[0].length;

    const name = match[2].toLowerCase();
    if (name === "br") {
      output += "<br>";
    } else if (!Object.hasOwn(openers, name)) {
      // Not an element the editor makes: the tag is dropped, its text stays.
    } else if (!match[1]) {
      output += openers[name](match[0]);
      open.push(name);
    } else if (open.includes(name)) {
      // Closes everything opened inside it as well, so the result is always well nested.
      let closed: string | undefined;
      while (closed !== name && (closed = open.pop())) output += `</${closed}>`;
    }
  }
  output += escapeText(html.slice(position));
  while (open.length > 0) output += `</${open.pop()}>`;

  return output;
}

// The description without its formatting, for checks such as the minimum length.
export const descriptionText = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z#\d]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
