import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = join(here, "..", "public");
const source = await readFile(join(publicDir, "voiceover.srt"), "utf8");

const toMs = (time) => {
  const match = time.trim().match(/^(\d+):(\d+):(\d+)[,.](\d+)$/);
  if (!match) {
    throw new Error(`Invalid SRT timestamp: ${time}`);
  }
  const [, hours, minutes, seconds, millis] = match;
  return (
    Number(hours) * 3600000 +
    Number(minutes) * 60000 +
    Number(seconds) * 1000 +
    Number(millis.padEnd(3, "0").slice(0, 3))
  );
};

const clean = (text) =>
  text
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const splitCue = ({ text, startMs, endMs }) => {
  const words = clean(text).split(/\s+/).filter(Boolean);
  if (words.length <= 8) {
    return [{ text: words.join(" "), startMs, endMs, timestampMs: startMs, confidence: null }];
  }
  const chunks = [];
  for (let i = 0; i < words.length; i += 7) {
    chunks.push(words.slice(i, i + 7));
  }
  const duration = Math.max(1, endMs - startMs);
  return chunks.map((chunk, index) => {
    const chunkStart = startMs + Math.round((duration * index) / chunks.length);
    const chunkEnd = startMs + Math.round((duration * (index + 1)) / chunks.length);
    return {
      text: chunk.join(" "),
      startMs: chunkStart,
      endMs: Math.max(chunkStart + 250, chunkEnd),
      timestampMs: chunkStart,
      confidence: null,
    };
  });
};

const captions = source
  .replace(/\r/g, "")
  .split(/\n\n+/)
  .flatMap((block) => {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const timeLineIndex = lines.findIndex((line) => line.includes("-->"));
    if (timeLineIndex === -1) {
      return [];
    }
    const [start, end] = lines[timeLineIndex].split("-->").map((value) => value.trim().split(" ")[0]);
    const text = lines.slice(timeLineIndex + 1).join(" ");
    if (!text.trim()) {
      return [];
    }
    return splitCue({ text, startMs: toMs(start), endMs: toMs(end) });
  })
  .filter((caption) => caption.endMs > caption.startMs)
  .sort((a, b) => a.startMs - b.startMs);

await writeFile(join(publicDir, "captions.json"), `${JSON.stringify(captions, null, 2)}\n`);
console.log(`Wrote ${captions.length} captions`);
