"""
FMATH12 All-in-One Launcher & Performance Optimizer
Khởi động đồng thời:
1. Python High-Performance Engine (Port 8000)
2. Vite Frontend Web Studio (Port 5173)
"""
import subprocess
import sys
import time
import os

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

def main():
    print("=" * 60)
    print("   🚀 KHỞI ĐỘNG HỆ THỐNG FMATH12 PRO (GDPT 2018)")
    print("   - Tối ưu hóa hiệu năng, chạy đa tiến trình giảm tải CPU/RAM")
    print("=" * 60)

    # 1. Start Python Engine in background process
    print("\n[1/2] Đang khởi động Python Engine (Port 8000)...")
    engine_process = subprocess.Popen(
        [sys.executable, "python_engine/fmath_engine.py"],
        cwd=os.path.dirname(os.path.abspath(__file__))
    )
    time.sleep(1)

    # 2. Start Vite dev server
    print("\n[2/2] Đang khởi động Vite Studio Frontend (Port 5173)...")
    try:
        subprocess.run(["npm", "run", "dev"], shell=True)
    except KeyboardInterrupt:
        print("\nĐang tắt hệ thống...")
    finally:
        engine_process.terminate()
        print("Đã giải phóng tài nguyên FMATH12 thành công.")

if __name__ == "__main__":
    main()
