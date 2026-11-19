"""
One-Click Launcher for Vastu Intelligence Pro (Drive E: Edition)
Starts FastAPI Backend on http://localhost:8000.
"""

import uvicorn
import sys
import os

if __name__ == "__main__":
    cur_dir = os.path.dirname(os.path.abspath(__file__))
    if cur_dir not in sys.path:
        sys.path.insert(0, cur_dir)

    print("=" * 75)
    print("   VASTU INTELLIGENCE PRO - CUSTOM HOUSE & AYADI SUITE (DRIVE E:)")
    print("=" * 75)
    print("Serving from: E:\\vastu_intelligence")
    print("Local Web Access: http://localhost:8000")
    print("Press CTRL+C to terminate.")
    print("=" * 75)

    uvicorn.run("backend.app:app", host="127.0.0.1", port=8000, reload=False)
