# GitHub Repository Scanner

A simple CLI that scans GitHub repository main pages using the GitHub REST API (repo metadata + README) and prints JSON or CSV.

## Features
- Fetch repository metadata (stars, forks, topics, license, default branch, description)
- Fetch README (HTML or raw Markdown)
- Optional GitHub token via `GITHUB_TOKEN` env var to increase rate limits
- Input: `owner/repo` pairs via CLI args or a file
- Output: JSON (pretty or ndjson) or CSV

## Usage

```bash
python3 github_scan.py --repos torvalds/linux microsoft/vscode --format json --pretty
```

Read from a file with one `owner/repo` per line:

```bash
python3 github_scan.py --file repos.txt --format csv > output.csv
```

Provide a token:

```bash
export GITHUB_TOKEN=ghp_... # or use a fine-grained PAT
python3 github_scan.py --repos numpy/numpy --format json --pretty
```

## Install

- No extra dependencies; uses Python standard library. Requires Python 3.8+.

## Notes
- Rate limiting without a token is low. Use a token for larger scans.
- README content can be large; consider using `--readme html` (default) vs `--readme raw` depending on needs.