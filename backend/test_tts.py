import asyncio
import edge_tts

async def main():
    try:
        print("Testing en-US-JennyNeural...")
        comm = edge_tts.Communicate("Hello world", "en-US-JennyNeural")
        count = 0
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                count += len(chunk["data"])
        print(f"Success Jenny! Received {count} bytes.")
    except Exception as e:
        print(f"Error Jenny: {repr(e)}")

    try:
        print("Testing en-IN-NeerjaNeural...")
        comm = edge_tts.Communicate("Hello world", "en-IN-NeerjaNeural")
        count = 0
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                count += len(chunk["data"])
        print(f"Success Neerja! Received {count} bytes.")
    except Exception as e:
        print(f"Error Neerja: {repr(e)}")

asyncio.run(main())
