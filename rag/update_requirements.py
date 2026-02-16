#!/usr/bin/env python3
"""Update minimum versions in requirements.txt to match installed packages."""

import json
import re
import subprocess
from pathlib import Path


def normalize_name(name: str) -> str:
    return re.sub(r"[-_.]+", "-", name).lower()


def main():
    req_file = Path(__file__).parent / "requirements.txt"

    result = subprocess.run(
        ["uv", "pip", "list", "--format", "json"],
        capture_output=True,
        text=True,
        check=True,
    )
    installed = {normalize_name(pkg["name"]): pkg["version"] for pkg in json.loads(result.stdout)}

    lines = req_file.read_text().splitlines()
    updated_lines = []

    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            updated_lines.append(line)
            continue

        match = re.match(
            r"^([a-zA-Z0-9_-]+)(\[.*?\])?(>=)([\d.]+)(,<[\d.]+)?((?:\s+#.*)?)$",
            stripped,
        )
        if match:
            name = match.group(1)
            extras = match.group(2) or ""
            upper_bound = match.group(5) or ""
            comment = match.group(6) or ""

            pkg_name = normalize_name(name)
            if pkg_name in installed:
                new_version = installed[pkg_name]
                updated_lines.append(f"{name}{extras}>={new_version}{upper_bound}{comment}")
            else:
                updated_lines.append(line)
        else:
            updated_lines.append(line)

    req_file.write_text("\n".join(updated_lines) + "\n")


if __name__ == "__main__":
    main()
