# Dress Up World

A dress-up and play game, built for a young child. Plain React + TypeScript + Vite, no
runtime dependencies beyond React, and every graphic is inline SVG — there are no image or
audio assets anywhere, and sounds are synthesised with the Web Audio API.

## Who it is for

One small child, playing on a phone. This is the constraint behind most decisions in here and
it is invisible in the code, so it is worth stating:

- **Touch first.** Large targets. Several pieces of furniture carry an invisible `hitPad`
  rect purely so a finger aimed at the middle of them connects — a tap only reaches a shape
  that is actually painted.
- **No reading required** to operate anything. Where a choice has to be made, it is made with
  a picture (the cooker's appliances, the market stalls, the recipe hints).
- **Nothing punishes curiosity.** Failed recipes cost no ingredients. Plants must not die.
  Getting something wrong should be interesting, never expensive.
- **Test at 375px wide.** The top bar in particular is within a pixel or two of full.

## Versioning

**Bump the version in `package.json` on every feature, in the same commit or branch as the
feature itself.** Minor bump for a feature, patch for a fix. It is displayed in the top bar,
built in from `package.json` by Vite, and it is how we tell which build is actually live on
the deployed site — so a feature that ships without a bump makes the deployed version a lie.

## Working agreement

Lead with **intent** — what a feature should teach or do for the player — plus a concrete
example, rather than only the mechanism. Many different goals produce the same mechanism
spec, so a mechanism alone can't be worked backwards into a goal, but a goal can usually be
turned into a good mechanism. Purely mechanical asks (a bin, faster dragging) don't need it.

## Running it

Node is installed through nvm, which non-login shells don't set up:

```
export PATH="$HOME/.nvm/versions/node/$(ls ~/.nvm/versions/node | tail -1)/bin:$PATH"
npm run dev      # http://localhost:5273/dress-up-world/
npm run build    # typechecks, then bundles
```

`base` is `/dress-up-world/` in `vite.config.ts` because the site is served from a folder on
GitHub Pages. It applies in dev too, deliberately — setting it only for builds left
`npm run preview` quietly serving index.html for every asset.

There is **no `CNAME` file and there must not be one.** The custom domain belongs to the
`tobydoig.github.io` user-site repo and every project site is served under it automatically;
adding one here would claim the apex domain for this repo and take the other sites down.

## Deploying

Pushing to `main` builds and publishes to <https://tobyandzuzka.com/dress-up-world/> via
`.github/workflows/deploy.yml`. Nothing built is ever committed.
