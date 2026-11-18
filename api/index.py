"""Vercel Python Serverless Function - tự kích hoạt khi deploy (thư mục /api).
Dùng lại handler của python_engine/fmath_engine.py (chỉ dùng thư viện chuẩn)."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'python_engine'))

from fmath_engine import FastFMathHandler  # noqa: E402


class handler(FastFMathHandler):
    pass
