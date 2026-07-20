import argparse
import asyncio
import ssl
from pathlib import Path

import edge_tts
import edge_tts.communicate


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--text", required=True)
    parser.add_argument("--media", required=True)
    parser.add_argument("--srt", required=True)
    parser.add_argument("--voice", default="en-US-JennyNeural")
    parser.add_argument("--rate", default="+7%")
    parser.add_argument("--pitch", default="+0Hz")
    args = parser.parse_args()

    # The workstation's Python cert store can reject the Edge TTS websocket even
    # though certifi is installed. This is a one-shot media generation script.
    edge_tts.communicate._SSL_CTX = ssl._create_unverified_context()

    text = Path(args.text).read_text(encoding="utf-8")
    communicate = edge_tts.Communicate(text, voice=args.voice, rate=args.rate, pitch=args.pitch)
    submaker = edge_tts.SubMaker()

    media_path = Path(args.media)
    srt_path = Path(args.srt)
    media_path.parent.mkdir(parents=True, exist_ok=True)
    srt_path.parent.mkdir(parents=True, exist_ok=True)

    with media_path.open("wb") as audio_file:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_file.write(chunk["data"])
            elif chunk["type"] in ("WordBoundary", "SentenceBoundary"):
                submaker.feed(chunk)

    srt_path.write_text(submaker.get_srt(), encoding="utf-8")


if __name__ == "__main__":
    asyncio.run(main())
