export type TheoryBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "subheading"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "qa"; question: string; answer: string };

function isListLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^[•\-–—]\s/.test(trimmed)) return true;
  return /^\t/.test(line) && /[•\-–—]/.test(line);
}

function cleanListItem(line: string): string {
  return line.trim().replace(/^[\t•\-–—]+\s*/, "");
}

function isSubheadingLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || isListLine(line)) return false;
  if (trimmed.startsWith("Вопрос из документа") || trimmed.startsWith("Ответ:")) {
    return false;
  }
  if (trimmed.endsWith(":")) return trimmed.length <= 120;
  if (/[.!?]$/.test(trimmed)) return false;
  return trimmed.length <= 90 && trimmed.split(/\s+/).length <= 14;
}

export function parseTheoryContent(content: string): TheoryBlock[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: TheoryBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    while (index < lines.length && !lines[index].trim()) index += 1;
    if (index >= lines.length) break;

    const line = lines[index];
    const trimmed = line.trim();

    if (trimmed.startsWith("Вопрос из документа")) {
      let question = trimmed;
      index += 1;
      while (index < lines.length && lines[index].trim() && !lines[index].trim().startsWith("Ответ:")) {
        question += ` ${lines[index].trim()}`;
        index += 1;
      }

      let answer = "";
      if (index < lines.length && lines[index].trim().startsWith("Ответ:")) {
        answer = lines[index].trim().replace(/^Ответ:\s*/i, "");
        index += 1;
      }

      blocks.push({ kind: "qa", question, answer });
      continue;
    }

    if (isListLine(line)) {
      const items: string[] = [];
      while (index < lines.length && lines[index].trim() && isListLine(lines[index])) {
        items.push(cleanListItem(lines[index]));
        index += 1;
      }
      blocks.push({ kind: "list", items });
      continue;
    }

    if (isSubheadingLine(line)) {
      blocks.push({ kind: "subheading", text: trimmed });
      index += 1;
      continue;
    }

    blocks.push({ kind: "paragraph", text: trimmed });
    index += 1;
  }

  return blocks;
}

export function TheoryContent({ content }: { content: string }) {
  const blocks = parseTheoryContent(content);

  return (
    <div className="theory-course-content">
      {blocks.map((block, index) => {
        if (block.kind === "subheading") {
          return (
            <h4 key={index} className="theory-course-subheading">
              {block.text}
            </h4>
          );
        }

        if (block.kind === "list") {
          return (
            <ul key={index} className="theory-course-list">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          );
        }

        if (block.kind === "qa") {
          return (
            <div key={index} className="theory-course-qa">
              <p className="theory-course-qa-question">{block.question}</p>
              {block.answer ? (
                <p className="theory-course-qa-answer">
                  <span>Ответ:</span> {block.answer}
                </p>
              ) : null}
            </div>
          );
        }

        return (
          <p key={index} className="theory-course-paragraph">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
