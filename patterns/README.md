# Local pattern storage

This folder can be used to keep pattern JSON exports or uploaded assets under version control. Runtime backups are written to `backup.json` so memory-mode sessions survive restarts, and CockroachDB reads/writes also mirror into this file for safekeeping.
