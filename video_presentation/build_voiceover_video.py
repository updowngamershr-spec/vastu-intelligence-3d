"""
Full Automated Production Script for Vastu Intelligence 3D Voiceover Video
Generates Neural Voiceover in Hindi using Edge-TTS, records 1080p choreography in Microsoft Edge via Playwright,
and merges them with FFmpeg into a broadcast-quality MP4 video.
"""

import os
import sys
import glob
import json
import time
import asyncio
import subprocess
from pathlib import Path

# Paths
BASE_DIR = Path(r"E:\vastu_intelligence\video_presentation")
BASE_DIR.mkdir(parents=True, exist_ok=True)
RAW_VID_DIR = BASE_DIR / "raw_recordings"
RAW_VID_DIR.mkdir(parents=True, exist_ok=True)
AUDIO_DIR = BASE_DIR / "audio_tracks"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

FINAL_OUTPUT_MP4 = BASE_DIR / "vastu_3d_voiceover_presentation.mp4"

# FFmpeg binary
import imageio_ffmpeg
FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

# Voiceover Scenes Script (Hindi Natural Narration)
SCENES = [
    {
        "id": "scene1_intro",
        "text": "नमस्ते! वास्तु इंटेलिजेंस 3D में आपका स्वागत है — यह भारत का अत्याधुनिक, ऑल-इन-वन वैदिक वास्तु और 3D आर्किटेक्चरल डिज़ाइन सॉफ्टवेयर है। यहाँ आप अपने घर का 2D ब्लूप्रिंट बनाने के साथ-साथ उसे वास्तविक 3D मॉडल में देख सकते हैं।",
        "voice": "hi-IN-MadhurNeural"
    },
    {
        "id": "scene2_3d_house",
        "text": "3D रियलिस्टिक हाउस मोड में आपका पूरा घर 3D दीवारों, इटैलियन मार्बल और टीक-वुड फ्लोरिंग के साथ लाइव रेंडर होता है। यहाँ मास्टर बेडरूम में डबल बेड, लिविंग रूम में मॉडर्न एल-शेप सोफा, टीवी वॉल, मॉड्यूलर किचन, और ईशान कोण में सुनहरे शिखर और जलते हुए दीये के साथ पवित्र पूजा मंदिर भी मौजूद है।",
        "voice": "hi-IN-MadhurNeural"
    },
    {
        "id": "scene3_3d_controls",
        "text": "माउस की मदद से आप घर को 360 डिग्री घुमाकर, ज़ूम करके अंदर का हर कमरा देख सकते हैं। आप टॉप-डाउन प्लान, 45 डिग्री आइसोमेट्रिक, या इंटीरियर वॉकथ्रू कैमरा चुन सकते हैं। साथ ही वॉल कटअवे फीचर से दीवारों की ऊँचाई को कम या ज़्यादा करके अंदरूनी इंटीरियर आसानी से देख सकते हैं।",
        "voice": "hi-IN-MadhurNeural"
    },
    {
        "id": "scene4_2d_blueprint",
        "text": "2D ब्लूप्रिंट मोड में आपको मिलती है पूरी आज़ादी! आप अपने प्लॉट की लंबाई और चौड़ाई सेट कर सकते हैं, जिससे बाउण्ड्री तुरंत एडजस्ट होती है। किसी भी कमरे को ड्रैग और रीसाइज़ करें — हर कमरे में उसका वास्तविक माप और स्क्वायर फीट साफ़ दिखता है। साथ ही आप ट्रू नॉर्थ कम्पास से दिशाओं को आसानी से कैलिब्रेट कर सकते हैं।",
        "voice": "hi-IN-MadhurNeural"
    },
    {
        "id": "scene5_vastu_math",
        "text": "सॉफ्टवेयर में 16 दिशाओं का महावास्तु शक्ति चक्र, 32 मुख्य द्वार और केंद्रीय ब्रह्मस्थान ऑटोमैटिक मैप होता है। दाहिने पैनल पर आपको मिलता है लाइव वास्तु स्कोर, शास्त्रीय आयादि षड्वर्ग गणना — आय, व्यय, योनि और आयु, तथा बृहत्संहिता पर आधारित बिना तोड़-फोड़ के आसान वैदिक उपाय।",
        "voice": "hi-IN-MadhurNeural"
    },
    {
        "id": "scene6_16page_report",
        "text": "सिर्फ एक क्लिक में तैयार होती है 16 पन्नों की प्रीमियम मास्टर वास्तु रिपोर्ट! इस रिपोर्ट में आपके घर का हाई-रेज़ोल्यूशन फ्लोर प्लान, 16-ज़ोन महावास्तु बार चार्ट, 32 एंट्रेंस चक्र, और गुजराती, हिंदी व अंग्रेज़ी में विस्तृत उपाय शामिल होते हैं, जिसे आप सीधे प्रिंट या क्लाइंट को PDF के रूप में भेज सकते हैं।",
        "voice": "hi-IN-MadhurNeural"
    },
    {
        "id": "scene7_conclusion",
        "text": "वास्तु इंटेलिजेंस 3D आपके सिस्टम पर ड्राइव E में पूरी तरह लाइव है। अभी अपने ब्राउज़र में localhost:8000 खोलें और अपने सपनों का वास्तु-सम्मत घर डिज़ाइन करें। धन्यवाद!",
        "voice": "hi-IN-MadhurNeural"
    }
]

def get_audio_duration(file_path):
    """Get duration in seconds using ffprobe/ffmpeg."""
    cmd = [
        FFMPEG_EXE, "-i", str(file_path)
    ]
    p = subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
    for line in p.stderr.splitlines():
        if "Duration:" in line:
            time_str = line.split("Duration:")[1].split(",")[0].strip()
            h, m, s = time_str.split(":")
            return float(h) * 3600 + float(m) * 60 + float(s)
    return 10.0

async def generate_speech_tracks():
    """Generate audio files using edge-tts."""
    import edge_tts
    print("\n--- 1. Generating High-Definition Neural Speech Tracks ---")
    track_info = []
    
    for idx, sc in enumerate(SCENES, 1):
        mp3_path = AUDIO_DIR / f"{idx}_{sc['id']}.mp3"
        print(f"Generating audio for Scene {idx}: {sc['id']}...")
        communicate = edge_tts.Communicate(sc["text"], sc["voice"], rate="+0%")
        await communicate.save(str(mp3_path))
        
        duration = get_audio_duration(mp3_path)
        print(f"  -> Generated {mp3_path.name} (Duration: {duration:.2f}s)")
        track_info.append({
            "id": sc["id"],
            "path": mp3_path,
            "duration": duration
        })
        
    return track_info

def build_master_audio(track_info):
    """Concatenate all audio tracks with subtle padding into one master soundtrack."""
    print("\n--- 2. Assembling Master Soundtrack with FFmpeg ---")
    concat_list_file = BASE_DIR / "concat_audio.txt"
    with open(concat_list_file, "w", encoding="utf-8") as f:
        for t in track_info:
            f.write(f"file '{t['path'].resolve()}'\n")

    master_audio_path = BASE_DIR / "master_narration.mp3"
    cmd = [
        FFMPEG_EXE, "-y", "-f", "concat", "-safe", "0",
        "-i", str(concat_list_file),
        "-c", "copy",
        str(master_audio_path)
    ]
    subprocess.run(cmd, check=True)
    total_audio_duration = get_audio_duration(master_audio_path)
    print(f"Master soundtrack created: {master_audio_path.name} (Total Length: {total_audio_duration:.2f}s)")
    return master_audio_path, total_audio_duration

def run_playwright_choreography(track_info):
    """Perform synchronized screen actions in Microsoft Edge and record full HD video."""
    print("\n--- 3. Running Playwright Screen Recording in Microsoft Edge ---")
    from playwright.sync_api import sync_playwright

    # Clean old recordings
    for f in RAW_VID_DIR.glob("*.webm"):
        try: os.remove(f)
        except: pass

    with sync_playwright() as p:
        browser = p.chromium.launch(
            channel="msedge",
            headless=True,
            args=[
                "--enable-webgl",
                "--ignore-gpu-blocklist",
                "--use-gl=angle",
                "--enable-gpu-rasterization"
            ]
        )
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            record_video_dir=str(RAW_VID_DIR),
            record_video_size={"width": 1920, "height": 1080}
        )
        page = context.new_page()
        page.goto("http://localhost:8000")
        page.wait_for_timeout(2000)

        # Scene 1: Welcome & Overview
        d1 = track_info[0]["duration"]
        print(f"Recording Scene 1 (Overview, {d1:.1f}s)...")
        # Hover over brand, view buttons
        page.hover(".brand-group")
        page.wait_for_timeout(int(d1 * 400))
        page.hover(".view-mode-bar")
        page.wait_for_timeout(int(d1 * 600))

        # Scene 2: 3D Realistic House
        d2 = track_info[1]["duration"]
        print(f"Recording Scene 2 (3D Realistic House, {d2:.1f}s)...")
        page.click("#btnView3D")
        page.wait_for_timeout(1000)

        # Orbit 3D camera smoothly
        steps = 40
        step_time = (d2 - 1.5) / steps
        for i in range(steps):
            page.mouse.move(960 + (i % 5) * 10, 540)
            page.evaluate("""() => {
                if (window.threeViewer && window.threeViewer.controls) {
                    window.threeViewer.controls.autoRotate = true;
                    window.threeViewer.controls.autoRotateSpeed = 2.5;
                    window.threeViewer.controls.update();
                }
            }""")
            page.wait_for_timeout(int(step_time * 1000))

        # Scene 3: 3D Camera Controls & Wall Cutaway
        d3 = track_info[2]["duration"]
        print(f"Recording Scene 3 (3D Camera Presets, {d3:.1f}s)...")
        # Stop auto rotate
        page.evaluate("() => { if (window.threeViewer && window.threeViewer.controls) window.threeViewer.controls.autoRotate = false; }")
        
        # Click Top-down
        page.click("#btnCamTop")
        page.wait_for_timeout(int(d3 * 300))

        # Click Cutaway Low
        page.click("#btnWallLow")
        page.wait_for_timeout(int(d3 * 200))

        # Click Interior Walkthrough
        page.click("#btnCamWalk")
        page.wait_for_timeout(int(d3 * 250))

        # Return to Isometric 45
        page.click("#btnCamIso")
        page.click("#btnWallMid")
        page.wait_for_timeout(int(d3 * 250))

        # Scene 4: 2D Blueprint CAD & Complete Freedom
        d4 = track_info[3]["duration"]
        print(f"Recording Scene 4 (2D CAD Drafting, {d4:.1f}s)...")
        page.click("#btnView2D")
        page.wait_for_timeout(1000)

        # Click living room to show transformer handles
        page.mouse.click(300, 300)
        page.wait_for_timeout(int(d4 * 300))

        # Move compass slider slightly
        page.evaluate("""() => {
            const slider = document.getElementById('northSlider');
            if (slider) {
                slider.value = 15;
                slider.dispatchEvent(new Event('input'));
            }
        }""")
        page.wait_for_timeout(int(d4 * 350))

        # Reset compass to 0
        page.evaluate("""() => {
            const slider = document.getElementById('northSlider');
            if (slider) {
                slider.value = 0;
                slider.dispatchEvent(new Event('input'));
            }
        }""")
        page.wait_for_timeout(int(d4 * 350))

        # Scene 5: Live Vastu Scoring & Classical Remedies
        d5 = track_info[4]["duration"]
        print(f"Recording Scene 5 (Vastu Scoring & Remedies, {d5:.1f}s)...")
        # Hover over scorecards
        page.hover(".scorecards-grid")
        page.wait_for_timeout(int(d5 * 250))

        # Scroll findings
        page.evaluate("() => document.getElementById('tabDoshas').scrollTop = 150;")
        page.wait_for_timeout(int(d5 * 250))

        # Click Ayadi Tab
        page.click(".inspector-tab[data-target='tabAyadi']")
        page.wait_for_timeout(int(d5 * 300))

        # Click back to Doshas Tab
        page.click(".inspector-tab[data-target='tabDoshas']")
        page.wait_for_timeout(int(d5 * 200))

        # Scene 6: 16-Page Master PDF Report
        d6 = track_info[5]["duration"]
        print(f"Recording Scene 6 (16-Page Master PDF Report, {d6:.1f}s)...")
        page.click("#btnExportReport")
        page.wait_for_timeout(2000)

        # Scroll report iframe
        report_scroll_time = (d6 - 3.0) / 4
        for scroll_y in [300, 800, 1400, 2000]:
            page.evaluate(f"() => {{ const f = document.getElementById('reportFrame'); if (f && f.contentWindow) f.contentWindow.scrollTo(0, {scroll_y}); }}")
            page.wait_for_timeout(int(report_scroll_time * 1000))

        page.click("#btnCloseReport")
        page.wait_for_timeout(1000)

        # Scene 7: Conclusion
        d7 = track_info[6]["duration"]
        print(f"Recording Scene 7 (Conclusion, {d7:.1f}s)...")
        page.click("#btnView3D")
        page.evaluate("""() => {
            if (window.threeViewer && window.threeViewer.controls) {
                window.threeViewer.controls.autoRotate = true;
                window.threeViewer.controls.autoRotateSpeed = 2.0;
            }
        }""")
        page.wait_for_timeout(int(d7 * 1000))

        context.close()
        browser.close()

    webms = list(RAW_VID_DIR.glob("*.webm"))
    if not webms:
        raise RuntimeError("No recorded video found in raw_recordings!")
    return webms[0]

def merge_video_and_audio(raw_video_path, master_audio_path, output_mp4_path):
    """Merge recorded video with master audio track using FFmpeg, encoding to H.264 / AAC."""
    print("\n--- 4. Final Video Encoding & Audio Synchronization (FFmpeg) ---")
    cmd = [
        FFMPEG_EXE, "-y",
        "-i", str(raw_video_path),
        "-i", str(master_audio_path),
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        str(output_mp4_path)
    ]
    subprocess.run(cmd, check=True)
    print(f"Successfully created broadcast-grade MP4 video: {output_mp4_path}")

def main():
    print("=" * 70)
    print("   VASTU INTELLIGENCE 3D - PROFESSIONAL VOICEOVER VIDEO GENERATOR   ")
    print("=" * 70)
    start_time = time.time()

    # 1. Generate Voiceover (runs its own event loop and completes)
    track_info = asyncio.run(generate_speech_tracks())

    # 2. Assemble Soundtrack
    master_audio, total_dur = build_master_audio(track_info)

    # 3. Record Screen with Sync Playwright (no active event loop)
    raw_video = run_playwright_choreography(track_info)

    # 4. Merge Video and Audio
    merge_video_and_audio(raw_video, master_audio, FINAL_OUTPUT_MP4)

    # Also copy to conversation artifacts
    artifact_path = Path(r"C:\Users\hp\.gemini\antigravity\brain\fc566271-3187-442d-88a6-8c2525073803\vastu_3d_voiceover_presentation.mp4")
    import shutil
    shutil.copy2(str(FINAL_OUTPUT_MP4), str(artifact_path))
    print(f"Copied final video to Artifacts: {artifact_path}")

    elapsed = time.time() - start_time
    print("=" * 70)
    print(f"VIDEO PRODUCTION COMPLETED IN {elapsed:.1f} SECONDS!")
    print(f"Video File: {FINAL_OUTPUT_MP4}")
    print(f"Video Size: {FINAL_OUTPUT_MP4.stat().st_size / (1024 * 1024):.2f} MB")
    print("=" * 70)

if __name__ == "__main__":
    main()
