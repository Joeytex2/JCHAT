#!/usr/bin/env python3

import argparse
import datetime as dt
import json
import os
import re
import sys
from typing import Any, Dict, Iterable, List, Optional, Tuple


Message = Dict[str, Any]


def parse_iso8601(value: str) -> Optional[dt.datetime]:
	try:
		return dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
	except Exception:
		return None


def parse_timestamp(value: Any) -> Optional[dt.datetime]:
	if value is None:
		return None
	if isinstance(value, (int, float)):
		# seconds or milliseconds
		try:
			if value > 2_000_000_000:  # likely milliseconds
				return dt.datetime.utcfromtimestamp(value / 1000.0)
			return dt.datetime.utcfromtimestamp(value)
		except Exception:
			return None
	if isinstance(value, str):
		# try ISO8601
		ts = parse_iso8601(value)
		if ts:
			return ts
		# try common formats
		for fmt in [
			"%Y-%m-%d %H:%M:%S",
			"%Y-%m-%d %H:%M",
			"%Y/%m/%d %H:%M:%S",
			"%Y/%m/%d %H:%M",
			"%m/%d/%Y %H:%M:%S",
			"%m/%d/%Y %H:%M",
		]:
			try:
				return dt.datetime.strptime(value, fmt)
			except Exception:
				pass
	return None


def extract_text_from_parts(parts: Any) -> Optional[str]:
	# Cursor and similar exports sometimes store content parts
	if isinstance(parts, list):
		texts: List[str] = []
		for p in parts:
			if isinstance(p, dict):
				if isinstance(p.get("text"), str):
					texts.append(p.get("text"))
				elif isinstance(p.get("value"), str):
					texts.append(p.get("value"))
				elif isinstance(p.get("content"), str):
					texts.append(p.get("content"))
			elif isinstance(p, str):
				texts.append(p)
		return "\n".join([t for t in texts if t]) or None
	return None


def extract_message_fields(msg: Message) -> Tuple[str, str, Optional[dt.datetime]]:
	# role/author/sender
	role = (
		msg.get("role")
		or msg.get("author")
		or msg.get("sender")
		or msg.get("from")
		or msg.get("type")
	)
	if isinstance(role, dict):
		role = role.get("name") or role.get("id")
	if not isinstance(role, str):
		role = "unknown"

	# content/text/body/message/value
	content: Optional[str] = None
	if isinstance(msg.get("content"), str):
		content = msg["content"]
	elif isinstance(msg.get("content"), list):
		content = extract_text_from_parts(msg.get("content"))
	elif isinstance(msg.get("text"), str):
		content = msg["text"]
	elif isinstance(msg.get("message"), str):
		content = msg["message"]
	elif isinstance(msg.get("body"), str):
		content = msg["body"]
	elif isinstance(msg.get("value"), str):
		content = msg["value"]
	elif isinstance(msg.get("delta"), dict):
		# streaming delta
		delta = msg["delta"]
		content = delta.get("content") or delta.get("text") or delta.get("value")
	elif isinstance(msg.get("payload"), dict):
		payload = msg["payload"]
		for key in ("content", "text", "message", "body", "value"):
			if isinstance(payload.get(key), str):
				content = payload.get(key)
				break

	if content is None:
		content = json.dumps({k: v for k, v in msg.items() if k not in ("createdAt", "timestamp", "ts")}, ensure_ascii=False)

	# time
	time_candidates = [
		msg.get("createdAt"),
		msg.get("created_at"),
		msg.get("updatedAt"),
		msg.get("timestamp"),
		msg.get("ts"),
		msg.get("time"),
		msg.get("date"),
	]
	ts: Optional[dt.datetime] = None
	for c in time_candidates:
		ts = parse_timestamp(c)
		if ts:
			break

	return str(role), str(content), ts


def is_message_like(obj: Any) -> bool:
	if not isinstance(obj, dict):
		return False
	keys = set(obj.keys())
	role_keys = {"role", "author", "sender", "from", "type"}
	text_keys = {"content", "text", "message", "body", "value", "delta"}
	return len(keys.intersection(role_keys)) > 0 and len(keys.intersection(text_keys)) > 0


def find_message_arrays(root: Any, path: str = "$") -> List[Tuple[str, List[Message]]]:
	found: List[Tuple[str, List[Message]]] = []
	if isinstance(root, list):
		if root and sum(1 for x in root if is_message_like(x)) >= max(1, len(root) // 2):
			found.append((path, [x for x in root if isinstance(x, dict)]))
		else:
			for idx, item in enumerate(root):
				found.extend(find_message_arrays(item, f"{path}[{idx}]"))
	elif isinstance(root, dict):
		for k, v in root.items():
			found.extend(find_message_arrays(v, f"{path}.{k}"))
	return found


def sort_messages(messages: List[Message]) -> List[Message]:
	def key_func(m: Message) -> Tuple[int, float]:
		_, _, ts = extract_message_fields(m)
		if ts is None:
			return (1, 0.0)
		return (0, ts.timestamp())

	return sorted(messages, key=key_func)


def sanitize_filename(name: str) -> str:
	name = re.sub(r"\s+", "_", name.strip())
	name = re.sub(r"[^A-Za-z0-9_\-\.]+", "", name)
	return name[:100] or "chat"


def write_markdown(messages: List[Message], out_path: str, title: Optional[str] = None) -> None:
	lines: List[str] = []
	if title:
		lines.append(f"# {title}")
		lines.append("")
	for m in sort_messages(messages):
		role, content, ts = extract_message_fields(m)
		ts_str = ts.isoformat() if ts else ""
		lines.append(f"## {role}{(' — ' + ts_str) if ts_str else ''}")
		lines.append("")
		lines.append(content.rstrip())
		lines.append("")
		lines.append("---")
		lines.append("")
	os.makedirs(os.path.dirname(out_path), exist_ok=True)
	with open(out_path, "w", encoding="utf-8") as f:
		f.write("\n".join(lines).rstrip() + "\n")


def main() -> None:
	parser = argparse.ArgumentParser(description="Convert a Cursor chat export (JSON) into Markdown.")
	parser.add_argument("json_path", help="Path to Cursor chat export JSON file")
	parser.add_argument("--out-dir", default="chat_restored", help="Output directory for Markdown files")
	args = parser.parse_args()

	json_path = args.json_path
	if not os.path.isfile(json_path):
		print(f"Error: file not found: {json_path}", file=sys.stderr)
		sys.exit(1)

	with open(json_path, "r", encoding="utf-8") as f:
		try:
			data = json.load(f)
		except json.JSONDecodeError as e:
			print(f"Error: invalid JSON: {e}", file=sys.stderr)
			sys.exit(1)

	arrays = find_message_arrays(data)
	if not arrays:
		print("Error: could not locate any message arrays in the JSON.\n"
		      "Tip: export the chat as JSON from Cursor, then pass that file here.", file=sys.stderr)
		sys.exit(2)

	# pick the largest candidate by length
	arrays_sorted = sorted(arrays, key=lambda t: len(t[1]), reverse=True)
	best_path, best_messages = arrays_sorted[0]

	# Select a title from known fields if present
	title: Optional[str] = None
	if isinstance(data, dict):
		for key in ("name", "title", "threadTitle", "chatTitle", "displayName"):
			if isinstance(data.get(key), str) and data.get(key).strip():
				title = data.get(key).strip()
				break
	# fallback to path
	if not title:
		title = f"Restored chat ({best_path})"

	out_dir = os.path.abspath(args.out_dir)
	os.makedirs(out_dir, exist_ok=True)
	main_md = os.path.join(out_dir, f"{sanitize_filename(title)}.md")
	write_markdown(best_messages, main_md, title=title)

	# Also dump raw JSON for reference
	with open(os.path.join(out_dir, "raw.json"), "w", encoding="utf-8") as rf:
		json.dump(data, rf, ensure_ascii=False, indent=2)

	print(f"Wrote: {main_md}")
	print(f"Also saved raw JSON: {os.path.join(out_dir, 'raw.json')}")


if __name__ == "__main__":
	main()