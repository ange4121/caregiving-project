# Phone lessons (working name)

An adult child turns an iPhone screen recording into a short lesson their aging parent can **practice**, with feedback on their specific mistake, in Chinese, shared as a link.

Built for the Assembly Code Incubator, Cohort 02 (caregiving). See [`CLAUDE.md`](CLAUDE.md) for the product spec and [`docs/`](docs) for research and decisions.

## Develop

Requires Node 20+ and, for publishing lessons, ffmpeg (`brew install ffmpeg`).

```bash
npm install
npm run dev      # http://localhost:3000
npm run test     # unit tests
npm run lint
```

## License

[AGPL-3.0](LICENSE)
