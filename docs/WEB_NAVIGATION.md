# Documentation navigation — InnovaLogic v1

Authorized scope: common documentation appearance and reading tools. The reader adds a theme switch, mobile document selection, chapter outline, previous/next navigation and literal code copying. Desktop and mobile search reads only catalogued documents through the existing document API. Stale document responses are ignored.

Implementation: `src/App.tsx` and scoped `src/docs-theme.css`. Control-plane behavior, approvals, credential boundaries and provider policies are unchanged. Existing uncommitted development must remain separately reviewable. Build and desktop/mobile browser checks pass using a synthetic API. Contrast and accessible navigation labels were corrected. No publication or deployment is claimed.
